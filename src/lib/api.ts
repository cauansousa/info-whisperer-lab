import { authSupabase } from "@/lib/auth-client";
import type {
  MeResponse, Invitation, Agent, Library, Document as DocType,
  Chat, ChatMessage, QueryRequest, QueryResponse,
  LLMProvider, TenantLLMConfig, Group, GroupMember, Permission,
  IngestResponse, Profile, Tenant,
} from "@/types";

/* ── Service hosts ── */
const AUTH_BASE       = "https://api.knowledge.cauansousa.com:8001";
const GOVERNANCE_BASE = "https://api.knowledge.cauansousa.com:8002";
const INGESTION_BASE  = "https://api.knowledge.cauansousa.com:8003";
const MODEL_BASE      = "https://api.knowledge.cauansousa.com:8000";

/* ── Token helper ── */
async function getToken(): Promise<string> {
  const { data } = await authSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

/* ── Generic fetch ── */
async function apiFetch<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `API error ${res.status}`);
  }
  return res.json();
}

async function apiFetchNoContentType<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // ─── Auth service (8001) ───
  getMe: () => apiFetch<MeResponse>(AUTH_BASE, "/auth/me"),
  createTenant: (name: string) =>
    apiFetch<{ tenant: Tenant; profile: Profile }>(AUTH_BASE, "/auth/tenants", {
      method: "POST", body: JSON.stringify({ name }),
    }),
  inviteUser: (email: string, role: string = "member") =>
    apiFetch<Invitation>(AUTH_BASE, "/auth/invitations", {
      method: "POST", body: JSON.stringify({ email, role }),
    }),
  getMyInvitations: () => apiFetch<Invitation[]>(AUTH_BASE, "/auth/invitations/mine"),
  acceptInvitation: (token: string) =>
    apiFetch<{ tenant: Tenant; profile: Profile }>(AUTH_BASE, "/auth/invitations/accept", {
      method: "POST", body: JSON.stringify({ token }),
    }),
  updateUserRole: (userId: string, role: string) =>
    apiFetch<Profile>(AUTH_BASE, `/auth/users/${userId}/role`, {
      method: "PATCH", body: JSON.stringify({ role }),
    }),
  getUsers: () => apiFetch<Profile[]>(AUTH_BASE, "/auth/users"),
  getTenantInvitations: () => apiFetch<Invitation[]>(AUTH_BASE, "/auth/invitations"),

  // ─── Governance service (8002) ───
  // Library permissions
  getLibraryPermissions: (id: string) =>
    apiFetch<Permission[]>(GOVERNANCE_BASE, `/governance/library-permissions/${id}`),
  addLibraryPermission: (id: string, subject_type: string, subject_id: string, access_level: string) =>
    apiFetch<Permission>(GOVERNANCE_BASE, "/governance/library-permissions", {
      method: "POST", body: JSON.stringify({ library_id: id, subject_type, subject_id, access_level }),
    }),
  getAllowedLibraries: () =>
    apiFetch<{ library_ids: string[] }>(GOVERNANCE_BASE, "/governance/allowed-libraries"),

  // Libraries
  getLibraries: () => apiFetch<Library[]>(GOVERNANCE_BASE, "/governance/libraries"),
  getLibrary: (id: string) => apiFetch<Library>(GOVERNANCE_BASE, `/governance/libraries/${id}`),
  createLibrary: (name: string, description?: string) =>
    apiFetch<Library>(GOVERNANCE_BASE, "/governance/libraries", {
      method: "POST", body: JSON.stringify({ name, description }),
    }),
  deleteLibrary: (id: string) =>
    apiFetch<{ ok: true }>(GOVERNANCE_BASE, `/governance/libraries/${id}`, { method: "DELETE" }),

  // Documents
  getDocuments: (libraryId: string) =>
    apiFetch<DocType[]>(GOVERNANCE_BASE, `/governance/documents?library_id=${libraryId}`),

  // Agents
  getAgents: () => apiFetch<Agent[]>(GOVERNANCE_BASE, "/governance/agents"),
  createAgent: (body: Record<string, unknown>) =>
    apiFetch<Agent>(GOVERNANCE_BASE, "/governance/agents", {
      method: "POST", body: JSON.stringify(body),
    }),
  updateAgent: (id: string, body: Record<string, unknown>) =>
    apiFetch<Agent>(GOVERNANCE_BASE, `/governance/agents/${id}`, {
      method: "PUT", body: JSON.stringify(body),
    }),
  deleteAgent: (id: string) =>
    apiFetch<{ ok: true }>(GOVERNANCE_BASE, `/governance/agents/${id}`, { method: "DELETE" }),

  // Groups
  getGroups: () => apiFetch<Group[]>(GOVERNANCE_BASE, "/governance/groups"),
  createGroup: (name: string) =>
    apiFetch<Group>(GOVERNANCE_BASE, "/governance/groups", {
      method: "POST", body: JSON.stringify({ name }),
    }),
  getGroupMembers: (groupId: string) =>
    apiFetch<GroupMember[]>(GOVERNANCE_BASE, `/governance/groups/${groupId}/members`),
  addGroupMember: (id: string, userId: string) =>
    apiFetch<GroupMember>(GOVERNANCE_BASE, `/governance/groups/${id}/members`, {
      method: "POST", body: JSON.stringify({ user_id: userId }),
    }),

  // ─── Ingestion service (8003) ───
  ingestFile: async (file: File, libraryId: string, title: string): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("library_id", libraryId);
    formData.append("title", title);
    return apiFetchNoContentType<IngestResponse>(INGESTION_BASE, "/ingest/file", {
      method: "POST", body: formData,
    });
  },

  // ─── Model / Query service (8000) ───
  query: (body: QueryRequest) =>
    apiFetch<QueryResponse>(MODEL_BASE, "/query", { method: "POST", body: JSON.stringify(body) }),

  // Chats
  getChats: () => apiFetch<Chat[]>(MODEL_BASE, "/chats"),
  getChat: (id: string) => apiFetch<Chat>(MODEL_BASE, `/chats/${id}`),
  deleteChat: (id: string) =>
    apiFetch<{ ok: true }>(MODEL_BASE, `/chats/${id}`, { method: "DELETE" }),
  getChatMessages: (chatId: string) =>
    apiFetch<ChatMessage[]>(MODEL_BASE, `/chats/${chatId}/messages`),

  // LLM Config
  getLLMProviders: () => apiFetch<LLMProvider[]>(MODEL_BASE, "/llm-providers"),
  getLLMConfig: () => apiFetch<TenantLLMConfig[]>(MODEL_BASE, "/llm-config"),
  updateLLMConfig: (providerId: string, apiKey: string, settings?: Record<string, unknown>) =>
    apiFetch<TenantLLMConfig>(MODEL_BASE, "/llm-config", {
      method: "PUT", body: JSON.stringify({ provider_id: providerId, api_key: apiKey, settings }),
    }),
};
