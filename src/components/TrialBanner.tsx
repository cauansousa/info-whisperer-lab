import { usePlan } from "@/hooks/usePlan";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";
import { authSupabase } from "@/lib/auth-client";
import { STRIPE_TIERS } from "@/lib/stripe-config";
import { toast } from "sonner";
import { useState } from "react";

export default function TrialBanner() {
  const { isTrialing, daysLeft, subscribed, loading } = usePlan();
  const [upgrading, setUpgrading] = useState(false);

  if (loading || !isTrialing || !subscribed) return null;

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const { data: { session } } = await authSupabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await authSupabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_TIERS.growth.price_id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Erro ao iniciar checkout");
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-[hsl(var(--warning))]/20 bg-[hsl(var(--warning))]/5 px-4 py-2">
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-[hsl(var(--warning))]" />
        <span className="text-foreground">
          {daysLeft !== null && daysLeft > 0
            ? `Seu trial expira em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}`
            : "Seu trial expirou"}
        </span>
      </div>
      <Button size="sm" variant="default" onClick={handleUpgrade} disabled={upgrading} className="gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        {upgrading ? "Abrindo…" : "Fazer upgrade"}
      </Button>
    </div>
  );
}
