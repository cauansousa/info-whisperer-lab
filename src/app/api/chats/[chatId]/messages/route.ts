import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-context";
import { getServiceClient } from "@/lib/supabase/service";
import { unauthorizedResponse } from "@/lib/api/server-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorizedResponse();

  const { chatId } = await params;
  const supabase = getServiceClient();

  // Verify chat belongs to user's tenant
  const { data: chat } = await supabase
    .from("chats")
    .select("id")
    .eq("id", chatId)
    .eq("tenant_id", ctx.profile.tenant.id)
    .single();

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
