import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Library } from "@/types";
import { BookOpen, Plus, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";

interface LibraryFormState {
  name: string;
  description: string;
  system_prompt: string;
}

const emptyForm = (): LibraryFormState => ({ name: "", description: "", system_prompt: "" });

export default function Libraries() {
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<LibraryFormState>(emptyForm());

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Library | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<LibraryFormState>(emptyForm());

  useEffect(() => {
    api.getLibraries()
      .then((res) => setLibraries(res))
      .catch(() => toast.error("Failed to load libraries"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const lib = await api.createLibrary(
        createForm.name.trim(),
        createForm.description.trim() || undefined,
        createForm.system_prompt.trim() || undefined,
      );
      setLibraries((prev) => [lib, ...prev]);
      setCreateOpen(false);
      setCreateForm(emptyForm());
      toast.success("Library created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create library");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (lib: Library, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTarget(lib);
    setEditForm({
      name: lib.name,
      description: lib.description ?? "",
      system_prompt: lib.system_prompt ?? "",
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      const updated = await api.updateLibrary(editTarget.id, {
        name: editForm.name.trim() || undefined,
        description: editForm.description.trim() || undefined,
        system_prompt: editForm.system_prompt.trim() || undefined,
      });
      setLibraries((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setEditOpen(false);
      setEditTarget(null);
      toast.success("Library updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update library");
    } finally {
      setSaving(false);
    }
  };

  const textareaClass =
    "w-full rounded-lg border border-border/40 bg-secondary/20 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none min-h-[80px]";

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Libraries</h1>

        {/* ── Create dialog ── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New library</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Library</DialogTitle>
              <DialogDescription>Create a new knowledge library.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Library name"
                required
              />
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)"
                className={textareaClass}
              />
              <div className="space-y-1">
                <textarea
                  value={createForm.system_prompt}
                  onChange={(e) => setCreateForm((p) => ({ ...p, system_prompt: e.target.value }))}
                  placeholder="System prompt (optional) — appended after the agent's own prompt during queries"
                  className={`${textareaClass} min-h-[100px]`}
                />
                <p className="text-[11px] text-muted-foreground">
                  This context is automatically appended after the user&apos;s agent prompt on every query.
                </p>
              </div>
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Creating...</> : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Edit dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Library</DialogTitle>
            <DialogDescription>Update this library's name, description and system prompt.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Library name"
              required
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description (optional)"
              className={textareaClass}
            />
            <div className="space-y-1">
              <textarea
                value={editForm.system_prompt}
                onChange={(e) => setEditForm((p) => ({ ...p, system_prompt: e.target.value }))}
                placeholder="System prompt (optional) — appended after the agent's own prompt during queries"
                className={`${textareaClass} min-h-[100px]`}
              />
              <p className="text-[11px] text-muted-foreground">
                This context is automatically appended after the user&apos;s agent prompt on every query.
              </p>
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving...</> : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Library grid ── */}
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
              className="group relative cursor-pointer rounded-xl border border-border/30 bg-card/50 p-5 transition-colors hover:border-border/60 hover:bg-card/80"
            >
              {/* Edit button — visible on card hover */}
              <button
                onClick={(e) => openEdit(lib, e)}
                className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground group-hover:opacity-100"
                title="Edit library"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <h3 className="font-medium text-sm pr-6">{lib.name}</h3>
              {lib.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{lib.description}</p>
              )}
              {lib.system_prompt && (
                <p className="mt-1 text-[10px] text-muted-foreground/70 italic line-clamp-1">
                  &ldquo;{lib.system_prompt}&rdquo;
                </p>
              )}
              <p className="mt-2 text-[10px] text-muted-foreground">
                {new Date(lib.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
