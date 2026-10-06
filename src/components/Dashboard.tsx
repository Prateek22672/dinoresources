import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { tbl, notExpiredFilter, SubjectRow, YearRow } from "@/integrations/supabase/revamp";
import { useCart } from "@/context/CartContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { formatPaise } from "@/lib/money";
import { getRecentSubject, bumpStreak, logActivity, type RecentSubject } from "@/lib/recent";
import { matchProfileYear } from "@/lib/year";

import AppShell from "@/components/layout/AppShell";
import PollCard from "@/components/polls/PollCard";
import DashboardBento from "@/components/dashboard/DashboardBento";
import FanCarousel from "@/components/stacks/FanCarousel";
import SubjectFolderCard, { tone as subjectTone } from "@/components/stacks/SubjectFolderCard";
import SplashScreen, { useMinSplash } from "@/components/layout/SplashScreen";
import AttendanceCalculator from "./AttendanceCalculator";
import SGPACalculator from "./SGPACalculator";
import { AnnouncementsSection } from "./AnnouncementsSection";
import Footer from "./Footer";

import {
  BookOpen, Store, Check, ArrowRight, ArrowLeft, ArrowUpRight, Calculator, CalendarDays, Megaphone, Globe, Briefcase, Code2,
} from "lucide-react";
import fyxLogo from "@/assets/fyx.png";
import { openAgentCoder } from "@/lib/links";

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


// Quick-access card fills — muted dusk gradients, one per destination, so the
// fan reads as a set of distinct places rather than a stack of white tiles.
const QA_TONES: Record<string, [string, string]> = {
  library: ["#6f8fe0", "#1b2350"],
  store: ["#7fc4ad", "#1d4038"],
  agentcoder: ["#f29a6b", "#5a2414"],
  jobs: ["#e6c25e", "#6b4a12"],
  calcs: ["#8b7fd8", "#2c2363"],
  foliofyx: ["#e07a8e", "#4a1830"],
  announcements: ["#9fb6d9", "#2b3f6b"],
};
const qaBg = (key: string) => {
  const [from, to] = QA_TONES[key] ?? ["#7a7f8c", "#22252c"];
  return { background: `linear-gradient(155deg, ${from} 0%, ${to} 100%)` };
};

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

  // bumpStreak/logActivity are kept for their local tracking side effects; the
  // dashboard no longer surfaces streak or activity counters.
  useEffect(() => { setRecent(getRecentSubject()); bumpStreak(); logActivity(); }, []);

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
    { key: "agentcoder", overline: "Free · VS Code · No card", title: "Agent Coder", desc: "Free Claude Code alternative — it builds, runs & tests your code.", cta: "Open in VS Code",
      accent: "#e2733f", icon: Code2, onClick: openAgentCoder },
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

  // only ever the student's OWN year pack — never another year's.
  // Owning it no longer removes the strip: buying the pack used to make the
  // whole row disappear, which reads as "did that work?" rather than as
  // confirmation. It stays and says it is unlocked, the way the store does.
  const studentYearId = matchProfileYear(profile?.semester ?? null, years);
  const comboYear = years.find((y) =>
    y.id === studentYearId && y.combo_price_paise > 0 && subjects.some((s) => s.year_id === y.id),
  );
  const comboOwned = !!comboYear && ownedYearIds.has(comboYear.id);
  // The bento talks about "your year", so it counts only that year's subjects.
  // Counting every year read "14 of 31" beside "every subject is open to you".
  const mine = (list: SubjectRow[]) => (studentYearId ? list.filter((s) => s.year_id === studentYearId) : list);

  return (
    <AppShell>
      {/* ── 1st anniversary ── */}

      {/* SideNav rail comes from AppShell (global on xl+) */}
      <div className="min-w-0">
          {/* Bento opening grid — greeting, shelf, year roadmap, today, tools, Rex */}
          <DashboardBento
            profile={profile}
            greeting={greeting}
            owned={mine(owned)}
            available={mine(available)}
            total={mine(subjects).length}
            resume={resume}
            comboYear={comboYear}
            comboOwned={comboOwned}
            comboInCart={!!comboYear && isInCart("combo", comboYear.id)}
            onAddCombo={() => comboYear && addCombo(comboYear.id, comboYear.name)}
            studyAi={isOn("studyai")}
          />

          {/* ── A slice of the Store, right here ──
              Same cards as Explore Subjects (preview + add to cart) rather than
              a different-looking summary, so the action is identical wherever a
              student meets a subject. Three, then a door to the rest. */}
          {/* Renders nothing unless there is an open poll this student has not
              already answered or dismissed. */}
          <PollCard className="mb-8" />

          {/* Nothing left to buy in this year. Confirm that, rather than
              removing the row — a section that silently disappears after a
              purchase is indistinguishable from one that failed to load, which
              is the moment a student most wants to see that it worked.
              Guarded on owned so an empty catalogue doesn't claim a win. */}
          {available.length === 0 && owned.length > 0 && (
            <section className="mb-8">
              <div className="td-hero rounded-3xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="relative z-10 flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl td-accent-bg flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold">
                      All {owned.length} subject{owned.length === 1 ? "" : "s"} unlocked
                    </p>
                    <p className="text-zinc-400 text-sm">Nothing left to buy — open any of them from your library.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/library")}
                  className="relative z-10 td-btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5 shrink-0"
                >
                  <BookOpen className="w-4 h-4" /> My Library
                </button>
              </div>
            </section>
          )}

          {available.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-white font-bold">Unlock more subjects</h2>
                <button onClick={() => navigate("/store")} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {available.slice(0, 3).map((s, i) => (
                  <SubjectFolderCard
                    key={s.id}
                    subject={s}
                    index={i}
                    owned={false}
                    inCart={isInCart("subject", s.id)}
                    onAdd={() => addSubject(s.id, s.name)}
                  />
                ))}

                {/* the door to the rest */}
                <button
                  onClick={() => navigate("/store")}
                  className="td-surface td-card-click rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-2.5 min-h-[240px]"
                >
                  <span className="w-12 h-12 rounded-2xl td-accent-bg flex items-center justify-center"><Store className="w-5 h-5" /></span>
                  <span className="text-white font-semibold">View all subjects</span>
                  <span className="text-zinc-500 text-xs">
                    {available.length} more to unlock{comboYear ? " · or take the full-year pack" : ""}
                  </span>
                  <span className="td-btn-ghost px-4 py-2 rounded-full text-[13px] font-semibold inline-flex items-center gap-1.5 mt-1">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            </section>
          )}

      </div>

      {/* Returning students get their own subjects first — what they came back
          for shouldn't sit below the promo tiles. New users, with nothing
          unlocked yet, see the tiles first and the store CTA after. */}
      <div className="flex flex-col">
      {/* ── Quick access carousel ── */}
      <div className="mt-8" style={{ order: owned.length > 0 ? 2 : 1 }}>
          {/* A fanned hand of tiles — the front one is live, tap a side one to
              bring it forward. Starts on the second tile so there is a card
              peeking out on both sides from the first frame. */}
          <FanCarousel
            count={banners.length}
            initial={1}
            label={<p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500">Quick access</p>}
            renderCard={(i) => {
              const b = banners[i];
              return (
              b.split ? (
                /* one tile, two independently-tappable halves */
                <div key={b.key} className="td-banner td-qa w-full h-full flex flex-col text-left" style={qaBg(b.key)}>
                  {b.split.map((s, si) => (
                    <button
                      key={s.title}
                      onClick={s.onClick}
                      className={`td-qa-half relative z-10 h-1/2 px-5 flex items-center gap-3.5 text-left ${si === 0 ? "border-b border-white/20" : ""}`}
                    >
                      <span className="td-qa-chip w-11 h-11 rounded-full flex items-center justify-center shrink-0">
                        <s.icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="td-qa-soft block text-[9px] font-bold tracking-[0.22em] uppercase">{s.overline}</span>
                        <span className="block text-[18px] font-bold leading-tight tracking-tight truncate">{s.title}</span>
                      </span>
                      <span className="td-qa-cta w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
              <button key={b.key} onClick={b.onClick}
                className="td-banner td-qa w-full h-full p-5 flex flex-col justify-between text-left" style={qaBg(b.key)}>
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <span className="td-qa-chip w-11 h-11 rounded-full flex items-center justify-center">
                      <b.icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                    </span>
                    <span className="td-qa-chip rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.16em] uppercase max-w-[60%] truncate">{b.overline}</span>
                  </div>
                  {b.logo ? (
                    <img src={b.logo} alt={b.title} className="h-6 w-auto max-w-[150px] object-contain object-left mt-5 mb-1" style={{ filter: "brightness(0) invert(1)" }} draggable={false} />
                  ) : (
                    <h3 className="text-[22px] font-extrabold leading-tight tracking-tight mt-5">{b.title}</h3>
                  )}
                  <p className="td-qa-soft text-[13px] mt-1.5 leading-relaxed line-clamp-2">{b.desc}</p>
                </div>
                <span className="relative z-10 td-qa-cta td-banner-cta self-start inline-flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 text-[12.5px] font-bold">
                  {b.cta} <span className="w-6 h-6 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center"><ArrowRight className="w-3 h-3" /></span>
                </span>
                <b.icon aria-hidden className="td-banner-icon absolute -bottom-7 -right-6 w-36 h-36" style={{ opacity: 0.12 }} strokeWidth={1} />
              </button>
              ));
            }}
          />
      </div>

      {/* ── My subjects — bento: last-opened subject large, the rest as tiles ── */}
      <section className="mt-8" style={{ order: owned.length > 0 ? 1 : 2 }}>
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
          (() => {
            // Bento: the subject you were last in (or your first) as a large
            // accent tile, then up to four more. If there are more than that,
            // the last slot becomes a "+N more" door to the library.
            const lead = owned.find((s) => resume && (s.slug ?? String(s.id)) === resume.slug) ?? owned[0];
            const rest = owned.filter((s) => s.id !== lead.id);
            const more = rest.length > 4 ? rest.length - 3 : 0;
            const small = more ? rest.slice(0, 3) : rest.slice(0, 4);
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <button onClick={() => navigate(`/subject/${lead.slug ?? lead.id}`)}
                  className="td-bento td-bento-accent td-card-click col-span-2 md:row-span-2 relative overflow-hidden p-5 sm:p-6 flex flex-col justify-between text-left min-h-[220px]">
                  <span aria-hidden className="absolute -right-10 -bottom-14 w-[180px] h-[180px] rounded-full td-bento-sphere" />
                  <span className="relative z-10 flex items-center justify-between">
                    <span className="td-bento-ghost rounded-full px-3 py-1 text-[11px] font-bold">
                      {resume && (lead.slug ?? String(lead.id)) === resume.slug ? "Continue" : "Start here"}
                    </span>
                    <span className="w-10 h-10 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center"><ArrowUpRight className="w-4 h-4" /></span>
                  </span>
                  <span className="relative z-10 max-w-[80%]">
                    <span className="block text-[11px] font-semibold opacity-65">{yearName(lead.year_id) ?? "Subject"}</span>
                    <span className="block text-[1.6rem] sm:text-[2rem] font-extrabold tracking-tight leading-[1.05] mt-1 break-words">{lead.name}</span>
                    <span className="block text-[12px] font-medium opacity-70 mt-2">Notes · PYQs · Study with AI</span>
                  </span>
                </button>
                {small.map((s) => {
                  const [from, to] = subjectTone(s.name);
                  return (
                    <button key={s.id} onClick={() => navigate(`/subject/${s.slug ?? s.id}`)}
                      className="td-bento td-surface td-card-click group p-4 flex flex-col justify-between gap-4 text-left min-h-[150px]">
                      <span className="flex items-start justify-between">
                        <span className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[15px] font-extrabold shrink-0"
                          style={{ background: `linear-gradient(160deg, ${from}, ${to})`, textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>
                          {s.name.trim().charAt(0).toUpperCase()}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-white text-[14px] font-semibold leading-snug line-clamp-2">{s.name}</span>
                        <span className="block text-zinc-500 text-[11px] mt-0.5">{yearName(s.year_id) ?? "Subject"}</span>
                      </span>
                    </button>
                  );
                })}
                {more > 0 && (
                  <button onClick={() => navigate("/library")}
                    className="td-bento td-bento-ink td-force-dark td-card-click p-4 flex flex-col justify-between text-left min-h-[150px]">
                    <span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"><BookOpen className="w-4 h-4" /></span>
                    <span>
                      <span className="block text-[1.6rem] font-semibold leading-none">+{more}</span>
                      <span className="block text-[12px] opacity-60 mt-1">more in your library</span>
                    </span>
                  </button>
                )}
              </div>
            );
          })()
        )}
      </section>
      </div>

      <Footer />
    </AppShell>
  );
}
