import { useState } from "react";
import { Link } from "react-router-dom";
import { authSupabase } from "@/lib/auth-client";
import { Brain, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await authSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (authError) throw authError;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Could not send reset email");
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
              {sent ? <MailCheck className="h-5 w-5 text-foreground" /> : <Brain className="h-5 w-5 text-foreground" />}
            </div>
            <h1 className="font-display text-xl font-semibold">
              {sent ? "Check your email" : "Reset password"}
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              {sent
                ? <>We sent a reset link to <strong className="text-foreground">{email}</strong>. Click it to choose a new password.</>
                : "Enter your email and we'll send you a link to reset your password."}
            </p>
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="bg-secondary/30 border-border/40"
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Send reset link"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
