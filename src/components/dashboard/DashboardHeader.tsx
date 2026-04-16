import { User, LogOut, ShieldCheck, ArrowUpRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dinoLogo from "@/assets/dinosaurWhite.png";

export function DashboardHeader({
  profile,
  activeTab,
  handleTabClick,
  handleSignOut,
  onUpgradeClick,
}) {
  const navigate = useNavigate();
  const isPro = profile?.is_pro;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#0b0b0d]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LEFT: Branding & Student Info */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => navigate("/")}
            className="group relative w-10 h-10 flex items-center justify-center bg-zinc-900 border border-white/10 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <img src={dinoLogo} className="w-6 h-6 object-contain" alt="Logo" />
            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-zinc-100">
                Team Dino
              </h1>

              {isPro ? (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pro</span>
                </div>
              ) : (
                <button
                  onClick={() => onUpgradeClick?.()}
                  className="group flex items-center gap-1 px-2 py-0.5 bg-zinc-800/40 border border-zinc-700/50 rounded-md hover:bg-zinc-100 transition-all duration-300"
                >
                  <span className="text-[10px] font-medium text-zinc-400 group-hover:text-black transition-colors">
                    Upgrade
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-black transition-colors" />
                </button>
              )}
            </div>

            {profile && (
              <p className="text-[11px] font-medium text-zinc-500 leading-none mt-1">
                {profile.department} <span className="mx-1 opacity-20">|</span> Sem {profile.semester}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          
          {/* AI STUDY BUTTON - White Background Style */}
          <button
            onClick={() => handleTabClick("ai_subjects")}
            className={`hidden md:flex items-center gap-2 px-5 h-9 rounded-full text-[12px] font-bold transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]
              ${
                activeTab === "ai_subjects"
                  ? "bg-white text-black ring-4 ring-white/10"
                  : "bg-white text-black hover:bg-zinc-200 border border-white"
              }`}
          >
            Try AI Study
          </button>

          <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            {/* Profile Edit Icon */}
            <button
              onClick={() => navigate("/setup?edit=true")}
              className="p-2.5 rounded-lg bg-zinc-900/50 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/10 transition-all"
              title="Edit Profile"
            >
              <User className="w-4.5 h-4.5" />
            </button>

            {/* Sign Out Icon */}
            <button
              onClick={handleSignOut}
              className="p-2.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}