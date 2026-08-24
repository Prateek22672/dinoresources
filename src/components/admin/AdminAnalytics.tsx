import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import { formatPaise } from "@/lib/money";
import { Users, CreditCard, TrendingUp, Package, BookOpen } from "lucide-react";

interface Stats {
  totalUsers: number;
  subscribers: number;
  monthlySignups: number;
  revenueToday: number;
  revenueMonth: number;
  revenueTotal: number;
  paymentsCount: number;
  paymentsToday: number;
  paymentsMonth: number;
  discountsTotal: number;
  avgOrder: number;
  byYear: { name: string; count: number }[];
  subjectSales: number;
  comboSales: number;
  /** Payments from accounts marked as test accounts, kept out of the figures
   *  above but reported so the exclusion is visible rather than silent. */
  excludedOrders: number;
  excludedRevenue: number;
}

interface RevenueStats {
  revenue_total: number; revenue_month: number; revenue_today: number;
  payments_count: number; payments_month: number; payments_today: number;
  discounts_total: number; excluded_orders: number; excluded_revenue: number;
}

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); }
function startOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString(); }

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const monthStart = startOfMonth();
      const todayStart = startOfToday();

      const [
        usersC, signupsC, paidOrders, subjAccess, yearAccess, years, orderItems,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
        // Revenue comes from an RPC that excludes test accounts, so the rule
        // lives in one place instead of every caller remembering to filter.
        (supabase as any).rpc("admin_revenue_stats"),
        tbl("user_subject_access").select("id", { count: "exact", head: true }).is("revoked_at", null),
        tbl("user_year_access").select("year_id, revoked_at"),
        tbl("years").select("id, name").order("order_index", { ascending: true }),
        tbl("order_items").select("item_type, order_id"),
      ]);

      const rev = (Array.isArray(paidOrders.data) ? paidOrders.data[0] : paidOrders.data) as RevenueStats | undefined;
      const revenueTotal = Number(rev?.revenue_total ?? 0);
      const revenueMonth = Number(rev?.revenue_month ?? 0);
      const revenueToday = Number(rev?.revenue_today ?? 0);
      const paymentsCount = Number(rev?.payments_count ?? 0);
      const paymentsToday = Number(rev?.payments_today ?? 0);
      const paymentsMonth = Number(rev?.payments_month ?? 0);
      const discountsTotal = Number(rev?.discounts_total ?? 0);
      const excludedOrders = Number(rev?.excluded_orders ?? 0);
      const excludedRevenue = Number(rev?.excluded_revenue ?? 0);
      const avgOrder = paymentsCount ? Math.round(revenueTotal / paymentsCount) : 0;

      // Subscriptions by year (active combos)
      const ya = (yearAccess.data ?? []).filter((r: any) => !r.revoked_at);
      const yearList = (years.data ?? []) as any[];
      const byYear = yearList.map((y) => ({
        name: y.name,
        count: ya.filter((r: any) => r.year_id === y.id).length,
      }));

      const items = (orderItems.data ?? []) as any[];

      setStats({
        totalUsers: usersC.count ?? 0,
        subscribers: (subjAccess.count ?? 0) + ya.length,
        monthlySignups: signupsC.count ?? 0,
        revenueToday, revenueMonth, revenueTotal,
        paymentsCount, paymentsToday, paymentsMonth, discountsTotal, avgOrder,
        byYear,
        subjectSales: items.filter((i) => i.item_type === "subject").length,
        comboSales: items.filter((i) => i.item_type === "combo").length,
        excludedOrders, excludedRevenue,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 rounded-3xl td-surface animate-pulse" />)}</div>;
  }

  const card = (label: string, value: string, Icon: any, sub?: string) => (
    <div className="td-surface rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-zinc-500 text-sm font-medium">{label}</p>
        <span className="w-8 h-8 rounded-xl td-accent-bg flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</p>
      {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Earnings hero — accent glow + gradient headline ── */}
      <div className="td-hero rounded-[28px] p-6 sm:p-8">
        <div className="relative z-10 grid sm:grid-cols-[1.4fr_1fr_1fr] gap-6">
          <div>
            <p className="text-zinc-500 text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">Earned till date</p>
            <p className="td-grad-text text-4xl sm:text-5xl font-extrabold tracking-tight w-fit">{formatPaise(stats.revenueTotal)}</p>
            <p className="text-zinc-400 text-sm mt-2">
              across <span className="font-semibold text-white">{stats.paymentsCount}</span> payment{stats.paymentsCount === 1 ? "" : "s"}
              {stats.discountsTotal > 0 ? ` · ${formatPaise(stats.discountsTotal)} given as discounts` : ""}
            </p>
            {/* Say what was left out. A number that quietly excludes things is
                harder to trust than one that shows its own workings. */}
            {stats.excludedOrders > 0 && (
              <p className="text-zinc-600 text-xs mt-1.5">
                Excludes {stats.excludedOrders} test payment{stats.excludedOrders === 1 ? "" : "s"} ({formatPaise(stats.excludedRevenue)})
              </p>
            )}
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-6 flex flex-col justify-center">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Payments done</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.paymentsCount}</p>
            <p className="text-zinc-500 text-xs mt-1">{stats.paymentsToday} today · {stats.paymentsMonth} this month</p>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-6 flex flex-col justify-center">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Avg. order</p>
            <p className="text-2xl font-bold text-white mt-1">{formatPaise(stats.avgOrder)}</p>
            <p className="text-zinc-500 text-xs mt-1">today {formatPaise(stats.revenueToday)}</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {card("Total Users", String(stats.totalUsers), Users)}
        {card("Active Access", String(stats.subscribers), Package, "subjects + combos")}
        {card("Signups (this month)", String(stats.monthlySignups), TrendingUp)}
        {card("Revenue · Today", formatPaise(stats.revenueToday), CreditCard)}
        {card("Revenue · Month", formatPaise(stats.revenueMonth), CreditCard)}
        {card("Revenue · Total", formatPaise(stats.revenueTotal), CreditCard)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="td-surface rounded-3xl p-6">
          <h3 className="text-white font-semibold mb-4">Combo subscriptions by year</h3>
          <div className="space-y-3">
            {stats.byYear.map((y) => {
              const max = Math.max(1, ...stats.byYear.map((r) => r.count));
              return (
                <div key={y.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{y.name}</span>
                    <span className="text-zinc-500">{y.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full td-grad-bar rounded-full" style={{ width: `${(y.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="td-surface rounded-3xl p-6">
          <h3 className="text-white font-semibold mb-4">Sales mix</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="td-surface-2 rounded-2xl p-5 text-center">
              <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center mx-auto mb-2"><BookOpen className="w-4.5 h-4.5" /></span>
              <p className="text-2xl font-bold text-white">{stats.subjectSales}</p>
              <p className="text-zinc-500 text-xs mt-1">Subject purchases</p>
            </div>
            <div className="td-card-accent rounded-2xl p-5 text-center">
              <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center mx-auto mb-2"><Package className="w-4.5 h-4.5" /></span>
              <p className="text-2xl font-bold text-white">{stats.comboSales}</p>
              <p className="text-zinc-500 text-xs mt-1">Combo purchases</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
