"use client";

import { useEffect } from "react";
import { useDisconnect } from "wagmi";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

export default function UXSync() {
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        try {
          disconnect();
        } catch (err) {
          console.warn("Wallet disconnect error:", err);
        }
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [disconnect]);

  return null;
}
