import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Profile, Invitation } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Copy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Organization() {
  const { me, hasRole } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [createdLink, setCreatedLink] = useState("");

  useEffect(() => {
    Promise.all([api.getUsers(), api.getTenantInvitations()])
      .then(([u, inv]) => { setUsers(u); setInvitations(inv); })
      .catch(() => toast.error("Failed to load organization"))
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setCreatedLink("");
    try {
      const inv = await api.inviteUser(invEmail.trim(), invRole);
      setInvitations((prev) => [inv, ...prev]);
      const link = `${window.location.origin}/invite?token=${inv.token}`;
      setCreatedLink(link);
      setInvEmail("");
      toast.success("Invitation sent");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      const updated = await api.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => u.id === userId ? updated : u));
      toast.success("Role updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  const pendingInvites = invitations.filter((i) => i.status === "pending");

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Organization</h1>
        {hasRole("admin") && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setCreatedLink(""); }}>
            <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 mr-1" /> Invite user</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite user</DialogTitle><DialogDescription>Send an invitation to join your workspace.</DialogDescription></DialogHeader>
              {createdLink ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Invitation created! Share this link:</p>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={createdLink} className="bg-secondary/20 border-border/40 text-xs font-mono" />
                    <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(createdLink); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <Input type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="Email address" required />
                  <Select value={invRole} onValueChange={setInvRole}>
                    <SelectTrigger className="bg-secondary/20 border-border/40"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="member">Member</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                  </Select>
                  <Button type="submit" disabled={inviting} className="w-full">
                    {inviting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Send invitation"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Users table */}
      <div className="overflow-auto rounded-lg border border-border/30 mb-8">
        <table className="w-full text-sm">
          <thead className="border-b border-border/30 bg-secondary/20">
            <tr><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">User</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Joined</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Role</th></tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-secondary/10">
                <td className="px-4 py-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">{u.email.slice(0, 2).toUpperCase()}</div>
                  <span>{u.email}</span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  {hasRole("admin") && u.id !== me?.profile.id ? (
                    <Select value={u.role} onValueChange={(r) => updateRole(u.id, r)}>
                      <SelectTrigger className="w-28 bg-secondary/20 border-border/30 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="member">Member</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Pending invitations</h2>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-card/30 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm">{inv.email}</span>
                  <Badge variant="outline" className="text-[10px]">{inv.role}</Badge>
                  <span className="text-[10px] text-muted-foreground">expires {new Date(inv.expires_at).toLocaleDateString()}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyLink(inv.token)}>
                  <Copy className="h-3 w-3 mr-1" /> Copy link
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
