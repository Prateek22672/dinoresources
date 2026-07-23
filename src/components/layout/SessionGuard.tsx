import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import { toast } from "sonner";

/**
 * Single-device enforcement (admin toggle in Admin → Security).
 * Each password login writes a fresh device token to profiles.session_token
 * (see AuthPage). When enforcement is on, only the device holding the LATEST
 * token stays signed in:
 *   - server token differs from this device's  → kicked (opened elsewhere)
 *   - server has a token, this device has none → kicked (unregistered session)
 *   - server has none but this device does     → claim it (self-heal)
 * Checked on load, every 15s, and whenever the tab regains focus.
 */
export default function SessionGuard() {
  const kicked = useRef(false);
  const checking = useRef(false);

  useEffect(() => {
    const kick = async () => {
      kicked.current = true;
      toast.error("Signed out — your account was opened on another device.");
      await supabase.auth.signOut();
      setTimeout(() => { window.location.href = "/auth"; }, 900);
    };

    const check = async () => {
      if (kicked.current || checking.current) return;
      checking.current = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: s } = await tbl("app_settings").select("single_device").maybeSingle();
        if (!s?.single_device) return;

        const { data: p } = await tbl("profiles").select("session_token").eq("id", user.id).maybeSingle();
        const server = (p?.session_token ?? "") as string;
        const local = localStorage.getItem("device_token") ?? "";

        if (server && local && server !== local) return void kick();
        // Strict: a session with no device token (predates the feature or was
        // copied) is signed out once the account has a registered device.
        if (server && !local) return void kick();
        // Self-heal: this device is the only session — claim the token.
        if (!server && local) {
          await tbl("profiles").update({ session_token: local }).eq("id", user.id);
        }
      } finally {
        checking.current = false;
      }
    };

    check();
    const timer = setInterval(check, 15000);
    const onFocus = () => check();
    const onVis = () => { if (!document.hidden) check(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setTimeout(() => check(), 500);
    });

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
