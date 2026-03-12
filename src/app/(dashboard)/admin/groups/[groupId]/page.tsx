"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";
import { roleLabel } from "@/lib/utils/roles";
import type { Group, Role } from "@/types/api";

interface GroupMemberRow {
  id: string;
  user_id: string;
  created_at: string;
  profiles?: { id: string; email: string; role: string };
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => apiFetch<Group>(`/groups`).then((groups) =>
      (groups as unknown as Group[]).find((g) => g.id === groupId)
    ),
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: () => apiFetch<GroupMemberRow[]>(`/groups/${groupId}/members`),
  });

  const addMutation = useMutation({
    mutationFn: (data: { user_id: string }) =>
      apiPost(`/groups/${groupId}/members`, data),
    onSuccess: () => {
      toast.success("Member added");
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      setUserId("");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{group?.name ?? "Group"}</h1>
        <p className="text-sm text-muted-foreground">Manage group members</p>
      </div>

      {/* Add Member */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addMutation.mutate({ user_id: userId });
        }}
        className="flex items-end gap-3"
      >
        <div className="flex-1 space-y-1">
          <Label className="text-xs">User ID</Label>
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID to add"
            required
          />
        </div>
        <Button type="submit" disabled={addMutation.isPending}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </form>

      {/* Members List */}
      <div className="rounded-md border">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h3 className="text-sm font-semibold">
            Members ({members?.length ?? 0})
          </h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : !members || members.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No members yet. Add someone above.
          </div>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {(member.profiles?.email ?? "?")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.profiles?.email ?? member.user_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDate(member.created_at)}
                    </p>
                  </div>
                </div>
                {member.profiles?.role && (
                  <Badge variant="secondary">
                    {roleLabel(member.profiles.role as Role)}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
