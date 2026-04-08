import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowDownToLine, RefreshCw, CreditCard, Sparkles, ExternalLink, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiBase, setApiBase, resetApiBase, getDefaultApiBase, isRunningInTauri } from "@/lib/config";
import { invoke } from "@tauri-apps/api/core";
import {
  listOllamaModels,
  getLocalOllamaModel,
  isUsingLocalOllama,
  setUseLocalOllama,
  setLocalOllamaModel,
} from "@/lib/local-llm";
import { usePlan } from "@/hooks/usePlan";
import { STRIPE_TIERS } from "@/lib/stripe-config";
import { authSupabase } from "@/lib/auth-client";
import { invokeEdgeFunction } from "@/lib/edge-functions";

const CURRENT_VERSION = "0.1.5";
const GITHUB_REPO = "cauansousa/info-whisperer-lab";

type UpdateState = "idle" | "checking" | "up-to-date" | "available";

export default function Settings() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "billing" ? "billing" : "general";

  const [apiUrl, setApiUrl] = useState(getApiBase());
  const [testing, setTesting] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [checkingOllama, setCheckingOllama] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [useLocal, setUseLocal] = useState(isUsingLocalOllama());
  const [localModel, setLocalModel] = useState(getLocalOllamaModel());
  const isTauri = isRunningInTauri();

  const { plan, subscribed, isTrialing, daysLeft, subscriptionEnd, loading: planLoading, refresh: refreshPlan } = usePlan();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Auto-open checkout if ?plan= is set and user has no subscription
  useEffect(() => {
    if (planLoading) return;
    const planParam = searchParams.get("plan");
    if (planParam && !subscribed) {
      const tier = STRIPE_TIERS[planParam as keyof typeof STRIPE_TIERS];
      if (tier && tier.price_id) {
        handleCheckout(tier.price_id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planLoading, subscribed]);

  async function refreshOllama() {
    if (!isTauri) return;
    setCheckingOllama(true);
    setOllamaAvailable(null);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<boolean>("check_ollama");
      setOllamaAvailable(result);
      if (result) {
        const models = await listOllamaModels().catch(() => [] as string[]);
        setOllamaModels(models);
        if (models.length > 0 && !localModel) {
          setLocalModel(models[0]);
          setLocalOllamaModel(models[0]);
        }
      }
    } catch {
      setOllamaAvailable(false);
    } finally {
      setCheckingOllama(false);
    }
  }

  function handleToggleLocal(checked: boolean) {
    setUseLocal(checked);
    setUseLocalOllama(checked);
    toast.success(checked ? "Modo local ativado — queries vão para o Ollama" : "Modo cloud ativado");
  }

  function handleModelChange(model: string) {
    setLocalModel(model);
    setLocalOllamaModel(model);
  }

  useEffect(() => {
    refreshOllama();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTauri]);

  async function checkForUpdate() {
    setUpdateState("checking");
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await res.json();
      const latest: string = (data.tag_name ?? "").replace(/^v/, "");
      setLatestVersion(latest);
      const isMac = navigator.userAgent.includes("Mac");
      const asset = (data.assets ?? []).find((a: { name: string }) =>
        isMac ? a.name.endsWith(".dmg") : a.name.endsWith(".exe")
      );
      setDownloadUrl(asset?.browser_download_url ?? data.html_url);
      if (latest && latest !== CURRENT_VERSION) {
        setUpdateState("available");
      } else {
        setUpdateState("up-to-date");
      }
    } catch {
      toast.error("Could not check for updates");
      setUpdateState("idle");
    }
  }

  function openDownload() {
    if (!downloadUrl) return;
    if (isTauri) {
      invoke("open_url", { url: downloadUrl }).catch(() => {
        window.open(downloadUrl, "_blank");
      });
    } else {
      window.open(downloadUrl, "_blank");
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) toast.success("Connection successful");
      else toast.error(`Server returned ${res.status}`);
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    setApiBase(apiUrl);
    toast.success("Settings saved — reloading…");
    setTimeout(() => window.location.reload(), 800);
  }

  function handleReset() {
    const def = getDefaultApiBase();
    setApiUrl(def);
    resetApiBase();
    toast.success("Reset to default — reloading…");
    setTimeout(() => window.location.reload(), 800);
  }

  async function handleCheckout(priceId: string) {
    setCheckoutLoading(true);
    try {
      const { data: { session } } = await authSupabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const { data, error } = await invokeEdgeFunction("create-checkout", {
        token: session.access_token,
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Erro ao iniciar checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const { data: { session } } = await authSupabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const { data, error } = await invokeEdgeFunction("customer-portal", {
        token: session.access_token,
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Erro ao abrir portal de cobrança");
    } finally {
      setPortalLoading(false);
    }
  }

  const currentTier = plan ? STRIPE_TIERS[plan as keyof typeof STRIPE_TIERS] : null;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-display font-semibold">Settings</h1>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Plano e Cobrança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Server Connection</CardTitle>
              <CardDescription>Configure the backend URL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">API Base URL</Label>
                <Input id="api-url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://api.example.com" />
                <p className="text-xs text-muted-foreground">Default: {getDefaultApiBase()}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTest} variant="outline" disabled={testing}>{testing ? "Testing…" : "Test connection"}</Button>
                <Button onClick={handleSave} disabled={apiUrl === getApiBase()}>Save &amp; reload</Button>
                <Button onClick={handleReset} variant="ghost">Reset to default</Button>
              </div>
            </CardContent>
          </Card>

          {isTauri && (
            <Card>
              <CardHeader>
                <CardTitle>Local AI (Ollama)</CardTitle>
                <CardDescription>Run AI models locally on your machine.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {ollamaAvailable === null && <Badge variant="outline">Verificando…</Badge>}
                  {ollamaAvailable === true && <Badge className="bg-[hsl(142,76%,36%)]/20 text-[hsl(142,76%,46%)] border-[hsl(142,76%,36%)]/30">Ollama detectado</Badge>}
                  {ollamaAvailable === false && <Badge variant="secondary">Não encontrado</Badge>}
                  <Button variant="ghost" size="sm" onClick={refreshOllama} disabled={checkingOllama || ollamaAvailable === null} className="h-6 w-6 p-0">
                    <RefreshCw className={`h-3.5 w-3.5 ${checkingOllama ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                {ollamaAvailable === false && (
                  <p className="text-xs text-muted-foreground">
                    Instale o Ollama em <span className="font-mono">ollama.com</span> para usar modelos locais.
                  </p>
                )}
                {ollamaAvailable === true && (
                  <>
                    {ollamaModels.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Modelo local</Label>
                        <Select value={localModel} onValueChange={handleModelChange}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione um modelo" /></SelectTrigger>
                          <SelectContent>{ollamaModels.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-sm font-medium">Usar Ollama local para chats</p>
                        <p className="text-xs text-muted-foreground">Ativo por padrão. Desative para forçar o cloud backend.</p>
                      </div>
                      <Switch checked={useLocal} onCheckedChange={handleToggleLocal} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {isTauri && (
            <Card>
              <CardHeader>
                <CardTitle>Updates</CardTitle>
                <CardDescription>Check for newer versions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Current version:</span>
                  <Badge variant="outline" className="font-mono">v{CURRENT_VERSION}</Badge>
                </div>
                {updateState === "up-to-date" && (
                  <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success-foreground))] border-[hsl(var(--success))]/30">You're up to date</Badge>
                )}
                {updateState === "available" && latestVersion && (
                  <div className="flex items-center gap-3">
                    <Badge className="bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning-foreground))] border-[hsl(var(--warning))]/30">v{latestVersion} available</Badge>
                    <Button size="sm" onClick={openDownload} className="gap-2"><ArrowDownToLine className="h-4 w-4" />Download update</Button>
                  </div>
                )}
                {(updateState === "idle" || updateState === "up-to-date") && (
                  <Button variant="outline" size="sm" onClick={checkForUpdate} className="gap-2"><RefreshCw className="h-4 w-4" />Check for updates</Button>
                )}
                {updateState === "checking" && (
                  <Button variant="outline" size="sm" disabled className="gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Checking…</Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>About</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Knowledge AI</p>
              {isTauri && <p className="font-mono text-xs">Desktop client v{CURRENT_VERSION}</p>}
              {!isTauri && <p className="font-mono text-xs">Web client</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>Informações da sua assinatura ativa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {planLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Carregando…
                </div>
              ) : subscribed && currentTier ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-sm px-3 py-1">
                      {currentTier.name}
                    </Badge>
                    {isTrialing && (
                      <Badge className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">
                        Trial — {daysLeft} dia{daysLeft !== 1 ? "s" : ""} restante{daysLeft !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {!isTrialing && (
                      <Badge className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
                        Ativo
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="text-sm font-medium">{currentTier.price}{currentTier.period}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Integrações</p>
                      <p className="text-sm font-medium">
                        {currentTier.limits.integrations === Infinity ? "Ilimitadas" : `Até ${currentTier.limits.integrations}`}
                      </p>
                    </div>
                    {subscriptionEnd && (
                      <div>
                        <p className="text-xs text-muted-foreground">Próxima cobrança</p>
                        <p className="text-sm font-medium">{new Date(subscriptionEnd).toLocaleDateString("pt-BR")}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Setup</p>
                      <p className="text-sm font-medium">{currentTier.setup}</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 pt-2">
                    {currentTier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(142, 76%, 46%)' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <Badge variant="secondary" className="text-sm px-3 py-1">Sem plano</Badge>
                  <p className="text-sm text-muted-foreground">Escolha um plano abaixo para começar.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Management Actions */}
          {subscribed && (
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento</CardTitle>
                <CardDescription>Gerencie pagamentos, faturas e métodos de cobrança.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={handlePortal} disabled={portalLoading} className="gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    {portalLoading ? "Abrindo…" : "Métodos de pagamento"}
                  </Button>
                  <Button variant="outline" onClick={handlePortal} disabled={portalLoading} className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {portalLoading ? "Abrindo…" : "Histórico de faturas"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={refreshPlan} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Atualizar status
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ao clicar, você será redirecionado para o portal seguro de cobrança.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Plan Comparison / Upgrade */}
          <Card>
            <CardHeader>
              <CardTitle>{subscribed ? "Alterar plano" : "Escolha um plano"}</CardTitle>
              <CardDescription>
                {subscribed
                  ? "Compare os planos e faça upgrade ou downgrade."
                  : "Comece com 14 dias grátis. Sem compromisso."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {(["starter", "growth", "business"] as const).map((key) => {
                  const tier = STRIPE_TIERS[key];
                  const isCurrent = plan === key;
                  const isRecommended = key === "business";
                  return (
                    <Card
                      key={key}
                      className={`relative transition-all ${
                        isCurrent
                          ? "border-primary/60 bg-primary/10 ring-1 ring-primary/20"
                          : isRecommended
                          ? "border-primary/40 bg-card"
                          : "border-border bg-card"
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute -top-2.5 left-3">
                          <Badge className="bg-primary text-primary-foreground text-xs">Plano atual</Badge>
                        </div>
                      )}
                      {!isCurrent && isRecommended && (
                        <div className="absolute -top-2.5 left-3">
                          <Badge variant="outline" className="text-xs border-primary/50 bg-card">Recomendado</Badge>
                        </div>
                      )}
                      <CardContent className="pt-6 space-y-4">
                        <p className="font-semibold">{tier.name}</p>
                        <p className="text-2xl font-bold">
                          {tier.price}
                          <span className="text-sm font-normal text-muted-foreground">{tier.period}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{tier.description}</p>
                        <ul className="space-y-1.5 text-xs">
                          {tier.features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-muted-foreground">
                              <Check className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(142, 76%, 46%)' }} />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <Button variant="outline" className="w-full" disabled>
                            Plano atual
                          </Button>
                        ) : (
                          <Button
                            variant={isRecommended ? "default" : "outline"}
                            className="w-full gap-1.5"
                            onClick={() => handleCheckout(tier.price_id)}
                            disabled={checkoutLoading}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {checkoutLoading
                              ? "Abrindo…"
                              : subscribed
                              ? "Mudar para este plano"
                              : "Começar trial grátis"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Enterprise CTA */}
              <div className="mt-4 p-4 rounded-lg border border-border/40 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                <div>
                  <p className="font-semibold text-sm">Enterprise</p>
                  <p className="text-xs text-muted-foreground">1.500+ funcionários ou regulados — sob medida</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/#cta">Falar com vendas</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
