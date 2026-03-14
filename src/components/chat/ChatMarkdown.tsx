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
  // Bold, italic, inline code, links
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let last = 0;
  let m;
  let key = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={key++} className="font-semibold">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={key++} className="italic">{m[4]}</em>);
    else if (m[5]) parts.push(<code key={key++} className="rounded bg-secondary/60 px-1 py-0.5 text-xs font-mono">{m[6]}</code>);
    else if (m[7]) parts.push(<a key={key++} href={m[9]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary transition-colors">{m[8]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderTextBlock(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: { ordered: boolean; text: string }[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const ordered = listItems[0].ordered;
    const Tag = ordered ? "ol" : "ul";
    const cls = ordered
      ? "list-decimal list-outside ml-4 text-sm mb-2 space-y-0.5"
      : "list-disc list-outside ml-4 text-sm mb-2 space-y-0.5";
    elements.push(
      <Tag key={key++} className={cls}>
        {listItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed">{renderInline(item.text)}</li>
        ))}
      </Tag>
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); continue; }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      if (level === 1) elements.push(<h1 key={key++} className="text-base font-bold text-foreground mb-2 mt-3 first:mt-0">{renderInline(text)}</h1>);
      else if (level === 2) elements.push(<h2 key={key++} className="text-sm font-semibold text-foreground mb-1.5 mt-2.5 first:mt-0">{renderInline(text)}</h2>);
      else elements.push(<h3 key={key++} className="text-sm font-medium text-foreground mb-1 mt-2 first:mt-0">{renderInline(text)}</h3>);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote key={key++} className="border-l-2 border-muted-foreground/30 pl-3 my-2 text-muted-foreground text-sm italic">
          <p>{renderInline(trimmed.slice(2))}</p>
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

    // Unordered list
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (listItems.length > 0 && listItems[0].ordered) flushList();
      listItems.push({ ordered: false, text: ulMatch[1] });
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (listItems.length > 0 && !listItems[0].ordered) flushList();
      listItems.push({ ordered: true, text: olMatch[1] });
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(<p key={key++} className="text-sm leading-relaxed mb-2 last:mb-0">{renderInline(trimmed)}</p>);
  }

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
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{block.language}</span>
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
