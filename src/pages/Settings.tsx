import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowDownToLine, RefreshCw, CreditCard, Sparkles, ExternalLink } from "lucide-react";
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
  const [useLocal, setUseLocal] = useState(isUsingLocalOllama);
  const [localModel, setLocalModel] = useState(getLocalOllamaModel);
  const isTauri = isRunningInTauri();

  const { plan, subscribed, isTrialing, daysLeft, subscriptionEnd, loading: planLoading, refresh: refreshPlan } = usePlan();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

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
      const { data, error } = await authSupabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
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
      const { data, error } = await authSupabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
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
    <div className="p-6 max-w-2xl mx-auto space-y-6">
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
          <Card>
            <CardHeader>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>Gerencie sua assinatura e métodos de pagamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {planLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Carregando…
                </div>
              ) : subscribed && currentTier ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-sm px-3 py-1">
                      {currentTier.name}
                    </Badge>
                    {isTrialing && (
                      <Badge className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">
                        Trial — {daysLeft} dia{daysLeft !== 1 ? "s" : ""} restante{daysLeft !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  {subscriptionEnd && (
                    <p className="text-sm text-muted-foreground">
                      Próxima cobrança: {new Date(subscriptionEnd).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePortal} disabled={portalLoading} className="gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" />
                      {portalLoading ? "Abrindo…" : "Gerenciar assinatura"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={refreshPlan} className="gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" /> Atualizar status
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Você ainda não possui um plano ativo. Escolha um plano para começar.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="border-border/40">
                      <CardContent className="pt-4 space-y-2">
                        <p className="font-semibold">Starter</p>
                        <p className="text-2xl font-bold">R$1.500<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                        <p className="text-xs text-muted-foreground">Até 50 funcionários</p>
                        <Button variant="outline" onClick={() => handleCheckout(STRIPE_TIERS.starter.price_id)} disabled={checkoutLoading} className="w-full gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          {checkoutLoading ? "Abrindo…" : "Começar trial grátis"}
                        </Button>
                      </CardContent>
                    </Card>
                    <Card className="border-border/40">
                      <CardContent className="pt-4 space-y-2">
                        <p className="font-semibold">Growth</p>
                        <p className="text-2xl font-bold">R$4.500<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                        <p className="text-xs text-muted-foreground">200–500 funcionários</p>
                        <Button onClick={() => handleCheckout(STRIPE_TIERS.growth.price_id)} disabled={checkoutLoading} className="w-full gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          {checkoutLoading ? "Abrindo…" : "Começar trial grátis"}
                        </Button>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/40">
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">Business</p>
                          <Badge variant="outline" className="text-xs">Recomendado</Badge>
                        </div>
                        <p className="text-2xl font-bold">R$11.000<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                        <p className="text-xs text-muted-foreground">500–1.500 funcionários</p>
                        <Button variant="default" onClick={() => handleCheckout(STRIPE_TIERS.business.price_id)} disabled={checkoutLoading} className="w-full gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          {checkoutLoading ? "Abrindo…" : "Começar trial grátis"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
