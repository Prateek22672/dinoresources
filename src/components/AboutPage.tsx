import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Code, Database, Lightbulb, Zap, Rocket } from "lucide-react";

// Import your custom logos
import dinoWhite from "@/assets/dinosaurWhite.png";
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
      bgSoft: "bg-blue-400/10", // Added this back
      bgHover: "group-hover:bg-blue-400/5",
      borderHover: "group-hover:border-blue-400/30",
      glow: "from-blue-400/20 via-transparent to-transparent",
    },
    {
      name: "Naren",
      roles: ["Backend Developer", "Product Engineer"],
      icon: Database,
      color: "text-emerald-400",
      bgSoft: "bg-emerald-400/10", // Added this back
      bgHover: "group-hover:bg-emerald-400/5",
      borderHover: "group-hover:border-emerald-400/30",
      glow: "from-emerald-400/20 via-transparent to-transparent",
    },
    {
      name: "Vishnu",
      roles: ["CMO", "R&D Guide", "Web 3 Specialist"],
      icon: Lightbulb,
      color: "text-amber-400",
      bgSoft: "bg-amber-400/10", // Added this back
      bgHover: "group-hover:bg-amber-400/5",
      borderHover: "group-hover:border-amber-400/30",
      glow: "from-amber-400/20 via-transparent to-transparent",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30 flex flex-col relative overflow-hidden">

      {/* Ultra-Minimal Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Deep Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />

      {/* Sleek Minimal Header */}
      <header className="border-b border-white/5 bg-[#09090b]/60 backdrop-blur-2xl sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full h-10 w-10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-xs font-medium tracking-[0.15em] text-zinc-300 hidden sm:block uppercase">
                Team Dino
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 sm:py-24 max-w-5xl flex-1 relative z-10 -mt-16">

        {/* Hero Section */}
        <div className="text-center space-y-6 mb-32 animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both">

          {/* Floating White Dino Logo */}
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 opacity-80 animate-[float_6s_ease-in-out_infinite]">
              <img src={dinoWhite} alt="Team Dino" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
            </div>
          </div>

          {/* Shimmering Badge */}
          <div className="group relative inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-zinc-900/40 border border-white/5 text-zinc-400 text-[10px] font-medium tracking-[0.2em] uppercase mb-2 backdrop-blur-md overflow-hidden cursor-default shadow-xl">
            <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_3s_infinite]" />
            <img src={genai} alt="AI" className="w-3.5 h-3.5 opacity-70" />
            About the Workspace
          </div>

          <h2 className="pb-2 text-4xl font-light leading-[1.15] tracking-tight text-white sm:text-6xl">
            Engineered by students, <br className="hidden sm:block" />
            <span
              className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 via-white to-zinc-400"
              style={{ backgroundSize: "200% auto", animation: "gradient 6s linear infinite" }}
            >
              for the students.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400/80 max-w-2xl mx-auto leading-relaxed font-light mt-6">
            We realized that finding reliable study materials, tracking attendance, and adapting to syllabus changes was broken. We built the definitive platform to fix it.
          </p>
        </div>

        {/* Minimal Bento Box Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-200 fill-mode-both">

          <div className="md:col-span-2 group bg-[#121214]/60 backdrop-blur-sm border border-white/5 rounded-[32px] p-10 hover:bg-[#151518]/80 transition-all duration-500 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 flex items-center justify-center mb-6 border border-indigo-500/10 group-hover:scale-105 transition-transform duration-500">
              <Zap className="w-5 h-5 text-indigo-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium text-zinc-100 mb-3 tracking-wide">Centralized Architecture</h3>
            <p className="text-zinc-400/80 text-sm sm:text-base leading-relaxed max-w-md font-light">
              No more digging through fragmented WhatsApp groups or expired Google Drives. Experience instant, unified access to structured notes and historical PYQs.
            </p>
          </div>

          <div className="md:col-span-1 group bg-[#121214]/60 backdrop-blur-sm border border-white/5 rounded-[32px] p-10 hover:bg-[#151518]/80 transition-all duration-500 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-purple-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 rounded-2xl bg-purple-500/5 flex items-center justify-center mb-6 border border-purple-500/10 group-hover:scale-105 transition-transform duration-500">
              <img src={genai} alt="AI" className="w-5 h-5 opacity-70" />
            </div>
            <h3 className="text-xl font-medium text-zinc-100 mb-3 tracking-wide">Native AI</h3>
            <p className="text-zinc-400/80 text-sm sm:text-base leading-relaxed font-light">
              Built-in intelligent tutors that analyze your exact syllabus to generate on-demand explanations.
            </p>
          </div>

          <div className="md:col-span-3 group bg-[#121214]/60 backdrop-blur-sm border border-white/5 rounded-[32px] p-10 hover:bg-[#151518]/80 transition-all duration-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-500/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 flex items-center justify-center mb-6 border border-emerald-500/10 group-hover:scale-105 transition-transform duration-500">
                <Rocket className="w-5 h-5 text-emerald-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium text-zinc-100 mb-3 tracking-wide">Precision Utilities</h3>
              <p className="text-zinc-400/80 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
                Stop guessing your grades. From automated attendance algorithms to accurate SGPA estimations, our tools keep your academic performance entirely transparent.
              </p>
            </div>
          </div>
        </div>

        {/* The Core Team Section */}
        <div className="space-y-16 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300 fill-mode-both">
          <div className="text-center space-y-3">
            <h2 className="text-[10px] font-medium tracking-[0.25em] text-zinc-500 uppercase">The Core Team</h2>
            <p className="text-2xl font-light text-zinc-100 tracking-wide">Architects of Team Dino</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className={`group bg-[#121214]/40 backdrop-blur-md border border-white/5 rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 relative overflow-hidden ${member.bgHover} ${member.borderHover}`}
              >
                {/* Ambient glow behind icon */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b ${member.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

                {/* Floating Avatar Icon */}
                <div className={`relative z-10 w-16 h-16 rounded-[20px] ${member.bgSoft} border border-white/5 flex items-center justify-center mb-6 shadow-sm transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-lg`}>
                  <member.icon className={`w-6 h-6 ${member.color} opacity-80`} strokeWidth={1.5} />
                </div>

                <h3 className="text-lg font-medium text-zinc-100 mb-5 relative z-10 tracking-wide">{member.name}</h3>

                {/* Role Tags */}
                <div className="flex flex-wrap justify-center gap-2 mt-auto relative z-10">
                  {member.roles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1.5 rounded-md bg-white/5 border border-white/5 text-zinc-400/90 group-hover:text-zinc-200 group-hover:border-white/10 text-[10px] font-medium uppercase tracking-widest transition-colors duration-300"
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

      {/* Global Style for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}} />
    </div>
  );
}