import { Heart, Users, ArrowUp, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

import FallingText from "@/components/reactbits/FallingText";
import dinoLogo from "@/assets/dinosaurWhite.png";
import fyxLogo from "@/assets/fyx.png";

/* A small hardcover book that tumbles alongside the falling words. */
const FALLING_BOOK = `<svg width="52" height="68" viewBox="0 0 300 400" style="filter:drop-shadow(0 12px 16px rgba(0,0,0,0.45))">
  <rect x="24" y="10" width="270" height="384" rx="14" fill="#F4EFE3"/>
  <rect x="6" y="0" width="274" height="382" rx="16" fill="#1E2B7A"/>
  <path d="M6 16 A16 16 0 0 1 22 0 H52 V382 H22 A16 16 0 0 1 6 366 Z" fill="#E0559B"/>
  <rect x="66" y="12" width="5" height="360" rx="2.5" fill="rgba(255,255,255,0.55)"/>
  <text x="170" y="230" text-anchor="middle" fill="#ffffff" font-weight="800" font-size="86" font-family="'Baloo 2',sans-serif">AI</text>
</svg>`;

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="mt-12 td-surface rounded-[32px] p-7 sm:p-10 relative overflow-hidden">
      {/* top sheen */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-white/10" />

      {/* soft accent blob glow, top-right */}
      <div aria-hidden className="absolute -top-24 -right-16 w-80 h-72 opacity-[0.3] pointer-events-none"
        style={{ background: "rgb(var(--td-accent-rgb) / 0.2)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(10px)" }} />

      {/* Top: brand + actions */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 mb-8">
        <div className="max-w-sm">
          <Link to="/" onClick={scrollToTop} className="flex items-center gap-3 mb-3 w-fit group">
            <div className="td-nav-chip w-11 h-11 flex items-center justify-center rounded-2xl shadow-sm group-hover:scale-105 transition-transform">
              <img src={dinoLogo} alt="Team Dino" className="td-nav-logo w-6 h-6 opacity-90" />
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

          <Link
            to="/store"
            onClick={scrollToTop}
            className="td-btn-primary rounded-full px-6 py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> Browse Subjects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Falling-text play band (desktop) — below the content so upward swipes
          never cross it; drag the words around for fun */}
      <div className="hidden md:block h-36 mt-2 mb-6 text-zinc-300 font-semibold">
        <FallingText
          text="Notes PYQs SGPA Attendance Study with AI Subjects Full-Year Library — TeamDino"
          highlightWords={["AI", "TeamDino", "SGPA", "Full-Year"]}
          objects={[FALLING_BOOK]}
          trigger="scroll"
          gravity={0.55}
          fontSize="1.6rem"
          mouseConstraintStiffness={0.9}
        />
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
