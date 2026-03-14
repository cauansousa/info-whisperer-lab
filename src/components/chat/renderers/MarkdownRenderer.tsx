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
    if (m[1]) parts.push(<strong key={key++} className="font-semibold">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={key++}>{m[4]}</em>);
    else if (m[5]) parts.push(<code key={key++} className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs font-mono text-foreground/90">{m[6]}</code>);
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
      const cls = lvl === 1 ? "text-xl font-bold text-foreground mb-3" : lvl === 2 ? "text-lg font-semibold text-foreground mb-2" : "text-base font-medium text-foreground mb-2";
      const Tag = lvl === 1 ? "h1" : lvl === 2 ? "h2" : "h3";
      elements.push(<Tag key={key++} className={cls}>{renderInline(h[2])}</Tag>);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={key++} className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground text-sm mb-3">
          <p>{renderInline(trimmed.slice(2))}</p>
        </blockquote>
      );
      continue;
    }

    elements.push(<p key={key++} className="text-sm text-foreground/80 mb-3 leading-relaxed">{renderInline(trimmed)}</p>);
  }
  return elements;
}

export default function MarkdownRenderer({ content }: Props) {
  return <div className="prose prose-invert prose-sm max-w-none">{renderMarkdown(content)}</div>;
}
