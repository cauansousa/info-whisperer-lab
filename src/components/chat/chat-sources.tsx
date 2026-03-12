"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronRight } from "lucide-react";
import type { SourceItem } from "@/types/api";

interface ChatSourcesProps {
  sources: SourceItem[];
}

export function ChatSources({ sources }: ChatSourcesProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-muted/40 max-w-[90%]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Sources ({sources.length})
      </button>
      {expanded && (
        <div className="border-t px-3 py-2 space-y-1.5">
          {sources.map((source, idx) => {
            const meta = source.metadata as Record<string, unknown> | undefined;
            const page = meta?.page != null ? String(meta.page) : undefined;
            const section = meta?.section != null ? String(meta.section) : undefined;

            return (
              <div
                key={`${source.document_id}-${idx}`}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-medium text-foreground truncate block">
                    {source.document_title}
                  </span>
                  {(page || section) && (
                    <span className="text-[10px]">
                      {section ? String(section) : ""}
                      {section && page ? " · " : ""}
                      {page ? `p. ${page}` : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
