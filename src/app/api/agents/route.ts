import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-context";
import { getServiceClient } from "@/lib/supabase/service";
import { unauthorizedResponse } from "@/lib/api/server-client";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*, agent_libraries(library_id, libraries(name))")
    .eq("tenant_id", ctx.profile.tenant.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
