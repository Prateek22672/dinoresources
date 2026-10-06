import { ReactNode } from "react";

export interface HeroStat {
  label: string;
  value: ReactNode;
  icon: any;
}

interface PageHeroProps {
  eyebrow?: string;
  eyebrowIcon?: any;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  stats?: HeroStat[];
  /** Kept for callers that still pass it; the bento header has no book. */
  book?: false | { cover?: string; spine?: string; title?: string };
  className?: string;
  /** Extra content at the foot of the accent tile (e.g. the Store's search). */
  children?: ReactNode;
}

// Stat tiles cycle through the bento fills: deep accent, ink, plain surface.
const TILE = [
  { cls: "td-bento-deep", chip: "bg-white/15", label: "opacity-75", value: "" },
  { cls: "td-bento-ink td-force-dark", chip: "bg-white/10", label: "opacity-60", value: "" },
  { cls: "td-surface", chip: "td-accent-bg", label: "text-zinc-500", value: "text-white" },
];

/**
 * Page header as a bento row, matching the dashboard: the copy and actions sit
 * on an accent tile, and each stat gets a tile of its own beside it (stacked
 * under it on phones). With no stats the accent tile simply spans the row.
 * Children written for a neutral surface (text-white, td-btn-ghost…) are
 * re-inked by the .td-bento-accent rules in index.css.
 */
export default function PageHero({
  eyebrow, eyebrowIcon: EyeIcon, title, subtitle, actions, stats, className = "", children,
}: PageHeroProps) {
  const hasStats = !!stats && stats.length > 0;

  return (
    <section className={`td-in grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 mb-7 ${className}`}>
      {/* z-20 + no overflow clip on the tile itself, so a dropdown from the
          children (search suggestions) can hang over the content below; only
          the sphere is clipped, inside its own rounded layer. */}
      <div className={`td-bento td-bento-accent relative z-20 col-span-2 p-6 sm:p-8 ${hasStats ? "lg:col-span-8" : "lg:col-span-12"}`}>
        <span aria-hidden className="absolute inset-0 overflow-hidden rounded-[28px] pointer-events-none hidden sm:block">
          <span className="absolute -right-14 -bottom-20 w-[230px] h-[230px] rounded-full td-bento-sphere" />
        </span>
        <div className="relative z-10 min-w-0 sm:max-w-[78%]">
          {eyebrow && (
            <span className="td-glass inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-3">
              {EyeIcon && <EyeIcon className="w-3.5 h-3.5" />} {eyebrow}
            </span>
          )}
          <h1 className="text-[1.75rem] sm:text-4xl font-extrabold tracking-tight leading-[1.06] break-words">{title}</h1>
          {subtitle && <p className="mt-3 leading-relaxed opacity-75 text-[15px]">{subtitle}</p>}
          {actions && <div className="flex flex-wrap items-center gap-2.5 mt-6">{actions}</div>}
          {children}
        </div>
      </div>

      {hasStats && (
        <div className={`col-span-2 lg:col-span-4 grid gap-3 sm:gap-4 ${stats!.length === 1 ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-1"}`}>
          {stats!.map((s, i) => {
            const t = TILE[i % TILE.length];
            return (
              <div key={s.label} className={`td-bento ${t.cls} p-4 sm:p-5 flex flex-col justify-between gap-3 min-h-[104px]`}>
                <span className={`flex items-center gap-2 text-[11px] font-semibold ${t.label}`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${t.chip}`}><s.icon className="w-3.5 h-3.5" /></span>
                  <span className="leading-tight">{s.label}</span>
                </span>
                <span className={`text-[1.7rem] sm:text-[2rem] font-semibold leading-none tracking-tight ${t.value}`} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {s.value}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
