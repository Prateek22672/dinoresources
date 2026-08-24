import { useEffect, useState } from "react";
import { tbl } from "@/integrations/supabase/revamp";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { useOnboardingSlot } from "@/lib/onboarding";

interface WhatsNewCfg {
  active: boolean;
  title: string;
  body: string;
  emoji: string;
  ctaLabel: string;
  ctaUrl: string;
  version: number;
}

const SEEN_KEY = "td:whatsnew-seen"; // stores the last version the user dismissed

/**
 * Admin-controlled welcome / "What's new" popup. Shows once per version
 * (bumping the version in admin re-shows it to everyone). Docks bottom-right —
 * the slot the old report FAB used to sit in.
 */
export default function WhatsNew() {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<WhatsNewCfg | null>(null);
  const [ready, setReady] = useState(false);
  // Queued behind the tour and the theme picker.
  const show = useOnboardingSlot("whatsnew", ready);

  useEffect(() => {
    let alive = true;
    tbl("app_settings")
      .select("whats_new_active, whats_new_title, whats_new_body, whats_new_emoji, whats_new_cta_label, whats_new_cta_url, whats_new_version")
      .maybeSingle()
      .then(({ data }: any) => {
        if (!alive || !data || !data.whats_new_active || !data.whats_new_title) return;
        const c: WhatsNewCfg = {
          active: data.whats_new_active,
          title: data.whats_new_title,
          body: data.whats_new_body ?? "",
          emoji: data.whats_new_emoji || "✨",
          ctaLabel: data.whats_new_cta_label ?? "",
          ctaUrl: data.whats_new_cta_url ?? "",
          version: data.whats_new_version ?? 1,
        };
        let seen = 0;
        try { seen = parseInt(localStorage.getItem(SEEN_KEY) || "0", 10) || 0; } catch { /* ignore */ }
        if (seen >= c.version) return; // already dismissed this version
        setCfg(c);
        // small delay so it slides in after the page settles
        setTimeout(() => alive && setReady(true), 900);
      });
    return () => { alive = false; };
  }, []);

  const dismiss = () => {
    setReady(false);
    if (cfg) { try { localStorage.setItem(SEEN_KEY, String(cfg.version)); } catch { /* ignore */ } }
  };

  const onCta = () => {
    if (!cfg) return;
    dismiss();
    if (cfg.ctaUrl.startsWith("http")) window.open(cfg.ctaUrl, "_blank");
    else if (cfg.ctaUrl) navigate(cfg.ctaUrl);
  };

  if (!cfg) return null;

  return (
    <div
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      className={`fixed right-4 z-[90] w-[min(340px,calc(100vw-2rem))] transition-all duration-500 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      <div className="td-surface rounded-[22px] p-4 shadow-2xl relative overflow-hidden">
        {/* accent blob */}
        <div aria-hidden className="absolute -top-10 -right-8 w-32 h-28 opacity-40 pointer-events-none"
          style={{ background: "rgb(var(--td-accent-rgb) / 0.25)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(6px)" }} />

        <button onClick={dismiss} className="absolute top-3 right-3 w-7 h-7 rounded-full td-surface-2 flex items-center justify-center text-zinc-400 hover:text-white z-10" aria-label="Dismiss">
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="relative z-[1]">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center text-lg shrink-0">{cfg.emoji}</span>
            <span className="td-accent-text text-[11px] font-bold tracking-[0.18em] uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> What's new
            </span>
          </div>
          <p className="text-white font-bold leading-snug pr-6">{cfg.title}</p>
          {cfg.body && <p className="text-zinc-400 text-[13px] leading-relaxed mt-1.5">{cfg.body}</p>}

          <div className="flex items-center gap-2 mt-3.5">
            {cfg.ctaLabel && cfg.ctaUrl && (
              <button onClick={onCta} className="td-btn-primary rounded-full h-9 px-4 text-[13px] font-semibold flex items-center gap-1.5">
                {cfg.ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={dismiss} className="td-btn-ghost rounded-full h-9 px-4 text-[13px] font-semibold">Got it</button>
          </div>
          <button onClick={() => { dismiss(); navigate("/whats-new"); }} className="text-[11px] text-zinc-500 hover:text-zinc-300 mt-2.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> See everything TeamDino can do
          </button>
        </div>
      </div>
    </div>
  );
}
