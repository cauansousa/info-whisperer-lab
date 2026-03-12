import { create } from "zustand";

interface ChatStore {
  selectedAgentId: string | null;
  setSelectedAgent: (agentId: string | null) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  selectedAgentId: null,
  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),
  inputValue: "",
  setInputValue: (value) => set({ inputValue: value }),
  isLoading: false,
  setIsLoading: (value) => set({ isLoading: value }),
}));
