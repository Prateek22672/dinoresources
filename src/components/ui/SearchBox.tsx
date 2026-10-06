import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Search, X, CornerDownLeft } from "lucide-react";

export interface SearchItem {
  id: string;
  label: string;
  /** small second line under the label */
  sub?: ReactNode;
  /** right-aligned note: a price, "Owned", "current"… */
  meta?: ReactNode;
  /** leading visual: an icon component, or any node (e.g. a colour disc) */
  icon?: any;
  lead?: ReactNode;
  onSelect: () => void;
}

/**
 * One search box for the whole app, with a suggestions list that behaves:
 *
 * - The list renders in a portal at fixed position, so no card, transform or
 *   overflow clip on the page can slide over it (the old Store dropdown sat
 *   under the subject cards).
 * - ↑/↓ move the highlight, Enter opens it, Esc closes the list and a second
 *   Esc clears the text. "/" focuses the box from anywhere on the page.
 * - Focusing an empty box shows `idleItems` (e.g. your subjects) under
 *   `idleTitle`, so the list is useful before typing.
 * - The typed text is highlighted inside each suggestion.
 */
export default function SearchBox({
  value, onChange, placeholder, items, idleItems = [], idleTitle = "Suggestions",
  emptyText = "Nothing matches", variant = "surface", className = "", maxItems = 7, shortcut = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  items: SearchItem[];
  idleItems?: SearchItem[];
  idleTitle?: string;
  emptyText?: string;
  /** "accent" sits on an accent tile (glass, inherits ink); "surface" on the page */
  variant?: "accent" | "surface";
  className?: string;
  maxItems?: number;
  shortcut?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const q = value.trim();
  const list = (q ? items : idleItems).slice(0, maxItems);
  const total = q ? items.length : idleItems.length;
  const show = open && (q ? true : idleItems.length > 0);

  useEffect(() => setHi(0), [q]);

  // keep the portal glued under the box while the page scrolls or resizes
  useLayoutEffect(() => {
    if (!show) return;
    const place = () => {
      const r = box.current?.getBoundingClientRect();
      if (r) setRect({ left: r.left, top: r.bottom + 8, width: r.width });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => { window.removeEventListener("scroll", place, true); window.removeEventListener("resize", place); };
  }, [show]);

  // "/" to focus, unless the student is already typing somewhere
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable=true]")) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const pick = (it: SearchItem) => { setOpen(false); input.current?.blur(); it.onSelect(); };

  const mark = (label: string) => {
    if (!q) return label;
    const i = label.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return label;
    return <>{label.slice(0, i)}<mark className="td-search-mark">{label.slice(i, i + q.length)}</mark>{label.slice(i + q.length)}</>;
  };

  const shell = variant === "accent"
    ? "td-glass rounded-full h-12 px-4"
    : "td-surface rounded-2xl h-11 px-3.5";

  return (
    <div ref={box} className={`relative ${className}`}>
      <div className={`${shell} flex items-center gap-3 transition-shadow focus-within:shadow-[0_0_0_3px_rgb(var(--td-accent-rgb)/0.25)]`}>
        <Search className={`w-4 h-4 shrink-0 ${variant === "accent" ? "opacity-60" : "text-zinc-500"}`} />
        <input
          ref={input}
          value={value}
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-activedescendant={show && list[hi] ? `${listId}-${hi}` : undefined}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, list.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
            else if (e.key === "Enter" && show && list[hi]) { e.preventDefault(); pick(list[hi]); }
            else if (e.key === "Escape") { if (show) setOpen(false); else onChange(""); }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-500"
        />
        {value ? (
          <button type="button" aria-label="Clear search" onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onChange(""); input.current?.focus(); }}
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${variant === "accent" ? "bg-black/10" : "td-surface-2 text-zinc-400"}`}>
            <X className="w-3.5 h-3.5" />
          </button>
        ) : shortcut ? (
          <kbd className={`hidden sm:flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold shrink-0 ${variant === "accent" ? "bg-black/10" : "td-surface-2 text-zinc-500"}`}>/</kbd>
        ) : null}
      </div>

      {show && rect && createPortal(
        <div
          id={listId}
          role="listbox"
          className="td-portal td-surface fixed z-[140] rounded-2xl shadow-2xl overflow-hidden td-search-pop"
          style={{ left: rect.left, top: rect.top, width: Math.max(rect.width, 280) }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500">
              {q ? (total === 0 ? "No results" : `${total} result${total === 1 ? "" : "s"}`) : idleTitle}
            </span>
            {list.length > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500">
                <kbd className="td-surface-2 rounded px-1">↑</kbd><kbd className="td-surface-2 rounded px-1">↓</kbd> move
                <kbd className="td-surface-2 rounded px-1 ml-1.5"><CornerDownLeft className="w-2.5 h-2.5 inline" /></kbd> open
              </span>
            )}
          </div>

          {list.length === 0 ? (
            <p className="px-4 pb-4 pt-1 text-zinc-500 text-sm">{emptyText} “{q}”.</p>
          ) : (
            <ul className="p-1.5 pt-0.5 max-h-[min(60vh,420px)] overflow-y-auto">
              {list.map((it, i) => (
                <li key={it.id} id={`${listId}-${i}`} role="option" aria-selected={i === hi}>
                  <button type="button" onMouseEnter={() => setHi(i)} onClick={() => pick(it)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${i === hi ? "td-search-hi" : ""}`}>
                    {it.lead ?? (it.icon && (
                      <span className="w-9 h-9 rounded-xl td-surface-2 flex items-center justify-center shrink-0"><it.icon className="w-4 h-4 text-zinc-300" /></span>
                    ))}
                    <span className="min-w-0 flex-1">
                      <span className="block text-white text-[14px] font-medium truncate">{mark(it.label)}</span>
                      {it.sub && <span className="block text-zinc-500 text-[11px] truncate">{it.sub}</span>}
                    </span>
                    {it.meta && <span className="text-zinc-400 text-xs font-semibold shrink-0">{it.meta}</span>}
                  </button>
                </li>
              ))}
              {total > list.length && (
                <li className="px-3 py-2 text-[11px] text-zinc-500">+{total - list.length} more — keep typing to narrow it down</li>
              )}
            </ul>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
