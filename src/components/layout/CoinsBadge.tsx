import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Coins } from "lucide-react";

/** Header coin balance — shows only when the referral program is Live.
 *  Refreshes on the `td:coins-changed` event (e.g. after earning/spending). */
export default function CoinsBadge() {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [coins, setCoins] = useState(0);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: prof }, { data: s }] = await Promise.all([
      (supabase.from("profiles") as any).select("coins").eq("id", user.id).maybeSingle(),
      (supabase.from("app_settings") as any).select("referral_active").maybeSingle(),
    ]);
    setActive(!!s?.referral_active);
    setCoins(prof?.coins ?? 0);
  };

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("td:coins-changed", h);
    return () => window.removeEventListener("td:coins-changed", h);
  }, []);

  if (!active) return null;

  return (
    <button
      onClick={() => navigate("/invite")}
      className="td-btn-ghost h-9 pl-2.5 pr-3 rounded-full flex items-center gap-1.5 text-[13px] font-bold"
      aria-label={`${coins} coins`}
      title="Invite & earn coins"
    >
      <Coins className="w-4 h-4 td-accent-text" />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{coins}</span>
    </button>
  );
}
