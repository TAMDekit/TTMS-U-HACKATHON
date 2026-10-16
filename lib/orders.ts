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
    .select(`
      id,
      order_id,
      ticket_type_id,
      ticket_code,
      qr_payload,
      status,
      token_id,
      created_at,
      ticket_types (
        id,
        name,
        price_cents,
        event_id,
        events (
          id,
          title,
          venue,
          starts_at,
          image_url
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  return (data as unknown as Ticket[]) ?? [];
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
