import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ChevronDown, Check, Quote } from "lucide-react";
import Footer from "./Footer";
import CurvedGallery from "@/components/stacks/CurvedGallery";
import BookMock, { BOOK_TONES } from "@/components/brand/BookMock";
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
  const dimRef = useRef<HTMLDivElement>(null);
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
        if (dimRef.current) dimRef.current.style.opacity = String(Math.min(0.55, (y / window.innerHeight) * 0.55));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { contentRef, cueRef, frameRefs, dimRef };
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
  // the hero carries its own nav; the floating pill takes over once it's covered
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const on = () => setPastHero(window.scrollY > window.innerHeight * 0.75);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

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
        @keyframes ld-settle { from { opacity:0; transform:translateY(-60px) rotate(var(--rot)); } to { opacity:1; transform:rotate(var(--rot)); } }
        .ld-book { transform: rotate(var(--rot)); filter: brightness(.86) saturate(.85); }
        @keyframes ld-beam { 0%,100% { opacity:.85; translate: 0 0; } 50% { opacity:1; translate: 3% 0; } }
        .ld-beam { animation: ld-beam 14s ease-in-out infinite; }
        @keyframes ld-cue { 0%,100% { transform:translateY(0); } 50% { transform:translateY(6px); } }
        .ld-reveal { opacity:0; transform:translateY(24px); transition:opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
        .ld-reveal.on { opacity:1; transform:none; }
        @media (prefers-reduced-motion: reduce) { .ld-in,.ld-in-2,.ld-in-3,.ld-beam { animation:none; } .ld-reveal { opacity:1; transform:none; transition:none; } }
      `}</style>

      {/* ── Nav — floating dark pill (unchanged) ── */}
      <header className={`fixed inset-x-0 top-4 z-50 px-4 transition-all duration-500 ${pastHero ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
        <div className="max-w-2xl mx-auto bg-[#131316]/95 backdrop-blur-xl border border-white/10 rounded-full pl-2.5 pr-2 h-14 flex items-center justify-between shadow-[0_16px_50px_-16px_rgba(0,0,0,0.8)]">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
              <img src={dinoLogo} alt="" className="w-5 h-5" />
            </span>
            <span className="font-bold tracking-tight">Team Dino</span>
          </button>
          <nav className="flex items-center gap-1">
            <button onClick={() => navigate("/showcase")} className="px-3 py-2 rounded-full text-[13px] font-medium text-zinc-300 hover:text-white transition-colors hidden md:block">Showcase</button>
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

      {/* ── The curtain: everything after the hero is one opaque layer that
          scrolls up over the pinned hero. ── */}
      <div className="relative z-10 bg-[#0b0b0e] rounded-t-[40px] sm:rounded-t-[48px] shadow-[0_-40px_80px_-30px_rgba(0,0,0,0.7)]">

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
        <CurvedGallery items={[...MARQUEE, ...MARQUEE].map((m, i) => ({ title: m, ...BOOK_TONES[i % BOOK_TONES.length] }))} onPick={() => goAuth()} />
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
    </div>
  );
}

/* A tilted SVG hardcover "subject book" — spine, page stack, badge, depth. */

/* ─── Hero: exact Aardvark mimic — yellow blobs, chunky black type, books ─── */
function HeroSection({ goAuth }: { goAuth: () => void }) {
  const navigate = useNavigate();
  const { contentRef, frameRefs, dimRef } = useHeroParallax([0.1]);
  // cursor drift for the book on the desk
  const mouseEls = useMouseFloat([{ x: 20, y: 12, r: 0.06 }]);
  const settle = (delay: number) => ({ animation: `ld-settle 1.3s cubic-bezier(.16,1,.3,1) ${delay}s both` });
  const WORD = "TeamDino";

  return (
    /* Editorial hero: a dim study, one beam of window light, the subject
       books on the desk, and the name set huge across the top. The frame is
       inset with rounded corners; it stays pinned while the page curtains
       over it (see the wrapper in LandingPage). */
    <section className="sticky top-0 z-0 h-[100svh] p-2.5 sm:p-3" style={{ background: "#0b0b0e" }}>
      <div className="relative h-full w-full overflow-hidden rounded-[22px] sm:rounded-[28px]"
        style={{ background: "radial-gradient(120% 90% at 30% 20%, #26302c 0%, #161c1a 45%, #0e1211 100%)" }}>

        {/* window light: a soft diagonal shaft that drifts, and the patch it throws */}
        <div aria-hidden className="ld-beam absolute -top-[20%] left-[18%] w-[38%] h-[140%] pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(220,235,230,0.13) 45%, rgba(220,235,230,0.05) 70%, transparent)", transform: "skewX(-24deg)", filter: "blur(18px)" }} />
        <div aria-hidden className="ld-beam absolute bottom-[14%] left-[30%] w-[46%] h-[22%] pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(220,235,230,0.16), transparent)", transform: "skewX(-30deg)", filter: "blur(10px)", animationDelay: "-4s" }} />

        {/* the desk — a low, soft rise in light at the very bottom that blends
            into the room, so the area behind the copy and buttons stays one tone */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[20%] pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.035) 55%, rgba(255,255,255,0.05) 100%)" }} />

        {/* one book on the desk, right of centre. Its width follows the screen
            HEIGHT (24svh) so its top always stays below the wordmark. */}
        <div ref={(el) => (frameRefs.current[0] = el)} className="absolute inset-x-0 bottom-[16%] flex justify-center sm:block sm:inset-x-auto sm:right-[24%] sm:bottom-[14%] z-[5] will-change-transform">
          <div className="relative w-[min(40vw,22svh)] sm:w-[max(118px,min(18vw,24svh))]">
          <div ref={(el) => (mouseEls.current[0] = el)} className="will-change-transform">
            <div style={{ ...settle(0.5), ["--rot" as any]: "-7deg" }} className="ld-book">
              <BookMock cover="#1E2B7A" spine="#E0559B" title="DBMS" />
            </div>
            {/* soft contact shadow right under the book */}
            <div aria-hidden className="absolute left-[8%] right-[2%] -bottom-[6%] h-[12%] -z-10 rounded-[50%]"
              style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.6), transparent)", filter: "blur(6px)" }} />
          </div>
          </div>
        </div>

        {/* nav, inside the frame */}
        <nav className="relative z-20 flex items-center justify-between px-5 sm:px-8 pt-5 sm:pt-6">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2" aria-label="Team Dino">
            <img src={dinoLogo} alt="" className="w-7 h-7" />
          </button>
          <div className="flex items-center gap-1 sm:gap-2 text-[13px] text-white/80">
            <button onClick={() => navigate("/showcase")} className="hidden md:block px-3 py-2 hover:text-white transition-colors">Showcase</button>
            <button onClick={() => navigate("/sgpa-calc")} className="hidden md:block px-3 py-2 hover:text-white transition-colors">SGPA calculator</button>
            <button onClick={() => navigate("/about")} className="hidden sm:block px-3 py-2 hover:text-white transition-colors">About</button>
            <button onClick={goAuth} className="px-3 py-2 hover:text-white transition-colors">Sign in</button>
            <button onClick={goAuth} className="ml-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/15 text-white pl-4 pr-1 h-10 flex items-center gap-3 transition-colors">
              <span className="font-semibold">Get started</span>
              <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center"><ArrowRight className="w-4 h-4" /></span>
            </button>
          </div>
        </nav>

        {/* the wordmark, edge to edge, letters rising in */}
        <div ref={contentRef} className="relative z-10 px-4 sm:px-6 mt-[2vh] will-change-transform">
          <h1 className="relative leading-[0.8] font-semibold whitespace-nowrap select-none"
            style={{ color: "#d4e4ec", fontSize: "clamp(3.3rem, 20.9vw, 24.7rem)", letterSpacing: "-0.075em" }}>
            {WORD.split("").map((ch, i) => (
              /* clip only the bottom edge (where the letter rises from); the
                 sides and top stay open, so tight tracking doesn't slice the
                 curves of e, a, m, D, i, n, o */
              <span key={i} className="inline-block align-bottom pb-[0.1em] -mb-[0.1em]" style={{ clipPath: "inset(-0.5em -0.5em 0 -0.5em)" }}>
                <span className="inline-block" style={{ animation: `ld-line 1.1s cubic-bezier(.16,1,.3,1) ${0.08 + i * 0.05}s both` }}>{ch}</span>
              </span>
            ))}
            <span className="sr-only"> — study kit for GITAM students</span>
          </h1>
          <div className="ld-in-3 mt-3 sm:mt-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5 sm:gap-4 px-1">
            <p className="font-semibold tracking-tight leading-none text-[#d4e4ec] text-[clamp(1.6rem,4.2vw,4.25rem)]"
              style={{ letterSpacing: "-0.04em", paddingLeft: "calc(clamp(3.3rem, 20.9vw, 24.7rem) * 0.23)" }}>
              Make exams easy.
            </p>
            <p className="shrink-0 text-[#d4e4ec]/60 sm:text-[#d4e4ec]/80 font-medium tracking-tight uppercase text-[11px] sm:text-[clamp(13px,1.3vw,20px)]"
              style={{ paddingLeft: "calc(clamp(3.3rem, 20.9vw, 24.7rem) * 0.23)" }}>
              (Study kit · GITAM)
            </p>
          </div>
          {/* line and buttons start under the T's stem, not its crossbar */}
          <div className="ld-in-3 mt-6 sm:mt-7 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 px-1 pr-4 sm:pr-1"
            style={{ paddingLeft: "calc(clamp(3.3rem, 20.9vw, 24.7rem) * 0.23)" }}>
            <button onClick={goAuth} className="rounded-full bg-[#d4e4ec] hover:bg-white text-[#0e1211] h-12 pl-6 pr-1.5 text-[14px] font-bold flex items-center justify-between sm:justify-start gap-3 transition-colors w-full sm:w-auto">
              Start studying free
              <span className="w-9 h-9 rounded-full bg-[#0e1211] text-[#d4e4ec] flex items-center justify-center"><ArrowRight className="w-4 h-4" /></span>
            </button>
            <button onClick={() => navigate("/sgpa-calc")} className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white h-12 px-6 text-[14px] font-semibold transition-colors w-full sm:w-auto">
              Free SGPA calculator
            </button>
          </div>
        </div>

        {/* frosted bar: what we do · the details */}
        <div className="absolute inset-x-2.5 sm:inset-x-4 bottom-2.5 sm:bottom-4 z-20 ld-in-3">
          <div className="rounded-[16px] sm:rounded-[20px] bg-white/[0.08] backdrop-blur-xl border border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-white">
            <p className="text-[13px] sm:text-[14px] leading-snug text-white/85 flex-1 min-w-0 max-w-[40rem]">
              Notes, important questions, PYQs and an AI tutor that explains from your own syllabus — so the night before the exam is for revising, not searching.
            </p>
            <p className="hidden md:block sm:ml-auto text-right text-[12.5px] font-semibold leading-tight text-white/90 shrink-0 pl-2">
              1500+ students<br /><span className="text-white/60 font-medium">Every GITAM subject</span>
            </p>
          </div>
        </div>

        {/* the dim layer the curtain brings */}
        <div ref={dimRef} aria-hidden className="absolute inset-0 z-30 bg-black pointer-events-none" style={{ opacity: 0 }} />
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
