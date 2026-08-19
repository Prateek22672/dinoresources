import { useCallback, useEffect, useState } from "react";
import { tbl, invokeFn } from "@/integrations/supabase/revamp";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, KeyRound, CheckCircle2, AlertTriangle, XCircle, Clock, Bot, ShieldCheck, Plus, Trash2 } from "lucide-react";

interface KeyStatus {
  index: number; secret: string; ok: boolean; status: number;
  state: "healthy" | "rate_limited" | "invalid_key" | "model_unavailable" | "error" | "unreachable";
  code?: string | null;
}
interface Health { model: string; total: number; healthy: number; keys: KeyStatus[] }
interface ErrRow { id: string; fn: string; status: number | null; code: string | null; message: string | null; key_index: number | null; key_count: number | null; created_at: string }
interface ManagedKey { id: string; label: string; hint: string | null; active: boolean; created_at: string }
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
  const [managed, setManaged] = useState<ManagedKey[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [keyMsg, setKeyMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const callKeys = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error } = await invokeFn<{ keys?: ManagedKey[]; error?: string }>("ai-keys", payload);
    if (error || data?.error) {
      setKeyMsg({ ok: false, text: (data?.error ?? (error as any)?.message ?? "Request failed") as string });
      return false;
    }
    setManaged(data?.keys ?? []);
    return true;
  }, []);

  const addKey = async () => {
    setSaving(true); setKeyMsg(null);
    const ok = await callKeys({ action: "add", label: newLabel.trim(), value: newKey.trim() });
    setSaving(false);
    if (ok) {
      // Clear immediately — the value should not linger in the DOM.
      setNewKey(""); setNewLabel("");
      setKeyMsg({ ok: true, text: "Key saved and in rotation." });
      check();
    }
  };
  const removeKey = async (k: ManagedKey) => {
    if (!confirm(`Remove "${k.label}"? This cannot be undone.`)) return;
    await callKeys({ action: "remove", id: k.id });
    check();
  };
  const toggleKey = async (k: ManagedKey) => { await callKeys({ action: "toggle", id: k.id, active: !k.active }); check(); };

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
  useEffect(() => { callKeys({ action: "list" }); }, [callKeys]);
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
              Requests rotate across every key, so more keys means more per-minute budget.
            </p>
          </>
        )}
      </div>

      {/* ── Managed keys (encrypted in Vault, added here) ── */}
      <div className="td-surface rounded-3xl p-5">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 td-accent-text" /> Add a key
        </h3>
        <p className="text-zinc-500 text-xs mb-4">
          Stored encrypted in Supabase Vault, outside any REST-exposed table. Once saved a key can be
          used and removed but <span className="text-zinc-300 font-medium">never read back</span> — not here, not by anyone.
          Keep a copy with your provider.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Name (e.g. account-2)"
            className="sm:w-44 td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600"
          />
          <input
            value={newKey} onChange={(e) => setNewKey(e.target.value)}
            type="password" autoComplete="off" spellCheck={false}
            placeholder="Paste the API key"
            className="flex-1 min-w-0 td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600 font-mono"
          />
          <button onClick={addKey} disabled={saving || !newKey.trim() || !newLabel.trim()}
            className="td-btn-primary px-4 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Add"}
          </button>
        </div>
        {keyMsg && <p className={`text-xs mt-2 ${keyMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{keyMsg.text}</p>}

        {managed.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-600">Managed keys ({managed.length})</p>
            {managed.map((k) => (
              <div key={k.id} className="td-surface-2 rounded-xl px-3 py-2.5 flex items-center gap-3">
                <KeyRound className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-200 text-[13px] font-medium truncate">{k.label}</p>
                  <p className="text-zinc-600 text-[11px] font-mono">••••{k.hint ?? "____"}</p>
                </div>
                <button onClick={() => toggleKey(k)} className="td-btn-ghost px-2.5 py-1 rounded-full text-[11px] shrink-0">
                  {k.active ? "Disable" : "Enable"}
                </button>
                <button onClick={() => removeKey(k)} className="w-7 h-7 rounded-full hover:bg-red-500/20 flex items-center justify-center shrink-0" title="Remove">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
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
