import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl } from "@/integrations/supabase/revamp";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import { Gift, Copy, Check, Share2, Coins, Users, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface Cfg {
  active: boolean;
  referrerCoins: number;
  signupCoins: number;
  perRupee: number;
}

export default function Invite() {
  const [code, setCode] = useState("");
  const [coins, setCoins] = useState(0);
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: prof }, { data: s }] = await Promise.all([
        tbl("profiles").select("referral_code, coins").eq("id", user.id).maybeSingle(),
        tbl("app_settings").select("referral_active, referral_referrer_coins, referral_signup_coins, coins_per_rupee").maybeSingle(),
      ]);
      setCode((prof as any)?.referral_code ?? "");
      setCoins((prof as any)?.coins ?? 0);
      const cs = s as any;
      setCfg({
        active: !!cs?.referral_active,
        referrerCoins: cs?.referral_referrer_coins ?? 100,
        signupCoins: cs?.referral_signup_coins ?? 0,
        perRupee: Math.max(1, cs?.coins_per_rupee ?? 20),
      });
      setLoading(false);
    })();
  }, []);

  const link = `${window.location.origin}/auth?ref=${code}`;
  const inr = (c: number) => (c / (cfg?.perRupee || 20)).toFixed(0);

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); toast.success("Invite link copied"); setTimeout(() => setCopied(false), 1600); }
    catch { toast.error("Couldn't copy — long-press to copy the link"); }
  };
  const share = async () => {
    const text = `Join me on TeamDino — notes, PYQs & Study-With-AI for our exams. Sign up with my link and we both get coins: ${link}`;
    if (navigator.share) { try { await navigator.share({ title: "TeamDino", text, url: link }); } catch { /* cancelled */ } }
    else copy();
  };

  return (
    <AppShell>
      <PageHero
        eyebrow="Invite & earn"
        eyebrowIcon={Gift}
        title="Bring a friend, earn coins."
        subtitle="Share your link. When a friend joins and unlocks their first subject, you both get coins to spend on your next unlock."
        book={{ cover: "#D9A441", spine: "#B4832E", title: "₹" }}
      />

      {loading ? (
        <div className="h-40 rounded-[24px] td-surface animate-pulse max-w-2xl" />
      ) : !cfg?.active ? (
        <div className="td-surface rounded-[24px] p-8 text-center max-w-2xl">
          <Gift className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-white font-semibold">Invites are opening soon</p>
          <p className="text-zinc-500 text-sm mt-1">Check back — you'll be able to earn coins for bringing friends.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_300px] gap-5 max-w-4xl">
          {/* Share */}
          <div className="td-surface rounded-[24px] p-5 sm:p-6">
            <p className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Your invite link</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0 td-surface-2 rounded-xl px-4 h-12 flex items-center">
                <span className="text-white text-sm truncate">{link}</span>
              </div>
              <button onClick={copy} className="td-btn-ghost h-12 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 shrink-0">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={share} className="td-btn-primary h-12 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shrink-0">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {/* How it works */}
            <div className="grid sm:grid-cols-3 gap-3 mt-6">
              {[
                { icon: Share2, t: "Share your link", d: "Send it to classmates on WhatsApp." },
                { icon: ShoppingBag, t: "They unlock a subject", d: `They also get ${cfg.signupCoins > 0 ? `${cfg.signupCoins} coins (≈₹${inr(cfg.signupCoins)})` : "started"}.` },
                { icon: Coins, t: "You earn coins", d: `+${cfg.referrerCoins} coins (≈₹${inr(cfg.referrerCoins)}) each.` },
              ].map((s) => (
                <div key={s.t} className="td-surface-2 rounded-2xl p-4">
                  <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center mb-2.5"><s.icon className="w-4 h-4" /></span>
                  <p className="text-white text-sm font-semibold">{s.t}</p>
                  <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Balance */}
          <div className="td-hero rounded-[24px] p-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div aria-hidden className="absolute -top-10 -right-8 w-36 h-32 opacity-45 pointer-events-none"
              style={{ background: "rgb(var(--td-accent-rgb) / 0.25)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(6px)" }} />
            <div className="relative z-10">
              <span className="w-12 h-12 rounded-2xl td-accent-bg flex items-center justify-center mx-auto mb-3"><Coins className="w-6 h-6" /></span>
              <p className="text-zinc-400 text-xs">Your coins</p>
              <p className="text-white text-4xl font-extrabold mt-1" style={{ fontVariantNumeric: "tabular-nums" }}>{coins}</p>
              <p className="text-zinc-500 text-xs mt-1">≈ ₹{inr(coins)} off your next unlock</p>
              <p className="text-zinc-600 text-[11px] mt-4">{cfg.perRupee} coins = ₹1 · use them at checkout</p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
