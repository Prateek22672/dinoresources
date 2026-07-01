import { useEffect, useState } from "react";
import { tbl } from "@/integrations/supabase/revamp";
import { toast } from "sonner";
import { Shield, Check, Code2, Lock, Ban } from "lucide-react";

const LEVELS = [
  { value: 0, title: "Off — Developer mode", desc: "Nothing is blocked. DevTools, right-click, copy/paste all allowed.", icon: Code2 },
  { value: 1, title: "Level 1 — No DevTools", desc: "Blocks F12 / Ctrl+Shift+I·J·C / Ctrl+U and right-click.", icon: Shield },
  { value: 2, title: "Level 2 — No copy/paste", desc: "Level 1 + blocks copy, cut, paste and text selection.", icon: Lock },
  { value: 3, title: "Level 3 — Strict", desc: "Level 2 + blocks printing and image dragging.", icon: Ban },
];

export default function AdminSecurity() {
  const [level, setLevel] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tbl("app_settings").select("security_level").maybeSingle().then(({ data }: any) => setLevel(data?.security_level ?? 1));
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
    </div>
  );
}
