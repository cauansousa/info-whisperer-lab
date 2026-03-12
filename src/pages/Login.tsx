import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { authSupabase } from "@/lib/auth-client";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      // Hard navigation to ensure cookies are sent
      window.location.href = redirect;
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[hsl(250,40%,15%)] blur-[120px]" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(0,0%,15%)] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="rounded-xl border border-border/40 bg-card/80 p-8 backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-secondary/50">
              <Brain className="h-5 w-5 text-foreground" />
            </div>
            <h1 className="font-display text-xl font-semibold">Knowledge AI</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

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
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-secondary/30 border-border/40"
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
