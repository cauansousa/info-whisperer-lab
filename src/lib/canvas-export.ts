import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export function exportAsXlsx(csvContent: string, title: string) {
  const rows = csvContent.trim().split("\n").map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) { cells.push(current.trim()); current = ""; }
      else current += char;
    }
    cells.push(current.trim());
    return cells;
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), `${title}.xlsx`);
}

export async function exportAsDocx(content: string, title: string) {
  const parseBoldRuns = (text: string): TextRun[] => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return new TextRun({ text: part.slice(2, -2), bold: true });
      }
      return new TextRun({ text: part });
    });
  };

  const lines = content.split("\n");
  const children: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      children.push(new Paragraph({ text: trimmed.slice(4), heading: HeadingLevel.HEADING_3 }));
    } else if (trimmed.startsWith("## ")) {
      children.push(new Paragraph({ text: trimmed.slice(3), heading: HeadingLevel.HEADING_2 }));
    } else if (trimmed.startsWith("# ")) {
      children.push(new Paragraph({ text: trimmed.slice(2), heading: HeadingLevel.HEADING_1 }));
    } else if (trimmed === "") {
      children.push(new Paragraph({ text: "" }));
    } else if (/^[-*+]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^[-*+]\s+/, "");
      const runs = parseBoldRuns(text);
      children.push(new Paragraph({
        children: runs,
        bullet: { level: 0 },
      }));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s+/, "");
      const runs = parseBoldRuns(text);
      children.push(new Paragraph({
        children: runs,
        numbering: { reference: "default-numbering", level: 0 },
      }));
    } else {
      const runs = parseBoldRuns(trimmed);
      children.push(new Paragraph({ children: runs }));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}.docx`);
}

export function exportAsMarkdown(content: string, title: string) {
  saveAs(new Blob([content], { type: "text/markdown;charset=utf-8" }), `${title}.md`);
}

export function exportAsCode(content: string, title: string, language?: string) {
  const extMap: Record<string, string> = {
    python: "py", javascript: "js", typescript: "ts", java: "java",
    csharp: "cs", go: "go", rust: "rs", ruby: "rb", php: "php",
    sql: "sql", html: "html", css: "css", json: "json", yaml: "yml",
    bash: "sh", shell: "sh",
  };
  const ext = extMap[language || ""] || "txt";
  saveAs(new Blob([content], { type: "text/plain;charset=utf-8" }), `${title}.${ext}`);
}
