import { createSupabaseBrowserClient } from "./supabase-browser";

export type Listing = {
  id: string;
  ticket_id: string;
  seller_wallet: string;
  price_cents: number;
  status: "ACTIVE" | "SOLD" | "CANCELLED";
  created_at: string;
};

export async function getActiveListings() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id,ticket_id,seller_wallet,price_cents,status,created_at")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function createListing(ticketId: string, sellerWallet: string, priceCents: number) {
  if (!sellerWallet || priceCents <= 0) throw new Error("Invalid resale listing");
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({ ticket_id: ticketId, seller_wallet: sellerWallet, price_cents: priceCents, status: "ACTIVE" })
    .select("id,ticket_id,seller_wallet,price_cents,status,created_at")
    .single();
  if (error) throw error;
  return data as Listing;
}

export async function cancelListing(listingId: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("listings").update({ status: "CANCELLED" }).eq("id", listingId);
  if (error) throw error;
}
