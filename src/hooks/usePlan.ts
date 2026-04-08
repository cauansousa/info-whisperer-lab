import { useState, useEffect, useCallback } from "react";
import { authSupabase } from "@/lib/auth-client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import type { PlanTier } from "@/lib/stripe-config";

interface PlanState {
  loading: boolean;
  subscribed: boolean;
  plan: PlanTier | null;
  isTrialing: boolean;
  trialEnd: string | null;
  subscriptionEnd: string | null;
  daysLeft: number | null;
}

export function usePlan() {
  const [state, setState] = useState<PlanState>({
    loading: true,
    subscribed: false,
    plan: null,
    isTrialing: false,
    trialEnd: null,
    subscriptionEnd: null,
    daysLeft: null,
  });

  const check = useCallback(async () => {
    try {
      const { data: { session } } = await authSupabase.auth.getSession();
      if (!session) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data, error } = await invokeEdgeFunction("check-subscription", {
        token: session.access_token,
      });

      if (error) throw error;

      let daysLeft: number | null = null;
      if (data.is_trialing && data.trial_end) {
        const diff = new Date(data.trial_end).getTime() - Date.now();
        daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      setState({
        loading: false,
        subscribed: data.subscribed ?? false,
        plan: data.plan ?? null,
        isTrialing: data.is_trialing ?? false,
        trialEnd: data.trial_end ?? null,
        subscriptionEnd: data.subscription_end ?? null,
        daysLeft,
      });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [check]);

  return { ...state, refresh: check };
}
