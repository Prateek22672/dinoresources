/**
 * Launch graphics for Study-With-AI, as real DOM.
 *
 * They live in the app rather than in a design tool for two reasons: they stay
 * under version control alongside the feature they advertise, and they render
 * with the site's actual webfonts — an exported design-tool PNG falls back to a
 * system face because it cannot embed Google Fonts.
 *
 * Every graphic is authored at its true export size (1080 wide). Previews scale
 * them down with a transform; the export captures the unscaled node, so what
 * ships is always full resolution.
 */
import { createContext, forwardRef, useContext } from "react";
import dino from "@/assets/dinosaurWhite.png";

/**
 * The copy that actually gets rewritten between campaigns. Everything else —
 * the mode names, the comparison columns — is structural and lives in the
 * markup below, where changing it is a code review rather than a text box.
 */
export interface SocialCopy {
  badge: string;
  headline1: string;
  headline2: string;
  tagline: string;
  taglineBold: string;
  cta: string;
  url: string;
  demoQuestion: string;
  demoSearched: string;
  demoAnswerBold: string;
  demoAnswerRest: string;
  demoSource: string;
}

export const DEFAULT_COPY: SocialCopy = {
  badge: "New",
  headline1: "Meet Rex,",
  headline2: "your study tutor.",
  tagline: "He reads {b} — not the internet.",
  taglineBold: "your notes",
  cta: "Any subject → any unit → Study With AI",
  url: "teamdino.in",
  demoQuestion: "“Explain the 5 Vs of Big Data”",
  demoSearched: "searched 31 answers",
  demoAnswerBold: "Volume, Velocity, Variety, Veracity and Value",
  demoAnswerRest: "— the five properties that make data “big” in your Unit 1 notes.",
  demoSource: "What is Big Data? Explain its characteristics",
};

const CopyContext = createContext<SocialCopy>(DEFAULT_COPY);
export const SocialCopyProvider = CopyContext.Provider;
const useCopy = () => useContext(CopyContext);

/** Renders a tagline whose `{b}` placeholder becomes the emphasised phrase. */
function Tagline({ style }: { style: React.CSSProperties }) {
  const c = useCopy();
  const [before, after] = c.tagline.split("{b}");
  return (
    <p style={{ margin: 0, ...style }}>
      {before}
      <span style={{ color: "#fff", fontWeight: 700 }}>{c.taglineBold}</span>
      {after}
    </p>
  );
}

const DISPLAY = "var(--font-display), 'Bricolage Grotesque', Inter, sans-serif";
const ACCENT = "#7c6cf0";
const ACCENT_SOFT = "#a9a0f5";

/** The app's own grain overlay — same turbulence values as `.td-hero`. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")";

function Grain() {
  return <div style={{ position: "absolute", inset: 0, opacity: 0.5, backgroundImage: GRAIN }} />;
}

/** A solid accent blob, blurred. The brand forbids gradients, so depth comes
 *  from layering these behind translucent surfaces instead. */
function Blob({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: "absolute", background: "rgba(124,108,240,0.2)", filter: "blur(80px)", ...style }} />;
}

/** Glass: a white wash, a hairline, an inset top highlight and a deep shadow.
 *  `backdrop-filter` is included but never relied on — rasterisers routinely
 *  drop it, and the wash alone has to carry the effect. */
function glass(radius: number, wash = 0.05): React.CSSProperties {
  return {
    background: `rgba(255,255,255,${wash})`,
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: radius,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 28px 64px -26px rgba(0,0,0,0.75)",
  };
}

/** Rex. Same blob geometry, halo and highlight as the live TutorOrb. */
function Orb({ size }: { size: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: -size * 0.26, background: "rgba(124,108,240,0.28)", borderRadius: "50%", filter: `blur(${Math.round(size * 0.3)}px)` }} />
      <div style={{ position: "absolute", inset: size * 0.12, background: ACCENT, borderRadius: "54% 46% 58% 42% / 52% 58% 42% 48%", boxShadow: "inset 0 -10px 26px rgba(0,0,0,0.22)" }} />
      <div style={{ position: "absolute", top: size * 0.29, left: size * 0.33, width: size * 0.2, height: size * 0.2, background: "rgba(255,255,255,0.55)", borderRadius: "50%", filter: `blur(${Math.round(size * 0.04)}px)` }} />
    </div>
  );
}

function Frame({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  return (
    <div style={{ width: w, height: h, position: "relative", overflow: "hidden", background: "#0e0e11", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      {children}
    </div>
  );
}

const icons = {
  explain: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  drill: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  recall: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
};

function Icon({ name, size, color = "#bdb4ff", width = 2 }: { name: keyof typeof icons; size: number; color?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

function ModeCard({ name, label, sub }: { name: keyof typeof icons; label: string; sub: string }) {
  return (
    <div style={{ ...glass(26), padding: "26px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(124,108,240,0.2)", border: "1px solid rgba(124,108,240,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={name} size={27} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, letterSpacing: "-0.8px", color: "#fff" }}>{label}</span>
        <span style={{ fontSize: 19, lineHeight: 1.4, fontWeight: 500, color: "#a8a8b3" }}>{sub}</span>
      </div>
    </div>
  );
}

function Wordmark({ scale = 1 }: { scale?: number }) {
  const c = useCopy();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 * scale }}>
      <span style={{ width: 62 * scale, height: 62 * scale, borderRadius: 20 * scale, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={dino} alt="" style={{ width: 34 * scale, height: 34 * scale, display: "block" }} />
      </span>
      <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 34 * scale, letterSpacing: "-0.8px", color: "#fff" }}>TeamDino</span>
      <span style={{ fontSize: 17 * scale, fontWeight: 800, letterSpacing: "2.2px", textTransform: "uppercase", color: ACCENT_SOFT, background: "rgba(124,108,240,0.18)", border: "1px solid rgba(124,108,240,0.28)", borderRadius: 999, padding: `${8 * scale}px ${17 * scale}px` }}>{c.badge}</span>
    </div>
  );
}

/** The dino, oversized and faint — brand presence without a second lockup. */
function Watermark({ style }: { style: React.CSSProperties }) {
  return <img src={dino} alt="" style={{ position: "absolute", opacity: 0.045, ...style }} />;
}

// ── 1 · The poster (1080x1350, Instagram 4:5) ───────────────────────────────
export const Poster = forwardRef<HTMLDivElement>((_, ref) => {
  const c = useCopy();
  return (
  <div ref={ref}>
    <Frame w={1080} h={1350}>
      <Blob style={{ top: -170, left: -150, width: 640, height: 590, background: "rgba(124,108,240,0.26)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%" }} />
      <Blob style={{ top: 560, left: 120, width: 700, height: 420, background: "rgba(124,108,240,0.17)", borderRadius: "48% 52% 42% 58% / 50% 58% 42% 50%", filter: "blur(90px)" }} />
      <Blob style={{ bottom: -200, right: -170, width: 620, height: 560, background: "rgba(124,108,240,0.14)", borderRadius: "60% 40% 52% 48% / 44% 56% 44% 56%", filter: "blur(95px)" }} />
      <Watermark style={{ bottom: -70, right: -60, width: 560, transform: "rotate(-8deg)" }} />
      <Grain />

      <div style={{ position: "relative", height: "100%", boxSizing: "border-box", padding: "58px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Wordmark />
          <span style={{ fontSize: 20, fontWeight: 600, color: "#5f5f6a" }}>Study With AI</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <Orb size={132} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 76, lineHeight: 0.96, letterSpacing: "-2.6px", color: "#fff" }}>
              {c.headline1}<br />{c.headline2}
            </h1>
            <Tagline style={{ fontSize: 30, lineHeight: 1.35, fontWeight: 500, color: "#b4b4bd" }} />
          </div>
        </div>

        {/* the proof: a real answer, its grounding badge and its citation */}
        <div style={{ ...glass(32, 0.055), padding: "34px 34px 30px" }}>
          <p style={{ margin: "0 0 20px", fontSize: 25, fontWeight: 600, color: "#8e8e99" }}>{c.demoQuestion}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#34d399" }} />
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "1.7px", textTransform: "uppercase", color: "#6ee7b7" }}>From your notes</span>
            <span style={{ fontSize: 18, fontWeight: 500, color: "#6b6b76" }}>· {c.demoSearched}</span>
          </div>
          <p style={{ margin: "0 0 22px", fontSize: 27, lineHeight: 1.45, fontWeight: 500, color: "#dcdce2", borderLeft: "3px solid rgba(124,108,240,0.55)", paddingLeft: 22 }}>
            <span style={{ color: "#fff", fontWeight: 700 }}>{c.demoAnswerBold}</span> {c.demoAnswerRest}
          </p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 16, padding: "12px 18px" }}>
            <Icon name="book" size={19} color={ACCENT_SOFT} />
            <span style={{ fontSize: 19, fontWeight: 600, color: "#b4b4bd" }}>
              <span style={{ color: ACCENT_SOFT, fontWeight: 800 }}>U1</span> · {c.demoSource}
            </span>
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
          <ModeCard name="explain" label="Explain" sub="Ask anything from the unit." />
          <ModeCard name="drill" label="Drill" sub="MCQs till it sticks." />
          <ModeCard name="recall" label="Recall" sub="Write it. He marks it." />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 22 }}>
          <div style={{ ...glass(999, 0.06), flexGrow: 1, padding: "24px 34px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 27, fontWeight: 700, color: "#fff" }}>{c.cta}</span>
            <Icon name="arrow" size={30} width={2.4} />
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#6b6b76", flexShrink: 0 }}>{c.url}</span>
        </div>
      </div>
    </Frame>
  </div>
  );
});
Poster.displayName = "Poster";

// ── 2 · Square hero (1080x1080) ─────────────────────────────────────────────
export const PostHero = forwardRef<HTMLDivElement>((_, ref) => {
  const c = useCopy();
  return (
  <div ref={ref}>
    <Frame w={1080} h={1080}>
      <Blob style={{ top: -160, left: -140, width: 620, height: 560, background: "rgba(124,108,240,0.22)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(70px)" }} />
      <Blob style={{ bottom: -220, right: -120, width: 560, height: 520, background: "rgba(124,108,240,0.14)", borderRadius: "48% 52% 42% 58% / 50% 58% 42% 50%" }} />
      <Watermark style={{ bottom: -60, right: -50, width: 480, transform: "rotate(-8deg)" }} />
      <Grain />
      <div style={{ position: "relative", height: "100%", boxSizing: "border-box", padding: "84px 88px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Wordmark />
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <Orb size={190} />
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 104, lineHeight: 0.96, letterSpacing: "-3.6px", color: "#fff" }}>
            {c.headline1}<br />{c.headline2}
          </h1>
          <Tagline style={{ fontSize: 40, lineHeight: 1.35, fontWeight: 500, color: "#b4b4bd", maxWidth: "20ch" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 26, fontWeight: 600, color: "#5f5f6a" }}>{c.url}</span>
          <span style={{ fontSize: 24, fontWeight: 600, color: "#5f5f6a" }}>Notes · PYQs · Study With AI</span>
        </div>
      </div>
    </Frame>
  </div>
  );
});
PostHero.displayName = "PostHero";

// ── 3 · Three modes (1080x1080) ─────────────────────────────────────────────
export const PostModes = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <Frame w={1080} h={1080}>
      <Blob style={{ top: -200, right: -160, width: 620, height: 560, background: "rgba(124,108,240,0.18)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%" }} />
      <Blob style={{ top: 520, left: 80, width: 700, height: 380, background: "rgba(124,108,240,0.14)", borderRadius: "48% 52% 42% 58% / 50% 58% 42% 50%", filter: "blur(90px)" }} />
      <Watermark style={{ bottom: -50, left: -40, width: 420, transform: "rotate(6deg)" }} />
      <Grain />
      <div style={{ position: "relative", height: "100%", boxSizing: "border-box", padding: "84px 72px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 16px" }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "3.4px", textTransform: "uppercase", color: ACCENT_SOFT }}>Study With AI</span>
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 82, lineHeight: 1, letterSpacing: "-2.8px", color: "#fff" }}>
            Three ways to<br />use him.
          </h1>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 26 }}>
          <ModeCard name="explain" label="Explain" sub="Ask anything from the unit." />
          <ModeCard name="drill" label="Drill" sub="Quiz me till it sticks." />
          <ModeCard name="recall" label="Recall" sub="Write it. He marks it." />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
          <span style={{ fontSize: 28, fontWeight: 600, color: "#8e8e99" }}>Inside every unit.</span>
          <span style={{ fontSize: 26, fontWeight: 600, color: "#5f5f6a" }}>teamdino.in</span>
        </div>
      </div>
    </Frame>
  </div>
));
PostModes.displayName = "PostModes";

// ── 4 · vs ChatGPT (1080x1080) ──────────────────────────────────────────────
export const PostCompare = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <Frame w={1080} h={1080}>
      <Blob style={{ bottom: -220, right: -140, width: 640, height: 580, background: "rgba(124,108,240,0.18)", borderRadius: "48% 52% 42% 58% / 50% 58% 42% 50%", filter: "blur(85px)" }} />
      <Watermark style={{ top: -40, left: -50, width: 400, transform: "rotate(-10deg)" }} />
      <Grain />
      <div style={{ position: "relative", height: "100%", boxSizing: "border-box", padding: "80px 72px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0, padding: "0 12px", fontFamily: DISPLAY, fontWeight: 800, fontSize: 78, lineHeight: 1, letterSpacing: "-2.6px", color: "#fff" }}>
          Why not just<br />ask ChatGPT?
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 26 }}>
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 30, padding: "44px 36px", display: "flex", flexDirection: "column", gap: 26 }}>
            <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: "2.6px", textTransform: "uppercase", color: "#71717a" }}>ChatGPT</span>
            <p style={{ margin: 0, fontFamily: DISPLAY, fontSize: 44, lineHeight: 1.14, letterSpacing: "-1.3px", fontWeight: 700, color: "#a1a1aa" }}>Answers from the internet.</p>
            <p style={{ margin: 0, fontSize: 25, lineHeight: 1.5, fontWeight: 500, color: "#71717a" }}>Confident, general, and not written for your paper.</p>
          </div>
          <div style={{ ...glass(30, 0.06), border: "1px solid rgba(124,108,240,0.42)", padding: "44px 36px", display: "flex", flexDirection: "column", gap: 26 }}>
            <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: "2.6px", textTransform: "uppercase", color: ACCENT_SOFT }}>Rex</span>
            <p style={{ margin: 0, fontFamily: DISPLAY, fontSize: 44, lineHeight: 1.14, letterSpacing: "-1.3px", fontWeight: 700, color: "#fff" }}>Answers from your seniors&rsquo; notes.</p>
            <p style={{ margin: 0, fontSize: 25, lineHeight: 1.5, fontWeight: 500, color: "#b4b4bd" }}>Vetted answers for your exact GITAM paper — and he shows you the source.</p>
            <span style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 12, background: "rgba(52,211,153,0.14)", borderRadius: 999, padding: "12px 22px" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#34d399" }} />
              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "1.8px", textTransform: "uppercase", color: "#6ee7b7" }}>From your notes</span>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px" }}>
          <span style={{ fontSize: 28, fontWeight: 600, color: "#8e8e99" }}>One of them sat your syllabus.</span>
          <span style={{ fontSize: 26, fontWeight: 600, color: "#5f5f6a" }}>teamdino.in</span>
        </div>
      </div>
    </Frame>
  </div>
));
PostCompare.displayName = "PostCompare";

// ── 5 · Story hero (1080x1920) ──────────────────────────────────────────────
export const StoryHero = forwardRef<HTMLDivElement>((_, ref) => {
  const c = useCopy();
  return (
  <div ref={ref}>
    <Frame w={1080} h={1920}>
      <Blob style={{ top: 120, left: -180, width: 700, height: 640, background: "rgba(124,108,240,0.2)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(90px)" }} />
      <Blob style={{ bottom: 60, right: -200, width: 660, height: 620, background: "rgba(124,108,240,0.13)", borderRadius: "48% 52% 42% 58% / 50% 58% 42% 50%", filter: "blur(95px)" }} />
      <Watermark style={{ bottom: 180, right: -80, width: 520, transform: "rotate(-8deg)" }} />
      <Grain />
      {/* content sits clear of the top ~250px and bottom ~300px, where
          Instagram and WhatsApp overlay their own story chrome */}
      <div style={{ position: "relative", height: "100%", boxSizing: "border-box", padding: "250px 92px 300px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Wordmark scale={1.15} />
        <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
          <Orb size={250} />
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 126, lineHeight: 0.94, letterSpacing: "-4.4px", color: "#fff" }}>
            {c.headline1}<br />{c.headline2}
          </h1>
          <Tagline style={{ fontSize: 46, lineHeight: 1.35, fontWeight: 500, color: "#b4b4bd", maxWidth: "18ch" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ ...glass(999, 0.06), padding: "34px 46px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#fff" }}>{c.cta}</span>
            <Icon name="arrow" size={40} width={2.4} />
          </div>
          <span style={{ alignSelf: "center", fontSize: 32, fontWeight: 700, color: "#6b6b76" }}>{c.url}</span>
        </div>
      </div>
    </Frame>
  </div>
  );
});
StoryHero.displayName = "StoryHero";

// ── 6 · Story drill (1080x1920) ─────────────────────────────────────────────
const OPTIONS = [
  { key: "A", text: "Volume", right: false },
  { key: "B", text: "Velocity", right: true },
  { key: "C", text: "Variety", right: false },
  { key: "D", text: "Veracity", right: false },
];

export const StoryQuiz = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <Frame w={1080} h={1920}>
      <Blob style={{ top: 200, right: -200, width: 660, height: 600, background: "rgba(124,108,240,0.18)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(90px)" }} />
      <Blob style={{ bottom: 220, left: -160, width: 600, height: 560, background: "rgba(124,108,240,0.12)", borderRadius: "60% 40% 52% 48% / 44% 56% 44% 56%", filter: "blur(95px)" }} />
      <Watermark style={{ top: 130, left: -60, width: 400, transform: "rotate(7deg)" }} />
      <Grain />
      <div style={{ position: "relative", height: "100%", boxSizing: "border-box", padding: "250px 84px 300px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "3.4px", textTransform: "uppercase", color: ACCENT_SOFT }}>Drill mode</span>
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 104, lineHeight: 0.96, letterSpacing: "-3.6px", color: "#fff" }}>
            &ldquo;Quiz me on<br />Unit 1.&rdquo;
          </h1>
        </div>

        <div style={{ ...glass(36, 0.055), padding: "48px 44px", display: "flex", flexDirection: "column", gap: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {["#34d399", "#34d399", ACCENT, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.1)"].map((c, i) => (
              <span key={i} style={{ height: 10, flexGrow: 1, borderRadius: 999, background: c }} />
            ))}
            <span style={{ fontSize: 24, fontWeight: 800, color: "#8e8e99" }}>3/5</span>
          </div>

          <p style={{ margin: 0, fontSize: 40, lineHeight: 1.3, fontWeight: 700, color: "#fff" }}>
            Which of the 5 Vs describes the speed at which data arrives?
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {OPTIONS.map((o) => (
              <div
                key={o.key}
                style={{
                  background: o.right ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
                  border: o.right ? "2px solid #34d399" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 22,
                  padding: o.right ? "25px 27px" : "26px 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                }}
              >
                <span style={{ width: 52, height: 52, borderRadius: 16, background: o.right ? "#34d399" : "rgba(124,108,240,0.16)", color: ACCENT_SOFT, fontSize: 24, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {o.right ? <Icon name="check" size={28} color="#062e22" width={3.2} /> : o.key}
                </span>
                <span style={{ fontSize: 32, fontWeight: o.right ? 700 : 500, color: o.right ? "#fff" : "#d4d4d8" }}>{o.text}</span>
              </div>
            ))}
          </div>

          <span style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 12, background: "rgba(52,211,153,0.14)", borderRadius: 999, padding: "13px 24px" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#34d399" }} />
            <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: "1.8px", textTransform: "uppercase", color: "#6ee7b7" }}>Written from your notes</span>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: "#b4b4bd" }}>Every question comes from your unit.</span>
          <span style={{ fontSize: 32, fontWeight: 700, color: "#6b6b76" }}>teamdino.in</span>
        </div>
      </div>
    </Frame>
  </div>
));
StoryQuiz.displayName = "StoryQuiz";

export interface GraphicDef {
  id: string;
  label: string;
  note: string;
  w: number;
  h: number;
  Component: React.ForwardRefExoticComponent<React.RefAttributes<HTMLDivElement>>;
}

export const GRAPHICS: GraphicDef[] = [
  { id: "poster", label: "The poster", note: "Instagram 4:5 — the one to share", w: 1080, h: 1350, Component: Poster },
  { id: "hero", label: "Post · Meet Rex", note: "Instagram square", w: 1080, h: 1080, Component: PostHero },
  { id: "modes", label: "Post · Three modes", note: "Instagram square", w: 1080, h: 1080, Component: PostModes },
  { id: "compare", label: "Post · vs ChatGPT", note: "Instagram square", w: 1080, h: 1080, Component: PostCompare },
  { id: "story-hero", label: "Story · Meet Rex", note: "Story / WhatsApp status", w: 1080, h: 1920, Component: StoryHero },
  { id: "story-quiz", label: "Story · Drill", note: "Story / WhatsApp status", w: 1080, h: 1920, Component: StoryQuiz },
];
