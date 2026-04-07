import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import type { Profile, Invitation } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Copy, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600",
  "bg-rose-600", "bg-cyan-600", "bg-fuchsia-600", "bg-teal-600",
];

function hashColor(email: string) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    Promise.all([api.getUsers(), api.getTenantInvitations()])
      .then(([u, inv]) => { setUsers(u); setInvitations(inv); })
      .catch(() => toast.error("Falha ao carregar organização"))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() =>
    memberSearch.length === 0
      ? users
      : users.filter((u) => u.email.toLowerCase().includes(memberSearch.toLowerCase())),
    [users, memberSearch]
  );

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
      toast.success("Convite enviado");
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar convite");
    } finally {
      setInviting(false);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      const updated = await api.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => u.id === userId ? updated : u));
      toast.success("Função atualizada");
    } catch (err: any) {
      toast.error(err.message || "Falha ao atualizar função");
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado");
  };

  const pendingInvites = invitations.filter((i) => i.status === "pending");

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Organização</h1>
        {hasRole("admin") && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setCreatedLink(""); }}>
            <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 mr-1" /> Convidar usuário</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Convidar usuário</DialogTitle><DialogDescription>Envie um convite para entrar no seu workspace.</DialogDescription></DialogHeader>
              {createdLink ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Convite criado! Compartilhe este link:</p>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={createdLink} className="bg-secondary/20 border-border/40 text-xs font-mono" />
                    <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(createdLink); toast.success("Copiado"); }}><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-email">E-mail</Label>
                    <Input id="inv-email" type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="usuario@empresa.com" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Função</Label>
                    <Select value={invRole} onValueChange={setInvRole}>
                      <SelectTrigger className="bg-secondary/20 border-border/40"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="member">Membro</SelectItem><SelectItem value="manager">Gerente</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={inviting} className="w-full">
                    {inviting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : "Enviar convite"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Member search */}
      <div className="mb-4 max-w-xs relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
        <Input
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          placeholder="Buscar membros..."
          className="h-9 pl-8 text-xs bg-secondary/20 border-border/30"
        />
      </div>

      {/* Users table */}
      <div className="overflow-auto rounded-lg border border-border/30 mb-8">
        <table className="w-full text-sm">
          <thead className="border-b border-border/30 bg-secondary/20">
            <tr><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Usuário</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Entrada</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Função</th></tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-secondary/10">
                <td className="px-4 py-2 flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium text-white ${hashColor(u.email)}`}>{u.email.slice(0, 2).toUpperCase()}</div>
                  <span>{u.email}</span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  {hasRole("admin") && u.id !== me?.profile.id ? (
                    <Select value={u.role} onValueChange={(r) => updateRole(u.id, r)}>
                      <SelectTrigger className="w-28 bg-secondary/20 border-border/30 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="member">Membro</SelectItem><SelectItem value="manager">Gerente</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
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
          <h2 className="font-display text-lg font-semibold mb-3">Convites pendentes</h2>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-card/30 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm">{inv.email}</span>
                  <Badge variant="outline" className="text-[10px]">{inv.role}</Badge>
                  <span className="text-[10px] text-muted-foreground">expira em {new Date(inv.expires_at).toLocaleDateString()}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyLink(inv.token)}>
                  <Copy className="h-3 w-3 mr-1" /> Copiar link
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
