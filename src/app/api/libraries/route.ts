import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-context";
import { getServiceClient } from "@/lib/supabase/service";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/api/server-client";
import { hasMinRole } from "@/lib/utils/roles";
import type { Role } from "@/types/api";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("libraries")
    .select("*")
    .eq("tenant_id", ctx.profile.tenant.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();
  if (!hasMinRole(ctx.profile.profile.role as Role, "manager")) {
    return forbiddenResponse("Manager role or higher required");
  }

  const body = await request.json();
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("libraries")
    .insert({
      tenant_id: ctx.profile.tenant.id,
      created_by: ctx.profile.user_id,
      name: body.name,
      description: body.description || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
