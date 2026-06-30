import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  tbl, TICKET_CATEGORIES, ticketCategoryLabel, SupportTicketRow, SubjectRow,
} from "@/integrations/supabase/revamp";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LifeBuoy, Clock, CheckCircle2, Loader2, Send } from "lucide-react";

const statusMeta: Record<string, { label: string; cls: string; icon: any }> = {
  open:        { label: "Open",        cls: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
  in_progress: { label: "In progress", cls: "text-sky-400 bg-sky-500/10 border-sky-500/20", icon: Loader2 },
  resolved:    { label: "Resolved",    cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
};

export default function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [category, setCategory] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);

  const needsSubject = TICKET_CATEGORIES.find((c) => c.value === category)?.needsSubject;

  const loadTickets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await tbl("support_tickets")
      .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTickets((data ?? []) as SupportTicketRow[]);
  }, []);

  useEffect(() => {
    if (!open) return;
    loadTickets();
    tbl("subjects").select("id, name, slug").order("name").then((r: any) => setSubjects((r.data ?? []) as SubjectRow[]));
  }, [open, loadTickets]);

  const submit = async () => {
    if (!category) { toast.error("Please choose an issue type"); return; }
    if (!message.trim()) { toast.error("Please describe the issue"); return; }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please log in"); setSubmitting(false); return; }

    const { error } = await tbl("support_tickets").insert({
      user_id: user.id,
      category,
      subject_id: needsSubject && subjectId ? subjectId : null,
      message: message.trim(),
      contact: contact.trim() || user.email,
    });
    setSubmitting(false);
    if (error) { toast.error("Could not submit. Please try again."); return; }
    toast.success("Ticket raised — we'll get back to you within 24 hours.");
    setCategory(""); setSubjectId(""); setMessage(""); setContact("");
    loadTickets();
  };

  const inputCls = "w-full td-surface-2 rounded-xl px-3.5 h-11 text-sm text-white outline-none transition-shadow focus:ring-2 focus:ring-[#7c6cf0]/40 placeholder:text-zinc-600";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="td-app td-surface text-zinc-100 border-0 p-0 overflow-hidden shadow-2xl gap-0
                   w-[calc(100vw-1.25rem)] sm:max-w-[480px] max-h-[92vh] overflow-y-auto
                   rounded-3xl
                   max-sm:rounded-b-none max-sm:!top-auto max-sm:!bottom-0 max-sm:!translate-y-0 max-sm:!w-full max-sm:max-w-full"
      >
        {/* Header */}
        <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 text-left space-y-0 relative">
          {/* mobile grabber */}
          <div className="sm:hidden mx-auto w-10 h-1 rounded-full bg-white/15 mb-4" />
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#7c6cf0]/15 border border-[#7c6cf0]/25 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5 td-accent-text" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-white leading-tight">Need help?</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm mt-1 leading-relaxed">
                Tell us what's wrong — we reply within <span className="text-zinc-200 font-medium">24&nbsp;hours</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="h-px bg-white/8" />

        {/* Form */}
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Issue type</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              <option value="">Select an issue…</option>
              {TICKET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {needsSubject && (
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Which subject?</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputCls}>
                <option value="">Select a subject (optional)…</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Describe the problem</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
              placeholder="e.g. I paid ₹29 for the First Year combo but my subjects still show locked. Payment ID: …"
              className="w-full td-surface-2 rounded-xl px-3.5 py-3 text-sm text-white outline-none resize-y transition-shadow focus:ring-2 focus:ring-[#7c6cf0]/40 placeholder:text-zinc-600 min-h-[96px]" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Contact <span className="text-zinc-600 font-normal">(optional)</span></label>
            <input value={contact} onChange={(e) => setContact(e.target.value)}
              placeholder="Email or phone for follow-up" className={inputCls} />
          </div>

          <button onClick={submit} disabled={submitting}
            className="w-full td-btn-primary py-3.5 rounded-full flex items-center justify-center gap-2 disabled:opacity-60 mt-1">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "Submitting…" : "Raise ticket"}
          </button>

          {/* Past tickets */}
          {tickets.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">Your tickets ({tickets.length})</p>
              <div className="space-y-2">
                {tickets.map((t) => {
                  const m = statusMeta[t.status] ?? statusMeta.open;
                  return (
                    <div key={t.id} className="td-surface-2 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-zinc-200 font-medium truncate">{ticketCategoryLabel(t.category)}</p>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.cls}`}>
                          <m.icon className="w-3 h-3" /> {m.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{t.message}</p>
                      {t.admin_note && (
                        <p className="text-xs text-emerald-300/90 mt-1.5 border-l-2 border-emerald-500/30 pl-2">Team: {t.admin_note}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
