import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-context";
import { getServiceClient } from "@/lib/supabase/service";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/api/server-client";
import { hasMinRole } from "@/lib/utils/roles";
import type { Role } from "@/types/api";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();
  if (!hasMinRole(ctx.profile.profile.role as Role, "admin")) {
    return forbiddenResponse("Admin role required");
  }
  const { agentId } = await params;
  const body = await request.json();
  if (!body.model_provider_id) {
    return NextResponse.json({ error: "model_provider_id is required" }, { status: 400 });
  }
  const supabase = getServiceClient();

  const config = {
    system_prompt: body.system_prompt ?? null,
    model_provider_id: body.model_provider_id,
    params: {
      temperature: body.temperature ?? null,
      max_tokens: body.max_tokens ?? null,
      top_p: body.top_p ?? null,
    },
    integrations: body.integrations ?? {},
  };

  const { data: updated, error: updateError } = await supabase
    .from("agents")
    .update({
      name: body.name,
      description: body.description ?? null,
      config,
    })
    .eq("id", agentId)
    .eq("tenant_id", ctx.profile.tenant.id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const libraryIds: string[] = body.library_ids ?? [];
  // Replace agent_libraries
  await supabase
    .from("agent_libraries")
    .delete()
    .eq("agent_id", agentId)
    .eq("tenant_id", ctx.profile.tenant.id);

  if (libraryIds.length > 0) {
    const { error: libError } = await supabase
      .from("agent_libraries")
      .insert(
        libraryIds.map((libId) => ({
          tenant_id: ctx.profile.tenant.id,
          agent_id: agentId,
          library_id: libId,
        }))
      );
    if (libError) return NextResponse.json({ error: libError.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();
  if (!hasMinRole(ctx.profile.profile.role as Role, "admin")) {
    return forbiddenResponse("Admin role required");
  }
  const { agentId } = await params;
  const supabase = getServiceClient();

  await supabase
    .from("agent_libraries")
    .delete()
    .eq("agent_id", agentId)
    .eq("tenant_id", ctx.profile.tenant.id);

  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", agentId)
    .eq("tenant_id", ctx.profile.tenant.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
