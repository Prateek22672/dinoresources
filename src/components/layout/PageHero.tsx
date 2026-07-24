import { ReactNode } from "react";
import FloatingBook from "@/components/brand/FloatingBook";

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
  /** Decorative floating book on the right. Pass false to hide, or customise. */
  book?: false | { cover?: string; spine?: string; title?: string };
  className?: string;
}

/**
 * Engaging page header — the landing-page vibe brought into the app:
 * soft accent blobs + a floating, cursor-drifting subject book, with the
 * stats as inline chips so they sit alongside (not fighting) the artwork.
 */
export default function PageHero({
  eyebrow, eyebrowIcon: EyeIcon, title, subtitle, actions, stats, book, className = "",
}: PageHeroProps) {
  const bk = book === false ? null : { cover: "#1E2B7A", spine: "#E0559B", title: "DBMS", ...(book ?? {}) };

  return (
    <section className={`td-hero td-in relative overflow-hidden rounded-[28px] p-6 sm:p-9 mb-7 ${className}`}>
      {/* soft accent blobs — the landing's organic energy, themed to the accent */}
      <div aria-hidden className="absolute -top-20 -left-16 w-80 h-72 opacity-[0.5] pointer-events-none"
        style={{ background: "rgb(var(--td-accent-rgb) / 0.22)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(6px)" }} />
      <div aria-hidden className="absolute -bottom-24 right-[24%] w-72 h-64 opacity-[0.4] pointer-events-none hidden sm:block"
        style={{ background: "rgb(var(--td-accent-rgb) / 0.16)", borderRadius: "48% 52% 42% 58% / 50% 58% 42% 50%", filter: "blur(8px)" }} />

      {/* floating book, peeking from the right */}
      {bk && (
        <FloatingBook
          cover={bk.cover} spine={bk.spine} title={bk.title} rot={9} float={1}
          className="absolute -right-6 -bottom-10 w-[150px] sm:w-[180px] lg:w-[210px] z-[1] hidden sm:block pointer-events-none"
        />
      )}

      <div className="relative z-10 flex flex-col gap-5">
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

        {/* stats as inline chips — sit under the copy, clear of the book */}
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-2.5 relative z-10">
            {stats.map((s) => (
              <div key={s.label} className="td-glass rounded-2xl pl-2.5 pr-4 py-2 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 td-accent-bg">
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold leading-none text-lg" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
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
