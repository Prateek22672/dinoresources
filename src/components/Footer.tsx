import { Heart, ArrowUp, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import dinoLogo from "@/assets/dinosaurWhite.png";
import fyxLogo from "@/assets/fyx.png";
import { AGENTCODER_PAGE } from "@/lib/links";
import { AgentCoderMark } from "@/components/brand/AgentCoderMock";

type FooterLink = { label: string; to?: string; href?: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Study",
    links: [
      { label: "Store", to: "/store" },
      { label: "My Library", to: "/library" },
      { label: "Purchases", to: "/purchases" },
    ],
  },
  {
    title: "Free tools",
    links: [
      { label: "SGPA calculator", to: "/sgpa-calc" },
      { label: "Attendance planner", to: "/attendance-calc" },
      { label: "What's new", to: "/whats-new" },
    ],
  },
  {
    title: "Team Dino",
    links: [
      { label: "About us", to: "/about" },
      { label: "FolioFYX", href: "https://www.foliofyx.in" },
      { label: "Agent Coder", href: AGENTCODER_PAGE },
    ],
  },
];

/**
 * Footer as an editorial sign-off: tagline and link columns on top, then the
 * name set huge across the full width (sized in container units, so it fills
 * the card whether or not the sidebar is open), then the legal line.
 */
export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="mt-12 td-surface td-bento relative overflow-hidden [container-type:inline-size]">
      <div className="p-6 sm:p-10 pb-0 sm:pb-0">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
          {/* brand + pitch */}
          <div className="max-w-sm">
            <Link to="/" onClick={scrollToTop} className="td-nav-chip w-11 h-11 flex items-center justify-center rounded-full mb-5 hover:scale-105 transition-transform">
              <img src={dinoLogo} alt="Team Dino" className="td-nav-logo w-6 h-6 opacity-90" />
            </Link>
            <p className="text-white text-lg font-semibold leading-snug tracking-tight">
              Notes, PYQs and a tutor that has read your syllabus — all in one place.
            </p>
            <Link to="/store" onClick={scrollToTop}
              className="td-btn-primary rounded-full px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2 mt-5">
              Browse subjects <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* link columns */}
          <nav className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-8">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="text-[10px] font-semibold tracking-[0.24em] uppercase text-zinc-500 mb-4">{c.title}</p>
                <ul className="space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      {l.to ? (
                        <Link to={l.to} onClick={scrollToTop} className="text-white text-[14px] font-medium hover:opacity-60 transition-opacity">{l.label}</Link>
                      ) : (
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-white text-[14px] font-medium hover:opacity-60 transition-opacity inline-flex items-center gap-1">
                          {l.label} <ArrowUpRight className="w-3 h-3 opacity-50" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* the wordmark — 17cqw keeps "TeamDino" edge to edge at any width */}
        <p aria-hidden className="mt-10 font-extrabold text-white tracking-[-0.06em] leading-[0.8] whitespace-nowrap select-none -ml-[0.04em]"
          style={{ fontSize: "17cqw" }}>
          TeamDino<span className="td-accent-text">.</span>
        </p>
      </div>

      {/* legal line */}
      <div className="mx-6 sm:mx-10 mt-6 border-t border-white/8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-zinc-500 text-xs font-medium">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span>© {new Date().getFullYear()} Team Dino</span>
          <a href="https://www.foliofyx.in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
            Crafted with <img src={fyxLogo} alt="FolioFYX" className="h-3 w-auto brightness-0 dark:invert opacity-70" />
          </a>
          <span aria-hidden>&amp;</span>
          <a href={AGENTCODER_PAGE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-zinc-400 hover:text-zinc-200 transition-colors">
            <AgentCoderMark className="w-3.5 h-3.5" /> FreeAgentCoder
          </a>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">Made with <Heart className="w-3 h-3 fill-current" /> for students</span>
          <button onClick={scrollToTop} aria-label="Back to top"
            className="td-surface-2 group inline-flex items-center gap-1.5 rounded-full pl-1.5 pr-3 py-1 text-xs font-semibold text-zinc-300 hover:text-white transition-colors">
            <span className="w-5 h-5 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center group-hover:-translate-y-0.5 transition-transform dark:bg-white dark:text-black">
              <ArrowUp className="w-3 h-3" />
            </span>
            Top
          </button>
        </div>
      </div>
    </footer>
  );
}
