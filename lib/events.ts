import { createSupabaseBrowserClient } from "./supabase-browser";

export type TicketType = {
  id: number;
  event_id: number;
  name: string;
  price_cents: number;
  total_supply: number;
  available_supply: number;
};

export type LiveEvent = {
  id: number;
  title: string;
  slug: string;
  description: string;
  artist: string | null;
  venue: string;
  starts_at: string;
  image_url: string | null;
  category?: string;
  ticket_types: TicketType[];
};

export async function getPublishedEvents(): Promise<LiveEvent[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("events")
    .select("id,title,slug,description,artist,venue,starts_at,image_url,category,ticket_types(*)")
    .eq("status", "PUBLISHED")
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LiveEvent[];
}
