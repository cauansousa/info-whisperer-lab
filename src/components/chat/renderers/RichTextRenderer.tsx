interface Props {
  content: string;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let last = 0;
  let m;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={key++} className="font-semibold text-foreground">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={key++} className="italic text-foreground/80">{m[4]}</em>);
    else if (m[5]) parts.push(<code key={key++} className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs font-mono">{m[6]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let inCode = false;
  let codeLines: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        elements.push(
          <pre key={key++} className="rounded-lg bg-secondary/40 p-3 overflow-auto mb-3">
            <code className="text-xs font-mono text-foreground/90">{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    const trimmed = line.trim();
    if (!trimmed) continue;

    const h = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      const lvl = h[1].length;
      const cls = lvl === 1
        ? "text-2xl font-bold text-foreground mb-4 pb-2 border-b border-border/20"
        : lvl === 2 ? "text-xl font-semibold text-foreground mb-3 mt-6"
        : "text-lg font-medium text-foreground mb-2 mt-4";
      const Tag = lvl === 1 ? "h1" : lvl === 2 ? "h2" : "h3";
      elements.push(<Tag key={key++} className={cls}>{renderInline(h[2])}</Tag>);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={key++} className="border-l-2 border-primary/40 pl-4 my-4 italic text-foreground/70">
          <p>{renderInline(trimmed.slice(2))}</p>
        </blockquote>
      );
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={key++} className="border-border/30 my-6" />);
      continue;
    }

    elements.push(<p key={key++} className="text-sm text-foreground/85 mb-4 leading-relaxed">{renderInline(trimmed)}</p>);
  }
  return elements;
}

export default function RichTextRenderer({ content }: Props) {
  return (
    <div className="rounded-lg border border-border/30 bg-secondary/10 p-6">
      <div className="prose prose-invert max-w-none">{renderMarkdown(content)}</div>
    </div>
  );
}
