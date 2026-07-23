import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calculator, Globe, Clock, Coins, Sparkles, CalendarDays, ShoppingBag, Bot } from "lucide-react";
import Footer from "./Footer";
import AnniversaryBanner from "./AnniversaryBanner";
import DecryptedText from "@/components/reactbits/DecryptedText";
import BubbleMenu from "@/components/reactbits/BubbleMenu";
import dinoLogo from "@/assets/dinosaurWhite.png";
import dinoBlack from "@/assets/dinosaurBlack.png";
import genai from "@/assets/aiWhite.png";

/* ─── Phrase rotator data ─────────────────────────────────────── */
const PHRASES = ["We got you.", "Notes & PYQs.", "Instant AI help.", "Last-minute prep."];

/* Full-bleed hero background. Swap with your own asset for full control. */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2400&auto=format&fit=crop";

/* ─── Scroll reveal hook ─────────────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Animated counter hook ─────────────────────────────────── */
function useCounter(target: number, active: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

/* ─── 3-D tilt card ─────────────────────────────────────────── */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 14;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 14;
    el.style.transform = `rotateX(${-y}deg) rotateY(${x}deg) translateZ(0)`;
    el.style.setProperty("--sx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--sy", `${((e.clientY - r.top) / r.height) * 100}%`);
  }, []);
  const onLeave = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
  }, []);
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className}`}
    >
      <div className="tilt-shine" />
      {children}
    </div>
  );
}

/* ─── Stats strip data ──────────────────────────────────────── */
const STATS = [
  { value: 1400, suffix: "+", label: "Active Students" },
  { value: 89,  suffix: "%", label: "Found it useful" },
  { value: 15,  suffix: "+", label: "Subjects covered" },
  { value: 2,   suffix: "AM", label: "We're still here" },
];

/* ─── Features data ─────────────────────────────────────────── */
const FEATURES = [
  {
    title: "Everything. One Place.",
    desc: "No more searching 10 groups. Notes, PYQs, everything right here when you need it most.",
    Icon: BookOpen,
    accent: "#22d3ee",
  },
  {
    title: "Stop Wrestling with GPT",
    desc: "Tired of wasting 10 minutes just to get an explanation that makes sense? Get exam-ready answers instantly.",
    Icon: Clock,
    accent: "#a78bfa",
  },
  {
    title: "Your AI Buddy",
    desc: "Stuck at 2AM? Ask anything. Get instant explanations tailored to your exact syllabus.",
    Icon: Sparkles,
    accent: "#34d399",
  },
  {
    title: "No More Guesswork",
    desc: "Track attendance, calculate SGPA, and know exactly where you stand before it's too late.",
    Icon: Calculator,
    accent: "#fb923c",
  },
  {
    title: "Stand Out Easily",
    desc: "Build your professional portfolio in minutes. Because placements don't wait.",
    Icon: Globe,
    accent: "#f472b6",
  },
  {
    title: "Cheaper Than Lay's",
    desc: "Core resources are 100% free. Premium AI-personalised content costs less than a packet of chips.",
    Icon: Coins,
    accent: "#facc15",
  },
];

/* ─── Main Component ─────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const statsReveal = useReveal(0.2);

  /* Phrase cycling with crossfade */
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseVisible(false);
      setTimeout(() => {
        setPhraseIndex(i => (i + 1) % PHRASES.length);
        setPhraseVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  /* Hero mouse parallax */
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - r.left) / r.width - 0.5,
      y: (e.clientY - r.top) / r.height - 0.5,
    });
  }, []);

  /* Counter values */
  const c0 = useCounter(STATS[0].value, statsReveal.visible);
  const c1 = useCounter(STATS[1].value, statsReveal.visible);
  const c2 = useCounter(STATS[2].value, statsReveal.visible);
  const c3 = useCounter(STATS[3].value, statsReveal.visible);
  const counts = [c0, c1, c2, c3];

  return (
    <div className="landing-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700;800&display=swap');

        /* ── Global resets for landing ── */
        .landing-root {
          min-height: 100vh;
          background:
            #08080a;
          color: #e4e4e7;
          font-family: 'Outfit', system-ui, sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        /* ── Fonts ── */
        .font-display { font-family: 'Instrument Serif', Georgia, serif; }

        /* ── Noise grain overlay ── */
        .landing-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.015;
          pointer-events: none;
          z-index: 999;
        }

        /* ── Animated grid ── */
        .grid-bg {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
        }

        /* ── Orbs ── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb-1 {
          width: 620px; height: 620px;
          top: -220px; left: -120px;
          background: rgba(124,108,240,0.05);
          animation-delay: 0s;
        }
        .orb-2 {
          width: 520px; height: 520px;
          top: 120px; right: -160px;
          background: rgba(255,255,255,0.03);
          animation-delay: 3s;
        }
        .orb-3 {
          width: 420px; height: 420px;
          bottom: 0; left: 50%;
          background: rgba(124,108,240,0.035);
          animation-delay: 5s;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.97); }
        }

        /* ── Dino mascot ── */
        @keyframes dinoFloat {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-18px) rotate(2deg); }
        }
        .dino-float { animation: dinoFloat 5s ease-in-out infinite; }

        /* ── Hero phrase ── */
        .phrase-text {
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .phrase-hidden {
          opacity: 0;
          transform: translateY(12px);
        }

        /* ── Tilt cards ── */
        .tilt-card {
          perspective: 900px;
          transform-style: preserve-3d;
          transition: transform 0.18s ease-out;
          position: relative;
          cursor: default;
        }
        .tilt-shine {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(255,255,255,0.03);
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
          z-index: 1;
        }
        .tilt-card:hover .tilt-shine { opacity: 1; }

        /* ── Scroll reveal ── */
        .reveal-base {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        .reveal-visible {
          opacity: 1 !important;
          transform: none !important;
        }

        /* ── Hero entrance ── */
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-enter { animation: heroIn 1s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── CTA glow button ── */
        .cta-btn {
          position: relative;
          overflow: hidden;
          background: white;
          color: black;
          border-radius: 9999px;
          padding: 0 2rem;
          height: 3.25rem;
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: -0.01em;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 0 0 0 rgba(255,255,255,0.1);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          border: none;
        }
        .cta-btn:hover {
          transform: scale(1.03) translateY(-1px);
          box-shadow: 0 8px 40px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.4);
        }
        .cta-btn:active { transform: scale(0.99); }

        /* ── Separator line ── */
        .sep-line {
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        /* ── Feature card inner (premium frosted glass, matches the hero card) ── */
        .feat-card-inner {
          position: relative;
          z-index: 2;
          background: rgba(23,23,27,0.55);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 26px;
          padding: 2rem;
          height: 100%;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 12px 34px -18px rgba(0,0,0,0.65);
          transition: transform .34s cubic-bezier(.22,1,.36,1), border-color .3s ease, box-shadow .3s ease;
          overflow: hidden;
        }
        .tilt-card:hover .feat-card-inner {
          border-color: rgba(255,255,255,0.18);
          transform: translateY(-5px);
          box-shadow: 0 28px 54px -22px rgba(0,0,0,0.72);
        }
        .feat-accent-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .tilt-card:hover .feat-accent-bar { opacity: 1; }

        /* ── Badge ── */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #a1a1aa;
        }

        /* ── Stats card (premium frosted glass) ── */
        .stat-card {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          background: rgba(23,23,27,0.5);
          padding: 1.75rem 1.5rem;
          text-align: center;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 12px 30px -20px rgba(0,0,0,0.55);
          transition: transform .3s cubic-bezier(.22,1,.36,1), border-color .3s ease;
        }
        .stat-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.16); }

        /* ── Scrolling marquee ── */
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 30s linear infinite;
          display: flex;
          width: max-content;
          gap: 0;
        }
        .marquee-track:hover { animation-play-state: paused; }

        /* ── Mobile touch fix ── */
        @media (hover: none) {
          .tilt-card { transform: none !important; }
          .tilt-shine { display: none; }
        }

        /* ── Gradient text ── */
        .grad-cyan {
          background: none; color: #34d399;
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradShift 5s ease infinite;
        }
        @keyframes gradShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* ── Parallax layers ── */
        .parallax-slow { will-change: transform; }
        .parallax-fast { will-change: transform; }
      `}</style>

      {/* ── Premium backdrop ── */}
      {/* fine dot-grid, radially masked so it fades out (Linear/Vercel style) */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "23px 23px",
          maskImage: "radial-gradient(130% 90% at 50% -10%, #000 28%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(130% 90% at 50% -10%, #000 28%, transparent 72%)",
        }}
      />
      {/* soft spotlights for depth */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "none",

        }}
      />
      {/* crisp top hairline */}
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-0 pointer-events-none h-px"
        style={{ background: "rgba(255,255,255,0.10)" }}
      />

      {/* ── Desktop: floating pill nav ── */}
      <header className="hidden md:flex fixed top-5 inset-x-0 z-50 justify-center px-4 pointer-events-none">
        <nav
          className="pointer-events-auto flex items-center gap-1 rounded-full p-1.5"
          style={{
            background: "rgba(12,12,14,0.55)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 10px 34px -12px rgba(0,0,0,0.6)",
          }}
        >
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mr-1 shrink-0">
            <img src={dinoLogo} alt="Team Dino" className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight px-1.5 mr-1">Team Dino</span>
          <div className="flex items-center">
            <a href="/about" onClick={(e) => { e.preventDefault(); navigate("/about"); }}
              className="text-[13px] font-medium text-zinc-300 hover:text-white hover:bg-white/8 rounded-full px-3.5 py-2 transition-colors">About</a>
            <button onClick={() => navigate("/auth")}
              className="text-[13px] font-medium text-zinc-300 hover:text-white hover:bg-white/8 rounded-full px-3.5 py-2 transition-colors">Sign in</button>
          </div>
          <button onClick={() => navigate("/auth")}
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-white text-black text-[13px] font-semibold px-4 py-2 hover:bg-zinc-100 hover:scale-[1.03] transition-all">
            Get started <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </nav>
      </header>

      {/* ── Mobile: bubble menu ── */}
      <div className="md:hidden">
        <BubbleMenu
          useFixedPosition
          menuBg="#ffffff"
          menuContentColor="#0d0d0d"
          logo={<span className="flex items-center gap-2"><img src={dinoBlack} alt="" className="w-5 h-5" /><span className="font-bold text-sm tracking-tight">Team Dino</span></span>}
          items={[
            { label: "Home", href: "/", onClick: () => navigate("/"), rotation: -8, hoverStyles: { bgColor: "#0d0d0d", textColor: "#ffffff" } },
            { label: "About", href: "/about", onClick: () => navigate("/about"), rotation: 8, hoverStyles: { bgColor: "#0d0d0d", textColor: "#ffffff" } },
            { label: "Sign in", href: "/auth", onClick: () => navigate("/auth"), rotation: 8, hoverStyles: { bgColor: "#0d0d0d", textColor: "#ffffff" } },
            { label: "Get started", href: "/auth", onClick: () => navigate("/auth"), rotation: -8, hoverStyles: { bgColor: "#7c6cf0", textColor: "#ffffff" } },
          ]}
        />
      </div>

      {/* ───────────────── HERO ───────────────────────────────── */}
      <main style={{ position: "relative", zIndex: 10 }}>
        <div
          ref={heroRef}
          onMouseMove={onMouseMove}
          style={{
            position: "relative",
            minHeight: "100svh",
            overflow: "hidden",
            display: "flex",
          }}
        >
          {/* full-bleed background */}
          <div
            aria-hidden
            style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${HERO_IMAGE})`,
              backgroundSize: "cover", backgroundPosition: "center",
              transform: `scale(1.08) translate(${mousePos.x * -10}px, ${mousePos.y * -8}px)`,
              transition: "transform 0.6s cubic-bezier(0.23,1,0.32,1)",
            }}
          />
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(9,9,11,0.45) 0%, rgba(9,9,11,0.08) 30%, rgba(9,9,11,0.92) 88%, rgba(9,9,11,1) 100%)" }} />
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(9,9,11,0.88) 0%, rgba(9,9,11,0.25) 45%, transparent 74%)" }} />

          <div className="container mx-auto px-5 sm:px-8 relative z-10 flex flex-col justify-end pt-28 pb-14 sm:pb-20" style={{ minHeight: "100svh" }}>
            <div className="hero-enter" style={{ animationDelay: "80ms" }}>
              <h1 style={{
                // width- AND height-aware so it stays big but never overflows the frame
                fontSize: "clamp(3.4rem, min(17vw, 23vh), 15rem)",
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 0.9,
                color: "#ffffff",
                textShadow: "0 2px 50px rgba(0,0,0,0.35)",
                margin: 0,
              }}>
                Make.<br />Exams.<br />Easy.
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-8">
                <button
                  onClick={() => navigate("/auth")}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black font-semibold text-sm px-6 py-3.5 hover:bg-zinc-100 hover:scale-[1.02] active:scale-100 transition-all"
                >
                  Start studying free
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
                <span className="text-white/70 text-sm font-medium tracking-wide">
                  Notes&nbsp;&nbsp;·&nbsp;&nbsp;PYQs&nbsp;&nbsp;·&nbsp;&nbsp;Study with AI
                </span>
              </div>
            </div>

            {/* bottom-right feature card */}
            <button
              onClick={() => navigate("/auth")}
              className="hero-enter hidden md:flex flex-col text-left absolute right-8 bottom-24 w-[270px] rounded-2xl overflow-hidden group"
              style={{
                animationDelay: "300ms",
                background: "rgba(18,18,20,0.55)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
            >
              <div style={{ height: 116, backgroundImage: `url(${HERO_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center 35%" }} />
              <div className="p-4 w-full">
                <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white/55 mb-1.5">Get started</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-semibold text-[15px] leading-tight">Your study workspace</p>
                  <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight style={{ width: 15, height: 15 }} />
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* legacy hero block (hidden) */}
          <div
            className="hero-enter"
            style={{
              display: "none",
            }}
          >
            <button
              onClick={() => navigate("/auth")}
              className="cta-btn"
            >
              Start Studying Now
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
            <p style={{ fontSize: 11, color: "#3f3f46", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Trusted by students who start at the last moment
            </p>
          </div>

          {/* Scroll indicator */}
          <div
            className="hero-enter"
            style={{
              position: "absolute", bottom: "2rem", left: "50%",
              transform: "translateX(-50%)",
              animationDelay: "600ms",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}
          >
            <div
              style={{
                width: 24, height: 38,
                border: "1.5px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 4, height: 8,
                  background: "rgba(255,255,255,0.3)",
                  borderRadius: 2,
                  position: "absolute",
                  top: 6, left: "50%",
                  transform: "translateX(-50%)",
                  animation: "scrollDot 2s ease infinite",
                }}
              />
            </div>
          </div>
          <style>{`
            @keyframes scrollDot {
              0% { top: 6px; opacity: 1; }
              80% { top: 20px; opacity: 0; }
              100% { top: 6px; opacity: 0; }
            }
          `}</style>
        </div>

        {/* ───────────────── FREE TOOLS / QUICK LINKS ────────── */}
        <section style={{ padding: "5rem 1rem 1rem", maxWidth: 1200, margin: "0 auto" }}>
          <div className="text-center mb-8">
            <span className="badge" style={{ display: "inline-flex", marginBottom: "1rem" }}>Free to use · no login</span>
            <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 5vw, 3.2rem)", fontWeight: 400, letterSpacing: "-0.03em", color: "#fafafa" }}>
              Tools you can use right now.
            </h2>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {[
              { title: "SGPA Calculator", desc: "Estimate your semester GPA.", icon: Calculator, onClick: () => navigate("/sgpa-calc"), cta: "Open" },
              { title: "Attendance", desc: "Plan the classes you can miss.", icon: CalendarDays, onClick: () => navigate("/attendance-calc"), cta: "Open" },
              { title: "Store", desc: "Unlock subjects & year combos.", icon: ShoppingBag, onClick: () => navigate("/store"), cta: "Browse" },
              { title: "Agent Fury", desc: "Create your agents — email fetch & summarizer.", icon: Bot, onClick: () => window.open("https://agentfury.foliofyx.in/", "_blank"), cta: "Launch", external: true },
              { title: "FolioFYX", desc: "Build your portfolio website.", icon: Globe, onClick: () => window.open("https://www.foliofyx.in", "_blank"), cta: "Visit", external: true },
            ].map((t, i) => (
              <button key={i} onClick={t.onClick} className="feat-card-inner text-left flex flex-col" style={{ minHeight: 190, cursor: "pointer" }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", boxShadow: "0 6px 18px -8px rgba(0,0,0,0.5)" }}>
                  <t.icon style={{ width: 20, height: 20, color: "#0a0a0c" }} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#f4f4f5", letterSpacing: "-0.02em" }}>{t.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "#71717a", lineHeight: 1.55, marginTop: "0.35rem" }}>{t.desc}</p>
                <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white">
                  {t.cta} <ArrowRight style={{ width: 14, height: 14 }} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Separator ── */}
        <div className="sep-line mx-8" />

        {/* ───────────────── STATS STRIP ────────────────────── */}
        <div
          ref={statsReveal.ref}
          style={{
            padding: "4rem 1rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "1rem",
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              className={`stat-card reveal-base ${statsReveal.visible ? "reveal-visible" : ""}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <p
                className="font-display"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  fontWeight: 400,
                  color: "#f4f4f5",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {counts[i]}{s.suffix}
              </p>
              <p style={{ fontSize: 12, color: "#52525b", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Separator ── */}
        <div className="sep-line mx-8" />

        {/* ───────────────── MARQUEE ────────────────────────── */}
        <div
          style={{
            padding: "2rem 0",
            overflow: "hidden",
            mask: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        >
          <div className="marquee-track">
            {[...Array(2)].map((_, rep) => (
              <div key={rep} style={{ display: "flex", gap: "3rem", padding: "0 1.5rem", alignItems: "center" }}>
                {["Notes & PYQs", "Attendance Tracker", "SGPA Calculator", "AI Study Buddy", "Portfolio Builder", "2AM Support", "Syllabus-Specific", "Instant Answers"].map((t, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", whiteSpace: "nowrap" }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#27272a", display: "inline-block" }} />
                    <span style={{ fontSize: 13, color: "#3f3f46", fontWeight: 500, letterSpacing: "0.03em" }}>{t}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Separator ── */}
        <div className="sep-line mx-8" />

        {/* ───────────────── FEATURES ───────────────────────── */}
        <section style={{ padding: "6rem 1rem 8rem", maxWidth: 1200, margin: "0 auto" }}>

          {/* Section heading */}
          <RevealBlock delay={0}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <div className="badge" style={{ display: "inline-flex", marginBottom: "1.25rem" }}>
                What you actually get
              </div>
              <h2
                className="font-display"
                style={{
                  fontSize: "clamp(2rem, 6vw, 4.5rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  color: "#fafafa",
                  marginBottom: "1rem",
                }}
              >
                <DecryptedText text="Your unfair advantage." animateOn="view" sequential speed={38} revealDirection="start" />
              </h2>
              <p style={{ fontSize: "1rem", color: "#52525b", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
                We stripped away the fluff and built the ultimate survival kit for the semester.
                No noise. Just the exact tools to get it done.
              </p>
            </div>
          </RevealBlock>

          {/* Feature grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {FEATURES.map((f, i) => (
              <RevealBlock key={i} delay={i * 80}>
                <TiltCard>
                  <div className="feat-card-inner" style={{ minHeight: 224 }}>
                    {/* B&W icon chip — white tile, black icon */}
                    <div
                      style={{
                        width: 46, height: 46,
                        borderRadius: 14,
                        background: "#ffffff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: "1.5rem",
                        boxShadow: "0 6px 18px -8px rgba(0,0,0,0.5)",
                      }}
                    >
                      {f.Icon ? <f.Icon style={{ width: 20, height: 20, color: "#0a0a0c" }} strokeWidth={1.8} /> : null}
                    </div>

                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        color: "#f4f4f5",
                        letterSpacing: "-0.02em",
                        marginBottom: "0.6rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {f.title}
                    </h3>
                    <p style={{ fontSize: "0.9rem", color: "#71717a", lineHeight: 1.65, fontWeight: 400 }}>
                      {f.desc}
                    </p>
                  </div>
                </TiltCard>
              </RevealBlock>
            ))}
          </div>
        </section>

        {/* ── Separator ── */}
        <div className="sep-line mx-8" />

        {/* ───────────────── FINAL CTA ──────────────────────── */}
        <section style={{ padding: "8rem 1rem 10rem", textAlign: "center" }}>
          <RevealBlock delay={0}>
            <div
              style={{
                maxWidth: 640, margin: "0 auto",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem",
              }}
            >
              {/* Dino mark */}
              <div
                style={{
                  width: 80, height: 80,
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <img src={dinoLogo} alt="" style={{ width: 42, height: 42, opacity: 0.7 }} className="dino-float" />
              </div>

              <h2
                className="font-display"
                style={{
                  fontSize: "clamp(2.5rem, 7vw, 5rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  color: "#fafafa",
                }}
              >
                <DecryptedText text="Ready to stop" animateOn="view" sequential speed={45} />
                <br />
                <span className="font-display" style={{ fontStyle: "italic", color: "#52525b" }}>
                  <DecryptedText text="panicking?" animateOn="view" sequential speed={55} />
                </span>
              </h2>

              <p style={{ fontSize: "0.95rem", color: "#52525b", maxWidth: 400, lineHeight: 1.7 }}>
                Join students who stopped stressing and started performing.
                Everything you need is one click away.
              </p>

              <button
                onClick={() => navigate("/auth")}
                className="cta-btn"
                style={{ height: "3.5rem", padding: "0 2.5rem", fontSize: "0.95rem" }}
              >
                Start Studying Now
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>

              <p style={{ fontSize: 11, color: "#27272a", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Free to start — no credit card needed
              </p>
            </div>
          </RevealBlock>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ─── Reusable scroll-reveal wrapper ─────────────────────────── */
function RevealBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal-base ${visible ? "reveal-visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
