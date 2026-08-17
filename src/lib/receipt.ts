import type { OrderRow, OrderItemRow } from "@/integrations/supabase/revamp";

export interface ReceiptLineItem {
  label: string;
  amount_paise: number;
}

export type ReceiptStatus = "paid" | "pending" | "failed" | "refunded" | "manual";

export interface ReceiptData {
  receiptNo: string;
  issuedAt: string;
  status: ReceiptStatus;
  /** Anonymized account reference — receipts are downloadable and can leave the system, so no name or email goes on them. */
  accountRef: string;
  items: ReceiptLineItem[];
  subtotal_paise: number;
  discount_paise: number;
  couponCode: string | null;
  charges: ReceiptLineItem[];
  total_paise: number;
  paymentMethod: string;
  transactionId: string | null;
  orderRef: string | null;
  note?: string;
}

/** Deterministic receipt number from the order id + date — same every time it's viewed, no DB column needed. */
export function receiptNumberFor(orderId: string, createdAt: string): string {
  const d = new Date(createdAt);
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const suffix = orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `TD-${stamp}-${suffix}`;
}

/** Deterministic, anonymized account reference from a user id — no name or email involved. */
export function accountRefFor(userId: string): string {
  return `ACC-${userId.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

const ORDER_STATUS_MAP: Record<string, ReceiptStatus> = {
  paid: "paid",
  created: "pending",
  failed: "failed",
  refunded: "refunded",
};

/** Builds receipt data from a real order + its line items. */
export function orderToReceipt(order: OrderRow, items: OrderItemRow[]): ReceiptData {
  const subtotal = items.reduce((sum, i) => sum + i.price_paise, 0);
  const isFree = order.razorpay_payment_id === "free";
  return {
    receiptNo: receiptNumberFor(order.id, order.created_at),
    issuedAt: order.created_at,
    status: ORDER_STATUS_MAP[order.status] ?? "pending",
    accountRef: accountRefFor(order.user_id),
    items: items.map((i) => ({
      label: i.label ?? (i.item_type === "combo" ? "Year — full access" : "Subject"),
      amount_paise: i.price_paise,
    })),
    subtotal_paise: subtotal,
    discount_paise: order.discount_paise ?? 0,
    couponCode: order.coupon_code ?? null,
    charges: (order.charges_detail ?? []).map((c) => ({ label: c.label, amount_paise: c.amount_paise })),
    total_paise: order.amount_paise,
    paymentMethod: isFree ? "Free unlock" : "Razorpay",
    transactionId: !isFree ? order.razorpay_payment_id : null,
    orderRef: !isFree ? order.razorpay_order_id : null,
  };
}

/** Ad-hoc receipt an admin can issue without a real order row — e.g. proof of purchase for a manual/offline grant. */
export function manualReceipt(input: {
  userId: string;
  description: string;
  amount_paise: number;
  note?: string;
}): ReceiptData {
  const now = new Date().toISOString();
  const stamp = now.slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return {
    receiptNo: `TD-${stamp}-M${rand}`,
    issuedAt: now,
    status: "manual",
    accountRef: accountRefFor(input.userId),
    items: [{ label: input.description, amount_paise: input.amount_paise }],
    subtotal_paise: input.amount_paise,
    discount_paise: 0,
    couponCode: null,
    charges: [],
    total_paise: input.amount_paise,
    paymentMethod: "Manually issued",
    transactionId: null,
    orderRef: null,
    note: input.note?.trim() || "Manually issued by an administrator.",
  };
}
