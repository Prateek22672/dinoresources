import { useEffect, useState, lazy, Suspense } from "react";
import { tbl, invokeFn, OrderRow, fetchOrderItems } from "@/integrations/supabase/revamp";
import { formatPaise } from "@/lib/money";
import { orderToReceipt, ReceiptData } from "@/lib/receipt";
import { CreditCard, Filter, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// jsPDF pulls in html2canvas + DOMPurify internally — defer that weight until a receipt is actually opened.
const ReceiptDialog = lazy(() => import("@/components/receipt/ReceiptDialog"));

type StatusFilter = "all" | "paid" | "created" | "failed" | "refunded";
type OrderWithProfile = OrderRow & { email?: string; name?: string };

const statusCls: Record<string, string> = {
  paid: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  created: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  failed: "text-red-400 bg-red-500/10 border-red-500/20",
  refunded: "text-zinc-400 bg-white/5 border-white/10",
};

interface ReconcileOutcome {
  outcome: "reconciled" | "already_paid" | "attempted_not_captured" | "no_payment_found";
}

export default function AdminPayments() {
  const [orders, setOrders] = useState<OrderWithProfile[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptEverOpened, setReceiptEverOpened] = useState(false);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await tbl("orders").select("*").order("created_at", { ascending: false }).limit(200);
    const ords = (data ?? []) as OrderRow[];
    // best-effort profile lookup
    const ids = [...new Set(ords.map((o) => o.user_id))];
    const { data: profiles } = ids.length
      ? await tbl("profiles").select("id, email, full_name, username").in("id", ids)
      : { data: [] };
    const profileMap = new Map<string, { email?: string; name?: string }>(
      (profiles ?? []).map((p: any) => [p.id, { email: p.email, name: p.full_name ?? p.username }]),
    );
    setOrders(ords.map((o) => ({ ...o, ...profileMap.get(o.user_id) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  // A "created" order older than 15 minutes was abandoned by the checkout
  // flow one way or another — either genuinely never paid, or paid and never
  // confirmed back to us (the gap razorpay-webhook closes going forward).
  // Either way it's worth a look, so it gets flagged rather than left to
  // blend into ordinary in-progress checkouts from the last few minutes.
  const staleCreated = orders.filter((o) => o.status === "created" && Date.now() - new Date(o.created_at).getTime() > 15 * 60_000);

  const viewReceipt = async (o: OrderWithProfile) => {
    setReceiptLoadingId(o.id);
    const items = await fetchOrderItems(o.id);
    setReceiptLoadingId(null);
    setReceipt(orderToReceipt(o, items));
    setReceiptOpen(true);
    setReceiptEverOpened(true);
  };

  /** Ask Razorpay directly whether a "created" order was actually captured —
   *  for orders paid before the money ever reached our own confirmation. */
  const recheck = async (o: OrderWithProfile) => {
    setCheckingId(o.id);
    const { data, error } = await invokeFn<ReconcileOutcome>("admin-reconcile-order", { order_id: o.id });
    setCheckingId(null);
    if (error) { toast.error(error); return; }
    switch (data?.outcome) {
      case "reconciled":
        toast.success(`Found it — ${o.name ?? o.email ?? "student"} was actually charged. Access granted.`);
        load();
        break;
      case "already_paid":
        toast.info("Already marked paid — refreshing.");
        load();
        break;
      case "attempted_not_captured":
        toast.info("Razorpay shows an attempt here, but it never captured — genuinely not charged.");
        break;
      case "no_payment_found":
        toast.info("No payment attempt on Razorpay's side — the checkout was abandoned before paying.");
        break;
      default:
        toast.error("Couldn't check this order.");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-500" />
        {(["all", "paid", "created", "failed", "refunded"] as StatusFilter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === f ? "bg-white text-black" : "td-btn-ghost"}`}>
            {f}
          </button>
        ))}
      </div>

      {staleCreated.length > 0 && (
        <div className="td-card-accent rounded-2xl px-4 py-3 mb-4 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <p className="text-[13px] text-zinc-200 leading-relaxed">
            <strong className="text-white">{staleCreated.length}</strong> order{staleCreated.length === 1 ? " has" : "s have"} sat unpaid for over 15 minutes.
            If a student paid via a UPI app switch and their browser didn't survive to confirm it, this is exactly what it looks like — money moved, nothing marked paid.
            Use <strong className="text-white">Recheck</strong> on any of them below to ask Razorpay directly.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-2xl td-surface animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center td-surface rounded-3xl text-zinc-500">
          <CreditCard className="w-8 h-8 mx-auto mb-2 text-zinc-700" /> No transactions.
        </div>
      ) : (
        <div className="td-surface rounded-2xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 text-xs uppercase tracking-wider text-zinc-600 font-semibold border-b border-white/5">
            <span>User</span><span>Payment / Order</span><span>Amount</span><span>Status</span><span />
          </div>
          {filtered.map((o) => {
            const stale = o.status === "created" && Date.now() - new Date(o.created_at).getTime() > 15 * 60_000;
            return (
              <div key={o.id} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 sm:gap-4 px-4 py-3 border-b border-white/5 last:border-0 items-center text-sm">
                <div className="min-w-0">
                  <p className="text-zinc-300 truncate">{o.name ?? o.email ?? o.user_id.slice(0, 12)}</p>
                  <p className="text-zinc-600 text-xs">{new Date(o.created_at).toLocaleString("en-IN")}</p>
                </div>
                <p className="text-zinc-500 text-xs font-mono truncate">{o.razorpay_payment_id ?? o.razorpay_order_id ?? "—"}</p>
                <span className="text-white font-semibold">{formatPaise(o.amount_paise)}</span>
                <span className={`justify-self-start sm:justify-self-auto text-xs px-2.5 py-1 rounded-full border capitalize flex items-center gap-1 w-fit ${statusCls[o.status] ?? statusCls.created}`}>
                  {stale && <AlertTriangle className="w-3 h-3" />} {o.status}
                </span>
                {o.status === "paid" || o.status === "refunded" ? (
                  <button
                    onClick={() => viewReceipt(o)}
                    disabled={receiptLoadingId === o.id}
                    className="justify-self-end w-7 h-7 rounded-full td-btn-ghost flex items-center justify-center disabled:opacity-50"
                    title="View / download receipt"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                ) : o.status === "created" ? (
                  <button
                    onClick={() => recheck(o)}
                    disabled={checkingId === o.id}
                    className="justify-self-end td-btn-ghost px-2.5 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                    title="Ask Razorpay whether this was actually paid"
                  >
                    <RefreshCw className={`w-3 h-3 ${checkingId === o.id ? "animate-spin" : ""}`} /> Recheck
                  </button>
                ) : <span />}
              </div>
            );
          })}
        </div>
      )}

      {receiptEverOpened && (
        <Suspense fallback={null}>
          <ReceiptDialog data={receipt} open={receiptOpen} onOpenChange={setReceiptOpen} />
        </Suspense>
      )}
    </div>
  );
}
