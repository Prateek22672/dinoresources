import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import { toast } from "sonner";

/**
 * Single-device enforcement (admin toggle in Admin → Security).
 * Each password login writes a fresh device token to profiles.session_token
 * (see AuthPage). If enforcement is on and this device's token no longer matches
 * the server's, the account was opened elsewhere → sign this device out.
 */
export default function SessionGuard() {
  const kicked = useRef(false);

  useEffect(() => {
    const check = async () => {
      if (kicked.current) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: s } = await tbl("app_settings").select("single_device").maybeSingle();
      if (!s?.single_device) return;

      const { data: p } = await tbl("profiles").select("session_token").eq("id", user.id).maybeSingle();
      const server = (p?.session_token ?? "") as string;
      const local = localStorage.getItem("device_token") ?? "";

      // Only act when both are known and differ (avoids logging out sessions
      // that predate device tokens).
      if (server && local && server !== local) {
        kicked.current = true;
        toast.error("Signed out — your account was opened on another device.");
        await supabase.auth.signOut();
        setTimeout(() => { window.location.href = "/auth"; }, 900);
      }
    };

    check();
    const timer = setInterval(check, 20000);
    return () => clearInterval(timer);
  }, []);

  return null;
}
