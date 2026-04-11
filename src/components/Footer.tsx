import { Heart, Zap, Shield, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

// Import your custom logos
import dinoLogo from "@/assets/dinosaurBlack.png";
import genai from "@/assets/aiWhite.png";

export default function Footer() {
  const navigate = useNavigate();
  
  return (
    <footer className="mt-20 border-t border-white/5 bg-[#09090b]/80 backdrop-blur-xl pt-16 pb-8 relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 text-center md:text-left">
          
          <div className="md:col-span-1 flex flex-col items-center md:items-start">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              {/* Wrapped the black logo in a soft white container so it's visible on the dark background */}
              <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center p-1 shadow-sm">
                <img src={dinoLogo} alt="Team Dino" className="w-full h-full object-contain" />
              </div>
              Team Dino
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Empowering students with centralized resources, intelligent AI tutoring, and seamless performance tracking. Stop searching for notes, start mastering your subjects.
            </p>
            
            {/* Link to About Page */}
            <Link 
              to="/about" 
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-sm font-medium transition-all"
            >
              Meet the Team 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold tracking-wide">Our Mission</h4>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Fast, unified access to study materials.
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                {/* Custom AI Logo used here */}
                <img src={genai} alt="AI" className="w-4 h-4 opacity-80" /> AI-driven personalized learning paths.
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Shield className="w-4 h-4 text-emerald-500" /> Exclusive, safe tools for your semester.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Support Us
            </h3>

            <Button
              onClick={() => navigate("/?tab=support")}
              className="rounded-full px-5 py-2 bg-white/5 border border-white/10 text-zinc-300 hover:bg-white hover:text-black transition-all"
            >
              ☕ Support the project
            </Button>

            <p className="text-xs text-zinc-500 mt-3 max-w-[220px] leading-relaxed mx-auto md:mx-0">
              If we helped you, consider supporting us to keep building better tools for students.
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-zinc-500 text-xs font-medium">
            <p>© {new Date().getFullYear()} Team Dino. All rights reserved.</p>
            <span className="hidden md:inline">•</span>
            <Link to="/about" className="hover:text-zinc-300 transition-colors">About Us</Link>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse fill-rose-500" />
            <span>for the student community.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}