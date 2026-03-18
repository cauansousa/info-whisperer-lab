import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Library } from "@/types";
import { BookOpen, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";

export default function UserLibraries() {
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadLibraries = async () => {
    const res = await api.getAllowedLibraries();
    const details = await Promise.all(
      res.library_ids.map((id: string) =>
        api.getLibrary(id).catch(() => ({ id, name: id.slice(0, 8) + "…", description: "" } as Library))
      )
    );
    setLibraries(details);
  };

  useEffect(() => {
    loadLibraries()
      .catch(() => toast.error("Failed to load libraries"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.createLibrary(name.trim(), description.trim() || undefined);
      await loadLibraries();
      setCreateOpen(false);
      setName("");
      setDescription("");
      toast.success("Library created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create library");
    } finally {
      setCreating(false);
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">My Libraries</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Library
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Library</DialogTitle>
              <DialogDescription>A personal library only you can access by default.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="My Research"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Input
                  placeholder="What is this library about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={creating || !name.trim()}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {libraries.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <BookOpen className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm mb-4">You don't have access to any libraries yet.</p>
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create your first library
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {libraries.map((lib) => (
            <div
              key={lib.id}
              onClick={() => navigate(`/app/libraries/${lib.id}`)}
              className="rounded-xl border border-border/30 bg-card/50 p-5 cursor-pointer hover:border-primary/40 hover:bg-card/80 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{lib.name}</h3>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
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
