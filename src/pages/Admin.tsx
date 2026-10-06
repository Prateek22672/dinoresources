import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import SearchBox, { type SearchItem } from "@/components/ui/SearchBox";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminSubjects from "@/components/admin/AdminSubjects";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminAudit from "@/components/admin/AdminAudit";
import AdminTickets from "@/components/admin/AdminTickets";
import AdminTeam from "@/components/admin/AdminTeam";
import AdminSecurity from "@/components/admin/AdminSecurity";
import AdminAiHealth from "@/components/admin/AdminAiHealth";
import AdminAccessAudit from "@/components/admin/AdminAccessAudit";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminSharing from "@/components/admin/AdminSharing";
import AdminDatabase from "@/components/admin/AdminDatabase";
import AdminFeatures from "@/components/admin/AdminFeatures";
import AdminCharges from "@/components/admin/AdminCharges";
import AdminOffers from "@/components/admin/AdminOffers";
import AdminNotices from "@/components/admin/AdminNotices";
import AdminSocial from "@/components/admin/AdminSocial";
import AdminPolls from "@/components/admin/AdminPolls";
import { BarChart3, Users, BookOpen, CreditCard, ScrollText, Shield, LifeBuoy, UsersRound, Lock, ShieldAlert, Ticket, UserX, Database, LayoutGrid, ChevronLeft, ChevronRight, Receipt, Bell, Bot, Sparkles, Percent } from "lucide-react";

type Tab = "analytics" | "users" | "subjects" | "coupons" | "offers" | "charges" | "notices" | "features" | "tickets" | "team" | "payments" | "audit" | "security" | "access" | "sharing" | "database" | "aihealth" | "social" | "polls";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users & Access", icon: Users },
  { id: "subjects", label: "Subjects & Pricing", icon: BookOpen },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "offers", label: "Bundle Offers", icon: Percent },
  { id: "charges", label: "Charges & GST", icon: Receipt },
  { id: "notices", label: "Notices", icon: Bell },
  { id: "features", label: "Cards & Features", icon: LayoutGrid },
  { id: "tickets", label: "Support Tickets", icon: LifeBuoy },
  { id: "team", label: "Team", icon: UsersRound },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "audit", label: "Audit Log", icon: ScrollText },
  { id: "aihealth", label: "AI Health", icon: Bot },
  { id: "social", label: "Launch Graphics", icon: Sparkles },
  { id: "polls", label: "Polls", icon: BarChart3 },
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
  offers: "bundle buy 3 4 multi subject discount tier offer percent",
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
  social: "poster instagram whatsapp story marketing png export launch graphics rex",
  polls: "poll survey feedback vote question students opinion",
};

export default function Admin() {
  // The open section lives in the URL, not component state — a refresh (or a
  // deep-linked/bookmarked section) used to dump you back on Analytics and
  // cost you the scroll position in a 17-tab strip. `replace` so Back still
  // leaves the console instead of walking every tab you touched.
  const [params, setParams] = useSearchParams();
  const urlTab = params.get("tab");
  const tab: Tab = tabs.some((t) => t.id === urlTab) ? (urlTab as Tab) : "analytics";
  const setTab = (id: Tab) => {
    const next = new URLSearchParams(params);
    // Analytics is the default, so it stays out of the URL — /admin is clean.
    if (id === "analytics") next.delete("tab"); else next.set("tab", id);
    setParams(next, { replace: true });
  };
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const matches = q
    ? tabs.filter((t) => t.label.toLowerCase().includes(q) || (TAB_KEYWORDS[t.id] ?? "").includes(q))
    : [];
  const jumpTo = (id: Tab) => { setTab(id); setSearch(""); };
  const asItem = (t: (typeof tabs)[number]): SearchItem => ({
    id: t.id, label: t.label, icon: t.icon,
    meta: tab === t.id ? <span className="td-accent-text">current</span> : undefined,
    onSelect: () => jumpTo(t.id),
  });

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
      <SearchBox
        className="mb-4 max-w-md"
        value={search}
        onChange={setSearch}
        placeholder="Search admin sections… (e.g. refunds, storage, coupons)"
        items={matches.map(asItem)}
        idleItems={tabs.map(asItem)}
        idleTitle="All sections"
        maxItems={8}
        emptyText="No section matches"
      />

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
      {tab === "offers" && <AdminOffers />}
      {tab === "charges" && <AdminCharges />}
      {tab === "notices" && <AdminNotices />}
      {tab === "features" && <AdminFeatures />}
      {tab === "aihealth" && <AdminAiHealth />}
      {tab === "social" && <AdminSocial />}
            {tab === "polls" && <AdminPolls />}
      {tab === "security" && <AdminSecurity />}
      {tab === "access" && <AdminAccessAudit />}
      {tab === "sharing" && <AdminSharing />}
      {tab === "database" && <AdminDatabase />}
      {tab === "payments" && <AdminPayments />}
      {tab === "audit" && <AdminAudit />}
    </AppShell>
  );
}
