import { NextRequest } from "next/server";
import { proxyPost } from "@/lib/api/server-client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyPost("auth", "/auth/tenants", body);
}
