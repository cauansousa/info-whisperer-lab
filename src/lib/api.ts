import { supabase } from "@/integrations/supabase/client";
import type {
  MeResponse, Invitation, Agent, Library, Document as DocType,
  Chat, ChatMessage, QueryRequest, QueryResponse,
  LLMProvider, TenantLLMConfig, Group, GroupMember, Permission,
  IngestResponse, Profile, Tenant,
} from "@/types";

const API_BASE = "https://api.knowledge.cauansousa.com";

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
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

async function apiFetchNoContentType<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
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

// Auth
export const api = {
  getMe: () => apiFetch<MeResponse>("/auth/me"),
  createTenant: (name: string) =>
    apiFetch<{ tenant: Tenant; profile: Profile }>("/auth/tenants", {
      method: "POST", body: JSON.stringify({ name }),
    }),
  inviteUser: (email: string, role: string = "member") =>
    apiFetch<Invitation>("/auth/invitations", {
      method: "POST", body: JSON.stringify({ email, role }),
    }),
  getMyInvitations: () => apiFetch<Invitation[]>("/auth/invitations/mine"),
  acceptInvitation: (token: string) =>
    apiFetch<{ tenant: Tenant; profile: Profile }>("/auth/invitations/accept", {
      method: "POST", body: JSON.stringify({ token }),
    }),
  getTenantInvitations: () => apiFetch<Invitation[]>("/auth/invitations"),
  updateUserRole: (userId: string, role: string) =>
    apiFetch<Profile>(`/auth/users/${userId}/role`, {
      method: "PATCH", body: JSON.stringify({ role }),
    }),
  getUsers: () => apiFetch<Profile[]>("/auth/users"),

  // Agents
  getAgents: () => apiFetch<Agent[]>("/agents"),
  createAgent: (body: Record<string, unknown>) =>
    apiFetch<Agent>("/agents", { method: "POST", body: JSON.stringify(body) }),
  updateAgent: (id: string, body: Record<string, unknown>) =>
    apiFetch<Agent>(`/agents/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteAgent: (id: string) =>
    apiFetch<{ ok: true }>(`/agents/${id}`, { method: "DELETE" }),

  // Libraries
  getLibraries: () => apiFetch<Library[]>("/libraries"),
  getLibrary: (id: string) => apiFetch<Library>(`/libraries/${id}`),
  createLibrary: (name: string, description?: string) =>
    apiFetch<Library>("/libraries", {
      method: "POST", body: JSON.stringify({ name, description }),
    }),
  deleteLibrary: (id: string) =>
    apiFetch<{ ok: true }>(`/libraries/${id}`, { method: "DELETE" }),
  getLibraryPermissions: (id: string) =>
    apiFetch<Permission[]>(`/libraries/${id}/permissions`),
  addLibraryPermission: (id: string, subject_type: string, subject_id: string, access_level: string) =>
    apiFetch<Permission>(`/libraries/${id}/permissions`, {
      method: "POST", body: JSON.stringify({ subject_type, subject_id, access_level }),
    }),

  // Documents
  getDocuments: (libraryId: string) =>
    apiFetch<DocType[]>(`/documents?library_id=${libraryId}`),
  ingestFile: async (file: File, libraryId: string, title: string): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("library_id", libraryId);
    formData.append("title", title);
    return apiFetchNoContentType<IngestResponse>("/ingest/file", {
      method: "POST", body: formData,
    });
  },

  // Chats
  getChats: () => apiFetch<Chat[]>("/chats"),
  deleteChat: (id: string) =>
    apiFetch<{ ok: true }>(`/chats/${id}`, { method: "DELETE" }),
  getChatMessages: (chatId: string) =>
    apiFetch<ChatMessage[]>(`/chats/${chatId}/messages`),
  query: (body: QueryRequest) =>
    apiFetch<QueryResponse>("/query", { method: "POST", body: JSON.stringify(body) }),

  // Groups
  getGroups: () => apiFetch<Group[]>("/groups"),
  createGroup: (name: string) =>
    apiFetch<Group>("/groups", { method: "POST", body: JSON.stringify({ name }) }),
  getGroupMembers: (id: string) =>
    apiFetch<GroupMember[]>(`/groups/${id}/members`),
  addGroupMember: (id: string, userId: string) =>
    apiFetch<GroupMember>(`/groups/${id}/members`, {
      method: "POST", body: JSON.stringify({ user_id: userId }),
    }),

  // LLM Config
  getLLMProviders: () => apiFetch<LLMProvider[]>("/llm-providers"),
  getLLMConfig: () => apiFetch<TenantLLMConfig[]>("/llm-config"),
  updateLLMConfig: (providerId: string, apiKey: string, settings?: Record<string, unknown>) =>
    apiFetch<TenantLLMConfig>("/llm-config", {
      method: "PUT", body: JSON.stringify({ provider_id: providerId, api_key: apiKey, settings }),
    }),

  // Governance
  getAllowedLibraries: () =>
    apiFetch<{ library_ids: string[] }>("/governance/allowed-libraries"),
};
