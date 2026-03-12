import { NextRequest } from "next/server";
import { proxyMultipart } from "@/lib/api/server-client";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  return proxyMultipart("ingestion", "/ingest/file", formData);
}
