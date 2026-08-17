import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, Calculator, Briefcase, ChevronDown, Check, Sparkles, BookOpen,
} from "lucide-react";
import Footer from "./Footer";
import { AiIcon } from "@/components/BrandIcons";
import dinoLogo from "@/assets/dinosaurWhite.png";
import dinoBlack from "@/assets/dinosaurBlack.png";
import agentFuryLogo from "@/assets/icon-192.png";
import fyxLogo from "@/assets/fyx.png";

// Agent Fury links. The extension is in Chrome Web Store review — flip
// AGENTFURY_EXT_LIVE to true and drop in the URL once it's published.
const AGENTFURY_WEB = "https://agentfury.foliofyx.in/";
const AGENTFURY_EXT_LIVE = false;
const AGENTFURY_EXT = "https://chromewebstore.google.com/"; // TODO: real listing when live

/* Cursor-follow: elements drift toward/away from the mouse at their own
 * strengths, smoothly lerped (springy, 60fps, transform-only). */
function useMouseFloat(strengths: { x: number; y: number; r: number }[]) {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = { x: 0, y: 0 };
    const cur = strengths.map(() => ({ x: 0, y: 0 }));
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = e.clientY / window.innerHeight - 0.5;
    };
    const onLeave = () => { target.x = 0; target.y = 0; };
    const tick = () => {
      els.current.forEach((el, i) => {
        if (!el) return;
        const s = strengths[i];
        cur[i].x += (target.x * s.x - cur[i].x) * 0.055;
        cur[i].y += (target.y * s.y - cur[i].y) * 0.055;
        el.style.transform = `translate(${cur[i].x.toFixed(2)}px, ${cur[i].y.toFixed(2)}px) rotate(${(cur[i].x * s.r).toFixed(3)}deg)`;
      });
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return els;
}

/* Hero scroll FX: content fades up, frames drift at their own depths. */
function useHeroParallax(depths: number[]) {
  const contentRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (contentRef.current) {
          contentRef.current.style.transform = `translateY(${y * 0.24}px)`;
          contentRef.current.style.opacity = String(Math.max(0, 1 - y / 560));
        }
        frameRefs.current.forEach((el, i) => {
          if (el) el.style.transform = `translateY(${y * depths[i]}px)`;
        });
        if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - y / 160));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { contentRef, cueRef, frameRefs };
}

/* ─── Scroll reveal ──────────────────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Animated counter ───────────────────────────────────────── */
function useCounter(target: number, active: boolean, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

/* ─── Data ───────────────────────────────────────────────────── */
const STATS = [
  { value: 1500, suffix: "+", label: "Signups" },
  { value: 89, suffix: "%", label: "Found it useful" },
  { value: 15, suffix: "+", label: "Subjects covered" },
  { value: 2, suffix: "AM", label: "We're still here" },
];

const MARQUEE = [
  "DBMS", "Computer Organization", "Artificial Intelligence", "Operating Systems",
  "Software Engineering", "Compiler Design", "FLAT", "Data Structures", "DAA",
  "Computer Networks", "Machine Learning", "OOPs with Java",
];

const QUOTES = [
  { text: "Found the exact PYQs at 1AM the night before my DBMS external. Passed with room to spare.", who: "Priya · CSE, 3rd year" },
  { text: "The AI answers actually follow our units. I stopped wrestling with ChatGPT prompts completely.", who: "Rahul · ECE, 2nd year" },
  { text: "Full year, every subject, for less than one photocopy run. I checked the price twice.", who: "Sneha · CSE, 4th year" },
];

const FAQS = [
  { q: "Is TeamDino free?", a: "The calculators (SGPA, CGPA predictor, attendance) are 100% free with no login. Subject packs — notes, PYQs, Study-With-AI — start at ₹11, with full-year packs that cost less than a plate of biryani." },
  { q: "What's inside a subject pack?", a: "Syllabus, 5 units of curated notes, previous year questions, videos, and Study-With-AI answers organised topic by topic. Access unlocks instantly after payment." },
  { q: "What's a full-year pack?", a: "Every subject in your year for one price. If you'll need more than two subjects, the full-year pack always wins." },
  { q: "I paid but can't access — what now?", a: "Tap Instant Help inside the app — DinoBot files a support ticket for you and the team resolves it within 24 hours." },
  { q: "Which college is this for?", a: "Built by and for GITAM students — the grade chart, units and PYQs match GITAM's actual pattern." },
];

/* Pinned showcase steps (Fluently-style: one scroll, panel swaps in place) */
const SHOW = [
  {
    eyebrow: "Study With AI",
    title: "PYQs and practice questions, answered",
    desc: "Every question organised unit by unit, each with a clear AI-written answer — so you're revising with what's actually been asked, not guessing at a chatbot prompt.",
    ctas: [{ label: "Get started free", to: "/auth" }],
  },
  {
    eyebrow: "Free tools",
    title: "Know exactly where you stand",
    desc: "SGPA calculator, CGPA predictor and attendance planner. Free forever, no login, no card.",
    ctas: [{ label: "SGPA Calc", to: "/sgpa-calc" }, { label: "Attendance Calc", to: "/attendance-calc" }],
  },
  {
    eyebrow: "Placement prep",
    title: "Walk into interviews ready",
    desc: "Exam patterns, curated materials and previous questions — organised company by company.",
    ctas: [{ label: "Explore placement prep", to: "/jobs" }],
  },
];

/* Final stacked-scroll cards — hand-illustrated, hero-style (no stock photos) */
const STACK = [
  {
    title: "Find the right notes in seconds",
    desc: "No more digging through 10 WhatsApp groups and dead drive links — every subject lives in one organised place.",
    icon: BookOpen,
    bg: "#FFB61E",
    dark: false,
  },
  {
    title: "Walk into exams calm",
    desc: "PYQs tell you what's coming, Study-With-AI has them answered already, and the exam countdown keeps you honest.",
    icon: Sparkles,
    bg: "#131316",
    dark: true,
  },
  {
    title: "Track SGPA & attendance without guesswork",
    desc: "Predict your CGPA, plan the classes you can skip, and always know exactly where you stand.",
    icon: Calculator,
    bg: "#ffffff",
    dark: false,
  },
  {
    title: "Crack placements company by company",
    desc: "Patterns, materials and real questions for the companies that actually visit campus.",
    icon: Briefcase,
    bg: "#0F9D9A",
    dark: true,
  },
];

/* Per-card illustration scenes for the stack — built from the hero's own parts */
function StackArt({ i }: { i: number }) {
  if (i === 0)
    return (
      <>
        {/* yellow card: blobs + two hardcovers spilling out of the corner */}
        <div aria-hidden className="absolute -top-14 -left-10 w-64 h-56" style={{ background: "#FCD34D", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%" }} />
        <div aria-hidden className="absolute -bottom-20 left-[38%] w-72 h-64" style={{ background: "#FDE68A", borderRadius: "48% 52% 42% 58% / 50% 58% 42% 50%" }} />
        <div aria-hidden className="absolute right-32 -bottom-24 w-[190px] rotate-[9deg] hidden lg:block">
          <BookMock cover="#0F9D9A" spine="#0B7A78" title="COA" />
        </div>
        <div aria-hidden className="absolute -right-8 -bottom-12 w-[235px] rotate-[-10deg] hidden sm:block">
          <BookMock cover="#1E2B7A" spine="#E0559B" title="DBMS" />
        </div>
      </>
    );
  if (i === 1)
    return (
      <>
        {/* dark card: floating countdown widget + progress sticker */}
        <div aria-hidden className="absolute -top-16 -right-12 w-64 h-56" style={{ background: "#1d1d23", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%" }} />
        <div aria-hidden className="absolute right-8 sm:right-12 top-1/2 -translate-y-1/2 hidden md:block w-[240px]">
          <div className="bg-white text-black rounded-[22px] p-4 rotate-[3deg] shadow-2xl">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">DBMS · External</div>
            <div className="text-3xl font-black mt-1 leading-none">12 days <span className="text-sm font-bold text-zinc-500">to go</span></div>
            <div className="grid grid-cols-7 gap-1.5 mt-3.5">
              {Array.from({ length: 21 }).map((_, d) => (
                <span key={d} className="h-2.5 rounded-full" style={{ background: d === 16 ? "#FFB61E" : "#e4e4e7" }} />
              ))}
            </div>
          </div>
          <div className="bg-[#FFB61E] text-black rounded-full px-4 py-2 text-[13px] font-extrabold w-max mt-3 ml-5 -rotate-2 shadow-xl flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Syllabus 80% done
          </div>
        </div>
      </>
    );
  if (i === 2)
    return (
      <>
        {/* white card: soft blob + ring gauge + attendance sticker */}
        <div aria-hidden className="absolute -bottom-16 -right-10 w-72 h-64" style={{ background: "#FFF3D6", borderRadius: "48% 52% 42% 58% / 50% 58% 42% 50%" }} />
        <div aria-hidden className="absolute right-10 sm:right-16 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center">
          <svg viewBox="0 0 100 100" className="w-40 h-40 drop-shadow-xl">
            <circle cx="50" cy="50" r="42" fill="#ffffff" />
            <circle cx="50" cy="50" r="42" stroke="#eeede8" strokeWidth="9" fill="none" />
            <circle cx="50" cy="50" r="42" stroke="#0F9D9A" strokeWidth="9" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * 0.13} transform="rotate(-90 50 50)" />
            <text x="50" y="50" textAnchor="middle" fill="#0a0a0a" fontWeight="900" fontSize="24">8.7</text>
            <text x="50" y="65" textAnchor="middle" fill="#71717a" fontWeight="700" fontSize="9">SGPA</text>
          </svg>
          <div className="bg-black text-white rounded-full px-4 py-2 text-[13px] font-extrabold mt-2 rotate-2 shadow-xl">Can skip 2 classes — still 76%</div>
        </div>
      </>
    );
  return (
    <>
      {/* teal card: campus-drive widget + shortlist sticker */}
      <div aria-hidden className="absolute -top-16 -left-12 w-64 h-56" style={{ background: "#0B7A78", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%" }} />
      <div aria-hidden className="absolute right-8 sm:right-12 top-1/2 -translate-y-1/2 hidden md:block w-[250px]">
        <div className="bg-white text-black rounded-[22px] p-4 -rotate-2 shadow-2xl">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">This season on campus</div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {["TCS", "Infosys", "Wipro", "Accenture"].map((n) => (
              <span key={n} className="bg-black text-white rounded-full px-3 py-1 text-[12px] font-bold">{n}</span>
            ))}
          </div>
          <div className="mt-3 text-[13px] font-semibold text-zinc-600">Pattern · Aptitude · 40 real PYQs</div>
        </div>
        <div className="bg-[#FFB61E] text-black rounded-full px-4 py-2 text-[13px] font-extrabold w-max mt-3 ml-8 rotate-2 shadow-xl">Shortlisted — Round 2</div>
      </div>
    </>
  );
}

/* ─── Pinned showcase (sticky panel, steps swap on one continuous scroll) ─── */
function PinnedShowcase() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  // Set-based registry — the desktop AND mobile step elements both drive `active`
  const refs = useRef<Set<HTMLElement>>(new Set());
  const register = (i: number) => (el: HTMLElement | null) => {
    if (el) { el.dataset.idx = String(i); refs.current.add(el); }
  };

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { threshold: 0.45 },
    );
    refs.current.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const mocks = [
    /* AI chat mock */
    <div key="ai" className="space-y-3 w-full">
      <div className="bg-white text-black rounded-2xl rounded-br-md px-4 py-3 text-sm font-medium ml-auto w-fit max-w-[85%]">Explain normalization with an example.</div>
      <div className="bg-white/[0.07] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-zinc-200 max-w-[90%] leading-relaxed">
        Normalization removes redundancy by splitting data into related tables. 1NF = atomic values only. 2NF = no partial dependency. 3NF = no transitive dependency…
      </div>
      <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-semibold"><AiIcon className="w-3.5 h-3.5" /> Unit 3 · DBMS — a real PYQ, answered</div>
    </div>,
    /* SGPA mock — ring gauge + graded subjects + goal line */
    <div key="tools" className="w-full">
      <div className="flex items-center justify-center gap-6">
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--td-accent)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - 0.87)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-white leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>8.7</span>
            <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 uppercase mt-1">SGPA</span>
          </div>
        </div>
        <div className="min-w-0">
          <span className="td-accent-bg inline-block px-2.5 py-1 rounded-full text-[11px] font-bold">Excellent</span>
          <p className="text-zinc-500 text-xs mt-2.5">Predicted this semester</p>
          <p className="text-zinc-300 text-xs mt-1">Need <strong className="text-white">9.2 avg</strong> for a 9.0 CGPA</p>
        </div>
      </div>

      <div className="mt-6 space-y-3.5">
        {([["DBMS", "O", 92, "#34d399"], ["COA", "A+", 78, "var(--td-accent)"], ["FLAT", "B+", 64, "#f59e0b"]] as const).map(([n, g, v, c]) => (
          <div key={n}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-xs text-zinc-300 font-semibold">
                <span className="w-6 h-6 rounded-md text-[10px] font-black text-white flex items-center justify-center" style={{ background: c }}>{g}</span>
                {n}
              </span>
              <span className="text-xs text-zinc-500" style={{ fontVariantNumeric: "tabular-nums" }}>{v}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${v}%`, background: c }} />
            </div>
          </div>
        ))}
      </div>
    </div>,
    /* Placement mock */
    <div key="prep" className="w-full space-y-2.5">
      {[["TCS NQT", "Pattern · 40 questions"], ["Infosys", "Materials · 12 sets"], ["Wipro", "PYQs · 3 rounds"]].map(([c, m]) => (
        <div key={c} className="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3.5">
          <span className="w-9 h-9 rounded-xl bg-white text-black font-black flex items-center justify-center text-sm">{(c as string).charAt(0)}</span>
          <div className="min-w-0"><p className="text-white text-sm font-bold">{c}</p><p className="text-zinc-500 text-[11px]">{m}</p></div>
          <ArrowRight className="w-4 h-4 text-zinc-600 ml-auto" />
        </div>
      ))}
    </div>,
  ];

  return (
    <section className="relative z-10 bg-[#F6F4EF] rounded-[44px] mx-3 sm:mx-5 my-12 text-black">
      <div className="max-w-6xl mx-auto px-5">
      {/* Desktop: pinned panel + scrolling steps (one continuous scroll) */}
      <div className="hidden lg:grid grid-cols-2 gap-16">
        {/* steps — normal flow, drive the active state */}
        <div>
          {SHOW.map((s, i) => (
            <div key={s.eyebrow} ref={register(i)}
              className="min-h-[88vh] flex flex-col justify-center">
              <p className="text-[12px] font-black tracking-[0.28em] uppercase mb-4" style={{ color: "var(--td-accent-strong)" }}>{s.eyebrow}</p>
              <h2 className={`text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.05] transition-opacity duration-300 ${active === i ? "opacity-100" : "opacity-40"}`}>{s.title}</h2>
              <p className="text-zinc-600 text-lg leading-relaxed max-w-md mt-5">{s.desc}</p>
              <div className="flex flex-wrap gap-2.5 mt-7">
                {s.ctas.map((c) => (
                  <button key={c.to} onClick={() => navigate(c.to)} className="bg-black text-white rounded-full h-11 px-6 text-sm font-bold flex items-center gap-2 hover:scale-[1.03] active:scale-[0.99] transition-transform">
                    {c.label} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* pinned mock panel */}
        <div className="relative">
          <div className="sticky top-0 h-screen flex items-center">
            <div className="w-full bg-[#131316] border border-white/10 rounded-[32px] p-8 min-h-[420px] flex items-center shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] relative overflow-hidden">
              {mocks.map((m, i) => (
                <div key={i} className="absolute inset-8 flex items-center transition-all duration-500"
                  style={{ opacity: active === i ? 1 : 0, transform: active === i ? "translateY(0)" : "translateY(16px)", pointerEvents: active === i ? "auto" : "none" }}>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: SAME pinned experience — mock panel sticks under the header, steps scroll beneath and swap it */}
      <div className="lg:hidden py-4">
        <div className="sticky top-[4.6rem] z-20 -mx-5 px-4 pb-3" style={{ background: "#F6F4EF" }}>
          <div className="bg-[#131316] border border-white/10 rounded-[24px] p-5 min-h-[300px] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.6)] relative overflow-hidden flex items-center">
            {mocks.map((m, i) => (
              <div key={i} className="absolute inset-5 flex items-center transition-all duration-500"
                style={{ opacity: active === i ? 1 : 0, transform: active === i ? "translateY(0)" : "translateY(14px)", pointerEvents: active === i ? "auto" : "none" }}>
                {m}
              </div>
            ))}
          </div>
          {/* step dots */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {SHOW.map((_, i) => (
              <span key={i} className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: active === i ? 20 : 6, background: active === i ? "var(--td-accent-strong)" : "rgba(0,0,0,0.18)" }} />
            ))}
          </div>
        </div>

        {SHOW.map((s, i) => (
          <div key={s.eyebrow} ref={register(i)} className="min-h-[62vh] flex flex-col justify-center py-8">
            <p className="text-[11px] font-black tracking-[0.25em] uppercase mb-2" style={{ color: "var(--td-accent-strong)" }}>{s.eyebrow}</p>
            <h2 className={`text-[1.7rem] font-extrabold tracking-tight leading-tight transition-opacity duration-300 ${active === i ? "opacity-100" : "opacity-45"}`}>{s.title}</h2>
            <p className="text-zinc-600 leading-relaxed mt-2.5">{s.desc}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {s.ctas.map((c) => (
                <button key={c.to} onClick={() => navigate(c.to)} className="bg-black text-white rounded-full h-10 px-5 text-[13px] font-bold flex items-center gap-1.5 active:scale-[0.98] transition-transform">
                  {c.label} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const statsReveal = useReveal(0.25);
  const c0 = useCounter(STATS[0].value, statsReveal.visible);
  const c1 = useCounter(STATS[1].value, statsReveal.visible);
  const c2 = useCounter(STATS[2].value, statsReveal.visible);
  const c3 = useCounter(STATS[3].value, statsReveal.visible);
  const counts = [c0, c1, c2, c3];

  const goAuth = () => navigate("/auth");

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 font-sans overflow-x-clip relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Caveat:wght@600;700&display=swap');
        .ld-display { font-family: 'Baloo 2', 'Inter', sans-serif; }
        .ld-hand { font-family: 'Caveat', cursive; }
        @keyframes ld-in { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
        .ld-in { animation: ld-in .7s cubic-bezier(.22,1,.36,1) both; }
        .ld-in-2 { animation: ld-in .7s cubic-bezier(.22,1,.36,1) both; animation-delay:.12s; }
        .ld-in-3 { animation: ld-in .7s cubic-bezier(.22,1,.36,1) both; animation-delay:.24s; }
        @keyframes ld-marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes ld-line { from { transform:translateY(112%); } to { transform:none; } }
        @keyframes ld-pop {
          from { opacity:0; transform: translateY(150px) rotate(calc(var(--rot) * 0.2)) scale(.9); }
          to   { opacity:1; transform: translateY(0) rotate(var(--rot)) scale(1); }
        }
        @keyframes ld-float1 { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-14px) rotate(1.3deg); } }
        @keyframes ld-float2 { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-9px) rotate(-1.6deg); } }
        @keyframes ld-cue { 0%,100% { transform:translateY(0); } 50% { transform:translateY(6px); } }
        .ld-reveal { opacity:0; transform:translateY(24px); transition:opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
        .ld-reveal.on { opacity:1; transform:none; }
        @media (prefers-reduced-motion: reduce) { .ld-in,.ld-in-2,.ld-in-3 { animation:none; } .ld-reveal { opacity:1; transform:none; transition:none; } }
      `}</style>

      {/* ── Nav — floating dark pill (unchanged) ── */}
      <header className="sticky top-4 z-50 px-4">
        <div className="max-w-2xl mx-auto bg-[#131316]/95 backdrop-blur-xl border border-white/10 rounded-full pl-2.5 pr-2 h-14 flex items-center justify-between shadow-[0_16px_50px_-16px_rgba(0,0,0,0.8)]">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
              <img src={dinoLogo} alt="" className="w-5 h-5" />
            </span>
            <span className="font-bold tracking-tight">Team Dino</span>
          </button>
          <nav className="flex items-center gap-1">
            <button onClick={() => navigate("/about")} className="px-3 py-2 rounded-full text-[13px] font-medium text-zinc-300 hover:text-white transition-colors hidden sm:block">About</button>
            <button onClick={goAuth} className="px-3 py-2 rounded-full text-[13px] font-medium text-zinc-300 hover:text-white transition-colors">Sign in</button>
            <button onClick={goAuth} className="td-btn-primary h-10 px-4 text-[13px] font-bold flex items-center gap-1.5">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero — cinematic photo: Ken Burns + parallax + masked headline ── */}
      <HeroSection goAuth={goAuth} />

      {/* ── Social proof — one giant number (Fluently-style) ── */}
      <section ref={statsReveal.ref} className={`relative z-10 max-w-5xl mx-auto px-5 pt-14 sm:pt-24 pb-14 text-center ld-reveal ${statsReveal.visible ? "on" : ""}`}>
        <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-4" style={{ color: "var(--td-accent-soft)" }}>
          Students trust TeamDino
        </p>
        <p className="text-[clamp(4.5rem,13vw,9rem)] font-extrabold tracking-tight leading-none text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
          {counts[0].toLocaleString("en-IN")}+
        </p>
        <p className="text-zinc-500 font-medium mt-3">active GITAM students and counting</p>

        <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-4 mt-10">
          {[
            [`${counts[1]}%`, "found it useful"],
            [`${counts[2]}+`, "subjects covered"],
            [`${counts[3]}AM`, "we're still here"],
          ].map(([v, l], i) => (
            <div key={l} className="flex items-center gap-8">
              {i > 0 && <span className="hidden sm:block w-px h-9 bg-white/10" />}
              <div className="text-left">
                <p className="text-2xl font-extrabold text-white leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{v}</p>
                <p className="text-zinc-500 text-xs font-semibold mt-1">{l}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subjects strip — press-logo style wordmarks ── */}
      <section className="relative z-10 pb-16 overflow-hidden">
        <div className="flex w-max items-center" style={{ animation: "ld-marquee 38s linear infinite", maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center shrink-0">
              <span className="text-lg sm:text-[1.7rem] font-extrabold tracking-tight text-zinc-700 whitespace-nowrap hover:text-zinc-400 transition-colors">{m}</span>
              <span className="mx-4 sm:mx-7 w-1.5 h-1.5 rounded-full td-accent-solid opacity-40 inline-block shrink-0" />
            </span>
          ))}
        </div>
      </section>

      {/* ── Pinned showcase — one continuous scroll, panel swaps in place ── */}
      <PinnedShowcase />

      {/* ── Testimonials ── */}
      <Section eyebrow="Student voices" title="Don't take our word for it.">
        <div className="grid md:grid-cols-3 gap-4">
          {QUOTES.map((q) => (
            <figure key={q.who} className="bg-[#131316] border border-white/8 rounded-[24px] p-7 flex flex-col">
              <Sparkles className="w-4 h-4 mb-4" style={{ color: "var(--td-accent-soft)" }} />
              <blockquote className="text-zinc-200 text-[15px] leading-relaxed flex-1">"{q.text}"</blockquote>
              <figcaption className="text-zinc-600 text-xs font-semibold mt-5">{q.who}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── Stacked-scroll cards (Fluently-style pile-up) — white band ── */}
      <section className="relative z-10 bg-[#F6F4EF] rounded-[44px] mx-3 sm:mx-5 my-12 py-16 text-black">
        <div className="max-w-4xl mx-auto px-5">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">Built for results</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black">With TeamDino<br />you can finally</h2>
        </div>
        {STACK.map((c, i) => (
          <div key={c.title} className="sticky mb-6" style={{ top: `${84 + i * 14}px`, zIndex: i + 1 }}>
            <div
              className={`relative rounded-[28px] sm:rounded-[32px] overflow-hidden min-h-[300px] sm:min-h-[380px] shadow-[0_30px_80px_-25px_rgba(0,0,0,0.45)] ${c.bg === "#ffffff" ? "border border-zinc-200" : ""}`}
              style={{ background: c.bg, color: c.dark ? "#ffffff" : "#0a0a0a" }}
            >
              <StackArt i={i} />

              <div className="relative z-10 p-6 sm:p-12 min-h-[300px] sm:min-h-[380px] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${c.dark ? "bg-white/10 border-white/15" : "bg-black/8 border-black/10"}`}>
                    <c.icon className="w-5 h-5" />
                  </span>
                  <span className={`text-[13px] font-black tracking-widest ${c.dark ? "text-white/40" : "text-black/35"}`}>0{i + 1} / 0{STACK.length}</span>
                </div>
                <div className="md:max-w-[54%]">
                  <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">{c.title}</h3>
                  <p className={`text-base leading-relaxed mt-3 ${c.dark ? "text-white/70" : "text-black/65"}`}>{c.desc}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </section>

      {/* ── Also from us: Agent Fury + FolioFYX — full-width B&W boxes ── */}
      <Section eyebrow="Also from us" title="The Dino universe doesn't stop at exams.">
        <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          <div className="rounded-[28px] p-6 sm:p-8 bg-white text-black shadow-[0_30px_70px_-28px_rgba(255,255,255,0.35)] flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-12 rounded-2xl bg-black/[0.05] border border-black/10 flex items-center justify-center shrink-0">
                <img src={agentFuryLogo} alt="Agent Fury" className="w-8 h-8 rounded-lg" draggable={false} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.18em] uppercase text-black/45">AI assistant · Chrome + Web</p>
                <h3 className="font-extrabold text-2xl tracking-tight leading-none mt-0.5">Agent Fury</h3>
              </div>
            </div>
            <p className="text-black/60 text-[15px] leading-relaxed">
              Your AI in Gmail, your browser, and your reminders — one assistant, everywhere you work.
            </p>

            {/* Illustrated preview of the "Ask AgentFury" popup (what it looks like in the wild) */}
            <div className="mt-5 rounded-2xl bg-[#0e0e11] p-3.5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-6 h-6 rounded-md bg-white flex items-center justify-center shrink-0">
                  <img src={agentFuryLogo} alt="" className="w-4 h-4" />
                </span>
                <span className="text-white/50 text-[13px]">Ask AgentFury about this…</span>
                <span className="ml-auto w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><ArrowRight className="w-3 h-3 text-white/70" /></span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Explain", "Summarize", "Remind", "Note"].map((c, i) => (
                  <span key={c} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${i === 2 ? "text-white" : "bg-white/10 text-white/80"}`} style={i === 2 ? { background: "#6b5bf0" } : undefined}>{c}</span>
                ))}
              </div>
            </div>

            {/* Two redirects: web app + Chrome extension */}
            <div className="flex flex-wrap gap-2 mt-5">
              <a href={AGENTFURY_WEB} target="_blank" rel="noopener noreferrer"
                className="flex-1 min-w-[130px] bg-black text-white rounded-full h-11 px-4 text-[13px] font-bold flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-transform">
                Open web app <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              {AGENTFURY_EXT_LIVE ? (
                <a href={AGENTFURY_EXT} target="_blank" rel="noopener noreferrer"
                  className="flex-1 min-w-[130px] bg-black/[0.06] border border-black/10 text-black rounded-full h-11 px-4 text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-black/[0.1] transition-colors">
                  Chrome extension <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="flex-1 min-w-[130px] bg-black/[0.04] border border-black/10 text-black/45 rounded-full h-11 px-4 text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-default">
                  Chrome extension · Soon
                </span>
              )}
            </div>
          </div>

          <a href="https://www.foliofyx.in" target="_blank" rel="noopener noreferrer"
            className="group rounded-[28px] p-8 sm:p-10 bg-white/[0.04] backdrop-blur-xl border-2 border-white/25 text-white hover:-translate-y-1.5 hover:border-white/50 transition-all shadow-[0_30px_70px_-28px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <span className="h-14" aria-hidden />
              <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <img src={fyxLogo} alt="FolioFYX" className="h-7 sm:h-8 w-auto max-w-[190px] object-contain object-left brightness-0 invert" draggable={false} />
            <p className="text-white/60 text-[15px] leading-relaxed mt-3.5 flex-1">
              Build a standout portfolio site in minutes — because placements don't wait for perfect.
            </p>
            <p className="text-[11px] font-black tracking-[0.18em] uppercase mt-8 text-white/70">foliofyx.in</p>
          </a>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section eyebrow="Questions" title="Everything you'd ask us anyway.">
        <div className="max-w-2xl mx-auto space-y-2.5">
          {FAQS.map((f, i) => {
            const open = faqOpen === i;
            return (
              <div key={f.q} className="bg-[#131316] border border-white/8 rounded-[20px] overflow-hidden">
                <button onClick={() => setFaqOpen(open ? null : i)} className="w-full flex items-center justify-between gap-4 px-6 text-left" style={{ paddingTop: "1.1rem", paddingBottom: "1.1rem" }}>
                  <span className="text-white font-semibold text-[15px]">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <p className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-white/5 pt-4">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Final CTA — yellow bookend with the hero's personality ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 pb-20">
        <div className="relative overflow-hidden text-black rounded-[36px] p-9 sm:p-14" style={{ background: "#FFB61E" }}>
          {/* blobs */}
          <div aria-hidden className="absolute -top-16 -left-12 w-72 h-64" style={{ background: "#FCD34D", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%" }} />
          <div aria-hidden className="absolute -bottom-24 right-[28%] w-80 h-72" style={{ background: "#FDE68A", borderRadius: "48% 52% 42% 58% / 50% 58% 42% 50%" }} />

          {/* book peeking from the corner */}
          <div aria-hidden className="absolute -right-10 -bottom-14 w-[210px] rotate-[-14deg] hidden md:block">
            <BookMock cover="#0F9D9A" spine="#0B7A78" title="AI" />
          </div>

          {/* dino stamp */}
          <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg hidden sm:flex">
            <img src={dinoBlack} alt="" className="w-6 h-6" draggable={false} />
          </div>

          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl sm:text-[2.6rem] font-extrabold tracking-tight leading-[1.08]">
              Your last-minute survival kit is one click away.
            </h2>
            <p className="text-black/70 mt-3 font-medium">Free tools forever. Full subjects from ₹11. Exams, handled.</p>
            <div className="flex flex-wrap items-center gap-4 mt-7">
              <button onClick={goAuth} className="bg-black text-white rounded-full h-13 px-8 text-[15px] font-bold flex items-center gap-2 hover:scale-[1.03] active:scale-[0.99] transition-transform" style={{ height: "3.25rem" }}>
                Get started free <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-sm font-bold text-black/70">
                <Check className="w-4 h-4" /> No card needed
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 max-w-6xl mx-auto px-5 pb-8">
        <Footer />
      </div>
    </div>
  );
}

/* A tilted SVG hardcover "subject book" — spine, page stack, badge, depth. */
function BookMock({ cover, spine, title }: { cover: string; spine: string; title: string }) {
  return (
    <svg viewBox="0 0 300 400" className="w-full h-auto" style={{ filter: "drop-shadow(0 45px 45px rgba(0,0,0,0.35))" }} aria-hidden>
      {/* page block peeking right + bottom */}
      <rect x="24" y="10" width="270" height="384" rx="14" fill="#F4EFE3" />
      <g stroke="#DCD3BC" strokeWidth="2">
        <line x1="284" y1="22" x2="284" y2="382" />
        <line x1="289" y1="28" x2="289" y2="376" />
      </g>
      <g stroke="#DCD3BC" strokeWidth="2">
        <line x1="40" y1="388" x2="270" y2="388" />
      </g>
      {/* front cover */}
      <rect x="6" y="0" width="274" height="382" rx="16" fill={cover} />
      {/* cover depth edge */}
      <rect x="262" y="4" width="18" height="374" rx="9" fill="rgba(0,0,0,0.14)" />
      {/* spine */}
      <path d="M6 16 A16 16 0 0 1 22 0 H52 V382 H22 A16 16 0 0 1 6 366 Z" fill={spine} />
      <rect x="52" y="0" width="9" height="382" fill="rgba(0,0,0,0.16)" />
      {/* hinge highlight */}
      <rect x="66" y="10" width="4" height="362" rx="2" fill="rgba(255,255,255,0.55)" />
      {/* dino badge */}
      <circle cx="234" cy="48" r="26" fill="#ffffff" />
      <image href={dinoBlack} x="218" y="32" width="32" height="32" />
      {/* title */}
      <text x="86" y="316" fill="#ffffff" fontWeight="800" fontSize="44" fontFamily="'Baloo 2', sans-serif">{title}</text>
      <text x="86" y="344" fill="rgba(255,255,255,0.75)" fontWeight="700" fontSize="14" fontFamily="Inter, sans-serif">5 units · PYQs · AI</text>
    </svg>
  );
}

/* ─── Hero: exact Aardvark mimic — yellow blobs, chunky black type, books ─── */
function HeroSection({ goAuth }: { goAuth: () => void }) {
  const { contentRef, cueRef, frameRefs } = useHeroParallax([0.1, -0.06, 0.16]);
  // cursor drift strengths: [big DBMS, corner COA (moves opposite = depth), note]
  const mouseEls = useMouseFloat([
    { x: 34, y: 24, r: 0.09 },
    { x: -26, y: -18, r: -0.07 },
    { x: 16, y: 12, r: 0.14 },
  ]);
  const pop = (rot: string, delay: number) => ({ ["--rot" as any]: rot, animation: `ld-pop 1s cubic-bezier(.16,1,.3,1) ${delay}s both` });

  return (
    <section className="relative -mt-[4.75rem] min-h-[100svh] overflow-hidden rounded-b-[44px]" style={{ background: "#FFB61E" }}>
      {/* organic blobs */}
      <div aria-hidden className="absolute -top-24 left-[18%] w-[520px] h-[420px]" style={{ background: "#FCD34D", borderRadius: "48% 52% 62% 38% / 55% 45% 58% 42%" }} />
      <div aria-hidden className="absolute top-[34%] right-[22%] w-[460px] h-[520px]" style={{ background: "#FDE68A", borderRadius: "56% 44% 40% 60% / 46% 60% 40% 54%" }} />
      <div aria-hidden className="absolute -bottom-32 left-[6%] w-[420px] h-[380px]" style={{ background: "#F59E0B", borderRadius: "52% 48% 58% 42% / 50% 55% 45% 50%", opacity: 0.55 }} />
      <div aria-hidden className="absolute bottom-[10%] right-[2%] w-[300px] h-[280px]" style={{ background: "#FCD34D", borderRadius: "44% 56% 50% 50% / 60% 42% 58% 40%" }} />

      {/* corner book peeking top-left — smaller on phones, full at lg */}
      <div ref={(el) => (frameRefs.current[1] = el)} className="absolute -top-14 -left-10 w-[135px] sm:w-[170px] lg:-top-24 lg:left-[16%] lg:w-[240px] rotate-[28deg] z-[5] will-change-transform">
        <div ref={(el) => (mouseEls.current[1] = el)} className="will-change-transform">
          <div style={pop("28deg", 0.35)}>
            <div style={{ animation: "ld-float2 6.5s ease-in-out 1.4s infinite" }}>
              <BookMock cover="#0F9D9A" spine="#0B7A78" title="COA" />
            </div>
          </div>
        </div>
      </div>

      {/* big book right — drops below the headline on phones so text stays clean */}
      <div ref={(el) => (frameRefs.current[0] = el)} className="absolute right-[4%] top-[13%] w-[185px] sm:right-[7%] sm:top-[20%] sm:w-[280px] xl:w-[340px] rotate-[10deg] z-[5] will-change-transform">
        <div ref={(el) => (mouseEls.current[0] = el)} className="will-change-transform">
          <div style={pop("10deg", 0.2)}>
            <div style={{ animation: "ld-float1 5.2s ease-in-out 1.3s infinite" }}>
              <BookMock cover="#1E2B7A" spine="#E0559B" title="DBMS" />
            </div>
          </div>
        </div>
      </div>

      {/* handwritten note — on phones it sits above the big book */}
      <div ref={(el) => (frameRefs.current[2] = el)} className="absolute right-[7%] top-[47%] md:top-auto md:right-[3%] md:bottom-[20%] rotate-[-10deg] z-[6] will-change-transform">
        <div ref={(el) => (mouseEls.current[2] = el)} className="will-change-transform">
          <p className="ld-hand text-[#6D5BD0] text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-center" style={pop("-10deg", 0.6)}>
            made for<br />GITAM students
          </p>
        </div>
      </div>

      {/* content — old-style headline + CTA on the new stage */}
      <div ref={contentRef} className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 min-h-[100svh] flex flex-col justify-end pb-[6.5rem] pt-10 sm:min-h-0 sm:block sm:pt-40 sm:pb-24 will-change-transform">
        <h1 className="text-black font-extrabold tracking-tight leading-[0.95] text-[clamp(3.5rem,10vw,8rem)]">
          {["Make", "Exams", "Easy."].map((w, i) => (
            <span key={w} className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <span className="block" style={{ animation: `ld-line .9s cubic-bezier(.22,1,.36,1) ${0.15 + i * 0.13}s both` }}>{w}</span>
            </span>
          ))}
        </h1>
        <div className="ld-in-3 flex flex-wrap items-center gap-5 mt-8">
          <button onClick={goAuth} className="bg-white text-black rounded-full h-14 px-8 text-[15px] font-bold flex items-center gap-2 hover:scale-[1.03] active:scale-[0.99] transition-transform shadow-[0_18px_40px_-14px_rgba(0,0,0,0.35)]">
            Start studying<ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-black/80 font-semibold text-[15px]">Study with AI · Notes · PYQs</p>
        </div>
      </div>

      {/* white dino stamp bottom-right (Aardvark badge spot) */}
      <div className="absolute bottom-6 right-5 sm:bottom-8 sm:right-8 z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)]">
        <img src={dinoBlack} alt="" className="w-6 h-6 sm:w-8 sm:h-8" draggable={false} />
      </div>

      {/* scroll cue */}
      <div ref={cueRef} className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-black/60">
        <span className="text-[10px] font-black tracking-[0.28em] uppercase">Scroll to explore</span>
        <ChevronDown className="w-4 h-4" style={{ animation: "ld-cue 1.6s ease-in-out infinite" }} />
      </div>
    </section>
  );
}

/* Shared section wrapper with reveal */
function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  const r = useReveal(0.12);
  return (
    <section ref={r.ref} className={`relative z-10 max-w-6xl mx-auto px-5 py-14 ld-reveal ${r.visible ? "on" : ""}`}>
      <div className="text-center mb-8">
        <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-600 mb-2">{eyebrow}</p>
        <h2 className="text-2xl sm:text-[2rem] font-extrabold tracking-tight text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}
