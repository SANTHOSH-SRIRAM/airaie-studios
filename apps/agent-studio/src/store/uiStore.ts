import { create } from 'zustand';

interface UIState {
  agentId: string;
  setAgentId: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  agentId: '',
  setAgentId: (agentId) => set({ agentId }),
}));
