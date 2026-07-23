import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, BookOpen, Calculator, Briefcase, ChevronDown, Check, Sparkles,
} from "lucide-react";
import Footer from "./Footer";
import { AiIcon } from "@/components/BrandIcons";
import dinoLogo from "@/assets/dinosaurWhite.png";

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
  { value: 1400, suffix: "+", label: "Active students" },
  { value: 89, suffix: "%", label: "Found it useful" },
  { value: 15, suffix: "+", label: "Subjects covered" },
  { value: 2, suffix: "AM", label: "We're still here" },
];

const TILE_COLORS = ["#7c6cf0", "#f472b6", "#34d399", "#f59e0b", "#6b8afd", "#a78bfa"];
const HERO_TILES = ["DBMS", "COA", "AI", "OS", "SE", "FLAT"];
const MARQUEE = [
  "DBMS", "Computer Organization", "Artificial Intelligence", "Operating Systems",
  "Software Engineering", "Compiler Design", "FLAT", "Data Structures", "DAA",
  "Computer Networks", "Machine Learning", "OOPs with Java",
];

const STEPS = [
  { n: "01", title: "Pick your year", desc: "First year to supplementary — the store opens on your year automatically." },
  { n: "02", title: "Unlock a subject — or the whole year", desc: "Single subjects from ₹11, or grab the full-year combo and save. One payment via UPI." },
  { n: "03", title: "Study smart", desc: "Every subject: 5 units of notes, PYQs, editorial videos and Study-With-AI answers mapped to your syllabus." },
  { n: "04", title: "Stay on track", desc: "Exam countdowns, SGPA & CGPA predictors and an attendance planner keep panic off the table." },
];

const FEATURES = [
  {
    icon: AiIcon, title: "Study With AI",
    desc: "Unit-wise answers mapped to your exact syllabus — not generic chatbot rambling. Stuck at 2AM? It's awake.",
  },
  {
    icon: Calculator, title: "Free forever tools",
    desc: "SGPA calculator, CGPA predictor and attendance planner. No login, no card — just open and use.",
  },
  {
    icon: Briefcase, title: "Placement prep",
    desc: "Exam patterns, curated materials and previous questions — organised company by company.",
  },
];

const QUOTES = [
  { text: "Found the exact PYQs at 1AM the night before my DBMS external. Passed with room to spare.", who: "Priya · CSE, 3rd year" },
  { text: "The AI answers actually follow our units. I stopped wrestling with ChatGPT prompts completely.", who: "Rahul · ECE, 2nd year" },
  { text: "₹29 for the whole year's subjects felt fake. It wasn't. Cheaper than one photocopy run.", who: "Sneha · CSE, 4th year" },
];

const FAQS = [
  { q: "Is TeamDino free?", a: "The calculators (SGPA, CGPA predictor, attendance) are 100% free with no login. Subject packs — notes, PYQs, Study-With-AI — start at ₹11, with full-year combos that cost less than a plate of biryani." },
  { q: "What's inside a subject pack?", a: "Syllabus, 5 units of curated notes, previous year questions, editorial videos, and Study-With-AI answers organised topic by topic. Access unlocks instantly after payment." },
  { q: "What's a year combo?", a: "Every subject in your year for one price. If you'll need more than two subjects, the combo always wins." },
  { q: "I paid but can't access — what now?", a: "Tap Instant Help inside the app — DinoBot files a support ticket for you and the team resolves it within 24 hours." },
  { q: "Which college is this for?", a: "Built by and for GITAM students — the grade chart, units and PYQs match GITAM's actual pattern." },
];

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
        @keyframes ld-in { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
        .ld-in { animation: ld-in .7s cubic-bezier(.22,1,.36,1) both; }
        .ld-in-2 { animation: ld-in .7s cubic-bezier(.22,1,.36,1) both; animation-delay:.12s; }
        .ld-in-3 { animation: ld-in .7s cubic-bezier(.22,1,.36,1) both; animation-delay:.24s; }
        @keyframes ld-marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        .ld-reveal { opacity:0; transform:translateY(24px); transition:opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
        .ld-reveal.on { opacity:1; transform:none; }
        @media (prefers-reduced-motion: reduce) { .ld-in,.ld-in-2,.ld-in-3 { animation:none; } .ld-reveal { opacity:1; transform:none; transition:none; } }
      `}</style>

      {/* faint grid */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)," +
          "linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, black 30%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, black 30%, transparent 100%)",
      }} />

      {/* ── Nav ── */}
      <header className="sticky top-4 z-50 px-4">
        <div className="max-w-2xl mx-auto bg-[#131316]/90 backdrop-blur-xl border border-white/10 rounded-full pl-2.5 pr-2 h-14 flex items-center justify-between shadow-[0_16px_50px_-16px_rgba(0,0,0,0.8)]">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
              <img src={dinoLogo} alt="" className="w-5 h-5" />
            </span>
            <span className="font-bold tracking-tight hidden sm:block">Team Dino</span>
          </button>
          <nav className="flex items-center gap-1">
            <button onClick={() => navigate("/about")} className="px-3 py-2 rounded-full text-[13px] font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">About</button>
            <button onClick={() => navigate("/sgpa-calc")} className="px-3 py-2 rounded-full text-[13px] font-medium text-zinc-400 hover:text-white transition-colors hidden md:block">Free tools</button>
            <button onClick={goAuth} className="px-3 py-2 rounded-full text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">Sign in</button>
            <button onClick={goAuth} className="td-btn-primary h-10 px-4 text-[13px] font-bold flex items-center gap-1.5">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero — type-led, product-forward ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 pt-16 sm:pt-24 pb-14 grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center">
        <div>
          <span className="ld-in inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full td-accent-solid inline-block" /> For GITAM students
          </span>
          <h1 className="ld-in text-[2.8rem] sm:text-6xl font-extrabold tracking-tight leading-[1.02] mt-6">
            Stop hunting notes.<br />
            <span style={{ color: "var(--td-accent-soft)" }}>Start topping exams.</span>
          </h1>
          <p className="ld-in-2 text-zinc-400 text-lg leading-relaxed max-w-md mt-6">
            Notes, PYQs and AI explanations for every subject — organised, exam-ready,
            and yours the night you actually need them.
          </p>
          <div className="ld-in-2 flex flex-wrap items-center gap-3 mt-8">
            <button onClick={goAuth} className="td-btn-primary h-13 px-7 text-[15px] font-bold flex items-center gap-2" style={{ height: "3.25rem" }}>
              Start studying free <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/sgpa-calc")} className="td-btn-ghost h-13 px-6 text-[15px] font-semibold" style={{ height: "3.25rem" }}>
              Try the free calculators
            </button>
          </div>
          <div className="ld-in-3 flex items-center gap-3 mt-8">
            <div className="flex -space-x-2">
              {["A", "R", "S", "K"].map((l) => (
                <span key={l} className="w-8 h-8 rounded-full bg-white/[0.07] border-2 border-[#0b0b0e] flex items-center justify-center text-[11px] font-bold text-zinc-300">{l}</span>
              ))}
              <span className="w-8 h-8 rounded-full td-accent-solid border-2 border-[#0b0b0e] flex items-center justify-center text-[9px] font-black text-white">1.4k</span>
            </div>
            <p className="text-sm text-zinc-500 font-medium">1400+ students already inside</p>
          </div>
        </div>

        {/* product collage — real subject tiles, no stock photos */}
        <div className="ld-in-3 relative hidden lg:block" aria-hidden>
          <div className="grid grid-cols-2 gap-4 rotate-[3deg]">
            {HERO_TILES.map((t, i) => (
              <div key={t}
                className="rounded-[22px] p-4 h-32 flex flex-col justify-between border border-white/10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]"
                style={{ background: "#131316", transform: `translateY(${(i % 2) * 14}px)` }}>
                <span className="w-11 h-11 rounded-xl flex items-center justify-center text-white/70 font-black text-lg" style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}>
                  {t.charAt(0)}
                </span>
                <div>
                  <p className="text-white font-bold text-sm">{t}</p>
                  <p className="text-zinc-600 text-[11px]">5 units · notes · PYQs · AI</p>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute -bottom-5 -left-6 bg-white text-black rounded-2xl px-4 py-3 shadow-2xl -rotate-3">
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-60">From</p>
            <p className="text-2xl font-black leading-none">₹11<span className="text-sm font-bold opacity-60">/subject</span></p>
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section ref={statsReveal.ref} className={`relative z-10 max-w-5xl mx-auto px-5 pb-20 ld-reveal ${statsReveal.visible ? "on" : ""}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <div key={s.label} className="bg-[#131316] border border-white/8 rounded-[22px] py-7 text-center">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
                {counts[i]}{s.suffix}
              </p>
              <p className="text-zinc-500 text-[11px] font-bold tracking-[0.18em] uppercase mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subjects marquee — the "shelf" ── */}
      <section className="relative z-10 pb-20 overflow-hidden">
        <p className="text-center text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-600 mb-6">On the shelf right now</p>
        <div className="flex w-max" style={{ animation: "ld-marquee 32s linear infinite", maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="mx-2 shrink-0 flex items-center gap-2.5 bg-[#131316] border border-white/8 rounded-full pl-2 pr-5 py-2">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 text-sm font-black" style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}>
                {m.charAt(0)}
              </span>
              <span className="text-sm font-semibold text-zinc-300 whitespace-nowrap">{m}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <Section eyebrow="How it works" title="Four steps. Zero panic.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-[#131316] border border-white/8 rounded-[24px] p-6 flex flex-col">
              <span className="text-[13px] font-black tracking-wider mb-5" style={{ color: "var(--td-accent-soft)" }}>{s.n}</span>
              <h3 className="text-white font-bold text-lg leading-snug tracking-tight">{s.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mt-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Features trio ── */}
      <Section eyebrow="What you get" title="Built for the night before.">
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#131316] border border-white/8 rounded-[24px] p-7 hover:border-white/20 transition-colors">
              <span className="w-12 h-12 rounded-2xl td-accent-bg flex items-center justify-center mb-5">
                <f.icon className="w-5 h-5" />
              </span>
              <h3 className="text-white font-bold text-lg tracking-tight">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

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

      {/* ── FAQ ── */}
      <Section eyebrow="Questions" title="Everything you'd ask us anyway.">
        <div className="max-w-2xl mx-auto space-y-2.5">
          {FAQS.map((f, i) => {
            const open = faqOpen === i;
            return (
              <div key={f.q} className="bg-[#131316] border border-white/8 rounded-[20px] overflow-hidden">
                <button onClick={() => setFaqOpen(open ? null : i)} className="w-full flex items-center justify-between gap-4 px-6 py-4.5 text-left" style={{ paddingTop: "1.1rem", paddingBottom: "1.1rem" }}>
                  <span className="text-white font-semibold text-[15px]">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <p className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-white/5 pt-4">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 pb-20">
        <div className="bg-white text-black rounded-[32px] p-10 sm:p-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Your last-minute survival kit<br className="hidden sm:block" /> is one click away.
          </h2>
          <p className="text-black/60 mt-3 max-w-md mx-auto">Free tools forever. Full subjects from ₹11. Exams, handled.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <button onClick={goAuth} className="bg-black text-white rounded-full h-12 px-7 text-[15px] font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform">
              Get started free <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-black/60">
              <Check className="w-4 h-4" /> No card needed
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

/* Shared section wrapper with reveal */
function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  const r = useReveal(0.12);
  return (
    <section ref={r.ref} className={`relative z-10 max-w-6xl mx-auto px-5 pb-20 ld-reveal ${r.visible ? "on" : ""}`}>
      <div className="text-center mb-8">
        <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-600 mb-2">{eyebrow}</p>
        <h2 className="text-2xl sm:text-[2rem] font-extrabold tracking-tight text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}
