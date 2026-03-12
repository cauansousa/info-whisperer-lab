import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-context";
import { getServiceClient } from "@/lib/supabase/service";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/api/server-client";
import { hasMinRole } from "@/lib/utils/roles";
import type { Role } from "@/types/api";

const DEFAULT_PROVIDERS = [
  { name: "OpenAI GPT-4.1", model: "gpt-4.1", base_url: null },
  { name: "OpenAI GPT-4.1-mini", model: "gpt-4.1-mini", base_url: null },
  { name: "OpenAI GPT-4o", model: "gpt-4o", base_url: null },
  { name: "OpenAI GPT-4o-mini", model: "gpt-4o-mini", base_url: null },
  { name: "Anthropic Claude 3.7 Sonnet", model: "claude-3.7-sonnet", base_url: null },
  { name: "Anthropic Claude 3.5 Haiku", model: "claude-3.5-haiku", base_url: null },
  { name: "Google Gemini 2.5 Pro", model: "gemini-2.5-pro", base_url: null },
  { name: "Google Gemini 2.0 Flash", model: "gemini-2.0-flash", base_url: null },
  { name: "Mistral Large", model: "mistral-large", base_url: "https://api.mistral.ai/v1" },
];

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();

  const supabase = getServiceClient();
  let { data, error } = await supabase
    .from("llm_providers")
    .select("*")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    await supabase.from("llm_providers").insert(DEFAULT_PROVIDERS);
    const seeded = await supabase
      .from("llm_providers")
      .select("*")
      .order("name", { ascending: true });
    data = seeded.data ?? [];
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();
  if (!hasMinRole(ctx.profile.profile.role as Role, "owner")) {
    return forbiddenResponse("Owner role required");
  }

  const body = await request.json().catch(() => ({}));
  const supabase = getServiceClient();

  const toInsert: { name: string; model: string; base_url: string | null }[] =
    Array.isArray(body?.providers) && body.providers.length > 0
      ? body.providers
      : DEFAULT_PROVIDERS;

  // Seed defaults
  for (const provider of DEFAULT_PROVIDERS) {
    const existing = await supabase
      .from("llm_providers")
      .select("id")
      .eq("model", provider.model)
      .maybeSingle();
    if (!existing.data) {
      await supabase.from("llm_providers").insert(provider);
    }
  }

  // Insert custom providers (skip duplicates by model)
  if (toInsert !== DEFAULT_PROVIDERS) {
    for (const provider of toInsert) {
      const existing = await supabase
        .from("llm_providers")
        .select("id")
        .eq("model", provider.model)
        .maybeSingle();
      if (!existing.data) {
        await supabase.from("llm_providers").insert(provider);
      }
    }
  }

  const { data, error } = await supabase
    .from("llm_providers")
    .select("*")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
