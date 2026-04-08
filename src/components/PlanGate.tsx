import { usePlan } from "@/hooks/usePlan";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";
import type { PlanTier } from "@/lib/stripe-config";
import { STRIPE_TIERS } from "@/lib/stripe-config";

interface PlanGateProps {
  /** Minimum plan required to unlock this feature */
  minPlan: PlanTier;
  children: ReactNode;
  /** What to show when locked (defaults to children with an overlay badge) */
  fallback?: ReactNode;
}

const planOrder: Record<string, number> = { starter: 0, growth: 1, business: 2, enterprise: 3 };

export default function PlanGate({ minPlan, children, fallback }: PlanGateProps) {
  const { plan, loading } = usePlan();

  if (loading) return <>{children}</>;

  const currentLevel = plan ? (planOrder[plan] ?? -1) : -1;
  const requiredLevel = planOrder[minPlan] ?? 0;

  if (currentLevel >= requiredLevel) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50">{children}</div>
      <Badge className="absolute top-2 right-2 bg-primary/10 text-primary border-primary/30 text-xs">
        {STRIPE_TIERS[minPlan].name}
      </Badge>
    </div>
  );
}
