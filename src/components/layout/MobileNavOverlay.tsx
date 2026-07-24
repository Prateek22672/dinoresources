import { useEffect } from "react";
import { X } from "lucide-react";
import dinoLogo from "@/assets/dinosaurWhite.png";

export interface MobileNavItem {
  label: string;
  icon: any;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  bottom?: boolean; // pinned to the drawer's bottom section (Settings-style)
}

/**
 * Mobile drawer — the SideNav rail, sliding in from the left.
 * Same dark rounded panel, white active pill, bottom utility section.
 */
export default function MobileNavOverlay({
  open, onClose, items,
}: { open: boolean; onClose: () => void; items: MobileNavItem[] }) {
  // lock the page while the drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const top = items.filter((i) => !i.bottom);
  const bottom = items.filter((i) => i.bottom);

  const itemBtn = (item: MobileNavItem, i: number) => (
    <button
      key={item.label}
      onClick={() => { onClose(); item.onClick(); }}
      style={{ transitionDelay: open ? `${80 + i * 30}ms` : "0ms" }}
      className={`td-nav-item w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-medium text-left
        transition-all duration-300 ${open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}
        ${item.active ? "td-nav-item-on font-semibold"
          : item.danger ? "text-red-400"
          : "text-zinc-400"}`}
    >
      <item.icon className="w-[18px] h-[18px] shrink-0" /> {item.label}
    </button>
  );

  return (
    <div className={`lg:hidden fixed inset-0 z-[80] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      {/* dim backdrop */}
      <div
        className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* rail-style drawer */}
      <aside
        className={`td-nav-panel absolute left-3 top-3 bottom-3 w-[290px] max-w-[86vw] rounded-[28px] p-4
          flex flex-col shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]
          transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]
          ${open ? "translate-x-0" : "-translate-x-[calc(100%+1.5rem)]"}`}
      >
        {/* brand + close */}
        <div className="flex items-center gap-2.5 px-2 pt-1 pb-4">
          <div className="td-nav-chip w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <img src={dinoLogo} alt="" className="td-nav-logo w-5 h-5" />
          </div>
          <span className="text-white font-bold tracking-tight text-lg flex-1">TeamDino</span>
          <button
            onClick={onClose}
            className="td-nav-item w-9 h-9 rounded-full text-zinc-400 flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* primary nav */}
        <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden">
          {top.map(itemBtn)}
        </nav>

        {/* bottom utilities */}
        {bottom.length > 0 && (
          <div className="td-nav-divider pt-3 mt-3 space-y-1">
            {bottom.map((b, i) => itemBtn(b, top.length + i))}
          </div>
        )}
      </aside>
    </div>
  );
}
