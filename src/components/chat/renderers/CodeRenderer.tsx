import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  content: string;
  language?: string;
}

export default function CodeRenderer({ content, language = "text" }: Props) {
  return (
    <div className="rounded-lg overflow-hidden border border-border/30">
      <div className="flex items-center justify-between bg-secondary/40 px-3 py-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {language}
        </span>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "hsl(0 0% 5%)",
          fontSize: "12px",
          lineHeight: "1.6",
        }}
        showLineNumbers
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}
