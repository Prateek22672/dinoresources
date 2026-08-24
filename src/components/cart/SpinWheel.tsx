import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Sparkles } from "lucide-react";
import { DinoBlackIcon } from "@/components/BrandIcons";

interface Seg { id: string; label: string; percent: number; }
interface Win { code: string; percent: number; label: string; }

const WHEEL_COLORS = [
  "var(--td-accent)",
  "#3a3a3a",
  "rgb(var(--td-accent-rgb) / 0.45)",
  "#2b2b2b",
  "rgb(var(--td-accent-rgb) / 0.75)",
  "#333333",
];

/**
 * Spin & Win dialog. The SERVER picks the winning segment (weighted, admin-set
 * odds) via the spin_wheel() RPC — the animation just lands on that result.
 */
export default function SpinWheel({
  open, onClose, onWin,
}: {
  open: boolean;
  /** Receives the prize when one was won but not applied, so it isn't lost. */
  onClose: (won?: { code: string; percent: number }) => void;
  onWin: (code: string, percent: number) => void;
}) {
  const [segs, setSegs] = useState<Seg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Win | null>(null);
  const pending = useRef<Win | null>(null);

  useEffect(() => {
    if (!open) return;
    setRot(0); setResult(null); setSpinning(false); pending.current = null;
    setLoaded(false);
    (supabase as any).rpc("spin_segments_public").then(({ data }: any) => {
      setSegs(data ?? []);
      setLoaded(true);
    });
  }, [open]);

  if (!open) return null;

  const n = segs.length;
  const a = n ? 360 / n : 360;
  const gradient = n
    ? `conic-gradient(${segs.map((_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * a}deg ${(i + 1) * a}deg`).join(", ")})`
    : "conic-gradient(#333 0deg 360deg)";

  const spin = async () => {
    if (spinning || !n) return;
    setSpinning(true);
    const { data, error } = await (supabase as any).rpc("spin_wheel");
    if (error) {
      toast.error(error.message ?? "Spin failed");
      setSpinning(false);
      onClose();
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    const idx = Math.max(0, segs.findIndex((s) => s.id === row.segment_id));
    pending.current = { code: row.coupon_code, percent: row.percent, label: row.label };
    // 6 full turns + land the winning segment's center under the top pointer
    const target = 6 * 360 + (360 - (idx * a + a / 2));
    requestAnimationFrame(() => setRot(target));
  };

  const settled = () => {
    if (!pending.current) return;
    setResult(pending.current);
    pending.current = null;
    setSpinning(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}>
      <div className="td-surface rounded-[28px] p-6 sm:p-8 w-full max-w-sm text-center relative td-in">
        <button
          onClick={() => onClose(result ? { code: result.code, percent: result.percent } : undefined)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full td-btn-ghost flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-white font-extrabold text-xl tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: "var(--td-accent-soft)" }} /> Spin &amp; Win
        </p>
        <p className="text-zinc-500 text-sm mt-1 mb-6">
          {n
            ? <>One free spin — up to {Math.max(...segs.map((s) => s.percent))}% off your cart.</>
            : loaded
              ? "No prizes are set up right now."
              : "Loading the wheel…"}
        </p>

        {loaded && !n ? (
          /* Zero segments means an admin has not configured the wheel. Showing
             the disc anyway produced a blank grey circle and a dead SPIN
             button, which reads as a broken feature rather than an unfinished
             one. */
          <div className="td-surface-2 rounded-2xl p-6 mb-6">
            <p className="text-zinc-300 text-sm font-semibold">The wheel isn&apos;t ready yet</p>
            <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">
              No prizes have been added to it. Nothing has been used up — your free spin is still waiting for when it&apos;s set up.
            </p>
          </div>
        ) : (
        /* Wheel */
        <div className="relative w-64 h-64 mx-auto mb-6 select-none">
          {/* pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10 w-0 h-0"
            style={{ borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "18px solid #ffffff", filter: "drop-shadow(0 2px 4px rgba(0,0,0,.5))" }} />
          <div
            onTransitionEnd={settled}
            className="w-full h-full rounded-full border-4 border-white/15"
            style={{
              background: gradient,
              transform: `rotate(${rot}deg)`,
              transition: rot ? "transform 4.2s cubic-bezier(.12,.65,.08,1)" : undefined,
              boxShadow: "0 0 0 6px rgba(0,0,0,0.35), 0 22px 60px -20px rgba(0,0,0,0.8)",
            }}
          >
            {segs.map((s, i) => (
              <div key={s.id} className="absolute inset-0" style={{ transform: `rotate(${i * a + a / 2}deg)` }}>
                <span className="absolute left-1/2 -translate-x-1/2 top-4 text-[13px] font-extrabold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>
                  {s.label}
                </span>
              </div>
            ))}
            {/* hub */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center">
              <DinoBlackIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
        )}

        {result ? (
          <div className="td-in">
            <p className="text-zinc-400 text-sm font-semibold">You won</p>
            <p className="text-3xl font-extrabold mt-1" style={{ color: "var(--td-accent-soft)" }}>{result.label}</p>
            <p className="text-zinc-500 text-xs mt-2">Coupon <span className="font-mono text-zinc-300">{result.code}</span> · valid 48 hours · one use</p>
            <button onClick={() => onWin(result.code, result.percent)} className="td-btn-primary w-full py-3.5 mt-5 text-sm font-bold">
              Apply to my cart
            </button>
            <button
              onClick={() => onClose({ code: result.code, percent: result.percent })}
              className="w-full py-2.5 mt-2 text-xs font-medium text-zinc-500 hover:text-white transition-colors"
            >
              Save for later — it's yours for 48 hours
            </button>
          </div>
        ) : (
          n ? (
            <button onClick={spin} disabled={spinning} className="td-btn-primary w-full py-3.5 text-sm font-bold disabled:opacity-60">
              {spinning ? "Spinning…" : "SPIN"}
            </button>
          ) : (
            <button onClick={() => onClose()} className="td-btn-ghost w-full py-3.5 rounded-full text-sm font-bold">
              Close
            </button>
          )
        )}
      </div>
    </div>
  );
}
