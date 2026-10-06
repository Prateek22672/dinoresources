import { useEffect, useState } from "react";
import { tbl } from "@/integrations/supabase/revamp";

export interface BundleTier { id: string; min_subjects: number; percent: number; active: boolean }

/**
 * The "buy 3 save X%" offer as configured in Admin → Charges. Used to
 * advertise the tiers (Store) and nudge toward the next one (cart). The
 * actual discount always comes from the bundle_quote RPC — the same one
 * create-cart-order uses — never from arithmetic here.
 */
export function useBundleOffer() {
  const [enabled, setEnabled] = useState(false);
  const [stacks, setStacks] = useState(true);
  const [tiers, setTiers] = useState<BundleTier[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [s, t] = await Promise.all([
        tbl("app_settings").select("bundle_offers_enabled, bundle_stacks_with_coupons").maybeSingle(),
        tbl("bundle_tiers").select("id, min_subjects, percent, active").eq("active", true).order("min_subjects", { ascending: true }),
      ]);
      if (!alive) return;
      // before the migration runs these columns/tables don't exist: stay off
      setEnabled(!s.error && !!(s.data as any)?.bundle_offers_enabled && !t.error && (t.data ?? []).length > 0);
      setStacks((s.data as any)?.bundle_stacks_with_coupons !== false);
      setTiers((t.data ?? []) as BundleTier[]);
    })();
    return () => { alive = false; };
  }, []);

  /** The tier a cart with `count` subjects qualifies for, if any. */
  const tierFor = (count: number) => [...tiers].reverse().find((t) => count >= t.min_subjects) ?? null;
  /** The next tier up — what adding subjects would unlock. */
  const nextTier = (count: number) => tiers.find((t) => t.min_subjects > count) ?? null;

  return { enabled, stacks, tiers, tierFor, nextTier };
}
