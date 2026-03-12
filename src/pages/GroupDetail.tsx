import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { GroupMember, Profile } from "@/types";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    Promise.all([api.getGroupMembers(groupId), api.getUsers()])
      .then(([m, u]) => { setMembers(m); setUsers(u); })
      .catch(() => toast.error("Failed to load group"))
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleAdd = async () => {
    if (!groupId || !selectedUser) return;
    setAdding(true);
    try {
      const m = await api.addGroupMember(groupId, selectedUser);
      setMembers((prev) => [...prev, m]);
      setSelectedUser("");
      toast.success("Member added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const getUserInfo = (userId: string) => users.find((u) => u.id === userId);

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold mb-6">Group Members</h1>

      <div className="mb-6 flex items-end gap-3">
        <div className="flex-1 max-w-xs">
          <label className="mb-1 block text-xs text-muted-foreground">Add member</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="bg-secondary/20 border-border/40"><SelectValue placeholder="Select user" /></SelectTrigger>
            <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd} disabled={adding || !selectedUser} size="sm">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-1" />Add</>}
        </Button>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{members.length} member(s)</p>

      {members.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <div className="overflow-auto rounded-lg border border-border/30">
          <table className="w-full text-sm">
            <thead className="border-b border-border/30 bg-secondary/20">
              <tr><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">User</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Role</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Added</th></tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {members.map((m) => {
                const user = getUserInfo(m.user_id);
                return (
                  <tr key={m.id} className="hover:bg-secondary/10">
                    <td className="px-4 py-2 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">{user?.email?.slice(0, 2).toUpperCase() || "??"}</div>
                      <span>{user?.email || m.user_id}</span>
                    </td>
                    <td className="px-4 py-2"><Badge variant="outline" className="text-[10px]">{user?.role || "—"}</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
