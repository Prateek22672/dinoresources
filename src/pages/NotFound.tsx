import { useNavigate } from "react-router-dom";
import FuzzyText from "@/components/reactbits/FuzzyText";
import dinoLogo from "@/assets/dinosaurWhite.png";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
      style={{ background: "#08080a" }}>
      {/* premium backdrop */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
        backgroundSize: "23px 23px",
        maskImage: "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 72%)",
        WebkitMaskImage: "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 72%)",
      }} />
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(50% 35% at 50% 8%, rgba(124,108,240,0.16), transparent 62%)",
      }} />

      <div className="relative z-10 flex flex-col items-center">
        {/* logo */}
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-8 shadow-2xl animate-[ntfFloat_3.5s_ease-in-out_infinite]">
          <img src={dinoLogo} alt="TeamDino" className="w-9 h-9" />
        </div>

        {/* fuzzy 404 */}
        <FuzzyText fontSize="clamp(4rem, 18vw, 11rem)" fontWeight={900} color="#fafafa" baseIntensity={0.18} hoverIntensity={0.55} fuzzRange={28}>
          404
        </FuzzyText>

        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-4">Page not found</h1>
        <p className="text-zinc-500 text-sm mt-2 max-w-sm leading-relaxed">
          The page you’re looking for drifted off. Let’s get you back to your workspace.
        </p>

        {/* loading shimmer */}
        <div className="mt-6 w-44 h-[3px] rounded-full bg-white/8 overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-1/3 rounded-full"
            style={{ background: "#a9a0f5", animation: "ntfBar 1.3s ease-in-out infinite" }} />
        </div>

        <div className="flex items-center gap-2 mt-8">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-medium bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
          <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold bg-white text-black hover:bg-zinc-100 hover:scale-[1.02] transition-all">
            <Home className="w-4 h-4" /> Home
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ntfFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes ntfBar { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
      `}</style>
    </div>
  );
};

export default NotFound;
