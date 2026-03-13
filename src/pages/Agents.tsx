import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Agent } from "@/types";
import { Bot, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Agent | null>(null);

  useEffect(() => {
    api.getAgents()
      .then(setAgents)
      .catch(() => toast.error("Failed to load agents"))
      .finally(() => setLoading(false));
  }, []);

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
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Agents</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of all agents created by users in the organization.</p>
      </div>

      {agents.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <Bot className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">No agents created yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-xl border border-border/30 bg-card/50 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-sm">{agent.name}</h3>
                  {agent.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(agent)}>
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
              {agent.agent_libraries && agent.agent_libraries.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {agent.agent_libraries.map((al) => (
                    <Badge key={al.library_id} variant="outline" className="text-[10px]">
                      {al.libraries?.name || al.library_id.slice(0, 8)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>Agent details (read-only)</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              {selected.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p>{selected.description}</p>
                </div>
              )}
              {selected.config?.system_prompt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">System Prompt</p>
                  <p className="whitespace-pre-wrap rounded-lg bg-secondary/20 p-3 text-xs">{selected.config.system_prompt}</p>
                </div>
              )}
              {selected.config?.tone && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tone</p>
                  <p>{selected.config.tone}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Temperature</p>
                  <p>{selected.config?.params?.temperature ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Max Tokens</p>
                  <p>{selected.config?.params?.max_tokens ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Top P</p>
                  <p>{selected.config?.params?.top_p ?? "—"}</p>
                </div>
              </div>
              {selected.agent_libraries && selected.agent_libraries.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Libraries</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.agent_libraries.map((al) => (
                      <Badge key={al.library_id} variant="outline" className="text-[10px]">
                        {al.libraries?.name || al.library_id.slice(0, 8)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
