import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Group } from "@/types";
import { Users2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.getGroups().then(setGroups).catch(() => toast.error("Failed to load groups")).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const g = await api.createGroup(name.trim());
      setGroups((prev) => [g, ...prev]);
      setOpen(false);
      setName("");
      toast.success("Group created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Groups</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New group</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Group</DialogTitle><DialogDescription>Create a new user group.</DialogDescription></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" required />
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <Users2 className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">No groups yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.id} onClick={() => navigate(`/admin/groups/${g.id}`)} className="cursor-pointer rounded-xl border border-border/30 bg-card/50 p-5 transition-colors hover:border-border/60 hover:bg-card/80">
              <h3 className="font-medium text-sm">{g.name}</h3>
              <p className="mt-2 text-[10px] text-muted-foreground">{new Date(g.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
