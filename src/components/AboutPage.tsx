import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Code, Database, Lightbulb, Zap, Rocket } from "lucide-react";

// Import your custom logos
import dinoLogo from "@/assets/image.png";
import genai from "@/assets/aiWhite.png";
import Footer from "./Footer";

export default function AboutPage() {
  const navigate = useNavigate();

  const team = [
    {
      name: "Prateek",
      roles: ["Frontend Engineer", "System Architect", "UI/UX"],
      icon: Code,
      color: "text-blue-400",
      bgSoft: "bg-blue-400/10",
      border: "border-blue-400/20",
      hoverBorder: "group-hover:border-blue-400/50",
      hoverShadow: "group-hover:shadow-[0_0_40px_-10px_rgba(96,165,250,0.25)]",
    },
    {
      name: "Naren",
      roles: ["Backend Developer", "Product Engineer"],
      icon: Database,
      color: "text-emerald-400",
      bgSoft: "bg-emerald-400/10",
      border: "border-emerald-400/20",
      hoverBorder: "group-hover:border-emerald-400/50",
      hoverShadow: "group-hover:shadow-[0_0_40px_-10px_rgba(52,211,153,0.25)]",
    },
    {
      name: "Vishnu",
      roles: ["Review", "R&D Guide"],
      icon: Lightbulb,
      color: "text-amber-400",
      bgSoft: "bg-amber-400/10",
      border: "border-amber-400/20",
      hoverBorder: "group-hover:border-amber-400/50",
      hoverShadow: "group-hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.25)]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30 flex flex-col relative overflow-hidden">
      
      {/* Cool Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      {/* Softer Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Sleek Header */}
      <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-[#121214] shadow-sm overflow-hidden">
                <img src={dinoLogo} alt="Team Dino" className="w-7 h-7 opacity-90 rounded-md" />
              </div>
              <h1 className="text-base font-semibold text-zinc-100 hidden sm:block">Team Dino</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 sm:py-24 max-w-5xl flex-1 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-24 animate-in slide-in-from-bottom-4 fade-in duration-1000 fill-mode-both">
          {/* Shimmering Badge with AI Logo */}
          <div className="group relative inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold tracking-widest uppercase mb-4 shadow-lg backdrop-blur-md overflow-hidden cursor-default">
            <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            <img src={genai} alt="AI" className="w-3.5 h-3.5 opacity-80" />
            About the Workspace
          </div>
          
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white leading-[1.15]">
            Built by students, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400" style={{ backgroundSize: "200% auto", animation: "gradient 3s linear infinite" }}>
              for the students.
            </span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            We realized that finding reliable study materials, tracking attendance, and keeping up with syllabus changes was way harder than it needed to be. So, we built the ultimate unified workspace to fix it.
          </p>
        </div>

        {/* What We Do Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-150 fill-mode-both">
          <div className="group bg-[#121214]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-[#18181b] hover:border-indigo-500/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 relative z-10 group-hover:scale-110 transition-transform duration-500">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3 relative z-10">Centralized Learning</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-normal relative z-10">
              No more digging through WhatsApp groups or messy Google Drives. Get instant access to structured, high-quality notes and PYQs.
            </p>
          </div>

          <div className="group bg-[#121214]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-[#18181b] hover:border-purple-500/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(168,85,247,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 relative z-10 group-hover:scale-110 transition-transform duration-500">
              {/* Custom AI Logo used here */}
              <img src={genai} alt="AI" className="w-5 h-5 opacity-90" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3 relative z-10">AI-Powered Tutors</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-normal relative z-10">
              Stuck on a complex topic? Our built-in AI tools analyze your exact syllabus to generate explanations and dynamic practice questions.
            </p>
          </div>

          <div className="group bg-[#121214]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-[#18181b] hover:border-emerald-500/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(52,211,153,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 relative z-10 group-hover:scale-110 transition-transform duration-500">
              <Rocket className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3 relative z-10">Smart Tools</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-normal relative z-10">
              From tracking your attendance accurately to helping you build your own websites, we provide the utilities you need to stay ahead of the curve.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="space-y-12 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300 fill-mode-both">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-3">Meet Team Dino</h2>
            <p className="text-zinc-400 font-normal">The minds behind the code and design.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member) => (
              <div 
                key={member.name}
                className={`group bg-[#121214]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-1 ${member.hoverBorder} ${member.hoverShadow} relative overflow-hidden`}
              >
                {/* Very subtle background flair on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-b from-transparent to-${member.color.split('-')[1]}-500/5`} />

                {/* Clean Avatar Icon */}
                <div className={`relative z-10 w-16 h-16 rounded-2xl ${member.bgSoft} ${member.border} border flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
                  <member.icon className={`w-7 h-7 ${member.color}`} />
                </div>

                <h3 className="text-xl font-semibold text-zinc-100 mb-5 relative z-10">{member.name}</h3>
                
                {/* Role Tags */}
                <div className="flex flex-wrap justify-center gap-2 mt-auto relative z-10">
                  {member.roles.map((role) => (
                    <span 
                      key={role} 
                      className="px-3 py-1.5 rounded-full bg-[#18181b] border border-white/5 text-zinc-400 group-hover:text-zinc-300 group-hover:border-white/10 text-xs font-medium transition-colors duration-300"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />

      {/* Global Style for gradients/shimmer */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}} />
    </div>
  );
}