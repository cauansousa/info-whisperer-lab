"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Plus } from "lucide-react";
import { toast } from "sonner";
import type {
  PermissionListItem,
  CreatePermissionRequest,
  Profile,
  Group,
} from "@/types/api";
import { SectionCard } from "@/components/layout/section-card";
import { PageContainer } from "@/components/layout/page-container";

export default function PermissionsPage() {
  const params = useParams();
  const libraryId = params.libraryId as string;
  const queryClient = useQueryClient();

  const [subjectType, setSubjectType] = useState<string>("user");
  const [subjectId, setSubjectId] = useState("");
  const [accessLevel, setAccessLevel] = useState<string>("read");
  const [userSearch, setUserSearch] = useState("");

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["library-permissions", libraryId],
    queryFn: () =>
      apiFetch<PermissionListItem[]>(`/libraries/${libraryId}/permissions`),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<Profile[]>("/users"),
  });

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => apiFetch<Group[]>("/groups"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePermissionRequest) =>
      apiPost(`/libraries/${libraryId}/permissions`, data),
    onSuccess: () => {
      toast.success("Permission added");
      queryClient.invalidateQueries({
        queryKey: ["library-permissions", libraryId],
      });
      setSubjectId("");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (subjectType === "user" && !subjectId) {
      toast.error("Select a user to add");
      return;
    }

    createMutation.mutate({
      library_id: libraryId,
      subject_type: subjectType as "user" | "group" | "role",
      subject_id: subjectId,
      access_level: accessLevel as "read" | "admin",
    });
  }

  // Reset selected subject when changing type
  useEffect(() => {
    setSubjectId("");
    setUserSearch("");
  }, [subjectType]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!users) return [];
    if (term.length < 2) return [];
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        (u.name ?? "").toLowerCase().includes(term)
    );
  }, [users, userSearch]);

  const userLabelById = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((u) => {
      map.set(u.id, u.email || u.name || u.id);
    });
    return map;
  }, [users]);

  const groupLabelById = useMemo(() => {
    const map = new Map<string, string>();
    groups?.forEach((g) => map.set(g.id, g.name));
    return map;
  }, [groups]);

  function renderSubject(perm: PermissionListItem) {
    if (perm.subject_type === "user") {
      return userLabelById.get(perm.subject_id) || perm.subject_id;
    }
    if (perm.subject_type === "group") {
      return groupLabelById.get(perm.subject_id) || perm.subject_id;
    }
    return perm.subject_id; // role
  }

  return (
    <PageContainer className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Library Permissions</h1>
        <p className="text-sm text-muted-foreground">Control who can access this library</p>
      </div>

      {/* Add Permission */}
      <SectionCard className="p-4 md:p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Add permission
        </div>
        <div className="grid gap-3 md:grid-cols-[160px_1fr_140px_120px] md:items-end">
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Subject</Label>
            <Select value={subjectType} onValueChange={(v) => setSubjectType(v ?? "user")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="role">Role</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {subjectType === "user" ? "Find user" : subjectType === "group" ? "Group" : "Role"}
            </Label>
            {subjectType === "user" ? (
              <div className="space-y-2">
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="e.g., jane@company.com"
                  className="h-10"
                />
                {userSearch.trim().length >= 2 && (
                  <div className="rounded-lg border border-border/60 bg-background/70">
                    {filteredUsers.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
                    ) : (
                      filteredUsers.slice(0, 6).map((user) => {
                        const selected = subjectId === user.id;
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => setSubjectId(user.id)}
                            className={cn(
                              "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/70",
                              selected && "bg-primary/10 text-primary"
                            )}
                          >
                            <span className="truncate">{user.email || user.name || "No email"}</span>
                            {selected && <Badge variant="outline">Selected</Badge>}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Input
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                placeholder={subjectType === "role" ? "e.g., member" : "Group id"}
                className="h-10"
              />
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Access</Label>
            <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v ?? "read")}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Access" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:space-y-0 md:pt-[22px]">
            <Button
              type="submit"
              className="w-full h-10"
              disabled={createMutation.isPending || (subjectType === "user" && !subjectId)}
            >
              Add
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Permissions List */}
      <SectionCard>
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4" /> Current permissions
          </div>
          <span className="text-xs text-muted-foreground">{permissions?.length ?? 0}</span>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
        ) : !permissions || permissions.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Empty for now.</div>
        ) : (
          <div className="divide-y divide-border/60">
            {permissions.map((perm) => (
              <div key={perm.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{perm.subject_type}</Badge>
                  <span className="truncate">{renderSubject(perm)}</span>
                </div>
                <Badge variant={perm.access_level === "admin" ? "default" : "secondary"}>
                  {perm.access_level}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
}
