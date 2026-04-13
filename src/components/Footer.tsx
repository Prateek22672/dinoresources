import { useState } from "react";
import { Heart, Coffee, Users, Check, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "./ui/dialog";

// Logos and Images
import dinoLogo from "@/assets/dinosaurBlack.png";
import gpayQr from "@/assets/gpay-qr.jpeg";

const UPI_ID = "narenbachina22@okhdfcbank";

export default function Footer() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-16 border-t border-white/10 bg-black pt-12 pb-6 relative overflow-hidden">
      {/* Sleek, minimal top border glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Top Section: Brand & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
          
          {/* Left: Brand & Tagline */}
          <div className="max-w-sm text-left">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-3 mb-3 hover:opacity-90 transition-opacity w-fit">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center p-1 shadow-sm shrink-0">
                <img src={dinoLogo} alt="Team Dino" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Team Dino</span>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The ultimate student workspace. Master your subjects with AI, centralized resources, and smart tracking.
            </p>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <Link 
              to="/about" 
              onClick={scrollToTop}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-sm font-medium transition-all"
            >
              <Users className="w-4 h-4" />
              Meet the Team 
            </Link>

            {/* Compact Support Modal */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="w-full sm:w-auto rounded-full px-6 py-2.5 bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all font-bold shadow-[0_0_20px_-5px_rgba(255,255,255,0.2)]"
                >
                  <Coffee className="w-4 h-4 mr-2" />
                  Support Us
                </Button>
              </DialogTrigger>
              
              {/* ULTRA-COMPACT HORIZONTAL MODAL */}
              <DialogContent className="bg-[#0a0a0c] border border-white/10 text-white rounded-[24px] w-[95vw] sm:max-w-[500px] p-6 shadow-2xl gap-0">
                <DialogTitle className="sr-only">Support the Project</DialogTitle>
                
                <div className="flex flex-col-reverse sm:flex-row items-center gap-6">
                  {/* Left Column: Text & Copy Button */}
                  <div className="flex-1 text-center sm:text-left w-full">
                    <h2 className="text-xl font-bold tracking-tight text-white mb-2">Buy us a coffee ☕</h2>
                    <p className="text-zinc-400 text-xs leading-relaxed mb-5">
                      Scan the QR or copy the UPI ID below. Your contribution helps keep our servers running and tools free for all students!
                    </p>
                    
                    {/* Compact Copy UPI Input */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-full justify-between group hover:bg-white/10 transition-colors">
                      <span className="font-mono text-xs text-zinc-300 truncate select-all">
                        {UPI_ID}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        className="shrink-0 h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-all"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Right Column: Clean QR Code Image */}
                  <div className="shrink-0 bg-white p-2 rounded-2xl shadow-inner">
                    <img 
                      src={gpayQr} 
                      alt="UPI QR Code" 
                      className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-xl" 
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bottom Section: Copyright & Signature */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-zinc-500 text-xs font-medium">
            <p>© {new Date().getFullYear()} Team Dino. All rights reserved.</p>
            <span className="hidden md:inline">•</span>
            <Link to="/about" onClick={scrollToTop} className="hover:text-zinc-400 transition-colors">About Us</Link>
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