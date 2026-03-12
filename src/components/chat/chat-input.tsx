"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatStore } from "@/stores/chat-store";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { inputValue, setInputValue, isLoading } = useChatStore();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setInputValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background/90 px-6 py-4 shadow-[0_-10px_30px_-24px_rgba(0,0,0,0.55)] backdrop-blur supports-[backdrop-filter]:backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl items-end gap-2">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          className="min-h-[44px] max-h-32 resize-none rounded-xl border-muted-foreground/20 bg-background shadow-inner"
          rows={1}
          disabled={isLoading || disabled}
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0 rounded-xl"
          disabled={!inputValue.trim() || isLoading || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
