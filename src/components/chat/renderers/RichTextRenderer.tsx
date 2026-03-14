import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
}

export default function RichTextRenderer({ content }: Props) {
  return (
    <div className="rounded-lg border border-border/30 bg-secondary/10 p-6">
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-foreground mb-4 pb-2 border-b border-border/20">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-medium text-foreground mb-2 mt-4">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-sm text-foreground/85 mb-4 leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-outside ml-5 text-sm text-foreground/85 mb-4 space-y-1.5">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-outside ml-5 text-sm text-foreground/85 mb-4 space-y-1.5">{children}</ol>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-3 border-primary/40 pl-4 my-4 italic text-foreground/70">{children}</blockquote>
            ),
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
            hr: () => <hr className="border-border/30 my-6" />,
            table: ({ children }) => (
              <div className="overflow-auto rounded border border-border/30 my-4">
                <table className="w-full text-sm">{children}</table>
              </div>
            ),
            th: ({ children }) => <th className="border-b border-border/30 bg-secondary/30 px-3 py-2 text-left text-xs font-medium">{children}</th>,
            td: ({ children }) => <td className="border-b border-border/20 px-3 py-2 text-xs">{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
