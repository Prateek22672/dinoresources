import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/hooks/useCheckout";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { formatPaise } from "@/lib/money";
import AppShell from "@/components/layout/AppShell";
import SpinWheel from "@/components/cart/SpinWheel";
import {
  ShoppingCart, Trash2, BookOpen, Package, ArrowRight, RefreshCw, AlertCircle, Tag, Check, X,
  ChevronDown, Gift, BadgePercent, ShieldCheck,
} from "lucide-react";

interface Applied { code: string; discount: number; }
interface ChargeRow {
  id: string; label: string; description: string | null;
  kind: "percent" | "fixed"; amount: number; mandatory: boolean; default_selected: boolean;
}

export default function Cart() {
  const navigate = useNavigate();
  const { items, totalPaise, remove, refresh, loading } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState<Applied | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCharges, setShowCharges] = useState(false);

  const [celebrate, setCelebrate] = useState<{ code: string; amount: number } | null>(null);

  // Spin & Win
  const { isOn } = useFeatureFlags();
  const spinOn = isOn("spin");
  const [spinOpen, setSpinOpen] = useState(false);
  const [spinEligible, setSpinEligible] = useState(false);

  useEffect(() => {
    if (!spinOn) return;
    (async () => {
      const [{ data: st }, { data: last }] = await Promise.all([
        tbl("app_settings").select("spin_cooldown_days").maybeSingle(),
        tbl("user_spins").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const days = st?.spin_cooldown_days ?? 30;
      setSpinEligible(!last?.created_at || Date.now() - new Date(last.created_at).getTime() > days * 86_400_000);
    })();
  }, [spinOn]);
  const [validityDays, setValidityDays] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data }, { data: settings }] = await Promise.all([
        tbl("cart_charges").select("*").eq("active", true).order("order_index", { ascending: true }),
        tbl("app_settings").select("purchase_validity_days").maybeSingle(),
      ]);
      const rows = (data ?? []) as ChargeRow[];
      setCharges(rows);
      setSelected(new Set(rows.filter((r) => !r.mandatory && r.default_selected).map((r) => r.id)));
      setValidityDays(Number((settings as any)?.purchase_validity_days ?? 0));
    })();
  }, []);

  const toggleCharge = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const chargeAmount = (c: ChargeRow, base: number) =>
    c.kind === "percent" ? Math.round((base * c.amount) / 100) : Math.round(c.amount);

  const discount = applied?.discount ?? 0;
  const taxable = Math.max(0, totalPaise - discount);
  const appliedCharges = charges
    .filter((c) => c.mandatory || selected.has(c.id))
    .map((c) => ({ ...c, amt: chargeAmount(c, taxable) }))
    .filter((c) => c.amt > 0);
  const chargesTotal = appliedCharges.reduce((s, c) => s + c.amt, 0);
  const optionalCharges = charges.filter((c) => !c.mandatory);
  const grossTotal = taxable + chargesTotal;
  const finalTotal = grossTotal;

  const { state, error, busy, start } = useCheckout(async () => {
    await refresh();
    navigate("/library");
  });

  const quote = useCallback(async (code: string): Promise<Applied | null> => {
    const { data } = await (supabase as any).rpc("coupon_quote", { _code: code, _amount_paise: totalPaise });
    const q = Array.isArray(data) ? data[0] : data;
    if (q?.valid) { setCouponMsg(null); return { code: code.trim().toUpperCase(), discount: q.discount_paise ?? 0 }; }
    setCouponMsg(q?.message ?? "Invalid coupon");
    return null;
  }, [totalPaise]);

  const applyCoupon = async (codeArg?: string) => {
    const code = (codeArg ?? couponInput).trim();
    if (!code) return;
    setChecking(true);
    const a = await quote(code);
    setChecking(false);
    if (a) {
      setApplied(a);
      setCouponInput(a.code);
      if (a.discount > 0) setCelebrate({ code: a.code, amount: a.discount });
    }
  };

  const onSpinWin = (code: string) => {
    setSpinOpen(false);
    setSpinEligible(false);
    applyCoupon(code);
  };

  // keep discount accurate if the cart total changes after applying
  useEffect(() => {
    if (!applied) return;
    quote(applied.code).then((a) => { if (a) setApplied(a); else setApplied(null); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPaise]);

  const removeCoupon = () => { setApplied(null); setCouponInput(""); setCouponMsg(null); };

  const checkoutLabel: Record<string, string> = {
    idle: `Unlock now · ${formatPaise(finalTotal)}`,
    creating_order: "Preparing…",
    checkout_open: "Complete payment…",
    verifying: "Verifying…",
    success: "Done ✓",
    failed: `Retry · ${formatPaise(finalTotal)}`,
  };

  return (
    <AppShell>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5 mb-8">
        <ShoppingCart className="w-6 h-6 td-accent-text" /> Your Cart
      </h1>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl td-surface animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center td-surface rounded-[32px] td-in">
          <ShoppingCart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg">Your cart is empty</h3>
          <p className="text-zinc-500 text-sm mt-1 mb-6">Add subjects or a full-year pack to get started.</p>
          <button onClick={() => navigate("/store")} className="td-btn-primary px-6 py-3 text-sm inline-flex items-center gap-2">
            Explore subjects <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Line items */}
          <div className="lg:col-span-2 space-y-3 min-w-0">
            {items.map((item) => (
              <div key={item.id} className="td-surface rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 td-in">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl td-surface-2 flex items-center justify-center shrink-0">
                  {item.item_type === "combo" ? <Package className="w-5 h-5 td-accent-text" /> : <BookOpen className="w-5 h-5 text-zinc-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium leading-snug line-clamp-2 break-words">{item.label}</p>
                  <p className="text-zinc-500 text-xs capitalize mt-0.5">{item.item_type === "combo" ? "Whole year" : "Single subject"}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="text-white font-bold text-sm sm:text-base whitespace-nowrap">{formatPaise(item.price_paise)}</span>
                  <button onClick={() => remove(item.id)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full td-btn-ghost flex items-center justify-center" aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1 min-w-0">
            <div className="td-surface rounded-3xl p-5 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-white font-semibold mb-4">Order summary</h2>

              {/* Spin & Win entry */}
              {spinOn && spinEligible && !applied && (
                <button
                  type="button" onClick={() => setSpinOpen(true)}
                  className="w-full mb-4 rounded-xl p-3 flex items-center gap-3 text-left border transition-transform hover:scale-[1.01]"
                  style={{ background: "rgb(var(--td-accent-rgb) / 0.12)", borderColor: "rgb(var(--td-accent-rgb) / 0.35)" }}
                >
                  <span className="w-9 h-9 rounded-full td-accent-solid text-white flex items-center justify-center shrink-0">
                    <Gift className="w-4.5 h-4.5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-white text-sm font-bold block">Spin &amp; Win</span>
                    <span className="text-zinc-400 text-xs">Up to 50% OFF — you have 1 free spin</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>
              )}

              {/* Coupon */}
              <div className="mb-4">
                {applied ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-emerald-300 font-medium min-w-0">
                      <Check className="w-4 h-4 shrink-0" /> <span className="truncate">{applied.code} applied</span>
                    </span>
                    <button onClick={removeCoupon} className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-emerald-300 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 min-w-0">
                      <div className="flex-1 min-w-0 td-surface-2 rounded-xl flex items-center px-3 h-10">
                        <Tag className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <input
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value); setCouponMsg(null); }}
                          onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                          placeholder="Coupon code"
                          className="flex-1 min-w-0 w-full bg-transparent outline-none text-sm px-2 text-white placeholder:text-zinc-600 uppercase"
                        />
                      </div>
                      <button onClick={() => applyCoupon()} disabled={checking || !couponInput.trim()} className="td-btn-ghost px-4 text-sm shrink-0 disabled:opacity-50">
                        {checking ? "…" : "Apply"}
                      </button>
                    </div>
                    {couponMsg && <p className="text-xs text-red-300 mt-1.5">{couponMsg}</p>}
                  </>
                )}
              </div>

              {/* Optional charges (donation / support) — toggleable */}
              {optionalCharges.length > 0 && (
                <div className="space-y-2 mb-4">
                  {optionalCharges.map((c) => {
                    const on = selected.has(c.id);
                    return (
                      <button
                        key={c.id} type="button" onClick={() => toggleCharge(c.id)}
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left border transition-colors ${on ? "border-white/15 bg-white/[0.06]" : "border-white/[0.08] hover:border-white/20"}`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${on ? "td-accent-solid border-transparent text-white" : "border-white/25"}`}>
                          {on && <Check className="w-3 h-3" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-white text-sm font-medium block truncate">{c.label}</span>
                          {c.description && <span className="text-zinc-500 text-xs block truncate">{c.description}</span>}
                        </span>
                        <span className="text-sm text-zinc-300 shrink-0">{formatPaise(chargeAmount(c, taxable))}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Items ({items.length})</span>
                  <span>{formatPaise(totalPaise)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({applied?.code})</span>
                    <span>− {formatPaise(discount)}</span>
                  </div>
                )}
                {appliedCharges.length > 0 && (
                  <div>
                    <button
                      type="button" onClick={() => setShowCharges((v) => !v)}
                      className="w-full flex justify-between items-center text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 border-b border-dotted border-zinc-600">
                        Taxes &amp; other charges
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCharges ? "rotate-180" : ""}`} />
                      </span>
                      <span>+ {formatPaise(chargesTotal)}</span>
                    </button>
                    {showCharges && (
                      <div className="mt-2 td-surface-2 rounded-xl p-3 space-y-2.5 td-in">
                        {appliedCharges.map((c) => (
                          <div key={c.id} className="flex justify-between gap-3 text-xs">
                            <span className="min-w-0">
                              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                                {c.mandatory && <ShieldCheck className="w-3 h-3 text-zinc-500 shrink-0" />}
                                {c.label}{c.kind === "percent" ? ` (${c.amount}%)` : ""}
                              </span>
                              {c.description && <span className="text-zinc-500 block mt-0.5 leading-relaxed">{c.description}</span>}
                            </span>
                            <span className="text-zinc-300 shrink-0">{formatPaise(c.amt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="h-px bg-white/8 my-3" />
                <div className="flex justify-between text-white font-bold text-base">
                  <span>Total</span>
                  <span>{formatPaise(finalTotal)}</span>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mt-4">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                onClick={() => start(applied?.code, [...selected])}
                disabled={busy || state === "success"}
                className="w-full td-btn-primary py-4 mt-5 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {(state === "verifying" || state === "creating_order") && <RefreshCw className="w-4 h-4 animate-spin" />}
                {checkoutLabel[state]}
              </button>
              <p className="text-center text-[11px] text-zinc-500 mt-3">
                {validityDays > 0 ? `Access valid for ${validityDays} days` : "Lifetime access"} · Secure payment via Razorpay
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Spin & Win wheel */}
      <SpinWheel open={spinOpen} onClose={() => setSpinOpen(false)} onWin={onSpinWin} />

      {/* Coupon celebration (Swiggy-style) */}
      {celebrate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }} onClick={() => setCelebrate(null)}>
          <div className="td-surface rounded-[28px] p-8 w-full max-w-xs text-center td-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 mx-auto rounded-full td-accent-solid text-white flex items-center justify-center mb-4 rotate-[-8deg]">
              <BadgePercent className="w-7 h-7" />
            </div>
            <p className="text-zinc-400 text-[13px] font-bold tracking-widest uppercase">'{celebrate.code}' applied</p>
            <p className="text-white text-4xl font-black mt-2">{formatPaise(celebrate.amount)}</p>
            <p className="text-zinc-500 text-sm mt-1">savings with this coupon</p>
            <div className="h-px bg-white/10 my-5" />
            <button onClick={() => setCelebrate(null)} className="td-btn-primary w-full py-3 text-sm font-extrabold tracking-wide">
              YAY!
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
