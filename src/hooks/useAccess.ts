import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl, notExpiredFilter } from "@/integrations/supabase/revamp";

/**
 * Whether the current user can access a subject:
 *   admin  OR  active subject access  OR  active access to the subject's year combo.
 * Mirrors the server-side has_subject_access() SQL function.
 */
export function useAccess(subjectId: string | null, yearId?: string | null) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setHasAccess(false); return; }

      // Admins see everything
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id);
      if (roles?.some((r) => r.role === "admin")) { setHasAccess(true); return; }

      if (!subjectId) { setHasAccess(false); return; }

      const notExpired = await notExpiredFilter();

      // Direct subject access
      let subjQ = tbl("user_subject_access")
        .select("id")
        .eq("user_id", user.id).eq("subject_id", subjectId).is("revoked_at", null);
      if (notExpired) subjQ = subjQ.or(notExpired);
      const { data: subj } = await subjQ.maybeSingle();
      if (subj) { setHasAccess(true); return; }

      // Year-combo access — resolve the subject's year if not provided
      let yId = yearId ?? null;
      if (!yId) {
        const { data: s } = await tbl("subjects").select("year_id").eq("id", subjectId).maybeSingle();
        yId = s?.year_id ?? null;
      }
      if (yId) {
        let yrQ = tbl("user_year_access")
          .select("id")
          .eq("user_id", user.id).eq("year_id", yId).is("revoked_at", null);
        if (notExpired) yrQ = yrQ.or(notExpired);
        const { data: yr } = await yrQ.maybeSingle();
        if (yr) { setHasAccess(true); return; }
      }

      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [subjectId, yearId]);

  useEffect(() => { check(); }, [check]);

  return { hasAccess, loading, refresh: check };
}
