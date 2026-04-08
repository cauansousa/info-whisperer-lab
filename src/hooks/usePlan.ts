import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authSupabase } from "@/lib/auth-client";
import type { PlanTier } from "@/lib/stripe-config";

interface PlanInfo {
  plan: PlanTier | null;
  subscribed: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePlan(): PlanInfo {
  const [plan, setPlan] = useState<PlanTier | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await authSupabase.auth.getSession();
      if (!session) {
        setPlan(null);
        setSubscribed(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      setPlan(data.plan || null);
      setSubscribed(data.subscribed || false);
      setSubscriptionEnd(data.subscription_end || null);
    } catch (err: any) {
      console.error("Error fetching plan:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return { plan, subscribed, subscriptionEnd, loading, error, refetch: fetchPlan };
}
