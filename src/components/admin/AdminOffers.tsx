import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2, Percent, Layers } from "lucide-react";
import { tbl } from "@/integrations/supabase/revamp";
import type { BundleTier } from "@/hooks/useBundleOffer";

/**
 * Bundle offers — "buy 3 subjects save X%, buy 4+ save Y%".
 *
 * One master switch, a switch for whether coupons stack on top, and the
 * tiers. The highest tier a cart qualifies for applies; full-year packs never
 * count toward the subject total. The cart and create-cart-order both price
 * through bundle_quote(), so what's set here is exactly what's charged.
 */
export default function AdminOffers() {
  const [enabled, setEnabled] = useState(false);
  const [stacks, setStacks] = useState(true);
  const [tiers, setTiers] = useState<BundleTier[]>([]);
  const [draft, setDraft] = useState({ min: "5", pct: "20" });
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, t] = await Promise.all([
      tbl("app_settings").select("bundle_offers_enabled, bundle_stacks_with_coupons").maybeSingle(),
      tbl("bundle_tiers").select("id, min_subjects, percent, active").order("min_subjects", { ascending: true }),
    ]);
    if (s.error || t.error) { setMissing(true); setLoading(false); return; }
    setMissing(false);
    setEnabled(!!(s.data as any)?.bundle_offers_enabled);
    setStacks((s.data as any)?.bundle_stacks_with_coupons !== false);
    setTiers((t.data ?? []) as BundleTier[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const setSetting = async (patch: Record<string, boolean>) => {
    const { error } = await tbl("app_settings").update(patch).eq("id", true);
    if (error) { toast.error(error.message); return false; }
    return true;
  };

  const toggleEnabled = async () => {
    if (await setSetting({ bundle_offers_enabled: !enabled })) {
      setEnabled(!enabled);
      toast.success(!enabled ? "Bundle offers are live in the cart" : "Bundle offers turned off");
    }
  };
  const toggleStacks = async () => {
    if (await setSetting({ bundle_stacks_with_coupons: !stacks })) setStacks(!stacks);
  };

  const valid = (min: number, pct: number) => {
    if (!Number.isInteger(min) || min < 2 || min > 50) { toast.error("Subjects must be a whole number from 2 to 50"); return false; }
    if (!Number.isInteger(pct) || pct < 1 || pct > 90) { toast.error("Discount must be a whole percent from 1 to 90"); return false; }
    return true;
  };

  const add = async () => {
    const min = parseInt(draft.min), pct = parseInt(draft.pct);
    if (!valid(min, pct)) return;
    if (tiers.some((t) => t.min_subjects === min)) { toast.error(`There's already a tier for ${min} subjects`); return; }
    const { error } = await tbl("bundle_tiers").insert({ min_subjects: min, percent: pct, active: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Tier added"); load();
  };

  const save = async (t: BundleTier) => {
    if (!valid(t.min_subjects, t.percent)) return;
    const { error } = await tbl("bundle_tiers")
      .update({ min_subjects: t.min_subjects, percent: t.percent, active: t.active, updated_at: new Date().toISOString() })
      .eq("id", t.id);
    if (error) toast.error(error.message); else { toast.success("Saved"); load(); }
  };

  const del = async (t: BundleTier) => {
    if (!confirm(`Delete the ${t.min_subjects}-subject tier?`)) return;
    const { error } = await tbl("bundle_tiers").delete().eq("id", t.id);
    if (error) toast.error(error.message); else load();
  };

  const field = (i: number, patch: Partial<BundleTier>) => setTiers((p) => p.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  // Tiers should climb: a bigger bundle never earns a smaller discount.
  const active = tiers.filter((t) => t.active);
  const nonClimbing = active.some((t, i) => i > 0 && t.percent <= active[i - 1].percent);

  if (loading) return <div className="h-64 rounded-3xl td-surface animate-pulse" />;
  if (missing) {
    return (
      <div className="td-surface rounded-3xl p-6 max-w-3xl">
        <p className="text-amber-400 text-sm">Run the <code>20261006130000_bundle_offers.sql</code> migration in the SQL editor first — the offer tables don't exist yet.</p>
      </div>
    );
  }

  const switchCls = (on: boolean) => `relative w-12 h-7 rounded-full transition-colors shrink-0 ${on ? "td-accent-solid" : "bg-white/15"}`;
  const knob = (on: boolean) => <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"}`} />;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Master switches */}
      <section className="td-surface rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold flex items-center gap-2"><Layers className="w-4 h-4 td-accent-text" /> Bundle offers</p>
            <p className="text-zinc-500 text-xs mt-1">When on, the cart and Store show the tiers and the discount is applied at checkout.</p>
          </div>
          <button onClick={toggleEnabled} className={switchCls(enabled)} aria-pressed={enabled} aria-label="Bundle offers on/off">{knob(enabled)}</button>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-4">
          <div>
            <p className="text-white text-sm font-medium">Coupons stack on top</p>
            <p className="text-zinc-500 text-xs mt-1">
              {stacks ? "A coupon applies to what's left after the bundle discount." : "While a bundle tier applies, coupons are ignored."}
            </p>
          </div>
          <button onClick={toggleStacks} className={switchCls(stacks)} aria-pressed={stacks} aria-label="Coupons stack">{knob(stacks)}</button>
        </div>
      </section>

      {/* Tiers */}
      <section className="td-surface rounded-3xl p-5">
        <h3 className="text-white font-semibold mb-1 flex items-center gap-2"><Percent className="w-4 h-4 td-accent-text" /> Tiers</h3>
        <p className="text-zinc-500 text-xs mb-4">
          The highest tier a cart reaches applies — e.g. 3 → 10% and 4 → 15% means 4, 5, 6… subjects all get 15%. Only individual subjects count; full-year packs don't.
        </p>
        <div className="space-y-2">
          {tiers.map((t, i) => (
            <div key={t.id} className="td-surface-2 rounded-2xl p-3 flex flex-wrap items-center gap-2">
              <span className="text-zinc-400 text-sm">Buy</span>
              <input type="number" min={2} max={50} value={t.min_subjects} onChange={(e) => field(i, { min_subjects: parseInt(e.target.value) || 0 })}
                className="td-surface rounded-lg px-2 h-9 w-16 text-sm text-white outline-none text-center" />
              <span className="text-zinc-400 text-sm">{i === tiers.length - 1 ? "or more" : "+"} subjects, save</span>
              <input type="number" min={1} max={90} value={t.percent} onChange={(e) => field(i, { percent: parseInt(e.target.value) || 0 })}
                className="td-surface rounded-lg px-2 h-9 w-16 text-sm text-white outline-none text-center" />
              <span className="text-zinc-400 text-sm">%</span>
              <label className="flex items-center gap-1.5 text-xs text-zinc-400 ml-auto">
                <input type="checkbox" checked={t.active} onChange={(e) => field(i, { active: e.target.checked })} /> Active
              </label>
              <button onClick={() => save(t)} className="td-btn-ghost w-9 h-9 flex items-center justify-center" title="Save"><Save className="w-4 h-4" /></button>
              <button onClick={() => del(t)} className="w-9 h-9 rounded-full hover:bg-red-500/20 flex items-center justify-center" title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></button>
            </div>
          ))}
          {tiers.length === 0 && <p className="text-zinc-600 text-sm">No tiers yet — add one below.</p>}
        </div>
        {nonClimbing && (
          <p className="text-amber-400 text-xs mt-3">Heads up: a bigger bundle has the same or a smaller discount than a smaller one. Students will expect it to climb.</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4 border-t border-white/8 pt-4">
          <span className="text-zinc-400 text-sm">New tier: buy</span>
          <input type="number" value={draft.min} onChange={(e) => setDraft({ ...draft, min: e.target.value })}
            className="td-surface-2 rounded-lg px-2 h-9 w-16 text-sm text-white outline-none text-center" />
          <span className="text-zinc-400 text-sm">subjects, save</span>
          <input type="number" value={draft.pct} onChange={(e) => setDraft({ ...draft, pct: e.target.value })}
            className="td-surface-2 rounded-lg px-2 h-9 w-16 text-sm text-white outline-none text-center" />
          <span className="text-zinc-400 text-sm">%</span>
          <button onClick={add} className="td-btn-primary px-4 h-9 rounded-full text-sm flex items-center gap-1.5 ml-auto"><Plus className="w-4 h-4" /> Add tier</button>
        </div>
      </section>
    </div>
  );
}
