import { useEffect, useRef, useState } from "react";
import dinoLogo from "@/assets/dinosaurWhite.png";

/**
 * Keeps the splash visible for a minimum time so the runner is actually seen.
 * The clock is shared across mounts (Index → Dashboard both splash), so the
 * minimum applies ONCE per page load — never stacked.
 */
let firstShownAt: number | null = null;
export function useMinSplash(loading: boolean, minMs = 1800): boolean {
  const [, force] = useState(0);
  if (loading && firstShownAt === null) firstShownAt = Date.now();
  const elapsed = firstShownAt === null ? minMs : Date.now() - firstShownAt;
  const show = loading || elapsed < minMs;

  useEffect(() => {
    if (!loading && elapsed < minMs) {
      const t = setTimeout(() => force((x) => x + 1), minMs - elapsed + 30);
      return () => clearTimeout(t);
    }
  }, [loading, elapsed, minMs]);

  return show;
}

const TIPS = [
  "Dusting off the notes",
  "Counting PYQs",
  "Sharpening pencils",
  "Waking up Rex",
  "Almost there",
];

/**
 * Interactive splash — a tiny Chrome-dino runner in the landing hero's room.
 * The dino jogs while the workspace loads; tap anywhere or press Space/↑ to
 * make it hop the stacks of books.
 */
export default function SplashScreen({ label = "Loading workspace" }: { label?: string }) {
  const [tip, setTip] = useState(-1); // -1 shows the label first
  const [jumping, setJumping] = useState(false);
  const [hops, setHops] = useState(0);
  const jumpTimer = useRef<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 1700);
    return () => clearInterval(t);
  }, []);

  const jump = () => {
    if (jumping) return;
    setJumping(true);
    setHops((h) => h + 1);
    jumpTimer.current = window.setTimeout(() => setJumping(false), 560);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (jumpTimer.current) clearTimeout(jumpTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumping]);

  // Same room as the landing hero: dim study, one beam of window light,
  // the pale wordmark. Always dark — it's a brand moment, not a themed page.
  const INK = "#d4e4ec";
  return (
    <div
      className="td-force-dark min-h-screen flex items-center justify-center overflow-hidden relative select-none cursor-pointer"
      style={{ background: "radial-gradient(120% 90% at 30% 20%, #26302c 0%, #161c1a 45%, #0e1211 100%)" }}
      onPointerDown={jump}
      data-splash
    >
      <style>{`
        @keyframes td-splash-pop { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:none} }
        @keyframes td-run    { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-3px) rotate(1.5deg)} }
        @keyframes td-jump   { 0%{transform:translateY(0)} 42%{transform:translateY(-58px) rotate(-4deg)} 100%{transform:translateY(0)} }
        @keyframes td-cactus { 0%{left:104%} 100%{left:-12%} }
        @keyframes td-splash-bar { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
        @keyframes td-tip    { 0%{opacity:0;transform:translateY(4px)} 12%,88%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-4px)} }
        @keyframes td-beam   { 0%,100%{opacity:.8} 50%{opacity:1} }
        @keyframes td-letter { from{transform:translateY(110%)} to{transform:none} }
        @media (prefers-reduced-motion: reduce) {
          [data-splash] * { animation: none !important; }
        }
      `}</style>

      {/* window light */}
      <div aria-hidden className="absolute -top-[20%] left-[22%] w-[40%] h-[140%] pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(220,235,230,0.12) 45%, rgba(220,235,230,0.04) 70%, transparent)", transform: "skewX(-24deg)", filter: "blur(18px)", animation: "td-beam 6s ease-in-out infinite" }} />

      <div className="relative z-10 flex flex-col items-center" style={{ animation: "td-splash-pop .6s cubic-bezier(.22,1,.36,1) both" }}>
        {/* wordmark, letters rising */}
        <p className="font-semibold leading-[0.85] mb-6 whitespace-nowrap" style={{ color: INK, fontSize: "clamp(2.6rem, 9vw, 4.2rem)", letterSpacing: "-0.07em" }} aria-label="TeamDino">
          {"TeamDino".split("").map((ch, i) => (
            <span key={i} className="inline-block align-bottom pb-[0.1em] -mb-[0.1em]" style={{ clipPath: "inset(-0.5em -0.5em 0 -0.5em)" }}>
              <span className="inline-block" style={{ animation: `td-letter .9s cubic-bezier(.16,1,.3,1) ${0.05 + i * 0.045}s both` }}>{ch}</span>
            </span>
          ))}
        </p>

        {/* ── runner stage: the dino hops over stacks of books ── */}
        <div className="relative w-[320px] max-w-[86vw] h-[120px] overflow-hidden">
          <div
            className="absolute left-7 bottom-[8px] w-14 h-14 rounded-2xl flex items-center justify-center z-10 border"
            style={{ background: "rgba(212,228,236,0.10)", borderColor: "rgba(212,228,236,0.22)", backdropFilter: "blur(6px)",
              animation: jumping ? "td-jump .56s cubic-bezier(.3,0,.4,1)" : "td-run .45s ease-in-out infinite" }}
          >
            <img src={dinoLogo} alt="Team Dino" className="w-8 h-8" draggable={false} decoding="sync" />
          </div>

          {/* little book stacks scrolling past */}
          {[{ d: "2.8s", delay: "0s", books: [18, 14] }, { d: "4.1s", delay: "1.4s", books: [14] }].map((o, k) => (
            <span key={k} className="absolute bottom-[7px] flex flex-col items-center gap-[2px]" style={{ animation: `td-cactus ${o.d} linear infinite`, animationDelay: o.delay }}>
              {o.books.map((w, j) => (
                <span key={j} className="block h-[6px] rounded-[2px]" style={{ width: w, background: j === 0 ? "#1E2B7A" : "#0F9D9A", boxShadow: `inset 3px 0 0 ${j === 0 ? "#E0559B" : "#0B7A78"}` }} />
              ))}
            </span>
          ))}

          {/* floor */}
          <div className="absolute bottom-[6px] left-0 right-0 h-px" style={{ background: "rgba(212,228,236,0.25)" }} />
        </div>

        {/* cycling loading text */}
        <p key={tip} className="font-medium tracking-wide mt-5 text-sm" style={{ color: "rgba(212,228,236,0.7)", animation: "td-tip 1.7s ease both" }}>
          {tip < 0 ? label : TIPS[tip]}…
        </p>

        {/* progress */}
        <div className="mt-4 w-44 h-[3px] rounded-full overflow-hidden relative" style={{ background: "rgba(212,228,236,0.12)" }}>
          <div className="absolute top-0 left-0 h-full w-1/3 rounded-full" style={{ background: INK, animation: "td-splash-bar 1.3s ease-in-out infinite" }} />
        </div>

        {/* play hint / hop counter */}
        <p className="text-[11px] mt-4 font-medium tracking-wide" style={{ color: "rgba(212,228,236,0.4)" }}>
          {hops === 0 ? "tap or press space to jump" : hops === 1 ? "nice hop!" : `${hops} hops — dino approves`}
        </p>
      </div>
    </div>
  );
}
