import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { LLMProvider, TenantLLMConfig } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, Loader2, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AIConfig() {
  const { hasRole } = useAuth();
  const [configs, setConfigs] = useState<TenantLLMConfig[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!hasRole("owner")) { setLoading(false); return; }
    Promise.all([api.getLLMConfig(), api.getLLMProviders()])
      .then(([c, p]) => { setConfigs(c); setProviders(p); })
      .catch(() => toast.error("Failed to load config"))
      .finally(() => setLoading(false));
  }, [hasRole]);

  if (!hasRole("owner")) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <ShieldAlert className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm">Access denied. Only the organization owner can manage AI settings.</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!selectedProvider) return;
    setSaving(true);
    try {
      const config = await api.updateLLMConfig(selectedProvider.id, apiKey);
      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.provider_id === selectedProvider.id);
        if (idx >= 0) return prev.map((c, i) => i === idx ? config : c);
        return [...prev, config];
      });
      setOpen(false);
      setApiKey("");
      setSelectedProvider(null);
      toast.success("Configuration saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const configuredIds = new Set(configs.map((c) => c.provider_id));
  const filteredProviders = providers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.model.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">AI Configuration</h1>
        <Button onClick={() => { setOpen(true); setSelectedProvider(null); setApiKey(""); }}>
          <Settings className="h-4 w-4 mr-1" /> Add / configure provider
        </Button>
      </div>

      {/* Configured providers */}
      {configs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No providers configured yet.</p>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div key={config.id} className="flex items-center justify-between rounded-xl border border-border/30 bg-card/50 px-5 py-4">
              <div>
                <h3 className="text-sm font-medium">{config.llm_providers?.name || config.provider_id}</h3>
                <p className="text-xs text-muted-foreground">{config.llm_providers?.model}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">{config.api_key || "****"}</span>
                <Button variant="outline" size="sm" onClick={() => {
                  const prov = providers.find((p) => p.id === config.provider_id);
                  if (prov) { setSelectedProvider(prov); setApiKey(""); setOpen(true); }
                }}>Edit</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProvider ? `Configure ${selectedProvider.name}` : "Select provider"}</DialogTitle>
            <DialogDescription>Choose a provider and set your API key.</DialogDescription>
          </DialogHeader>

          {!selectedProvider ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search providers..." className="pl-9 bg-secondary/20 border-border/40" />
              </div>
              <div className="max-h-64 overflow-auto space-y-1">
                {filteredProviders.map((p) => (
                  <button key={p.id} onClick={() => { setSelectedProvider(p); setApiKey(""); }}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/30 ${configuredIds.has(p.id) ? "border border-blue-500/30" : ""}`}>
                    <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.model}</p></div>
                    {configuredIds.has(p.id) && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">Configured</Badge>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/30 bg-secondary/10 px-4 py-3">
                <p className="text-sm font-medium">{selectedProvider.name}</p>
                <p className="text-xs text-muted-foreground">{selectedProvider.model}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">API Key</label>
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." required className="bg-secondary/20 border-border/40 font-mono text-xs" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedProvider(null)} className="flex-1">Back</Button>
                <Button onClick={handleSave} disabled={saving || !apiKey} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
