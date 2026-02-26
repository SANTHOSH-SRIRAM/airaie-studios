import { create } from 'zustand';

interface UIState {
  activeBoard: string;
  sidebarCollapsed: boolean;
  agentId: string;
  setActiveBoard: (board: string) => void;
  toggleSidebar: () => void;
  setAgentId: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeBoard: 'builder',
  sidebarCollapsed: false,
  agentId: '',
  setActiveBoard: (board) => set({ activeBoard: board }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setAgentId: (agentId) => set({ agentId }),
}));
