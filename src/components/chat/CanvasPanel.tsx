import { useState } from "react";
import { X, Download, FileText, Table2, Code2, FileCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarkdownRenderer from "./renderers/MarkdownRenderer";
import CodeRenderer from "./renderers/CodeRenderer";
import SpreadsheetRenderer from "./renderers/SpreadsheetRenderer";
import RichTextRenderer from "./renderers/RichTextRenderer";
import { exportAsDocx, exportAsXlsx, exportAsMarkdown, exportAsCode } from "@/lib/canvas-export";

export interface CanvasDocument {
  id: string;
  type: "markdown" | "code" | "spreadsheet" | "richtext";
  title: string;
  content: string;
  language?: string;
}

interface CanvasPanelProps {
  document: CanvasDocument | null;
  onClose: () => void;
}

export default function CanvasPanel({ document, onClose }: CanvasPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!document) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(document.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    switch (document.type) {
      case "spreadsheet":
        exportAsXlsx(document.content, document.title);
        break;
      case "richtext":
        exportAsDocx(document.content, document.title);
        break;
      case "markdown":
        exportAsMarkdown(document.content, document.title);
        break;
      case "code":
        exportAsCode(document.content, document.title, document.language);
        break;
    }
  };

  const typeIcon = {
    markdown: <FileText className="h-3.5 w-3.5" />,
    code: <Code2 className="h-3.5 w-3.5" />,
    spreadsheet: <Table2 className="h-3.5 w-3.5" />,
    richtext: <FileCode className="h-3.5 w-3.5" />,
  };

  const typeLabel = {
    markdown: "Markdown",
    code: "Code",
    spreadsheet: "Spreadsheet",
    richtext: "Document",
  };

  return (
    <div className="flex h-full w-[45%] min-w-[380px] flex-col border-l border-border/30 bg-card/40 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-secondary/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {typeIcon[document.type]}
            {typeLabel[document.type]}
          </span>
          <span className="text-sm font-medium text-foreground/90 truncate max-w-[180px]">
            {document.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {document.type === "markdown" && <MarkdownRenderer content={document.content} />}
        {document.type === "code" && <CodeRenderer content={document.content} language={document.language} />}
        {document.type === "spreadsheet" && <SpreadsheetRenderer content={document.content} />}
        {document.type === "richtext" && <RichTextRenderer content={document.content} />}
      </div>
    </div>
  );
}
