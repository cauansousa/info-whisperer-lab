import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowDownToLine, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiBase, setApiBase, resetApiBase, getDefaultApiBase, isRunningInTauri } from "@/lib/config";
import {
  listOllamaModels,
  getLocalOllamaModel,
  isUsingLocalOllama,
  setUseLocalOllama,
  setLocalOllamaModel,
} from "@/lib/local-llm";

const CURRENT_VERSION = "0.1.4";
const GITHUB_REPO = "cauansousa/info-whisperer-lab";

type UpdateState = "idle" | "checking" | "up-to-date" | "available";

export default function Settings() {
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

      // Find the right asset for this platform
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
    if (downloadUrl) window.open(downloadUrl, "_blank");
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        toast.success("Connection successful");
      } else {
        toast.error(`Server returned ${res.status}`);
      }
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

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-display font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Server Connection</CardTitle>
          <CardDescription>
            Configure the backend URL. Use this to point the app at a self-hosted instance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">API Base URL</Label>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.example.com"
            />
            <p className="text-xs text-muted-foreground">
              Default: {getDefaultApiBase()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTest} variant="outline" disabled={testing}>
              {testing ? "Testing…" : "Test connection"}
            </Button>
            <Button onClick={handleSave} disabled={apiUrl === getApiBase()}>
              Save &amp; reload
            </Button>
            <Button onClick={handleReset} variant="ghost">
              Reset to default
            </Button>
          </div>
        </CardContent>
      </Card>

      {isTauri && (
        <Card>
          <CardHeader>
            <CardTitle>Local AI (Ollama)</CardTitle>
            <CardDescription>
              Run AI models locally on your machine without sending data to the cloud.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Status:</span>
              {ollamaAvailable === null && <Badge variant="outline">Verificando…</Badge>}
              {ollamaAvailable === true && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ollama detectado</Badge>}
              {ollamaAvailable === false && <Badge variant="secondary">Não encontrado</Badge>}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshOllama}
                disabled={checkingOllama || ollamaAvailable === null}
                className="h-6 w-6 p-0"
                title="Verificar novamente"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${checkingOllama ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {ollamaAvailable === false && (
              <p className="text-xs text-muted-foreground">
                Instale o Ollama em{" "}
                <span className="font-mono">ollama.com</span> para usar modelos locais.
                Após instalar, clique no botão de refresh acima.
              </p>
            )}
            {ollamaAvailable === true && (
              <>
                {ollamaModels.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Modelo local</Label>
                    <Select value={localModel} onValueChange={handleModelChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {ollamaModels.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-sm font-medium">Usar Ollama local para chats</p>
                    <p className="text-xs text-muted-foreground">
                      Ativo por padrão. Desative para forçar o cloud backend.
                    </p>
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
            <CardDescription>
              Check if there is a newer version of Knowledge AI available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Current version:</span>
              <Badge variant="outline" className="font-mono">v{CURRENT_VERSION}</Badge>
            </div>

            {updateState === "up-to-date" && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                You're up to date
              </Badge>
            )}

            {updateState === "available" && latestVersion && (
              <div className="flex items-center gap-3">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  v{latestVersion} available
                </Badge>
                <Button size="sm" onClick={openDownload} className="gap-2">
                  <ArrowDownToLine className="h-4 w-4" />
                  Download update
                </Button>
              </div>
            )}

            {(updateState === "idle" || updateState === "up-to-date") && (
              <Button
                variant="outline"
                size="sm"
                onClick={checkForUpdate}
                disabled={updateState === "checking"}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${updateState === "checking" ? "animate-spin" : ""}`} />
                {updateState === "checking" ? "Checking…" : "Check for updates"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Knowledge AI</p>
          {isTauri && <p className="font-mono text-xs">Desktop client v{CURRENT_VERSION}</p>}
          {!isTauri && <p className="font-mono text-xs">Web client</p>}
        </CardContent>
      </Card>
    </div>
  );
}
