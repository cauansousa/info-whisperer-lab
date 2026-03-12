"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/lib/api/client";
import { useAgents } from "@/hooks/use-agents";
import { useLibraries } from "@/hooks/use-libraries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Agent, LLMProvider, TenantLLMConfig } from "@/types/api";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";

interface AgentFormState {
  id?: string;
  name: string;
  description?: string;
  system_prompt?: string;
  tone?: string;
  library_ids: string[];
  model_provider_id: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  integrations: Record<string, boolean>;
}

export default function AgentsPage() {
  const { data: agents } = useAgents();
  const { data: libraries } = useLibraries();
  const { data: providers } = useQuery({
    queryKey: ["llm-providers"],
    queryFn: () => apiFetch<LLMProvider[]>("/llm-providers"),
    staleTime: 5 * 60 * 1000,
  });
  const { data: llmConfigs } = useQuery({
    queryKey: ["llm-config"],
    queryFn: () => apiFetch<TenantLLMConfig[]>("/llm-config"),
    staleTime: 5 * 60 * 1000,
  });
  const queryClient = useQueryClient();

  const configuredModels = useMemo(() => {
    if (!llmConfigs || !providers) return [] as { id: string; name: string; model: string }[];
    return llmConfigs.map((cfg) => {
      const provider = providers.find((p) => p.id === cfg.provider_id);
      return {
        id: cfg.provider_id,
        name: provider?.name ?? cfg.provider_id,
        model: provider?.model ?? "",
      };
    });
  }, [llmConfigs, providers]);

  const modelLookup = useMemo(() => {
    const map = new Map<string, { name: string; model: string }>();
    configuredModels.forEach((m) => map.set(m.id, { name: m.name, model: m.model }));
    return map;
  }, [configuredModels]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AgentFormState>({
    name: "",
    description: "",
    system_prompt: "",
    tone: "",
    library_ids: [],
    model_provider_id: "",
    temperature: 0.2,
    max_tokens: 800,
    top_p: 1,
    integrations: {},
  });

  useEffect(() => {
    if (configuredModels.length > 0 && !form.model_provider_id) {
      setForm((prev) => ({ ...prev, model_provider_id: configuredModels[0].id }));
    }
  }, [configuredModels, form.model_provider_id]);

  const isEdit = !!form.id;

  function resetForm() {
    setForm({
      id: undefined,
      name: "",
      description: "",
      system_prompt: "",
      tone: "",
      library_ids: [],
      model_provider_id: "",
      temperature: 0.2,
      max_tokens: 800,
      top_p: 1,
      integrations: {},
    });
  }

  const createMutation = useMutation({
    mutationFn: (data: AgentFormState) => apiPost("/admin/agents", data),
    onSuccess: () => {
      toast.success("Agent saved");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: AgentFormState) => apiPut(`/admin/agents/${data.id}`, data),
    onSuccess: () => {
      toast.success("Agent updated");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (agentId: string) => apiDelete(`/admin/agents/${agentId}`),
    onSuccess: () => {
      toast.success("Agent removed");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (err) => toast.error(err.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.model_provider_id) {
      toast.error("Selecione um modelo configurado");
      return;
    }
    if (isEdit) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  }

  function toggleLibrary(id: string) {
    setForm((prev) => {
      const set = new Set(prev.library_ids);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...prev, library_ids: Array.from(set) };
    });
  }

  function openEdit(agent: Agent) {
    setForm({
      id: agent.id,
      name: agent.name,
      description: agent.description ?? "",
      system_prompt: agent.config?.system_prompt ?? "",
      tone: agent.config?.tone ?? "",
      model_provider_id: agent.config?.model_provider_id ?? "",
      temperature: agent.config?.params?.temperature ?? 0.2,
      max_tokens: agent.config?.params?.max_tokens ?? 800,
      top_p: agent.config?.params?.top_p ?? 1,
      integrations: agent.config?.integrations ?? {},
      library_ids: agent.agent_libraries?.map((al) => al.library_id) ?? [],
    });
    setOpen(true);
  }

  const sortedAgents = useMemo(
    () => (agents ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    [agents]
  );

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Configure assistants and their library scopes
          </p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New agent
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit agent" : "Create agent"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <Tabs defaultValue="basic">
                <TabsList className="w-full">
                  <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
                  <TabsTrigger value="name" className="flex-1">Name</TabsTrigger>
                  <TabsTrigger value="library" className="flex-1">Library</TabsTrigger>
                  <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>System prompt</Label>
                    <Textarea
                      value={form.system_prompt}
                      onChange={(e) => setForm((p) => ({ ...p, system_prompt: e.target.value }))}
                      rows={4}
                      placeholder="Instructions the agent will always follow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={form.model_provider_id}
                      onValueChange={(val) => setForm((p) => ({ ...p, model_provider_id: val ?? "" }))}
                      disabled={(configuredModels ?? []).length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a configured model" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {(configuredModels ?? []).map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <div className="flex flex-col">
                              <span className="text-sm">{m.name}</span>
                              <span className="text-xs text-muted-foreground">{m.model}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(configuredModels ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum modelo disponível. Configure uma API key em AI Configuration.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Tom de voz</Label>
                    <Input
                      value={form.tone ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, tone: e.target.value }))}
                      placeholder="Ex: formal, técnico, amigável, conciso"
                    />
                    <p className="text-xs text-muted-foreground">
                      Define o estilo de comunicação do agente.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="name" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Agent name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description of what this agent does"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="library" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Libraries this agent can access</Label>
                    <div className="max-h-64 space-y-2 overflow-auto rounded-md border border-border/60 bg-background/60 p-3">
                      {libraries?.length ? (
                        libraries.map((lib) => {
                          const checked = form.library_ids.includes(lib.id);
                          return (
                            <label
                              key={lib.id}
                              className="-m-1 flex cursor-pointer items-center gap-2 rounded p-1 text-sm hover:bg-muted/50"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleLibrary(lib.id)}
                                className="h-4 w-4 rounded border border-input"
                              />
                              <span>{lib.name}</span>
                            </label>
                          );
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No libraries yet. Create one in the Libraries section.
                        </p>
                      )}
                    </div>
                    {form.library_ids.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {form.library_ids.length} library(ies) selected
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Temperature</Label>
                      <Input
                        type="number"
                        min={0}
                        max={2}
                        step={0.1}
                        value={form.temperature}
                        onChange={(e) =>
                          setForm((p) => {
                            const v = parseFloat(e.target.value);
                            return { ...p, temperature: Number.isNaN(v) ? undefined : v };
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Max tokens</Label>
                      <Input
                        type="number"
                        min={1}
                        step={50}
                        value={form.max_tokens}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, max_tokens: parseInt(e.target.value, 10) || undefined }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Top-p</Label>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={form.top_p}
                        onChange={(e) =>
                          setForm((p) => {
                            const v = parseFloat(e.target.value);
                            return { ...p, top_p: Number.isNaN(v) ? undefined : v };
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tools</Label>
                    <div className="space-y-2 rounded-md border border-border/60 bg-background/60 p-3">
                      {[
                        { key: "web_search", label: "Web search" },
                        { key: "code_interpreter", label: "Code interpreter" },
                      ].map((tool) => {
                        const checked = form.integrations?.[tool.key] ?? false;
                        return (
                          <label key={tool.key} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  integrations: {
                                    ...prev.integrations,
                                    [tool.key]: !checked,
                                  },
                                }))
                              }
                              className="h-4 w-4 rounded border border-input"
                            />
                            <span>{tool.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Save changes" : "Create agent"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <SectionCard className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedAgents.map((agent) => (
            <Card key={agent.id} className="h-full border-border/60 bg-card/80 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  {agent.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {agent.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(agent)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(agent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {agent.config?.system_prompt && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {agent.config.system_prompt}
                  </p>
                )}
                {agent.config?.model_provider_id && (
                  <p className="text-xs text-muted-foreground">
                    Modelo: {modelLookup.get(agent.config.model_provider_id)?.name ?? agent.config.model_provider_id}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {(agent.agent_libraries ?? []).map((al) => (
                    <Badge key={al.library_id} variant="secondary">
                      {al.libraries?.name ?? al.library_id}
                    </Badge>
                  ))}
                  {(!agent.agent_libraries || agent.agent_libraries.length === 0) && (
                    <Badge variant="outline">No libraries</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
