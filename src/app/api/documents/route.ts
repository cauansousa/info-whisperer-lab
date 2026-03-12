import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-context";
import { getServiceClient } from "@/lib/supabase/service";
import { unauthorizedResponse } from "@/lib/api/server-client";

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();

  const libraryId = request.nextUrl.searchParams.get("library_id");
  const supabase = getServiceClient();

  let query = supabase
    .from("documents")
    .select("*")
    .eq("tenant_id", ctx.profile.tenant.id)
    .order("created_at", { ascending: false });

  if (libraryId) {
    query = query.eq("library_id", libraryId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
