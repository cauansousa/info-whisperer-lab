import { useMemo } from "react";

interface Props {
  content: string;
}

function parseCSV(csv: string): string[][] {
  const lines = csv.trim().split("\n");
  return lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

function colLabel(index: number): string {
  let label = "";
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

export default function SpreadsheetRenderer({ content }: Props) {
  const rows = useMemo(() => parseCSV(content), [content]);
  const maxCols = useMemo(() => Math.max(...rows.map((r) => r.length), 0), [rows]);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Empty spreadsheet</p>;
  }

  const header = rows[0];
  const body = rows.slice(1);

  return (
    <div className="overflow-auto rounded-lg border border-border/30">
      <table className="w-full border-collapse text-xs font-mono">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-10 border-b border-r border-border/30 bg-secondary/50 px-2 py-1.5 text-center text-[10px] text-muted-foreground">
              #
            </th>
            {header.map((cell, i) => (
              <th
                key={i}
                className="border-b border-r border-border/30 bg-secondary/50 px-3 py-1.5 text-left font-medium text-foreground/80 min-w-[100px]"
              >
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground/60 mb-0.5">{colLabel(i)}</span>
                  {cell}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="hover:bg-secondary/20 transition-colors">
              <td className="sticky left-0 z-10 border-b border-r border-border/30 bg-card/60 px-2 py-1.5 text-center text-[10px] text-muted-foreground">
                {ri + 1}
              </td>
              {Array.from({ length: maxCols }, (_, ci) => (
                <td
                  key={ci}
                  className="border-b border-r border-border/20 px-3 py-1.5 text-foreground/80"
                >
                  {row[ci] || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
