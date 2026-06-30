import { useEffect, useState } from "react";
import { tbl, AuditLogRow } from "@/integrations/supabase/revamp";
import { ScrollText } from "lucide-react";

const actionLabel: Record<string, string> = {
  grant_subject: "Granted subject", revoke_subject: "Revoked subject",
  grant_year: "Granted combo", revoke_year: "Revoked combo",
  set_role: "Changed role",
};

export default function AdminAudit() {
  const [rows, setRows] = useState<(AuditLogRow & { adminEmail?: string; targetEmail?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await tbl("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
      const logs = (data ?? []) as AuditLogRow[];
      const ids = [...new Set(logs.flatMap((l) => [l.admin_id, l.target_user_id]).filter(Boolean))] as string[];
      const { data: profiles } = ids.length ? await tbl("profiles").select("id, email").in("id", ids) : { data: [] };
      const map = new Map<string, string>((profiles ?? []).map((p: any) => [p.id, p.email]));
      setRows(logs.map((l) => ({ ...l, adminEmail: l.admin_id ? map.get(l.admin_id) : undefined, targetEmail: l.target_user_id ? map.get(l.target_user_id) : undefined })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded-xl td-surface animate-pulse" />)}</div>;

  return (
    <div>
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><ScrollText className="w-4 h-4 td-accent-text" /> Admin actions ({rows.length})</h3>
      {rows.length === 0 ? (
        <div className="py-16 text-center td-surface rounded-3xl text-zinc-500">No actions logged yet.</div>
      ) : (
        <div className="td-surface rounded-2xl overflow-hidden">
          {rows.map((r) => (
            <div key={r.id} className="px-4 py-3 border-b border-white/5 last:border-0 flex items-center justify-between gap-4 text-sm">
              <div className="min-w-0">
                <p className="text-white">
                  <span className="text-zinc-400">{r.adminEmail ?? "admin"}</span>
                  {" · "}
                  <span className="font-medium">{actionLabel[r.action] ?? r.action}</span>
                  {r.targetEmail && <span className="text-zinc-400"> → {r.targetEmail}</span>}
                </p>
                {r.detail?.note ? <p className="text-zinc-600 text-xs mt-0.5">{String(r.detail.note)}</p> : null}
              </div>
              <span className="text-zinc-600 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
