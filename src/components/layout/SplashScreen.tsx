import { useEffect, useRef, useState } from "react";
import dinoLogo from "@/assets/dinosaurWhite.png";

const TIPS = [
  "Dusting off the notes",
  "Counting PYQs",
  "Sharpening pencils",
  "Waking up Study-With-AI",
  "Almost there",
];

/**
 * Interactive splash — a tiny Chrome-dino runner. The dino jogs while the
 * workspace loads; tap anywhere or press Space/↑ to make it hop the cacti.
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

  return (
    <div
      className="td-app min-h-screen td-base flex items-center justify-center overflow-hidden relative select-none cursor-pointer"
      onPointerDown={jump}
      data-splash
    >
      <style>{`
        @keyframes td-splash-pop { 0%{opacity:0;transform:scale(.9)} 100%{opacity:1;transform:scale(1)} }
        @keyframes td-run    { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-3px) rotate(1.5deg)} }
        @keyframes td-jump   { 0%{transform:translateY(0)} 42%{transform:translateY(-58px) rotate(-4deg)} 100%{transform:translateY(0)} }
        @keyframes td-cactus { 0%{left:104%} 100%{left:-10%} }
        @keyframes td-cloud  { 0%{left:104%} 100%{left:-18%} }
        @keyframes td-splash-bar { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
        @keyframes td-tip    { 0%{opacity:0;transform:translateY(4px)} 12%,88%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-4px)} }
        @media (prefers-reduced-motion: reduce) {
          [data-splash] * { animation: none !important; }
        }
      `}</style>

      <div className="relative z-10 flex flex-col items-center" style={{ animation: "td-splash-pop .5s cubic-bezier(.22,1,.36,1) both" }}>
        {/* ── runner stage ── */}
        <div className="relative w-[320px] max-w-[86vw] h-[130px] overflow-hidden">
          {/* clouds */}
          <span className="absolute top-2 text-white/15 text-xs tracking-[0.3em]" style={{ animation: "td-cloud 7s linear infinite" }}>☁</span>
          <span className="absolute top-8 text-white/10 text-[10px] tracking-[0.3em]" style={{ animation: "td-cloud 10s linear infinite", animationDelay: "3s" }}>☁</span>

          {/* dino */}
          <div
            className="absolute left-7 bottom-[10px] w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl z-10"
            style={{ animation: jumping ? "td-jump .56s cubic-bezier(.3,0,.4,1)" : "td-run .45s ease-in-out infinite" }}
          >
            <img src={dinoLogo} alt="Team Dino" className="w-8 h-8" draggable={false} />
          </div>

          {/* cacti scrolling past */}
          <span className="absolute bottom-[8px] text-xl leading-none" style={{ animation: "td-cactus 2.8s linear infinite" }}>🌵</span>
          <span className="absolute bottom-[8px] text-sm leading-none" style={{ animation: "td-cactus 4.1s linear infinite", animationDelay: "1.4s" }}>🌵</span>

          {/* ground */}
          <div className="absolute bottom-[6px] left-0 right-0 h-px bg-white/20" />
          <div className="absolute bottom-[1px] left-0 right-0 flex justify-between px-2 text-white/10 text-[8px] tracking-[0.5em]">····································</div>
        </div>

        {/* cycling loading text */}
        <p key={tip} className="text-zinc-400 font-medium tracking-wide mt-5 text-sm" style={{ animation: "td-tip 1.7s ease both" }}>
          {tip < 0 ? label : TIPS[tip]}…
        </p>

        {/* progress shimmer (solid) */}
        <div className="mt-4 w-44 h-[3px] rounded-full bg-white/8 overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-1/3 rounded-full td-accent-solid" style={{ animation: "td-splash-bar 1.3s ease-in-out infinite" }} />
        </div>

        {/* play hint / hop counter */}
        <p className="text-zinc-600 text-[11px] mt-4 font-medium tracking-wide">
          {hops === 0 ? "tap or press space to jump 🦕" : hops === 1 ? "nice hop! 🦕" : `${hops} hops — dino approves 🦕`}
        </p>
      </div>
    </div>
  );
}
