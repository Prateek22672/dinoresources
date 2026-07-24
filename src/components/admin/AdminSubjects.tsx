import { useEffect, useState, useCallback } from "react";
import { tbl, SubjectRow, YearRow } from "@/integrations/supabase/revamp";
import { toast } from "sonner";
import { Save, Trash2, Plus, Package, BookOpen } from "lucide-react";

function rupeesToPaise(r: string) { const n = Math.round(parseFloat(r) * 100); return Number.isFinite(n) ? n : 0; }

export default function AdminSubjects() {
  const [years, setYears] = useState<YearRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newPrice, setNewPrice] = useState("11");

  const load = useCallback(async () => {
    setLoading(true);
    const [y, s] = await Promise.all([
      tbl("years").select("*").order("order_index", { ascending: true }),
      tbl("subjects").select("*").order("name"),
    ]);
    setYears((y.data ?? []) as YearRow[]);
    setSubjects((s.data ?? []) as SubjectRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveYear = async (y: YearRow) => {
    const { error } = await tbl("years").update({ combo_price_paise: y.combo_price_paise, active: y.active }).eq("id", y.id);
    if (error) toast.error(error.message); else toast.success(`${y.name} updated`);
  };

  const saveSubject = async (s: SubjectRow) => {
    const { error } = await tbl("subjects").update({
      price_paise: s.price_paise, year_id: s.year_id, active: s.active, name: s.name,
    }).eq("id", s.id);
    if (error) toast.error(error.message); else toast.success("Subject updated");
  };

  const deleteSubject = async (s: SubjectRow) => {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    const { error } = await tbl("subjects").delete().eq("id", s.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const addSubject = async () => {
    if (!newName.trim()) { toast.error("Name required"); return; }
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const year = years.find((y) => y.id === newYear);
    const { error } = await tbl("subjects").insert({
      name: newName.trim(), slug, year_id: newYear || null, price_paise: rupeesToPaise(newPrice),
      active: true, department: "CSE", semester: year ? String(year.order_index) : "1",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Subject added");
    setNewName(""); setNewPrice("11"); load();
  };

  if (loading) return <div className="h-64 rounded-3xl td-surface animate-pulse" />;

  return (
    <div className="space-y-8">
      {/* Years / combo pricing */}
      <section>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Package className="w-4 h-4 td-accent-text" /> Full-year pack pricing</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {years.map((y, idx) => (
            <div key={y.id} className="td-surface rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-medium">{y.name}</p>
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                  <input type="checkbox" checked={y.active} onChange={(e) => setYears((prev) => prev.map((p, i) => i === idx ? { ...p, active: e.target.checked } : p))} />
                  Active
                </label>
              </div>
              {/* price on its own row so nothing is squeezed */}
              <div className="flex items-center gap-2">
                <div className="flex-1 td-surface-2 rounded-xl flex items-center px-3 h-10">
                  <span className="text-zinc-500 text-sm shrink-0">₹</span>
                  <input
                    type="number"
                    value={y.combo_price_paise / 100}
                    onChange={(e) => setYears((prev) => prev.map((p, i) => i === idx ? { ...p, combo_price_paise: rupeesToPaise(e.target.value) } : p))}
                    className="flex-1 bg-transparent px-2 text-sm text-white outline-none min-w-0"
                  />
                </div>
                <button onClick={() => saveYear(y)} className="td-btn-primary h-10 px-4 flex items-center gap-1.5 text-sm font-semibold shrink-0"><Save className="w-4 h-4" /> Save</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add subject */}
      <section className="td-surface rounded-2xl p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 td-accent-text" /> Add subject</h3>
        <div className="flex flex-wrap gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Subject name"
            className="flex-1 min-w-[180px] td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600" />
          <select value={newYear} onChange={(e) => setNewYear(e.target.value)} className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none">
            <option value="">No year</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <div className="flex items-center td-surface-2 rounded-xl px-3 h-10"><span className="text-zinc-500 text-sm mr-1">₹</span>
            <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-16 bg-transparent text-sm text-white outline-none" /></div>
          <button onClick={addSubject} className="td-btn-primary px-4 text-sm">Add</button>
        </div>
      </section>

      {/* Subjects list */}
      <section>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-zinc-400" /> Subjects ({subjects.length})</h3>
        <div className="space-y-2">
          {subjects.map((s, idx) => (
            <div key={s.id} className="td-surface rounded-2xl p-3 flex items-center gap-2 flex-wrap">
              <input value={s.name} onChange={(e) => setSubjects((prev) => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
                className="flex-1 min-w-[160px] bg-transparent text-sm text-white outline-none font-medium" />
              <select value={s.year_id ?? ""} onChange={(e) => setSubjects((prev) => prev.map((p, i) => i === idx ? { ...p, year_id: e.target.value || null } : p))}
                className="td-surface-2 rounded-lg px-2 h-9 text-xs text-zinc-300 outline-none">
                <option value="">No year</option>
                {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <div className="flex items-center td-surface-2 rounded-lg px-2 h-9"><span className="text-zinc-500 text-xs mr-1">₹</span>
                <input type="number" value={s.price_paise / 100} onChange={(e) => setSubjects((prev) => prev.map((p, i) => i === idx ? { ...p, price_paise: rupeesToPaise(e.target.value) } : p))}
                  className="w-14 bg-transparent text-xs text-white outline-none" /></div>
              <label className="flex items-center gap-1 text-xs text-zinc-400">
                <input type="checkbox" checked={s.active} onChange={(e) => setSubjects((prev) => prev.map((p, i) => i === idx ? { ...p, active: e.target.checked } : p))} /> Active
              </label>
              <button onClick={() => saveSubject(s)} className="td-btn-ghost w-9 h-9 flex items-center justify-center" title="Save"><Save className="w-4 h-4" /></button>
              <button onClick={() => deleteSubject(s)} className="w-9 h-9 rounded-full hover:bg-red-500/20 flex items-center justify-center" title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
