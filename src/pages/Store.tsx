import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tbl, notExpiredFilter, SubjectRow, YearRow } from "@/integrations/supabase/revamp";
import { useCart } from "@/context/CartContext";
import { formatPaise } from "@/lib/money";
import { resolveStudentYear } from "@/lib/year";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import SubjectFolderCard, { tone as subjectTone } from "@/components/stacks/SubjectFolderCard";
import SearchBox, { type SearchItem } from "@/components/ui/SearchBox";
import { useBundleOffer } from "@/hooks/useBundleOffer";
import { Check, Plus, Sparkles, BookOpen, Package, ArrowRight, Zap, GraduationCap } from "lucide-react";

interface YearGroup { year: YearRow; subjects: SubjectRow[] }

export default function Store() {
  const navigate = useNavigate();
  const { addSubject, addCombo, isInCart, items: cartItems } = useCart();
  const bundle = useBundleOffer();
  const [groups, setGroups] = useState<YearGroup[]>([]);
  const [ownedSubjects, setOwnedSubjects] = useState<Set<string>>(new Set());
  const [ownedYears, setOwnedYears] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [studentYear, setStudentYear] = useState<YearRow | null>(null); // the signed-in student's own year
  // Raw profile value, so we can tell "no year set" apart from "year set but the
  // matching years row is missing/inactive" — very different messages to show.
  const [profileYearLabel, setProfileYearLabel] = useState<string | null>(null);
  const [yearFallback, setYearFallback] = useState(false);
  const [query, setQuery] = useState("");

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

    // Strictly the student's OWN opted year — the Store never shows another
    // year's subjects or pack, even if theirs has no subjects yet (a friendly
    // empty state shows instead). The only way to see a different year is to
    // change it in Settings, which changes what "opted year" means.
    const profSem = (profRes.data as any)?.semester ?? null;
    // If their year has been switched off (e.g. only Supplementary is open),
    // they're moved onto the open year rather than shown an empty page.
    const resolved = resolveStudentYear(profSem, years);
    const myYear = resolved.id ? years.find((y) => y.id === resolved.id) ?? null : null;
    setProfileYearLabel(profSem);
    setStudentYear(myYear);
    setYearFallback(resolved.fallback);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // strictly the student's opted year (+ year-less "Other Subjects"), never another year
  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .filter((g) => g.year.id === "__none__" || g.year.id === studentYear?.id)
      .map((g) => ({ ...g, subjects: q ? g.subjects.filter((s) => s.name.toLowerCase().includes(q)) : g.subjects }))
      .filter((g) => g.subjects.length > 0);
  }, [groups, studentYear, query]);

  // Matches among the subjects this page actually shows. The old dropdown
  // searched every year (suggesting subjects the page then hid) and hung
  // over the very cards it duplicated — the grid already filters live.
  const matches = useMemo(() => visibleGroups.flatMap((g) => g.subjects), [visibleGroups]);
  // what the box suggests before anything is typed: this year's subjects
  const myYearSubjects = useMemo(
    () => groups.filter((g) => g.year.id === "__none__" || g.year.id === studentYear?.id).flatMap((g) => g.subjects),
    [groups, studentYear],
  );
  const toItem = (s: SubjectRow): SearchItem => {
    const [from, to] = subjectTone(s.name);
    const owned = ownedSubjects.has(s.id) || (!!s.year_id && ownedYears.has(s.year_id));
    return {
      id: s.id,
      label: s.name,
      sub: owned ? "Unlocked · notes, PYQs, Study with AI" : "Free preview inside",
      meta: owned ? <span className="td-accent-text">Owned</span> : formatPaise(s.price_paise),
      lead: <span className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-[13px] font-extrabold"
        style={{ background: `linear-gradient(160deg, ${from}, ${to})`, textShadow: "0 1px 2px rgba(0,0,0,.35)" }}>{s.name.trim().charAt(0).toUpperCase()}</span>,
      onSelect: () => navigate(`/subject/${s.slug ?? s.id}`),
    };
  };

  // Stats describe what this student can actually see. Counting every year's
  // subjects here would read "19 Subjects" above a page showing 4.
  const myGroup = groups.find((g) => g.year.id === studentYear?.id);
  const myYearCount = myGroup?.subjects.length ?? 0;
  const heroStats = studentYear
    ? [
        { label: `Subjects in ${studentYear.name}`, value: myYearCount, icon: BookOpen },
        // Owning the pack replaces its price — a price for something already
        // bought reads like an upsell. This also stands in for the old
        // "you own the full combo" strip that sat under the search.
        ...(ownedYears.has(studentYear.id)
          ? [{ label: "Full-year pack", value: <span className="inline-flex items-center gap-2"><Check className="w-6 h-6" /> Owned</span>, icon: Package }]
          : studentYear.combo_price_paise > 0
            ? [{ label: "Full-year pack", value: formatPaise(studentYear.combo_price_paise), icon: Package }]
            : []),
      ]
    // No matched year: every subject on the page is hidden, so a total here
    // would advertise a count the student cannot reach ("4 Subjects" above an
    // empty list). Show nothing and let the empty state do the talking.
    : undefined;

  const yearLabel = studentYear?.name ?? profileYearLabel;

  return (
    <AppShell>
      <PageHero
        eyebrow="Store"
        eyebrowIcon={Sparkles}
        book={{ cover: "#0F9D9A", spine: "#0B7A78", title: "COA" }}
        title={studentYear ? <>Everything for <span className="td-accent-text">{studentYear.name}</span>.</> : "Unlock exactly what you need."}
        subtitle="Unlock one subject, or open your whole year at once. One payment — notes, PYQs and Study-With-AI included."
        stats={loading ? undefined : heroStats}
        actions={
          loading ? undefined : (
            <>
              {yearLabel && (
                <span className="td-glass px-3.5 py-2 rounded-full text-[13px] font-semibold text-white flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 td-accent-text" /> {yearLabel}
                  <span className="text-[10px] font-bold text-zinc-500">· {yearFallback ? `${profileYearLabel} is closed` : "your year"}</span>
                </span>
              )}
              <button onClick={() => navigate("/setup?edit=true")}
                className="td-btn-ghost px-3.5 py-2 rounded-full text-[13px] font-medium flex items-center gap-1.5">
                {yearLabel ? "Change" : "Set your year"}
              </button>
            </>
          )
        }
      >
        {/* Search sits in the header — it is how most students use this page */}
        <SearchBox
          className="mt-6 max-w-xl"
          variant="accent"
          value={query}
          onChange={setQuery}
          placeholder="Search subjects…"
          items={matches.map(toItem)}
          idleItems={myYearSubjects.map(toItem)}
          idleTitle={studentYear ? `${studentYear.name} subjects` : "Subjects"}
          emptyText="No subject matches"
        />
        {/* the grid below filters live too — say so, so the list and the grid agree */}
        {query.trim() && (
          <p className="text-[12px] font-semibold mt-2.5 pl-4 opacity-75" aria-live="polite">
            {matches.length === 0 ? "No subjects match — try another word." : `${matches.length} subject${matches.length === 1 ? "" : "s"} shown below`}
          </p>
        )}
      </PageHero>

      {/* Bundle offer — the tiers, and how close this cart already is */}
      {bundle.enabled && !loading && (() => {
        const inCart = cartItems.filter((i) => i.item_type === "subject").length;
        const next = bundle.nextTier(inCart);
        const now = bundle.tierFor(inCart);
        return (
          <div className="td-bento td-bento-ink td-force-dark p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">Bundle offer</p>
              <p className="text-[15px] font-bold mt-0.5">
                {now && !next ? `You're getting the top ${now.percent}% off — nice.`
                  : next ? `Add ${next.min_subjects - inCart} more subject${next.min_subjects - inCart === 1 ? "" : "s"} to save ${next.percent}%`
                  : "Buy more, save more"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {bundle.tiers.map((t, i) => (
                <span key={t.id} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${now?.id === t.id ? "td-bento-accent" : "td-bento-inkpill"}`}>
                  {t.min_subjects}{i === bundle.tiers.length - 1 ? "+" : ""} subjects · {t.percent}% off
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* The student's year lives in the hero now — this page only ever shows
          that one year, so there are no chips to browse others. */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 rounded-3xl td-surface animate-pulse" />)}
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="py-20 text-center td-surface rounded-[32px] px-6">
          <BookOpen className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          {query ? (
            <p className="text-zinc-400 font-medium">No subjects match your search.</p>
          ) : studentYear ? (
            <>
              <p className="text-white font-semibold">Subjects for {studentYear.name} are coming soon</p>
              <p className="text-zinc-500 text-sm mt-1 mb-4">We're adding content for your year. If your year is wrong, you can change it.</p>
              <button onClick={() => navigate("/setup?edit=true")} className="td-btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> Change my year</button>
            </>
          ) : profileYearLabel ? (
            /* Year IS set, but no active `years` row matches it — don't tell the
               student to "set" a year they already set; this one is on us. */
            <>
              <p className="text-white font-semibold">{profileYearLabel} isn't open yet</p>
              <p className="text-zinc-500 text-sm mt-1 mb-4">Your year is set to {profileYearLabel}, but it isn't available in the Store right now. Hang tight — or pick a different year.</p>
              <button onClick={() => navigate("/setup?edit=true")} className="td-btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> Change my year</button>
            </>
          ) : (
            <>
              <p className="text-white font-semibold">Set your academic year to see your subjects</p>
              <p className="text-zinc-500 text-sm mt-1 mb-4">The Store shows only your opted year's subjects and pack.</p>
              <button onClick={() => navigate("/setup?edit=true")} className="td-btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> Set my year</button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {visibleGroups.map(({ year, subjects }) => {
            const comboOwned = ownedYears.has(year.id);
            const comboInCart = isInCart("combo", year.id);
            const hasCombo = year.id !== "__none__" && year.combo_price_paise > 0;
            // Only pitch the combo upsell for the student's own opted year — never a year they haven't chosen.
            const isMyYearCombo = hasCombo && studentYear?.id === year.id;
            const individualTotal = subjects.reduce((sum, s) => sum + s.price_paise, 0);
            const savings = Math.max(0, individualTotal - year.combo_price_paise);
            const savingsPct = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

            return (
              <section key={year.id} className="td-in">
                {/* The student's own year is named in the hero; only extra groups
                    ("Other Subjects") need a heading here. */}
                {year.id !== studentYear?.id && <div className="mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{year.name}</h2>
                  <p className="text-zinc-500 text-sm mt-0.5">{subjects.length} subjects</p>
                </div>}

                {/* ── Prominent combo highlight — only for the student's own opted year ── */}
                {isMyYearCombo && !comboOwned && (
                  <div className="td-banner-bw rounded-3xl p-5 sm:p-6 mb-5 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                      <div className="min-w-0">
                        <span className="td-bw-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-2.5">
                          <Zap className="w-3 h-3" /> Best value{savingsPct > 0 ? ` · Save ${savingsPct}%` : ""}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold leading-tight">{year.name} — Whole Year</h3>
                        <p className="td-bw-soft text-sm mt-1">
                          All {subjects.length} subjects · notes, PYQs &amp; Study-With-AI, one payment.
                        </p>
                        <button onClick={() => navigate("/setup?edit=true")}
                          className="td-bw-soft hover:opacity-80 text-xs font-medium mt-2 inline-flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> Not your year? Change here
                        </button>
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
                          {comboInCart ? <><Check className="w-4 h-4" /> In cart</> : <><Plus className="w-4 h-4" /> Get full year</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {hasCombo && comboOwned && year.id !== studentYear?.id && (
                  <div className="td-surface rounded-2xl px-5 py-3 mb-5 flex items-center gap-2 text-sm text-emerald-400">
                    <Check className="w-4 h-4" /> You own the full {year.name} combo — every subject below is unlocked.
                  </div>
                )}

                {/* Subjects grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {subjects.map((s, i) => (
                    <SubjectFolderCard
                      key={s.id}
                      subject={s}
                      index={i}
                      owned={ownedSubjects.has(s.id) || comboOwned}
                      inCart={isInCart("subject", s.id)}
                      onAdd={() => addSubject(s.id, s.name)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
