import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X, Send, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type ShowcasePost, type ShowcaseCategory, CATEGORIES, sb, uploadCover, cleanUrl } from "@/lib/showcase";
import { ShowcaseCover } from "./ShowcaseCard";

interface Draft {
  title: string; tagline: string; description: string; category: ShowcaseCategory;
  tags: string; team: string; live: string; repo: string; cover: string | null;
}
const EMPTY: Draft = { title: "", tagline: "", description: "", category: "project", tags: "", team: "", live: "", repo: "", cover: null };

/**
 * Post (or edit) a project. Everything goes to the review queue — the
 * database forces new and edited posts to `pending`, so this form only has
 * to say so honestly.
 */
export default function ShowcaseSubmit({ open, onClose, userId, editing, onSaved }: {
  open: boolean; onClose: () => void; userId: string; editing?: ShowcasePost | null; onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setD(editing ? {
      title: editing.title, tagline: editing.tagline, description: editing.description, category: editing.category,
      tags: editing.tags.join(", "), team: editing.team ?? "", live: editing.live_url ?? "", repo: editing.repo_url ?? "", cover: editing.cover_url,
    } : EMPTY);
  }, [open, editing]);

  const set = (patch: Partial<Draft>) => setD((p) => ({ ...p, ...patch }));

  const pickCover = async (f: File | undefined) => {
    if (!f) return;
    setUploading(true);
    try { set({ cover: await uploadCover(userId, f) }); }
    catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (d.title.trim().length < 3) return toast.error("Give it a title (3+ characters)");
    if (d.tagline.trim().length < 5) return toast.error("Add a one-line pitch");
    const live = cleanUrl(d.live), repo = cleanUrl(d.repo);
    if (d.live.trim() && !live) return toast.error("That live link doesn't look right");
    if (d.repo.trim() && !repo) return toast.error("That code link doesn't look right");
    setBusy(true);
    const row = {
      title: d.title.trim().slice(0, 80),
      tagline: d.tagline.trim().slice(0, 140),
      description: d.description.trim().slice(0, 4000),
      category: d.category,
      tags: d.tags.split(/[,#]/).map((t) => t.trim()).filter(Boolean),
      team: d.team.trim().slice(0, 200) || null,
      live_url: live, repo_url: repo, cover_url: d.cover,
    };
    const { error } = editing
      ? await sb.from("showcase_posts").update(row).eq("id", editing.id)
      : await sb.from("showcase_posts").insert({ ...row, author_id: userId });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Saved — it's back in review" : "Submitted! An admin will review it soon.");
    onSaved();
    onClose();
  };

  const field = "w-full td-surface-2 rounded-xl px-3.5 h-11 text-sm text-white outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-[rgb(var(--td-accent-rgb)/0.35)]";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="td-surface rounded-[28px] border border-white/10 max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        <div className="p-6 sm:p-7 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-extrabold">{editing ? "Edit your post" : "Share what you built"}</DialogTitle>
            <DialogDescription className="text-zinc-500 text-[13px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Posts go live after a quick admin review{editing ? " — edits are reviewed again" : ""}.
            </DialogDescription>
          </DialogHeader>

          {/* cover */}
          <label className="block relative aspect-[16/7] rounded-2xl overflow-hidden td-surface-2 cursor-pointer group">
            {d.cover || d.title ? (
              <ShowcaseCover post={{ title: d.title || "?", cover_url: d.cover }} className="w-full h-full" />
            ) : null}
            <span className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 td-on-dark text-[13px] font-semibold transition-opacity ${d.cover ? "bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100" : "bg-black/20"}`}>
              <ImagePlus className="w-5 h-5" /> {uploading ? "Uploading…" : d.cover ? "Change cover" : "Add a cover image (optional, max 3MB)"}
            </span>
            {d.cover && (
              <button type="button" onClick={(e) => { e.preventDefault(); set({ cover: null }); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 td-on-dark flex items-center justify-center" aria-label="Remove cover">
                <X className="w-4 h-4" />
              </button>
            )}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => pickCover(e.target.files?.[0])} />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <input value={d.title} onChange={(e) => set({ title: e.target.value })} maxLength={80} placeholder="Project name" className={field} />
            </div>
            <div className="sm:col-span-2">
              <input value={d.tagline} onChange={(e) => set({ tagline: e.target.value })} maxLength={140} placeholder="One-line pitch — what is it, who is it for?" className={field} />
            </div>
            <div className="sm:col-span-2">
              <textarea value={d.description} onChange={(e) => set({ description: e.target.value })} maxLength={4000} rows={5}
                placeholder="The story: the problem, what you built, how it works, what's next…"
                className={`${field} h-auto py-3 resize-y min-h-[120px]`} />
            </div>
            <select value={d.category} onChange={(e) => set({ category: e.target.value as ShowcaseCategory })} className={field}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label.replace(/s$/, "")}</option>)}
            </select>
            <input value={d.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="Tags: react, ml, iot (up to 6)" className={field} />
            <input value={d.live} onChange={(e) => set({ live: e.target.value })} placeholder="Live link (optional)" className={field} />
            <input value={d.repo} onChange={(e) => set({ repo: e.target.value })} placeholder="GitHub / code link (optional)" className={field} />
            <div className="sm:col-span-2">
              <input value={d.team} onChange={(e) => set({ team: e.target.value })} maxLength={200} placeholder="Team (optional) — e.g. Priya, Rahul, Sneha" className={field} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={onClose} className="td-btn-ghost h-11 px-5 rounded-full text-sm font-semibold">Cancel</button>
            <button onClick={submit} disabled={busy || uploading} className="td-btn-primary h-11 px-6 rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              <Send className="w-4 h-4" /> {busy ? "Sending…" : editing ? "Save & resubmit" : "Submit for review"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
