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
  className?: string;
}

/** Shared premium page header: depth (radial accent glow + grain) with optional
 *  action buttons and a glass stat panel. Accent follows --td-accent. */
export default function PageHero({ eyebrow, eyebrowIcon: EyeIcon, title, subtitle, actions, stats, className = "" }: PageHeroProps) {
  return (
    <section className={`td-hero td-in rounded-[28px] p-6 sm:p-9 mb-7 ${className}`}>
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10 lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          {eyebrow && (
            <span className="td-glass inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-zinc-300 mb-3">
              {EyeIcon && <EyeIcon className="w-3.5 h-3.5" style={{ color: "var(--td-accent-soft)" }} />} {eyebrow}
            </span>
          )}
          <h1 className="text-[1.9rem] sm:text-4xl font-extrabold tracking-tight leading-[1.06] text-white">{title}</h1>
          {subtitle && <p className="text-zinc-400 mt-3 leading-relaxed">{subtitle}</p>}
          {actions && <div className="flex flex-wrap items-center gap-2.5 mt-6">{actions}</div>}
        </div>

        {stats && stats.length > 0 && (
          <div className="td-glass rounded-3xl p-4 sm:p-5 grid grid-cols-2 lg:flex lg:flex-col gap-4 lg:gap-3.5 shrink-0 lg:min-w-[210px]">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 td-accent-bg">
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold leading-none">{s.value}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
