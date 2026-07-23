import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { tbl, notExpiredFilter, SubjectRow, YearRow } from "@/integrations/supabase/revamp";
import { useCart } from "@/context/CartContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { formatPaise } from "@/lib/money";
import { getRecentSubject, bumpStreak, type RecentSubject } from "@/lib/recent";

import AppShell from "@/components/layout/AppShell";
import SplashScreen from "@/components/layout/SplashScreen";
import AnniversaryBanner from "./AnniversaryBanner";
import AttendanceCalculator from "./AttendanceCalculator";
import SGPACalculator from "./SGPACalculator";
import { AnnouncementsSection } from "./AnnouncementsSection";
import Footer from "./Footer";

import {
  BookOpen, Library, Store, Plus, Check, ArrowRight, ArrowLeft, ArrowUpRight, Calculator,
  CalendarDays, Megaphone, Globe, Package, Sparkles, GraduationCap, Briefcase, Bot,
  Play, Flame,
} from "lucide-react";

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
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const { addSubject, addCombo, isInCart } = useCart();
  const { isOn } = useFeatureFlags();

  const [profile, setProfile] = useState<{ name: string; department: string; semester: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [years, setYears] = useState<YearRow[]>([]);
  const [ownedSubjectIds, setOwnedSubjectIds] = useState<Set<string>>(new Set());
  const [ownedYearIds, setOwnedYearIds] = useState<Set<string>>(new Set());
  const [tool, setTool] = useState<ToolView>(null);
  const [recent, setRecent] = useState<RecentSubject | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => { setRecent(getRecentSubject()); setStreak(bumpStreak()); }, []);

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

  if (loading) return <SplashScreen />;

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
    { key: "store", overline: "Marketplace", title: "Store", desc: "Unlock subjects & year combos.", cta: "Browse Store",
      accent: "#6b8afd", icon: Store, onClick: () => navigate("/store") },
    ...(isOn("jobs") ? [{ key: "jobs", overline: "Careers", title: "Placement Prep", desc: "Patterns, materials & questions.", cta: "Open Jobs",
      accent: "#34d399", icon: Briefcase, onClick: () => navigate("/jobs") }] : []),
    ...(isOn("agent") ? [{ key: "agent", overline: "Assistant", title: "Agent Fury", desc: "Create your agents — e.g. email fetch & summarizer.", cta: "Launch",
      accent: "#7c6cf0", icon: Bot, onClick: () => window.open("https://agentfury.foliofyx.in/", "_blank") }] : []),
    { key: "sgpa", overline: "Performance", title: "SGPA Calc", desc: "Estimate your semester grades.", cta: "Open Calculator",
      accent: "#e879a6", icon: Calculator, onClick: () => navigate("/sgpa-calc") },
    { key: "attendance", overline: "Tracking", title: "Attendance", desc: "Plan the classes you need.", cta: "Check Attendance",
      accent: "#34d399", icon: CalendarDays, onClick: () => navigate("/attendance-calc") },
    { key: "announcements", overline: "Updates", title: "Announcements", desc: "Latest campus updates.", cta: "View Updates",
      accent: "#f5b042", icon: Megaphone, onClick: () => setTool("announcements") },
    { key: "foliofyx", overline: "Create your website", title: "FolioFYX", desc: "Build a standout portfolio.", cta: "Create Now Free",
      accent: "#f472b6", icon: Globe, onClick: () => window.open("https://www.foliofyx.in", "_blank") },
  ];

  return (
    <AppShell>
      {/* ── 1st anniversary ── */}
      <AnniversaryBanner className="mb-6" />

      {/* ── Welcome hero — depth (radial glow + grain) with a live progress panel ── */}
      <section className="td-hero td-in rounded-[28px] p-6 sm:p-9 mb-7">
        <div className="relative z-10 grid lg:grid-cols-[1.4fr_.85fr] gap-7 lg:gap-10 items-center">
          {/* Left — greeting, resume, actions */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="td-accent-text text-sm font-semibold">{greeting}</span>
              <span className="text-base" aria-hidden>👋</span>
              <span className="td-glass inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-zinc-400">
                <GraduationCap className="w-3.5 h-3.5" /> {profile?.department} · {profile?.semester}
              </span>
            </div>

            <h1 className="text-[2rem] sm:text-[2.6rem] font-extrabold tracking-tight leading-[1.05] text-white">
              Hey {profile?.name}.
            </h1>
            <p className="text-zinc-400 mt-3 max-w-md leading-relaxed">
              {resume
                ? "Jump back into your last subject, or unlock something new."
                : owned.length > 0
                  ? "Your subjects are ready — pick one up and keep the streak alive."
                  : "Unlock your first subject to access notes, PYQs and Study-With-AI."}
            </p>

            {/* Resume card — the primary next-action */}
            {resume && (
              <button
                onClick={() => navigate(`/subject/${resume.slug}`)}
                className="group mt-6 w-full sm:max-w-md td-surface td-card-click rounded-2xl p-3.5 flex items-center gap-3 text-left"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgb(var(--td-accent-rgb) / 0.16)", color: "var(--td-accent-soft)" }}>
                  <Play className="w-5 h-5" fill="currentColor" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500">Continue learning</p>
                  <p className="text-white font-semibold truncate">{resume.name}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5 mt-6">
              {owned.length > 0 ? (
                <button onClick={() => navigate("/library")} className="td-btn-primary px-5 py-3 text-sm flex items-center gap-1.5">
                  <Library className="w-4 h-4" /> {resume ? "My Library" : "Start learning"}
                </button>
              ) : (
                <button onClick={() => navigate("/store")} className="td-btn-primary px-5 py-3 text-sm flex items-center gap-1.5">
                  <Store className="w-4 h-4" /> Browse Store
                </button>
              )}
              {owned.length > 0 && (
                <button onClick={() => navigate("/store")} className="td-btn-ghost px-5 py-3 text-sm flex items-center gap-1.5">
                  <Store className="w-4 h-4" /> Browse Store
                </button>
              )}
            </div>
          </div>

          {/* Right — live progress panel (fills the space, adds "alive" feel) */}
          <div className="td-glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-5">
              {/* progress ring */}
              <div className="relative w-[120px] h-[120px] shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(var(--td-accent-rgb) / 0.16)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="url(#tdRing)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - pct / 100)}
                    style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }}
                  />
                  <defs>
                    <linearGradient id="tdRing" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--td-accent-soft)" />
                      <stop offset="100%" stopColor="var(--td-accent)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="td-grad-text text-2xl font-extrabold leading-none">{pct}%</span>
                  <span className="text-[10px] text-zinc-500 mt-1">unlocked</span>
                </div>
              </div>
              {/* stat tiles */}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgb(var(--td-accent-rgb) / 0.16)", color: "var(--td-accent-soft)" }}>
                    <Flame className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold leading-none">{streak} day{streak === 1 ? "" : "s"}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Login streak</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl td-surface-2 flex items-center justify-center shrink-0 text-zinc-300">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold leading-none">{owned.length} <span className="text-zinc-500 font-medium text-sm">/ {subjects.length}</span></p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Subjects owned</p>
                  </div>
                </div>
              </div>
            </div>

            {/* footer chips */}
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/8">
              <span className="td-surface-2 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> {ownedYearIds.size} combo{ownedYearIds.size === 1 ? "" : "s"}
              </span>
              <button onClick={() => navigate("/store")} className="td-surface-2 td-card-click rounded-full px-3 py-1.5 text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" /> {available.length} to unlock
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick access ── */}
      <div className="flex items-baseline justify-between mb-3 px-0.5">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500">Quick access</p>
        <span className="text-[11px] text-zinc-600 hidden sm:block">swipe →</span>
      </div>
      {/* ── Banner cards ── */}
      <div className="flex gap-4 overflow-x-auto pt-3 pb-5 pl-2 -mr-4 pr-4 mb-9 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
        {banners.map((b) => (
          <button
            key={b.key}
            onClick={b.onClick}
            className="td-banner td-banner-bw snap-start shrink-0 w-[248px] sm:w-[280px] h-[300px] sm:h-[340px] rounded-[28px] p-6 flex flex-col justify-between text-left"
          >
            <div className="relative z-10">
              {/* chip inverts against the card */}
              <div className="td-bw-chip w-11 h-11 rounded-2xl flex items-center justify-center mb-5">
                <b.icon className="w-5 h-5" strokeWidth={1.7} />
              </div>
              <p className="td-bw-soft text-[10px] font-semibold tracking-[0.22em] uppercase mb-2">{b.overline}</p>
              <h3 className="text-[22px] font-semibold leading-tight tracking-tight">{b.title}</h3>
              <p className="td-bw-soft text-sm mt-2 leading-relaxed">{b.desc}</p>
            </div>

            <div className="relative z-10 td-banner-cta inline-flex items-center gap-2 text-sm font-semibold">
              {b.cta} <span className="td-bw-chip w-7 h-7 rounded-full flex items-center justify-center"><ArrowRight className="w-3.5 h-3.5" /></span>
            </div>

            <b.icon className="td-banner-icon absolute -bottom-6 -right-5 w-36 h-36" style={{ opacity: 0.05 }} strokeWidth={1} />
          </button>
        ))}
      </div>

      {/* ── My Library ── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Library className="w-5 h-5 td-accent-text" /> My Library</h2>
          {owned.length > 0 && (
            <button onClick={() => navigate("/library")} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {owned.length === 0 ? (
          <div className="td-surface rounded-[28px] p-8 sm:p-10 text-center">
            <div className="w-14 h-14 rounded-2xl td-surface-2 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-white font-semibold text-lg">No subjects unlocked yet</h3>
            <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto">
              Each subject includes a syllabus, 5 units of notes &amp; Study-With-AI, and previous year questions.
            </p>
            <button onClick={() => navigate("/store")} className="td-btn-primary px-6 py-3 text-sm mt-5 inline-flex items-center gap-2">
              Explore the Store <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {owned.slice(0, 8).map((s) => (
              <button key={s.id} onClick={() => navigate(`/subject/${s.slug ?? s.id}`)} className="td-surface td-card-click rounded-2xl p-5 text-left">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl td-surface-2 flex items-center justify-center mb-3"><BookOpen className="w-4.5 h-4.5 text-zinc-300" /></div>
                  <ArrowUpRight className="td-go w-4 h-4" />
                </div>
                <h3 className="text-white font-semibold leading-snug line-clamp-2">{s.name}</h3>
                <p className="text-zinc-600 text-xs mt-1.5">{yearName(s.year_id) ?? "Subject"} · 5 units</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Unlock more ── */}
      {available.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 td-accent-text" /> Unlock more</h2>
            <button onClick={() => navigate("/store")} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
              Full store <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {years.filter((y) => !ownedYearIds.has(y.id) && subjects.some((s) => s.year_id === y.id)).slice(0, 1).map((y) => (
            <div key={y.id} className="td-hero rounded-3xl p-5 sm:p-6 mb-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl td-surface-2 flex items-center justify-center"><Package className="w-5 h-5 td-accent-text" /></div>
                <div>
                  <p className="text-white font-semibold">{y.name} — Complete Access</p>
                  <p className="text-zinc-400 text-sm">Unlock every {y.name} subject at once.</p>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <span className="text-white font-bold text-lg">{formatPaise(y.combo_price_paise)}</span>
                {isInCart("combo", y.id) ? (
                  <button onClick={() => navigate("/cart")} className="td-btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5"><Check className="w-4 h-4" /> In cart</button>
                ) : (
                  <button onClick={() => addCombo(y.id, y.name)} className="td-btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add combo</button>
                )}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {available.slice(0, 8).map((s) => {
              const inCart = isInCart("subject", s.id);
              return (
                <div key={s.id} className="td-surface rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-2xl td-surface-2 flex items-center justify-center mb-3"><BookOpen className="w-4.5 h-4.5 text-zinc-300" /></div>
                      <div className="text-right leading-none">
                        <span className="text-white font-bold">{formatPaise(s.price_paise)}</span>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Lifetime</p>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/subject/${s.slug ?? s.id}`)} className="block text-left">
                      <h3 className="text-white font-semibold leading-snug line-clamp-2 hover:underline">{s.name}</h3>
                    </button>
                    <p className="text-zinc-600 text-xs mt-1">{yearName(s.year_id) ?? "Subject"} · 5 units</p>
                  </div>
                  <div className="mt-4">
                    {inCart ? (
                      <button onClick={() => navigate("/cart")} className="w-full td-btn-ghost py-2.5 text-[13px] flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" /> In cart</button>
                    ) : (
                      <button onClick={() => addSubject(s.id, s.name)} className="w-full td-btn-primary py-2.5 text-[13px] flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add to cart</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Footer />
    </AppShell>
  );
}
