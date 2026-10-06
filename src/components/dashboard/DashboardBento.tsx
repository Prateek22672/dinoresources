import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight, BookOpen, Calculator, CalendarDays, Check, ChevronDown, Plus, Settings2, Store, Layers,
} from "lucide-react";
import type { SubjectRow, YearRow } from "@/integrations/supabase/revamp";
import type { RecentSubject } from "@/lib/recent";
import { formatPaise } from "@/lib/money";

/**
 * The dashboard's opening grid — a bento of tiles in place of the three
 * stacked banners (greeting, Rex, year pack). Every number on it is real:
 * the progress is owned/total, the shelf is the student's own subjects, the
 * date is today. Two tiles take the accent as a fill, one its deep shade,
 * one stays ink-dark; text on fills uses --td-accent-ink so each theme stays
 * readable (white on cobalt, near-black on lime).
 */
export default function DashboardBento({
  profile, greeting, owned, available, total, resume, comboYear, comboOwned, comboInCart, onAddCombo, studyAi,
}: {
  profile: { name: string; department: string; semester: string } | null;
  greeting: string;
  owned: SubjectRow[];
  available: SubjectRow[];
  total: number;
  resume: RecentSubject | null;
  comboYear?: YearRow;
  comboOwned: boolean;
  comboInCart: boolean;
  onAddCombo: () => void;
  studyAi: boolean;
}) {
  const navigate = useNavigate();
  const pct = total > 0 ? Math.round((owned.length / total) * 100) : 0;
  const initials = (profile?.name ?? "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const today = new Date();
  const shelf = (owned.length > 0 ? owned : available).slice(0, 6);
  const resumeTo = resume ? `/subject/${resume.slug}` : owned.length > 0 ? "/library" : "/store";
  const short = (n: string) => n.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]+$/.test(w)).map((w) => w[0]).join("").slice(0, 4).toUpperCase() || n.slice(0, 3).toUpperCase();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 mb-8">
      {/* ── Greeting + progress (accent fill) ── */}
      <section className="td-bento td-bento-accent col-span-2 lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between min-h-[260px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-extrabold shrink-0 td-bento-chip">{initials}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold leading-tight truncate">{greeting} 👋</span>
              <span className="block text-[11px] font-medium opacity-65 truncate">{profile?.department} · {profile?.semester}</span>
            </span>
          </div>
          <button onClick={() => navigate("/setup?edit=true")} aria-label="Edit profile"
            className="w-9 h-9 rounded-full flex items-center justify-center td-bento-ghost shrink-0">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6">
          <h1 className="text-[1.75rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-[1.02] break-words">Hey {profile?.name}.</h1>
          <p className="text-[12px] font-medium opacity-65 mt-1.5">{owned.length > 0 ? "Pick up where you left off." : "Unlock a subject to get started."}</p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
            <span className="opacity-70">Subjects unlocked · {owned.length} of {total}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-[5px] rounded-full td-bento-track overflow-hidden">
            <div className="h-full rounded-full td-bento-fill transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => navigate(resumeTo)}
              className="flex-1 min-w-0 h-11 rounded-full td-bento-ghost px-4 flex items-center gap-2 text-left">
              <BookOpen className="w-4 h-4 shrink-0 opacity-70" />
              <span className="text-[13px] font-semibold truncate flex-1">
                {resume ? <>Continue · {resume.name}</> : owned.length > 0 ? "Open My Library" : "Explore subjects"}
              </span>
              <ChevronDown className="w-4 h-4 -rotate-90 opacity-60 shrink-0" />
            </button>
            <button onClick={() => navigate(resumeTo)} aria-label="Go"
              className="w-11 h-11 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center shrink-0 hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Shelf: the student's subjects as a row of discs ── */}
      <section className="td-bento td-surface col-span-2 lg:col-span-7 p-5 sm:p-6 flex flex-col min-h-[260px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-white text-[1.6rem] sm:text-[1.9rem] font-semibold tracking-tight leading-[1.05]">
              {owned.length > 0 ? <>Your<br />subjects</> : <>Start<br />here</>}
            </h2>
            <p className="text-zinc-500 text-[12px] font-medium mt-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {resume ? <>Last opened · <span className="text-white font-semibold">{resume.name}</span></> : owned.length > 0 ? `${owned.length} unlocked` : "Preview any subject free"}
            </p>
          </div>
          <button onClick={() => navigate(owned.length > 0 ? "/library" : "/store")}
            className="td-surface-2 rounded-full px-3.5 h-8 text-[12px] font-semibold text-white flex items-center gap-1 shrink-0">
            View all <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
          </button>
        </div>

        <div className="mt-auto pt-6 flex gap-2.5 sm:gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden -mx-1 px-1 pb-1">
          {shelf.map((s) => {
            const on = resume ? (s.slug ?? String(s.id)) === resume.slug : false;
            return (
              <button key={s.id} onClick={() => navigate(`/subject/${s.slug ?? s.id}`)} title={s.name}
                className={`shrink-0 w-[74px] h-[74px] sm:w-[86px] sm:h-[86px] rounded-full flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5 ${on ? "td-bento-accent" : "td-surface-2"}`}>
                <span className={`text-[17px] sm:text-[19px] font-bold leading-none ${on ? "" : "text-white"}`}>{short(s.name)}</span>
                <span className={`text-[9px] font-semibold mt-1 max-w-[62px] truncate ${on ? "opacity-70" : "text-zinc-500"}`}>{owned.length > 0 ? s.name : formatPaise(s.price_paise)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Year pack, drawn as a roadmap of what's open vs left ── */}
      <section className="td-bento td-surface col-span-2 lg:col-span-5 lg:row-span-2 p-5 sm:p-6 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-white text-[1.35rem] font-semibold tracking-tight leading-[1.1]">
            {comboYear ? <>{comboYear.name}<br />roadmap</> : <>Your year<br />roadmap</>}
          </h2>
          {comboYear && !comboOwned ? (
            <button onClick={comboInCart ? () => navigate("/cart") : onAddCombo}
              className="rounded-full bg-[#0d0d0d] text-white h-9 px-3.5 text-[12px] font-bold flex items-center gap-1.5 shrink-0">
              {comboInCart ? <><Check className="w-3.5 h-3.5" /> In cart</> : <><Plus className="w-3.5 h-3.5" /> Full year · {formatPaise(comboYear.combo_price_paise)}</>}
            </button>
          ) : (
            <button onClick={() => navigate("/library")}
              className="rounded-full bg-[#0d0d0d] text-white h-9 px-3.5 text-[12px] font-bold flex items-center gap-1.5 shrink-0">
              <BookOpen className="w-3.5 h-3.5" /> My Library
            </button>
          )}
        </div>

        <div className="relative mt-6 flex-1 flex flex-col justify-center gap-3.5">
          {[
            { label: "Unlocked", n: owned.length, hot: true, to: "/library" },
            { label: "Left to unlock", n: available.length, hot: false, to: "/store" },
            { label: "In your year", n: total, hot: false, to: "/store" },
          ].map((r, i) => (
            <button key={r.label} onClick={() => navigate(r.to)}
              className={`h-10 rounded-full flex items-center justify-between pl-4 pr-1.5 text-[12px] font-semibold transition-transform hover:translate-x-0.5 ${r.hot ? "td-bento-accent" : "td-surface-2 text-white"}`}
              // each bar is stepped in like a timeline row, but never past the card edge
              style={{ marginLeft: `${i * 6}%`, width: `min(${Math.max(46, total ? (r.n / total) * 100 : 50)}%, ${100 - i * 6}%)` }}>
              <span className="truncate">{r.label}</span>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${r.hot ? "bg-[#0d0d0d] text-white" : "td-surface text-white"}`}>{r.n}</span>
            </button>
          ))}
        </div>
        <p className="text-zinc-500 text-[11px] font-medium mt-5">
          {comboOwned ? <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5 td-accent-text" /> Every {comboYear?.name} subject is open to you.</span>
            : comboYear ? `Unlock every ${comboYear.name} subject at once.` : "Pick subjects one at a time from the Store."}
        </p>
      </section>

      {/* ── Today ── */}
      <section className="td-bento td-surface col-span-1 lg:col-span-3 p-4 sm:p-5 flex items-center gap-3">
        <span className="w-11 h-11 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center text-[15px] font-extrabold shrink-0">{today.getDate()}</span>
        <span className="min-w-0">
          <span className="block text-white text-[14px] font-bold leading-tight">{today.toLocaleDateString(undefined, { weekday: "short" })},</span>
          <span className="block text-zinc-500 text-[12px] font-medium">{today.toLocaleDateString(undefined, { month: "long" })}</span>
        </span>
      </section>

      {/* ── Count tile (deep accent) ── */}
      <button onClick={() => navigate("/store")}
        className="td-bento td-bento-deep col-span-1 lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between text-left min-h-[112px]">
        <span className="flex items-center gap-2 text-[11px] font-semibold opacity-75">
          <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center"><Layers className="w-3.5 h-3.5" /></span>
          <span className="leading-tight">{available.length > 0 ? "Left to unlock" : "All unlocked"}</span>
        </span>
        <span className="text-[2rem] font-semibold leading-none tracking-tight mt-3">
          {available.length > 0 ? available.length : owned.length}<span className="text-[13px] font-bold opacity-70 ml-1">{available.length > 0 ? "subjects" : "open"}</span>
        </span>
      </button>

      {/* ── Calculators (ink card with an accent wave) ── */}
      <section className="td-bento td-bento-ink td-force-dark col-span-2 sm:col-span-1 lg:col-span-3 p-4 sm:p-5 relative overflow-hidden min-h-[170px] flex flex-col">
        <p className="text-[14px] font-bold relative z-10">Calculators</p>
        <div className="flex flex-wrap gap-1.5 mt-2.5 relative z-10">
          <button onClick={() => navigate("/sgpa-calc")} className="td-bento-inkpill h-7 px-3 rounded-full text-[11px] font-semibold flex items-center gap-1"><Calculator className="w-3 h-3" /> SGPA</button>
          <button onClick={() => navigate("/attendance-calc")} className="td-bento-inkpill h-7 px-3 rounded-full text-[11px] font-semibold flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Attendance</button>
        </div>
        <svg aria-hidden viewBox="0 0 200 70" preserveAspectRatio="none" className="absolute left-0 right-0 bottom-0 w-full h-[58%]">
          <path d="M0 48 C 14 30, 22 58, 36 44 S 58 22, 72 40 S 96 60, 110 38 S 132 18, 146 36 S 170 56, 184 30 S 196 26, 200 28 L200 70 L0 70 Z" fill="rgb(var(--td-accent-rgb) / 0.22)" />
          <path d="M0 48 C 14 30, 22 58, 36 44 S 58 22, 72 40 S 96 60, 110 38 S 132 18, 146 36 S 170 56, 184 30 S 196 26, 200 28" fill="none" stroke="var(--td-accent)" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="absolute left-1/2 top-[46%] -translate-x-1/2 z-10 bg-white text-black rounded-full px-2.5 py-0.5 text-[10px] font-extrabold shadow">free</span>
      </section>

      {/* ── Rex / Store (accent fill + sphere) ── */}
      <button onClick={() => navigate(studyAi ? resumeTo : "/store")}
        className="td-bento td-bento-accent col-span-2 sm:col-span-1 lg:col-span-4 p-4 sm:p-5 relative overflow-hidden min-h-[170px] flex flex-col justify-between text-left">
        <span className="w-9 h-9 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center relative z-10"><ArrowUpRight className="w-4 h-4" /></span>
        <span aria-hidden className="absolute -right-8 -bottom-12 w-[190px] h-[190px] rounded-full td-bento-sphere" />
        <span className="relative z-10">
          {studyAi ? (
            <>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">Study with AI</span>
              <span className="block text-[17px] font-extrabold leading-[1.1] mt-0.5">Meet Rex,<br />your tutor</span>
            </>
          ) : (
            <>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">Store</span>
              <span className="block text-[17px] font-extrabold leading-[1.1] mt-0.5 flex items-center gap-1.5"><Store className="w-4 h-4" /> Explore<br />subjects</span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}
