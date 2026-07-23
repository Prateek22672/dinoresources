import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { tbl, notExpiredFilter, SubjectRow, YearRow } from "@/integrations/supabase/revamp";
import { useCart } from "@/context/CartContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { formatPaise } from "@/lib/money";
import { getRecentSubject, bumpStreak, logActivity, type RecentSubject } from "@/lib/recent";

import AppShell from "@/components/layout/AppShell";
import SplashScreen from "@/components/layout/SplashScreen";
import AnniversaryBanner from "./AnniversaryBanner";
import AttendanceCalculator from "./AttendanceCalculator";
import SGPACalculator from "./SGPACalculator";
import { AnnouncementsSection } from "./AnnouncementsSection";
import Footer from "./Footer";

import {
  BookOpen, Store, Plus, Check, ArrowRight, ArrowLeft, ArrowUpRight, Calculator,
  CalendarDays, Megaphone, Globe, Package, GraduationCap, Briefcase, Bot,
  Play, Flame, TrendingUp,
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

// Deterministic colorful thumbnails for subject cards — SOLID colors only.
const GRADS = ["#7c6cf0", "#f472b6", "#34d399", "#f59e0b", "#6b8afd", "#a78bfa"];
const grad = (name: string) =>
  GRADS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % GRADS.length];

const pad = (n: number) => String(n).padStart(2, "0");

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
  const [activity, setActivity] = useState<string[]>([]);

  // exam countdown (user-set dates)
  interface ExamRow { id: string; title: string; exam_date: string; }
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [pickDay, setPickDay] = useState<number | null>(null);
  const [examTitle, setExamTitle] = useState("");

  const loadExams = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await tbl("user_exams").select("id, title, exam_date")
      .eq("user_id", user.id)
      .gte("exam_date", new Date().toLocaleDateString("en-CA"))
      .order("exam_date", { ascending: true });
    setExams((data ?? []) as ExamRow[]);
  }, []);

  useEffect(() => { setRecent(getRecentSubject()); setStreak(bumpStreak()); setActivity(logActivity()); loadExams(); }, [loadExams]);

  const addExam = async () => {
    if (pickDay == null) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await tbl("user_exams").insert({
      user_id: user.id,
      title: examTitle.trim() || "Exam",
      exam_date: `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(pickDay)}`,
    });
    if (!error) { setExamTitle(""); setPickDay(null); loadExams(); }
  };

  const removeExam = async (id: string) => {
    await tbl("user_exams").delete().eq("id", id);
    setPickDay(null);
    loadExams();
  };

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

  // ── Calendar + productivity data ──
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const startDow = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7; // Mon-first
  const cellIso = (d: number) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(d)}`;
  const todayIso = now.toLocaleDateString("en-CA");
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2), iso: d.toLocaleDateString("en-CA") };
  });

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

  const comboYear = years.find((y) => !ownedYearIds.has(y.id) && y.combo_price_paise > 0 && subjects.some((s) => s.year_id === y.id));

  // ── Exam helpers ──
  const daysTo = (iso: string) =>
    Math.round((new Date(iso + "T00:00:00").getTime() - new Date(todayIso + "T00:00:00").getTime()) / 86_400_000);
  const examOn = (iso: string) => exams.find((e) => e.exam_date === iso);
  const nextExam = exams[0];
  const countdownLabel = (n: number) => (n === 0 ? "Today!" : n === 1 ? "Tomorrow" : `${n} days to go`);
  const urgencyCls = (n: number) =>
    n <= 3 ? "bg-red-500/15 text-red-300" : n <= 7 ? "bg-amber-500/15 text-amber-300" : "td-accent-bg";
  const pickedExam = pickDay != null ? examOn(cellIso(pickDay)) : undefined;

  // ── Right rail cards (also stacked below content on smaller screens) ──
  const rightCards = (
    <>
      {/* Exam calendar — tap a date to mark your exam */}
      <div className="td-surface rounded-[24px] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold text-sm">{monthLabel}</p>
          <CalendarDays className="w-4 h-4 td-accent-text" />
        </div>

        {/* Countdown alert */}
        {nextExam && (
          <div className={`rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2.5 ${urgencyCls(daysTo(nextExam.exam_date))}`}>
            <Flame className="w-4 h-4 shrink-0" />
            <p className="text-[13px] font-semibold leading-tight min-w-0">
              <span className="truncate">{nextExam.title}</span>
              <span className="block text-[11px] font-bold opacity-90">{countdownLabel(daysTo(nextExam.exam_date))}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 text-center">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <span key={d} className="text-[10px] font-semibold text-zinc-500 pb-1">{d}</span>
          ))}
          {Array.from({ length: startDow }).map((_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const iso = cellIso(d);
            const isToday = iso === todayIso;
            const exam = examOn(iso);
            const past = daysTo(iso) < 0;
            const active = activity.includes(iso);
            return (
              <button
                key={d}
                disabled={past && !exam}
                onClick={() => setPickDay(pickDay === d ? null : d)}
                title={exam ? `${exam.title} — tap to manage` : past ? undefined : "Tap to mark an exam"}
                className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full text-[11px] font-medium transition-colors
                  ${exam ? (isToday ? "bg-red-500 text-white font-bold" : "bg-red-500/25 text-red-300 font-bold")
                    : isToday ? "td-accent-solid text-white font-bold"
                    : active ? "td-accent-bg"
                    : past ? "text-zinc-700" : "text-zinc-400 hover:bg-white/10"}
                  ${pickDay === d ? "ring-2 ring-white/40" : ""}`}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Add / manage exam on the picked day */}
        {pickDay != null && (
          <div className="mt-3 td-surface-2 rounded-xl p-3 td-in">
            {pickedExam ? (
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-semibold flex-1 min-w-0 truncate">{pickedExam.title}</p>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${urgencyCls(daysTo(pickedExam.exam_date))}`}>
                  {countdownLabel(daysTo(pickedExam.exam_date))}
                </span>
                <button onClick={() => removeExam(pickedExam.id)} className="text-red-400 text-xs font-semibold hover:text-red-300">Remove</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addExam()}
                  placeholder={`Exam on ${monthLabel.split(" ")[0]} ${pickDay}…`}
                  className="flex-1 min-w-0 bg-transparent border border-white/10 rounded-lg px-2.5 h-8 text-xs text-white outline-none placeholder:text-zinc-600"
                  autoFocus
                />
                <button onClick={addExam} className="td-btn-primary px-3 h-8 text-xs font-bold shrink-0">Add</button>
              </div>
            )}
          </div>
        )}

        {/* Upcoming exams */}
        {pickDay == null && exams.length > 1 && (
          <div className="mt-3 space-y-1.5">
            {exams.slice(1, 3).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-400 truncate">{e.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${urgencyCls(daysTo(e.exam_date))}`}>
                  {countdownLabel(daysTo(e.exam_date))}
                </span>
              </div>
            ))}
          </div>
        )}
        {pickDay == null && exams.length === 0 && (
          <p className="text-zinc-600 text-[11px] mt-3 text-center">Tap a date to mark your exam — we'll count down for you.</p>
        )}
      </div>

      {/* Overall information */}
      <div className="td-surface rounded-[24px] p-5">
        <p className="text-white font-semibold text-sm mb-3">Overall information</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4" /></span>
            <div className="flex-1"><p className="text-zinc-500 text-xs">Library unlocked</p><p className="td-grad-text text-lg font-extrabold w-fit">{pct}%</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl td-surface-2 flex items-center justify-center shrink-0 text-zinc-300"><BookOpen className="w-4 h-4" /></span>
            <div className="flex-1"><p className="text-zinc-500 text-xs">Subjects owned</p><p className="text-white text-lg font-extrabold">{owned.length} <span className="text-zinc-500 text-sm font-medium">/ {subjects.length}</span></p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center shrink-0"><Flame className="w-4 h-4" /></span>
            <div className="flex-1"><p className="text-zinc-500 text-xs">Login streak</p><p className="text-white text-lg font-extrabold">{streak} day{streak === 1 ? "" : "s"}</p></div>
          </div>
        </div>
      </div>

      {/* Productivity */}
      <div className="td-surface rounded-[24px] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold text-sm">Productivity</p>
          <span className="text-zinc-600 text-[11px]">last 7 days</span>
        </div>
        <div className="flex items-end gap-2 h-24">
          {last7.map((d) => {
            const active = activity.includes(d.iso);
            return (
              <div key={d.iso} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                <div className="flex-1 w-full max-w-[18px] mx-auto rounded-full bg-white/6 overflow-hidden flex items-end">
                  <div className={`w-full rounded-full ${active ? "td-grad-bar" : "bg-white/12"}`} style={{ height: active ? "85%" : "16%" }} />
                </div>
                <span className={`text-[9px] font-semibold ${d.iso === todayIso ? "td-accent-text" : "text-zinc-600"}`}>{d.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500"><span className="w-2 h-2 rounded-full td-accent-solid inline-block" /> Studied</span>
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500"><span className="w-2 h-2 rounded-full bg-white/15 inline-block" /> Away</span>
        </div>
      </div>
    </>
  );

  return (
    <AppShell>
      {/* ── 1st anniversary ── */}
      <AnniversaryBanner className="mb-6" />

      {/* SideNav rail comes from AppShell (global on xl+); here: center + right rail */}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_296px] xl:gap-6 items-start">

        {/* ── CENTER ── */}
        <div className="min-w-0">
          {/* compact greeting + resume */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="td-accent-text text-[13px] font-semibold">{greeting} <span aria-hidden>👋</span>
                <span className="text-zinc-500 font-medium ml-2"><GraduationCap className="w-3.5 h-3.5 inline -mt-0.5" /> {profile?.department} · {profile?.semester}</span>
              </p>
              <h1 className="text-2xl sm:text-[1.7rem] font-extrabold tracking-tight text-white leading-tight">Hey {profile?.name}.</h1>
            </div>
            {resume && (
              <button onClick={() => navigate(`/subject/${resume.slug}`)}
                className="group td-surface td-card-click rounded-2xl pl-3 pr-4 py-2.5 flex items-center gap-3 text-left">
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

          {/* ── Top picks (reference: "Top courses you may like") ── */}
          {available.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-white font-bold">Top picks for you</h2>
                <button onClick={() => navigate("/store")} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {available.slice(0, 4).map((s) => {
                  const inCart = isInCart("subject", s.id);
                  return (
                    <div key={s.id} className="td-surface td-card-click rounded-[22px] p-3 flex flex-col">
                      {/* colorful thumb */}
                      <button onClick={() => navigate(`/subject/${s.slug ?? s.id}`)}
                        className="relative h-24 rounded-2xl overflow-hidden mb-3 text-left" style={{ background: grad(s.name) }}>
                        <span className="absolute inset-0 flex items-center justify-center text-white/40 text-5xl font-black select-none">
                          {s.name.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="absolute top-2 left-2 bg-white/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {yearName(s.year_id) ?? "Subject"}
                        </span>
                      </button>
                      <button onClick={() => navigate(`/subject/${s.slug ?? s.id}`)} className="text-left">
                        <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2">{s.name}</h3>
                      </button>
                      <p className="text-zinc-600 text-[11px] mt-0.5 mb-3">5 units · notes · PYQs · AI</p>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="leading-none">
                          <span className="text-white font-bold">{formatPaise(s.price_paise)}</span>
                          <span className="block text-[9px] text-zinc-500 mt-0.5">Lifetime</span>
                        </div>
                        {inCart ? (
                          <button onClick={() => navigate("/cart")} className="td-btn-ghost px-3.5 py-2 text-xs flex items-center gap-1"><Check className="w-3 h-3" /> In cart</button>
                        ) : (
                          <button onClick={() => addSubject(s.id, s.name)} className="td-btn-primary px-3.5 py-2 text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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
                {owned.slice(0, 6).map((s) => (
                  <button key={s.id} onClick={() => navigate(`/subject/${s.slug ?? s.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors group">
                    <span className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white/60 font-black" style={{ background: grad(s.name) }}>
                      {s.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-white text-sm font-semibold truncate">{s.name}</span>
                      <span className="block text-zinc-600 text-[11px]">{yearName(s.year_id) ?? "Subject"} · 5 units</span>
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── Quick access carousel ── */}
          <div className="flex items-baseline justify-between mb-3 px-0.5">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500">Quick access</p>
            <span className="text-[11px] text-zinc-600 hidden sm:block">swipe →</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pt-3 pb-5 pl-2 -mr-4 pr-4 mb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
            {banners.map((b) => (
              <button
                key={b.key}
                onClick={b.onClick}
                className="td-banner td-banner-bw snap-start shrink-0 w-[230px] sm:w-[250px] h-[280px] sm:h-[300px] rounded-[26px] p-5 flex flex-col justify-between text-left"
              >
                <div className="relative z-10">
                  <div className="td-bw-chip w-10 h-10 rounded-2xl flex items-center justify-center mb-4">
                    <b.icon className="w-4.5 h-4.5" strokeWidth={1.7} />
                  </div>
                  <p className="td-bw-soft text-[10px] font-semibold tracking-[0.22em] uppercase mb-1.5">{b.overline}</p>
                  <h3 className="text-[20px] font-semibold leading-tight tracking-tight">{b.title}</h3>
                  <p className="td-bw-soft text-[13px] mt-1.5 leading-relaxed">{b.desc}</p>
                </div>
                <div className="relative z-10 td-banner-cta inline-flex items-center gap-2 text-[13px] font-semibold">
                  {b.cta} <span className="td-bw-chip w-6 h-6 rounded-full flex items-center justify-center"><ArrowRight className="w-3 h-3" /></span>
                </div>
                <b.icon className="td-banner-icon absolute -bottom-6 -right-5 w-32 h-32" style={{ opacity: 0.05 }} strokeWidth={1} />
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT RAIL (xl+) ── */}
        <aside className="hidden xl:flex flex-col gap-4 sticky top-24">
          {rightCards}
        </aside>
      </div>

      {/* right-rail cards stacked for smaller screens */}
      <div className="xl:hidden grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {rightCards}
      </div>

      <Footer />
    </AppShell>
  );
}
