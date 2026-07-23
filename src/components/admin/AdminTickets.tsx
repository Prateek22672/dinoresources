import { useEffect, useState, useCallback } from "react";
import {
  tbl, ticketCategoryLabel, SupportTicketRow, TicketStatus,
} from "@/integrations/supabase/revamp";
import { toast } from "sonner";
import { LifeBuoy, Filter, Clock, Loader2, CheckCircle2, Save, Bot } from "lucide-react";

/** Admin-editable brain for DinoBot (the help chat). Stored in app_settings. */
function HelpBotBrain() {
  const [prompt, setPrompt] = useState("");
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tbl("app_settings").select("id, helpbot_prompt").maybeSingle().then(({ data }: any) => {
      if (data) { setSettingsId(data.id); setPrompt(data.helpbot_prompt ?? ""); }
    });
  }, []);

  const save = async () => {
    if (!settingsId) return;
    setSaving(true);
    const { error } = await tbl("app_settings").update({ helpbot_prompt: prompt }).eq("id", settingsId);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Bot brain updated — applies to the next chat");
  };

  return (
    <section className="td-surface rounded-2xl p-5 mb-6">
      <h3 className="text-white font-semibold flex items-center gap-2 mb-1"><Bot className="w-4 h-4 td-accent-text" /> DinoBot brain</h3>
      <p className="text-zinc-500 text-xs mb-3 leading-relaxed">
        The help bot's personality and rules. The live subject list, prices and free tools are injected
        automatically — write behaviour here, not the catalog. Turn the bot on/off via the
        <span className="text-zinc-300"> helpbot</span> flag in Cards &amp; Features.
      </p>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6}
        className="w-full td-surface-2 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none resize-y leading-relaxed" />
      <button onClick={save} disabled={saving} className="td-btn-primary px-4 py-2 text-sm mt-3 disabled:opacity-60">
        {saving ? "Saving…" : "Save brain"}
      </button>
    </section>
  );
}

type FilterT = "all" | TicketStatus;

interface TicketRow extends SupportTicketRow { email?: string; subjectName?: string }

const statusMeta: Record<string, { label: string; cls: string; icon: any }> = {
  open:        { label: "Open",        cls: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
  in_progress: { label: "In progress", cls: "text-sky-400 bg-sky-500/10 border-sky-500/20", icon: Loader2 },
  resolved:    { label: "Resolved",    cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [filter, setFilter] = useState<FilterT>("all");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await tbl("support_tickets").select("*").order("created_at", { ascending: false });
    const rows = (data ?? []) as SupportTicketRow[];

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const subjIds = [...new Set(rows.map((r) => r.subject_id).filter(Boolean))] as string[];
    const [profiles, subjects] = await Promise.all([
      userIds.length ? tbl("profiles").select("id, email").in("id", userIds) : Promise.resolve({ data: [] }),
      subjIds.length ? tbl("subjects").select("id, name").in("id", subjIds) : Promise.resolve({ data: [] }),
    ]);
    const emailMap = new Map<string, string>((profiles.data ?? []).map((p: any) => [p.id, p.email]));
    const subjMap = new Map<string, string>((subjects.data ?? []).map((s: any) => [s.id, s.name]));

    setTickets(rows.map((r) => ({
      ...r,
      email: emailMap.get(r.user_id),
      subjectName: r.subject_id ? subjMap.get(r.subject_id) : undefined,
    })));
    setNotes(Object.fromEntries(rows.map((r) => [r.id, r.admin_note ?? ""])));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = async (id: string, patch: { status?: TicketStatus; admin_note?: string }) => {
    const { error } = await tbl("support_tickets").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Ticket updated");
    load();
  };

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div>
      <HelpBotBrain />

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-500" />
        {(["all", "open", "in_progress", "resolved"] as FilterT[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === f ? "bg-white text-black" : "td-btn-ghost"}`}>
            {f === "in_progress" ? "in progress" : f}
            {f === "open" && openCount > 0 ? ` (${openCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl td-surface animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center td-surface rounded-3xl text-zinc-500">
          <LifeBuoy className="w-8 h-8 mx-auto mb-2 text-zinc-700" /> No tickets here.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const m = statusMeta[t.status] ?? statusMeta.open;
            return (
              <div key={t.id} className="td-surface rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-white font-semibold">{ticketCategoryLabel(t.category)}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {t.email ?? t.user_id.slice(0, 12)}
                      {t.subjectName ? ` · ${t.subjectName}` : ""}
                      {" · "}{new Date(t.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${m.cls}`}>
                    <m.icon className="w-3 h-3" /> {m.label}
                  </span>
                </div>

                <p className="text-zinc-300 text-sm mt-3 td-surface-2 rounded-xl p-3 whitespace-pre-wrap">{t.message}</p>
                {t.contact && <p className="text-zinc-500 text-xs mt-2">Contact: <span className="text-zinc-300">{t.contact}</span></p>}

                {/* admin actions */}
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <input
                    value={notes[t.id] ?? ""}
                    onChange={(e) => setNotes((p) => ({ ...p, [t.id]: e.target.value }))}
                    placeholder="Reply / internal note (visible to the user)…"
                    className="flex-1 td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                  <button onClick={() => update(t.id, { admin_note: notes[t.id] })}
                    className="td-btn-ghost px-3 h-10 text-sm flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
                  <div className="flex gap-1.5">
                    {(["open", "in_progress", "resolved"] as TicketStatus[]).map((s) => (
                      <button key={s} onClick={() => update(t.id, { status: s })}
                        className={`px-3 h-10 rounded-xl text-xs font-medium capitalize ${t.status === s ? "bg-white text-black" : "td-btn-ghost"}`}>
                        {s === "in_progress" ? "progress" : s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
