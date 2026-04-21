import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { SignupEmail } from "../_shared/email-templates/signup.tsx";
import { RecoveryEmail } from "../_shared/email-templates/recovery.tsx";
import { MagicLinkEmail } from "../_shared/email-templates/magic-link.tsx";
import { InviteEmail } from "../_shared/email-templates/invite.tsx";
import { EmailChangeEmail } from "../_shared/email-templates/email-change.tsx";
import { ReauthenticationEmail } from "../_shared/email-templates/reauthentication.tsx";

const SITE_NAME = Deno.env.get("SITE_NAME") ?? "KnowledgeAI";
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface EmailHookPayload {
  user: {
    email: string;
    new_email?: string;
    user_metadata?: Record<string, unknown>;
  };
  email_data: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type: string;
    confirmation_url?: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

async function renderEmail(
  payload: EmailHookPayload
): Promise<{ subject: string; html: string }> {
  const { user, email_data } = payload;
  const action = email_data.email_action_type;
  const confirmationUrl = email_data.confirmation_url ?? "#";

  switch (action) {
    case "signup": {
      const html = await renderAsync(
        React.createElement(SignupEmail, {
          siteName: SITE_NAME,
          confirmationUrl,
        })
      );
      return { subject: `Confirme seu cadastro no ${SITE_NAME}`, html };
    }

    case "recovery": {
      const html = await renderAsync(
        React.createElement(RecoveryEmail, {
          siteName: SITE_NAME,
          confirmationUrl,
        })
      );
      return { subject: `Redefinir sua senha – ${SITE_NAME}`, html };
    }

    case "magic_link":
    case "magiclink": {
      const html = await renderAsync(
        React.createElement(MagicLinkEmail, {
          siteName: SITE_NAME,
          confirmationUrl,
        })
      );
      return { subject: `Seu link de acesso – ${SITE_NAME}`, html };
    }

    case "invite": {
      const html = await renderAsync(
        React.createElement(InviteEmail, {
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          confirmationUrl,
        })
      );
      return { subject: `Convite para o ${SITE_NAME}`, html };
    }

    case "email_change": {
      const html = await renderAsync(
        React.createElement(EmailChangeEmail, {
          siteName: SITE_NAME,
          email: user.email,
          newEmail: user.new_email ?? "",
          confirmationUrl,
        })
      );
      return { subject: `Confirme a alteração de e-mail – ${SITE_NAME}`, html };
    }

    case "reauthentication": {
      const token = email_data.token ?? "";
      const html = await renderAsync(
        React.createElement(ReauthenticationEmail, {
          siteName: SITE_NAME,
          token,
        })
      );
      return { subject: `Código de verificação – ${SITE_NAME}`, html };
    }

    default: {
      return {
        subject: `Notificação do ${SITE_NAME}`,
        html: `<p>Ação: ${action}</p>`,
      };
    }
  }
}

Deno.serve(async (req) => {
  try {
    const payload: EmailHookPayload = await req.json();
    const { subject, html } = await renderEmail(payload);

    const { error } = await supabaseAdmin.from("email_queue").insert({
      to_email: payload.user.email,
      subject,
      html_body: html,
    });

    if (error) throw error;

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("auth-email-hook error:", err);
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: String(err) } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
