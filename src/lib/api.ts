import { authSupabase } from "@/lib/auth-client";
import type {
  MeResponse, Invitation, Agent, Library, Document as DocType,
  Chat, ChatMessage, QueryRequest, QueryResponse,
  LLMProvider, TenantLLMConfig, Group, GroupMember, Permission,
  IngestResponse, Profile, Tenant, DriveConnection,
} from "@/types";

/* ── Service hosts ── */
const API_BASE         = import.meta.env.VITE_API_BASE_URL   ?? "https://api.knowledge.cauansousa.com";
const AUTH_BASE        = `${API_BASE}/auth`;
const GOVERNANCE_BASE  = `${API_BASE}/governance`;
const INGESTION_BASE   = `${API_BASE}/ingest`;
const CONNECTORS_BASE  = `${API_BASE}/connectors`;
const MODEL_BASE       = `${API_BASE}/model`;                                          // always cloud — chat history, LLM config
const MODEL_INFERENCE  = import.meta.env.VITE_MODEL_BASE_URL ?? MODEL_BASE;            // local when VITE_MODEL_BASE_URL is set — inference only

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

async function apiFetchVoid(baseUrl: string, path: string, options: RequestInit = {}): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
  });
  if (res.status === 401) { window.location.href = "/login"; throw new Error("Unauthorized"); }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `API error ${res.status}`);
  }
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
  // ─── Auth service ───
  getMe: () => apiFetch<MeResponse>(AUTH_BASE, "/me"),
  createTenant: (name: string) =>
    apiFetch<{ tenant: Tenant; profile: Profile }>(AUTH_BASE, "/tenants", {
      method: "POST", body: JSON.stringify({ name }),
    }),
  inviteUser: (email: string, role: string = "member") =>
    apiFetch<Invitation>(AUTH_BASE, "/invitations", {
      method: "POST", body: JSON.stringify({ email, role }),
    }),
  getMyInvitations: () => apiFetch<Invitation[]>(AUTH_BASE, "/invitations/mine"),
  acceptInvitation: (token: string) =>
    apiFetch<{ tenant: Tenant; profile: Profile }>(AUTH_BASE, "/invitations/accept", {
      method: "POST", body: JSON.stringify({ token }),
    }),
  updateUserRole: (userId: string, role: string) =>
    apiFetch<Profile>(AUTH_BASE, `/users/${userId}/role`, {
      method: "PATCH", body: JSON.stringify({ role }),
    }),
  getUsers: () => apiFetch<Profile[]>(AUTH_BASE, "/users"),
  getTenantInvitations: () => apiFetch<Invitation[]>(AUTH_BASE, "/invitations"),

  // ─── Governance service ───
  getLibraries: () => apiFetch<Library[]>(GOVERNANCE_BASE, "/libraries"),
  createLibrary: (name: string, description?: string, system_prompt?: string) =>
    apiFetch<Library>(GOVERNANCE_BASE, "/libraries", {
      method: "POST", body: JSON.stringify({ name, description, system_prompt }),
    }),
  updateLibrary: (id: string, body: { name?: string; description?: string; system_prompt?: string }) =>
    apiFetch<Library>(GOVERNANCE_BASE, `/libraries/${id}`, {
      method: "PUT", body: JSON.stringify(body),
    }),
  getLibrary: (id: string) => apiFetch<Library>(GOVERNANCE_BASE, `/libraries/${id}`),
  deleteLibrary: (id: string) =>
    apiFetch<{ ok: true }>(GOVERNANCE_BASE, `/libraries/${id}`, { method: "DELETE" }),

  getLibraryPermissions: (id: string) =>
    apiFetch<Permission[]>(GOVERNANCE_BASE, `/library-permissions/${id}`),
  addLibraryPermission: (id: string, subject_type: string, subject_id: string, access_level: string) =>
    apiFetch<Permission>(GOVERNANCE_BASE, "/library-permissions", {
      method: "POST", body: JSON.stringify({ library_id: id, subject_type, subject_id, access_level }),
    }),
  getAllowedLibraries: () =>
    apiFetch<{ library_ids: string[] }>(GOVERNANCE_BASE, "/allowed-libraries"),

  getDocuments: (libraryId: string) =>
    apiFetch<DocType[]>(GOVERNANCE_BASE, `/documents?library_id=${libraryId}`),

  getAgents: () => apiFetch<Agent[]>(GOVERNANCE_BASE, "/agents"),
  createAgent: (body: Record<string, unknown>) =>
    apiFetch<Agent>(GOVERNANCE_BASE, "/agents", {
      method: "POST", body: JSON.stringify(body),
    }),
  updateAgent: (id: string, body: Record<string, unknown>) =>
    apiFetch<Agent>(GOVERNANCE_BASE, `/agents/${id}`, {
      method: "PUT", body: JSON.stringify(body),
    }),
  deleteAgent: (id: string) =>
    apiFetch<{ ok: true }>(GOVERNANCE_BASE, `/agents/${id}`, { method: "DELETE" }),

  getGroups: () => apiFetch<Group[]>(GOVERNANCE_BASE, "/groups"),
  createGroup: (name: string) =>
    apiFetch<Group>(GOVERNANCE_BASE, "/groups", {
      method: "POST", body: JSON.stringify({ name }),
    }),
  getGroupMembers: (groupId: string) =>
    apiFetch<GroupMember[]>(GOVERNANCE_BASE, `/groups/${groupId}/members`),
  addGroupMember: (id: string, userId: string) =>
    apiFetch<GroupMember>(GOVERNANCE_BASE, `/groups/${id}/members`, {
      method: "POST", body: JSON.stringify({ user_id: userId }),
    }),

  // ─── Connectors (Google Drive) ───
  getConnections: (libraryId: string) =>
    apiFetch<DriveConnection[]>(CONNECTORS_BASE, `/${libraryId}`),
  getGoogleDriveAuthUrl: (libraryId: string, folderId?: string) => {
    const params = new URLSearchParams({ library_id: libraryId });
    if (folderId) params.set("folder_id", folderId);
    return apiFetch<{ auth_url: string; connection_id: string }>(
      CONNECTORS_BASE, `/google-drive/auth?${params}`
    );
  },
  syncNow: (connectionId: string) =>
    apiFetch<{ message: string; files_added: number; files_updated: number; files_deleted: number; errors: number }>(
      CONNECTORS_BASE, `/${connectionId}/sync`, { method: "POST" }
    ),
  updateConnection: (connectionId: string, body: { folder_id?: string; folder_name?: string; sync_interval_minutes?: number; status?: string }) =>
    apiFetch<DriveConnection>(CONNECTORS_BASE, `/${connectionId}`, {
      method: "PATCH", body: JSON.stringify(body),
    }),
  disconnectDrive: (connectionId: string) =>
    apiFetchVoid(CONNECTORS_BASE, `/${connectionId}`, { method: "DELETE" }),
  listDriveFolders: (connectionId: string, parentId?: string) => {
    const params = new URLSearchParams();
    if (parentId) params.set("parent_id", parentId);
    return apiFetch<{ id: string; name: string }[]>(
      CONNECTORS_BASE, `/${connectionId}/folders?${params}`
    );
  },

  // ─── Ingestion service ───
  ingestFile: async (file: File, libraryId: string, title: string): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("library_id", libraryId);
    formData.append("title", title);
    return apiFetchNoContentType<IngestResponse>(INGESTION_BASE, "/file", {
      method: "POST", body: formData,
    });
  },
  deleteDocument: (documentId: string) =>
    apiFetchVoid(INGESTION_BASE, `/document/${documentId}`, { method: "DELETE" }),


  query: (body: QueryRequest) =>
    apiFetch<QueryResponse>(MODEL_INFERENCE, "/query", { method: "POST", body: JSON.stringify(body) }),

  getChats: () => apiFetch<Chat[]>(MODEL_BASE, "/chats"),
  getChat: (id: string) => apiFetch<Chat>(MODEL_BASE, `/chats/${id}`),
  deleteChat: (id: string) =>
    apiFetch<{ ok: true }>(MODEL_BASE, `/chats/${id}`, { method: "DELETE" }),
  getChatMessages: (chatId: string) =>
    apiFetch<ChatMessage[]>(MODEL_BASE, `/chats/${chatId}/messages`),

  getLLMProviders: () => apiFetch<LLMProvider[]>(MODEL_BASE, "/llm-providers"),
  getLLMConfig: () => apiFetch<TenantLLMConfig[]>(MODEL_BASE, "/llm-config"),
  updateLLMConfig: (providerId: string, apiKey: string, settings?: Record<string, unknown>) =>
    apiFetch<TenantLLMConfig>(MODEL_BASE, "/llm-config", {
      method: "PUT", body: JSON.stringify({ provider_id: providerId, api_key: apiKey, settings }),
    }),
};
