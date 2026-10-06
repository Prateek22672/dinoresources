import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ChevronDown, Check, Quote } from "lucide-react";
import Footer from "./Footer";
import CurvedGallery from "@/components/stacks/CurvedGallery";
import dinoLogo from "@/assets/dinosaurWhite.png";
import dinoBlack from "@/assets/dinosaurBlack.png";
import fyxLogo from "@/assets/fyx.png";
import AgentCoderFeature from "@/components/brand/AgentCoderFeature";
import HorizontalShowcase from "@/components/landing/HorizontalShowcase";
import { HOME_FAQ as FAQS } from "@/data/seo";


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


/* Cover tones for the curved subject wall — muted, dusk-lit, never neon */
const SHELF = [
  { from: "#8b7fd8", to: "#2c2363" }, // monsoon
  { from: "#a6d8c6", to: "#22463f" }, // neon bay
  { from: "#e0896a", to: "#5a1f17" }, // ashline
  { from: "#d9dbe3", to: "#2f3138" }, // granite
  { from: "#efcf6e", to: "#6b4a12" }, // amberlight
  { from: "#b8cbe8", to: "#30477a" }, // northwind
  { from: "#e0a874", to: "#4e2a22" }, // skyline
  { from: "#6f8fe0", to: "#1b2350" }, // undertow
];

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
    <div className="td-force-dark min-h-screen bg-[#0b0b0e] text-zinc-100 font-sans overflow-x-clip relative">
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

      {/* ── Subjects — a curved wall of covers, drag to spin ── */}
      <section className="relative z-10 pb-16">
        <div className="max-w-5xl mx-auto px-5 text-center mb-2">
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-500">Every subject, one shelf</p>
        </div>
        <CurvedGallery items={[...MARQUEE, ...MARQUEE].map((m, i) => ({ title: m, sub: "5 units · PYQs", ...SHELF[i % SHELF.length] }))} onPick={() => goAuth()} />
      </section>

      {/* ── What's inside — horizontal 3D card tour ── */}
      <HorizontalShowcase onStart={goAuth} />

      {/* ── Testimonials ── */}
      <Section eyebrow="Student voices" title="Don't take our word for it.">
        <div className="grid md:grid-cols-3 gap-4">
          {QUOTES.map((q) => (
            <figure key={q.who} className="bg-[#131316] border border-white/8 rounded-[24px] p-7 flex flex-col">
              <Quote className="w-4 h-4 mb-4" style={{ color: "var(--td-accent-soft)" }} />
              <blockquote className="text-zinc-200 text-[15px] leading-relaxed flex-1">"{q.text}"</blockquote>
              <figcaption className="text-zinc-600 text-xs font-semibold mt-5">{q.who}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── Also from us: Agent Coder (the headline) + FolioFYX ── */}
      <Section eyebrow="Also from us" title="The Dino universe doesn't stop at exams.">
        <div className="grid md:grid-cols-[1.35fr_1fr] gap-5 max-w-5xl mx-auto">
          <AgentCoderFeature />

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
