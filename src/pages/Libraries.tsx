import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Library } from "@/types";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";

export default function Libraries() {
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    api.getLibraries()
      .then(setLibraries)
      .catch(() => toast.error("Failed to load libraries"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const lib = await api.createLibrary(name.trim(), desc.trim() || undefined);
      setLibraries((prev) => [lib, ...prev]);
      setOpen(false);
      setName("");
      setDesc("");
      toast.success("Library created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create library");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Libraries</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New library</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Library</DialogTitle>
              <DialogDescription>Create a new knowledge library.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Library name" required />
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-lg border border-border/40 bg-secondary/20 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none min-h-[80px]"
              />
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : libraries.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <BookOpen className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">No libraries yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {libraries.map((lib) => (
            <div
              key={lib.id}
              onClick={() => navigate(`/admin/libraries/${lib.id}`)}
              className="cursor-pointer rounded-xl border border-border/30 bg-card/50 p-5 transition-colors hover:border-border/60 hover:bg-card/80"
            >
              <h3 className="font-medium text-sm">{lib.name}</h3>
              {lib.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{lib.description}</p>}
              <p className="mt-3 text-[10px] text-muted-foreground">{new Date(lib.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
