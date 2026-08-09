import React, { useEffect, useState } from "react";
import {
  Lightbulb,
  AlertTriangle,
  Info,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Pin,
  ExternalLink,
  ImageOff,
} from "lucide-react";

function Cursor() {
  return (
    <span
      className="inline-block w-0.5 h-[1.1em] ml-0.5 align-middle animate-[blink_0.7s_steps(1)_infinite]"
      style={{ background: "var(--td-accent)" }}
    />
  );
}

function renderInline(text: string): React.ReactNode {
  const pretty = text.replace(/-->/g, "->").replace(/<=/g, "<=").replace(/>=/g, ">=");
  const parts = pretty.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded-md text-[0.875em] font-mono border border-white/10"
              style={{ background: "rgb(var(--td-accent-rgb) / 0.12)", color: "var(--td-accent)" }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-white font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
          return (
            <em key={i} className="text-zinc-200 italic">
              {part.slice(1, -1)}
            </em>
          );
        }

        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

type Block =
  | { type: "code"; lang: string; content: string }
  | { type: "image"; alt: string; src: string }
  | { type: "table"; lines: string[] }
  | { type: "line"; content: string };

function parseImageLine(line: string): { alt: string; src: string } | null {
  const match = line.trim().match(/^!\[((?:\\.|[^\]\\])*)\]\((\S+?)(?:\s+["'][^"']*["'])?\)$/);
  if (!match) return null;

  return {
    alt: match[1].replace(/\\([\]\\])/g, "$1"),
    src: match[2].replace(/^<|>$/g, ""),
  };
}

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;

      let closed = false;
      while (i < lines.length) {
        if (lines[i].trimStart().startsWith("```")) {
          closed = true;
          i++;
          break;
        }

        codeLines.push(lines[i]);
        i++;
      }

      if (closed) {
        blocks.push({ type: "code", lang, content: codeLines.join("\n") });
      } else {
        blocks.push({ type: "line", content: line });
        codeLines.forEach((cl) => blocks.push({ type: "line", content: cl }));
      }

      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }

      blocks.push({ type: "table", lines: tableLines });
      continue;
    }

    const image = parseImageLine(line);
    if (image) {
      blocks.push({ type: "image", alt: image.alt, src: image.src });
      i++;
      continue;
    }

    blocks.push({ type: "line", content: line });
    i++;
  }

  return blocks;
}

function extractDriveFileId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    if (!host.includes("drive.google.com") && !host.includes("docs.google.com")) {
      return null;
    }

    const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (filePathMatch?.[1]) return filePathMatch[1];

    return url.searchParams.get("id");
  } catch {
    return rawUrl.match(/\/file\/d\/([^/]+)/)?.[1] ?? rawUrl.match(/[?&]id=([^&]+)/)?.[1] ?? null;
  }
}

function getImageDisplaySrc(src: string): string | null {
  const clean = src.trim();

  if (/^data:image\//i.test(clean)) {
    return clean;
  }

  if (!/^https?:\/\//i.test(clean)) {
    return null;
  }

  const driveFileId = extractDriveFileId(clean);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveFileId)}&sz=w1600`;
  }

  return clean;
}

function CodeBlock({ lang, content }: { lang: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable.
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 shadow-lg">
      <div className="bg-zinc-900 px-4 py-2 flex items-center gap-2 border-b border-white/10">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />

        {lang && <span className="ml-2 text-xs text-zinc-500 font-mono">{lang}</span>}

        <button
          onClick={copy}
          className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-200 transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="bg-[#0a0a0d] p-4 overflow-x-auto">
        <code className="text-emerald-300 font-mono text-sm leading-relaxed">{content}</code>
      </pre>
    </div>
  );
}

function ImageBlock({ alt, src }: { alt: string; src: string }) {
  const [failed, setFailed] = useState(false);
  const displaySrc = getImageDisplaySrc(src);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!displaySrc || failed) {
    return (
      <div className="my-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
            <ImageOff className="w-4 h-4 text-zinc-500" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-300">Image preview unavailable</p>
            {alt && <p className="text-xs text-zinc-500 mt-0.5">{alt}</p>}

            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold mt-2"
              style={{ color: "var(--td-accent)" }}
            >
              Open image <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <figure className="my-4">
      <a href={src} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={displaySrc}
          alt={alt}
          className="max-w-full rounded-xl border border-white/10 shadow-lg mx-auto bg-black/20"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </a>

      {alt && (
        <figcaption className="text-center text-xs text-zinc-500 mt-2">
          {renderInline(alt)}
        </figcaption>
      )}
    </figure>
  );
}

function TableBlock({ lines }: { lines: string[] }) {
  const isSeparator = (l: string) => l.trim().replace(/[|\s\-:]/g, "") === "";
  const contentLines = lines.filter((l) => !isSeparator(l));

  if (contentLines.length === 0) return null;

  const parseRow = (row: string) => {
    const cells = row.trim().split("|");
    if (cells[0] === "") cells.shift();
    if (cells[cells.length - 1] === "") cells.pop();
    return cells.map((cell) => cell.trim());
  };

  const headers = parseRow(contentLines[0]);
  const rows = contentLines.slice(1).map(parseRow);

  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr style={{ background: "rgb(var(--td-accent-rgb) / 0.10)" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left font-semibold whitespace-nowrap border-b border-white/10"
                style={{ color: "var(--td-accent)" }}
              >
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-white/[0.02]" : ""}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-zinc-300 border-b border-white/5">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CALLOUTS: Record<string, { icon: any; tint: string; label: string }> = {
  note: { icon: Info, tint: "#5b8def", label: "Note" },
  tip: { icon: Lightbulb, tint: "#f59e0b", label: "Tip" },
  important: { icon: AlertTriangle, tint: "#f472b6", label: "Important" },
  warning: { icon: AlertTriangle, tint: "#f59e0b", label: "Warning" },
  remember: { icon: Pin, tint: "#34d399", label: "Remember" },
  example: { icon: BookOpen, tint: "#a78bfa", label: "Example" },
  definition: { icon: Sparkles, tint: "#34d399", label: "Definition" },
};

function Callout({ kind, text }: { kind: string; text: string }) {
  const c = CALLOUTS[kind];
  const Icon = c.icon;

  return (
    <div
      className="my-3 rounded-2xl border p-3.5 flex gap-3"
      style={{ borderColor: `${c.tint}38`, background: `${c.tint}0d` }}
    >
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${c.tint}22` }}
      >
        <Icon className="w-4 h-4" style={{ color: c.tint }} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold tracking-wider uppercase mb-1" style={{ color: c.tint }}>
          {c.label}
        </p>
        <p className="text-zinc-300 text-[0.95em] leading-relaxed">{renderInline(text)}</p>
      </div>
    </div>
  );
}

function LineBlock({
  line,
  isLast,
  isTyping,
}: {
  line: string;
  isLast: boolean;
  isTyping: boolean;
}) {
  const calloutMatch = line
    .trim()
    .match(/^(?:>\s*)?(Note|Tip|Important|Warning|Remember|Example|Definition)\s*[:\-]\s*(.+)/i);

  if (calloutMatch) {
    return <Callout kind={calloutMatch[1].toLowerCase()} text={calloutMatch[2]} />;
  }

  if (line.startsWith("> ")) {
    return (
      <blockquote
        className="my-3 rounded-r-xl pl-4 py-2.5 pr-3 border-l-4"
        style={{
          borderColor: "rgb(var(--td-accent-rgb) / 0.5)",
          background: "rgb(var(--td-accent-rgb) / 0.06)",
        }}
      >
        <p className="text-zinc-300 text-[0.95em] leading-relaxed">{renderInline(line.slice(2))}</p>
      </blockquote>
    );
  }

  if (line.trim() === "---") {
    return <hr className="border-0 h-px bg-white/8 my-4" />;
  }

  if (!line.trim()) return null;

  if (line.startsWith("### ")) {
    return (
      <h3 className="text-[1.05rem] sm:text-lg font-bold text-white mt-5 mb-2 flex items-center gap-2.5">
        <span className="w-1 h-5 rounded-full inline-block shrink-0" style={{ background: "var(--td-accent)" }} />
        {renderInline(line.replace(/^### /, ""))}
      </h3>
    );
  }

  if (line.startsWith("## ")) {
    return (
      <h2
        className="text-xl sm:text-[1.4rem] font-extrabold text-white mt-6 mb-2.5 pb-2 border-b border-white/8"
        style={{ textWrap: "balance" as any }}
      >
        {renderInline(line.replace(/^## /, ""))}
      </h2>
    );
  }

  if (line.startsWith("# ")) {
    return (
      <h1
        className="text-2xl sm:text-[1.7rem] font-extrabold text-white mt-6 mb-3"
        style={{ textWrap: "balance" as any }}
      >
        {renderInline(line.replace(/^# /, ""))}
      </h1>
    );
  }

  const ulMatch = line.match(/^(\s*)[-*]\s+(.+)/);
  if (ulMatch && !line.trimStart().startsWith("**")) {
    const indent = Math.min(Math.floor(ulMatch[1].replace(/\t/g, "  ").length / 2), 3);

    return (
      <div className="flex items-start gap-2.5 my-1" style={{ marginLeft: `${0.75 + indent * 1.1}rem` }}>
        <span
          className="w-1.5 h-1.5 rounded-full mt-[0.55rem] shrink-0"
          style={{ background: indent > 0 ? "rgb(var(--td-accent-rgb) / 0.5)" : "var(--td-accent)" }}
        />
        <p className="flex-1 min-w-0">{renderInline(ulMatch[2])}</p>
      </div>
    );
  }

  const numMatch = line.match(/^\s*(\d+)[.)]\s+(.+)/);
  if (numMatch) {
    return (
      <div className="flex items-start gap-2.5 my-1.5">
        <span
          className="shrink-0 min-w-[1.375rem] h-[1.375rem] px-1 rounded-full text-[11px] flex items-center justify-center font-bold mt-px"
          style={{ background: "rgb(var(--td-accent-rgb) / 0.16)", color: "var(--td-accent)" }}
        >
          {numMatch[1]}
        </span>
        <p className="flex-1 min-w-0 font-medium">{renderInline(numMatch[2])}</p>
      </div>
    );
  }

  const t = line.trim();
  if (t.endsWith(":") && t.length <= 64 && !t.includes(". ") && /^[A-Z0-9]/.test(t)) {
    return <p className="text-white font-semibold mt-3.5 mb-1 text-[1.01em]">{renderInline(t)}</p>;
  }

  return (
    <p className="my-2.5">
      {renderInline(line)}
      {isTyping && isLast && <Cursor />}
    </p>
  );
}

export function MarkdownRenderer({
  content,
  isTyping = false,
}: {
  content: string;
  isTyping?: boolean;
}) {
  const blocks = parseBlocks(content);

  return (
    <div className="text-[15px] sm:text-base leading-[1.65] text-zinc-300 max-w-[70ch] [&>*:first-child]:!mt-0">
      {blocks.map((block, i) => {
        const isLast = i === blocks.length - 1;

        if (block.type === "code") {
          return <CodeBlock key={`code-${i}`} lang={block.lang} content={block.content} />;
        }

        if (block.type === "image") {
          return <ImageBlock key={`image-${block.src}-${i}`} alt={block.alt} src={block.src} />;
        }

        if (block.type === "table") {
          return <TableBlock key={`table-${i}`} lines={block.lines} />;
        }

        return <LineBlock key={`line-${i}`} line={block.content} isLast={isLast} isTyping={isTyping} />;
      })}

      {isTyping && !content && <Cursor />}
    </div>
  );
}