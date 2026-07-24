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
import AdminNotices from "@/components/admin/AdminNotices";
import { BarChart3, Users, BookOpen, CreditCard, ScrollText, Shield, LifeBuoy, UsersRound, Lock, ShieldAlert, Ticket, UserX, Database, LayoutGrid, ChevronLeft, ChevronRight, Receipt, Bell, Search, X } from "lucide-react";

type Tab = "analytics" | "users" | "subjects" | "coupons" | "charges" | "notices" | "features" | "tickets" | "team" | "payments" | "audit" | "security" | "access" | "sharing" | "database";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users & Access", icon: Users },
  { id: "subjects", label: "Subjects & Pricing", icon: BookOpen },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "charges", label: "Charges & GST", icon: Receipt },
  { id: "notices", label: "Notices", icon: Bell },
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

// keywords help search find a section even by what it does, not just its name
const TAB_KEYWORDS: Record<string, string> = {
  analytics: "stats revenue signups users overview",
  users: "grant revoke access role admin contributor",
  subjects: "pricing price combo full year add subject",
  coupons: "discount promo code spin wheel",
  charges: "gst tax donation cart fees",
  notices: "alert message announcement send user",
  features: "flags cards toggle jobs agent enable disable",
  tickets: "support help dinobot brain complaints",
  team: "members contributors roles",
  payments: "razorpay orders transactions refunds money",
  audit: "log history actions",
  security: "screenshot devices level protection",
  access: "access audit ownership",
  sharing: "account sharing multiple devices",
  database: "storage cleanup delete space size",
};

export default function Admin() {
  const [tab, setTab] = useState<Tab>("analytics");
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

  const q = search.trim().toLowerCase();
  const matches = q
    ? tabs.filter((t) => t.label.toLowerCase().includes(q) || (TAB_KEYWORDS[t.id] ?? "").includes(q))
    : [];
  const jumpTo = (id: Tab) => { setTab(id); setSearch(""); setSearchFocus(false); };

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
      <div className="flex items-center gap-3 mb-6">
        <span className="w-11 h-11 rounded-2xl td-accent-bg flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5" />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">Admin Console</h1>
          <p className="text-zinc-500 text-sm hidden sm:block">Everything about users, content, money and security.</p>
        </div>
      </div>

      {/* Search-to-jump — find any of the 15 admin sections fast */}
      <div className="relative mb-4 max-w-md">
        <div className="td-surface rounded-2xl flex items-center px-3 h-11">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
            onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) jumpTo(matches[0].id); if (e.key === "Escape") setSearch(""); }}
            placeholder="Search admin sections… (e.g. refunds, storage, coupons)"
            className="flex-1 bg-transparent border-none outline-none text-sm px-3 text-white placeholder:text-zinc-500"
          />
          {search && (
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => setSearch("")} className="w-7 h-7 rounded-full td-surface-2 flex items-center justify-center text-zinc-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {searchFocus && q && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 td-surface rounded-2xl overflow-hidden z-30 shadow-2xl max-h-72 overflow-y-auto">
            {matches.length === 0 ? (
              <p className="px-4 py-3 text-zinc-500 text-sm">No section matches “{search}”.</p>
            ) : matches.map((t) => (
              <button key={t.id} onMouseDown={(e) => e.preventDefault()} onClick={() => jumpTo(t.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left border-b border-white/5 last:border-0">
                <span className="w-8 h-8 rounded-lg td-surface-2 flex items-center justify-center shrink-0"><t.icon className="w-4 h-4 text-zinc-300" /></span>
                <span className="text-white text-sm font-medium">{t.label}</span>
                {tab === t.id && <span className="ml-auto text-[11px] td-accent-text font-semibold">current</span>}
              </button>
            ))}
          </div>
        )}
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
      {tab === "notices" && <AdminNotices />}
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
