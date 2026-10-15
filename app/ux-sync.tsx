"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

export default function UXSync() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let timer: number | undefined;
    let expiry = Number(window.localStorage.getItem("ut3_ticket_reservation_expires") || 0);
    let currentUser: { email?: string; user_metadata?: { full_name?: string } } | null = null;

    const updateUserLabel = (user: { email?: string; user_metadata?: { full_name?: string } } | null) => {
      const button = document.querySelector<HTMLButtonElement>(".main-nav .login");
      if (!button) return;
      currentUser = user;
      const name = currentUser?.user_metadata?.full_name || currentUser?.email?.split("@")[0] || "User";
      const label = currentUser ? `${name} · Log out` : "Log In / Sign Up";
      if (button.textContent !== label) button.textContent = label;
    };

    const updateCountdown = () => {
      const element = document.querySelector<HTMLElement>(".timer");
      if (!element) return;
      if (!expiry) { if (element.textContent !== "10:00") element.textContent = "10:00"; return; }
      const seconds = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      const label = `Reserved for ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
      if (element.textContent !== label) element.textContent = label;
      if (seconds === 0) window.localStorage.removeItem("ut3_ticket_reservation_expires");
    };

    supabase.auth.getSession().then(({ data }) => updateUserLabel(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => updateUserLabel(session?.user ?? null));
    const handleAuthButton = (event: Event) => {
      if (!currentUser) return;
      const target = event.target as HTMLElement;
      const button = target.closest(".main-nav .login");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      void supabase.auth.signOut();
    };
    document.addEventListener("click", handleAuthButton, true);
    const observer = new MutationObserver(() => {
      updateUserLabel(currentUser);
      updateCountdown();
      document.querySelectorAll<HTMLButtonElement>(".buy-panel .purple-button.full:not([data-ut3-bound])").forEach((button) => {
        button.dataset.ut3Bound = "true";
        button.addEventListener("click", () => {
          expiry = Date.now() + 10 * 60 * 1000;
          window.localStorage.setItem("ut3_ticket_reservation_expires", String(expiry));
          updateCountdown();
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    timer = window.setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => { listener.subscription.unsubscribe(); observer.disconnect(); document.removeEventListener("click", handleAuthButton, true); if (timer) window.clearInterval(timer); };
  }, []);
  return null;
}
