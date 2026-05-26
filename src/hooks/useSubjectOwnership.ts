import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseSubjectOwnershipResult {
  isOwned: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useSubjectOwnership(subjectId: string | null): UseSubjectOwnershipResult {
  const [isOwned, setIsOwned] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!subjectId) { setLoading(false); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsOwned(false); setLoading(false); return; }

    const { data } = await supabase
      .from("user_subject_ownership")
      .select("id")
      .eq("user_id", user.id)
      .eq("subject_id", subjectId)
      .maybeSingle();

    setIsOwned(!!data);
    setLoading(false);
  }, [subjectId]);

  useEffect(() => { check(); }, [check]);

  return { isOwned, loading, refresh: check };
}