"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgents } from "@/hooks/use-agents";
import { useChatStore } from "@/stores/chat-store";

interface AgentSelectorProps {
  disabled?: boolean;
}

export function AgentSelector({ disabled }: AgentSelectorProps) {
  const { data: agents } = useAgents();
  const { selectedAgentId, setSelectedAgent } = useChatStore();

  if (!agents || agents.length === 0) return null;

  return (
    <Select
      value={selectedAgentId ?? "all"}
      onValueChange={(v) => setSelectedAgent(v === "all" ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select agent" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All agents</SelectItem>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
