import { proxyGet } from "@/lib/api/server-client";

export async function GET() {
  return proxyGet("auth", "/auth/me");
}
