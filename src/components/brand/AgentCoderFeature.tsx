import { ArrowUpRight } from "lucide-react";
import AgentCoderMock, { AgentCoderMark } from "./AgentCoderMock";
import { AGENTCODER_PAGE, openAgentCoder } from "@/lib/links";

/**
 * FreeAgentCoder promo — copy and actions on the left, the extension panel
 * running a task on the right.
 *
 * "landing": a white card on the dark landing page.
 * "app": a quiet surface card for the dashboard that follows the theme — it
 * sits in the page's flow as a sibling of the other sections, never as a
 * popup or banner, and drops the animated panel on phones so it stays short.
 */
export default function AgentCoderFeature({ variant = "landing" }: { variant?: "landing" | "app" }) {
  const app = variant === "app";
  const shell = app
    ? "td-surface td-bento p-5 sm:p-7"
    : "rounded-[28px] p-6 sm:p-8 bg-white text-black shadow-[0_30px_70px_-28px_rgba(255,255,255,0.35)]";
  const chip = app ? "td-surface-2 text-zinc-300" : "bg-black/[0.06] border border-black/10";
  const title = app ? "text-white" : "";
  const soft = app ? "text-zinc-400" : "text-black/70";
  const softer = app ? "text-zinc-500" : "text-black/50";
  const strong = app ? "text-white" : "text-black";

  return (
    <div className={`${shell} grid ${app ? "md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_300px]" : "lg:grid-cols-[1fr_250px]"} gap-6 items-center`}>
      <div className="min-w-0 flex flex-col">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {["100% free", "No credit card", "VS Code"].map((t) => (
            <span key={t} className={`text-[10px] font-black tracking-[0.12em] uppercase px-2.5 py-1 rounded-full ${chip}`}>{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-[#141414] flex items-center justify-center shrink-0"><AgentCoderMark className="w-6 h-6" /></span>
          <div className="min-w-0">
            <p className={`text-[10px] font-black tracking-[0.18em] uppercase ${softer}`}>FreeAgentCoder · by Codeloft</p>
            <h3 className={`font-extrabold text-2xl sm:text-3xl tracking-tight leading-none mt-0.5 ${title}`}>Agent Coder</h3>
          </div>
        </div>
        <p className={`${soft} text-[15px] leading-relaxed mt-4`}>
          The free <b className={strong}>Claude Code alternative</b>. Tell it what to build — it plans, writes, runs and tests the code right in your project.
        </p>
        <p className={`${softer} text-[13px] leading-relaxed mt-2`}>
          Runs on free Gemini, Groq and OpenRouter keys. No subscription, ever.
        </p>
        <div className="flex flex-wrap gap-2 mt-6">
          <button onClick={openAgentCoder}
            className={`${app ? "td-btn-primary" : "bg-black text-white"} flex-1 min-w-[150px] rounded-full h-11 px-4 text-[13px] font-bold flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-transform`}>
            Open in VS Code <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <a href={AGENTCODER_PAGE} target="_blank" rel="noopener noreferrer"
            className={`${app ? "td-btn-ghost" : "bg-black/[0.06] border border-black/10 text-black hover:bg-black/[0.1]"} flex-1 min-w-[130px] rounded-full h-11 px-4 text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors`}>
            See what it does
          </a>
        </div>
      </div>
      {/* the extension doing a real task, on loop */}
      <AgentCoderMock className={`w-full max-w-[300px] mx-auto ${app ? "hidden md:block md:max-w-none" : "lg:max-w-none"}`} />
    </div>
  );
}
