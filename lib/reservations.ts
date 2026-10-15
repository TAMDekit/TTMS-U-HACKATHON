import { createSupabaseBrowserClient } from "./supabase-browser";

export type Reservation = {
  id: string;
  ticket_type_id: number;
  quantity: number;
  expires_at: string;
  status: "ACTIVE" | "EXPIRED" | "COMPLETED" | "CANCELLED";
};

export async function reserveTickets(ticketTypeId: number, quantity: number) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("create_reservation", {
    p_ticket_type_id: ticketTypeId,
    p_quantity: quantity,
  });
  if (error) throw error;
  return data as Reservation;
}
