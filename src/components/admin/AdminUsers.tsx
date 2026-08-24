import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  tbl, invokeFn, ProfileRow, SubjectRow, YearRow, OrderRow, fetchOrderItems,
} from "@/integrations/supabase/revamp";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { formatPaise } from "@/lib/money";
import { orderToReceipt, manualReceipt, ReceiptData } from "@/lib/receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminRoleHolders from "@/components/admin/AdminRoleHolders";

// jsPDF pulls in html2canvas + DOMPurify internally — defer that weight until a receipt is actually opened.
const ReceiptDialog = lazy(() => import("@/components/receipt/ReceiptDialog"));
import { toast } from "sonner";
import {
  Search, User, ShieldCheck, BookOpen, Package, Plus, X, Trash2, RefreshCw, FileText, Download, FlaskConical,
} from "lucide-react";

interface AccessInfo {
  subjects: { id: string; subject_id: string; name: string; source: string }[];
  years: { id: string; year_id: string; name: string; source: string }[];
  orders: OrderRow[];
  roles: UserRole[];
}

export default function AdminUsers() {
  const { userId: myId } = useUserRole();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [access, setAccess] = useState<AccessInfo | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [years, setYears] = useState<YearRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [grantSubject, setGrantSubject] = useState("");
  const [grantYear, setGrantYear] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptEverOpened, setReceiptEverOpened] = useState(false);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDesc, setManualDesc] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualNote, setManualNote] = useState("");

  useEffect(() => {
    (async () => {
      const [s, y] = await Promise.all([
        tbl("subjects").select("id, name, slug, year_id, price_paise, active, department, semester, order_index, description").order("name"),
        tbl("years").select("*").order("order_index", { ascending: true }),
      ]);
      setSubjects((s.data ?? []) as SubjectRow[]);
      setYears((y.data ?? []) as YearRow[]);
    })();
  }, []);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    // email / username / full_name ilike, or exact id
    const { data } = await tbl("profiles")
      .select("*")
      .or(`email.ilike.%${q}%,username.ilike.%${q}%,full_name.ilike.%${q}%,id.eq.${isUuid(q) ? q : "00000000-0000-0000-0000-000000000000"}`)
      .limit(20);
    setResults((data ?? []) as ProfileRow[]);
    setSearching(false);
  }, [query]);

  const loadAccess = useCallback(async (profile: ProfileRow) => {
    setSelected(profile);
    setAccess(null);
    const [sa, ya, ord, roles] = await Promise.all([
      tbl("user_subject_access").select("id, subject_id, source").eq("user_id", profile.id).is("revoked_at", null),
      tbl("user_year_access").select("id, year_id, source").eq("user_id", profile.id).is("revoked_at", null),
      tbl("orders").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
      supabase.from("user_roles").select("role").eq("user_id", profile.id),
    ]);
    const subjMap = new Map(subjects.map((s) => [s.id, s.name]));
    const yearMap = new Map(years.map((y) => [y.id, y.name]));
    setAccess({
      subjects: (sa.data ?? []).map((r: any) => ({ ...r, name: subjMap.get(r.subject_id) ?? "Subject" })),
      years: (ya.data ?? []).map((r: any) => ({ ...r, name: yearMap.get(r.year_id) ?? "Year" })),
      orders: (ord.data ?? []) as OrderRow[],
      roles: (roles.data ?? []).map((r: any) => r.role),
    });
  }, [subjects, years]);

  const doGrant = async (kind: "subject" | "year", id: string) => {
    if (!selected || !id) return;
    setBusy(true);
    const { error } = await invokeFn("admin-grant-access", {
      target_user_id: selected.id, kind,
      subject_id: kind === "subject" ? id : undefined,
      year_id: kind === "year" ? id : undefined,
    });
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success("Access granted");
    setGrantSubject(""); setGrantYear("");
    loadAccess(selected);
  };

  const doRevoke = async (kind: "subject" | "year", id: string) => {
    if (!selected) return;
    setBusy(true);
    const { error } = await invokeFn("admin-revoke-access", {
      target_user_id: selected.id, kind,
      subject_id: kind === "subject" ? id : undefined,
      year_id: kind === "year" ? id : undefined,
    });
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success("Access revoked");
    loadAccess(selected);
  };

  /** Mark an account as a test account. Its payments stay exactly where they
   *  are — receipts, access, everything — they just stop counting as revenue. */
  const setTestAccount = async (enabled: boolean) => {
    if (!selected || busy) return;
    setBusy(true);
    // .select() matters: an update that matches no rows (RLS, wrong id) comes
    // back with NO error, so without reading the rows back a silent failure is
    // indistinguishable from success — and the optimistic state below would
    // then show a flag that was never written.
    const { data, error } = await tbl("profiles")
      .update({ is_test: enabled })
      .eq("id", selected.id)
      .select("id, is_test");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const saved = Array.isArray(data) ? data[0] : data;
    if (!saved) {
      toast.error("That didn't save — you may not have permission to change this account.");
      return;
    }
    setSelected({ ...selected, is_test: !!saved.is_test });
    toast.success(saved.is_test ? "Marked as a test account — its payments are out of analytics." : "Back in analytics.");
  };

  const setRole = async (role: UserRole, enabled: boolean) => {
    if (!selected) return;
    setBusy(true);
    if (enabled) {
      await supabase.from("user_roles").insert({ user_id: selected.id, role });
    } else {
      await supabase.from("user_roles").delete().eq("user_id", selected.id).eq("role", role);
    }
    setBusy(false);
    toast.success("Role updated");
    loadAccess(selected);
  };

  const openOrderReceipt = async (order: OrderRow) => {
    setReceiptLoadingId(order.id);
    const items = await fetchOrderItems(order.id);
    setReceiptLoadingId(null);
    setReceipt(orderToReceipt(order, items));
    setReceiptOpen(true);
    setReceiptEverOpened(true);
  };

  const generateManualReceipt = () => {
    if (!selected) return;
    const rupees = parseFloat(manualAmount);
    if (!manualDesc.trim() || !Number.isFinite(rupees) || rupees <= 0) {
      toast.error("Enter a description and a valid amount.");
      return;
    }
    setReceipt(manualReceipt({
      userId: selected.id,
      description: manualDesc.trim(),
      amount_paise: Math.round(rupees * 100),
      note: manualNote,
    }));
    setManualOpen(false);
    setReceiptOpen(true);
    setReceiptEverOpened(true);
    setManualDesc(""); setManualAmount(""); setManualNote("");
  };

  return (
    <div className="space-y-6">
      {/* Who holds a role — the question the per-user search below cannot answer */}
      <AdminRoleHolders onSelect={(p) => { setResults([p]); loadAccess(p); }} />

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-6">
      {/* Search + results */}
      <div className="space-y-3">
        <div className="td-surface rounded-2xl flex items-center px-3 h-11">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Email, username, or user ID…"
            className="flex-1 bg-transparent border-none outline-none text-sm px-3 text-white placeholder:text-zinc-600"
          />
          <button onClick={search} className="td-btn-primary px-3 py-1.5 text-xs">Search</button>
        </div>

        <div className="space-y-2">
          {searching && <div className="h-14 rounded-2xl td-surface animate-pulse" />}
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => loadAccess(p)}
              className={`w-full td-surface rounded-2xl p-3 flex items-center gap-3 text-left transition-colors ${selected?.id === p.id ? "border-white/20" : "hover:border-white/12"}`}
            >
              <div className="w-9 h-9 rounded-full td-surface-2 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{p.username ?? p.full_name ?? p.email ?? "User"}</p>
                <p className="text-zinc-600 text-xs truncate">{p.email}</p>
              </div>
            </button>
          ))}
          {!searching && results.length === 0 && query && (
            <p className="text-zinc-600 text-sm text-center py-6">No users found.</p>
          )}
        </div>
      </div>

      {/* Detail */}
      <div>
        {!selected ? (
          <div className="td-surface rounded-3xl p-12 text-center text-zinc-500">
            <User className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            Search and select a user to manage their access.
          </div>
        ) : !access ? (
          <div className="h-64 rounded-3xl td-surface animate-pulse" />
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="td-surface rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-white font-bold text-lg">{selected.full_name ?? selected.username ?? "User"}</h2>
                  <p className="text-zinc-500 text-sm">{selected.email}</p>
                  <p className="text-zinc-700 text-xs font-mono mt-1">{selected.id}</p>
                  <p className="text-zinc-600 text-xs mt-1">{selected.department ?? "—"} · Sem {selected.semester ?? "—"}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["student", "contributor", "admin"] as UserRole[]).map((r) => {
                    const has = access.roles.includes(r);
                    const isSelf = selected.id === myId && r === "admin";
                    return (
                      <button
                        key={r}
                        disabled={busy || isSelf}
                        onClick={() => setRole(r, !has)}
                        title={isSelf ? "You can't remove your own admin role" : ""}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize flex items-center gap-1 disabled:opacity-50 ${
                          has ? "bg-white text-black" : "td-btn-ghost"
                        }`}
                      >
                        {r === "admin" && <ShieldCheck className="w-3 h-3" />}
                        {r}
                      </button>
                    );
                  })}
                  <button
                    disabled={busy}
                    onClick={() => setTestAccount(!selected.is_test)}
                    title="Keep this account's payments out of the revenue figures"
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 ${
                      selected.is_test ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "td-btn-ghost"
                    }`}
                  >
                    <FlaskConical className="w-3 h-3" /> {selected.is_test ? "Test account" : "Mark as test"}
                  </button>
                  <button
                    onClick={() => setManualOpen(true)}
                    className="td-btn-ghost px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FileText className="w-3 h-3" /> Generate receipt
                  </button>
                </div>
              </div>
            </div>

            {/* Grant access */}
            <div className="td-surface rounded-3xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 td-accent-text" /> Grant access</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex gap-2">
                  <select value={grantSubject} onChange={(e) => setGrantSubject(e.target.value)}
                    className="flex-1 min-w-0 td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none">
                    <option value="">Grant a subject…</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button disabled={busy || !grantSubject} onClick={() => doGrant("subject", grantSubject)} className="td-btn-primary px-4 h-10 text-sm font-semibold shrink-0 disabled:opacity-50">Grant</button>
                </div>
                <div className="flex gap-2">
                  <select value={grantYear} onChange={(e) => setGrantYear(e.target.value)}
                    className="flex-1 min-w-0 td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none">
                    <option value="">Grant a year combo…</option>
                    {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                  <button disabled={busy || !grantYear} onClick={() => doGrant("year", grantYear)} className="td-btn-primary px-4 h-10 text-sm font-semibold shrink-0 disabled:opacity-50">Grant</button>
                </div>
              </div>
            </div>

            {/* Current access */}
            <div className="td-surface rounded-3xl p-5">
              <h3 className="text-white font-semibold mb-3">Current access</h3>
              {access.subjects.length === 0 && access.years.length === 0 ? (
                <p className="text-zinc-600 text-sm">No active access.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {access.years.map((y) => (
                    <span key={y.id} className="td-surface-2 rounded-full pl-3 pr-1.5 py-1 text-xs text-zinc-200 flex items-center gap-1.5">
                      <Package className="w-3 h-3 td-accent-text" /> {y.name}
                      <span className="text-zinc-600">({y.source})</span>
                      <button onClick={() => doRevoke("year", y.year_id)} disabled={busy} className="w-5 h-5 rounded-full hover:bg-red-500/20 flex items-center justify-center"><X className="w-3 h-3 text-red-400" /></button>
                    </span>
                  ))}
                  {access.subjects.map((s) => (
                    <span key={s.id} className="td-surface-2 rounded-full pl-3 pr-1.5 py-1 text-xs text-zinc-200 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-zinc-400" /> {s.name}
                      <span className="text-zinc-600">({s.source})</span>
                      <button onClick={() => doRevoke("subject", s.subject_id)} disabled={busy} className="w-5 h-5 rounded-full hover:bg-red-500/20 flex items-center justify-center"><X className="w-3 h-3 text-red-400" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase history */}
            <div className="td-surface rounded-3xl p-5">
              <h3 className="text-white font-semibold mb-3">Purchases ({access.orders.length})</h3>
              {access.orders.length === 0 ? (
                <p className="text-zinc-600 text-sm">No orders.</p>
              ) : (
                <div className="space-y-2">
                  {access.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-2 text-sm td-surface-2 rounded-xl px-3 py-2">
                      <span className="text-zinc-400">{new Date(o.created_at).toLocaleDateString("en-IN")}</span>
                      <span className="text-white font-medium">{formatPaise(o.amount_paise)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === "paid" ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400 bg-white/5"}`}>{o.status}</span>
                      {(o.status === "paid" || o.status === "refunded") && (
                        <button
                          onClick={() => openOrderReceipt(o)}
                          disabled={receiptLoadingId === o.id}
                          className="ml-auto w-7 h-7 rounded-full td-btn-ghost flex items-center justify-center disabled:opacity-50"
                          title="View / download receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {receiptEverOpened && (
        <Suspense fallback={null}>
          <ReceiptDialog data={receipt} open={receiptOpen} onOpenChange={setReceiptOpen} />
        </Suspense>
      )}

      {/* Ad-hoc receipt — proof of purchase for a user with no real order (e.g. manual/offline access grant) */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate a receipt</DialogTitle>
          </DialogHeader>
          <p className="text-zinc-500 text-sm -mt-2">
            For {selected?.full_name ?? selected?.username ?? selected?.email ?? "this user"}. Issued instantly, marked
            as manually generated — not tied to a real payment.
          </p>
          <div className="space-y-3 mt-1">
            <div>
              <label className="text-xs text-zinc-500 font-medium mb-1 block">Description</label>
              <input
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                placeholder="e.g. AWS — full subject access"
                className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium mb-1 block">Amount (₹)</label>
              <input
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                type="number" min="0" step="0.01"
                placeholder="350"
                className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium mb-1 block">Note (optional)</label>
              <input
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Manually issued by an administrator."
                className="w-full td-surface-2 rounded-xl px-3 h-10 text-sm text-white outline-none"
              />
            </div>
            <button onClick={generateManualReceipt} className="td-btn-primary w-full h-10 rounded-xl text-sm font-semibold">
              Generate
            </button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
