import { useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  content: string;
}

interface Block {
  type: "code" | "text";
  content: string;
  language?: string;
}

function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(md)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", content: md.slice(lastIndex, match.index) });
    }
    blocks.push({ type: "code", content: match[2].trimEnd(), language: match[1] || "text" });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < md.length) {
    blocks.push({ type: "text", content: md.slice(lastIndex) });
  }
  return blocks;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Order matters: images before links, bold before italic, strikethrough, inline code
  const regex =
    /(!\[([^\]]*)\]\(([^)]+)\))|(\[([^\]]+)\]\(([^)]+)\))|(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(__(.+?)__)|(_(.+?)_)|(~~(.+?)~~)|(`(.+?)`)/g;
  let last = 0;
  let m;
  let key = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));

    if (m[1]) {
      // Image ![alt](src)
      parts.push(
        <img
          key={key++}
          src={m[3]}
          alt={m[2]}
          className="max-w-full rounded-md my-1 inline-block"
          loading="lazy"
        />
      );
    } else if (m[4]) {
      // Link [text](url)
      parts.push(
        <a
          key={key++}
          href={m[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-primary transition-colors text-primary/80"
        >
          {m[5]}
        </a>
      );
    } else if (m[7]) {
      // Bold+Italic ***text***
      parts.push(
        <strong key={key++} className="font-semibold">
          <em className="italic">{m[8]}</em>
        </strong>
      );
    } else if (m[9]) {
      // Bold **text**
      parts.push(<strong key={key++} className="font-semibold">{m[10]}</strong>);
    } else if (m[11]) {
      // Italic *text*
      parts.push(<em key={key++} className="italic">{m[12]}</em>);
    } else if (m[13]) {
      // Bold __text__
      parts.push(<strong key={key++} className="font-semibold">{m[14]}</strong>);
    } else if (m[15]) {
      // Italic _text_
      parts.push(<em key={key++} className="italic">{m[16]}</em>);
    } else if (m[17]) {
      // Strikethrough ~~text~~
      parts.push(<del key={key++} className="line-through text-muted-foreground">{m[18]}</del>);
    } else if (m[19]) {
      // Inline code `text`
      parts.push(
        <code
          key={key++}
          className="rounded bg-secondary/60 px-1 py-0.5 text-xs font-mono"
        >
          {m[20]}
        </code>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Parse a markdown table (lines with |) into header + rows */
function parseTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;
  const parse = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");

  const headers = parse(lines[0]);
  // lines[1] should be separator like |---|---|
  if (!lines[1].match(/^\|?\s*[-:]+/)) return null;

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = parse(lines[i]);
    if (cells.length > 0) rows.push(cells);
  }
  return { headers, rows };
}

function renderTable(headers: string[], rows: string[][]): React.ReactNode {
  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-border/30">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-secondary/40">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-1.5 text-left font-semibold text-foreground/90 border-b border-border/20">
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "" : "bg-secondary/20"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5 text-foreground/80 border-b border-border/10">
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

function renderTextBlock(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listStack: { ordered: boolean; indent: number; items: { text: string; checked?: boolean | null }[] }[] = [];
  let tableLines: string[] = [];
  let key = 0;

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const table = parseTable(tableLines);
    if (table) {
      elements.push(<div key={key++}>{renderTable(table.headers, table.rows)}</div>);
    }
    tableLines = [];
  };

  const flushList = () => {
    if (listStack.length === 0) return;
    // Render all accumulated list items as a flat list (simplified)
    for (const list of listStack) {
      const Tag = list.ordered ? "ol" : "ul";
      const cls = list.ordered
        ? "list-decimal list-outside ml-4 text-sm mb-2 space-y-0.5"
        : "list-disc list-outside ml-4 text-sm mb-2 space-y-0.5";
      elements.push(
        <Tag key={key++} className={cls}>
          {list.items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed">
              {item.checked !== null && item.checked !== undefined && (
                <input
                  type="checkbox"
                  checked={item.checked}
                  readOnly
                  className="mr-1.5 align-middle pointer-events-none"
                />
              )}
              {renderInline(item.text)}
            </li>
          ))}
        </Tag>
      );
    }
    listStack = [];
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    // Table detection: line starts/contains | and looks like a table row
    if (trimmed.startsWith("|") || (trimmed.includes("|") && tableLines.length > 0)) {
      flushList();
      tableLines.push(trimmed);
      continue;
    } else if (tableLines.length > 0) {
      flushTable();
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const cls = [
        "text-base font-bold text-foreground mb-2 mt-3 first:mt-0",
        "text-sm font-semibold text-foreground mb-1.5 mt-2.5 first:mt-0",
        "text-sm font-medium text-foreground mb-1 mt-2 first:mt-0",
        "text-xs font-semibold text-foreground mb-1 mt-2 first:mt-0 uppercase tracking-wide",
        "text-xs font-medium text-foreground mb-1 mt-1.5 first:mt-0",
        "text-xs font-medium text-muted-foreground mb-1 mt-1 first:mt-0",
      ][Math.min(level - 1, 5)];
      const Tag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
      elements.push(<Tag key={key++} className={cls}>{renderInline(headingText)}</Tag>);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      // Collect consecutive blockquote lines
      const bqLines: string[] = [trimmed.slice(2)];
      while (idx + 1 < lines.length && lines[idx + 1].trim().startsWith("> ")) {
        idx++;
        bqLines.push(lines[idx].trim().slice(2));
      }
      elements.push(
        <blockquote
          key={key++}
          className="border-l-2 border-muted-foreground/30 pl-3 my-2 text-muted-foreground text-sm italic"
        >
          {bqLines.map((bql, i) => (
            <p key={i}>{renderInline(bql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // HR
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={key++} className="border-border/30 my-3" />);
      continue;
    }

    // Task list item: - [x] or - [ ]
    const taskMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      const checked = taskMatch[1].toLowerCase() === "x";
      if (listStack.length === 0 || listStack[listStack.length - 1].ordered) {
        flushList();
        listStack.push({ ordered: false, indent: 0, items: [] });
      }
      listStack[listStack.length - 1].items.push({ text: taskMatch[2], checked });
      continue;
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (listStack.length === 0 || listStack[listStack.length - 1].ordered) {
        if (listStack.length > 0 && listStack[listStack.length - 1].ordered) flushList();
        listStack.push({ ordered: false, indent: 0, items: [] });
      }
      listStack[listStack.length - 1].items.push({ text: ulMatch[1] });
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (listStack.length === 0 || !listStack[listStack.length - 1].ordered) {
        if (listStack.length > 0 && !listStack[listStack.length - 1].ordered) flushList();
        listStack.push({ ordered: true, indent: 0, items: [] });
      }
      listStack[listStack.length - 1].items.push({ text: olMatch[1] });
      continue;
    }

    // Definition-like or footnote — render as paragraph
    flushList();
    elements.push(
      <p key={key++} className="text-sm leading-relaxed mb-2 last:mb-0">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushTable();
  flushList();
  return elements;
}

export default function ChatMarkdown({ content }: Props) {
  const rendered = useMemo(() => {
    const blocks = parseBlocks(content);
    return blocks.map((block, i) => {
      if (block.type === "code") {
        return (
          <div key={i} className="my-2 rounded-lg overflow-hidden border border-border/30">
            <div className="flex items-center bg-secondary/40 px-3 py-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                {block.language}
              </span>
            </div>
            <SyntaxHighlighter
              language={block.language || "text"}
              style={oneDark}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                background: "hsl(0 0% 5%)",
                fontSize: "11px",
                lineHeight: "1.5",
                padding: "12px",
              }}
            >
              {block.content}
            </SyntaxHighlighter>
          </div>
        );
      }
      return <div key={i}>{renderTextBlock(block.content)}</div>;
    });
  }, [content]);

  return <div>{rendered}</div>;
}
