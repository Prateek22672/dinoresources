import { useState } from "react";
import { Heart, Coffee, Users, Check, Copy, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "./ui/dialog";

import FallingText from "@/components/reactbits/FallingText";
import dinoLogo from "@/assets/dinosaurWhite.png";
import gpayQr from "@/assets/gpay-qr.jpeg";
import fyxLogo from "@/assets/fyx.png";

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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="mt-12 td-surface rounded-[32px] p-7 sm:p-10 relative overflow-hidden">
      {/* top sheen */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* Falling-text play band (desktop) — drag the words around */}
      <div className="hidden md:block h-36 mb-8 text-zinc-300 font-semibold">
        <FallingText
          text="Notes PYQs SGPA Attendance Study with AI Subjects Combos Library — TeamDino"
          highlightWords={["AI", "TeamDino", "SGPA", "Combos"]}
          trigger="scroll"
          gravity={0.55}
          fontSize="1.6rem"
          mouseConstraintStiffness={0.9}
        />
      </div>

      {/* Top: brand + actions */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 mb-8">
        <div className="max-w-sm">
          <Link to="/" onClick={scrollToTop} className="flex items-center gap-3 mb-3 w-fit group">
            <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-zinc-900 border border-white/10 shadow-sm group-hover:scale-105 transition-transform">
              <img src={dinoLogo} alt="Team Dino" className="w-6 h-6 opacity-90" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Team Dino</span>
          </Link>

          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            The ultimate student workspace. Master your subjects with AI, centralized resources, and smart tracking.
          </p>

          <a
            href="https://www.foliofyx.in"
            target="_blank"
            rel="noopener noreferrer"
            className="td-surface-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:border-white/20 transition-colors group"
          >
            <span className="text-xs text-zinc-500 font-medium tracking-wide group-hover:text-zinc-400 transition-colors">
              Crafted in collaboration with
            </span>
            <img src={fyxLogo} alt="FolioFYX" className="h-3.5 w-auto brightness-0 dark:invert opacity-80 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Link
            to="/about"
            onClick={scrollToTop}
            className="td-btn-ghost flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
          >
            <Users className="w-4 h-4" /> Meet the Team
          </Link>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="td-btn-primary rounded-full px-6 py-2.5 text-sm shadow-none">
                <Coffee className="w-4 h-4 mr-2" /> Support Us
              </Button>
            </DialogTrigger>

            <DialogContent className="bg-[#0a0a0c] border border-white/10 text-white rounded-[24px] w-[95vw] sm:max-w-[500px] p-6 shadow-2xl gap-0">
              <DialogTitle className="sr-only">Support the Project</DialogTitle>
              <div className="flex flex-col-reverse sm:flex-row items-center gap-6">
                <div className="flex-1 text-center sm:text-left w-full">
                  <h2 className="text-xl font-bold tracking-tight text-white mb-2">Support TeamDino</h2>
                  <p className="text-zinc-400 text-xs leading-relaxed mb-5">
                    Scan the QR or copy the UPI ID below. Your contribution helps keep our servers running and tools free for all students!
                  </p>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-full justify-between group hover:bg-white/10 transition-colors">
                    <span className="font-mono text-xs text-zinc-300 truncate select-all">{UPI_ID}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      className="shrink-0 h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
                <div className="shrink-0 bg-white p-2 rounded-2xl">
                  <img src={gpayQr} alt="UPI QR Code" className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-xl" />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bottom: copyright + signature */}
      <div className="border-t border-white/8 pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-zinc-500 text-xs font-medium">
          <p>© {new Date().getFullYear()} Team Dino. All rights reserved.</p>
          <span className="hidden md:inline">•</span>
          <Link to="/about" onClick={scrollToTop} className="hover:text-zinc-300 transition-colors">About Us</Link>
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="td-surface-2 group inline-flex items-center gap-1.5 rounded-full pl-3 pr-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/25 transition-colors"
          >
            <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center group-hover:-translate-y-0.5 transition-transform">
              <ArrowUp className="w-3 h-3" />
            </span>
            Top
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
          <span>Crafted with care</span>
          <Heart className="w-3 h-3 text-zinc-500 fill-zinc-500" />
          <span>for the student community.</span>
        </div>
      </div>
    </footer>
  );
}
