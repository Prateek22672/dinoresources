import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, RotateCcw, Sparkles, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  GRAPHICS, DEFAULT_COPY, SocialCopyProvider, type SocialCopy, type GraphicDef,
} from "./social/SocialGraphics";

const COPY_KEY = "td:social-copy";

/** The fields worth a text box. Everything else is structural and lives in
 *  SocialGraphics.tsx, where changing it goes through review. */
const FIELDS: { key: keyof SocialCopy; label: string; hint?: string; wide?: boolean }[] = [
  { key: "headline1", label: "Headline · line 1" },
  { key: "headline2", label: "Headline · line 2" },
  { key: "tagline", label: "Tagline", hint: "{b} marks the bold phrase", wide: true },
  { key: "taglineBold", label: "Bold phrase" },
  { key: "badge", label: "Badge" },
  { key: "cta", label: "Call to action", wide: true },
  { key: "url", label: "URL" },
  { key: "demoQuestion", label: "Poster demo · question", wide: true },
  { key: "demoSearched", label: "Poster demo · searched line" },
  { key: "demoAnswerBold", label: "Poster demo · answer (bold)", wide: true },
  { key: "demoAnswerRest", label: "Poster demo · answer (rest)", wide: true },
  { key: "demoSource", label: "Poster demo · source chip", wide: true },
];

/** Preview scale per format, so a 1350-tall poster and a 1920-tall story both
 *  fit a card without either being unreadably small. */
const previewScale = (h: number) => (h >= 1900 ? 0.19 : h >= 1300 ? 0.26 : 0.3);

function GraphicCard({ def, copy }: { def: GraphicDef; copy: SocialCopy }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const scale = previewScale(def.h);

  const download = async () => {
    if (!ref.current || busy) return;
    setBusy(true);
    try {
      // pixelRatio 2 exports at 2160 wide. Instagram downsamples to 1080, and
      // downsampling a sharp image beats uploading one at exactly native size.
      const url = await toPng(ref.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#0e0e11" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `teamdino-${def.id}-${def.w}x${def.h}.png`;
      a.click();
    } catch (e) {
      console.error("[AdminSocial] export failed:", e);
      toast.error("Couldn't export that one — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="td-surface rounded-3xl overflow-hidden flex flex-col">
      <div className="px-4 py-3.5 flex items-center gap-3 border-b border-white/8">
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-semibold truncate">{def.label}</p>
          <p className="text-zinc-600 text-[11px]">{def.note} · {def.w}×{def.h}</p>
        </div>
        <button
          onClick={download}
          disabled={busy}
          className="td-btn-primary px-3.5 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shrink-0 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PNG
        </button>
      </div>

      {/* The preview is a scaled window onto the real node. The node itself
          stays at full size — html-to-image clones it, so the wrapper's
          transform never reaches the export. */}
      <div className="bg-black/40 flex items-start justify-center p-4 overflow-hidden">
        <div style={{ width: def.w * scale, height: def.h * scale, overflow: "hidden" }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: def.w, height: def.h }}>
            <SocialCopyProvider value={copy}>
              <def.Component ref={ref} />
            </SocialCopyProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The launch-graphics kit.
 *
 * These used to live in a design tool, which meant they were not in version
 * control and vanished if the document was deleted. Rendering them in the app
 * fixes both, and has a side benefit: they draw with the site's real webfonts,
 * which an exported design-tool PNG cannot embed.
 */
export default function AdminSocial() {
  const [copy, setCopy] = useState<SocialCopy>(() => {
    try {
      const raw = localStorage.getItem(COPY_KEY);
      // Merge over the defaults so a field added later doesn't come back blank.
      return raw ? { ...DEFAULT_COPY, ...JSON.parse(raw) } : DEFAULT_COPY;
    } catch { return DEFAULT_COPY; }
  });

  useEffect(() => {
    try { localStorage.setItem(COPY_KEY, JSON.stringify(copy)); } catch { /* quota */ }
  }, [copy]);

  const set = useCallback((k: keyof SocialCopy, v: string) => setCopy((c) => ({ ...c, [k]: v })), []);
  const dirty = JSON.stringify(copy) !== JSON.stringify(DEFAULT_COPY);

  return (
    <div className="space-y-6">
      <div className="td-hero rounded-3xl p-5 sm:p-6 relative overflow-hidden">
        <div aria-hidden className="absolute -top-16 -right-10 w-64 h-56 opacity-50 pointer-events-none"
          style={{ background: "rgb(var(--td-accent-rgb) / 0.22)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(30px)" }} />
        <div className="relative z-10 flex items-start gap-4">
          <span className="w-11 h-11 rounded-2xl td-accent-bg flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></span>
          <div className="min-w-0">
            <p className="text-white font-bold text-lg leading-tight">Launch graphics</p>
            <p className="text-zinc-400 text-[13px] mt-1 leading-relaxed max-w-[64ch]">
              Study-With-AI posters for Instagram and WhatsApp. Edit the copy below — every graphic updates live — then download each as a PNG at twice its native size.
            </p>
          </div>
        </div>
      </div>

      {/* ── Copy editor ── */}
      <div className="td-surface rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-500">Copy</p>
          <button
            onClick={() => setCopy(DEFAULT_COPY)}
            disabled={!dirty}
            className="td-btn-ghost px-3 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label key={f.key} className={`flex flex-col gap-1.5 ${f.wide ? "sm:col-span-2" : ""}`}>
              <span className="text-[11px] font-semibold text-zinc-500">
                {f.label}{f.hint && <span className="text-zinc-600 font-normal"> · {f.hint}</span>}
              </span>
              <input
                value={copy[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="td-surface-2 rounded-xl px-3.5 h-10 text-[13px] text-white outline-none focus:border-white/25 transition-colors"
              />
            </label>
          ))}
        </div>
        <p className="text-[11px] text-zinc-600 mt-3">
          Saved on this device only. Anything not listed here — the mode names, the ChatGPT comparison — lives in <code className="text-zinc-500">SocialGraphics.tsx</code>.
        </p>
      </div>

      {/* ── The graphics ── */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {GRAPHICS.map((def) => <GraphicCard key={def.id} def={def} copy={copy} />)}
      </div>

      <p className="text-zinc-600 text-[11px] flex items-center gap-1.5">
        <ImageIcon className="w-3 h-3" />
        Exports render with the site's own Inter and Bricolage Grotesque, so the headlines match the product exactly.
      </p>
    </div>
  );
}
