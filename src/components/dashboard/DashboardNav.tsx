// src/components/dashboard/DashboardNav.tsx
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft,Lock, ChevronRight, BookOpen, CalendarDays, Globe, Calculator, Megaphone, X, EyeOff } from "lucide-react";
import genai from "@/assets/aiWhite.png";
import { PremiumUnlockDialog } from "../premiumUnlockDialog";
import { useSubscription } from "@/hooks/useSubscription";

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
    buttonText: "Start Studying Now",
    requiresSubscription: false,
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
    buttonText: "Get AI Assistance",
    requiresSubscription: false,
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
    buttonText: "Unlock to Access",
    requiresSubscription: true,
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
    buttonText: "Create Now Free",
    requiresSubscription: false,
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
    buttonText: "Unlock to Access",
    requiresSubscription: true,
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
    buttonText: "View Updates",
    requiresSubscription: false,
  }
];

export function DashboardNav({ firstName, activeTab, handleTabClick }: DashboardNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const aiCardRef = useRef<HTMLDivElement>(null);

  const { isSubscribed, refresh: refreshSubscription } = useSubscription();

  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState("premium feature");

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleProtectedCardClick = (card: any) => {
      const isExternal = "externalLink" in card;

      if (isExternal) {
        window.open(card.externalLink, "_blank");
        return;
      }

      if (card.requiresSubscription && !isSubscribed) {
        setLockedFeatureName(card.title);
        setIsPremiumDialogOpen(true);
        return;
      }

      handleTabClick(card.id);
    };

  // ── ONBOARDING TUTORIAL LOGIC ──
  useEffect(() => {
    const hasSeenPermanent = localStorage.getItem("has_seen_ai_tutorial") === "true";
    const hasSeenSession = sessionStorage.getItem("hide_ai_tutorial_session") === "true";

    // FOR TESTING: Comment this line out to see the popup every refresh while building
    // if (hasSeenPermanent || hasSeenSession) return;

    let initTimer: ReturnType<typeof setTimeout>;
    let endTimer: ReturnType<typeof setTimeout>;

    initTimer = setTimeout(() => {
      setShowTutorial(true);

      if (aiCardRef.current && scrollContainerRef.current) {
        const isMobile = window.innerWidth < 640;
        // Perfectly center the 240px card on mobile.
        const scrollOffset = isMobile ? (window.innerWidth - 240) / 2 : 40;
        
        scrollContainerRef.current.scrollTo({
          left: aiCardRef.current.offsetLeft - scrollOffset,
          behavior: "smooth",
        });
      }
    }, 1000);

    endTimer = setTimeout(() => {
      dismissTutorial();
    }, 15000);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(endTimer);
    };
  }, []);

  useEffect(() => {
    if (showTutorial) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showTutorial]);

  const dismissTutorial = () => setShowTutorial(false);

  const muteForSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem("hide_ai_tutorial_session", "true");
    dismissTutorial();
  };

  const mutePermanently = () => {
    localStorage.setItem("has_seen_ai_tutorial", "true");
    dismissTutorial();
  };

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
    <div className="space-y-4 relative">

      {/* ── BLURRED BACKDROP OVERLAY ── */}
      {showTutorial && (
        <div
          className="fixed inset-0 z-[60] bg-[#09090b]/80 backdrop-blur-xl animate-in fade-in duration-700 pointer-events-auto"
          onClick={dismissTutorial}
        />
      )}

      {/* ── HEADER ── */}
      <div className="flex items-start sm:items-center justify-between px-2 animate-in slide-in-from-bottom-4 fade-in duration-700 gap-4 relative z-[50]">
        <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          Hey {firstName},{" "}
          <span className="text-zinc-500 font-medium block sm:inline">
            check the latest tools.
          </span>
        </h2>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-1 sm:pt-0">
          <Button
            variant="outline" size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-zinc-900/50 border-white/10 text-white hover:bg-white hover:text-black disabled:opacity-30 transition-all"
            onClick={() => scroll("left")} disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="outline" size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-zinc-900/50 border-white/10 text-white hover:bg-white hover:text-black disabled:opacity-30 transition-all"
            onClick={() => scroll("right")} disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>

      {/* ── CARD SCROLL CONTAINER ── */}
      <div className={`relative animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150 fill-mode-both ${showTutorial ? 'z-[65]' : 'z-10'}`}>
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          /* Added extra bottom padding on mobile (pb-[200px]) so the attached popup isn't clipped by overflow */
          className="flex overflow-x-auto pt-8 pb-[200px] sm:py-12 -mt-8 -mb-[200px] sm:-my-8 -mx-4 px-4 sm:px-6 gap-4 sm:gap-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {navCards.map((card) => {

            const isLocked = !!card.requiresSubscription && !isSubscribed;
            const isExternal = "externalLink" in card;
            const isActive = activeTab === card.id && !isExternal;
            const isAiCard = card.id === "ai_subjects";

            const isDimmed = showTutorial && !isAiCard;
            const isSpotlit = showTutorial && isAiCard;

            return (
              <div
                key={card.id}
                ref={isAiCard ? aiCardRef : null}
                className={`
                  snap-center shrink-0 relative transition-all duration-700
                  ${isDimmed ? "opacity-20 blur-[4px] scale-95 pointer-events-none" : "z-20"}
                  ${isSpotlit ? "z-[100]" : ""}
                `}
              >

                {/* ── THE TUTORIAL POPUP (Attached below on Mobile, Right on Desktop) ── */}
                {isSpotlit && (
                  <div className="absolute top-[calc(100%+16px)] left-0 right-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:left-[calc(100%+2rem)] sm:translate-x-0 sm:w-[320px] z-[110] animate-in zoom-in-95 slide-in-from-bottom-4 fade-in duration-500 fill-mode-both drop-shadow-2xl">
                    <div className="bg-[#121216]/85 backdrop-blur-3xl border border-white/15 rounded-[20px] sm:rounded-[28px] p-3.5 sm:p-5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]">

                      <div className="flex items-start justify-between mb-2.5 sm:mb-3">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          {/* Premium Frosted Glass Icon Box - Scaled down for mobile */}
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[14px] bg-gradient-to-b from-white/10 to-transparent border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center shrink-0 backdrop-blur-md">
                            <img src={genai} alt="AI" className="w-3.5 h-3.5 sm:w-5 sm:h-5 opacity-90 drop-shadow-md" />
                          </div>

                          <div>
                            <span className="text-[8px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
                              Intelligence
                            </span>
                            <h4 className="text-[13px] sm:text-base font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500">
                              Your Personal AI Tutor
                            </h4>
                          </div>
                        </div>

                        {/* Refined Close Button */}
                        <button
                          onClick={dismissTutorial}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/[0.03] hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all border border-transparent hover:border-white/10 shrink-0 mt-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-zinc-400 text-[10px] sm:text-xs leading-relaxed mb-3 sm:mb-5">
                        Generate custom framed questions, get concept breakdowns, and test your knowledge instantly.
                      </p>

                      <div className="space-y-1.5 sm:space-y-3">
                        <Button
                          onClick={() => { mutePermanently(); handleTabClick("ai_subjects"); }}
                          className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-8 sm:h-10 rounded-md sm:rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all active:scale-95 text-[11px] sm:text-sm"
                        >
                          Try it out
                        </Button>
                        <button
                          onClick={muteForSession}
                          className="w-full flex items-center justify-center gap-1.5 text-[9px] sm:text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors py-1"
                        >
                          <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          Don't show again this session
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* ── THE CARD ITSELF ── */}
                <div
                  onClick={() => {
                          if (isDimmed) return;

                          if (isSpotlit) {
                            mutePermanently();
                            handleTabClick(card.id);
                            return;
                          }

                          if (!showTutorial) {
                            handleProtectedCardClick(card);
                          }
                        }}
                
                
                  className={`
                    w-[240px] sm:w-[280px] h-[300px] sm:h-[360px]
                    rounded-[24px] sm:rounded-[32px] p-6 sm:p-8
                    flex flex-col justify-between cursor-pointer
                    relative overflow-hidden group border transition-all duration-500
                    ${isActive
                      ? `bg-white border-transparent text-black scale-[1.02] ${card.glow}`
                      : `bg-gradient-to-br ${card.bgGradient} border-white/10 text-white hover:border-white/20 hover:scale-[1.02]`
                    }
                    ${isSpotlit ? "ring-2 sm:ring-4 ring-white/30 border-transparent shadow-[0_0_80px_rgba(255,255,255,0.15)] scale-[1.05]" : ""}
                  `}
                >
                  {isLocked && (
                      <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-zinc-200 text-[10px] font-bold tracking-widest uppercase backdrop-blur-md">
                        <Lock className="w-3 h-3" />
                        Locked
                      </div>
                    )}

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
                          ${
                            isLocked
                              ? "bg-white/10 text-white hover:bg-white/15"
                              : isActive
                                ? "bg-black text-white hover:bg-zinc-800 hover:scale-[1.02]"
                                : "bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02]"
                          }
                        `}
                      >
                        {isLocked ? "Unlock for ₹11" : card.buttonText}
                      </Button>
                    </div>
                  </div>

                  <card.icon
                    className={`absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-40 h-40 sm:w-48 sm:h-48 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3
                      ${isActive ? "text-black/5" : card.iconTint}
                    `}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <PremiumUnlockDialog
            open={isPremiumDialogOpen}
            onOpenChange={setIsPremiumDialogOpen}
            title="Unlock Premium Access"
            description="Pay ₹11 once to unlock the full website, including premium calculators, advanced units, and other locked features."
            featureName={lockedFeatureName}
            priceLabel="₹11"
            onPaymentSuccess={async () => {
              await refreshSubscription();
              setIsPremiumDialogOpen(false);
            }}
          />
    </div>
  );
}