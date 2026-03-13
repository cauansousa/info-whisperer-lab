import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Agent, LLMProvider } from "@/types";
import { Bot, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AgentForm {
  name: string;
  description: string;
  system_prompt: string;
  tone: string;
  model_provider_id: string;
  library_ids: string[];
  temperature: number;
  max_tokens: number;
  top_p: number;
  integrations: Record<string, boolean>;
}

const defaultForm: AgentForm = {
  name: "", description: "", system_prompt: "", tone: "", model_provider_id: "",
  library_ids: [], temperature: 0.7, max_tokens: 2048, top_p: 1.0,
  integrations: { web_search: false, code_interpreter: false },
};

interface AllowedLibrary {
  id: string;
  name: string;
  system_prompt?: string;
}

export default function UserAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allowedLibraries, setAllowedLibraries] = useState<AllowedLibrary[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AgentForm>({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getAgents().catch(() => [] as Agent[]),
      api.getAllowedLibraries().catch(() => ({ library_ids: [] })),
      api.getLLMProviders().catch(() => [] as LLMProvider[]),
    ]).then(async ([a, libs, p]) => {
      setAgents(a);
      setProviders(p);
      // Fetch library names for display
      const details = await Promise.all(
        libs.library_ids.map((id: string) =>
          api.getLibrary(id)
            .then((l) => ({ id: l.id, name: l.name, system_prompt: l.system_prompt }))
            .catch(() => ({ id, name: id.slice(0, 8) + "…" }))
        )
      );
      setAllowedLibraries(details);
    }).finally(() => setLoading(false));
  }, []);

  const openEdit = (agent: Agent) => {
    setEditId(agent.id);
    setForm({
      name: agent.name,
      description: agent.description || "",
      system_prompt: agent.config?.system_prompt || "",
      tone: agent.config?.tone || "",
      model_provider_id: agent.config?.model_provider_id || "",
      library_ids: agent.agent_libraries?.map((al) => al.library_id) || [],
      temperature: agent.config?.params?.temperature ?? 0.7,
      max_tokens: agent.config?.params?.max_tokens ?? 2048,
      top_p: agent.config?.params?.top_p ?? 1.0,
      integrations: agent.config?.integrations || { web_search: false, code_interpreter: false },
    });
    setOpen(true);
  };

  const openNew = () => { setEditId(null); setForm({ ...defaultForm }); setOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        system_prompt: form.system_prompt || undefined,
        model_provider_id: form.model_provider_id || undefined,
        tone: form.tone || undefined,
        library_ids: form.library_ids,
        temperature: form.temperature,
        max_tokens: form.max_tokens,
        top_p: form.top_p,
        integrations: form.integrations,
      };
      if (editId) {
        const updated = await api.updateAgent(editId, body);
        setAgents((prev) => prev.map((a) => a.id === editId ? updated : a));
      } else {
        const created = await api.createAgent(body);
        setAgents((prev) => [created, ...prev]);
      }
      setOpen(false);
      toast.success(editId ? "Agent updated" : "Agent created");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAgent(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      toast.success("Agent deleted");
    } catch { toast.error("Failed to delete agent"); }
  };

  const toggleLib = (id: string) => {
    setForm((prev) => ({
      ...prev,
      library_ids: prev.library_ids.includes(id) ? prev.library_ids.filter((l) => l !== id) : [...prev.library_ids, id],
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">My Agents</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New agent</Button>
      </div>

      {agents.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <Bot className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">No agents yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-xl border border-border/30 bg-card/50 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-sm">{agent.name}</h3>
                  {agent.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{agent.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(agent)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete agent?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(agent.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {agent.agent_libraries && agent.agent_libraries.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {agent.agent_libraries.map((al) => (
                    <Badge key={al.library_id} variant="outline" className="text-[10px]">
                      {al.libraries?.name || allowedLibraries.find((l) => l.id === al.library_id)?.name || al.library_id.slice(0, 8)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Agent" : "New Agent"}</DialogTitle>
            <DialogDescription>Configure your AI agent with your available libraries.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <Tabs defaultValue="basic">
              <TabsList className="bg-secondary/30 mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="model">Model</TabsTrigger>
                <TabsTrigger value="libraries">Libraries</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-3">
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Agent name" required />
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" />
                <textarea value={form.system_prompt} onChange={(e) => setForm((p) => ({ ...p, system_prompt: e.target.value }))} placeholder="Your additional instructions (will be combined with library prompts)" className="w-full rounded-lg border border-border/40 bg-secondary/20 px-4 py-2.5 text-sm min-h-[80px] focus:outline-none focus:border-foreground/30 placeholder:text-muted-foreground/50" />
                <p className="text-[11px] text-muted-foreground/60">This prompt will be concatenated with the prompts defined in the selected libraries.</p>
              </TabsContent>
              <TabsContent value="model" className="space-y-3">
                <Select value={form.model_provider_id} onValueChange={(v) => setForm((p) => ({ ...p, model_provider_id: v }))}>
                  <SelectTrigger className="bg-secondary/20 border-border/40"><SelectValue placeholder="Select LLM provider" /></SelectTrigger>
                  <SelectContent>{providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {p.model}</SelectItem>)}</SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="libraries" className="space-y-2">
                {allowedLibraries.map((lib) => (
                  <label key={lib.id} className="flex items-center gap-2 rounded-lg border border-border/20 px-3 py-2 cursor-pointer hover:bg-secondary/20">
                    <Checkbox checked={form.library_ids.includes(lib.id)} onCheckedChange={() => toggleLib(lib.id)} />
                    <span className="text-sm">{lib.name}</span>
                  </label>
                ))}
                {allowedLibraries.length === 0 && <p className="text-xs text-muted-foreground">You don't have access to any libraries yet.</p>}
              </TabsContent>
              <TabsContent value="advanced" className="space-y-4">
                <div><label className="text-xs text-muted-foreground">Temperature ({form.temperature})</label><input type="range" min={0} max={2} step={0.1} value={form.temperature} onChange={(e) => setForm((p) => ({ ...p, temperature: parseFloat(e.target.value) }))} className="w-full" /></div>
                <div><label className="text-xs text-muted-foreground">Max Tokens</label><Input type="number" value={form.max_tokens} onChange={(e) => setForm((p) => ({ ...p, max_tokens: parseInt(e.target.value) || 2048 }))} /></div>
                <div><label className="text-xs text-muted-foreground">Top P</label><Input type="number" step={0.1} min={0} max={1} value={form.top_p} onChange={(e) => setForm((p) => ({ ...p, top_p: parseFloat(e.target.value) || 1 }))} /></div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2"><Checkbox checked={form.integrations.web_search} onCheckedChange={(c) => setForm((p) => ({ ...p, integrations: { ...p.integrations, web_search: !!c } }))} /><span className="text-sm">Web Search</span></label>
                  <label className="flex items-center gap-2"><Checkbox checked={form.integrations.code_interpreter} onCheckedChange={(c) => setForm((p) => ({ ...p, integrations: { ...p.integrations, code_interpreter: !!c } }))} /><span className="text-sm">Code Interpreter</span></label>
                </div>
              </TabsContent>
            </Tabs>
            <Button type="submit" disabled={saving} className="mt-4 w-full">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : editId ? "Update agent" : "Create agent"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
