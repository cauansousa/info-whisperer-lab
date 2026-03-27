import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getApiBase, setApiBase, resetApiBase, getDefaultApiBase, isRunningInTauri } from "@/lib/config";

export default function Settings() {
  const [apiUrl, setApiUrl] = useState(getApiBase());
  const [testing, setTesting] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const isTauri = isRunningInTauri();

  useEffect(() => {
    if (!isTauri) return;
    import("@tauri-apps/api/core")
      .then(({ invoke }) => invoke<boolean>("check_ollama"))
      .then(setOllamaAvailable)
      .catch(() => setOllamaAvailable(false));
  }, [isTauri]);

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
              {ollamaAvailable === null && <Badge variant="outline">Checking…</Badge>}
              {ollamaAvailable === true && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ollama detected</Badge>}
              {ollamaAvailable === false && <Badge variant="secondary">Not found</Badge>}
            </div>
            {ollamaAvailable === false && (
              <p className="text-xs text-muted-foreground">
                Install Ollama from{" "}
                <span className="font-mono">ollama.com</span> to use local models.
                After installing, restart the app.
              </p>
            )}
            {ollamaAvailable === true && (
              <p className="text-xs text-muted-foreground">
                Select an Ollama model from the AI Config page to use it in chats.
              </p>
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
          {isTauri && <p className="font-mono text-xs">Desktop client</p>}
          {!isTauri && <p className="font-mono text-xs">Web client</p>}
        </CardContent>
      </Card>
    </div>
  );
}
