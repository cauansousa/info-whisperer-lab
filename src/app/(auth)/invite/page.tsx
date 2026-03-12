"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api/client";
import type { AcceptInvitationRequest, AcceptInvitationResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
    }
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setError("");
    setLoading(true);

    try {
      await apiPost<AcceptInvitationResponse>("/auth/invitations/accept", {
        token,
      } satisfies AcceptInvitationRequest);
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">You&apos;ve been invited</CardTitle>
        <CardDescription>
          Accept the invitation to join the organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button
          onClick={handleAccept}
          className="w-full"
          disabled={loading || !token}
        >
          {loading ? "Accepting..." : "Accept invitation"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
