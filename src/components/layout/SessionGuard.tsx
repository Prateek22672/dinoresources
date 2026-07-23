import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import { toast } from "sonner";

/**
 * Single-device enforcement (admin toggle in Admin → Security).
 *
 * Ownership model: the device with the MOST RECENT login owns the session.
 *  - On SIGNED_IN, this device records the login moment and CLAIMS the server
 *    token (writes its own) — so a fresh login is never kicked by stale data.
 *  - A mismatch only signs a device out if it persists on a re-read (grace
 *    re-check), which removes the login race entirely.
 *  - A device with no local token is kicked only when it isn't mid-login.
 */
const LOGIN_GRACE_MS = 20_000;

export default function SessionGuard() {
  const kicked = useRef(false);
  const checking = useRef(false);
  const lastSignIn = useRef(0);

  useEffect(() => {
    const kick = async () => {
      kicked.current = true;
      toast.error("Signed out — your account was opened on another device.");
      await supabase.auth.signOut();
      setTimeout(() => { window.location.href = "/auth"; }, 900);
    };

    /** This device just logged in → it owns the session; push its token. */
    const claim = async (userId: string, local: string) => {
      await tbl("profiles").update({ session_token: local }).eq("id", userId);
    };

    const readServerToken = async (userId: string): Promise<string> => {
      const { data: p } = await tbl("profiles").select("session_token").eq("id", userId).maybeSingle();
      return (p?.session_token ?? "") as string;
    };

    const check = async () => {
      if (kicked.current || checking.current) return;
      checking.current = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: s } = await tbl("app_settings").select("single_device").maybeSingle();
        if (!s?.single_device) return;

        const local = localStorage.getItem("device_token") ?? "";
        const freshLogin = Date.now() - lastSignIn.current < LOGIN_GRACE_MS;
        const server = await readServerToken(user.id);

        // In sync — nothing to do.
        if (server && local && server === local) return;

        // Fresh login on THIS device → newest session wins: claim, never kick.
        if (freshLogin) {
          if (local) await claim(user.id, local);
          return;
        }

        // Server empty but we have a token → sole session, self-heal the claim.
        if (!server && local) { await claim(user.id, local); return; }

        // Mismatch or missing local token: re-read after a grace pause so a
        // login-in-flight elsewhere in this same browser can settle first.
        await new Promise((r) => setTimeout(r, 1500));
        if (kicked.current) return;
        if (Date.now() - lastSignIn.current < LOGIN_GRACE_MS) return; // login landed meanwhile
        const server2 = await readServerToken(user.id);
        const local2 = localStorage.getItem("device_token") ?? "";
        if (server2 && local2 && server2 === local2) return;
        if (!server2) return;

        await kick();
      } finally {
        checking.current = false;
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        lastSignIn.current = Date.now();
        // claim immediately so other devices see the new owner fast
        setTimeout(() => {
          (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const local = localStorage.getItem("device_token") ?? "";
            if (user && local) await claim(user.id, local);
          })();
        }, 0);
      }
    });

    check();
    const timer = setInterval(check, 15000);
    const onFocus = () => check();
    const onVis = () => { if (!document.hidden) check(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
