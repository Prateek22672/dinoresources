import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import { Bell, Info, AlertTriangle, ShieldAlert } from "lucide-react";

interface Notice {
  id: string; title: string; body: string | null;
  kind: "info" | "warning" | "critical"; created_at: string;
}

const kindMeta = {
  info:     { icon: Info,        cls: "td-accent-bg" },
  warning:  { icon: AlertTriangle, cls: "bg-amber-500/15 text-amber-300" },
  critical: { icon: ShieldAlert, cls: "bg-red-500/15 text-red-300" },
};

/** Bell with unread count — admin notices (personal + broadcast). */
export default function NoticesBell() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: n }, { data: r }] = await Promise.all([
      tbl("user_notices").select("id, title, body, kind, created_at").order("created_at", { ascending: false }).limit(20),
      tbl("notice_reads").select("notice_id").eq("user_id", user.id),
    ]);
    setNotices((n ?? []) as Notice[]);
    setReadIds(new Set((r ?? []).map((x: any) => x.notice_id)));
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const unread = notices.filter((n) => !readIds.has(n.id)).length;

  const openPanel = async () => {
    setOpen((o) => !o);
    if (open || unread === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const rows = notices.filter((n) => !readIds.has(n.id)).map((n) => ({ notice_id: n.id, user_id: user.id }));
    if (rows.length) {
      await tbl("notice_reads").upsert(rows, { onConflict: "notice_id,user_id" });
      setReadIds(new Set([...readIds, ...rows.map((r) => r.notice_id)]));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={openPanel} className="relative w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center" aria-label="Notifications">
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="td-accent-solid absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 td-glass border border-white/10 rounded-2xl w-[320px] max-h-[420px] overflow-y-auto shadow-2xl td-in">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 px-4 pt-3.5 pb-2">Notifications</p>
          {notices.length === 0 ? (
            <p className="text-zinc-500 text-sm px-4 pb-4">Nothing here yet.</p>
          ) : (
            <div className="pb-2">
              {notices.map((n) => {
                const meta = kindMeta[n.kind] ?? kindMeta.info;
                return (
                  <div key={n.id} className="px-4 py-3 border-t border-white/5 flex gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.cls}`}>
                      <meta.icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold leading-snug">{n.title}</p>
                      {n.body && <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{n.body}</p>}
                      <p className="text-zinc-600 text-[10px] mt-1">{new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
