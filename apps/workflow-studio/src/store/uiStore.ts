import { create } from 'zustand';

interface UIState {
  activeBoard: string;
  sidebarCollapsed: boolean;
  workflowId: string;
  workflowName: string;
  setActiveBoard: (board: string) => void;
  toggleSidebar: () => void;
  setWorkflow: (id: string, name: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeBoard: 'builder',
  sidebarCollapsed: false,
  workflowId: '',
  workflowName: '',
  setActiveBoard: (board) => set({ activeBoard: board }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setWorkflow: (workflowId, workflowName) => set({ workflowId, workflowName }),
}));
