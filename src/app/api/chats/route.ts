import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-context";
import { getServiceClient } from "@/lib/supabase/service";
import { unauthorizedResponse } from "@/lib/api/server-client";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("chats")
    .select("id, title, agent_id, created_at")
    .eq("user_id", ctx.profile.user_id)
    .eq("tenant_id", ctx.profile.tenant.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
