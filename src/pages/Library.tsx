import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tbl, SubjectRow, YearRow } from "@/integrations/supabase/revamp";
import AppShell from "@/components/layout/AppShell";
import { BookOpen, Library as LibraryIcon, ArrowRight, Package } from "lucide-react";

export default function Library() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [comboYears, setComboYears] = useState<YearRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Years the user owns as a combo
    const { data: ya } = await tbl("user_year_access")
      .select("year_id").eq("user_id", user.id).is("revoked_at", null);
    const yearIds = (ya ?? []).map((r: any) => r.year_id);

    // Subjects owned directly
    const { data: sa } = await tbl("user_subject_access")
      .select("subject_id").eq("user_id", user.id).is("revoked_at", null);
    const directIds = (sa ?? []).map((r: any) => r.subject_id);

    const [allSubjRes, yearsRes] = await Promise.all([
      tbl("subjects").select("*").eq("active", true),
      yearIds.length ? tbl("years").select("*").in("id", yearIds) : Promise.resolve({ data: [] }),
    ]);
    const allSubjects = (allSubjRes.data ?? []) as SubjectRow[];

    // Owned = direct subject ownership OR belongs to an owned year combo
    const yearIdSet = new Set(yearIds);
    const directSet = new Set(directIds);
    const owned = allSubjects.filter((s) => directSet.has(s.id) || (s.year_id && yearIdSet.has(s.year_id)));

    setSubjects(owned);
    setComboYears((yearsRes.data ?? []) as YearRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <LibraryIcon className="w-6 h-6 td-accent-text" /> My Library
          </h1>
          <p className="text-zinc-500 mt-1">Everything you own, in one place.</p>
        </div>
        <Link to="/store" className="td-btn-ghost px-4 py-2 text-sm flex items-center gap-1.5">
          Browse store <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {comboYears.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {comboYears.map((y) => (
            <span key={y.id} className="td-surface-2 rounded-full px-3 py-1.5 text-[13px] text-zinc-300 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 td-accent-text" /> {y.name} — Full Access
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 rounded-3xl td-surface animate-pulse" />)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-24 text-center td-surface rounded-[32px] td-in">
          <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg">Your library is empty</h3>
          <p className="text-zinc-500 text-sm mt-1 mb-6">Purchase a subject or a year combo to get started.</p>
          <Link to="/store" className="td-btn-primary px-6 py-3 text-sm inline-flex items-center gap-2">
            Go to Store <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {subjects.map((s) => (
            <Link
              key={s.id}
              to={`/subject/${s.slug ?? s.id}`}
              className="td-surface rounded-3xl p-5 hover:border-white/15 transition-colors group td-in"
            >
              <div className="w-10 h-10 rounded-2xl td-surface-2 flex items-center justify-center mb-3">
                <BookOpen className="w-4.5 h-4.5 text-zinc-300" />
              </div>
              <h3 className="text-white font-semibold leading-snug line-clamp-2">{s.name}</h3>
              <p className="text-zinc-500 text-xs mt-2 flex items-center gap-1 group-hover:text-zinc-300 transition-colors">
                Open <ArrowRight className="w-3 h-3" />
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
