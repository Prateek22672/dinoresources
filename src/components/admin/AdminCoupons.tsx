import { useEffect, useState, useCallback } from "react";
import { tbl } from "@/integrations/supabase/revamp";
import { toast } from "sonner";
import { Plus, Save, Trash2, Ticket } from "lucide-react";

interface CouponRow {
  id: string; code: string; discount_type: "percent" | "flat"; discount_value: number;
  active: boolean; min_amount_paise: number; max_redemptions: number | null;
  times_redeemed: number; expires_at: string | null;
}

const blank = { code: "", discount_type: "percent" as "percent" | "flat", value: "10", min: "0", max: "", expires: "" };

export default function AdminCoupons() {
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ ...blank });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await tbl("coupons").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as CouponRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const valueToStored = (type: "percent" | "flat", v: string) =>
    type === "percent" ? Math.max(0, Math.min(100, Math.round(parseFloat(v) || 0))) : Math.round((parseFloat(v) || 0) * 100);

  const add = async () => {
    if (!draft.code.trim()) { toast.error("Code required"); return; }
    const { error } = await tbl("coupons").insert({
      code: draft.code.trim().toUpperCase(),
      discount_type: draft.discount_type,
      discount_value: valueToStored(draft.discount_type, draft.value),
      min_amount_paise: Math.round((parseFloat(draft.min) || 0) * 100),
      max_redemptions: draft.max ? parseInt(draft.max) : null,
      expires_at: draft.expires ? new Date(draft.expires).toISOString() : null,
      active: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Coupon created"); setDraft({ ...blank }); load();
  };

  const save = async (c: CouponRow) => {
    const { error } = await tbl("coupons").update({
      code: c.code.toUpperCase(), discount_type: c.discount_type, discount_value: c.discount_value,
      active: c.active, min_amount_paise: c.min_amount_paise, max_redemptions: c.max_redemptions,
      expires_at: c.expires_at,
    }).eq("id", c.id);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const del = async (c: CouponRow) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    const { error } = await tbl("coupons").delete().eq("id", c.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const field = (idx: number, key: keyof CouponRow, value: any) =>
    setRows((p) => p.map((r, i) => i === idx ? { ...r, [key]: value } : r));

  if (loading) return <div className="h-64 rounded-3xl td-surface animate-pulse" />;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Create */}
      <section className="td-surface rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 td-accent-text" /> Create coupon</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="CODE (e.g. WELCOME10)"
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none uppercase placeholder:text-zinc-600" />
          <select value={draft.discount_type} onChange={(e) => setDraft({ ...draft, discount_type: e.target.value as any })}
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none">
            <option value="percent">% Percentage off</option>
            <option value="flat">₹ Flat off</option>
          </select>
          <div className="flex items-center td-surface-2 rounded-xl px-3 h-10">
            <span className="text-zinc-500 text-sm mr-1">{draft.discount_type === "percent" ? "%" : "₹"}</span>
            <input type="number" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })}
              className="flex-1 bg-transparent text-sm text-white outline-none" placeholder="Value" />
          </div>
          <div className="flex items-center td-surface-2 rounded-xl px-3 h-10"><span className="text-zinc-500 text-xs mr-1">Min ₹</span>
            <input type="number" value={draft.min} onChange={(e) => setDraft({ ...draft, min: e.target.value })} className="flex-1 bg-transparent text-sm text-white outline-none" placeholder="0" /></div>
          <input type="number" value={draft.max} onChange={(e) => setDraft({ ...draft, max: e.target.value })} placeholder="Max redemptions (blank = ∞)"
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none placeholder:text-zinc-600" />
          <input type="date" value={draft.expires} onChange={(e) => setDraft({ ...draft, expires: e.target.value })}
            className="td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none" />
        </div>
        <button onClick={add} className="td-btn-primary px-4 py-2 text-sm mt-3">Create coupon</button>
      </section>

      {/* List */}
      <section>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Ticket className="w-4 h-4 text-zinc-400" /> Coupons ({rows.length})</h3>
        {rows.length === 0 ? <p className="text-zinc-600 text-sm">No coupons yet.</p> : (
          <div className="space-y-2">
            {rows.map((c, idx) => (
              <div key={c.id} className="td-surface rounded-2xl p-4 flex flex-wrap items-center gap-2">
                <input value={c.code} onChange={(e) => field(idx, "code", e.target.value.toUpperCase())}
                  className="td-surface-2 rounded-lg px-3 h-9 text-sm text-white outline-none font-mono w-32 uppercase" />
                <select value={c.discount_type} onChange={(e) => field(idx, "discount_type", e.target.value)}
                  className="td-surface-2 rounded-lg px-2 h-9 text-xs text-zinc-300 outline-none">
                  <option value="percent">%</option><option value="flat">₹ flat (paise)</option>
                </select>
                <input type="number" value={c.discount_value} onChange={(e) => field(idx, "discount_value", parseInt(e.target.value) || 0)}
                  className="td-surface-2 rounded-lg px-2 h-9 text-xs text-white outline-none w-20" />
                <span className="text-zinc-600 text-xs">used {c.times_redeemed}{c.max_redemptions ? `/${c.max_redemptions}` : ""}</span>
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
