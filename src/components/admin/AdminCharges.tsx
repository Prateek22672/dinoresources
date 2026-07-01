import { useEffect, useState, useCallback } from "react";
import { tbl } from "@/integrations/supabase/revamp";
import { toast } from "sonner";
import { Plus, Save, Trash2, Receipt, Lock, Heart } from "lucide-react";

interface ChargeRow {
  id: string; label: string; description: string | null;
  kind: "percent" | "fixed"; amount: number;
  mandatory: boolean; default_selected: boolean; active: boolean; order_index: number;
}

const blank = {
  label: "", description: "", kind: "fixed" as "percent" | "fixed",
  amount: "10", mandatory: false, default_selected: true,
};

export default function AdminCharges() {
  const [rows, setRows] = useState<ChargeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ ...blank });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await tbl("cart_charges").select("*").order("order_index", { ascending: true });
    setRows((data ?? []) as ChargeRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // percent → whole number; fixed → rupees converted to paise
  const toStored = (kind: "percent" | "fixed", v: string) =>
    kind === "percent" ? Math.max(0, Math.round(parseFloat(v) || 0)) : Math.round((parseFloat(v) || 0) * 100);

  const add = async () => {
    if (!draft.label.trim()) { toast.error("Label required"); return; }
    const { error } = await tbl("cart_charges").insert({
      label: draft.label.trim(),
      description: draft.description.trim() || null,
      kind: draft.kind,
      amount: toStored(draft.kind, draft.amount),
      mandatory: draft.mandatory,
      default_selected: draft.default_selected,
      active: true,
      order_index: rows.length,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Charge added"); setDraft({ ...blank }); load();
  };

  const save = async (c: ChargeRow) => {
    const { error } = await tbl("cart_charges").update({
      label: c.label, description: c.description, kind: c.kind, amount: c.amount,
      mandatory: c.mandatory, default_selected: c.default_selected, active: c.active, order_index: c.order_index,
    }).eq("id", c.id);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const del = async (c: ChargeRow) => {
    if (!confirm(`Delete "${c.label}"?`)) return;
    const { error } = await tbl("cart_charges").delete().eq("id", c.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const field = (idx: number, key: keyof ChargeRow, value: any) =>
    setRows((p) => p.map((r, i) => i === idx ? { ...r, [key]: value } : r));

  if (loading) return <div className="h-64 rounded-3xl td-surface animate-pulse" />;

  return (
    <div className="space-y-8 max-w-3xl">
      <p className="text-zinc-500 text-sm -mt-2">
        Line items added at checkout. <span className="text-zinc-300">Mandatory</span> charges (e.g. GST) are always
        applied and can't be deselected; optional ones (e.g. a donation) get a checkbox the student can toggle.
        Percentages apply to the discounted subtotal; amounts are recomputed server-side.
      </p>

      {/* Create */}
      <section className="td-surface rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 td-accent-text" /> Add charge</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="Label (e.g. GST or Support the platform)"
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600" />
          <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Short description (optional)"
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600" />
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as any })}
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none">
            <option value="fixed">₹ Fixed amount</option>
            <option value="percent">% of subtotal</option>
          </select>
          <div className="flex items-center td-surface-2 rounded-xl px-3 h-10">
            <span className="text-zinc-500 text-sm mr-1">{draft.kind === "percent" ? "%" : "₹"}</span>
            <input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              className="flex-1 bg-transparent text-sm text-white outline-none" placeholder="Value" />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300 td-surface-2 rounded-xl px-3 h-10">
            <input type="checkbox" checked={draft.mandatory} onChange={(e) => setDraft({ ...draft, mandatory: e.target.checked })} />
            Mandatory (can't be deselected)
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300 td-surface-2 rounded-xl px-3 h-10">
            <input type="checkbox" checked={draft.default_selected} disabled={draft.mandatory}
              onChange={(e) => setDraft({ ...draft, default_selected: e.target.checked })} />
            Pre-checked (optional charges only)
          </label>
        </div>
        <button onClick={add} className="td-btn-primary px-4 py-2 text-sm mt-3">Add charge</button>
      </section>

      {/* List */}
      <section>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-zinc-400" /> Charges ({rows.length})</h3>
        {rows.length === 0 ? <p className="text-zinc-600 text-sm">No charges yet. Add GST or a support option above.</p> : (
          <div className="space-y-2">
            {rows.map((c, idx) => (
              <div key={c.id} className="td-surface rounded-2xl p-4 flex flex-wrap items-center gap-2">
                <span className="w-7 h-7 rounded-lg td-surface-2 flex items-center justify-center shrink-0" title={c.mandatory ? "Mandatory" : "Optional"}>
                  {c.mandatory ? <Lock className="w-3.5 h-3.5 td-accent-text" /> : <Heart className="w-3.5 h-3.5 text-zinc-400" />}
                </span>
                <input value={c.label} onChange={(e) => field(idx, "label", e.target.value)}
                  className="td-surface-2 rounded-lg px-3 h-9 text-sm text-white outline-none w-40" />
                <select value={c.kind} onChange={(e) => field(idx, "kind", e.target.value)}
                  className="td-surface-2 rounded-lg px-2 h-9 text-xs text-zinc-300 outline-none">
                  <option value="fixed">₹ paise</option><option value="percent">%</option>
                </select>
                <input type="number" value={c.amount} onChange={(e) => field(idx, "amount", parseInt(e.target.value) || 0)}
                  className="td-surface-2 rounded-lg px-2 h-9 text-xs text-white outline-none w-24" title={c.kind === "fixed" ? "Amount in paise (100 = ₹1)" : "Percent"} />
                <label className="flex items-center gap-1 text-xs text-zinc-400">
                  <input type="checkbox" checked={c.mandatory} onChange={(e) => field(idx, "mandatory", e.target.checked)} /> Mandatory
                </label>
                <label className="flex items-center gap-1 text-xs text-zinc-400">
                  <input type="checkbox" checked={c.default_selected} onChange={(e) => field(idx, "default_selected", e.target.checked)} /> Pre-checked
                </label>
                <label className="flex items-center gap-1 text-xs text-zinc-400 ml-auto">
                  <input type="checkbox" checked={c.active} onChange={(e) => field(idx, "active", e.target.checked)} /> Active
                </label>
                <button onClick={() => save(c)} className="td-btn-ghost w-9 h-9 flex items-center justify-center" title="Save"><Save className="w-4 h-4" /></button>
                <button onClick={() => del(c)} className="w-9 h-9 rounded-full hover:bg-red-500/20 flex items-center justify-center" title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
