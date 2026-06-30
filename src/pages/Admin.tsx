import { useState } from "react";
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
import { BarChart3, Users, BookOpen, CreditCard, ScrollText, Shield, LifeBuoy, UsersRound, Lock, ShieldAlert, Ticket, UserX, Database, LayoutGrid } from "lucide-react";

type Tab = "analytics" | "users" | "subjects" | "coupons" | "features" | "tickets" | "team" | "payments" | "audit" | "security" | "access" | "sharing" | "database";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users & Access", icon: Users },
  { id: "subjects", label: "Subjects & Pricing", icon: BookOpen },
  { id: "coupons", label: "Coupons", icon: Ticket },
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

  return (
    <AppShell>
      <div className="flex items-center gap-2.5 mb-6">
        <Shield className="w-6 h-6 td-accent-text" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Admin Console</h1>
      </div>

      <div className="flex gap-1.5 mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-white text-black" : "td-btn-ghost"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "analytics" && <AdminAnalytics />}
      {tab === "users" && <AdminUsers />}
      {tab === "subjects" && <AdminSubjects />}
      {tab === "tickets" && <AdminTickets />}
      {tab === "team" && <AdminTeam />}
      {tab === "coupons" && <AdminCoupons />}
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
