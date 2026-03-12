"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiPost, apiFetch } from "@/lib/api/client";
import type {
  CreateTenantRequest,
  CreateTenantResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  Invitation,
} from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OnboardingPage() {
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [manualToken, setManualToken] = useState("");

  const { data: invitations, isLoading: loadingInvites } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: () => apiFetch<Invitation[]>("/auth/invitations/mine"),
    retry: false,
  });

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiPost<CreateTenantResponse>("/auth/tenants", {
        name: orgName,
      } satisfies CreateTenantRequest);
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
      setLoading(false);
    }
  }

  async function accept(token: string) {
    setJoinError("");
    setJoinLoading(true);
    try {
      await apiPost<AcceptInvitationResponse>("/auth/invitations/accept", {
        token,
      } satisfies AcceptInvitationRequest);
      window.location.href = "/app";
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to accept invitation");
      setJoinLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join a workspace</CardTitle>
          <CardDescription>
            Accept an invitation that was sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {joinError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {joinError}
            </div>
          )}

          {loadingInvites ? (
            <p className="text-sm text-muted-foreground">Checking invitations...</p>
          ) : invitations && invitations.length > 0 ? (
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div key={invite.id} className="flex items-start justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{invite.tenant_name ?? "Workspace"}</p>
                    <p className="text-xs text-muted-foreground">
                      Role: {invite.role} · Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => accept(invite.token)} disabled={joinLoading}>
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No pending invitations found for your email.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="token">Have a token?</Label>
            <div className="flex gap-2">
              <Input
                id="token"
                placeholder="Paste invitation token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
              />
              <Button type="button" onClick={() => accept(manualToken)} disabled={!manualToken || joinLoading}>
                Accept
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Or create a new workspace</CardTitle>
          <CardDescription>
            If you&apos;re the first person, create the organization
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateOrg}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization name</Label>
              <Input
                id="orgName"
                placeholder="Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create organization"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
