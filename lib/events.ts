import { createSupabaseBrowserClient } from "./supabase-browser";
export type LiveEvent={id:number;title:string;slug:string;description:string;artist:string|null;venue:string;starts_at:string;image_url:string|null};
export async function getPublishedEvents():Promise<LiveEvent[]>{const supabase=createSupabaseBrowserClient();const {data,error}=await supabase.from("events").select("id,title,slug,description,artist,venue,starts_at,image_url").eq("status","PUBLISHED").order("starts_at",{ascending:true});if(error)throw error;return data??[];}
