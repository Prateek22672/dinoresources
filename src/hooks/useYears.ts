import { useState, useEffect, useCallback } from "react";
import { tbl, YearRow } from "@/integrations/supabase/revamp";

export function useYears(includeInactive = false) {
  const [years, setYears] = useState<YearRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = tbl("years").select("*").order("order_index", { ascending: true });
    if (!includeInactive) q = q.eq("active", true);
    const { data } = await q;
    setYears((data ?? []) as YearRow[]);
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => { refresh(); }, [refresh]);

  return { years, loading, refresh };
}
