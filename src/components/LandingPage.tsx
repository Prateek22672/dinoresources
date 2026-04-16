import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calculator, Globe, Clock, Coins, Sparkles } from "lucide-react";
import Footer from "./Footer";
import dinoLogo from "@/assets/dinosaurWhite.png";
import genai from "@/assets/aiWhite.png";

/* ─── Phrase rotator data ─────────────────────────────────────── */
const PHRASES = ["We got you.", "Notes & PYQs.", "Instant AI help.", "Last-minute prep."];

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
  { value: 900, suffix: "+", label: "Active Students" },
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
    IconImg: genai,
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
          background: #09090b;
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
          opacity: 0.025;
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
          width: 600px; height: 600px;
          top: -200px; left: -100px;
          background: radial-gradient(circle, rgba(34,211,238,0.06), transparent 70%);
          animation-delay: 0s;
        }
        .orb-2 {
          width: 500px; height: 500px;
          top: 100px; right: -150px;
          background: radial-gradient(circle, rgba(167,139,250,0.05), transparent 70%);
          animation-delay: 3s;
        }
        .orb-3 {
          width: 400px; height: 400px;
          bottom: 0; left: 50%;
          background: radial-gradient(circle, rgba(52,211,153,0.04), transparent 70%);
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
          background: radial-gradient(circle at var(--sx,50%) var(--sy,50%), rgba(255,255,255,0.05) 0%, transparent 60%);
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
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent);
        }

        /* ── Feature card inner ── */
        .feat-card-inner {
          position: relative;
          z-index: 2;
          background: #0f0f11;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 2rem;
          height: 100%;
          transition: border-color 0.2s ease, background 0.2s ease;
          overflow: hidden;
        }
        .tilt-card:hover .feat-card-inner {
          border-color: rgba(255,255,255,0.12);
          background: #121215;
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

        /* ── Stats card ── */
        .stat-card {
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          background: rgba(255,255,255,0.02);
          padding: 1.5rem;
          text-align: center;
          backdrop-filter: blur(8px);
        }

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
          background: linear-gradient(135deg, #67e8f9 0%, #34d399 50%, #67e8f9 100%);
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

      {/* ── Background layers ── */}
      <div className="fixed inset-0 grid-bg z-0 pointer-events-none" />
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ───────────────── HEADER ─────────────────────────────── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(9,9,11,0.7)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 40, height: 40,
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.25s ease",
              }}
              className="hover:scale-105 hover:bg-white/10 cursor-pointer shrink-0"
            >
              <img src={dinoLogo} alt="Team Dino" style={{ width: 22, height: 22, opacity: 0.9 }} />
            </div>
            <div className="hidden sm:block">
              <p style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f5", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Team Dino
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: "#71717a", fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  Personalised for you
                </span>
                <img src={genai} alt="" style={{ width: 11, height: 11, opacity: 0.6 }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/auth")}
              style={{
                background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 9999, padding: "0 16px", height: 36,
                color: "#a1a1aa", fontSize: 13, fontWeight: 500, cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "'Outfit', sans-serif",
              }}
              className="hover:text-white hover:border-white/20"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="cta-btn"
              style={{ height: 36, padding: "0 20px", fontSize: 13 }}
            >
              Get Started <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      </header>

      {/* ───────────────── HERO ───────────────────────────────── */}
      <main style={{ position: "relative", zIndex: 10 }}>
        <div
          ref={heroRef}
          onMouseMove={onMouseMove}
          style={{
            minHeight: "calc(100vh - 4rem)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textAlign: "center",
            padding: "6rem 1rem 4rem",
            position: "relative",
            overflow: "hidden",
            
          }}
        >
          {/* Floating Dino — parallax layer */}
          <div
            className="dino-float parallax-slow"
            style={{
              position: "absolute",
              bottom: "8%", right: "5%",
              transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -20}px)`,
              transition: "transform 0.6s cubic-bezier(0.23,1,0.32,1)",
              pointerEvents: "none",
              display: "none",
            }}
            // Show on larger screens via inline media — use a wrapper
          >
            <img
              src={dinoLogo}
              alt=""
              style={{
                width: 120, height: 120,
                opacity: 0.2,
                filter: "drop-shadow(0 0 40px rgba(34,211,238,0.15))",
              }}
            />
          </div>

          {/* Dino — visible on md+ */}
          <div
            className="parallax-slow"
            style={{
              position: "absolute",
              bottom: "8%", right: "6%",
              transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -20}px)`,
              transition: "transform 0.6s cubic-bezier(0.23,1,0.32,1)",
              pointerEvents: "none",
            }}
          >
            <img
              src={dinoLogo}
              alt=""
              className="dino-float"
              style={{
                width: "clamp(60px, 10vw, 140px)",
                opacity: 0.18,
                filter: "drop-shadow(0 0 60px rgba(34,211,238,0.2))",
              }}
            />
          </div>

          {/* Badge */}
          <div
            className="badge hero-enter"
            style={{ animationDelay: "0ms", marginBottom: "2rem" }}
          >
            <img src={genai} alt="" style={{ width: 11, height: 11, opacity: 0.7 }} />
                        Your last-minute survival kit
          </div>

          {/* Headline — parallax layer */}
          <div
            className="parallax-fast"
            style={{
              transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 8}px)`,
              transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1)",
            }}
          >
            <h1
              className="font-display hero-enter"
              style={{
                fontSize: "clamp(3rem, 9vw, 7.5rem)",
                fontWeight: 400,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                color: "#fafafa",
                marginBottom: "0.25rem",
                animationDelay: "80ms",
              }}
            >
              Exam tomorrow?
            </h1>

            {/* Animated phrase */}
            <div
              style={{
                minHeight: "1.15em",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "2rem",
                overflow: "hidden",
              }}
            >
              <span
                className={`font-display grad-cyan phrase-text ${phraseVisible ? "" : "phrase-hidden"}`}
                style={{
                  fontSize: "clamp(3rem, 9vw, 7.5rem)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  display: "block",
                }}
              >
                {PHRASES[phraseIndex]}
              </span>
            </div>
          </div>

          {/* Sub copy */}
          <p
            className="hero-enter"
            style={{
              fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
              color: "#71717a",
              maxWidth: 520,
              lineHeight: 1.75,
              marginBottom: "2.5rem",
              animationDelay: "200ms",
              fontWeight: 400,
            }}
          >
            When everything feels overwhelming, Team Dino becomes your backup.
            No searching. No confusion. Just what you need to pass — or even top.
          </p>

          {/* CTA group */}
          <div
            className="hero-enter"
            style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: "1rem",
              animationDelay: "340ms",
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
                Your unfair advantage.
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
                  <div className="feat-card-inner" style={{ minHeight: 220 }}>
                    {/* Top accent line */}
                    <div
                      className="feat-accent-bar"
                      style={{ background: `linear-gradient(to right, transparent, ${f.accent}, transparent)` }}
                    />

                    {/* Icon */}
                    <div
                      style={{
                        width: 44, height: 44,
                        borderRadius: 12,
                        background: `${f.accent}12`,
                        border: `1px solid ${f.accent}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: "1.25rem",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      {f.IconImg ? (
                        <img src={f.IconImg} alt="" style={{ width: 20, height: 20 }} />
                      ) : f.Icon ? (
                        <f.Icon style={{ width: 18, height: 18, color: f.accent }} />
                      ) : null}
                    </div>

                    {/* Text */}
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        color: "#e4e4e7",
                        letterSpacing: "-0.02em",
                        marginBottom: "0.5rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {f.title}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#52525b", lineHeight: 1.65, fontWeight: 400 }}>
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
                Ready to stop
                <br />
                <span className="font-display" style={{ fontStyle: "italic", color: "#52525b" }}>
                  panicking?
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