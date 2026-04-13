import { Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import dinoLogo from "@/assets/dinosaurWhite.png";
import genai from "@/assets/aiWhite.png";

interface DashboardHeaderProps {
  profile: { department: string; semester: number } | null;
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  handleTabClick: (tab: any) => void;
  handleSignOut: () => void;
}

export function DashboardHeader({
  profile,
  activeTab,
  searchQuery,
  setSearchQuery,
  handleTabClick,
  handleSignOut,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const showSearch = activeTab === "subjects" || activeTab === "ai_subjects";

  return (
    <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo Area */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-16 h-16 flex items-center rounded-3xl border border-white/20 justify-center relative group cursor-default">
              <img src={dinoLogo} alt="Team Dino" className="w-10 h-10 opacity-90 rounded-xl" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold tracking-tight text-white">Team Dino</h1>
              {profile && (
                <p className="text-xs font-medium text-zinc-500 tracking-wider uppercase mt-0.5">
                  {profile.department} • SEM {profile.semester}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Search Bar */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md relative transition-all duration-300 animate-in fade-in zoom-in-95">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search your subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
              />
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 shrink-0 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTabClick("ai_subjects")}
              className={`bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-100 rounded-full px-3 sm:px-4 transition-all duration-300 ${
                activeTab === "ai_subjects" ? "border-indigo-500/60 shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)]" : ""
              }`}
            >
              <img src={genai} alt="AI" className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline font-medium tracking-wide">AI Tutor</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-full px-3 sm:px-4 transition-colors"
              onClick={() => navigate("/setup?edit=true")}
            >
              <User className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline font-medium">Profile</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-full px-3 sm:px-4 transition-colors"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline font-medium">Log Out</span>
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="md:hidden mt-4 relative transition-all duration-300 animate-in fade-in slide-in-from-top-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search your subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
            />
          </div>
        )}
      </div>
    </header>
  );
}