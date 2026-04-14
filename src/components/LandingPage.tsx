import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calculator, Globe, Clock, Coins } from "lucide-react";
import Footer from "./Footer";

// Logos
import dinoLogo from "@/assets/dinosaurWhite.png";
import genai from "@/assets/aiWhite.png";

const PHRASES = [
  "We got you.",
  "Notes & PYQs.",
  "Instant AI help.",
  "Last-minute prep.",
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Cycles the text every 2.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      title: "Everything. One Place.",
      desc: "No more searching 10 groups. Notes, PYQs, everything right here when you need it most.",
      icon: BookOpen,
    },
    {
      title: "Stop Wrestling with GPT",
      desc: "Tired of wasting 10 minutes and 5+ prompts just to get an explanation that makes sense? Get exam-ready answers instantly.",
      icon: Clock,
    },
    {
      title: "Your AI Buddy",
      desc: "Stuck at 2AM? Ask anything. Get instant explanations and quick revision help tailored to your exact syllabus.",
      icon: ({ className }) => <img src={genai} alt="AI" className={`opacity-90 ${className}`} />,
    },
    {
      title: "No More Guesswork",
      desc: "Track attendance, calculate SGPA, and know exactly where you stand before it’s too late.",
      icon: Calculator,
    },
    {
      title: "Stand Out Easily",
      desc: "Build your professional portfolio in minutes. Because placements don't wait.",
      icon: Globe,
    },
    {
      title: "Cheaper Than Lay's",
      desc: "Core resources are 100% free. Want the premium AI-personalized content? It literally costs less than a packet of chips. Lol.",
      icon: Coins,
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30 flex flex-col relative overflow-hidden">
      
      {/* Custom Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}} />

      {/* Subtle Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="bg-[#09090b]/60 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            
            {/* Premium Logo Container */}
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:scale-[1.03] shrink-0 shadow-sm">
              <img src={dinoLogo} alt="Team Dino" className="w-6 h-6 opacity-90 transition duration-300 hover:opacity-100" />
            </div>

            <div className="hidden sm:flex flex-col justify-center leading-tight">
              <h1 className="text-base font-semibold text-zinc-100">
                Team Dino
              </h1>
              <div className="flex items-center gap-1.5 mt-[2px]">
                <img src={genai} alt="AI" className="w-3 h-3 opacity-70" />
                <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">
                  Personalized for you
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full text-sm px-3 sm:px-4 transition-colors"
              onClick={() => navigate("/auth")}
            >
              Log in
            </Button>
            <Button
              className="bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm px-4 sm:px-6 transition-colors shadow-lg"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 flex-1 relative z-10 flex flex-col">

        {/* 1. HERO SECTION */}
        <div className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center text-center mb-10 ">
          
          {/* Floating Dino (Bottom Right Absolute) */}
          <div className="absolute bottom-10 right-4 sm:right-10 hidden sm:block z-0 pointer-events-none">
            <img 
              src={dinoLogo} 
              alt="Dino" 
              className="w-20 h-20 sm:w-28 sm:h-28 opacity-40 animate-float drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            />
          </div>

          {/* Highlight Badge */}
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[10px] sm:text-xs font-semibold uppercase tracking-widest backdrop-blur-sm mb-6 sm:mb-8 shadow-sm animate-in slide-in-from-bottom-4 fade-in duration-1000">
            <img src={genai} alt="AI" className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-90" />
            <span>AI Personalized Learning</span>
          </div>

          {/* Headline with Text Rotator */}
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.1] mb-6 flex flex-col items-center justify-center animate-in slide-in-from-bottom-6 fade-in duration-1000">
            <span className="block mb-2 sm:mb-0">Exam tomorrow?</span>
            
            <div className="min-h-[1.3em] w-full flex justify-center items-center">
              <span 
                key={phraseIndex}
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-300 animate-in slide-in-from-bottom-2 fade-in duration-500 ease-out pb-4 drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]"
              >
                {PHRASES[phraseIndex]}
              </span>
            </div>
          </h2>

          {/* Description */}
          <p className="text-base sm:text-sm md:text-md text-zinc-400 max-w-2xl mx-auto leading-relaxed px-4 mb-10 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-150">
            When everything feels overwhelming, Team Dino becomes your last-minute backup. 
            No searching. No confusion. Just what you need to pass — or even top.
          </p>

          {/* Call to Action */}
          <div className="flex flex-col items-center justify-center relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300">
            <p className="text-xs text-zinc-500 mb-4 font-medium tracking-wide">
              Trusted by students who start studying... at the last moment 👀
            </p>
            <Button
              onClick={() => navigate("/auth")}
              className="h-14 px-8 text-sm sm:text-base bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all rounded-full font-bold shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Start Studying Now <ArrowRight className="w-4 h-4 ml-2" /> 
            </Button>
          </div>
        </div>

        {/* 2. FEATURES SECTION */}
        <div className="pb-20 pt-10">
          
          {/* NEW: Aggressive/Relatable Feature Heading */}
          <div className="text-center mb-12 sm:mb-16 px-4 animate-in slide-in-from-bottom-8 fade-in duration-1000">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Your unfair advantage.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              We stripped away the fluff and built the ultimate survival kit for the semester. 
              No BS. Just the exact tools you need to get it done.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-[#121214] border border-white/5 rounded-3xl p-6 sm:p-8 hover:bg-[#18181b] hover:border-white/10 transition-all duration-300 text-center sm:text-left group relative overflow-hidden"
              >
                {/* Subtle background glow on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-5 border border-white/10 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-5 h-5 text-zinc-300" />
                </div>
                <h3 className="relative z-10 text-lg sm:text-xl font-semibold text-zinc-100 mb-2">
                  {feature.title}
                </h3>
                <p className="relative z-10 text-zinc-400 text-sm sm:text-base leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}