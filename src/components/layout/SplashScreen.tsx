import dinoLogo from "@/assets/dinosaurWhite.png";

/** Premium full-page loading splash with an animated halo + shimmer. */
export default function SplashScreen({ label = "Loading workspace" }: { label?: string }) {
  return (
    <div className="td-app min-h-screen td-base flex items-center justify-center overflow-hidden relative">
      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(60% 50% at 50% 45%, rgba(124,108,240,0.12), transparent 70%)",
      }} />
      <style>{`
        @keyframes td-splash-pop { 0%{opacity:0;transform:scale(.85)} 100%{opacity:1;transform:scale(1)} }
        @keyframes td-splash-halo { 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(1.25);opacity:.15} }
        @keyframes td-splash-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes td-splash-bar { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
      `}</style>

      <div className="relative z-10 flex flex-col items-center" style={{ animation: "td-splash-pop .5s cubic-bezier(.22,1,.36,1) both" }}>
        <div className="relative" style={{ animation: "td-splash-float 3s ease-in-out infinite" }}>
          {/* pulsing halo */}
          <div className="absolute inset-0 rounded-[28px]" style={{
            background: "rgba(124,108,240,0.35)", filter: "blur(22px)",
            animation: "td-splash-halo 2.4s ease-in-out infinite",
          }} />
          <div className="relative w-20 h-20 rounded-[28px] bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl">
            <img src={dinoLogo} alt="Team Dino" className="w-11 h-11" />
          </div>
        </div>

        <p className="text-zinc-400 font-medium tracking-wide mt-7 text-sm">{label}…</p>

        {/* shimmer progress bar */}
        <div className="mt-4 w-44 h-[3px] rounded-full bg-white/8 overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-1/3 rounded-full"
            style={{ background: "#a9a0f5", animation: "td-splash-bar 1.3s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}
