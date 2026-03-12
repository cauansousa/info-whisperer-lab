import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { authSupabase } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Session } from "@supabase/supabase-js";

export default function Invite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    authSupabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = authSupabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-xl border border-border/40 bg-card/80 p-8 text-center backdrop-blur-xl">
          <p className="text-muted-foreground">No invitation token provided.</p>
        </div>
      </div>
    );
  }

  const handleAccept = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api.acceptInvitation(token);
      window.location.href = "/app";
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignupAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      // After signup, accept the invite
      await api.acceptInvitation(token);
      window.location.href = "/app";
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[hsl(250,40%,15%)] blur-[120px]" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(0,0%,15%)] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="rounded-xl border border-border/40 bg-card/80 p-8 backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-secondary/50">
              <Brain className="h-5 w-5 text-foreground" />
            </div>
            <h1 className="font-display text-xl font-semibold">You've been invited</h1>
            <p className="text-sm text-muted-foreground text-center">
              {session ? "Click below to join the workspace." : "Create an account to join."}
            </p>
          </div>

          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}

          {session ? (
            <Button onClick={handleAccept} disabled={submitting} className="w-full">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Accepting...</> : "Accept invitation"}
            </Button>
          ) : (
            <form onSubmit={handleSignupAndAccept} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary/30 border-border/40" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-secondary/30 border-border/40" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create account & join"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
