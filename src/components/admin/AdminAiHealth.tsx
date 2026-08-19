import { useCallback, useEffect, useState } from "react";
import { tbl, invokeFn } from "@/integrations/supabase/revamp";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, KeyRound, CheckCircle2, AlertTriangle, XCircle, Clock, Bot } from "lucide-react";

interface KeyStatus {
  index: number; secret: string; ok: boolean; status: number;
  state: "healthy" | "rate_limited" | "invalid_key" | "model_unavailable" | "error" | "unreachable";
  code?: string | null;
}
interface Health { model: string; total: number; healthy: number; keys: KeyStatus[] }
interface ErrRow { id: string; fn: string; status: number | null; code: string | null; message: string | null; key_index: number | null; key_count: number | null; created_at: string }
interface StatRow { fn: string; key_index: number | null; code: string | null; status: number | null; failures: number; last_seen: string }

const STATE_UI: Record<KeyStatus["state"], { label: string; cls: string; Icon: any }> = {
  healthy:           { label: "Healthy",            cls: "text-emerald-400", Icon: CheckCircle2 },
  rate_limited:      { label: "Rate limited",       cls: "text-amber-400",   Icon: Clock },
  invalid_key:       { label: "Invalid key",        cls: "text-red-400",     Icon: XCircle },
  model_unavailable: { label: "Model unavailable",  cls: "text-red-400",     Icon: AlertTriangle },
  error:             { label: "Error",              cls: "text-red-400",     Icon: AlertTriangle },
  unreachable:       { label: "Unreachable",        cls: "text-zinc-400",    Icon: AlertTriangle },
};

/**
 * AI health — which Groq keys are live, and what has been failing.
 *
 * Key VALUES are never fetched or shown anywhere: the health endpoint returns a
 * position, the secret's NAME and a status, and the failure log stores the same.
 */
export default function AdminAiHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState<ErrRow[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [hours, setHours] = useState(24);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const check = useCallback(async () => {
    setChecking(true); setLoadErr(null);
    const { data, error } = await invokeFn<Health>("groq-health", {});
    if (error) setLoadErr(typeof error === "string" ? error : (error as any)?.message ?? "Health check failed");
    else setHealth(data ?? null);
    setChecking(false);
  }, []);

  const loadLogs = useCallback(async () => {
    const [{ data: rows }, { data: agg }] = await Promise.all([
      tbl("bot_error_log").select("*").order("created_at", { ascending: false }).limit(50),
      (supabase as any).rpc("bot_error_stats", { _hours: hours }),
    ]);
    setErrors((rows ?? []) as ErrRow[]);
    setStats((agg ?? []) as StatRow[]);
  }, [hours]);

  useEffect(() => { check(); }, [check]);
  useEffect(() => { loadLogs(); }, [loadLogs]);

  const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-5">
      {/* ── Keys ── */}
      <div className="td-surface rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <KeyRound className="w-4 h-4 td-accent-text" /> AI keys
          </h3>
          <button onClick={check} disabled={checking} className="td-btn-ghost px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} /> Re-check
          </button>
        </div>
        <p className="text-zinc-500 text-xs mb-4">
          Live check against Groq. Key values are never stored in the database or shown here — only their position and the secret's name.
        </p>

        {loadErr && <p className="text-red-400 text-sm mb-3">{loadErr}</p>}

        {health && (
          <>
            <div className="flex flex-wrap gap-2.5 mb-4">
              <div className="td-surface-2 rounded-2xl px-4 py-2.5">
                <p className="text-white font-bold text-lg leading-none">{health.healthy}/{health.total}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Keys usable</p>
              </div>
              <div className="td-surface-2 rounded-2xl px-4 py-2.5">
                <p className="text-white font-bold text-sm leading-none mt-1 font-mono">{health.model}</p>
                <p className="text-[11px] text-zinc-500 mt-1.5">Model</p>
              </div>
            </div>

            {health.total === 0 ? (
              <p className="text-amber-400 text-sm">No keys configured. Set <span className="font-mono">GROQ_API_KEY</span> in Edge Functions → Secrets.</p>
            ) : (
              <div className="space-y-1.5">
                {health.keys.map((k) => {
                  const ui = STATE_UI[k.state] ?? STATE_UI.error;
                  return (
                    <div key={k.index} className="td-surface-2 rounded-xl px-3 py-2.5 flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg td-surface flex items-center justify-center text-[11px] font-bold text-zinc-300 shrink-0">
                        {k.index}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-zinc-200 text-[13px] font-mono truncate">{k.secret}</p>
                        {k.code && <p className="text-zinc-600 text-[11px] truncate">{k.code}</p>}
                      </div>
                      <span className={`text-xs font-semibold flex items-center gap-1.5 shrink-0 ${ui.cls}`}>
                        <ui.Icon className="w-3.5 h-3.5" /> {ui.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-zinc-600 text-[11px] mt-3">
              Add capacity with <span className="font-mono">GROQ_API_KEY_2</span> … <span className="font-mono">_10</span>; requests rotate across every key, so more keys means more per-minute budget.
            </p>
          </>
        )}
      </div>

      {/* ── Failure analytics ── */}
      <div className="td-surface rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Bot className="w-4 h-4 td-accent-text" /> Failures by cause
          </h3>
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))}
            className="td-surface-2 rounded-full px-3 h-8 text-xs text-white outline-none">
            <option value={1}>Last hour</option>
            <option value={24}>Last 24 hours</option>
            <option value={168}>Last 7 days</option>
          </select>
        </div>

        {stats.length === 0 ? (
          <p className="text-emerald-400 text-sm flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> No AI failures in this window.</p>
        ) : (
          <div className="space-y-1.5">
            {stats.map((s, i) => (
              <div key={i} className="td-surface-2 rounded-xl px-3 py-2.5 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-200 text-[13px] font-medium truncate">
                    {s.code ?? "unknown"} <span className="text-zinc-600">· {s.fn}</span>
                  </p>
                  <p className="text-zinc-600 text-[11px]">
                    {s.status ? `HTTP ${s.status}` : "no response"}{s.key_index ? ` · key #${s.key_index}` : ""} · last {when(s.last_seen)}
                  </p>
                </div>
                <span className="text-white font-bold text-sm shrink-0">{s.failures}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Raw log ── */}
      <div className="td-surface rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Recent failures</h3>
          <button onClick={loadLogs} className="td-btn-ghost px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        {errors.length === 0 ? (
          <p className="text-zinc-600 text-sm">Nothing logged yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {errors.map((e) => (
              <div key={e.id} className="td-surface-2 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full td-surface text-zinc-300">{e.fn}</span>
                  {e.status ? <span className="text-[11px] text-red-400 font-semibold">HTTP {e.status}</span> : null}
                  {e.code ? <span className="text-[11px] text-zinc-400 font-mono">{e.code}</span> : null}
                  {e.key_index ? <span className="text-[11px] text-zinc-600">key #{e.key_index}/{e.key_count}</span> : null}
                  <span className="text-[11px] text-zinc-600 ml-auto">{when(e.created_at)}</span>
                </div>
                {e.message && <p className="text-zinc-500 text-[11px] mt-1 break-words">{e.message}</p>}
              </div>
            ))}
          </div>
        )}
        <p className="text-zinc-600 text-[11px] mt-3">
          After three failures in ten minutes for one student, DinoBot files a support ticket for them automatically.
        </p>
      </div>
    </div>
  );
}
