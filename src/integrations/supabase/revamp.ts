// Hand-written types + helpers for the revamp tables, so the app compiles
// before `supabase gen types` is re-run against the new schema.
// New code should use `tbl("...")` for revamp tables and `invokeFn(...)` for
// the new edge functions. Existing code keeps using the typed `supabase`.
import { supabase } from "./client";

export type AccessSource = "purchase" | "combo" | "admin_grant";
export type CartItemType = "subject" | "combo";
export type OrderStatus = "created" | "paid" | "failed" | "refunded";

export interface YearRow {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  combo_price_paise: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubjectRow {
  id: string;
  name: string;
  department: string;
  semester: string;
  order_index: number | null;
  year_id: string | null;
  price_paise: number;
  slug: string | null;
  description: string | null;
  active: boolean;
  created_at?: string | null;
}

export interface SubjectQARow {
  id: string;
  subject_id: string;
  unit_number: number;
  /** Topic within the unit this question belongs to (null = "General"). */
  topic_id?: string | null;
  question: string;
  answer_md: string;
  order_index: number;
  is_free: boolean;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CartItemRow {
  id: string;
  user_id: string;
  item_type: CartItemType;
  subject_id: string | null;
  year_id: string | null;
  added_at: string;
}

export interface OrderChargeDetail {
  id: string;
  label: string;
  amount_paise: number;
  kind: string;
}

export interface OrderRow {
  id: string;
  user_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount_paise: number;
  currency: string;
  status: OrderStatus;
  discount_paise: number;
  coupon_code: string | null;
  charges_paise: number;
  charges_detail: OrderChargeDetail[] | null;
  gateway: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  item_type: CartItemType;
  subject_id: string | null;
  year_id: string | null;
  price_paise: number;
  label: string | null;
}

/** Line items for one order — fetched on demand (e.g. when opening a receipt). */
export async function fetchOrderItems(orderId: string): Promise<OrderItemRow[]> {
  const { data } = await tbl("order_items").select("*").eq("order_id", orderId);
  return (data ?? []) as OrderItemRow[];
}

export interface SubjectAccessRow {
  id: string;
  user_id: string;
  subject_id: string;
  source: AccessSource;
  order_id: string | null;
  amount_paise: number | null;
  granted_by: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface YearAccessRow {
  id: string;
  user_id: string;
  year_id: string;
  source: AccessSource;
  order_id: string | null;
  amount_paise: number | null;
  granted_by: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  department: string | null;
  semester: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AuditLogRow {
  id: string;
  admin_id: string | null;
  action: string;
  target_user_id: string | null;
  target_subject_id: string | null;
  target_year_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface FeatureFlagRow { key: string; label: string; enabled: boolean; }

export interface JobItemRow {
  id: string;
  company: string;
  section: "pattern" | "material" | "questions";
  title: string;
  body_md: string | null;
  url: string | null;
  type: string | null;
  order_index: number;
  created_by?: string | null;
  created_at?: string;
}

export interface TopicRow {
  id: string;
  subject_id: string;
  unit_number: number;
  title: string;
  order_index: number;
  created_by?: string | null;
  created_at?: string;
}

export interface EditorialRow {
  id: string;
  subject_id: string;
  unit_number: number | null;
  topic_id?: string | null;
  title: string | null;
  youtube_url: string;
  created_by?: string | null;
  created_at?: string;
}

export interface TeamMemberRow {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  link_url: string | null;
  order_index: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type TicketStatus = "open" | "in_progress" | "resolved";

export interface SupportTicketRow {
  id: string;
  user_id: string;
  category: string;
  subject_id: string | null;
  message: string;
  contact: string | null;
  status: TicketStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

/** Issue types for the support form. `needsSubject` shows the subject picker. */
export const TICKET_CATEGORIES: { value: string; label: string; needsSubject: boolean }[] = [
  { value: "paid_not_granted", label: "I paid but the subject still shows as locked", needsSubject: true },
  { value: "payment_deducted_failed", label: "Money was deducted but payment failed", needsSubject: false },
  { value: "subject_not_opening", label: "A subject or unit won't open", needsSubject: true },
  { value: "materials_missing", label: "Notes / materials are missing or wrong", needsSubject: true },
  { value: "website_not_working", label: "The website isn't working", needsSubject: false },
  { value: "login_account", label: "Login or account problem", needsSubject: false },
  { value: "other", label: "Something else", needsSubject: false },
];

export const ticketCategoryLabel = (value: string) =>
  TICKET_CATEGORIES.find((c) => c.value === value)?.label ?? value;

/** Loosely-typed table accessor for revamp tables not yet in generated types. */
// deno-lint-ignore no-explicit-any
export const tbl = (name: string) => (supabase as any).from(name);

/**
 * Whether the access tables have the `expires_at` column (i.e. the purchase-validity
 * migration has been applied). Probed once and cached, so the app keeps working even
 * if the frontend ships before that migration is run.
 */
let _expiryProbe: Promise<boolean> | null = null;
export function accessSupportsExpiry(): Promise<boolean> {
  if (!_expiryProbe) {
    _expiryProbe = tbl("user_subject_access").select("expires_at").limit(1)
      // deno-lint-ignore no-explicit-any
      .then((r: any) => !r.error)
      .catch(() => false);
  }
  return _expiryProbe;
}

/** PostgREST `.or(...)` filter that excludes expired access rows, or `null` when the
 *  column doesn't exist yet (caller should then skip the filter). */
export async function notExpiredFilter(): Promise<string | null> {
  const ok = await accessSupportsExpiry();
  return ok ? `expires_at.is.null,expires_at.gt.${new Date().toISOString()}` : null;
}

// ─── Issue tracker ──────────────────────────────────────────────────────────
export type IssueCategory = "bug" | "payment" | "content" | "access" | "suggestion";
export type IssueStatus = "new" | "confirmed" | "in_progress" | "done" | "dismissed" | "duplicate";
export type IssueSeverity = "low" | "normal" | "high" | "critical";

export interface IssueRow {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: IssueSeverity;
  page_url: string | null;
  device: string | null;
  reporter_id: string | null;
  reporter_name: string | null;
  assignee_id: string | null;
  upvotes: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface IssueCommentRow {
  id: string;
  issue_id: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  created_at: string;
}

/** Invoke a revamp edge function (forwards the user's JWT automatically). */
export async function invokeFn<T = unknown>(
  name: string,
  body?: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  const res = await supabase.functions.invoke(name, { body: body ?? {} });
  if (res.error) {
    // Surface the function's JSON error message when present. On a non-2xx,
    // supabase-js leaves `data` null and reports the useless "Edge Function
    // returned a non-2xx status code" — the real reason is in the unread
    // Response hanging off the error, so read it back.
    // deno-lint-ignore no-explicit-any
    let msg: string | null = (res.data as any)?.error ?? null;
    const ctx: unknown = (res.error as { context?: unknown }).context;
    if (!msg && ctx instanceof Response) {
      try {
        const text = await ctx.clone().text();
        try { msg = JSON.parse(text)?.error ?? null; } catch { msg = text?.trim() || null; }
      } catch { /* body already consumed or unreadable */ }
    }
    return { data: (res.data as T) ?? null, error: msg ?? res.error.message ?? "Request failed" };
  }
  // deno-lint-ignore no-explicit-any
  const data = res.data as any;
  if (data?.error) return { data, error: data.error };
  return { data: data as T, error: null };
}
