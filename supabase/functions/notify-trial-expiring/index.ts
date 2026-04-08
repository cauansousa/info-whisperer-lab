import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[NOTIFY-TRIAL] ${step}${d}`);
};

function buildEmailHtml(daysLeft: number, upgradeUrl: string): string {
  const heading =
    daysLeft === 0
      ? "Seu trial expirou hoje"
      : `Seu trial expira em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}`;

  const message =
    daysLeft === 0
      ? "Seu período de avaliação gratuito termina hoje. Para continuar usando todas as funcionalidades, faça upgrade agora."
      : `Faltam apenas ${daysLeft} dia${daysLeft > 1 ? "s" : ""} para o fim do seu trial gratuito. Garanta seu acesso fazendo upgrade antes que expire.`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;">
        <tr><td>
          <h1 style="color:#18181b;font-size:22px;margin:0 0 16px;">${heading}</h1>
          <p style="color:#52525b;font-size:15px;line-height:1.6;margin:0 0 24px;">${message}</p>
          <a href="${upgradeUrl}" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">
            Fazer upgrade agora
          </a>
          <p style="color:#a1a1aa;font-size:12px;margin:32px 0 0;">
            Se tiver dúvidas, responda este email ou entre em contato com nosso suporte.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    logStep("Listing trialing subscriptions");

    const subscriptions = await stripe.subscriptions.list({
      status: "trialing",
      limit: 100,
    });

    logStep("Found trialing subscriptions", { count: subscriptions.data.length });

    const upgradeUrl = "https://info-whisperer-lab.lovable.app/app/settings?tab=billing";
    let sent = 0;
    let skipped = 0;

    for (const sub of subscriptions.data) {
      if (!sub.trial_end) {
        skipped++;
        continue;
      }

      const trialEnd = new Date(sub.trial_end * 1000);
      const now = new Date();
      const diffMs = trialEnd.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Only notify at 3 days and 0 days (last day)
      if (daysLeft !== 3 && daysLeft !== 0) {
        skipped++;
        continue;
      }

      // Get customer email
      const customer = await stripe.customers.retrieve(sub.customer as string);
      if (!customer || customer.deleted || !("email" in customer) || !customer.email) {
        logStep("Skipping - no customer email", { customerId: sub.customer });
        skipped++;
        continue;
      }

      const email = customer.email;
      logStep("Sending notification", { email, daysLeft });

      const subject =
        daysLeft === 0
          ? "⚠️ Seu trial expira hoje — faça upgrade agora"
          : `⏳ Seu trial expira em ${daysLeft} dias`;

      const response = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "Knowledge AI <noreply@resend.dev>",
          to: [email],
          subject,
          html: buildEmailHtml(daysLeft, upgradeUrl),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logStep("Failed to send email", { email, status: response.status, error: errorBody });
      } else {
        await response.json();
        logStep("Email sent successfully", { email, daysLeft });
        sent++;
      }
    }

    logStep("Finished", { sent, skipped });

    return new Response(JSON.stringify({ sent, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
