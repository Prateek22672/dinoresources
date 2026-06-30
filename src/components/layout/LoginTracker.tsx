import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeFn } from "@/integrations/supabase/revamp";

/** Records login IP/device server-side (for account-sharing detection). */
export default function LoginTracker() {
  useEffect(() => {
    const log = () => { invokeFn("log-login").catch(() => {}); };

    supabase.auth.getSession().then(({ data }) => { if (data.session) log(); });

    // IMPORTANT: defer with setTimeout(0) — never call supabase methods directly
    // inside the auth callback (it holds the auth lock and would deadlock).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setTimeout(log, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
