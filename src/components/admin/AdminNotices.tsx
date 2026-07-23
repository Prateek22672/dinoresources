import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import { toast } from "sonner";
import { Bell, Send, Trash2, Users, User, Info, AlertTriangle, ShieldAlert } from "lucide-react";

interface NoticeRow {
  id: string; user_id: string | null; title: string; body: string | null;
  kind: "info" | "warning" | "critical"; created_at: string; expires_at: string | null;
}

const kindMeta = {
  info:     { icon: Info,          cls: "td-accent-bg", label: "Info" },
  warning:  { icon: AlertTriangle, cls: "bg-amber-500/15 text-amber-300", label: "Warning" },
  critical: { icon: ShieldAlert,   cls: "bg-red-500/15 text-red-300", label: "Critical" },
};

export default function AdminNotices() {
  const [rows, setRows] = useState<NoticeRow[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // draft
  const [audience, setAudience] = useState<"all" | "user">("all");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<"info" | "warning" | "critical">("info");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await tbl("user_notices").select("*").order("created_at", { ascending: false }).limit(50);
    const list = (data ?? []) as NoticeRow[];
    setRows(list);
    const ids = [...new Set(list.map((r) => r.user_id).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: profs } = await tbl("profiles").select("id, email").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = p.email ?? p.id.slice(0, 8); });
      setEmails(map);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    setSending(true);

    let targetId: string | null = null;
    if (audience === "user") {
      const { data: prof } = await tbl("profiles").select("id").ilike("email", email.trim()).maybeSingle();
      if (!prof?.id) { toast.error("No user found with that email"); setSending(false); return; }
      targetId = prof.id;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const days = parseInt(expiryDays) || 0;
    const { error } = await tbl("user_notices").insert({
      user_id: targetId,
      title: title.trim(),
      body: body.trim() || null,
      kind,
      created_by: user?.id,
      expires_at: days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success(targetId ? "Notice sent to the user" : "Notice sent to everyone");
    setTitle(""); setBody(""); setEmail("");
    load();
  };

  const del = async (n: NoticeRow) => {
    if (!confirm(`Delete notice "${n.title}"?`)) return;
    const { error } = await tbl("user_notices").delete().eq("id", n.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  if (loading) return <div className="h-64 rounded-3xl td-surface animate-pulse max-w-3xl" />;

  return (
    <div className="space-y-8 max-w-3xl">
      <p className="text-zinc-500 text-sm -mt-2">
        Send an alert or message to one student or everyone — misuse warnings, multi-login alerts,
        maintenance info. It shows in the 🔔 bell in their header until it expires.
      </p>

      {/* Compose */}
      <section className="td-surface rounded-2xl p-5 space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2"><Send className="w-4 h-4 td-accent-text" /> Send a notice</h3>

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 p-1 rounded-full td-surface-2">
            <button onClick={() => setAudience("all")}
              className={`px-3.5 h-8 rounded-full text-xs font-semibold flex items-center gap-1.5 ${audience === "all" ? "bg-white text-black" : "text-zinc-400"}`}>
              <Users className="w-3.5 h-3.5" /> Everyone
            </button>
            <button onClick={() => setAudience("user")}
              className={`px-3.5 h-8 rounded-full text-xs font-semibold flex items-center gap-1.5 ${audience === "user" ? "bg-white text-black" : "text-zinc-400"}`}>
              <User className="w-3.5 h-3.5" /> One user
            </button>
          </div>
          {audience === "user" && (
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@email.com"
              className="flex-1 min-w-[200px] td-surface-2 rounded-full px-4 h-10 text-sm text-white outline-none placeholder:text-zinc-600" />
          )}
          <select value={kind} onChange={(e) => setKind(e.target.value as any)}
            className="td-surface-2 rounded-full px-3 h-10 text-sm text-white outline-none">
            <option value="info">ℹ️ Info</option>
            <option value="warning">⚠️ Warning</option>
            <option value="critical">🚨 Critical</option>
          </select>
          <div className="flex items-center td-surface-2 rounded-full px-3 h-10">
            <input type="number" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)}
              className="w-12 bg-transparent text-sm text-white outline-none" />
            <span className="text-zinc-500 text-xs">days visible (0 = forever)</span>
          </div>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Multiple device logins detected)"
          className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
          placeholder="Message (optional) — e.g. We noticed your account was used from 4 devices. Sharing accounts leads to suspension."
          className="w-full td-surface-2 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 resize-y" />

        <button onClick={send} disabled={sending} className="td-btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
          {sending ? "Sending…" : audience === "all" ? "Send to everyone" : "Send to user"}
        </button>
      </section>

      {/* History */}
      <section>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-zinc-400" /> Sent notices ({rows.length})</h3>
        {rows.length === 0 ? <p className="text-zinc-600 text-sm">Nothing sent yet.</p> : (
          <div className="space-y-2">
            {rows.map((n) => {
              const meta = kindMeta[n.kind] ?? kindMeta.info;
              return (
                <div key={n.id} className="td-surface rounded-2xl p-4 flex gap-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.cls}`}><meta.icon className="w-4 h-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-semibold">{n.title}</p>
                    {n.body && <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>}
                    <p className="text-zinc-600 text-[11px] mt-1">
                      {n.user_id ? `→ ${emails[n.user_id] ?? n.user_id.slice(0, 8)}` : "→ everyone"} ·{" "}
                      {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {n.expires_at ? ` · expires ${new Date(n.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                    </p>
                  </div>
                  <button onClick={() => del(n)} className="w-9 h-9 rounded-full hover:bg-red-500/20 flex items-center justify-center shrink-0" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
