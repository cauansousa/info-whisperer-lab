import React from "npm:react@18.3.1";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.1.2";
import { renderAsync } from "npm:@react-email/components@0.0.41";
import { MagicLinkEmail } from "./emails/MagicLinkEmail.tsx";
import { SignUpConfirmationEmail } from "./emails/SignUpConfirmationEmail.tsx";
import { PasswordResetEmail } from "./emails/PasswordResetEmail.tsx";
import { EmailChangeCurrentEmail } from "./emails/EmailChangeCurrentEmail.tsx";
import { EmailChangeNewEmail } from "./emails/EmailChangeNewEmail.tsx";
import { ReauthenticationEmail } from "./emails/ReauthenticationEmail.tsx";

// Resend API Key
const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

// Map email_data.email_action_type to a React component
const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  magic_link: MagicLinkEmail,
  signup: SignUpConfirmationEmail,
  recovery: PasswordResetEmail,
  email_change_current: EmailChangeCurrentEmail,
  email_change_new: EmailChangeNewEmail,
  reauthentication: ReauthenticationEmail,
};

// Special subject lines per action type
const SUBJECT_MAP: Record<string, string> = {
  magic_link: "Your Magic Link",
  signup: "Confirm your email address",
  recovery: "Reset your password",
  email_change_current: "Confirm email change",
  email_change_new: "Confirm your new email address",
  reauthentication: "Confirm your identity",
};

// Configuration
const SITE_NAME = "KnowledgeAI"
const SENDER_DOMAIN = "notify.utopiaco.com.br"
const ROOT_DOMAIN = "utopiaco.com.br"
const FROM_DOMAIN = "utopiaco.com.br" // Domain shown in From address (may be root or sender subdomain)
const FROM_EMAIL = `${SITE_NAME} <noreply@${FROM_DOMAIN}>`

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  // Verify webhook signature
  const webhookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;
  const wh = new Webhook(webhookSecret);
  const {
    user,
    email_data: { token, token_hash, redirect_to, email_action_type, site_url },
  } = wh.verify(payload, headers) as {
    user: {
      email: string;
    };
    email_data: {
      token: string;
      token_hash: string;
      redirect_to: string;
      email_action_type: string;
      site_url: string;
      token_new: string;
      token_hash_new: string;
    };
  };

  // Build the confirm URL (supabase /auth/v1/verify)
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const confirmUrl = new URL(`${supabaseUrl}/auth/v1/verify`);
  confirmUrl.searchParams.set("token", token_hash);
  confirmUrl.searchParams.set("type", email_action_type);
  confirmUrl.searchParams.set("redirect_to", redirect_to || site_url);

  // Pick the template (fallback to magic_link if unknown action type)
  const TemplateComponent =
    EMAIL_TEMPLATES[email_action_type] ?? MagicLinkEmail;
  const subject =
    SUBJECT_MAP[email_action_type] ?? "Action required";

  const html = await renderAsync(
    React.createElement(TemplateComponent, {
      confirmUrl: confirmUrl.toString(),
      token,
      siteName: SITE_NAME,
      senderDomain: SENDER_DOMAIN,
      rootDomain: ROOT_DOMAIN,
    })
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [user.email],
    subject,
    html,
  });

  if (error) {
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.statusCode,
          message: error.message,
        },
      }),
      { status: error.statusCode, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({}),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

Deno.serve(handler);
