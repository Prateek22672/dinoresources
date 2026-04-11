import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Code, Database, Lightbulb, Sparkles, Zap, Rocket } from "lucide-react";
import dinoLogo from "@/assets/dino-logo.png";
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
    },
    {
      name: "Naren",
      roles: ["Backend Developer", "Product Engineer"],
      icon: Database,
      color: "text-emerald-400",
      bgSoft: "bg-emerald-400/10",
      border: "border-emerald-400/20",
    },
    {
      name: "Vishnu",
      roles: ["Review", "R&D Guide"],
      icon: Lightbulb,
      color: "text-amber-400",
      bgSoft: "bg-amber-400/10",
      border: "border-amber-400/20",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-white/20 flex flex-col relative overflow-hidden">
      
      {/* Softer Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/10 shadow-sm">
                <img src={dinoLogo} alt="Team Dino" className="w-6 h-6 opacity-90" />
              </div>
              <h1 className="text-base font-semibold text-zinc-100 hidden sm:block">Team Dino</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 sm:py-24 max-w-5xl flex-1 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-24 animate-in slide-in-from-bottom-4 fade-in duration-1000 fill-mode-both">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium mb-2 backdrop-blur-md">
            About the Website
          </div>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
            Built by students, <br className="hidden sm:block" />
            <span className="text-indigo-400">
              for the students
            </span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            We realized that finding reliable study materials, tracking attendance, and keeping up with syllabus changes was way harder than it needed to be. So, we built the ultimate unified workspace to fix it.
          </p>
        </div>

        {/* What We Do Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-150 fill-mode-both">
          <div className="bg-[#121214]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-[#18181b] hover:border-white/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">Centralized Learning</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-normal">
              No more digging through WhatsApp groups or messy Google Drives. Get instant access to structured, high-quality notes and PYQs.
            </p>
          </div>

          <div className="bg-[#121214]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-[#18181b] hover:border-white/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">AI-Powered Tutors</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-normal">
              Stuck on a complex topic? Our built-in AI tools analyze your exact syllabus to generate explanations and dynamic practice questions.
            </p>
          </div>

          <div className="bg-[#121214]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-[#18181b] hover:border-white/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
              <Rocket className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">Smart Tools</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-normal">
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
                className="group bg-[#121214]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center hover:bg-[#18181b] hover:border-white/10 transition-all duration-300"
              >
                {/* Clean Avatar Icon */}
                <div className={`w-16 h-16 rounded-2xl ${member.bgSoft} ${member.border} border flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}>
                  <member.icon className={`w-7 h-7 ${member.color}`} />
                </div>

                <h3 className="text-xl font-semibold text-zinc-100 mb-4">{member.name}</h3>
                
                {/* Role Tags */}
                <div className="flex flex-wrap justify-center gap-2 mt-auto">
                  {member.roles.map((role) => (
                    <span 
                      key={role} 
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-zinc-300 text-xs font-medium"
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
    </div>
  );
}