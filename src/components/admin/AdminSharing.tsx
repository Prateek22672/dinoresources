import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl, invokeFn } from "@/integrations/supabase/revamp";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Users, Globe, MonitorSmartphone, Check, ChevronDown, ShieldX, AlertTriangle } from "lucide-react";

interface SharedRow {
  user_id: string; email: string | null; ip_count: number; device_count: number;
  total_logins: number; last_seen: string; has_access: boolean;
}
interface DetailRow { ip: string; user_agent: string | null; hits: number; first_seen: string; last_seen: string; }

function shortUA(ua: string | null) {
  if (!ua) return "Unknown device";
  const m = ua.match(/(Edg|Chrome|Firefox|Safari|Opera)[/ ]?([\d.]+)?/);
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Mac/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return `${m?.[1] ?? "Browser"}${os ? " · " + os : ""}`;
}

export default function AdminSharing() {
  const { userId } = useUserRole();
  const [rows, setRows] = useState<SharedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_shared_accounts", { _min: 3 });
    if (error) toast.error(error.message);
    setRows((data ?? []) as SharedRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (uid: string) => {
    if (openUser === uid) { setOpenUser(null); return; }
    setOpenUser(uid);
    setDetail([]);
    const { data } = await (supabase as any).rpc("get_login_detail", { _user_id: uid });
    setDetail((data ?? []) as DetailRow[]);
  };

  const revokeAll = async (row: SharedRow) => {
    if (!confirm(`Revoke ALL access for ${row.email ?? "this user"}? Use this if the account is being shared.`)) return;
    setBusy(true);
    // revoke every active subject + year grant
    const [sa, ya] = await Promise.all([
      tbl("user_subject_access").select("subject_id").eq("user_id", row.user_id).is("revoked_at", null),
      tbl("user_year_access").select("year_id").eq("user_id", row.user_id).is("revoked_at", null),
    ]);
    for (const r of (sa.data ?? []) as any[]) await invokeFn("admin-revoke-access", { target_user_id: row.user_id, kind: "subject", subject_id: r.subject_id, note: "account sharing" });
    for (const r of (ya.data ?? []) as any[]) await invokeFn("admin-revoke-access", { target_user_id: row.user_id, kind: "year", year_id: r.year_id, note: "account sharing" });
    await tbl("admin_audit_log").insert({ admin_id: userId, action: "revoke_sharing", target_user_id: row.user_id, detail: { ip_count: row.ip_count, device_count: row.device_count } });
    setBusy(false);
    toast.success("Access revoked for shared account");
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2.5 mb-2">
        <Users className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Account sharing</h2>
      </div>
      <p className="text-zinc-500 text-sm mb-5">
        Accounts that have logged in from <span className="text-white font-medium">3+ distinct IPs or devices</span> — a strong
        sign one paid login is being shared. Expand to see the IPs/devices, then revoke access if it’s being abused.
      </p>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl td-surface animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <div className="td-surface rounded-2xl p-6 flex items-center gap-3 text-sm text-emerald-400">
          <Check className="w-5 h-5" /> No accounts are showing sharing patterns yet.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const open = openUser === r.user_id;
            return (
              <div key={r.user_id} className="td-surface rounded-2xl overflow-hidden">
                <div className="p-4 flex items-center justify-between gap-3">
                  <button onClick={() => toggle(r.user_id)} className="flex items-center gap-3 min-w-0 text-left flex-1">
                    <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate flex items-center gap-2">
                        {r.email ?? r.user_id.slice(0, 12)}
                        {r.has_access && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold">PAID</span>}
                      </p>
                      <p className="text-zinc-500 text-xs flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {r.ip_count} IPs</span>
                        <span className="flex items-center gap-1"><MonitorSmartphone className="w-3 h-3" /> {r.device_count} devices</span>
                        <span>{r.total_logins} logins</span>
                      </p>
                    </div>
                  </button>
                  <button disabled={busy} onClick={() => revokeAll(r)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50">
                    <ShieldX className="w-3.5 h-3.5" /> Revoke access
                  </button>
                </div>
                {open && (
                  <div className="border-t border-white/5 bg-black/20 divide-y divide-white/5">
                    {detail.length === 0 ? (
                      <p className="px-4 py-3 text-zinc-600 text-xs">Loading…</p>
                    ) : detail.map((d, i) => (
                      <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                        <span className="font-mono text-zinc-300">{d.ip}</span>
                        <span className="text-zinc-500 truncate flex-1 text-right">{shortUA(d.user_agent)} · {d.hits}× · {new Date(d.last_seen).toLocaleDateString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
