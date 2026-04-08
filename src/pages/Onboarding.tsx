import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Invitation } from "@/types";
import { Brain, Loader2, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [acceptingManual, setAcceptingManual] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  useEffect(() => {
    api.getMyInvitations()
      .then(setInvitations)
      .catch(() => toast.error("Failed to load invitations"))
      .finally(() => setLoadingInvites(false));
  }, []);

  const acceptInvite = async (token: string, id: string) => {
    setAcceptingId(id);
    try {
      await api.acceptInvitation(token);
      await refresh();
      navigate("/app", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation");
    } finally {
      setAcceptingId(null);
    }
  };

  const acceptManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setAcceptingManual(true);
    try {
      await api.acceptInvitation(manualToken.trim());
      await refresh();
      navigate("/app", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired token");
    } finally {
      setAcceptingManual(false);
    }
  };

  const createOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setCreatingOrg(true);
    try {
      await api.createTenant(orgName.trim());
      await refresh();
      navigate("/app", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setCreatingOrg(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[hsl(250,40%,15%)] blur-[120px]" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(0,0%,15%)] blur-[120px]" />
      </div>

      <div className="relative grid w-full max-w-3xl gap-6 md:grid-cols-2">
        {/* Join workspace */}
        <div className="rounded-xl border border-border/40 bg-card/80 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold">Join a workspace</h2>
          </div>

          {loadingInvites ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : invitations.length > 0 ? (
            <div className="space-y-3 mb-4">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{inv.tenant_name || "Workspace"}</p>
                    <p className="text-xs text-muted-foreground">Role: {inv.role}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => acceptInvite(inv.token, inv.id)}
                    disabled={acceptingId === inv.id}
                  >
                    {acceptingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">No pending invitations.</p>
          )}

          <div className="border-t border-border/30 pt-4">
            <p className="mb-2 text-xs text-muted-foreground">Have a token?</p>
            <form onSubmit={acceptManual} className="flex gap-2">
              <Input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste invitation token"
                className="bg-secondary/30 border-border/40 text-xs"
              />
              <Button type="submit" size="sm" disabled={acceptingManual}>
                {acceptingManual ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept"}
              </Button>
            </form>
          </div>
        </div>

        {/* Create workspace */}
        <div className="rounded-xl border border-border/40 bg-card/80 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold">Create new workspace</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Start a new organization and invite your team.
          </p>
          <form onSubmit={createOrg} className="space-y-4">
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              required
              className="bg-secondary/30 border-border/40"
            />
            <Button type="submit" disabled={creatingOrg} className="w-full">
              {creatingOrg ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create organization"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
