import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Calculator, Briefcase, ChevronDown, Check, Sparkles, BookOpen,
} from "lucide-react";
import Footer from "./Footer";
import { AiIcon } from "@/components/BrandIcons";
import dinoLogo from "@/assets/dinosaurWhite.png";

/* Full-bleed hero background — warm library, sharp & on-topic. */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=85&w=2600&auto=format&fit=crop";

/* Hero scroll FX: content parallaxes up + fades, image drifts, cue vanishes. */
function useHeroParallax() {
  const contentRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (contentRef.current) {
          contentRef.current.style.transform = `translateY(${y * 0.28}px)`;
          contentRef.current.style.opacity = String(Math.max(0, 1 - y / 520));
        }
        if (imgRef.current) imgRef.current.style.transform = `translateY(${y * 0.14}px)`;
        if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - y / 160));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return { contentRef, imgRef, cueRef };
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
  { value: 1400, suffix: "+", label: "Active students" },
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
  { text: "₹29 for the whole year's subjects felt fake. It wasn't. Cheaper than one photocopy run.", who: "Sneha · CSE, 4th year" },
];

const FAQS = [
  { q: "Is TeamDino free?", a: "The calculators (SGPA, CGPA predictor, attendance) are 100% free with no login. Subject packs — notes, PYQs, Study-With-AI — start at ₹11, with full-year combos that cost less than a plate of biryani." },
  { q: "What's inside a subject pack?", a: "Syllabus, 5 units of curated notes, previous year questions, editorial videos, and Study-With-AI answers organised topic by topic. Access unlocks instantly after payment." },
  { q: "What's a year combo?", a: "Every subject in your year for one price. If you'll need more than two subjects, the combo always wins." },
  { q: "I paid but can't access — what now?", a: "Tap Instant Help inside the app — DinoBot files a support ticket for you and the team resolves it within 24 hours." },
  { q: "Which college is this for?", a: "Built by and for GITAM students — the grade chart, units and PYQs match GITAM's actual pattern." },
];

/* Pinned showcase steps (Fluently-style: one scroll, panel swaps in place) */
const SHOW = [
  {
    eyebrow: "Study With AI",
    title: "Answers that follow your syllabus",
    desc: "Unit-wise explanations mapped to your exact units — not generic chatbot rambling. Stuck at 2AM? It's awake.",
  },
  {
    eyebrow: "Free tools",
    title: "Know exactly where you stand",
    desc: "SGPA calculator, CGPA predictor and attendance planner. Free forever, no login, no card.",
  },
  {
    eyebrow: "Placement prep",
    title: "Walk into interviews ready",
    desc: "Exam patterns, curated materials and previous questions — organised company by company.",
  },
];

/* Final stacked-scroll cards — photo-backed (Fluently-style) */
const STACK = [
  {
    title: "Find the right notes in seconds",
    desc: "No more digging through 10 WhatsApp groups and dead drive links — every subject lives in one organised place.",
    icon: BookOpen,
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Walk into exams calm",
    desc: "PYQs tell you what's coming, Study-With-AI explains what you missed, and the exam countdown keeps you honest.",
    icon: Sparkles,
    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Track SGPA & attendance without guesswork",
    desc: "Predict your CGPA, plan the classes you can skip, and always know exactly where you stand.",
    icon: Calculator,
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Crack placements company by company",
    desc: "Patterns, materials and real questions for the companies that actually visit campus.",
    icon: Briefcase,
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1600&auto=format&fit=crop",
  },
];

/* ─── Pinned showcase (sticky panel, steps swap on one continuous scroll) ─── */
function PinnedShowcase() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

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
      { threshold: 0.55 },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const mocks = [
    /* AI chat mock */
    <div key="ai" className="space-y-3 w-full">
      <div className="bg-white text-black rounded-2xl rounded-br-md px-4 py-3 text-sm font-medium ml-auto w-fit max-w-[85%]">Explain normalization like I'm 5 🙏</div>
      <div className="bg-white/[0.07] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-zinc-200 max-w-[90%] leading-relaxed">
        Imagine your toy box. 1NF = every toy in its own slot. 2NF = toys grouped by the game they belong to. 3NF = no toy depends on another toy…
      </div>
      <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-semibold"><AiIcon className="w-3.5 h-3.5" /> Unit 3 · DBMS — mapped to your syllabus</div>
    </div>,
    /* SGPA mock */
    <div key="tools" className="w-full text-center">
      <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-500">Predicted SGPA</p>
      <p className="text-6xl font-extrabold text-white mt-2" style={{ fontVariantNumeric: "tabular-nums" }}>8.7</p>
      <div className="mt-5 space-y-2.5 text-left">
        {[["DBMS", 92], ["COA", 78], ["FLAT", 64]].map(([n, v]) => (
          <div key={n as string}>
            <div className="flex justify-between text-xs text-zinc-400 mb-1"><span>{n}</span><span>{v}%</span></div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden"><div className="h-full rounded-full td-accent-solid" style={{ width: `${v}%` }} /></div>
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
    <section className="relative z-10 max-w-6xl mx-auto px-5">
      {/* Desktop: pinned panel + scrolling steps (one continuous scroll) */}
      <div className="hidden lg:grid grid-cols-2 gap-16">
        {/* steps — normal flow, drive the active state */}
        <div>
          {SHOW.map((s, i) => (
            <div key={s.eyebrow} ref={(el) => (refs.current[i] = el)} data-idx={i}
              className="min-h-[88vh] flex flex-col justify-center">
              <p className="text-[12px] font-black tracking-[0.28em] uppercase mb-4" style={{ color: "var(--td-accent-soft)" }}>{s.eyebrow}</p>
              <h2 className={`text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.05] transition-opacity duration-300 ${active === i ? "opacity-100" : "opacity-40"}`}>{s.title}</h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-md mt-5">{s.desc}</p>
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

      {/* Mobile: simple stacked cards */}
      <div className="lg:hidden space-y-10 py-6">
        {SHOW.map((s, i) => (
          <div key={s.eyebrow}>
            <p className="text-[11px] font-black tracking-[0.25em] uppercase mb-2" style={{ color: "var(--td-accent-soft)" }}>{s.eyebrow}</p>
            <h2 className="text-2xl font-extrabold tracking-tight leading-tight">{s.title}</h2>
            <p className="text-zinc-400 leading-relaxed mt-2 mb-4">{s.desc}</p>
            <div className="bg-[#131316] border border-white/10 rounded-[24px] p-5">{mocks[i]}</div>
          </div>
        ))}
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
        @keyframes ld-in { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
        .ld-in { animation: ld-in .7s cubic-bezier(.22,1,.36,1) both; }
        .ld-in-2 { animation: ld-in .7s cubic-bezier(.22,1,.36,1) both; animation-delay:.12s; }
        .ld-in-3 { animation: ld-in .7s cubic-bezier(.22,1,.36,1) both; animation-delay:.24s; }
        @keyframes ld-marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes ld-kb { from { transform:scale(1.14); } to { transform:scale(1.04); } }
        @keyframes ld-line { from { transform:translateY(112%); } to { transform:none; } }
        @keyframes ld-cue { 0%,100% { transform:translateY(0); } 50% { transform:translateY(6px); } }
        .ld-reveal { opacity:0; transform:translateY(24px); transition:opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
        .ld-reveal.on { opacity:1; transform:none; }
        @media (prefers-reduced-motion: reduce) { .ld-in,.ld-in-2,.ld-in-3 { animation:none; } .ld-reveal { opacity:1; transform:none; transition:none; } }
      `}</style>

      {/* ── Nav — floating pill over the hero ── */}
      <header className="sticky top-4 z-50 px-4">
        <div className="max-w-2xl mx-auto bg-[#131316]/90 backdrop-blur-xl border border-white/10 rounded-full pl-2.5 pr-2 h-14 flex items-center justify-between shadow-[0_16px_50px_-16px_rgba(0,0,0,0.8)]">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
              <img src={dinoLogo} alt="" className="w-5 h-5" />
            </span>
            <span className="font-bold tracking-tight hidden sm:block">Team Dino</span>
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
      <section ref={statsReveal.ref} className={`relative z-10 max-w-5xl mx-auto px-5 pt-24 pb-16 text-center ld-reveal ${statsReveal.visible ? "on" : ""}`}>
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
              <span className="text-2xl sm:text-[1.7rem] font-extrabold tracking-tight text-zinc-700 whitespace-nowrap hover:text-zinc-400 transition-colors">{m}</span>
              <span className="mx-7 w-1.5 h-1.5 rounded-full td-accent-solid opacity-40 inline-block shrink-0" />
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

      {/* ── Stacked-scroll cards (Fluently-style pile-up) ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 pb-24">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-600 mb-2">Built for results</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">With TeamDino<br />you can finally</h2>
        </div>
        {STACK.map((c, i) => (
          <div key={c.title} className="sticky mb-6" style={{ top: `${96 + i * 18}px`, zIndex: i + 1 }}>
            <div className="relative rounded-[32px] overflow-hidden min-h-[360px] border border-white/10 shadow-[0_30px_80px_-25px_rgba(0,0,0,0.8)]">
              {/* photo + legibility scrim */}
              <img src={c.img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(9,9,11,0.35) 0%, rgba(9,9,11,0.55) 55%, rgba(9,9,11,0.92) 100%)" }} />

              <div className="relative z-10 p-8 sm:p-12 min-h-[360px] flex flex-col justify-between text-white">
                <div className="flex items-center justify-between">
                  <span className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                    <c.icon className="w-5 h-5" />
                  </span>
                  <span className="text-[13px] font-black tracking-widest text-white/50">0{i + 1} / 0{STACK.length}</span>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight max-w-lg">{c.title}</h3>
                  <p className="text-white/70 text-base leading-relaxed max-w-md mt-3">{c.desc}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

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

/* ─── Hero: Ken Burns image, masked line reveal, scroll parallax, cue ─── */
function HeroSection({ goAuth }: { goAuth: () => void }) {
  const { contentRef, imgRef, cueRef } = useHeroParallax();
  return (
    <section className="relative -mt-[4.5rem] h-[96vh] min-h-[600px] overflow-hidden">
      {/* image (parallax wrapper > Ken Burns wrapper > img) */}
      <div ref={imgRef} className="absolute -inset-6 will-change-transform">
        <div className="w-full h-full" style={{ animation: "ld-kb 8s ease-out both" }}>
          <img src={HERO_IMAGE} alt="" className="w-full h-full object-cover" fetchPriority="high" />
        </div>
      </div>
      {/* legibility scrims */}
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(9,9,11,0.5) 0%, rgba(9,9,11,0.15) 30%, rgba(9,9,11,0.92) 88%, rgba(9,9,11,1) 100%)" }} />
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(9,9,11,0.9) 0%, rgba(9,9,11,0.3) 45%, transparent 74%)" }} />

      <div ref={contentRef} className="relative z-10 h-full max-w-7xl mx-auto px-5 sm:px-8 flex flex-col justify-end pb-14 will-change-transform">
        <h1 className="font-extrabold tracking-tight leading-[0.95] text-[clamp(3.5rem,10vw,8rem)]">
          {["Make.", "Exams.", "Easy."].map((w, i) => (
            <span key={w} className="block overflow-hidden">
              <span className="block" style={{ animation: `ld-line .9s cubic-bezier(.22,1,.36,1) ${0.15 + i * 0.13}s both` }}>{w}</span>
            </span>
          ))}
        </h1>
        <div className="ld-in-3 flex flex-wrap items-center gap-5 mt-8">
          <button onClick={goAuth} className="bg-white text-black rounded-full h-14 px-8 text-[15px] font-bold flex items-center gap-2 hover:scale-[1.03] active:scale-[0.99] transition-transform">
            Start studying free <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-zinc-300 font-semibold text-[15px]">Notes · PYQs · Study with AI</p>
        </div>
      </div>

      {/* get-started mini card */}
      <button onClick={goAuth}
        className="ld-in-3 absolute bottom-12 right-6 sm:right-10 z-10 hidden md:block w-[300px] rounded-[24px] overflow-hidden border border-white/15 bg-[#131316] text-left hover:scale-[1.02] transition-transform shadow-2xl">
        <img src={HERO_IMAGE} alt="" className="h-28 w-full object-cover" />
        <div className="p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-zinc-500">Get started</p>
            <p className="text-white font-bold mt-0.5">Your study workspace</p>
          </div>
          <span className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0"><ArrowRight className="w-4 h-4" /></span>
        </div>
      </button>

      {/* scroll cue */}
      <div ref={cueRef} className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-1.5 text-zinc-400">
        <span className="text-[10px] font-bold tracking-[0.28em] uppercase">Scroll to explore</span>
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
