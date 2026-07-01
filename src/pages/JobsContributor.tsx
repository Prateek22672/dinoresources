import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tbl, JobItemRow } from "@/integrations/supabase/revamp";
import AppShell from "@/components/layout/AppShell";
import { toast } from "sonner";
import { Briefcase, Plus, Trash2, ListChecks, BookOpen, HelpCircle, PenSquare } from "lucide-react";

type Sec = "pattern" | "material" | "questions";
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: "pattern", label: "Pattern", icon: ListChecks },
  { id: "material", label: "Materials", icon: BookOpen },
  { id: "questions", label: "Questions", icon: HelpCircle },
];

export default function JobsContributor() {
  const [items, setItems] = useState<JobItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState("");
  const [section, setSection] = useState<Sec>("pattern");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await tbl("job_items").select("*").order("company").order("created_at", { ascending: false });
    setItems((data ?? []) as JobItemRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!company.trim() || !title.trim()) { toast.error("Company and title required"); return; }
    if (section === "material" && !url.trim()) { toast.error("Materials need a URL"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await tbl("job_items").insert({
      company: company.trim(), section, title: title.trim(),
      body_md: body.trim() || null, url: url.trim() || null,
      type: url ? "link" : null, created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Added"); setTitle(""); setBody(""); setUrl(""); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await tbl("job_items").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Briefcase className="w-6 h-6 td-accent-text" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Jobs · Contributor</h1>
        </div>
        <Link to="/contributor" className="td-btn-ghost px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5">
          <PenSquare className="w-4 h-4" /> Subject content
        </Link>
      </div>
      <p className="text-zinc-500 text-sm mb-6 -mt-3">Separate from subject content — add placement patterns, materials and questions per company.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Add form */}
        <div className="td-surface rounded-3xl p-5 h-fit">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 td-accent-text" /> Add item</h3>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (e.g. TCS, Infosys, General)"
            className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600 mb-2" />
          <div className="flex gap-1.5 mb-2">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 ${section === s.id ? "bg-white text-black" : "td-surface-2 text-zinc-300"}`}>
                <s.icon className="w-3.5 h-3.5" /> {s.label}
              </button>
            ))}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Aptitude round pattern)"
            className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600 mb-2" />
          {section === "material" ? (
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Material URL (PDF / link)"
              className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600 mb-2" />
          ) : (
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details (markdown supported)…" rows={5}
              className="w-full td-surface-2 rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-y placeholder:text-zinc-600 mb-2" />
          )}
          <button onClick={add} className="td-btn-primary px-4 py-2 text-sm">Add</button>
        </div>

        {/* List */}
        <div>
          <h3 className="text-white font-semibold mb-3">All items ({items.length})</h3>
          {loading ? <div className="h-40 rounded-3xl td-surface animate-pulse" /> :
            items.length === 0 ? <p className="text-zinc-600 text-sm">Nothing yet.</p> : (
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="td-surface rounded-2xl p-3.5 flex items-center gap-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full td-surface-2 text-zinc-400 uppercase tracking-wider shrink-0">{it.section}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{it.title}</p>
                    <p className="text-zinc-600 text-xs truncate">{it.company}{it.url ? ` · ${it.url}` : ""}</p>
                  </div>
                  <button onClick={() => del(it.id)} className="w-8 h-8 rounded-full hover:bg-red-500/20 flex items-center justify-center shrink-0"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
