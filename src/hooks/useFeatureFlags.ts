import { useEffect, useState } from "react";
import { tbl, FeatureFlagRow } from "@/integrations/supabase/revamp";
import { cachedQuery } from "@/lib/swr";

/**
 * Reads admin-controlled feature flags (which cards/features show).
 * Backed by the SWR cache: every mount across the app shares ONE request
 * per 2-minute window instead of each guard/nav hitting the DB.
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("td-flags") || "{}"); } catch { return {}; }
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    cachedQuery(
      "feature_flags",
      async () => {
        const { data } = await tbl("feature_flags").select("key, enabled");
        const map: Record<string, boolean> = {};
        ((data ?? []) as FeatureFlagRow[]).forEach((f) => { map[f.key] = f.enabled; });
        try { localStorage.setItem("td-flags", JSON.stringify(map)); } catch { /* ignore */ }
        return map;
      },
      120_000,
    ).then((map) => {
      if (!alive) return;
      setFlags(map);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  // default ON unless explicitly disabled
  const isOn = (key: string) => flags[key] !== false;
  return { flags, isOn, loaded };
}
