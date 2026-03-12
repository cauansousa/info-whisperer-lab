import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-context";
import { getServiceClient } from "@/lib/supabase/service";
import { unauthorizedResponse } from "@/lib/api/server-client";
import { proxyPost } from "@/lib/api/server-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();

  const { groupId } = await params;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("*, profiles(id, email, role)")
    .eq("group_id", groupId)
    .eq("tenant_id", ctx.profile.tenant.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const body = await request.json();
  return proxyPost("governance", `/governance/groups/${groupId}/members`, body);
}
