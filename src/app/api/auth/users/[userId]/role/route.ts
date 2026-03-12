import { NextRequest } from "next/server";
import { proxyPatch } from "@/lib/api/server-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const body = await request.json();
  return proxyPatch("auth", `/auth/users/${userId}/role`, body);
}
