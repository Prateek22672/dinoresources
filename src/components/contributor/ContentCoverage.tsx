import { useCallback, useEffect, useMemo, useState } from "react";
import { callRpc } from "@/components/ai/tutor/shared";
import {
  ChevronDown, RefreshCw, ListChecks, AlertTriangle, Check, ArrowRight,
} from "lucide-react";

const UNITS = [1, 2, 3, 4, 5];

interface CoverageRow {
  subject_id: string;
  subject_name: string;
  year_id: string | null;
  year_name: string | null;
  qa_units: number[] | null;
  material_units: number[] | null;
  video_units: number[] | null;
  qa_total: number;
  pyq_count: number;
  syllabus_count: number;
}

type Kind = "qa" | "materials" | "videos";

const KINDS: { id: Kind; label: string; field: keyof CoverageRow }[] = [
  { id: "qa", label: "Study-With-AI", field: "qa_units" },
  { id: "materials", label: "Materials", field: "material_units" },
  { id: "videos", label: "Videos", field: "video_units" },
];

/** Units with nothing of this kind. */
const missing = (row: CoverageRow, field: keyof CoverageRow) => {
  const have = new Set((row[field] as number[] | null) ?? []);
  return UNITS.filter((u) => !have.has(u));
};

/** 0–100 across all three per-unit kinds plus syllabus and PYQs. */
function completeness(row: CoverageRow) {
  const perUnit = KINDS.reduce((n, k) => n + (((row[k.field] as number[] | null) ?? []).length), 0);
  const extras = (row.pyq_count > 0 ? 1 : 0) + (row.syllabus_count > 0 ? 1 : 0);
  return Math.round(((perUnit + extras) / (UNITS.length * KINDS.length + 2)) * 100);
}

function UnitDots({ row, field }: { row: CoverageRow; field: keyof CoverageRow }) {
  const have = new Set((row[field] as number[] | null) ?? []);
  return (
    <span className="inline-flex gap-1">
      {UNITS.map((u) => (
        <span
          key={u}
          title={`Unit ${u}: ${have.has(u) ? "has content" : "empty"}`}
          className="w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center"
          style={have.has(u)
            ? { background: "rgba(52,211,153,0.16)", color: "#6ee7b7" }
            : { background: "rgba(248,113,113,0.12)", color: "#fca5a5" }}
        >
          {u}
        </span>
      ))}
    </span>
  );
}

/**
 * What's still empty, by year.
 *
 * Subjects were created in bulk and filled in as people got to them, so the
 * honest answer to "what's left?" was previously to open every subject and
 * look. Grouping by year matters because that is how the work is actually
 * divided up — one long list across all years is the thing that made this
 * confusing in the first place.
 */
export default function ContentCoverage({ onPick }: { onPick?: (subjectId: string, unit: number) => void }) {
  const [rows, setRows] = useState<CoverageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("qa");
  const [onlyGaps, setOnlyGaps] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await callRpc("content_coverage", {});
      if (error) throw new Error(error.message);
      setRows((Array.isArray(data) ? data : []) as CoverageRow[]);
    } catch (e) {
      console.error("[ContentCoverage] failed:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open && rows.length === 0) load(); }, [open, rows.length, load]);

  const field = KINDS.find((k) => k.id === kind)!.field;

  // Group by year, keeping the RPC's ordering (year → subject order_index).
  const years = useMemo(() => {
    const out: { id: string; name: string; rows: CoverageRow[] }[] = [];
    for (const r of rows) {
      if (onlyGaps && missing(r, field).length === 0) continue;
      const id = r.year_id ?? "none";
      const name = r.year_name ?? "No year set";
      const last = out[out.length - 1];
      if (last && last.id === id) last.rows.push(r);
      else out.push({ id, name, rows: [r] });
    }
    return out;
  }, [rows, field, onlyGaps]);

  const totalGaps = rows.reduce((n, r) => n + missing(r, field).length, 0);

  return (
    <div className="td-surface rounded-3xl overflow-hidden mb-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left">
        <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center shrink-0">
          <ListChecks className="w-4 h-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-white text-sm font-bold">What's still empty</span>
          <span className="block text-zinc-500 text-[11.5px]">
            {open
              ? loading ? "Checking every subject…" : `${totalGaps} empty unit${totalGaps === 1 ? "" : "s"} for ${KINDS.find((k) => k.id === kind)!.label}`
              : "Every subject, by year — see what's left to fill in"}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-white/5 space-y-4">

            <div className="flex flex-wrap items-center gap-2">
              <div className="td-surface-2 rounded-full p-1 flex gap-1">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => setKind(k.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                      kind === k.id ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setOnlyGaps((v) => !v)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${onlyGaps ? "td-card-accent text-white" : "td-btn-ghost"}`}
              >
                {onlyGaps ? "Showing gaps only" : "Showing all subjects"}
              </button>
              <button onClick={load} className="ml-auto td-btn-ghost px-3 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5">
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {loading && rows.length === 0 ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-2xl td-surface-2 animate-pulse" />)}</div>
            ) : years.length === 0 ? (
              <div className="td-surface-2 rounded-2xl p-6 text-center">
                <Check className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-white text-sm font-semibold">Nothing missing</p>
                <p className="text-zinc-500 text-xs mt-1">Every unit has {KINDS.find((k) => k.id === kind)!.label.toLowerCase()}.</p>
              </div>
            ) : (
              years.map((y) => (
                <div key={y.id} className="space-y-2">
                  <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-500 flex items-center gap-2 px-1">
                    <span className="w-1.5 h-1.5 rounded-full td-accent-solid inline-block" /> {y.name}
                    <span className="td-surface-2 rounded-full px-1.5 py-0.5 text-[10px] text-zinc-400 tracking-normal">{y.rows.length}</span>
                  </p>

                  <div className="space-y-1.5">
                    {y.rows.map((r) => {
                      const gaps = missing(r, field);
                      const pct = completeness(r);
                      return (
                        <div key={r.subject_id} className="td-surface-2 rounded-2xl px-3.5 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="min-w-0 flex-1">
                            <span className="block text-white text-[13px] font-semibold truncate">{r.subject_name}</span>
                            <span className="block text-zinc-600 text-[11px]">
                              {r.qa_total} Q&amp;A · {r.pyq_count > 0 ? "PYQs ✓" : <span className="text-amber-500/80">no PYQs</span>} · {r.syllabus_count > 0 ? "syllabus ✓" : <span className="text-amber-500/80">no syllabus</span>} · {pct}% overall
                            </span>
                          </span>

                          <UnitDots row={r} field={field} />

                          {gaps.length > 0 && onPick && (
                            <span className="flex items-center gap-1">
                              {gaps.map((u) => (
                                <button
                                  key={u}
                                  onClick={() => onPick(r.subject_id, u)}
                                  title={`Open ${r.subject_name} — Unit ${u}`}
                                  className="td-btn-ghost px-2 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                                >
                                  U{u} <ArrowRight className="w-3 h-3" />
                                </button>
                              ))}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            <p className="text-[11px] text-zinc-600 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              A Study-With-AI unit only counts as filled if an answer has real content — a question added as a placeholder with an empty body reads as empty here, which is the point.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
