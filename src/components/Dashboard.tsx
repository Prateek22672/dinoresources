import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  User, 
  LogOut, 
  Upload, 
  BookPlus, 
  BookOpen, 
  CalendarDays, 
  Calculator, 
  Megaphone, 
  Coffee,
  ChevronLeft,
  ChevronRight,
  Globe,
  Search,
  Layers
} from "lucide-react";

import UploadResourceDialog from "./UploadResourceDialog";
// Updated import for the AI Icon
import genai from "@/assets/aiWhite.png";
import SubjectDrawer from "./SubjectDrawer";
import SubjectDrawerAi from "./ai/SubjectDrawerAi"; 
import AddSubjectDialog from "./AddSubjectDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { AnnouncementsSection } from "./AnnouncementsSection";
import { SupportSection } from "./SupportSection";
import AttendanceCalculator from "./AttendanceCalculator";
import SGPACalculator from "./SGPACalculator";
import dinoLogo from "@/assets/image.png";
import Footer from "./Footer"; 

interface Profile {
  department: string;
  semester: number;
  full_name?: string; 
}

interface Subject {
  id: string;
  name: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isContributor, userId, role, isLoading: roleLoading } = useUserRole();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"subjects" | "ai_subjects" | "attendance" | "sgpa" | "announcements" | "support">("subjects");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (profile) {
      loadSubjects();
    }
  }, [profile]);

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
      const scrollAmount = direction === "left" ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleTabClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setTimeout(() => {
      contentAreaRef.current?.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
    }, 100);
  };

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        localStorage.clear(); 
        navigate("/auth");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        localStorage.clear();
        navigate("/auth");
        return;
      }

      if (!profileData?.department || !profileData?.semester) {
        navigate("/setup");
        return;
      }

      setProfile({
        department: profileData.department,
        semester: profileData.semester,
        full_name:" ", 
      });

      setIsLoading(false);
    } catch (err) {
      console.error("Unexpected auth error:", err);
      localStorage.clear();
      navigate("/auth");
    }
  };

  const loadSubjects = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("department", profile.department)
      .eq("semester", profile.semester)
      .order("order_index", { ascending: true });

    if (error) {
      toast.error("Failed to load subjects");
      return;
    }

    setSubjects(data || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDrawerOpen(true);
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const firstName = profile?.full_name && profile.full_name.trim() !== "" ? profile.full_name.split(" ")[0] : "Student";

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center shadow-2xl mx-auto animate-pulse border border-white/10">
            <img src={dinoLogo} alt="Team Dino Logo" className="w-10 h-10 opacity-50" />
          </div>
          <p className="text-zinc-500 font-medium tracking-wide">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Custom icon component for the genai image to use in navCards
  const GenAIIcon = ({ className }: { className?: string; strokeWidth?: number }) => (
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
      desc: "Access smart AI tools, summaries, and personalized help for your subjects.", 
      icon: GenAIIcon, 
      bgGradient: "from-indigo-900/40 to-purple-900/40",
      iconTint: "opacity-10 grayscale", // Adjusted for image icon
      glow: "shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)]",
      buttonText: "Get AI Assistance"
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
      id: "foliofyx", 
      overline: "Create Your Website", 
      title: "FolioFYX", 
      desc: "Create a professional portfolio website! Share it on LinkedIn to stand out.", 
      icon: Globe,
      bgGradient: "from-fuchsia-900/40 to-pink-900/40", 
      iconTint: "text-fuchsia-400/20",
      glow: "shadow-[0_0_30px_-5px_rgba(217,70,239,0.15)]",
      externalLink: "https://www.foliofyx.in",
      buttonText: "Create Now Free"
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
      id: "support", 
      overline: "DONATE", 
      title: "Support Us", 
      desc: "Buy the team a coffee ☕", 
      icon: Coffee,
      bgGradient: "from-rose-900/40 to-pink-900/40",
      iconTint: "text-rose-400/20",
      glow: "shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)]",
      buttonText: "Show Support"
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-white/20 flex flex-col">
      
      {/* Sleek, frosted glass header */}
      <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo Area */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border">
                <img src={dinoLogo} alt="Team Dino" className="w-8 h-8 rounded-xl" />
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
            {(activeTab === "subjects" || activeTab === "ai_subjects") && (
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
              
              {/* AI Tutor Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTabClick("ai_subjects")}
                className={`bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-100 rounded-full px-3 sm:px-4 transition-all duration-300 ${
                  activeTab === "ai_subjects" 
                    ? "border-indigo-500/60 shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)]" 
                    : ""
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
          {(activeTab === "subjects" || activeTab === "ai_subjects") && (
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

      <main className="container mx-auto px-4 py-10 space-y-12 flex-1">
        
        {/* Apple-Style Horizontal Nav Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 animate-in slide-in-from-bottom-4 fade-in duration-700">
            {/* Personalized Greeting */}
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Hey {firstName}, <span className="text-zinc-500 font-medium block sm:inline">check the latest tools for your semester.</span>
            </h2>
            
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-zinc-900/50 border-white/10 text-white hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:bg-zinc-900/50 disabled:hover:text-white transition-all"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-zinc-900/50 border-white/10 text-white hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:bg-zinc-900/50 disabled:hover:text-white transition-all"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="relative animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150 fill-mode-both">
            <div 
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex overflow-x-auto pb-8 pt-4 -mx-4 px-4 sm:px-6 gap-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {navCards.map((card) => {
                const isExternal = "externalLink" in card;
                const isActive = activeTab === card.id && !isExternal;
                
                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      if (isExternal) {
                        window.open((card as any).externalLink, '_blank');
                      } else {
                        handleTabClick(card.id as typeof activeTab);
                      }
                    }}
                    className={`snap-center shrink-0 w-[280px] h-[360px] rounded-[32px] p-8 flex flex-col justify-between cursor-pointer transition-all duration-500 relative overflow-hidden group border
                      ${isActive
                        ? `bg-white border-transparent text-black scale-[1.02] ${card.glow}` 
                        : `bg-gradient-to-br ${card.bgGradient} border-white/10 text-white hover:border-white/20 hover:scale-[1.02]`
                      }
                    `}
                  >
                    <div className="z-10 flex flex-col h-full">
                      <div>
                        <p className={`text-[11px] font-bold tracking-[0.2em] uppercase mb-3 ${isActive ? "text-zinc-500" : "text-zinc-300"}`}>
                          {card.overline}
                        </p>
                        <h3 className={`text-3xl font-semibold tracking-tight leading-tight mb-4 ${isActive ? "text-black" : "text-white"}`}>
                          {card.title}
                        </h3>
                        <p className={`text-sm font-medium leading-relaxed ${isActive ? "text-zinc-600" : "text-zinc-300"}`}>
                          {card.desc}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 relative z-20">
                        <Button 
                          className={`w-full rounded-full font-bold shadow-none py-6 transition-all duration-300
                            ${isActive 
                              ? "bg-black text-white hover:bg-zinc-800 hover:scale-[1.02]" 
                              : "bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02]"
                            }
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isExternal) {
                              window.open((card as any).externalLink, '_blank');
                            } else {
                              handleTabClick(card.id as typeof activeTab);
                            }
                          }}
                        >
                          {(card as any).buttonText}
                        </Button>
                      </div>
                    </div>

                    <card.icon 
                      strokeWidth={1}
                      className={`absolute -bottom-6 -right-6 w-48 h-48 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3
                        ${isActive ? "text-black/5" : card.iconTint}
                      `} 
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div 
          ref={contentAreaRef} 
          className="bg-[#121214] border border-white/5 rounded-[40px] p-6 sm:p-10 min-h-[500px] scroll-mt-24 transition-all duration-500 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300 fill-mode-both shadow-2xl relative overflow-hidden"
        >
          
          {/* Subtle top glare */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {(activeTab === "subjects" || activeTab === "ai_subjects") && (
            <div className="animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
                    {activeTab === "ai_subjects" ? <><img src={genai} alt="AI" className="w-6 h-6" /> Study with AI</> : "Your Subjects"}
                  </h2>
                  <p className="text-zinc-400 font-medium">
                    {activeTab === "ai_subjects" 
                      ? "Select a module to launch your AI study assistant." 
                      : "Select a module to view your study materials."}
                  </p>
                </div>
                
                {isContributor && activeTab === "subjects" && (
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button onClick={() => setIsAddSubjectDialogOpen(true)} variant="outline" className="flex-1 sm:flex-none bg-transparent border-white/10 text-white hover:bg-white hover:text-black rounded-full">
                      <BookPlus className="w-4 h-4 mr-2" />
                      Add Subject
                    </Button>
                    <Button onClick={() => setIsUploadDialogOpen(true)} className="flex-1 sm:flex-none bg-white text-black hover:bg-zinc-200 rounded-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resource
                    </Button>
                  </div>
                )}
              </div>

              {filteredSubjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-white/10 rounded-3xl bg-[#0a0a0c] relative z-10">
                  {activeTab === "ai_subjects" ? (
                    <img src={genai} alt="AI" className="w-12 h-12 opacity-30 mb-4" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-zinc-700 mb-4" />
                  )}
                  <p className="text-zinc-400 font-medium text-center">
                    {searchQuery ? `No subjects found matching "${searchQuery}"` : "No subjects found for this semester."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredSubjects.map((subject, index) => (
                    <div
                      key={subject.id}
                      onClick={() => handleSubjectClick(subject)}
                      className="group aspect-square rounded-[28px] border border-white/5 p-6 flex flex-col justify-between cursor-pointer transition-all duration-500 hover:border-white/10 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden bg-[#18181b] animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Clean Grayscale Image Background */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 mix-blend-screen transition-opacity duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(https://picsum.photos/seed/${subject.id}x/600/600?grayscale)` }}
                      />
                      {/* Smoother Gradient Integration */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-[#18181b]/80 to-transparent" />
                      
                      {/* Badging Content */}
                      <div className="relative z-10 flex justify-start">
                         {activeTab === "ai_subjects" ? (
                            <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                               <img src={genai} alt="AI" className="w-3 h-3" /> AI Personalized
                            </span>
                         ) : (
                            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                               <Layers className="w-3 h-3" /> Standard
                            </span>
                         )}
                      </div>

                      {/* Lower Content */}
                      <div className="relative z-10 mt-auto">
                        <h3 className="text-xl font-bold text-white leading-tight mb-2 line-clamp-2">
                          {subject.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">
                          {activeTab === "ai_subjects" ? "Open AI Tutors" : "View Resources"} 
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-white">Attendance Calculator</h2>
                <p className="text-zinc-400 mt-2">Only applicable for 2nd and 3rd Year Students.</p>
              </div>
              <div className="bg-[#09090b] rounded-[32px] p-6 border border-white/5">
                <AttendanceCalculator />
              </div>
            </div>
          )}

          {activeTab === "sgpa" && (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-white">SGPA Calculator</h2>
                <p className="text-zinc-400 mt-2">Estimate your semester performance.</p>
              </div>
              <div className="bg-[#09090b] rounded-[32px] p-6 border border-white/5">
                <SGPACalculator />
              </div>
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-white">Announcements</h2>
                <p className="text-zinc-400 mt-2">Latest updates and feedback.</p>
              </div>
              <div className="bg-[#09090b] rounded-[32px] p-6 border border-white/5">
                <AnnouncementsSection isAdmin={role === "admin"} />
              </div>
            </div>
          )}

          {activeTab === "support" && (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">Support the Project</h2>
                <p className="text-zinc-400 mt-2">Help keep the servers running.</p>
              </div>
              <div className="bg-[#09090b] rounded-[32px] p-6 border border-white/5">
                <SupportSection />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modals & Drawers */}
      {selectedSubject && activeTab === "subjects" && (
        <SubjectDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          subjectId={selectedSubject.id}
          subjectName={selectedSubject.name}
          userRole={role}
          userId={userId}
        />
      )}

      {selectedSubject && activeTab === "ai_subjects" && (
        <SubjectDrawerAi
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          subjectId={selectedSubject.id}
          subjectName={selectedSubject.name}
          userRole={role}
          userId={userId}
        />
      )}

      {isContributor && subjects.length > 0 && (
        <UploadResourceDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          subjects={subjects}
          onResourceUploaded={() => {
            setIsUploadDialogOpen(false);
          }}
        />
      )}

      {isContributor && profile && (
        <AddSubjectDialog
          open={isAddSubjectDialogOpen}
          onOpenChange={setIsAddSubjectDialogOpen}
          currentDepartment={profile.department}
          currentSemester={profile.semester}
          onSubjectAdded={loadSubjects}
        />
      )}
    </div>
  );
}