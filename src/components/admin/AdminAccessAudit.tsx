import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Check, AlertTriangle, BookOpen, Package, X, ShieldAlert } from "lucide-react";

interface UnverifiedRow {
  kind: "subject" | "combo";
  access_id: string;
  user_id: string;
  email: string | null;
  item: string;
  source: string;
  created_at: string;
}

export default function AdminAccessAudit() {
  const { userId } = useUserRole();
  const [unverified, setUnverified] = useState<UnverifiedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_unverified_access");
    if (error) { toast.error(error.message); setUnverified([]); }
    else setUnverified((data ?? []) as UnverifiedRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const revoke = async (row: UnverifiedRow) => {
    if (!confirm(`Revoke ${row.item} from ${row.email ?? "this user"}? They have no verified payment for it.`)) return;
    setBusyId(row.access_id);
    const table = row.kind === "subject" ? "user_subject_access" : "user_year_access";
    const { error } = await tbl(table).update({ revoked_at: new Date().toISOString() }).eq("id", row.access_id);
    if (!error) {
      await tbl("admin_audit_log").insert({
        admin_id: userId, action: row.kind === "subject" ? "revoke_subject" : "revoke_year",
        target_user_id: row.user_id, detail: { reason: "unverified access (no payment)", item: row.item },
      });
    }
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Access revoked");
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2.5 mb-2">
        <ShieldAlert className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Access audit — possible bypass</h2>
      </div>
      <p className="text-zinc-500 text-sm mb-5">
        Accounts holding subject/combo access with <span className="text-white font-medium">no verified payment</span> and
        not granted by an admin. Review and revoke any that shouldn’t have access.
      </p>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl td-surface animate-pulse" />)}</div>
      ) : unverified.length === 0 ? (
        <div className="td-surface rounded-2xl p-6 flex items-center gap-3 text-sm text-emerald-400">
          <Check className="w-5 h-5" /> No unverified access — every active grant is backed by a payment or an admin grant.
        </div>
      ) : (
        <div className="td-surface rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 text-xs text-amber-300 bg-amber-500/10 border-b border-amber-500/15 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {unverified.length} flagged grant{unverified.length === 1 ? "" : "s"}
          </div>
          {unverified.map((r) => (
            <div key={r.access_id} className="px-4 py-3 border-b border-white/5 last:border-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {r.kind === "combo" ? <Package className="w-4 h-4 td-accent-text shrink-0" /> : <BookOpen className="w-4 h-4 text-zinc-400 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{r.email ?? r.user_id.slice(0, 12)}</p>
                  <p className="text-zinc-500 text-xs truncate">{r.item} · <span className="text-zinc-600">{r.source}</span> · {new Date(r.created_at).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              <button disabled={busyId === r.access_id} onClick={() => revoke(r)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50">
                <X className="w-3.5 h-3.5" /> Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
