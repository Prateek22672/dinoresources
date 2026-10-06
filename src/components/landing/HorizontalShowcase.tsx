import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, FileText, Star, Calculator, Check, Wallet, Lightbulb } from "lucide-react";

interface Card {
  eyebrow: string;
  title: string;
  desc: string;
  icon: any;
  from: string;
  to: string;
  art: ReactNode;
}

/* ── tiny illustrations, one per card ───────────────────────────────── */
const Files = () => (
  <div className="space-y-2">
    {[["Unit 1 — Notes", "24 pages"], ["Unit 2 — Notes", "31 pages"], ["Unit 3 — Short notes", "9 pages"]].map(([t, m], i) => (
      <div key={t} className="flex items-center gap-3 rounded-2xl bg-white/90 text-black px-3.5 py-2.5 shadow-lg" style={{ transform: `translateX(${i * 6}px)` }}>
        <span className="w-8 h-8 rounded-xl bg-black/[0.06] flex items-center justify-center"><FileText className="w-4 h-4" /></span>
        <span className="text-[13px] font-bold flex-1">{t}</span>
        <span className="text-[11px] text-black/45 font-semibold">{m}</span>
      </div>
    ))}
  </div>
);

const Questions = () => (
  <div className="space-y-2">
    {[["Explain the 5 Vs of Big Data", "asked 4×"], ["Compare 3NF and BCNF", "asked 3×"], ["Draw the TCP state diagram", "asked 3×"]].map(([q, n]) => (
      <div key={q} className="flex items-center gap-2.5 rounded-2xl bg-black/25 border border-white/20 px-3.5 py-2.5">
        <Star className="w-3.5 h-3.5 shrink-0" fill="currentColor" />
        <span className="text-[13px] font-semibold flex-1">{q}</span>
        <span className="text-[10px] font-black uppercase tracking-wider bg-white text-black rounded-full px-2 py-0.5">{n}</span>
      </div>
    ))}
  </div>
);

const Chat = () => (
  <div className="space-y-2.5">
    <div className="flex justify-end"><span className="bg-white text-black rounded-2xl rounded-br-md px-3.5 py-2 text-[13px] font-semibold">Explain normalization with an example.</span></div>
    <div className="bg-black/30 border border-white/15 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] leading-relaxed max-w-[92%]">
      Normalization splits data into related tables to remove redundancy. 1NF = atomic values, 2NF = no partial dependency, 3NF = no transitive…
    </div>
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/15 rounded-full px-2.5 py-1"><FileText className="w-3 h-3" /> From Unit 3 notes · p. 4</span>
  </div>
);

const Gauge = () => (
  <div className="flex items-center gap-4">
    <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="10" fill="none" />
      <circle cx="50" cy="50" r="40" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray="251" strokeDashoffset="38" transform="rotate(-90 50 50)" />
      <text x="50" y="52" textAnchor="middle" fill="#fff" fontWeight="900" fontSize="22">8.7</text>
      <text x="50" y="67" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontWeight="700" fontSize="9">SGPA</text>
    </svg>
    <div className="space-y-2">
      <span className="block bg-white text-black rounded-full px-3 py-1.5 text-[12px] font-extrabold">Can skip 2 classes</span>
      <span className="block bg-black/25 border border-white/20 rounded-full px-3 py-1.5 text-[12px] font-bold">Still at 76%</span>
    </div>
  </div>
);

const Price = () => (
  <div className="flex items-end gap-3">
    <span className="text-[3.4rem] font-black leading-none tracking-tight">₹11</span>
    <span className="pb-2 space-y-1">
      <span className="block text-[12px] font-bold opacity-80">per subject, one time</span>
      <span className="block text-[12px] font-bold opacity-80">full-year packs save more</span>
    </span>
  </div>
);

const CARDS: Card[] = [
  { eyebrow: "Notes & material", title: "Every unit, on one shelf", desc: "Curated notes and files for each unit — no more digging through ten WhatsApp groups.", icon: FileText, from: "#6f8fe0", to: "#1b2350", art: <Files /> },
  { eyebrow: "Important Qs & PYQs", title: "Revise what actually gets asked", desc: "The questions that keep coming back, picked out unit by unit, next to real previous papers.", icon: Star, from: "#e6c25e", to: "#6b4a12", art: <Questions /> },
  { eyebrow: "Rex, the AI tutor", title: "A tutor that read your notes", desc: "Ask anything — Rex explains from your subject's own material and shows the page it came from.", icon: Lightbulb, from: "#8b7fd8", to: "#2c2363", art: <Chat /> },
  { eyebrow: "Free tools", title: "Know exactly where you stand", desc: "SGPA, CGPA predictor and attendance planner on the GITAM grade chart. No login.", icon: Calculator, from: "#7fc4ad", to: "#1d4038", art: <Gauge /> },
  { eyebrow: "Fair pricing", title: "Pay once. Keep it.", desc: "Unlock one subject or your whole year. No subscription, no card on file.", icon: Wallet, from: "#e07a8e", to: "#4a1830", art: <Price /> },
];

/**
 * Feature tour as a horizontal row of cards in 3D.
 *
 * Desktop: the section pins while you scroll down and the row slides
 * sideways; each card turns to face you as it reaches the middle and turns
 * away in depth as it leaves, with a progress bar along the bottom.
 * Phones: the same cards in a native swipe row (pinning a horizontal scroll
 * under a thumb fights the page), still turning as they pass the centre.
 * Reduced motion: a flat, swipeable row.
 *
 * Transforms are written straight to the DOM in a rAF so scrolling never
 * re-renders React.
 */
export default function HorizontalShowcase({ onStart }: { onStart: () => void }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const [mode, setMode] = useState<"pin" | "swipe" | "flat">("pin");

  useEffect(() => {
    const decide = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setMode("flat");
      else setMode(window.innerWidth >= 768 ? "pin" : "swipe");
    };
    decide();
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, []);

  useEffect(() => {
    if (mode === "flat") return;
    let raf = 0;

    // every card: angle and depth from its distance to the viewport centre
    const shade = () => {
      const mid = window.innerWidth / 2;
      for (const c of cards.current) {
        if (!c) continue;
        const r = c.getBoundingClientRect();
        const d = Math.max(-1.6, Math.min(1.6, (r.left + r.width / 2 - mid) / r.width));
        const a = Math.abs(d);
        c.style.transform = `perspective(1400px) rotateY(${(-d * 24).toFixed(2)}deg) translateZ(${(-a * 140).toFixed(1)}px) scale(${(1 - a * 0.06).toFixed(3)})`;
        c.style.opacity = String(Math.max(0.35, 1 - a * 0.4));
      }
    };

    const frame = () => {
      raf = 0;
      if (mode === "pin" && section.current && track.current) {
        const s = section.current.getBoundingClientRect();
        const total = s.height - window.innerHeight;
        const p = Math.max(0, Math.min(1, -s.top / Math.max(1, total)));
        const travel = track.current.scrollWidth - window.innerWidth;
        track.current.style.transform = `translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
        if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(3)})`;
      }
      shade();
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    frame();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    const swipe = track.current;
    if (mode === "swipe") swipe?.addEventListener("scroll", kick, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      swipe?.removeEventListener("scroll", kick);
    };
  }, [mode]);

  const head = (
    <div className="max-w-6xl mx-auto px-5 mb-8 sm:mb-10">
      <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-2" style={{ color: "var(--td-accent-soft)" }}>What's inside</p>
      <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.05]">Everything for your exams,<br className="hidden sm:block" /> in one scroll.</h2>
    </div>
  );

  const cardEls = [
    ...CARDS.map((c, i) => (
      <article
        key={c.title}
        ref={(el) => { cards.current[i] = el; }}
        className="shrink-0 w-[82vw] sm:w-[440px] lg:w-[500px] h-[460px] sm:h-[min(500px,calc(100vh-230px))] sm:min-h-[380px] rounded-[32px] p-7 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden snap-center will-change-transform"
        style={{ background: `linear-gradient(155deg, ${c.from}, ${c.to})`, boxShadow: "0 40px 80px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.25)" }}
      >
        <span aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.25), transparent 55%)" }} />
        <div className="relative z-10 flex items-center justify-between">
          <span className="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center"><c.icon className="w-5 h-5" /></span>
          <span className="text-[12px] font-black tracking-widest opacity-60">0{i + 1} / 0{CARDS.length}</span>
        </div>
        <div className="relative z-10">{c.art}</div>
        <div className="relative z-10">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-70">{c.eyebrow}</p>
          <h3 className="text-[1.7rem] sm:text-[2rem] font-extrabold tracking-tight leading-[1.08] mt-1">{c.title}</h3>
          <p className="text-[14px] opacity-80 leading-relaxed mt-2">{c.desc}</p>
        </div>
      </article>
    )),
    <article
      key="cta"
      ref={(el) => { cards.current[CARDS.length] = el; }}
      className="shrink-0 w-[82vw] sm:w-[440px] lg:w-[500px] h-[460px] sm:h-[min(500px,calc(100vh-230px))] sm:min-h-[380px] rounded-[32px] p-8 bg-white text-black flex flex-col justify-between snap-center will-change-transform"
      style={{ boxShadow: "0 40px 80px -30px rgba(255,255,255,0.25)" }}
    >
      <span className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center"><Check className="w-5 h-5" /></span>
      <div>
        <h3 className="text-[2.2rem] font-extrabold tracking-tight leading-[1.02]">Your next exam,<br />sorted.</h3>
        <p className="text-black/60 text-[15px] mt-3">Free to start. The calculators don't even need a login.</p>
        <button onClick={onStart} className="mt-6 bg-black text-white rounded-full h-12 px-6 text-[14px] font-bold inline-flex items-center gap-2 hover:scale-[1.03] transition-transform">
          Get started free <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </article>,
  ];

  if (mode === "pin") {
    return (
      <section ref={section} className="relative z-10" style={{ height: `${(CARDS.length + 1) * 62 + 40}vh` }}>
        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
          {head}
          <div ref={track} className="flex gap-6 pl-[max(20px,calc((100vw-72rem)/2+20px))] pr-[20vw] will-change-transform" style={{ transformStyle: "preserve-3d" }}>
            {cardEls}
          </div>
          <div className="max-w-6xl w-full mx-auto px-5 mt-10">
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div ref={bar} className="h-full rounded-full origin-left" style={{ background: "var(--td-accent)", transform: "scaleX(0)" }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={section} className="relative z-10 py-16">
      {head}
      <div ref={track} className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-4 [&::-webkit-scrollbar]:hidden">
        {cardEls}
      </div>
    </section>
  );
}
