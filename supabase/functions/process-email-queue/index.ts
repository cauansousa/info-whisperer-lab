import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "noreply@example.com";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (_req) => {
  try {
    const { data: emails, error: fetchErr } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at")
      .limit(50);

    if (fetchErr) throw fetchErr;
    if (!emails || emails.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const email of emails) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [email.to_email],
            subject: email.subject,
            html: email.html_body,
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Resend ${res.status}: ${body}`);
        }

        await supabase
          .from("email_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", email.id);

        processed++;
      } catch (sendErr) {
        console.error(`Failed email ${email.id}:`, sendErr);
        await supabase
          .from("email_queue")
          .update({
            status: "failed",
            retry_count: (email.retry_count ?? 0) + 1,
            last_error: String(sendErr),
          })
          .eq("id", email.id);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("process-email-queue error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
