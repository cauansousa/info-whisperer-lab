"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPut, apiPost } from "@/lib/api/client";
import { useProfile } from "@/hooks/use-profile";
import { hasMinRole } from "@/lib/utils/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Plus, KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { TenantLLMConfig, LLMProvider, Role } from "@/types/api";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";

export default function AIConfigPage() {
  const { data: me } = useProfile();
  const queryClient = useQueryClient();

  const isOwner = me ? hasMinRole(me.profile.role as Role, "owner") : false;

  const { data: configs, isLoading: loadingConfig } = useQuery({
    queryKey: ["llm-config"],
    queryFn: () => apiFetch<TenantLLMConfig[]>("/llm-config"),
    enabled: isOwner,
  });

  const { data: providers } = useQuery({
    queryKey: ["llm-providers"],
    queryFn: () => apiFetch<LLMProvider[]>("/llm-providers"),
    enabled: isOwner,
  });

  const [providerId, setProviderId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (configs && configs.length > 0) {
      setProviderId(configs[0].provider_id);
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: (data: { provider_id: string; api_key: string }) =>
      apiPut("/llm-config", data),
    onSuccess: () => {
      toast.success("API key salva");
      queryClient.invalidateQueries({ queryKey: ["llm-config"] });
      setApiKey("");
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const seedProviders = useMutation({
    mutationFn: () => apiPost<LLMProvider[]>("/llm-providers", {}),
    onSuccess: () => {
      toast.success("Modelos carregados");
      queryClient.invalidateQueries({ queryKey: ["llm-providers"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredProviders = useMemo(
    () =>
      (providers ?? []).filter((p) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return (
          p.name.toLowerCase().includes(term) ||
          p.model.toLowerCase().includes(term)
        );
      }),
    [providers, search]
  );

  const selectedProvider = useMemo(
    () => providers?.find((p) => p.id === providerId),
    [providers, providerId]
  );

  const configuredProviders = useMemo(() => {
    const map = new Map<string, TenantLLMConfig>();
    (configs ?? []).forEach((c) => map.set(c.provider_id, c));
    return map;
  }, [configs]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId || !apiKey) {
      toast.error("Selecione um modelo e informe a API key");
      return;
    }
    saveMutation.mutate({ provider_id: providerId, api_key: apiKey });
  }

  if (!isOwner) {
    return (
      <PageContainer>
        <SectionCard className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            Only the organization owner can configure AI settings.
          </p>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Settings className="h-6 w-6" />
            AI Configuration
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha um modelo e salve a API key. Configurações específicas ficam em Agents.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => seedProviders.mutate()}
            disabled={seedProviders.isPending}
          >
            {seedProviders.isPending ? "Carregando..." : "Carregar modelos"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar API key
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Selecionar modelo e API key</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
                <div className="space-y-2">
                  <Input
                    placeholder="Buscar nome ou model"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="max-h-[420px] overflow-auto rounded-md border border-border/60 bg-background/60 p-2">
                    {filteredProviders.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-muted-foreground">
                        Nenhum modelo. Clique em “Carregar modelos”.
                      </p>
                    ) : (
                      <div className="grid gap-2 md:grid-cols-2">
                        {filteredProviders.map((p) => {
                          const selected = providerId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setProviderId(p.id)}
                              className={`rounded-md border p-3 text-left transition hover:border-primary ${
                                selected ? "border-primary bg-primary/5" : "border-muted"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium">{p.name}</p>
                                  <p className="text-xs text-muted-foreground">{p.model}</p>
                                  {p.base_url && (
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                      {p.base_url}
                                    </p>
                                  )}
                                </div>
                                <div
                                  className={`h-4 w-4 rounded-full border ${
                                    selected ? "border-primary bg-primary" : "border-muted"
                                  }`}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1 rounded-md border border-border/60 bg-muted/30 p-3">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <KeyRound className="h-4 w-4" />
                      {selectedProvider ? selectedProvider.name : "Nenhum modelo selecionado"}
                    </p>
                    {selectedProvider && (
                      <p className="text-xs text-muted-foreground">
                        {selectedProvider.model}
                        {selectedProvider.base_url ? ` • ${selectedProvider.base_url}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>API key</Label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Cole a chave do provedor selecionado"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      A chave é salva no backend e não é exibida depois.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending || !providerId || !apiKey}
                    className="w-full"
                  >
                    {saveMutation.isPending ? "Salvando..." : "Salvar API key"}
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <SectionCard>
        <CardHeader>
          <CardTitle>Configuração atual</CardTitle>
          <CardDescription>Modelos com chave salva.</CardDescription>
        </CardHeader>
        <CardContent>
          {(configs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma configuração salva.</p>
          ) : (
            <div className="space-y-2">
              {(configs ?? []).map((c) => {
                const prov = providers?.find((p) => p.id === c.provider_id);
                return (
                  <div key={c.provider_id} className="rounded-md border border-border/60 bg-background/50 p-3">
                    <p className="text-sm font-medium">{prov?.name ?? c.provider_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {prov?.model ?? ""} • API key {c.api_key ?? "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </SectionCard>
    </PageContainer>
  );
}
