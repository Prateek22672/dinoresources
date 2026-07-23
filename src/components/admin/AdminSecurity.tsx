import { useEffect, useState } from "react";
import { tbl } from "@/integrations/supabase/revamp";
import { toast } from "sonner";
import { Shield, Check, Code2, Lock, Ban, CalendarClock, Smartphone, Save } from "lucide-react";

const LEVELS = [
  { value: 0, title: "Off — Developer mode", desc: "Nothing is blocked. DevTools, right-click, copy/paste all allowed.", icon: Code2 },
  { value: 1, title: "Level 1 — No DevTools", desc: "Blocks F12 / Ctrl+Shift+I·J·C / Ctrl+U and right-click.", icon: Shield },
  { value: 2, title: "Level 2 — No copy/paste", desc: "Level 1 + blocks copy, cut, paste and text selection.", icon: Lock },
  { value: 3, title: "Level 3 — Strict", desc: "Level 2 + blocks printing & image dragging, and deters screenshots (PrintScreen wipes the clipboard; content blurs when the window loses focus).", icon: Ban },
];

export default function AdminSecurity() {
  const [level, setLevel] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [validityDays, setValidityDays] = useState("0");
  const [singleDevice, setSingleDevice] = useState(false);

  useEffect(() => {
    tbl("app_settings").select("security_level, purchase_validity_days, single_device").maybeSingle().then(({ data }: any) => {
      setLevel(data?.security_level ?? 1);
      setValidityDays(String(data?.purchase_validity_days ?? 0));
      setSingleDevice(!!data?.single_device);
    });
  }, []);

  const choose = async (value: number) => {
    setSaving(true);
    const { error } = await tbl("app_settings").update({ security_level: value, updated_at: new Date().toISOString() }).eq("id", true);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setLevel(value);
    try { localStorage.setItem("td-sec", String(value)); } catch { /* ignore */ }
    toast.success("Security level updated");
  };

  const saveValidity = async () => {
    const days = Math.max(0, Math.round(parseInt(validityDays) || 0));
    const { error } = await tbl("app_settings").update({ purchase_validity_days: days, updated_at: new Date().toISOString() }).eq("id", true);
    if (error) { toast.error(error.message); return; }
    setValidityDays(String(days));
    toast.success(days > 0 ? `New purchases valid for ${days} days` : "New purchases are now lifetime");
  };

  const toggleSingleDevice = async (next: boolean) => {
    const { error } = await tbl("app_settings").update({ single_device: next, updated_at: new Date().toISOString() }).eq("id", true);
    if (error) { toast.error(error.message); return; }
    setSingleDevice(next);
    toast.success(next ? "Single-device login enforced" : "Single-device login disabled");
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2.5 mb-2">
        <Shield className="w-5 h-5 td-accent-text" />
        <h2 className="text-lg font-bold text-white">Site protection</h2>
      </div>
      <p className="text-zinc-500 text-sm mb-6">
        Controls DevTools / copy-paste protection for every visitor in real time. Turn it
        <span className="text-white font-medium"> Off</span> while developing.
      </p>

      {level === null ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl td-surface animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {LEVELS.map((l) => {
            const active = level === l.value;
            return (
              <button key={l.value} disabled={saving} onClick={() => choose(l.value)}
                className={`w-full td-surface td-card-click rounded-2xl p-4 flex items-center gap-4 text-left ${active ? "ring-2 ring-[#7c6cf0]" : ""}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${active ? "bg-white" : "td-surface-2"}`}>
                  <l.icon className={`w-5 h-5 ${active ? "text-black" : "text-zinc-300"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold">{l.title}</p>
                  <p className="text-zinc-500 text-sm mt-0.5">{l.desc}</p>
                </div>
                {active && <Check className="w-5 h-5 td-accent-text shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Purchase validity */}
      <div className="mt-10">
        <div className="flex items-center gap-2.5 mb-2">
          <CalendarClock className="w-5 h-5 td-accent-text" />
          <h2 className="text-lg font-bold text-white">Purchase validity</h2>
        </div>
        <p className="text-zinc-500 text-sm mb-4">
          How long a new purchase stays unlocked. Set <span className="text-white font-medium">0</span> for lifetime.
          Applies to <span className="text-white font-medium">new purchases only</span> — existing access is unchanged.
        </p>
        <div className="td-surface rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center td-surface-2 rounded-xl px-3 h-11">
            <input type="number" min={0} value={validityDays} onChange={(e) => setValidityDays(e.target.value)}
              className="w-20 bg-transparent text-white text-sm outline-none" />
            <span className="text-zinc-500 text-sm">days</span>
          </div>
          <span className="text-zinc-500 text-sm">
            {(parseInt(validityDays) || 0) > 0 ? `≈ good for one exam window (${validityDays} days)` : "Lifetime access"}
          </span>
          <button onClick={saveValidity} className="td-btn-primary px-4 py-2 text-sm flex items-center gap-1.5 ml-auto">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      {/* Single-device login */}
      <div className="mt-10">
        <div className="flex items-center gap-2.5 mb-2">
          <Smartphone className="w-5 h-5 td-accent-text" />
          <h2 className="text-lg font-bold text-white">Single-device login</h2>
        </div>
        <p className="text-zinc-500 text-sm mb-4">
          When on, logging in on a new device signs the account out everywhere else — stops account sharing.
        </p>
        <button onClick={() => toggleSingleDevice(!singleDevice)}
          className={`w-full td-surface td-card-click rounded-2xl p-4 flex items-center gap-4 text-left ${singleDevice ? "ring-2 ring-[#7c6cf0]" : ""}`}>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${singleDevice ? "bg-white" : "td-surface-2"}`}>
            <Smartphone className={`w-5 h-5 ${singleDevice ? "text-black" : "text-zinc-300"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold">{singleDevice ? "Enforced — one active device per account" : "Off — multiple devices allowed"}</p>
            <p className="text-zinc-500 text-sm mt-0.5">Tap to {singleDevice ? "disable" : "enable"}.</p>
          </div>
          <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${singleDevice ? "td-accent-solid" : "bg-white/15"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${singleDevice ? "translate-x-5" : ""}`} />
          </span>
        </button>
      </div>
    </div>
  );
}
