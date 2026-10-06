import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Check, ChevronRight, Eye, Plus } from "lucide-react";
import type { SubjectRow } from "@/integrations/supabase/revamp";
import { formatPaise } from "@/lib/money";

// Cover tones — muted dusk gradients, picked by subject name so a subject
// keeps the same colour everywhere it appears.
const TONES = [
  ["#8b7fd8", "#2c2363"], ["#a6d8c6", "#22463f"], ["#e0896a", "#5a1f17"], ["#c9ccd6", "#2f3138"],
  ["#efcf6e", "#6b4a12"], ["#b8cbe8", "#30477a"], ["#e0a874", "#4e2a22"], ["#6f8fe0", "#1b2350"],
];
export const tone = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
};

/**
 * A subject as a file folder: tinted cover, the body tucked over it, and the
 * index number riding the folder tab. The whole card opens the subject; the
 * buttons stop propagation so Add never also navigates.
 */
export default function SubjectFolderCard({
  subject: s, index, owned, inCart, onAdd,
}: {
  subject: SubjectRow; index: number; owned: boolean; inCart: boolean; onAdd: () => void;
}) {
  const navigate = useNavigate();
  const href = `/subject/${s.slug ?? s.id}`;
  const [from, to] = tone(s.name);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(href)}
      onKeyDown={(e) => { if (e.key === "Enter") navigate(href); }}
      className="td-folder td-card-click group relative rounded-3xl overflow-hidden flex flex-col cursor-pointer"
    >
      <div className="relative h-[104px] overflow-hidden">
        <div aria-hidden className="td-folder-cover absolute inset-0" style={{ background: `linear-gradient(160deg, ${from}, ${to})` }} />
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.28) 0%, transparent 38%)" }} />
        <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur text-white text-[12px] font-bold">
          {owned ? <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Owned</span> : formatPaise(s.price_paise)}
        </span>
      </div>

      <div className="td-folder-body relative flex-1 flex flex-col justify-between px-5 pb-5 pt-1">
        <div className="relative">
          <div className="flex items-start justify-between -mt-[22px]">
            <span className="text-[34px] font-extrabold tracking-tight leading-none text-white tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors mt-1" />
          </div>
          <Link to={href} onClick={(e) => e.stopPropagation()} className="block mt-3">
            <h3 className="text-white font-semibold leading-snug line-clamp-2 hover:underline">{s.name}</h3>
          </Link>
          {s.description
            ? <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2">{s.description}</p>
            : !owned && <p className="text-zinc-500 text-xs mt-1.5">Syllabus, 5 units, PYQs &amp; Study-With-AI.</p>}
          {!owned && (
            <span className="inline-flex items-center gap-1.5 mt-2.5 td-accent-bg text-[10px] font-bold px-2 py-1 rounded-full">
              <Eye className="w-3 h-3" /> Free preview inside
            </span>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {owned ? (
            <Link to={href} onClick={(e) => e.stopPropagation()} className="w-full td-btn-primary py-2.5 rounded-full text-[13px] flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Open <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link to={href} onClick={(e) => e.stopPropagation()} className="w-full td-btn-ghost py-2.5 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Preview free
              </Link>
              <button
                disabled={inCart}
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                className="w-full td-btn-primary py-2.5 rounded-full text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {inCart ? <><Check className="w-3.5 h-3.5" /> In cart</> : <><Plus className="w-3.5 h-3.5" /> Add · {formatPaise(s.price_paise)}</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
