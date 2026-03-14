import type { CanvasDocument } from "@/components/chat/CanvasPanel";

/**
 * Parses an agent message to detect if it contains a canvas-worthy document.
 * Looks for:
 * - Code blocks with language identifiers
 * - CSV/table data
 * - Long structured markdown content
 */
export function parseCanvasContent(messageId: string, content: string): CanvasDocument | null {
  // Check for code blocks with language
  const codeBlockMatch = content.match(/```(\w+)\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    const language = codeBlockMatch[1].toLowerCase();
    const code = codeBlockMatch[2].trim();

    // CSV detection
    if (language === "csv" || language === "spreadsheet") {
      return {
        id: messageId,
        type: "spreadsheet",
        title: "Spreadsheet",
        content: code,
      };
    }

    // Code detection
    const codeLanguages = [
      "python", "javascript", "typescript", "java", "csharp", "go", "rust",
      "ruby", "php", "sql", "html", "css", "json", "yaml", "bash", "shell",
      "jsx", "tsx", "c", "cpp", "swift", "kotlin",
    ];
    if (codeLanguages.includes(language)) {
      return {
        id: messageId,
        type: "code",
        title: `Code (${language})`,
        content: code,
        language,
      };
    }
  }

  // Check for markdown tables (at least 3 rows with pipes)
  const tableLines = content.split("\n").filter((l) => l.includes("|") && l.trim().startsWith("|"));
  if (tableLines.length >= 3) {
    // Convert markdown table to CSV
    const csvRows = tableLines
      .filter((l) => !l.match(/^\|\s*[-:]+/)) // skip separator rows
      .map((l) =>
        l
          .split("|")
          .filter((c) => c.trim() !== "")
          .map((c) => c.trim())
          .join(",")
      );
    if (csvRows.length >= 2) {
      return {
        id: messageId,
        type: "spreadsheet",
        title: "Table",
        content: csvRows.join("\n"),
      };
    }
  }

  // Check for long structured content (document-like)
  const hasHeadings = (content.match(/^#{1,3}\s/gm) || []).length >= 2;
  const isLong = content.length > 500;
  if (hasHeadings && isLong) {
    return {
      id: messageId,
      type: "richtext",
      title: "Document",
      content,
    };
  }

  return null;
}
