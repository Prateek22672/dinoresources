import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Plus, Rocket } from "lucide-react";
import { type ShowcasePost, sb, trendScore } from "@/lib/showcase";
import { ShowcaseCover } from "./ShowcaseCard";

/**
 * Dashboard highlight for Campus Showcase: the three trending projects and a
 * way to post your own. Renders nothing until there's something live (or if
 * the tables don't exist yet), so it never shows an empty box.
 */
export default function ShowcaseStrip() {
  const navigate = useNavigate();
  const [top, setTop] = useState<ShowcasePost[]>([]);

  useEffect(() => {
    sb.from("showcase_posts").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(60)
      .then(({ data, error }: { data: ShowcasePost[] | null; error: unknown }) => {
        if (error || !data) return;
        setTop([...data].sort((a, b) => trendScore(b) - trendScore(a)).slice(0, 3));
      });
  }, []);

  return (
    <section className="mt-10" style={{ order: 3 }}>
      <div className="flex items-baseline justify-between mb-3 px-0.5">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-500 flex items-center gap-2">
          <Rocket className="w-3.5 h-3.5" /> Fresh from campus
        </p>
        <button onClick={() => navigate("/showcase")} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
          See all <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {top.map((p) => (
          <button key={p.id} onClick={() => navigate(`/showcase?p=${p.id}`)}
            className="td-surface td-bento td-card-click overflow-hidden text-left flex flex-col group">
            <ShowcaseCover post={p} className="w-full aspect-[16/10] transition-transform duration-500 group-hover:scale-[1.04]" />
            <span className="p-3.5 flex items-start gap-2">
              <span className="min-w-0 flex-1">
                <span className="block text-white text-[14px] font-bold truncate">{p.title}</span>
                <span className="block text-zinc-500 text-[11px] truncate">{p.author_name}</span>
              </span>
              <span className="text-zinc-400 text-[12px] font-semibold flex items-center gap-1 shrink-0"><Heart className="w-3.5 h-3.5" /> {p.like_count}</span>
            </span>
          </button>
        ))}
        {/* the invitation — always there, so the row reads as "join in" */}
        <button onClick={() => navigate("/showcase")}
          className={`td-bento td-bento-accent td-card-click p-5 flex flex-col justify-between text-left min-h-[170px] ${top.length === 0 ? "col-span-2 lg:col-span-4" : ""}`}>
          <span className="w-10 h-10 rounded-full td-ink-disc flex items-center justify-center"><Plus className="w-4 h-4" /></span>
          <span>
            <span className="block text-[18px] font-extrabold leading-tight">{top.length ? "Built something?" : "Campus Showcase is open"}</span>
            <span className="block text-[12px] opacity-70 mt-1">{top.length ? "Show the campus — post it in a minute." : "Be the first to post what you've built."}</span>
          </span>
        </button>
      </div>
    </section>
  );
}
