import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminSubjects from "@/components/admin/AdminSubjects";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminAudit from "@/components/admin/AdminAudit";
import AdminTickets from "@/components/admin/AdminTickets";
import AdminTeam from "@/components/admin/AdminTeam";
import AdminSecurity from "@/components/admin/AdminSecurity";
import AdminAccessAudit from "@/components/admin/AdminAccessAudit";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminSharing from "@/components/admin/AdminSharing";
import AdminDatabase from "@/components/admin/AdminDatabase";
import AdminFeatures from "@/components/admin/AdminFeatures";
import AdminCharges from "@/components/admin/AdminCharges";
import { BarChart3, Users, BookOpen, CreditCard, ScrollText, Shield, LifeBuoy, UsersRound, Lock, ShieldAlert, Ticket, UserX, Database, LayoutGrid, ChevronLeft, ChevronRight, Receipt } from "lucide-react";

type Tab = "analytics" | "users" | "subjects" | "coupons" | "charges" | "features" | "tickets" | "team" | "payments" | "audit" | "security" | "access" | "sharing" | "database";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users & Access", icon: Users },
  { id: "subjects", label: "Subjects & Pricing", icon: BookOpen },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "charges", label: "Charges & GST", icon: Receipt },
  { id: "features", label: "Cards & Features", icon: LayoutGrid },
  { id: "tickets", label: "Support Tickets", icon: LifeBuoy },
  { id: "team", label: "Team", icon: UsersRound },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "audit", label: "Audit Log", icon: ScrollText },
  { id: "security", label: "Security", icon: Lock },
  { id: "access", label: "Access Audit", icon: ShieldAlert },
  { id: "sharing", label: "Account Sharing", icon: UserX },
  { id: "database", label: "Database", icon: Database },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("analytics");
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const updateArrows = () => {
    const el = stripRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = stripRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  // keep the selected tab in view (e.g. after navigating from a deep tab)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [tab]);

  const nudge = (dir: number) => stripRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  return (
    <AppShell>
      <div className="flex items-center gap-2.5 mb-6">
        <Shield className="w-6 h-6 td-accent-text shrink-0" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Admin Console</h1>
      </div>

      {/* Scrollable tab strip with left/right controls + edge fades */}
      <div className="relative mb-8">
        {/* left fade + arrow */}
        <div className={`td-edge-l pointer-events-none absolute left-0 top-0 bottom-1 w-12 z-10 transition-opacity duration-200 ${canL ? "opacity-100" : "opacity-0"}`} />
        <button
          type="button" aria-label="Scroll tabs left" onClick={() => nudge(-1)}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full td-glass border border-white/10 flex items-center justify-center text-zinc-200 hover:text-white transition-all ${canL ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </button>

        <div ref={stripRef} className="flex gap-1.5 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden pb-1 px-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              ref={tab === t.id ? activeRef : undefined}
              onClick={() => setTab(t.id)}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-[13px] sm:text-sm font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors shrink-0 ${
                tab === t.id ? "bg-white text-black" : "td-btn-ghost"
              }`}
            >
              <t.icon className="w-3.5 h-3.5 shrink-0" /> {t.label}
            </button>
          ))}
        </div>

        {/* right fade + arrow */}
        <div className={`td-edge-r pointer-events-none absolute right-0 top-0 bottom-1 w-12 z-10 transition-opacity duration-200 ${canR ? "opacity-100" : "opacity-0"}`} />
        <button
          type="button" aria-label="Scroll tabs right" onClick={() => nudge(1)}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full td-glass border border-white/10 flex items-center justify-center text-zinc-200 hover:text-white transition-all ${canR ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>

      {tab === "analytics" && <AdminAnalytics />}
      {tab === "users" && <AdminUsers />}
      {tab === "subjects" && <AdminSubjects />}
      {tab === "tickets" && <AdminTickets />}
      {tab === "team" && <AdminTeam />}
      {tab === "coupons" && <AdminCoupons />}
      {tab === "charges" && <AdminCharges />}
      {tab === "features" && <AdminFeatures />}
      {tab === "security" && <AdminSecurity />}
      {tab === "access" && <AdminAccessAudit />}
      {tab === "sharing" && <AdminSharing />}
      {tab === "database" && <AdminDatabase />}
      {tab === "payments" && <AdminPayments />}
      {tab === "audit" && <AdminAudit />}
    </AppShell>
  );
}
