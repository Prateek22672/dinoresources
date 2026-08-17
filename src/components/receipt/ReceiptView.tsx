import { forwardRef } from "react";
import { formatPaise } from "@/lib/money";
import type { ReceiptData, ReceiptStatus } from "@/lib/receipt";
import dinoLogo from "@/assets/dinosaurBlack.png";

const STATUS_STYLE: Record<ReceiptStatus, { label: string; cls: string }> = {
  paid: { label: "PAID", cls: "bg-emerald-50 text-emerald-700" },
  pending: { label: "PENDING", cls: "bg-amber-50 text-amber-700" },
  refunded: { label: "REFUNDED", cls: "bg-zinc-100 text-zinc-600" },
  failed: { label: "FAILED", cls: "bg-red-50 text-red-600" },
  manual: { label: "ISSUED", cls: "bg-indigo-50 text-indigo-700" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * The printable receipt "paper". Colors are hardcoded (not theme tokens) —
 * a receipt reads on white regardless of the app's dark theme, and the
 * exported PDF/PNG must look identical to what's on screen.
 */
const ReceiptView = forwardRef<HTMLDivElement, { data: ReceiptData }>(({ data }, ref) => {
  const status = STATUS_STYLE[data.status];

  return (
    <div ref={ref} className="bg-white text-zinc-900 rounded-2xl overflow-hidden shadow-2xl" style={{ width: 680, maxWidth: "100%" }}>
      <div className="h-1.5" style={{ background: "var(--td-accent, #7c6cf0)" }} />
      <div className="p-8 sm:p-10">
        {/* header */}
        <div className="flex items-start justify-between mb-9 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#f4f2fc] flex items-center justify-center shrink-0">
              <img src={dinoLogo} alt="" className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-lg tracking-tight text-zinc-900">Team Dino</p>
              <p className="text-xs text-zinc-500">Digital learning resources</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-extrabold text-xl tracking-wide text-zinc-700">RECEIPT</p>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">{data.receiptNo}</p>
            <p className="text-xs text-zinc-400">{fmtDate(data.issuedAt)}</p>
          </div>
        </div>

        {/* account + status */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1.5">Account</p>
            <p className="font-bold text-[15px] text-zinc-900 font-mono tracking-wide">{data.accountRef}</p>
          </div>
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide shrink-0 ${status.cls}`}>{status.label}</span>
        </div>

        {/* line items */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-zinc-200">
              <th className="text-left text-[11px] uppercase tracking-wider text-zinc-400 font-bold pb-2.5">Description</th>
              <th className="text-right text-[11px] uppercase tracking-wider text-zinc-400 font-bold pb-2.5">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, idx) => (
              <tr key={idx} className="border-b border-zinc-100">
                <td className="py-2.5 text-sm text-zinc-800">{it.label}</td>
                <td className="py-2.5 text-sm text-zinc-800 text-right tabular-nums">{formatPaise(it.amount_paise)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* totals */}
        <div className="ml-auto mt-3" style={{ width: 260 }}>
          <TotalRow label="Subtotal" value={formatPaise(data.subtotal_paise)} />
          {data.discount_paise > 0 && (
            <TotalRow
              label={`Discount${data.couponCode ? ` (${data.couponCode})` : ""}`}
              value={`−${formatPaise(data.discount_paise)}`}
              className="text-emerald-600"
            />
          )}
          {data.charges.map((c, i) => (
            <TotalRow key={i} label={c.label} value={formatPaise(c.amount_paise)} />
          ))}
          <div className="border-t-2 border-zinc-900 mt-2 pt-2.5 flex justify-between">
            <span className="font-extrabold text-[15px] text-zinc-900">Total</span>
            <span className="font-extrabold text-[15px] text-zinc-900 tabular-nums">{formatPaise(data.total_paise)}</span>
          </div>
        </div>

        {/* payment info */}
        <div className="mt-8 p-4 bg-zinc-50 rounded-2xl grid grid-cols-2 gap-3">
          <InfoCell label="Payment method" value={data.paymentMethod} />
          <InfoCell label="Transaction ID" value={data.transactionId ?? "—"} mono />
          {data.orderRef && <InfoCell label="Order reference" value={data.orderRef} mono />}
        </div>

        {data.note && <p className="mt-4 text-xs text-zinc-500 italic">{data.note}</p>}

        <p className="mt-7 pt-4 border-t border-zinc-100 text-[11px] text-zinc-400 text-center">
          System-generated receipt — no signature required. For help with this order, reach us from Support inside the app.
        </p>
      </div>
    </div>
  );
});
ReceiptView.displayName = "ReceiptView";

function TotalRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between text-[13px] py-1 text-zinc-600 ${className}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-1">{label}</p>
      <p className={`text-[13px] font-semibold text-zinc-800 break-all ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export default ReceiptView;
