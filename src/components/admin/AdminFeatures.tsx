import { useEffect, useState, useCallback } from "react";
import { tbl, FeatureFlagRow } from "@/integrations/supabase/revamp";
import { toast } from "sonner";
import { ToggleRight, LayoutGrid } from "lucide-react";

export default function AdminFeatures() {
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await tbl("feature_flags").select("*").order("key");
    setFlags((data ?? []) as FeatureFlagRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (f: FeatureFlagRow) => {
    setBusy(f.key);
    const { error } = await tbl("feature_flags").update({ enabled: !f.enabled, updated_at: new Date().toISOString() }).eq("key", f.key);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${f.label} ${!f.enabled ? "shown" : "hidden"}`);
    load();
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2.5 mb-2">
        <LayoutGrid className="w-5 h-5 td-accent-text" />
        <h2 className="text-lg font-bold text-white">Cards & features</h2>
      </div>
      <p className="text-zinc-500 text-sm mb-6">Turn cards/features on or off across the site. Changes apply to everyone on next load.</p>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 rounded-2xl td-surface animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {flags.map((f) => (
            <div key={f.key} className="td-surface rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-medium">{f.label}</p>
                <p className="text-zinc-600 text-xs font-mono mt-0.5">{f.key}</p>
              </div>
              <button
                onClick={() => toggle(f)}
                disabled={busy === f.key}
                role="switch" aria-checked={f.enabled}
                className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${f.enabled ? "bg-[#7c6cf0]" : "bg-white/15"}`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${f.enabled ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
