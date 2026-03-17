export type Role = "owner" | "admin" | "manager" | "member";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  email: string;
  name?: string;
  role: Role;
  created_at: string;
}

export interface MeResponse {
  user_id: string;
  tenant: Tenant;
  profile: Profile;
}

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  token: string;
  status: "pending" | "accepted" | "expired";
  expires_at: string;
  created_at: string;
  tenant_name?: string;
}

export interface Agent {
  id: string;
  tenant_id: string;
  user_id?: string;
  name: string;
  description?: string;
  config?: {
    system_prompt?: string;
    model_provider_id?: string;
    tone?: string;
    params?: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
    };
    integrations?: Record<string, boolean>;
  };
  created_at: string;
  agent_libraries?: {
    library_id: string;
    libraries?: { name: string };
  }[];
}

export interface Library {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  system_prompt?: string;
  created_at: string;
}

export interface Document {
  id: string;
  tenant_id: string;
  library_id: string;
  title: string;
  mime_type: string;
  size_bytes: number;
  status: "processing" | "ready" | "error";
  created_at: string;
}

export interface Chat {
  id: string;
  tenant_id: string;
  user_id: string;
  agent_id?: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  tenant_id: string;
  sender_type: "user" | "agent";
  sender_id?: string;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SourceItem {
  document_id: string;
  document_title: string;
  library_id: string;
  metadata?: Record<string, unknown>;
}

export interface QueryRequest {
  question: string;
  agent_id?: string;
  library_ids?: string[];
  chat_id?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface QueryResponse {
  chat_id: string;
  agent_id?: string;
  answer: string;
  sources: SourceItem[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMProvider {
  id: string;
  name: string;
  base_url?: string;
  model: string;
}

export interface TenantLLMConfig {
  id: string;
  tenant_id: string;
  provider_id: string;
  api_key: string | null;
  settings?: {
    max_tokens?: number;
    temperature?: number;
    system_prompt?: string;
  };
  llm_providers?: LLMProvider;
}

export interface Group {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  tenant_id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface Permission {
  id: string;
  subject_type: "user" | "group" | "role";
  subject_id: string;
  access_level: "read" | "admin";
}

export interface IngestResponse {
  document_id: string;
  library_id: string;
  status: string;
  chunks_count: number;
}

export interface DriveConnection {
  id: string;
  library_id: string;
  provider: string;
  folder_id?: string;
  folder_name?: string;
  status: "active" | "paused" | "error" | "pending";
  last_synced_at?: string;
  sync_interval_minutes: number;
  error_message?: string;
  created_at: string;
}
