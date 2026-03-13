import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Library } from "@/types";
import { BookOpen, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function UserLibraries() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllowedLibraries()
      .then(async (res) => {
        // Fetch details for each allowed library
        const details = await Promise.all(
          res.library_ids.map((id: string) =>
            api.getLibrary(id).catch(() => ({ id, name: id.slice(0, 8) + "…", description: "" } as Library))
          )
        );
        setLibraries(details);
      })
      .catch(() => toast.error("Failed to load libraries"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold mb-6">My Libraries</h1>

      {libraries.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <BookOpen className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">You don't have access to any libraries yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {libraries.map((lib) => (
            <div key={lib.id} className="rounded-xl border border-border/30 bg-card/50 p-5">
              <h3 className="font-medium text-sm">{lib.name}</h3>
              {lib.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{lib.description}</p>
              )}
              <Badge variant="outline" className="mt-3 text-[10px]">
                {lib.id.slice(0, 8)}…
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
