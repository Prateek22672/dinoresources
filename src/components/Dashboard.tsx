import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { tbl, notExpiredFilter, SubjectRow, YearRow } from "@/integrations/supabase/revamp";
import { useCart } from "@/context/CartContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { formatPaise } from "@/lib/money";
import { getRecentSubject, bumpStreak, logActivity, type RecentSubject } from "@/lib/recent";
import { getReadiness, readinessColor } from "@/lib/readiness";
import { matchProfileYear } from "@/lib/year";

import AppShell from "@/components/layout/AppShell";
import FloatingBook from "@/components/brand/FloatingBook";
import SplashScreen, { useMinSplash } from "@/components/layout/SplashScreen";
import AttendanceCalculator from "./AttendanceCalculator";
import SGPACalculator from "./SGPACalculator";
import { AnnouncementsSection } from "./AnnouncementsSection";
import Footer from "./Footer";

import {
  BookOpen, Store, Plus, Check, ArrowRight, ArrowLeft, ArrowUpRight, Calculator,
  CalendarDays, Megaphone, Globe, Package, GraduationCap, Briefcase, Bot,
  Play, TrendingUp, ChevronLeft, ChevronRight,
} from "lucide-react";
import { GenAiIcon } from "@/components/BrandIcons";
import agentFuryLogo from "@/assets/icon-192.png";
import fyxLogo from "@/assets/fyx.png";

type ToolView = null | "sgpa" | "attendance" | "announcements";

interface Banner {
  key: string;
  overline: string;
  title: string;
  desc: string;
  cta: string;
  accent: string; // subtle accent hue (icon + faint glow); card body stays neutral
  icon: any;
  onClick: () => void;
  /** When set, the card renders as one tile split into two independently-tappable halves. */
  split?: { overline: string; title: string; desc: string; icon: any; onClick: () => void }[];
  /** Brand artwork in the icon chip (white-on-black source — flips with the theme). */
  img?: string;
  /** Brand wordmark shown INSTEAD of the title text (solid black source). */
  logo?: string;
}

// Deterministic colorful thumbnails for subject cards — SOLID colors only.
const GRADS = ["#7c6cf0", "#f472b6", "#34d399", "#f59e0b", "#6b8afd", "#a78bfa"];
const grad = (name: string) =>
  GRADS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % GRADS.length];

export default function Dashboard() {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const { addSubject, addCombo, isInCart } = useCart();
  const { isOn } = useFeatureFlags();

  const [profile, setProfile] = useState<{ name: string; department: string; semester: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const showSplash = useMinSplash(loading);

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [years, setYears] = useState<YearRow[]>([]);
  const [ownedSubjectIds, setOwnedSubjectIds] = useState<Set<string>>(new Set());
  const [ownedYearIds, setOwnedYearIds] = useState<Set<string>>(new Set());
  const [tool, setTool] = useState<ToolView>(null);
  const [recent, setRecent] = useState<RecentSubject | null>(null);
  const [streak, setStreak] = useState(0);
  const [activity, setActivity] = useState<string[]>([]);

  // readiness refresh tick — recompute rings when engagement changes
  const [readyTick, setReadyTick] = useState(0);
  useEffect(() => {
    const h = () => setReadyTick((t) => t + 1);
    window.addEventListener("td:readiness-changed", h);
    return () => window.removeEventListener("td:readiness-changed", h);
  }, []);

  // quick-access carousel — arrow buttons step by roughly one card
  const quickRef = useRef<HTMLDivElement>(null);
  const scrollQuick = (dir: 1 | -1) => {
    const el = quickRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  useEffect(() => { setRecent(getRecentSubject()); setStreak(bumpStreak()); setActivity(logActivity()); }, []);

  const checkAuthAndLoad = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate("/auth");

    const { data: p } = await tbl("profiles")
      .select("department, semester, username, full_name, email")
      .eq("id", session.user.id)
      .single();

    if (!p || !p.department || !p.semester) return navigate("/setup");

    const name = p.full_name || p.username || (p.email ? p.email.split("@")[0] : "there");
    setProfile({ name, department: p.department, semester: p.semester });

    const notExpired = await notExpiredFilter();
    let saQ = tbl("user_subject_access").select("subject_id").eq("user_id", session.user.id).is("revoked_at", null);
    let yaQ = tbl("user_year_access").select("year_id").eq("user_id", session.user.id).is("revoked_at", null);
    if (notExpired) { saQ = saQ.or(notExpired); yaQ = yaQ.or(notExpired); }

    const [subjRes, yearRes, sa, ya] = await Promise.all([
      tbl("subjects").select("*").eq("active", true).order("order_index", { ascending: true }),
      tbl("years").select("*").eq("active", true).order("order_index", { ascending: true }),
      saQ,
      yaQ,
    ]);

    setSubjects((subjRes.data ?? []) as SubjectRow[]);
    setYears((yearRes.data ?? []) as YearRow[]);
    setOwnedSubjectIds(new Set((sa.data ?? []).map((r: any) => r.subject_id)));
    setOwnedYearIds(new Set((ya.data ?? []).map((r: any) => r.year_id)));
    setLoading(false);
  }, [navigate]);

  useEffect(() => { checkAuthAndLoad(); }, [checkAuthAndLoad]);

  const isOwned = (s: SubjectRow) =>
    ownedSubjectIds.has(s.id) || (s.year_id ? ownedYearIds.has(s.year_id) : false);

  const owned = subjects.filter(isOwned);
  const available = subjects.filter((s) => !isOwned(s));
  const yearName = (id: string | null) => years.find((y) => y.id === id)?.name;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const pct = subjects.length ? Math.round((owned.length / subjects.length) * 100) : 0;
  // only surface the resume card when the user actually owns that subject
  const resume = recent && owned.some((s) => (s.slug ?? String(s.id)) === recent.slug) ? recent : null;

  if (showSplash) return <SplashScreen />;

  // ── Tool view (SGPA / Attendance / Announcements) ──
  if (tool) {
    const meta = {
      sgpa: { title: "SGPA Calculator", sub: "Estimate your semester grades." },
      attendance: { title: "Attendance Calculator", sub: "Plan how many classes you need." },
      announcements: { title: "Announcements", sub: "Latest updates from the team." },
    }[tool];
    return (
      <AppShell>
        <button onClick={() => setTool(null)} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{meta.title}</h1>
          <p className="text-zinc-400 mt-1">{meta.sub}</p>
        </div>
        <div className="td-surface rounded-[32px] p-6 max-w-4xl">
          {tool === "sgpa" && <SGPACalculator />}
          {tool === "attendance" && <AttendanceCalculator />}
          {tool === "announcements" && <AnnouncementsSection isAdmin={role === "admin"} />}
        </div>
      </AppShell>
    );
  }

  const banners: Banner[] = [
    { key: "library", overline: "Learning", title: "My Subjects", desc: "Open the subjects you own.", cta: "Go to Library",
      accent: "#7c6cf0", icon: BookOpen, onClick: () => navigate("/library") },
    { key: "store", overline: "Subjects", title: "Explore subjects", desc: "Unlock your subjects & full-year packs.", cta: "Explore subjects",
      accent: "#6b8afd", icon: Store, onClick: () => navigate("/store") },
    ...(isOn("agent") ? [{ key: "agent", overline: "Assistant · Chrome + Web", title: "Agent Fury", desc: "Your AI in Gmail, your browser & reminders.", cta: "Open Agent Fury",
      accent: "#7c6cf0", icon: GenAiIcon, img: agentFuryLogo, onClick: () => window.open("https://agentfury.foliofyx.in/", "_blank") }] : []),
    ...(isOn("jobs") ? [{ key: "jobs", overline: "Careers", title: "Placement Prep", desc: "Patterns, materials & questions.", cta: "Open Jobs",
      accent: "#34d399", icon: Briefcase, onClick: () => navigate("/jobs") }] : []),
    // SGPA + Attendance share one tile, split into two tappable halves
    { key: "calcs", overline: "Performance", title: "Calculators", desc: "SGPA & attendance.", cta: "Open",
      accent: "#e879a6", icon: Calculator, onClick: () => navigate("/sgpa-calc"),
      split: [
        { overline: "Performance", title: "SGPA Calc", desc: "Estimate your semester grades.", icon: Calculator, onClick: () => navigate("/sgpa-calc") },
        { overline: "Tracking", title: "Attendance", desc: "Plan the classes you need.", icon: CalendarDays, onClick: () => navigate("/attendance-calc") },
      ] },
    { key: "foliofyx", overline: "Create your website", title: "FolioFYX", desc: "Build a standout portfolio.", cta: "Create Now Free",
      accent: "#f472b6", icon: Globe, logo: fyxLogo, onClick: () => window.open("https://www.foliofyx.in", "_blank") },
    { key: "announcements", overline: "Updates", title: "Announcements", desc: "Latest campus updates.", cta: "View Updates",
      accent: "#f5b042", icon: Megaphone, onClick: () => setTool("announcements") },
  ];

  // only suggest the student's OWN year pack — never another year's
  const studentYearId = matchProfileYear(profile?.semester ?? null, years);
  const comboYear = years.find((y) =>
    y.id === studentYearId && !ownedYearIds.has(y.id) && y.combo_price_paise > 0 && subjects.some((s) => s.year_id === y.id),
  );

  return (
    <AppShell>
      {/* ── 1st anniversary ── */}

      {/* SideNav rail comes from AppShell (global on xl+) */}
      <div className="min-w-0">
          {/* greeting hero — accent energy + a floating book (landing vibe) */}
          <div className="td-hero relative overflow-hidden rounded-[28px] p-6 sm:p-7 mb-8">
            <div aria-hidden className="absolute -top-16 -left-12 w-72 h-64 opacity-[0.5] pointer-events-none"
              style={{ background: "rgb(var(--td-accent-rgb) / 0.24)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(6px)" }} />
            <div aria-hidden className="absolute -bottom-24 right-[26%] w-64 h-60 opacity-[0.4] pointer-events-none hidden sm:block"
              style={{ background: "rgb(var(--td-accent-rgb) / 0.16)", borderRadius: "48% 52% 42% 58% / 50% 58% 42% 50%", filter: "blur(8px)" }} />
            <FloatingBook cover="#1E2B7A" spine="#E0559B" title="DBMS" rot={9} float={1}
              className="absolute -right-5 -bottom-12 w-[150px] lg:w-[180px] z-[1] hidden sm:block pointer-events-none" />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="td-accent-text text-[13px] font-semibold">{greeting} <span aria-hidden>👋</span>
                  <span className="text-zinc-500 font-medium ml-2"><GraduationCap className="w-3.5 h-3.5 inline -mt-0.5" /> {profile?.department} · {profile?.semester}</span>
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight mt-0.5">Hey {profile?.name}.</h1>
              </div>
              {resume && (
                <button onClick={() => navigate(`/subject/${resume.slug}`)}
                  className="group td-glass td-card-click rounded-2xl pl-3 pr-4 py-2.5 flex items-center gap-3 text-left">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgb(var(--td-accent-rgb) / 0.16)", color: "var(--td-accent-soft)" }}>
                    <Play className="w-4 h-4" fill="currentColor" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] font-bold tracking-[0.18em] uppercase text-zinc-500">Continue learning</span>
                    <span className="block text-white text-sm font-semibold truncate max-w-[180px]">{resume.name}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              )}
            </div>
          </div>

          {/* combo strip */}
          {comboYear && (
            <div className="td-hero rounded-3xl p-5 mb-8 flex items-center justify-between gap-4 flex-wrap">
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl td-accent-bg flex items-center justify-center"><Package className="w-5 h-5" /></div>
                <div>
                  <p className="text-white font-semibold">{comboYear.name} — Complete Access</p>
                  <p className="text-zinc-400 text-sm">Unlock every {comboYear.name} subject at once.</p>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <span className="text-white font-bold text-lg">{formatPaise(comboYear.combo_price_paise)}</span>
                {isInCart("combo", comboYear.id) ? (
                  <button onClick={() => navigate("/cart")} className="td-btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5"><Check className="w-4 h-4" /> In cart</button>
                ) : (
                  <button onClick={() => addCombo(comboYear.id, comboYear.name)} className="td-btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add combo</button>
                )}
              </div>
            </div>
          )}

          {/* ── My subjects (reference: "My Courses" rows) ── */}
          <section className="mb-8">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-white font-bold">My subjects</h2>
              {owned.length > 0 && (
                <button onClick={() => navigate("/library")} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
              )}
            </div>
            {owned.length === 0 ? (
              <div className="td-surface rounded-[24px] p-8 text-center">
                <div className="w-12 h-12 rounded-2xl td-surface-2 flex items-center justify-center mx-auto mb-3"><BookOpen className="w-5 h-5 text-zinc-400" /></div>
                <p className="text-white font-semibold">No subjects unlocked yet</p>
                <p className="text-zinc-500 text-sm mt-1 mb-4">Notes, PYQs and Study-With-AI — from {formatPaise(Math.min(...(available.map((s) => s.price_paise).concat([1100]))))}.</p>
                <button onClick={() => navigate("/store")} className="td-btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-1.5">Explore the Store <ArrowRight className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="td-surface rounded-[24px] overflow-hidden">
                {owned.slice(0, 6).map((s) => {
                  const r = getReadiness(s.id);
                  void readyTick;
                  return (
                  <button key={s.id} onClick={() => navigate(`/subject/${s.slug ?? s.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors group">
                    <span className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white/60 font-black" style={{ background: grad(s.name) }}>
                      {s.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-white text-sm font-semibold truncate">{s.name}</span>
                      <span className="block text-zinc-600 text-[11px]">{yearName(s.year_id) ?? "Subject"} · {r.pct > 0 ? `${r.pct}% ready` : "Not started"}</span>
                    </span>
                    {/* mini readiness ring */}
                    <span className="relative w-9 h-9 shrink-0" title={`${r.pct}% ready`}>
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke={readinessColor(r.pct)} strokeWidth="3.5" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 15} strokeDashoffset={2 * Math.PI * 15 * (1 - r.pct / 100)} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-300" style={{ fontVariantNumeric: "tabular-nums" }}>{r.pct}</span>
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors shrink-0" />
                  </button>
                  );
                })}
              </div>
            )}
          </section>
      </div>

      {/* ── Quick access carousel ── */}
      <div className="mt-8">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500">Quick access</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => scrollQuick(-1)} aria-label="Scroll left"
                className="w-8 h-8 rounded-full td-surface-2 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollQuick(1)} aria-label="Scroll right"
                className="w-8 h-8 rounded-full td-surface-2 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div ref={quickRef} className="flex gap-4 overflow-x-auto pt-3 pb-5 pl-2 -mr-4 pr-4 mb-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden">
            {banners.map((b) => (
              b.split ? (
                /* one tile, two independently-tappable halves */
                <div
                  key={b.key}
                  className="td-banner td-banner-bw snap-start shrink-0 w-[248px] sm:w-[268px] h-[248px] sm:h-[268px] rounded-[26px] overflow-hidden flex flex-col text-left"
                >
                  {b.split.map((s, si) => (
                    <button
                      key={s.title}
                      onClick={s.onClick}
                      /* each half owns exactly 50% of the tile; divider uses currentColor
                         so it stays visible whichever way the card inverts */
                      className="td-bw-half relative z-10 h-1/2 px-5 flex items-center gap-3.5 text-left transition-colors"
                      style={si === 0 ? { borderBottom: "1px solid currentColor" } : undefined}
                    >
                      <span className="td-bw-chip w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
                        <s.icon className="w-4.5 h-4.5" strokeWidth={1.7} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="td-bw-soft block text-[9px] font-semibold tracking-[0.22em] uppercase">{s.overline}</span>
                        <span className="block text-[17px] font-semibold leading-tight tracking-tight truncate">{s.title}</span>
                      </span>
                      <span className="td-banner-cta td-bw-chip w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
              <button
                key={b.key}
                onClick={b.onClick}
                className="td-banner td-banner-bw snap-start shrink-0 w-[248px] sm:w-[268px] h-[248px] sm:h-[268px] rounded-[26px] p-5 flex flex-col justify-between text-left"
              >
                <div className="relative z-10">
                  {b.img ? (
                    <img src={b.img} alt="" className="td-bw-mark w-10 h-10 rounded-2xl mb-4 object-contain" draggable={false} />
                  ) : (
                    <div className="td-bw-chip w-10 h-10 rounded-2xl flex items-center justify-center mb-4">
                      <b.icon className="w-4.5 h-4.5" strokeWidth={1.7} />
                    </div>
                  )}
                  <p className="td-bw-soft text-[10px] font-semibold tracking-[0.22em] uppercase mb-1.5">{b.overline}</p>
                  {b.logo ? (
                    <img src={b.logo} alt={b.title} className="td-bw-word h-6 w-auto max-w-[150px] object-contain object-left my-1" draggable={false} />
                  ) : (
                    <h3 className="text-[20px] font-semibold leading-tight tracking-tight">{b.title}</h3>
                  )}
                  <p className="td-bw-soft text-[13px] mt-1.5 leading-relaxed">{b.desc}</p>
                </div>
                <div className="relative z-10 td-banner-cta inline-flex items-center gap-2 text-[13px] font-semibold">
                  {b.cta} <span className="td-bw-chip w-6 h-6 rounded-full flex items-center justify-center"><ArrowRight className="w-3 h-3" /></span>
                </div>
                <b.icon className="td-banner-icon absolute -bottom-6 -right-5 w-32 h-32" style={{ opacity: 0.05 }} strokeWidth={1} />
              </button>
              )
            ))}
          </div>
      </div>

      <Footer />
    </AppShell>
  );
}
