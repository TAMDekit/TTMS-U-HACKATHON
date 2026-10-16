import { createSupabaseBrowserClient } from "./supabase-browser";

export type Order = {
  id: string;
  user_id: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  total_cents: number;
  wallet_address: string | null;
  transaction_hash: string | null;
  created_at: string;
};

export type Ticket = {
  id: string;
  order_id: string;
  ticket_type_id: number;
  ticket_code: string;
  qr_payload: string;
  status: "VALID" | "USED" | "CANCELLED";
  token_id: number | null;
  created_at: string;
  demo_is_mock?: boolean;
  demo_profile?: "user-a" | "user-b";
  demo_purchase_price_cents?: number;
  demo_resale_price_cents?: number | null;
  ticket_types?: {
    id: number;
    name: string;
    price_cents: number;
    event_id: number;
    events?: {
      id: number;
      title: string;
      venue: string;
      starts_at: string;
      image_url: string | null;
    };
  };
};

const demoTicketsKey = "ut3_local_tickets";

export function getLocalDemoTickets(): Ticket[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(demoTicketsKey) || "[]") as Ticket[];
    return stored.map((ticket) => ({
      ...ticket,
      demo_is_mock: true,
      demo_profile: ticket.demo_profile || "user-a",
      demo_purchase_price_cents: ticket.demo_purchase_price_cents ?? ticket.ticket_types?.price_cents ?? 0,
      demo_resale_price_cents: ticket.demo_resale_price_cents ?? null,
    }));
  } catch {
    return [];
  }
}

export function saveLocalDemoTickets(tickets: Ticket[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(demoTicketsKey, JSON.stringify(tickets));
}

export async function completePurchase(
  reservationId: string,
  walletAddress: string,
  paymentRef?: string
): Promise<{
  order_id: string;
  total_cents: number;
  ticket_ids: string[];
  quantity: number;
  ticket_type_name: string;
}> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("complete_ticket_purchase", {
    p_reservation_id: reservationId,
    p_wallet_address: walletAddress,
    p_payment_ref: paymentRef ?? `mock_pay_${Date.now()}`,
  });

  if (error) {
    throw new Error(error.message || "Failed to complete purchase");
  }

  return data as {
    order_id: string;
    total_cents: number;
    ticket_ids: string[];
    quantity: number;
    ticket_type_name: string;
  };
}

export async function getMyTickets(): Promise<Ticket[]> {
  const supabase = createSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("tickets")
    .select("id,order_id,ticket_type_id,ticket_code,qr_payload,status,token_id,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  const ticketRows = (data as unknown as Omit<Ticket, "ticket_types">[]) ?? [];
  const ticketTypeIds = [...new Set(ticketRows.map((ticket) => ticket.ticket_type_id))];
  if (ticketTypeIds.length === 0) return [];

  const { data: ticketTypes, error: ticketTypeError } = await supabase
    .from("ticket_types")
    .select("id,name,price_cents,event_id")
    .in("id", ticketTypeIds);

  if (ticketTypeError) {
    console.error("Error fetching ticket types:", ticketTypeError);
    return ticketRows;
  }

  const eventIds = [...new Set((ticketTypes ?? []).map((ticketType) => ticketType.event_id))];
  const { data: events, error: eventError } = eventIds.length > 0
    ? await supabase.from("events").select("id,title,venue,starts_at,image_url").in("id", eventIds)
    : { data: [], error: null };

  if (eventError) console.error("Error fetching ticket events:", eventError);

  const eventById = new Map((events ?? []).map((event) => [event.id, event]));
  const ticketTypeById = new Map((ticketTypes ?? []).map((ticketType) => [ticketType.id, ticketType]));

  return ticketRows.map((ticket) => {
    const ticketType = ticketTypeById.get(ticket.ticket_type_id);
    return {
      ...ticket,
      ticket_types: ticketType
        ? { ...ticketType, events: eventById.get(ticketType.event_id) ?? undefined }
        : undefined,
    };
  });
}

export async function checkInTicket(ticketCode: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("verify_and_check_in_ticket", {
    p_ticket_code: ticketCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
