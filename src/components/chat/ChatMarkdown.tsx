import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  content: string;
}

export default function ChatMarkdown({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-base font-bold text-foreground mb-2 mt-3 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-semibold text-foreground mb-1.5 mt-2.5 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-medium text-foreground mb-1 mt-2 first:mt-0">{children}</h3>,
        p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-outside ml-4 text-sm mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside ml-4 text-sm mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-2 text-muted-foreground text-sm italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-border/30 my-3" />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary transition-colors">
            {children}
          </a>
        ),
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          const codeStr = String(children).replace(/\n$/, "");

          if (match) {
            return (
              <div className="my-2 rounded-lg overflow-hidden border border-border/30">
                <div className="flex items-center bg-secondary/40 px-3 py-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{match[1]}</span>
                </div>
                <SyntaxHighlighter
                  language={match[1]}
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
                  {codeStr}
                </SyntaxHighlighter>
              </div>
            );
          }

          return (
            <code className="rounded bg-secondary/60 px-1 py-0.5 text-xs font-mono" {...props}>
              {children}
            </code>
          );
        },
        table: ({ children }) => (
          <div className="overflow-auto rounded-lg border border-border/30 my-2">
            <table className="w-full text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border-b border-border/30 bg-secondary/30 px-2.5 py-1.5 text-left text-xs font-medium text-muted-foreground">{children}</th>,
        td: ({ children }) => <td className="border-b border-border/20 px-2.5 py-1.5 text-xs">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
