import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl, OrderRow, OrderItemRow } from "@/integrations/supabase/revamp";
import { formatPaise } from "@/lib/money";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import { Receipt, BookOpen, Package, CheckCircle2, XCircle, Clock, RotateCcw, IndianRupee } from "lucide-react";

interface OrderWithItems extends OrderRow { items: OrderItemRow[] }

const statusMeta: Record<string, { label: string; icon: any; cls: string }> = {
  paid:     { label: "Success",  icon: CheckCircle2, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  created:  { label: "Pending",  icon: Clock,        cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  failed:   { label: "Failed",   icon: XCircle,      cls: "text-red-400 bg-red-500/10 border-red-500/20" },
  refunded: { label: "Refunded", icon: RotateCcw,    cls: "text-zinc-400 bg-white/5 border-white/10" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Purchases() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: orderRows } = await tbl("orders")
      .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const ords = (orderRows ?? []) as OrderRow[];
    if (ords.length === 0) { setOrders([]); setLoading(false); return; }

    const { data: itemRows } = await tbl("order_items")
      .select("*").in("order_id", ords.map((o) => o.id));
    const items = (itemRows ?? []) as OrderItemRow[];

    setOrders(ords.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.amount_paise, 0);

  return (
    <AppShell>
      <PageHero
        eyebrow="Billing"
        eyebrowIcon={Receipt}
        title="Purchase History"
        subtitle="Every order, payment and unlock — in one clear record."
        stats={[
          { label: "Total spent", value: formatPaise(totalSpent), icon: IndianRupee },
          { label: "Orders", value: paidOrders.length, icon: Package },
        ]}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl td-surface animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center td-surface rounded-[32px] td-in">
          <Receipt className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No purchases yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const meta = statusMeta[o.status] ?? statusMeta.created;
            return (
              <div key={o.id} className="td-surface rounded-2xl p-5 td-in">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-white font-semibold">{fmtDate(o.created_at)}</p>
                    <p className="text-zinc-600 text-xs mt-0.5 font-mono">
                      {o.razorpay_payment_id ?? o.razorpay_order_id ?? o.id.slice(0, 18)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg">{formatPaise(o.amount_paise)}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.cls}`}>
                      <meta.icon className="w-3 h-3" /> {meta.label}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {o.items.map((i) => (
                    <span key={i.id} className="td-surface-2 rounded-full px-3 py-1.5 text-xs text-zinc-300 flex items-center gap-1.5">
                      {i.item_type === "combo"
                        ? <Package className="w-3 h-3 td-accent-text" />
                        : <BookOpen className="w-3 h-3 text-zinc-400" />}
                      {i.label ?? (i.item_type === "combo" ? "Year combo" : "Subject")}
                      <span className="text-zinc-500">· {formatPaise(i.price_paise)}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
