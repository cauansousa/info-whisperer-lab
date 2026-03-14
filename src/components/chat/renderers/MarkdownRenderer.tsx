import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-foreground mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium text-foreground mb-2">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside text-sm text-foreground/80 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-foreground/80 mb-3 space-y-1">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground text-sm mb-3">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs font-mono text-foreground/90">{children}</code>;
            }
            return (
              <pre className="rounded-lg bg-secondary/40 p-3 overflow-auto mb-3">
                <code className="text-xs font-mono text-foreground/90">{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-auto rounded-lg border border-border/30 mb-3">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-border/30 bg-secondary/30 px-3 py-2 text-left text-xs font-medium text-muted-foreground">{children}</th>,
          td: ({ children }) => <td className="border-b border-border/20 px-3 py-2 text-xs text-foreground/80">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
