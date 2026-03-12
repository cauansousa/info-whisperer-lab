import { authSupabase } from "@/lib/auth-client";
import type {
  MeResponse, Invitation, Agent, Library, Document as DocType,
  Chat, ChatMessage, QueryRequest, QueryResponse,
  LLMProvider, TenantLLMConfig, Group, GroupMember, Permission,
  IngestResponse, Profile, Tenant,
} from "@/types";

/* ── Service hosts ── */
const AUTH_BASE    = "http://18.230.243.121:8001";
const GOVERNANCE_BASE = "http://18.230.243.121:8002";
const INGESTION_BASE  = "http://18.230.243.121:8003";
const MODEL_BASE      = "http://18.230.243.121:8000";

/* ── Token helper ── */
async function getToken(): Promise<string> {
  const { data } = await authSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

/* ── Generic fetch for the 4 API services ── */
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

/* ── Supabase direct helper ── */
function sbThrow(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const api = {
  // ─── Auth service (port 8001) ───
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

  // ─── Governance service (port 8002) ───
  getLibraryPermissions: (id: string) =>
    apiFetch<Permission[]>(GOVERNANCE_BASE, `/governance/library-permissions/${id}`),
  addLibraryPermission: (id: string, subject_type: string, subject_id: string, access_level: string) =>
    apiFetch<Permission>(GOVERNANCE_BASE, "/governance/library-permissions", {
      method: "POST", body: JSON.stringify({ library_id: id, subject_type, subject_id, access_level }),
    }),
  createGroup: (name: string) =>
    apiFetch<Group>(GOVERNANCE_BASE, "/governance/groups", {
      method: "POST", body: JSON.stringify({ name }),
    }),
  addGroupMember: (id: string, userId: string) =>
    apiFetch<GroupMember>(GOVERNANCE_BASE, `/governance/groups/${id}/members`, {
      method: "POST", body: JSON.stringify({ user_id: userId }),
    }),
  getAllowedLibraries: () =>
    apiFetch<{ library_ids: string[] }>(GOVERNANCE_BASE, "/governance/allowed-libraries"),

  // ─── Ingestion service (port 8003) ───
  ingestFile: async (file: File, libraryId: string, title: string): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("library_id", libraryId);
    formData.append("title", title);
    return apiFetchNoContentType<IngestResponse>(INGESTION_BASE, "/ingest/file", {
      method: "POST", body: formData,
    });
  },

  // ─── Model / Query service (port 8000) ───
  query: (body: QueryRequest) =>
    apiFetch<QueryResponse>(MODEL_BASE, "/query", { method: "POST", body: JSON.stringify(body) }),

  // ─── Supabase direct (no API proxy) ───

  // Chats
  getChats: async (): Promise<Chat[]> => {
    const { data, error } = await authSupabase
      .from("chats").select("*").order("created_at", { ascending: false });
    sbThrow(error);
    return data as Chat[];
  },
  deleteChat: async (id: string) => {
    const { error } = await authSupabase.from("chats").delete().eq("id", id);
    sbThrow(error);
    return { ok: true as const };
  },
  getChatMessages: async (chatId: string): Promise<ChatMessage[]> => {
    const { data, error } = await authSupabase
      .from("chat_messages").select("*").eq("chat_id", chatId).order("created_at");
    sbThrow(error);
    return data as ChatMessage[];
  },

  // Agents
  getAgents: async (): Promise<Agent[]> => {
    const { data, error } = await authSupabase
      .from("agents").select("*, agent_libraries(library_id, libraries(name))").order("created_at", { ascending: false });
    sbThrow(error);
    return data as Agent[];
  },
  createAgent: async (body: Record<string, unknown>): Promise<Agent> => {
    const { library_ids, ...agentData } = body as any;
    const config = {
      system_prompt: agentData.system_prompt,
      model_provider_id: agentData.model_provider_id,
      tone: agentData.tone,
      params: { temperature: agentData.temperature, max_tokens: agentData.max_tokens, top_p: agentData.top_p },
      integrations: agentData.integrations,
    };
    const { data, error } = await authSupabase
      .from("agents").insert({ name: agentData.name, description: agentData.description, config }).select().single();
    sbThrow(error);
    // Link libraries
    if (library_ids?.length) {
      const rows = library_ids.map((lid: string) => ({ agent_id: data!.id, library_id: lid }));
      await authSupabase.from("agent_libraries").insert(rows);
    }
    return data as Agent;
  },
  updateAgent: async (id: string, body: Record<string, unknown>): Promise<Agent> => {
    const { library_ids, ...agentData } = body as any;
    const config = {
      system_prompt: agentData.system_prompt,
      model_provider_id: agentData.model_provider_id,
      tone: agentData.tone,
      params: { temperature: agentData.temperature, max_tokens: agentData.max_tokens, top_p: agentData.top_p },
      integrations: agentData.integrations,
    };
    const { data, error } = await authSupabase
      .from("agents").update({ name: agentData.name, description: agentData.description, config }).eq("id", id).select().single();
    sbThrow(error);
    // Re-link libraries
    await authSupabase.from("agent_libraries").delete().eq("agent_id", id);
    if (library_ids?.length) {
      const rows = library_ids.map((lid: string) => ({ agent_id: id, library_id: lid }));
      await authSupabase.from("agent_libraries").insert(rows);
    }
    return data as Agent;
  },
  deleteAgent: async (id: string) => {
    const { error } = await authSupabase.from("agents").delete().eq("id", id);
    sbThrow(error);
    return { ok: true as const };
  },

  // Libraries
  getLibraries: async (): Promise<Library[]> => {
    const { data, error } = await authSupabase
      .from("libraries").select("*").order("created_at", { ascending: false });
    sbThrow(error);
    return data as Library[];
  },
  getLibrary: async (id: string): Promise<Library> => {
    const { data, error } = await authSupabase
      .from("libraries").select("*").eq("id", id).single();
    sbThrow(error);
    return data as Library;
  },
  createLibrary: async (name: string, description?: string): Promise<Library> => {
    const { data, error } = await authSupabase
      .from("libraries").insert({ name, description }).select().single();
    sbThrow(error);
    return data as Library;
  },
  deleteLibrary: async (id: string) => {
    const { error } = await authSupabase.from("libraries").delete().eq("id", id);
    sbThrow(error);
    return { ok: true as const };
  },

  // Documents
  getDocuments: async (libraryId: string): Promise<DocType[]> => {
    const { data, error } = await authSupabase
      .from("documents").select("*").eq("library_id", libraryId).order("created_at", { ascending: false });
    sbThrow(error);
    return data as DocType[];
  },

  // Profiles / Users
  getUsers: async (): Promise<Profile[]> => {
    const { data, error } = await authSupabase
      .from("profiles").select("*").order("created_at");
    sbThrow(error);
    return data as Profile[];
  },

  // Groups (read)
  getGroups: async (): Promise<Group[]> => {
    const { data, error } = await authSupabase
      .from("groups").select("*").order("created_at", { ascending: false });
    sbThrow(error);
    return data as Group[];
  },

  // Group members (read)
  getGroupMembers: async (groupId: string): Promise<GroupMember[]> => {
    const { data, error } = await authSupabase
      .from("group_members").select("*").eq("group_id", groupId);
    sbThrow(error);
    return data as GroupMember[];
  },

  // LLM Config
  getLLMProviders: async (): Promise<LLMProvider[]> => {
    const { data, error } = await authSupabase
      .from("llm_providers").select("*");
    sbThrow(error);
    return data as LLMProvider[];
  },
  getLLMConfig: async (): Promise<TenantLLMConfig[]> => {
    const { data, error } = await authSupabase
      .from("tenant_llm_configs").select("*, llm_providers(*)");
    sbThrow(error);
    return data as TenantLLMConfig[];
  },
  updateLLMConfig: async (providerId: string, apiKey: string, settings?: Record<string, unknown>): Promise<TenantLLMConfig> => {
    const { data, error } = await authSupabase
      .from("tenant_llm_configs")
      .upsert({ provider_id: providerId, api_key: apiKey, settings }, { onConflict: "tenant_id,provider_id" })
      .select("*, llm_providers(*)")
      .single();
    sbThrow(error);
    return data as TenantLLMConfig;
  },

  // Invitations (tenant list - Supabase direct)
  getTenantInvitations: async (): Promise<Invitation[]> => {
    const { data, error } = await authSupabase
      .from("invitations").select("*").order("created_at", { ascending: false });
    sbThrow(error);
    return data as Invitation[];
  },
};
