// src/components/ai/MarkdownRenderer.tsx
import React from "react";

function Cursor() {
  return (
    <span className="inline-block w-0.5 h-[1.1em] bg-neutral-400 ml-0.5 align-middle animate-[blink_0.7s_steps(1)_infinite]" />
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={i}
              className="bg-neutral-800 text-sky-300 px-1.5 py-0.5 rounded text-[0.875em] font-mono border border-neutral-700"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-neutral-100 font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
          return (
            <em key={i} className="text-neutral-300 italic">
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
        if (lines[i].trimStart().startsWith("```")) { closed = true; i++; break; }
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
      while (i < lines.length && lines[i].startsWith("|")) { tableLines.push(lines[i]); i++; }
      blocks.push({ type: "table", lines: tableLines });
      continue;
    }

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

function CodeBlock({ lang, content }: { lang: string; content: string }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-neutral-800">
      <div className="bg-neutral-900 px-4 py-2 flex items-center gap-2 border-b border-neutral-800">
        <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
        <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
        {lang && <span className="ml-2 text-xs text-neutral-500 font-mono">{lang}</span>}
      </div>
      <pre className="bg-[#0c0c0c] p-4 overflow-x-auto">
        <code className="text-sky-300 font-mono text-sm leading-relaxed">{content}</code>
      </pre>
    </div>
  );
}

function TableBlock({ lines }: { lines: string[] }) {
  const isSeparator = (l: string) => l.trim().replace(/[|\s\-:]/g, "") === "";
  const contentLines = lines.filter((l) => !isSeparator(l));
  if (contentLines.length === 0) return null;

  const parseRow = (row: string) =>
    row.split("|").slice(1, -1).map((cell) => cell.trim());

  const headers = parseRow(contentLines[0]);
  const rows = contentLines.slice(1).map(parseRow);

  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr className="bg-neutral-800/60">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left text-neutral-300 font-medium whitespace-nowrap border-b border-neutral-800">
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "" : "bg-neutral-900/30"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-neutral-400 border-b border-neutral-800/50">
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

function LineBlock({ line, isLast, isTyping }: { line: string; isLast: boolean; isTyping: boolean }) {
  if (line.startsWith("> ")) {
    return (
      <blockquote className="border-l-2 border-neutral-600 pl-4 py-0.5 my-3">
        <p className="text-neutral-500 italic text-sm">{renderInline(line.slice(2))}</p>
      </blockquote>
    );
  }

  if (line.trim() === "---") return <hr className="border-neutral-800 my-5" />;

  if (!line.trim()) return <div className="h-3" />;

  if (line.startsWith("### ")) {
    return (
      <h3 className="text-base sm:text-lg font-semibold text-neutral-100 mt-6 mb-2.5">
        {renderInline(line.replace(/^### /, ""))}
      </h3>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <h2 className="text-lg sm:text-xl font-semibold text-neutral-100 mt-7 mb-3">
        {renderInline(line.replace(/^## /, ""))}
      </h2>
    );
  }
  if (line.startsWith("# ")) {
    return (
      <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 mt-7 mb-3">
        {renderInline(line.replace(/^# /, ""))}
      </h1>
    );
  }

  if (line.startsWith("- ") || line.startsWith("* ")) {
    return (
      <div className="flex items-start gap-3 my-1.5 ml-4">
        <span className="w-1 h-1 rounded-full bg-neutral-500 mt-[9px] shrink-0" />
        <p className="flex-1 text-neutral-300">{renderInline(line.slice(2))}</p>
      </div>
    );
  }

  const numMatch = line.match(/^(\d+)\.\s+(.+)/);
  if (numMatch) {
    return (
      <div className="flex items-start gap-3 my-1.5 ml-2">
        <span className="shrink-0 text-xs text-neutral-500 font-medium mt-0.5 w-5 text-right">
          {numMatch[1]}.
        </span>
        <p className="flex-1 text-neutral-300">{renderInline(numMatch[2])}</p>
      </div>
    );
  }

  return (
    <p className="my-2.5 text-neutral-300 leading-relaxed">
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
    <div className="text-sm sm:text-base leading-relaxed text-neutral-300">
      {blocks.map((block, i) => {
        const isLast = i === blocks.length - 1;
        if (block.type === "code") return <CodeBlock key={i} lang={block.lang} content={block.content} />;
        if (block.type === "image") {
          return (
            <div key={i} className="my-4 flex justify-center">
              <img src={block.src} alt={block.alt} className="max-w-full rounded-lg border border-neutral-800" loading="lazy" />
            </div>
          );
        }
        if (block.type === "table") return <TableBlock key={i} lines={block.lines} />;
        return <LineBlock key={i} line={block.content} isLast={isLast} isTyping={isTyping} />;
      })}
      {isTyping && !content && <Cursor />}
    </div>
  );
}