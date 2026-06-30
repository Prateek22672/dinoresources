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

export interface OrderRow {
  id: string;
  user_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount_paise: number;
  currency: string;
  status: OrderStatus;
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

export interface EditorialRow {
  id: string;
  subject_id: string;
  unit_number: number | null;
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

/** Invoke a revamp edge function (forwards the user's JWT automatically). */
export async function invokeFn<T = unknown>(
  name: string,
  body?: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  const res = await supabase.functions.invoke(name, { body: body ?? {} });
  if (res.error) {
    // Surface the function's JSON error message when present
    // deno-lint-ignore no-explicit-any
    const msg = (res.data as any)?.error ?? res.error.message ?? "Request failed";
    return { data: (res.data as T) ?? null, error: msg };
  }
  // deno-lint-ignore no-explicit-any
  const data = res.data as any;
  if (data?.error) return { data, error: data.error };
  return { data: data as T, error: null };
}
