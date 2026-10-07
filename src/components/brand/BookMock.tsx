import dinoBlack from "@/assets/dinosaurBlack.png";

/** Cover / spine pairs in the hero's palette — solid, saturated, book-like. */
export const BOOK_TONES: { cover: string; spine: string }[] = [
  { cover: "#1E2B7A", spine: "#E0559B" },
  { cover: "#0F9D9A", spine: "#0B7A78" },
  { cover: "#3A2F6B", spine: "#E6C25E" },
  { cover: "#B4442F", spine: "#7A2A1C" },
  { cover: "#2F5D3A", spine: "#E6C25E" },
  { cover: "#6D5BD0", spine: "#3B2F8C" },
  { cover: "#C8811F", spine: "#7A4A0E" },
  { cover: "#22303F", spine: "#5FB3D9" },
];

// The title sits in the band right of the spine (x 86 → ~256). Short codes
// ("DBMS") get the full hero size; longer names wrap to two lines and shrink
// so the longest word still fits.
const TITLE_X = 86;
const TITLE_W = 168;

function layoutTitle(title: string): { lines: string[]; size: number } {
  const t = title.trim();
  if (t.length <= 6) return { lines: [t], size: 44 };
  const words = t.split(/\s+/);
  let lines = [t];
  if (words.length > 1) {
    // split where the two halves come out most even
    let best = 1, bestDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
      if (d < bestDiff) { bestDiff = d; best = i; }
    }
    lines = [words.slice(0, best).join(" "), words.slice(best).join(" ")];
  }
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.max(20, Math.min(40, Math.floor(TITLE_W / (longest * 0.58))));
  return { lines, size };
}

/**
 * The hardcover subject book — used in the hero and on the subject shelf so
 * both read as the same object.
 */
export default function BookMock({ cover, spine, title, sub = "5 units · PYQs · AI", shadow = true }: {
  cover: string; spine: string; title: string; sub?: string; shadow?: boolean;
}) {
  const { lines, size } = layoutTitle(title);
  const lineH = size * 0.98;
  const lastY = 316;
  return (
    <svg viewBox="0 0 300 400" className="w-full h-auto" style={shadow ? { filter: "drop-shadow(0 45px 45px rgba(0,0,0,0.35))" } : undefined} aria-hidden>
      {/* page block peeking right + bottom */}
      <rect x="24" y="10" width="270" height="384" rx="14" fill="#F4EFE3" />
      <g stroke="#DCD3BC" strokeWidth="2">
        <line x1="284" y1="22" x2="284" y2="382" />
        <line x1="289" y1="28" x2="289" y2="376" />
      </g>
      <g stroke="#DCD3BC" strokeWidth="2">
        <line x1="40" y1="388" x2="270" y2="388" />
      </g>
      {/* front cover */}
      <rect x="6" y="0" width="274" height="382" rx="16" fill={cover} />
      {/* cover depth edge */}
      <rect x="262" y="4" width="18" height="374" rx="9" fill="rgba(0,0,0,0.14)" />
      {/* spine */}
      <path d="M6 16 A16 16 0 0 1 22 0 H52 V382 H22 A16 16 0 0 1 6 366 Z" fill={spine} />
      <rect x="52" y="0" width="9" height="382" fill="rgba(0,0,0,0.16)" />
      {/* hinge highlight */}
      <rect x="66" y="10" width="4" height="362" rx="2" fill="rgba(255,255,255,0.55)" />
      {/* dino badge */}
      <circle cx="234" cy="48" r="26" fill="#ffffff" />
      <image href={dinoBlack} x="218" y="32" width="32" height="32" />
      {/* title — bottom-anchored, one or two lines */}
      <text x={TITLE_X} fill="#ffffff" fontWeight="800" fontSize={size} fontFamily="'Baloo 2', sans-serif">
        {lines.map((l, i) => (
          <tspan key={i} x={TITLE_X} y={lastY - (lines.length - 1 - i) * lineH}>{l}</tspan>
        ))}
      </text>
      <text x={TITLE_X} y="344" fill="rgba(255,255,255,0.75)" fontWeight="700" fontSize="14" fontFamily="Inter, sans-serif">{sub}</text>
    </svg>
  );
}
