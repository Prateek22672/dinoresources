import { useEffect, useState } from "react";
import { tbl, OrderRow } from "@/integrations/supabase/revamp";
import { formatPaise } from "@/lib/money";
import { CreditCard, Filter } from "lucide-react";

type StatusFilter = "all" | "paid" | "created" | "failed" | "refunded";

const statusCls: Record<string, string> = {
  paid: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  created: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  failed: "text-red-400 bg-red-500/10 border-red-500/20",
  refunded: "text-zinc-400 bg-white/5 border-white/10",
};

export default function AdminPayments() {
  const [orders, setOrders] = useState<(OrderRow & { email?: string })[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await tbl("orders").select("*").order("created_at", { ascending: false }).limit(200);
      const ords = (data ?? []) as OrderRow[];
      // best-effort email lookup
      const ids = [...new Set(ords.map((o) => o.user_id))];
      const { data: profiles } = ids.length
        ? await tbl("profiles").select("id, email").in("id", ids)
        : { data: [] };
      const emailMap = new Map<string, string>((profiles ?? []).map((p: any) => [p.id, p.email]));
      setOrders(ords.map((o) => ({ ...o, email: emailMap.get(o.user_id) })));
      setLoading(false);
    })();
  }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-500" />
        {(["all", "paid", "created", "failed", "refunded"] as StatusFilter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === f ? "bg-white text-black" : "td-btn-ghost"}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-2xl td-surface animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center td-surface rounded-3xl text-zinc-500">
          <CreditCard className="w-8 h-8 mx-auto mb-2 text-zinc-700" /> No transactions.
        </div>
      ) : (
        <div className="td-surface rounded-2xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-3 text-xs uppercase tracking-wider text-zinc-600 font-semibold border-b border-white/5">
            <span>User</span><span>Payment / Order</span><span>Amount</span><span>Status</span>
          </div>
          {filtered.map((o) => (
            <div key={o.id} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 sm:gap-4 px-4 py-3 border-b border-white/5 last:border-0 items-center text-sm">
              <div className="min-w-0">
                <p className="text-zinc-300 truncate">{o.email ?? o.user_id.slice(0, 12)}</p>
                <p className="text-zinc-600 text-xs">{new Date(o.created_at).toLocaleString("en-IN")}</p>
              </div>
              <p className="text-zinc-500 text-xs font-mono truncate">{o.razorpay_payment_id ?? o.razorpay_order_id ?? "—"}</p>
              <span className="text-white font-semibold">{formatPaise(o.amount_paise)}</span>
              <span className={`justify-self-start sm:justify-self-auto text-xs px-2.5 py-1 rounded-full border capitalize ${statusCls[o.status] ?? statusCls.created}`}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
