import { useLocation, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import dinoLogo from "@/assets/dinosaurWhite.png";
import {
  LayoutDashboard, Store, Library, Receipt, Briefcase, PenSquare, Shield, Settings, Info,
} from "lucide-react";

/**
 * Global primary navigation on xl+ (dark rounded rail, reference layout).
 * Below xl the top header's links / bubble menu take over — one nav per breakpoint.
 */
export default function SideNav() {
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

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="hidden xl:flex flex-col bg-[#131316] border border-white/8 rounded-[28px] p-3.5 sticky top-24 min-h-[78vh]">
      <div className="flex items-center gap-2.5 px-2.5 pt-1.5 pb-4">
        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
          <img src={dinoLogo} alt="" className="w-5 h-5" />
        </div>
        <span className="text-white font-bold tracking-tight">TeamDino</span>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <button key={item.label} onClick={() => navigate(item.to)}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors text-left ${
              isActive(item.to) ? "bg-white text-black" : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}>
            <item.icon className="w-4 h-4 shrink-0" /> {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-3 border-t border-white/8 space-y-1">
        <button onClick={() => navigate("/setup?edit=true")} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 text-left">
          <Settings className="w-4 h-4" /> Settings
        </button>
        <button onClick={() => navigate("/about")} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 text-left">
          <Info className="w-4 h-4" /> About us
        </button>
      </div>
    </aside>
  );
}
