import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

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

export function exportAsDocx(content: string, title: string) {
  // Export as HTML file (simple approach without complex docx lib)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#333}
h1{font-size:24px;border-bottom:2px solid #eee;padding-bottom:8px}
h2{font-size:20px;margin-top:24px}h3{font-size:16px}
p{line-height:1.6}table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f5f5f5}blockquote{border-left:3px solid #ccc;padding-left:12px;color:#666}</style>
</head><body>${content}</body></html>`;
  saveAs(new Blob([html], { type: "application/msword" }), `${title}.doc`);
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
