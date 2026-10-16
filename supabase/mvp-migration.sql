-- ChainTicket MVP migration
-- Safe to run after schema.sql. Does not drop or delete data.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  wallet_address text,
  role text not null default 'USER' check (role in ('USER','ORGANIZER','ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  ticket_type_id bigint not null references public.ticket_types(id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket_type_id bigint not null references public.ticket_types(id),
  quantity integer not null check (quantity > 0),
  expires_at timestamptz not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','EXPIRED','COMPLETED','CANCELLED')),
  created_at timestamptz not null default now()
);

create index if not exists reservations_active_expiry_idx
  on public.reservations (ticket_type_id, expires_at)
  where status = 'ACTIVE';
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists tickets_order_idx on public.tickets (order_id);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reservations enable row level security;
alter table public.check_ins enable row level security;

drop policy if exists "users can view own profile" on public.profiles;
create policy "users can view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

revoke insert, update on public.profiles from authenticated;
grant insert (id, full_name, wallet_address) on public.profiles to authenticated;
grant update (full_name, wallet_address) on public.profiles to authenticated;

drop policy if exists "users can view own orders" on public.orders;
create policy "users can view own orders" on public.orders for select using (auth.uid() = user_id);
drop policy if exists "users can create own orders" on public.orders;
revoke insert on public.orders from authenticated;

drop policy if exists "users can view own order items" on public.order_items;
create policy "users can view own order items" on public.order_items for select
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists "users can view own reservations" on public.reservations;
create policy "users can view own reservations" on public.reservations for select using (auth.uid() = user_id);
drop policy if exists "users can create own reservations" on public.reservations;
revoke insert, update on public.reservations from authenticated;
drop policy if exists "users can cancel own reservations" on public.reservations;

create or replace function public.create_reservation(p_ticket_type_id bigint, p_quantity integer)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ticket public.ticket_types;
  v_reserved integer;
  v_result public.reservations;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 6 then raise exception 'INVALID_QUANTITY'; end if;

  update public.reservations set status = 'EXPIRED'
  where status = 'ACTIVE' and expires_at <= now();

  select * into v_ticket from public.ticket_types where id = p_ticket_type_id for update;
  if not found then raise exception 'TICKET_TYPE_NOT_FOUND'; end if;

  select coalesce(sum(quantity), 0) into v_reserved
  from public.reservations
  where ticket_type_id = p_ticket_type_id and status = 'ACTIVE' and expires_at > now();

  if v_ticket.available_supply - v_reserved < p_quantity then raise exception 'SOLD_OUT'; end if;

  insert into public.reservations(user_id, ticket_type_id, quantity, expires_at)
  values (v_user, p_ticket_type_id, p_quantity, now() + interval '10 minutes')
  returning * into v_result;
  return v_result;
end;
$$;

revoke all on function public.create_reservation(bigint, integer) from public;
grant execute on function public.create_reservation(bigint, integer) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
