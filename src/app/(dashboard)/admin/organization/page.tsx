"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPatch } from "@/lib/api/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";
import { hasMinRole, roleLabel } from "@/lib/utils/roles";
import type { Profile, Invitation, Role } from "@/types/api";

export default function OrganizationPage() {
  const { data: me } = useProfile();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");

  const isAdmin = me ? hasMinRole(me.profile.role as Role, "admin") : false;
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<Profile[]>("/users"),
  });

  const { data: invitations } = useQuery({
    queryKey: ["invitations"],
    queryFn: () => apiFetch<Invitation[]>("/invitations"),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      apiPost("/auth/invitations", data),
    onSuccess: () => {
      toast.success("Invitation sent");
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("member");
    },
    onError: (err) => toast.error(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiPatch(`/auth/users/${userId}/role`, { role }),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const pendingInvites = invitations?.filter((i) => i.status === "pending") ?? [];

  function copyInvite(invite: Invitation) {
    const url = `${appOrigin}/invite?token=${invite.token}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Invite link copied"))
      .catch(() => toast.error("Failed to copy link"));
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organization</h1>
          <p className="text-sm text-muted-foreground">
            Manage users and invitations
          </p>
        </div>
        {isAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger render={<Button />}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite user
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a new user</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v ?? "member")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? "Sending..." : "Send invitation"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h3 className="text-sm font-semibold">
            Members ({users?.length ?? 0})
          </h3>
        </div>
        {loadingUsers ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="divide-y">
            {users?.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user.email.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
                {isAdmin && user.id !== me?.user_id ? (
                  <Select
                    value={user.role}
                    onValueChange={(role) =>
                      role && roleMutation.mutate({ userId: user.id, role })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">{roleLabel(user.role as Role)}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="rounded-md border">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">
              Pending invitations ({pendingInvites.length})
            </h3>
          </div>
          <div className="divide-y">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {formatDate(invite.expires_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{invite.role}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => copyInvite(invite)}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Copy link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
