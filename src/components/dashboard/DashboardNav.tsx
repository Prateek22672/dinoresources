import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, CalendarDays, Globe, Calculator, Megaphone, Coffee } from "lucide-react";
import genai from "@/assets/aiWhite.png";

interface DashboardNavProps {
  firstName: string;
  activeTab: string;
  handleTabClick: (tab: any) => void;
}

const GenAIIcon = ({ className }: { className?: string }) => (
  <img src={genai} alt="AI" className={className} />
);

const navCards = [
  { 
    id: "subjects", 
    overline: "LEARNING", 
    title: "Your Subjects", 
    desc: "Access all your organized course materials.", 
    icon: BookOpen,
    bgGradient: "from-blue-900/40 to-indigo-900/40",
    iconTint: "text-blue-400/20",
    glow: "shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]",
    buttonText: "Start Studying Now"
  },
  { 
    id: "ai_subjects", 
    overline: "AI LEARNING", 
    title: "Study with AI", 
    desc: "Access smart AI tools, summaries, and personalized help.", 
    icon: GenAIIcon, 
    bgGradient: "from-indigo-900/40 to-purple-900/40",
    iconTint: "opacity-10 grayscale",
    glow: "shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)]",
    buttonText: "Get AI Assistance"
  },
  { 
    id: "foliofyx", 
    overline: "Create Your Website", 
    title: "FolioFYX", 
    desc: "Create a professional portfolio website! Share it to stand out.", 
    icon: Globe,
    bgGradient: "from-fuchsia-900/40 to-pink-900/40", 
    iconTint: "text-fuchsia-400/20",
    glow: "shadow-[0_0_30px_-5px_rgba(217,70,239,0.15)]",
    externalLink: "https://www.foliofyx.in",
    buttonText: "Create Now Free"
  },
  { 
    id: "announcements", 
    overline: "UPDATES", 
    title: "Announcements", 
    desc: "Stay informed with campus news.", 
    icon: Megaphone,
    bgGradient: "from-amber-900/40 to-orange-900/40",
    iconTint: "text-orange-400/20",
    glow: "shadow-[0_0_30px_-5px_rgba(249,115,22,0.15)]",
    buttonText: "View Updates"
  },
  { 
    id: "attendance", 
    overline: "TRACKING", 
    title: "Attendance", 
    desc: "Calculate your required classes.", 
    icon: CalendarDays,
    bgGradient: "from-teal-900/40 to-emerald-900/40",
    iconTint: "text-emerald-400/20",
    glow: "shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]",
    buttonText: "Start Checking Now"
  }, 
  {
    id: "sgpa",
    overline: "PERFORMANCE",
    title: "SGPA Calc",
    desc: "Estimate your semester grades easily.",
    icon: Calculator,
    bgGradient: "from-violet-900/40 to-purple-900/40",
    iconTint: "text-purple-400/20",
    glow: "shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]",
    buttonText: "Start Checking Now"
  },
];

export function DashboardNav({ firstName, activeTab, handleTabClick }: DashboardNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const isMobile = window.innerWidth < 640;
      const scrollAmount = direction === "left" ? (isMobile ? -260 : -320) : (isMobile ? 260 : 320);
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start sm:items-center justify-between px-2 animate-in slide-in-from-bottom-4 fade-in duration-700 gap-4">
        <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          Hey {firstName}, <span className="text-zinc-500 font-medium block sm:inline">check the latest tools for your semester.</span>
        </h2>

        {/* Removed "hidden md:flex" so buttons show on mobile too */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-1 sm:pt-0">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-zinc-900/50 border-white/10 text-white hover:bg-white hover:text-black disabled:opacity-30 transition-all"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-zinc-900/50 border-white/10 text-white hover:bg-white hover:text-black disabled:opacity-30 transition-all"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
      
      <div className="relative animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150 fill-mode-both">
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto pb-8 pt-4 -mx-4 px-4 sm:px-6 gap-4 sm:gap-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {navCards.map((card) => {
            const isExternal = "externalLink" in card;
            const isActive = activeTab === card.id && !isExternal;

            return (
              <div
                key={card.id}
                onClick={() => isExternal ? window.open((card as any).externalLink, '_blank') : handleTabClick(card.id)}
                className={`snap-center shrink-0 w-[240px] sm:w-[280px] h-[300px] sm:h-[360px] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all duration-500 relative overflow-hidden group border
                  ${isActive
                    ? `bg-white border-transparent text-black scale-[1.02] ${card.glow}`
                    : `bg-gradient-to-br ${card.bgGradient} border-white/10 text-white hover:border-white/20 hover:scale-[1.02]`
                  }
                `}
              >
                <div className="z-10 flex flex-col h-full">
                  <div>
                    <p className={`text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-2 sm:mb-3 ${isActive ? "text-zinc-500" : "text-zinc-300"}`}>
                      {card.overline}
                    </p>
                    <h3 className={`text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-3 sm:mb-4 ${isActive ? "text-black" : "text-white"}`}>
                      {card.title}
                    </h3>
                    <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isActive ? "text-zinc-600" : "text-zinc-300"}`}>
                      {card.desc}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 relative z-20">
                    <Button
                      className={`w-full rounded-full font-bold shadow-none py-5 sm:py-6 text-xs sm:text-sm transition-all duration-300
                        ${isActive 
                          ? "bg-black text-white hover:bg-zinc-800 hover:scale-[1.02]" 
                          : "bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02]"
                        }
                      `}
                    >
                      {card.buttonText}
                    </Button>
                  </div>
                </div>

                <card.icon
                  className={`absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-40 h-40 sm:w-48 sm:h-48 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3
                    ${isActive ? "text-black/5" : card.iconTint}
                  `}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}