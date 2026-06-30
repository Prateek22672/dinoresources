import { useEffect, useState, useCallback } from "react";
import { tbl, TeamMemberRow } from "@/integrations/supabase/revamp";
import { toast } from "sonner";
import { Plus, Save, Trash2, Users, ArrowUp, ArrowDown } from "lucide-react";

const blankDraft = { name: "", role: "", bio: "", image_url: "", link_url: "" };

export default function AdminTeam() {
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ ...blankDraft });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await tbl("team_members").select("*").order("order_index", { ascending: true });
    setMembers((data ?? []) as TeamMemberRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!draft.name.trim() || !draft.role.trim()) { toast.error("Name and role are required"); return; }
    const { error } = await tbl("team_members").insert({
      name: draft.name.trim(), role: draft.role.trim(),
      bio: draft.bio.trim() || null, image_url: draft.image_url.trim() || null,
      link_url: draft.link_url.trim() || null, order_index: members.length,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Member added"); setDraft({ ...blankDraft }); load();
  };

  const save = async (m: TeamMemberRow) => {
    const { error } = await tbl("team_members").update({
      name: m.name, role: m.role, bio: m.bio, image_url: m.image_url, link_url: m.link_url, active: m.active,
    }).eq("id", m.id);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const remove = async (m: TeamMemberRow) => {
    if (!confirm(`Remove ${m.name}?`)) return;
    const { error } = await tbl("team_members").delete().eq("id", m.id);
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= members.length) return;
    const a = members[idx], b = members[j];
    await Promise.all([
      tbl("team_members").update({ order_index: b.order_index }).eq("id", a.id),
      tbl("team_members").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
    load();
  };

  const field = (idx: number, key: keyof TeamMemberRow, value: any) =>
    setMembers((prev) => prev.map((m, i) => i === idx ? { ...m, [key]: value } : m));

  if (loading) return <div className="h-64 rounded-3xl td-surface animate-pulse" />;

  return (
    <div className="space-y-8">
      {/* Add member */}
      <section className="td-surface rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 td-accent-text" /> Add team member</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name"
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600" />
          <input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Role (e.g. Founder, Developer)"
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600" />
          <input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="Photo URL (optional)"
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600" />
          <input value={draft.link_url} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} placeholder="Link — portfolio / LinkedIn (optional)"
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600" />
          <textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="Short bio (optional)" rows={2}
            className="sm:col-span-2 td-surface-2 rounded-xl px-3 py-2 text-sm text-white outline-none resize-y placeholder:text-zinc-600" />
        </div>
        <button onClick={add} className="td-btn-primary px-4 py-2 text-sm mt-3">Add member</button>
      </section>

      {/* Members */}
      <section>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-zinc-400" /> Team ({members.length})</h3>
        {members.length === 0 ? (
          <p className="text-zinc-600 text-sm">No members yet.</p>
        ) : (
          <div className="space-y-3">
            {members.map((m, idx) => (
              <div key={m.id} className="td-surface rounded-2xl p-4">
                <div className="flex gap-2 flex-wrap items-center">
                  <input value={m.name} onChange={(e) => field(idx, "name", e.target.value)}
                    className="td-surface-2 rounded-lg px-3 h-9 text-sm text-white outline-none flex-1 min-w-[140px]" placeholder="Name" />
                  <input value={m.role} onChange={(e) => field(idx, "role", e.target.value)}
                    className="td-surface-2 rounded-lg px-3 h-9 text-sm text-white outline-none flex-1 min-w-[140px]" placeholder="Role" />
                  <label className="flex items-center gap-1 text-xs text-zinc-400">
                    <input type="checkbox" checked={m.active} onChange={(e) => field(idx, "active", e.target.checked)} /> Active
                  </label>
                  <div className="flex gap-1">
                    <button onClick={() => move(idx, -1)} className="td-btn-ghost w-9 h-9 flex items-center justify-center" title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => move(idx, 1)} className="td-btn-ghost w-9 h-9 flex items-center justify-center" title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button onClick={() => save(m)} className="td-btn-ghost w-9 h-9 flex items-center justify-center" title="Save"><Save className="w-4 h-4" /></button>
                    <button onClick={() => remove(m)} className="w-9 h-9 rounded-full hover:bg-red-500/20 flex items-center justify-center" title="Remove"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  <input value={m.image_url ?? ""} onChange={(e) => field(idx, "image_url", e.target.value)}
                    className="td-surface-2 rounded-lg px-3 h-9 text-xs text-zinc-300 outline-none" placeholder="Photo URL" />
                  <input value={m.link_url ?? ""} onChange={(e) => field(idx, "link_url", e.target.value)}
                    className="td-surface-2 rounded-lg px-3 h-9 text-xs text-zinc-300 outline-none" placeholder="Link URL" />
                  <textarea value={m.bio ?? ""} onChange={(e) => field(idx, "bio", e.target.value)} rows={2}
                    className="sm:col-span-2 td-surface-2 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none resize-y" placeholder="Bio" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
