import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-context";
import { getServiceClient } from "@/lib/supabase/service";
import { unauthorizedResponse } from "@/lib/api/server-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ libraryId: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();

  const { libraryId } = await params;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("libraries")
    .select("*")
    .eq("id", libraryId)
    .eq("tenant_id", ctx.profile.tenant.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Library not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ libraryId: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();

  const { libraryId } = await params;
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("libraries")
    .delete()
    .eq("id", libraryId)
    .eq("tenant_id", ctx.profile.tenant.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
