import { NextRequest } from "next/server";
import { proxyGet, proxyPost } from "@/lib/api/server-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ libraryId: string }> }
) {
  const { libraryId } = await params;
  return proxyGet("governance", `/governance/library-permissions/${libraryId}`);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyPost("governance", "/governance/library-permissions", body);
}
