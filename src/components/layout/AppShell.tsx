import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Store, Library, ShoppingCart, Receipt, Shield, PenSquare, LogOut, UserCog,
  Sun, Moon, LifeBuoy, Menu, X, Briefcase,
} from "lucide-react";
import HelpDialog from "@/components/HelpDialog";
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
  const { theme, setTheme } = useTheme();
  const { isOn } = useFeatureFlags();
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const signOut = async () => { await supabase.auth.signOut(); navigate("/auth"); };
  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + "/");

  const links = [
    ...navItems,
    ...(isOn("jobs") ? [{ to: "/jobs", label: "Jobs", icon: Briefcase }] : []),
    ...(isContributor ? [{ to: "/contributor", label: "Contribute", icon: PenSquare }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const linkClass = (to: string, base = "") =>
    `${base} flex items-center gap-1.5 font-medium transition-colors ${
      isActive(to) ? "bg-white text-black" : "text-zinc-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <div className="td-app min-h-screen td-base text-zinc-100 font-sans flex flex-col">
      {/* Top bar */}
      {!hideHeader && (
      <header className="sticky top-0 z-40 td-glass">
        <div className="container mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
              <img src={dinoLogo} alt="TeamDino" className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight hidden sm:block">TeamDino</span>
          </Link>

          {/* Desktop inline nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass(item.to, "px-3.5 py-2 rounded-full text-[13px]")}>
                <item.icon className="w-3.5 h-3.5" /> {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link to="/cart" className="relative w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center" aria-label="Cart">
              <ShoppingCart className="w-4 h-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#7c6cf0] text-white text-[10px] font-bold flex items-center justify-center">{count}</span>
              )}
            </Link>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center" aria-label="Toggle theme">
              <Sun className="w-4 h-4 hidden dark:block" /><Moon className="w-4 h-4 dark:hidden" />
            </button>

            {/* Desktop-only actions */}
            <button onClick={() => setHelpOpen(true)} className="hidden lg:flex td-btn-ghost h-9 px-3 rounded-full items-center gap-1.5 text-[13px] font-medium" aria-label="Help">
              <LifeBuoy className="w-4 h-4" /> Help
            </button>
            <button onClick={() => navigate("/setup?edit=true")} className="hidden lg:flex w-9 h-9 rounded-full td-btn-ghost items-center justify-center" aria-label="Profile">
              <UserCog className="w-4 h-4" />
            </button>
            <button onClick={signOut} className="hidden lg:flex w-9 h-9 rounded-full td-btn-ghost items-center justify-center" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen((o) => !o)} className="lg:hidden w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center" aria-label="Menu">
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-white/8 td-glass">
            <div className="container mx-auto px-3 py-3 space-y-1">
              {links.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={linkClass(item.to, "px-4 py-3 rounded-xl text-sm w-full")}>
                  <item.icon className="w-4 h-4" /> {item.label}
                </Link>
              ))}
              <div className="h-px bg-white/8 my-2" />
              <button onClick={() => { setMenuOpen(false); setHelpOpen(true); }} className="w-full flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5">
                <LifeBuoy className="w-4 h-4" /> Help & Support
              </button>
              <button onClick={() => { setMenuOpen(false); navigate("/setup?edit=true"); }} className="w-full flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5">
                <UserCog className="w-4 h-4" /> Profile
              </button>
              <button onClick={signOut} className="w-full flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </header>
      )}

      <main key={location.pathname} className="td-page flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8">{children}</main>

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
