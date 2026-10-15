-- Additional migrations for U Ticket 3 Production MVP
-- Handles ticket creation, atomic order completion, RLS policies, check-ins and resale sync

-- 1. Policies for tickets
alter table public.tickets enable row level security;

drop policy if exists "users can view own tickets" on public.tickets;
create policy "users can view own tickets" on public.tickets for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

drop policy if exists "public can view tickets for resale lookup" on public.tickets;
create policy "public can view tickets for resale lookup" on public.tickets for select
using (true);

-- 2. Policies for check_ins
alter table public.check_ins enable row level security;

drop policy if exists "organizers or staff can view check_ins" on public.check_ins;
create policy "organizers or staff can view check_ins" on public.check_ins for select
using (auth.uid() is not null);

drop policy if exists "authenticated users can insert check_ins" on public.check_ins;
create policy "authenticated users can insert check_ins" on public.check_ins for insert
with check (auth.uid() is not null);

-- 3. Atomic Order Completion RPC: complete_ticket_purchase
-- Validates reservation, locks stock, creates order & order_item, generates tickets, and marks reservation COMPLETED
create or replace function public.complete_ticket_purchase(
  p_reservation_id uuid,
  p_wallet_address text,
  p_payment_ref text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_res public.reservations;
  v_ticket_type public.ticket_types;
  v_order_id uuid;
  v_total_cents integer;
  v_ticket_ids uuid[] := array[]::uuid[];
  v_ticket_id uuid;
  v_code text;
  v_i integer;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- 1. Fetch and validate reservation
  select * into v_res from public.reservations
  where id = p_reservation_id and user_id = v_user
  for update;

  if not found then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;

  if v_res.status != 'ACTIVE' or v_res.expires_at <= now() then
    update public.reservations set status = 'EXPIRED' where id = p_reservation_id;
    raise exception 'RESERVATION_EXPIRED';
  end if;

  -- 2. Lock ticket_type and deduct inventory
  select * into v_ticket_type from public.ticket_types
  where id = v_res.ticket_type_id
  for update;

  if not found then
    raise exception 'TICKET_TYPE_NOT_FOUND';
  end if;

  if v_ticket_type.available_supply < v_res.quantity then
    raise exception 'INSUFFICIENT_SUPPLY';
  end if;

  update public.ticket_types
  set available_supply = available_supply - v_res.quantity
  where id = v_res.ticket_type_id;

  -- 3. Calculate total
  v_total_cents := v_ticket_type.price_cents * v_res.quantity;

  -- 4. Create Order
  insert into public.orders (user_id, status, total_cents, wallet_address, transaction_hash)
  values (v_user, 'PAID', v_total_cents, p_wallet_address, p_payment_ref)
  returning id into v_order_id;

  -- 5. Create Order Item
  insert into public.order_items (order_id, ticket_type_id, quantity, unit_price_cents)
  values (v_order_id, v_res.ticket_type_id, v_res.quantity, v_ticket_type.price_cents);

  -- 6. Generate Tickets
  for v_i in 1..v_res.quantity loop
    v_code := 'UT3-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    insert into public.tickets (order_id, ticket_type_id, ticket_code, qr_payload, status)
    values (
      v_order_id,
      v_res.ticket_type_id,
      v_code,
      'ut3://ticket/' || v_code || '/' || v_order_id::text,
      'VALID'
    )
    returning id into v_ticket_id;
    v_ticket_ids := array_append(v_ticket_ids, v_ticket_id);
  end loop;

  -- 7. Mark Reservation completed
  update public.reservations
  set status = 'COMPLETED'
  where id = p_reservation_id;

  return json_build_object(
    'order_id', v_order_id,
    'total_cents', v_total_cents,
    'ticket_ids', v_ticket_ids,
    'quantity', v_res.quantity,
    'ticket_type_name', v_ticket_type.name
  );
end;
$$;

revoke all on function public.complete_ticket_purchase(uuid, text, text) from public;
grant execute on function public.complete_ticket_purchase(uuid, text, text) to authenticated;

-- 4. Link token_id to ticket
create or replace function public.link_ticket_nft(
  p_ticket_id uuid,
  p_token_id bigint,
  p_tx_hash text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  update public.tickets t
  set token_id = p_token_id
  from public.orders o
  where t.id = p_ticket_id and t.order_id = o.id and o.user_id = v_user;

  update public.orders o
  set transaction_hash = coalesce(p_tx_hash, o.transaction_hash)
  from public.tickets t
  where t.id = p_ticket_id and t.order_id = o.id and o.user_id = v_user;
end;
$$;

revoke all on function public.link_ticket_nft(uuid, bigint, text) from public;
grant execute on function public.link_ticket_nft(uuid, bigint, text) to authenticated;

-- 5. Ticket Check-in function
create or replace function public.verify_and_check_in_ticket(p_ticket_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ticket public.tickets;
  v_event public.events;
  v_type public.ticket_types;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_ticket from public.tickets
  where ticket_code = p_ticket_code
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'TICKET_NOT_FOUND');
  end if;

  if v_ticket.status = 'USED' then
    return json_build_object('success', false, 'error', 'ALREADY_USED', 'ticket_id', v_ticket.id);
  end if;

  select * into v_type from public.ticket_types where id = v_ticket.ticket_type_id;
  select * into v_event from public.events where id = v_type.event_id;

  update public.tickets set status = 'USED' where id = v_ticket.id;

  insert into public.check_ins (ticket_id, checked_in_by)
  values (v_ticket.id, v_user)
  on conflict (ticket_id) do nothing;

  return json_build_object(
    'success', true,
    'ticket_id', v_ticket.id,
    'ticket_code', v_ticket.ticket_code,
    'event_title', v_event.title,
    'ticket_type', v_type.name,
    'token_id', v_ticket.token_id
  );
end;
$$;

revoke all on function public.verify_and_check_in_ticket(text) from public;
grant execute on function public.verify_and_check_in_ticket(text) to authenticated;
