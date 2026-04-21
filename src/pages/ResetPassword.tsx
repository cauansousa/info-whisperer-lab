import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authSupabase } from "@/lib/auth-client";
import { Brain, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands here from the email link
    const { data: { subscription } } = authSupabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also handle case where session is already established
    authSupabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await authSupabase.auth.updateUser({ password });
      if (authError) throw authError;
      setDone(true);
      await authSupabase.auth.signOut();
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err: any) {
      setError(err.message || "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[hsl(250,40%,15%)] blur-[120px]" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(0,0%,15%)] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="rounded-xl border border-border/40 bg-card/80 p-8 backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-secondary/50">
              {done ? <CheckCircle2 className="h-5 w-5 text-foreground" /> : <Brain className="h-5 w-5 text-foreground" />}
            </div>
            <h1 className="font-display text-xl font-semibold">
              {done ? "Password updated" : "Set a new password"}
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              {done
                ? "Redirecting you to sign in..."
                : "Choose a new password for your account."}
            </p>
          </div>

          {!done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">New password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={!ready}
                  className="bg-secondary/30 border-border/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Confirm password</label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={!ready}
                  className="bg-secondary/30 border-border/40"
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
              )}
              {!ready && !error && (
                <p className="rounded-md bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                  Validating reset link...
                </p>
              )}

              <Button type="submit" disabled={loading || !ready} className="w-full">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
