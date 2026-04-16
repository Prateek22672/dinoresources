import React from "react";

// ─── Blinking cursor shown during typewriter streaming ─────────────────────
function Cursor() {
  return (
    <span className="inline-block w-0.5 h-[1.1em] bg-indigo-400 ml-0.5 align-middle animate-[blink_0.7s_steps(1)_infinite]" />
  );
}

// ─── Inline formatting: bold, italic, inline-code ─────────────────────────
function renderInline(text: string): React.ReactNode {
  // Split on inline-code, **bold**, *italic* — in that priority order
  const parts = text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={i}
              className="bg-zinc-800/80 text-emerald-300 px-1.5 py-0.5 rounded text-[0.875em] font-mono border border-white/10"
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

// ─── Block types ──────────────────────────────────────────────────────────
type Block =
  | { type: "code"; lang: string; content: string }
  | { type: "image"; alt: string; src: string }
  | { type: "table"; lines: string[] }
  | { type: "line"; content: string };

// ─── Parse raw markdown string into a list of typed blocks ────────────────
function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code block ──────────────────────────────────────────────
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
        // Unclosed block during streaming — degrade to plain text
        blocks.push({ type: "line", content: line });
        codeLines.forEach((cl) => blocks.push({ type: "line", content: cl }));
      }
      continue;
    }

    // ── Table block (consecutive lines starting with |) ────────────────
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "table", lines: tableLines });
      continue;
    }

    // ── Inline image: ![alt](url) ──────────────────────────────────────
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      blocks.push({ type: "image", alt: imgMatch[1], src: imgMatch[2] });
      i++;
      continue;
    }

    blocks.push({ type: "line", content: line });
    i++;
  }

  return blocks;
}

// ─── Sub-renderers ────────────────────────────────────────────────────────
function CodeBlock({ lang, content }: { lang: string; content: string }) {
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 shadow-lg">
      <div className="bg-zinc-900 px-4 py-2 flex items-center gap-2 border-b border-white/10">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        {lang && (
          <span className="ml-2 text-xs text-zinc-500 font-mono">{lang}</span>
        )}
      </div>
      <pre className="bg-[#0a0a0d] p-4 overflow-x-auto">
        <code className="text-emerald-300 font-mono text-sm leading-relaxed">
          {content}
        </code>
      </pre>
    </div>
  );
}

function TableBlock({ lines }: { lines: string[] }) {
  // Separator rows look like |---|---| — all chars are |, -, :, space
  const isSeparator = (l: string) => l.trim().replace(/[|\s\-:]/g, "") === "";
  const contentLines = lines.filter((l) => !isSeparator(l));
  if (contentLines.length === 0) return null;

  const parseRow = (row: string) =>
    row.split("|").slice(1, -1).map((cell) => cell.trim());

  const headers = parseRow(contentLines[0]);
  const rows = contentLines.slice(1).map(parseRow);

  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr className="bg-indigo-500/10">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-indigo-300 font-semibold whitespace-nowrap border-b border-white/10"
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
                <td
                  key={ci}
                  className="px-4 py-2.5 text-zinc-300 border-b border-white/5"
                >
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

function LineBlock({
  line,
  isLast,
  isTyping,
}: {
  line: string;
  isLast: boolean;
  isTyping: boolean;
}) {

  if (line.startsWith("> ")) {
      return (
        <blockquote className="border-l-4 border-indigo-500/50 pl-4 py-1 my-3 bg-indigo-950/20 rounded-r-lg">
          <p className="text-zinc-400 italic text-sm">{renderInline(line.slice(2))}</p>
        </blockquote>
      );
    }
    
    if (line.trim() === "---") {
        return <hr className="border-white/10 my-6" />;
      }

  if (!line.trim()) return <div className="h-4" />;

  if (line.startsWith("### ")) {
    return (
      <h3 className="text-xl font-bold text-white mt-8 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block shrink-0" />
        {renderInline(line.replace(/^### /, ""))}
      </h3>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <h2 className="text-2xl font-extrabold text-white mt-8 mb-4">
        {renderInline(line.replace(/^## /, ""))}
      </h2>
    );
  }
  if (line.startsWith("# ")) {
    return (
      <h1 className="text-3xl font-extrabold text-white mt-8 mb-4">
        {renderInline(line.replace(/^# /, ""))}
      </h1>
    );
  }

  // Unordered list
  if (line.startsWith("- ") || line.startsWith("* ")) {
    return (
      <div className="flex items-start gap-3 my-2 ml-8">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2.5 shrink-0" />
        <p className="flex-1">{renderInline(line.slice(2))}</p>
      </div>
    );
  }

  // Ordered list: "1. text"
  const numMatch = line.match(/^(\d+)\.\s+(.+)/);
  if (numMatch) {
    return (
      <div className="flex items-start gap-3 my-2 ml-2">
        <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold mt-0.5">
          {numMatch[1]}
        </span>
        <p className="flex-1">{renderInline(numMatch[2])}</p>
      </div>
    );
  }

  return (
    <p className="my-3">
      {renderInline(line)}
      {isTyping && isLast && <Cursor />}
    </p>
  );
}

// ─── Public component ─────────────────────────────────────────────────────
export function MarkdownRenderer({
  content,
  isTyping = false,
}: {
  content: string;
  isTyping?: boolean;
}) {
  const blocks = parseBlocks(content);

  return (
    <div className="text-base sm:text-lg leading-relaxed text-zinc-300">
      {blocks.map((block, i) => {
        const isLast = i === blocks.length - 1;

        if (block.type === "code") {
          return <CodeBlock key={i} lang={block.lang} content={block.content} />;
        }
        if (block.type === "image") {
          return (
            <div key={i} className="my-4 flex justify-center">
              <img
                src={block.src}
                alt={block.alt}
                className="max-w-full rounded-xl border border-white/10 shadow-lg"
                loading="lazy"
              />
            </div>
          );
        }
        if (block.type === "table") {
          return <TableBlock key={i} lines={block.lines} />;
        }
        return (
          <LineBlock
            key={i}
            line={block.content}
            isLast={isLast}
            isTyping={isTyping}
          />
        );
      })}
      {isTyping && !content && <Cursor />}
    </div>
  );
}