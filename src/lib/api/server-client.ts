import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const API_URLS = {
  auth: process.env.AUTH_API_URL || "http://localhost:8001",
  governance: process.env.GOVERNANCE_API_URL || "http://localhost:8002",
  ingestion: process.env.INGESTION_API_URL || "http://localhost:8003",
  model: process.env.MODEL_API_URL || "http://localhost:8000",
} as const;

type Service = keyof typeof API_URLS;

export async function getSession() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse(detail = "Forbidden") {
  return NextResponse.json({ error: detail }, { status: 403 });
}

/**
 * Safely parse a response body as JSON.
 * Falls back to a plain-text wrapper if the body isn't valid JSON.
 */
async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text || res.statusText };
  }
}

/**
 * Wraps a fetch call to a backend service with proper error handling.
 * Returns a meaningful error response if the backend is unreachable.
 */
async function safeFetch(
  service: Service,
  url: string,
  init: RequestInit
): Promise<Response | null> {
  try {
    return await fetch(url, init);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown network error";
    console.error(
      `[BFF] Failed to reach ${service} at ${url}: ${message}`
    );
    return null;
  }
}

function serviceUnavailableResponse(service: Service) {
  return NextResponse.json(
    {
      error: `Backend service "${service}" is unavailable. Make sure it is running at ${API_URLS[service]}`,
    },
    { status: 502 }
  );
}

export async function proxyGet(service: Service, path: string) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const res = await safeFetch(service, `${API_URLS[service]}${path}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res) return serviceUnavailableResponse(service);

  const data = await safeJson(res);
  return NextResponse.json(data, { status: res.status });
}

export async function proxyPost(
  service: Service,
  path: string,
  body: unknown
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const res = await safeFetch(service, `${API_URLS[service]}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res) return serviceUnavailableResponse(service);

  const data = await safeJson(res);
  return NextResponse.json(data, { status: res.status });
}

export async function proxyPatch(
  service: Service,
  path: string,
  body: unknown
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const res = await safeFetch(service, `${API_URLS[service]}${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res) return serviceUnavailableResponse(service);

  const data = await safeJson(res);
  return NextResponse.json(data, { status: res.status });
}

export async function proxyPut(
  service: Service,
  path: string,
  body: unknown
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const res = await safeFetch(service, `${API_URLS[service]}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res) return serviceUnavailableResponse(service);

  const data = await safeJson(res);
  return NextResponse.json(data, { status: res.status });
}

export async function proxyMultipart(
  service: Service,
  path: string,
  formData: FormData
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const res = await safeFetch(service, `${API_URLS[service]}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!res) return serviceUnavailableResponse(service);

  const data = await safeJson(res);
  return NextResponse.json(data, { status: res.status });
}
