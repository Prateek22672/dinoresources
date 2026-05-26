import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import dinoLogo from "@/assets/dinosaurWhite.png";
import genai from "@/assets/aiWhite.png";
import aiText from "@/assets/genaiWhite.png";

const YEAR_SHORT: Record<string, string> = {
  "1st Year": "Y1",
  "2nd Year": "Y2",
  "3rd Year": "Y3",
  "4th Year": "Y4",
  "Supplementary": "Supp",
};

interface DashboardHeaderProps {
  profile: { department: string; semester: string } | null;
  activeTab: string;
  handleTabClick: (tab: any) => void;
  handleSignOut: () => void;
}

export function DashboardHeader({
  profile,
  activeTab,
  handleTabClick,
  handleSignOut,
}: DashboardHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-20">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">

          {/* Logo Area */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/10 blur-xl opacity-20"></div>
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-3xl sm:rounded-2xl bg-white/5 border border-white/20 backdrop-blur-md">
                <img src={dinoLogo} className="w-6 h-6 sm:w-10 sm:h-10 opacity-90" />
              </div>
            </div>

            <div className="flex flex-col leading-tight">
              <h1 className="text-base sm:text-xl font-semibold text-white tracking-tight">
                Team Dino
              </h1>
              {profile && (
                <p className="text-[9px] sm:text-xs text-zinc-400 uppercase tracking-wider mt-0.5">
                  <span className="hidden sm:inline">{profile.department} • {profile.semester}</span>
                  <span className="sm:hidden">
                    {profile.department.substring(0, 3)} • {YEAR_SHORT[profile.semester] ?? profile.semester}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5 sm:gap-3 shrink-0 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTabClick("ai_subjects")}
              className={`bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-100 rounded-full px-2.5 sm:px-4 transition-all duration-300 ${
                activeTab === "ai_subjects" ? "border-indigo-500/60 shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)]" : ""
              }`}
            >
              <img src={genai} alt="AI" className="w-4 h-4 sm:hidden" />
              <img src={aiText} alt="GenAI" className="hidden sm:inline w-auto h-5 mr-1.5" />
              <span className="hidden sm:inline font-medium tracking-wide">Study Now</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-full px-2.5 sm:px-4 transition-colors"
              onClick={() => navigate("/setup?edit=true")}
            >
              <User className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline font-medium">Profile</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-full px-2.5 sm:px-4 transition-colors"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline font-medium">Log Out</span>
            </Button>
          </div>

        </div>
      </div>
    </header>
  );
}