import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tbl, notExpiredFilter, SubjectRow, YearRow } from "@/integrations/supabase/revamp";
import { useCart } from "@/context/CartContext";
import { formatPaise } from "@/lib/money";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import { Check, Plus, Sparkles, BookOpen, Package, Search, X, ChevronRight, Zap } from "lucide-react";

interface YearGroup { year: YearRow; subjects: SubjectRow[] }

function matchProfileYear(sem: string | null, years: YearRow[]): string | null {
  if (!sem) return null;
  const s = sem.toLowerCase().trim();
  const n = parseInt(s, 10);
  const bySlug = (slug: string) => years.find((y) => y.slug === slug)?.id ?? null;
  if (Number.isFinite(n)) {
    const slug = n <= 2 ? "first-year" : n <= 4 ? "second-year" : n <= 6 ? "third-year" : n <= 8 ? "fourth-year" : "supplementary";
    const id = bySlug(slug); if (id) return id;
  }
  const tests: [RegExp, string][] = [
    [/\bfirst\b|\b1st\b/, "first-year"], [/\bsecond\b|\b2nd\b/, "second-year"],
    [/\bthird\b|\b3rd\b/, "third-year"], [/\bfourth\b|\b4th\b/, "fourth-year"],
    [/supp/, "supplementary"],
  ];
  for (const [re, slug] of tests) if (re.test(s)) { const id = bySlug(slug); if (id) return id; }
  const y = years.find((yr) => s.includes(yr.name.toLowerCase()) || yr.name.toLowerCase().includes(s));
  return y?.id ?? null;
}

export default function Store() {
  const navigate = useNavigate();
  const { addSubject, addCombo, isInCart } = useCart();
  const [groups, setGroups] = useState<YearGroup[]>([]);
  const [ownedSubjects, setOwnedSubjects] = useState<Set<string>>(new Set());
  const [ownedYears, setOwnedYears] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const [yearsRes, subjRes, profRes] = await Promise.all([
      tbl("years").select("*").eq("active", true).order("order_index", { ascending: true }),
      tbl("subjects").select("*").eq("active", true).order("order_index", { ascending: true }),
      user ? tbl("profiles").select("semester").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const years = (yearsRes.data ?? []) as YearRow[];
    const subjects = (subjRes.data ?? []) as SubjectRow[];

    if (user) {
      const notExpired = await notExpiredFilter();
      let saQ = tbl("user_subject_access").select("subject_id").eq("user_id", user.id).is("revoked_at", null);
      let yaQ = tbl("user_year_access").select("year_id").eq("user_id", user.id).is("revoked_at", null);
      if (notExpired) { saQ = saQ.or(notExpired); yaQ = yaQ.or(notExpired); }
      const [sa, ya] = await Promise.all([saQ, yaQ]);
      setOwnedSubjects(new Set((sa.data ?? []).map((r: any) => r.subject_id)));
      setOwnedYears(new Set((ya.data ?? []).map((r: any) => r.year_id)));
    }

    const grouped: YearGroup[] = years.map((y) => ({
      year: y,
      subjects: subjects.filter((s) => s.year_id === y.id),
    })).filter((g) => g.subjects.length > 0);

    const orphans = subjects.filter((s) => !s.year_id);
    if (orphans.length) {
      grouped.push({
        year: { id: "__none__", name: "Other Subjects", slug: "other", order_index: 999, combo_price_paise: 0, active: true },
        subjects: orphans,
      });
    }
    setGroups(grouped);

    // initial filter from the student's profile year (if that year has subjects)
    const profSem = (profRes.data as any)?.semester ?? null;
    const matchedYear = matchProfileYear(profSem, years);
    if (matchedYear && grouped.some((g) => g.year.id === matchedYear)) setActiveYear(matchedYear);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // year filter + search
  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .filter((g) => activeYear === "all" || g.year.id === activeYear)
      .map((g) => ({ ...g, subjects: q ? g.subjects.filter((s) => s.name.toLowerCase().includes(q)) : g.subjects }))
      .filter((g) => g.subjects.length > 0);
  }, [groups, activeYear, query]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return groups.flatMap((g) => g.subjects).filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [groups, query]);

  const totalSubjectCount = groups.reduce((n, g) => n + g.subjects.length, 0);
  const comboCount = groups.filter((g) => g.year.id !== "__none__" && g.year.combo_price_paise > 0).length;

  return (
    <AppShell>
      <PageHero
        eyebrow="Store"
        eyebrowIcon={Sparkles}
        title="Unlock exactly what you need."
        subtitle="Buy a single subject, or grab the full-year combo and save. One payment, permanent access — notes, PYQs and Study-With-AI included."
        stats={[
          { label: "Subjects", value: totalSubjectCount, icon: BookOpen },
          { label: "Year combos", value: comboCount, icon: Package },
        ]}
      />

      {/* Search */}
      <div className="relative mb-5 max-w-xl">
        <div className="td-surface rounded-2xl flex items-center px-3 h-12">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
            placeholder="Search subjects…"
            className="flex-1 bg-transparent border-none outline-none text-sm px-3 text-white placeholder:text-zinc-500"
          />
          {query && (
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="w-7 h-7 rounded-full td-surface-2 flex items-center justify-center text-zinc-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {searchFocus && suggestions.length > 0 && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 td-surface rounded-2xl overflow-hidden z-30 shadow-2xl">
            {suggestions.map((s) => (
              <button key={s.id} onMouseDown={(e) => e.preventDefault()} onClick={() => navigate(`/subject/${s.slug ?? s.id}`)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 text-left border-b border-white/5 last:border-0">
                <span className="flex items-center gap-2.5 min-w-0">
                  <BookOpen className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-white text-sm font-medium truncate">{s.name}</span>
                </span>
                <span className="text-zinc-400 text-xs shrink-0">{formatPaise(s.price_paise)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Year filter chips */}
      {!loading && groups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 [&::-webkit-scrollbar]:hidden">
          <button onClick={() => setActiveYear("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium ${activeYear === "all" ? "bg-white text-black" : "td-btn-ghost"}`}>
            All
          </button>
          {groups.map((g) => (
            <button key={g.year.id} onClick={() => setActiveYear(g.year.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeYear === g.year.id ? "bg-white text-black" : "td-btn-ghost"}`}>
              {g.year.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 rounded-3xl td-surface animate-pulse" />)}
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="py-24 text-center td-surface rounded-[32px]">
          <BookOpen className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">{query ? "No subjects match your search." : "No subjects here yet."}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {visibleGroups.map(({ year, subjects }) => {
            const comboOwned = ownedYears.has(year.id);
            const comboInCart = isInCart("combo", year.id);
            const hasCombo = year.id !== "__none__" && year.combo_price_paise > 0;
            const individualTotal = subjects.reduce((sum, s) => sum + s.price_paise, 0);
            const savings = Math.max(0, individualTotal - year.combo_price_paise);
            const savingsPct = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

            return (
              <section key={year.id} className="td-in">
                <div className="mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{year.name}</h2>
                  <p className="text-zinc-500 text-sm mt-0.5">{subjects.length} subjects</p>
                </div>

                {/* ── Prominent combo highlight ── */}
                {hasCombo && !comboOwned && (
                  <div className="td-banner-bw rounded-3xl p-5 sm:p-6 mb-5 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                      <div className="min-w-0">
                        <span className="td-bw-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-2.5">
                          <Zap className="w-3 h-3" /> Best value{savingsPct > 0 ? ` · Save ${savingsPct}%` : ""}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold leading-tight">{year.name} — Complete Access</h3>
                        <p className="td-bw-soft text-sm mt-1">
                          All {subjects.length} subjects · notes, PYQs &amp; Study-With-AI, one payment.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          {savings > 0 && <p className="td-bw-soft text-sm line-through leading-none">{formatPaise(individualTotal)}</p>}
                          <p className="text-2xl font-extrabold leading-none mt-1">{formatPaise(year.combo_price_paise)}</p>
                        </div>
                        <button
                          disabled={comboInCart}
                          onClick={() => addCombo(year.id, year.name)}
                          className="td-bw-chip px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60 hover:scale-[1.02] transition-transform"
                        >
                          {comboInCart ? <><Check className="w-4 h-4" /> In cart</> : <><Plus className="w-4 h-4" /> Buy combo</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {hasCombo && comboOwned && (
                  <div className="td-surface rounded-2xl px-5 py-3 mb-5 flex items-center gap-2 text-sm text-emerald-400">
                    <Check className="w-4 h-4" /> You own the full {year.name} combo — every subject below is unlocked.
                  </div>
                )}

                {/* Subjects grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {subjects.map((s) => {
                    const owned = ownedSubjects.has(s.id) || comboOwned;
                    const inCart = isInCart("subject", s.id);
                    return (
                      <div key={s.id} className="td-surface td-card-click rounded-3xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center mb-3">
                              <BookOpen className="w-4.5 h-4.5 text-black" />
                            </div>
                            <span className="text-white font-bold">{formatPaise(s.price_paise)}</span>
                          </div>
                          <Link to={`/subject/${s.slug ?? s.id}`} className="block">
                            <h3 className="text-white font-semibold leading-snug line-clamp-2 hover:underline">{s.name}</h3>
                          </Link>
                          {s.description && <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2">{s.description}</p>}
                        </div>

                        <div className="mt-4">
                          {owned ? (
                            <Link to={`/subject/${s.slug ?? s.id}`} className="w-full td-btn-ghost py-2.5 rounded-full text-[13px] flex items-center justify-center gap-1.5">
                              <Check className="w-3.5 h-3.5" /> Open <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <button
                              disabled={inCart}
                              onClick={() => addSubject(s.id, s.name)}
                              className="w-full td-btn-primary py-2.5 rounded-full text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              {inCart ? <><Check className="w-3.5 h-3.5" /> In cart</> : <><Plus className="w-3.5 h-3.5" /> Add to cart</>}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
