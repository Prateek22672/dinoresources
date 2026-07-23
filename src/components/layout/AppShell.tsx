import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Store, Library, ShoppingCart, Receipt, Shield, PenSquare, LogOut, UserCog,
  LifeBuoy, Menu, X, Briefcase,
} from "lucide-react";
import HelpDialog from "@/components/HelpDialog";
import HelpBot from "@/components/HelpBot";
import AccentPicker from "@/components/layout/AccentPicker";
import NoticesBell from "@/components/layout/NoticesBell";
import SideNav from "@/components/layout/SideNav";
import MobileNavOverlay, { MobileNavItem } from "@/components/layout/MobileNavOverlay";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useCart } from "@/context/CartContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import dinoLogo from "@/assets/dinosaurWhite.png";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/store", label: "Store", icon: Store },
  { to: "/library", label: "My Library", icon: Library },
  { to: "/purchases", label: "Purchases", icon: Receipt },
];

export default function AppShell({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isContributor } = useUserRole();
  const { count } = useCart();
  const { isOn } = useFeatureFlags();
  const [helpOpen, setHelpOpen] = useState(false);   // classic ticket form
  const [botOpen, setBotOpen] = useState(false);     // DinoBot chat (opens first)
  const [menuOpen, setMenuOpen] = useState(false);
  // Side rail collapse (persisted) — icons-only mode frees width on dense pages
  const [navMin, setNavMin] = useState(() => {
    try { return localStorage.getItem("td:nav") === "min"; } catch { return false; }
  });
  const toggleNav = () => setNavMin((v) => {
    const n = !v;
    try { localStorage.setItem("td:nav", n ? "min" : "full"); } catch { /* ignore */ }
    return n;
  });

  const signOut = async () => { await supabase.auth.signOut(); navigate("/auth"); };
  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + "/");

  const links = [
    ...navItems,
    ...(isOn("jobs") ? [{ to: "/jobs", label: "Jobs", icon: Briefcase }] : []),
    ...(isContributor ? [{ to: "/contributor", label: "Contribute", icon: PenSquare }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const mobileItems: MobileNavItem[] = [
    ...links.map((l) => ({ label: l.label, icon: l.icon, active: isActive(l.to), onClick: () => navigate(l.to) })),
    { label: "Cart", icon: ShoppingCart, active: isActive("/cart"), onClick: () => navigate("/cart") },
    { label: "Help", icon: LifeBuoy, onClick: () => setBotOpen(true) },
    { label: "Profile", icon: UserCog, onClick: () => navigate("/setup?edit=true") },
    { label: "Sign out", icon: LogOut, danger: true, onClick: signOut },
  ];

  const linkClass = (to: string, base = "") =>
    `${base} flex items-center gap-1.5 font-medium transition-colors ${
      isActive(to) ? "bg-white text-black" : "text-zinc-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <div className="td-app min-h-screen td-base text-zinc-100 font-sans flex flex-col">
      {/* Top bar */}
      {!hideHeader && (
      <header className="sticky top-0 z-40 td-glass td-header-clear xl:pointer-events-none">
        <div className="container mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand hidden on xl+ — the SideNav rail owns the identity there (revert: drop xl:hidden) */}
          <Link to="/dashboard" className="flex xl:hidden items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
              <img src={dinoLogo} alt="TeamDino" className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight hidden sm:block">TeamDino</span>
          </Link>

          {/* Desktop inline nav — hidden on xl+ where the SideNav rail is the primary nav */}
          <nav className="hidden lg:flex xl:hidden items-center gap-1">
            {links.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass(item.to, "px-3.5 py-2 rounded-full text-[13px]")}>
                <item.icon className="w-3.5 h-3.5" /> {item.label}
              </Link>
            ))}
          </nav>

          {/* Utilities — ordered least-used (left) → most-used (right) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto xl:pointer-events-auto">
            <button onClick={signOut} className="hidden lg:flex w-9 h-9 rounded-full td-btn-ghost items-center justify-center" aria-label="Sign out" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/setup?edit=true")} className="hidden lg:flex w-9 h-9 rounded-full td-btn-ghost items-center justify-center" aria-label="Profile" title="Profile & settings">
              <UserCog className="w-4 h-4" />
            </button>
            <AccentPicker />
            <button onClick={() => setBotOpen(true)} className="hidden lg:flex td-btn-ghost h-9 px-3 rounded-full items-center gap-1.5 text-[13px] font-medium" aria-label="Help">
              <LifeBuoy className="w-4 h-4" /> Help
            </button>
            <NoticesBell />
            <Link to="/cart" className="relative w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center" aria-label="Cart" title="Cart">
              <ShoppingCart className="w-4 h-4" />
              {count > 0 && (
                <span className="td-accent-solid absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{count}</span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen((o) => !o)} className="lg:hidden w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center" aria-label="Menu">
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </header>
      )}

      {/* Mobile bubble menu (landing-style) */}
      <MobileNavOverlay open={menuOpen} onClose={() => setMenuOpen(false)} items={mobileItems} />

      <div className="flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div
          className={hideHeader ? "" : "xl:grid xl:gap-6 items-start"}
          style={hideHeader ? undefined : { gridTemplateColumns: `${navMin ? "76px" : "216px"} minmax(0,1fr)` }}
        >
          {!hideHeader && <SideNav collapsed={navMin} onToggle={toggleNav} />}
          <main key={location.pathname} className="td-page min-w-0">{children}</main>
        </div>
      </div>

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <HelpBot open={botOpen} onClose={() => setBotOpen(false)} onRaiseTicket={() => setHelpOpen(true)} />
    </div>
  );
}
