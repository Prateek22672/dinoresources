import { ReactNode, useState, useEffect, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Store, Library, ShoppingCart, Receipt, Shield, PenSquare, LogOut, UserCog,
  Zap, Menu, X, Briefcase, Sparkles,
} from "lucide-react";
import HelpDialog from "@/components/HelpDialog";
// DinoBot + the issue reporter ship as their own chunks — loaded on first use.
const HelpBot = lazy(() => import("@/components/HelpBot"));
const IssueReporter = lazy(() => import("@/components/issues/IssueReporter"));
import AccentPicker from "@/components/layout/AccentPicker";
import NoticesBell from "@/components/layout/NoticesBell";
import SideNav from "@/components/layout/SideNav";
import WhatsNew from "@/components/layout/WhatsNew";
import FeatureTour from "@/components/layout/FeatureTour";
import ThemePicker from "@/components/layout/ThemePicker";
import MobileNavOverlay, { MobileNavItem } from "@/components/layout/MobileNavOverlay";
import HelpNudge from "@/components/HelpNudge";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useCart } from "@/context/CartContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import dinoLogo from "@/assets/dinosaurWhite.png";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/store", label: "Subjects", icon: Store },
  { to: "/library", label: "My Library", icon: Library },
];

export default function AppShell({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isContributor } = useUserRole();
  const { count } = useCart();
  const { isOn } = useFeatureFlags();
  const [helpOpen, setHelpOpen] = useState(false);   // classic ticket form
  const [botOpen, setBotOpen] = useState(false);     // DinoBot chat (opens first)
  const [botSeed, setBotSeed] = useState<string | null>(null); // question the nudge pre-asks
  const [botLoaded, setBotLoaded] = useState(false); // chunk fetched on first open, stays mounted
  useEffect(() => { if (botOpen) setBotLoaded(true); }, [botOpen]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  // The only way in now: Instant Help's "Report a bug" dispatches this. Kept as
  // an event rather than a prop so anything can open the reporter without
  // AppShell having to hand a callback down to it.
  useEffect(() => {
    const open = () => setIssueOpen(true);
    window.addEventListener("td:open-issue-reporter", open);
    return () => window.removeEventListener("td:open-issue-reporter", open);
  }, []);
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
    { label: "What's new", icon: Sparkles, bottom: true, onClick: () => navigate("/whats-new") },
    // Same de-duplication as the rail: Instant Help already opens the bug
    // reporter from its own "Report a bug", so a second row for it here was
    // the same action under a different name.
    { label: "Instant Help", icon: Zap, bottom: true, onClick: () => setBotOpen(true) },
    { label: "Settings", icon: UserCog, bottom: true, onClick: () => navigate("/setup?edit=true") },
    { label: "Sign out", icon: LogOut, danger: true, bottom: true, onClick: signOut },
  ];

  const linkClass = (to: string, base = "") =>
    `${base} td-nav-item flex items-center gap-1.5 font-medium transition-colors ${
      isActive(to) ? "td-nav-item-on" : "text-zinc-400"
    }`;

  return (
    <div className="td-app min-h-screen td-base text-zinc-100 font-sans flex flex-col overflow-x-clip">
      {/* Top bar */}
      {!hideHeader && (
      <header className="sticky top-0 z-40 td-glass td-header-clear xl:pointer-events-none">
        <div className="container mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand hidden on xl+ — the SideNav rail owns the identity there (revert: drop xl:hidden) */}
          <Link to="/dashboard" className="flex xl:hidden items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-2xl td-nav-chip flex items-center justify-center">
              <img src={dinoLogo} alt="TeamDino" className="td-nav-logo w-5 h-5" />
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

          {/* Utilities — ordered least-used (left) → most-used (right).
              td-util-bar gives a blurred backdrop so these never visually collide
              with content scrolling beneath the transparent xl header. */}
          <div className="td-util-bar flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto xl:pointer-events-auto">
            {/* Only below xl. The SideNav rail carries Settings and Sign out as
                labelled rows, so from 1280px up these were the same two actions
                twice on one screen — as unlabelled icons, which is the worse of
                the two. They stay for lg, where the rail is not mounted yet. */}
            <button onClick={signOut} className="hidden lg:flex xl:hidden w-9 h-9 rounded-full td-btn-ghost items-center justify-center" aria-label="Sign out" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/setup?edit=true")} className="hidden lg:flex xl:hidden w-9 h-9 rounded-full td-btn-ghost items-center justify-center" aria-label="Profile" title="Profile & settings">
              <UserCog className="w-4 h-4" />
            </button>
            <AccentPicker />
            <button onClick={() => setBotOpen(true)} className="hidden lg:flex td-btn-ghost h-9 px-3 rounded-full items-center gap-1.5 text-[13px] font-medium" aria-label="Help">
              <Zap className="w-4 h-4 td-accent-text" /> Instant Help
            </button>
            <NoticesBell />
            <Link to="/cart" className="relative w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center" aria-label="Cart" title="Cart">
              <ShoppingCart className="w-4 h-4" />
              {count > 0 && (
                <span className="td-accent-badge absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center">{count}</span>
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

      {/* First-run guided tour (once per user) + admin-controlled What's-New popup */}
      <FeatureTour />
      {/* One-time appearance heads-up — the theme switch existed but lived
          behind an icon nobody opened. */}
      {!botOpen && <ThemePicker />}
      {!botOpen && <WhatsNew />}

      {/* Proactive greeting on the pages where students most often get stuck */}
      {!botOpen && !helpOpen && isOn("helpbot") && (
        <HelpNudge
          onAsk={(q) => { setBotSeed(q); setBotOpen(true); }}
          onRaiseTicket={() => setHelpOpen(true)}
        />
      )}

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      {(botOpen || botLoaded) && (
        <Suspense fallback={null}>
          <HelpBot open={botOpen} onClose={() => setBotOpen(false)} onRaiseTicket={() => setHelpOpen(true)} seed={botSeed} />
        </Suspense>
      )}
      {issueOpen && (
        <Suspense fallback={null}>
          <IssueReporter open={issueOpen} onClose={() => setIssueOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
