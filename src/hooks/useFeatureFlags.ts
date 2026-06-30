import { useEffect, useState } from "react";
import { tbl, FeatureFlagRow } from "@/integrations/supabase/revamp";

/** Reads admin-controlled feature flags (which cards/features show). */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("td-flags") || "{}"); } catch { return {}; }
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    tbl("feature_flags").select("key, enabled").then(({ data }: any) => {
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((f: FeatureFlagRow) => { map[f.key] = f.enabled; });
      setFlags(map);
      setLoaded(true);
      try { localStorage.setItem("td-flags", JSON.stringify(map)); } catch { /* ignore */ }
    });
  }, []);

  // default ON unless explicitly disabled
  const isOn = (key: string) => flags[key] !== false;
  return { flags, isOn, loaded };
}
