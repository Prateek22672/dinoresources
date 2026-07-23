import { useLocation, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import dinoLogo from "@/assets/dinosaurWhite.png";
import {
  LayoutDashboard, Store, Library, Receipt, Briefcase, PenSquare, Shield, Settings, Info,
  ChevronsLeft, ChevronsRight,
} from "lucide-react";

/**
 * Global primary navigation on xl+ (dark rounded rail, reference layout).
 * Collapsible to icons-only (persisted) — handy on dense pages like subjects.
 * Below xl the top header's links / bubble menu take over.
 */
export default function SideNav({
  collapsed = false, onToggle,
}: { collapsed?: boolean; onToggle?: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin, isContributor } = useUserRole();
  const { isOn } = useFeatureFlags();

  const items = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Store", icon: Store, to: "/store" },
    { label: "My Library", icon: Library, to: "/library" },
    { label: "Purchases", icon: Receipt, to: "/purchases" },
    ...(isOn("jobs") ? [{ label: "Jobs", icon: Briefcase, to: "/jobs" }] : []),
    ...(isContributor ? [{ label: "Contribute", icon: PenSquare, to: "/contributor" }] : []),
    ...(isAdmin ? [{ label: "Admin", icon: Shield, to: "/admin" }] : []),
  ];

  const bottom = [
    { label: "Settings", icon: Settings, onClick: () => navigate("/setup?edit=true") },
    { label: "About us", icon: Info, onClick: () => navigate("/about") },
  ];

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  const itemCls = (active: boolean) =>
    `w-full flex items-center ${collapsed ? "justify-center px-0" : "px-3.5"} gap-2.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors text-left ${
      active ? "bg-white text-black" : "text-zinc-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <aside className={`hidden xl:flex flex-col bg-[#131316] border border-white/8 rounded-[28px] ${collapsed ? "p-2.5" : "p-3.5"} sticky top-24 min-h-[78vh] transition-all`}>
      {/* Brand + collapse toggle */}
      <div className={`flex items-center ${collapsed ? "flex-col gap-2 pb-3" : "gap-2.5 px-2.5 pt-1.5 pb-4"}`}>
        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
          <img src={dinoLogo} alt="" className="w-5 h-5" />
        </div>
        {!collapsed && <span className="text-white font-bold tracking-tight flex-1">TeamDino</span>}
        <button
          onClick={onToggle}
          className="w-7 h-7 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 flex items-center justify-center shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="space-y-1">
        {items.map((item) => (
          <button key={item.label} onClick={() => navigate(item.to)}
            className={itemCls(isActive(item.to))} title={collapsed ? item.label : undefined}>
            <item.icon className="w-4 h-4 shrink-0" /> {!collapsed && item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-3 border-t border-white/8 space-y-1">
        {bottom.map((b) => (
          <button key={b.label} onClick={b.onClick} className={itemCls(false)} title={collapsed ? b.label : undefined}>
            <b.icon className="w-4 h-4 shrink-0" /> {!collapsed && b.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
