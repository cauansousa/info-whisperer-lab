import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-context";
import { getServiceClient } from "@/lib/supabase/service";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/api/server-client";
import { hasMinRole } from "@/lib/utils/roles";
import type { Role } from "@/types/api";

// Return all LLM configs for this tenant (one per provider)
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return unauthorizedResponse();
    if (!hasMinRole(ctx.profile.profile.role as Role, "admin")) {
      return forbiddenResponse("Admin role required");
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("tenant_llm_configs")
      .select("id, provider_id, api_key, settings")
      .eq("tenant_id", ctx.profile.tenant.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const masked = (data ?? []).map((row) => ({
      ...row,
      api_key: row.api_key ? `****${row.api_key.slice(-4)}` : null,
    }));

    return NextResponse.json(masked);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}

// Upsert config for a specific provider
export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return unauthorizedResponse();
    if (!hasMinRole(ctx.profile.profile.role as Role, "owner")) {
      return forbiddenResponse("Owner role required");
    }

    const body = await request.json();
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("tenant_llm_configs")
      .upsert({
        tenant_id: ctx.profile.tenant.id,
        provider_id: body.provider_id,
        api_key: body.api_key,
        settings: body.settings || {},
      })
      .select("id, provider_id, api_key, settings")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ...data,
      api_key: data.api_key ? `****${data.api_key.slice(-4)}` : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
