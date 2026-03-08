import { create } from 'zustand';
import type { ActionProposal } from '@airaie/shared';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  proposalId?: string;
}

interface PlaygroundState {
  activeSessionId: string | null;
  messages: ChatMessage[];
  proposals: ActionProposal[];
  dryRun: boolean;
  isRunning: boolean;
  /** Active run ID — used for SSE streaming + step debugger */
  activeRunId: string | null;

  setActiveSession: (id: string | null) => void;
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  addProposal: (proposal: ActionProposal) => void;
  clearProposals: () => void;
  setDryRun: (dryRun: boolean) => void;
  setRunning: (running: boolean) => void;
  setActiveRunId: (runId: string | null) => void;
  reset: () => void;
}

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  activeSessionId: null,
  messages: [],
  proposals: [],
  dryRun: true,
  isRunning: false,
  activeRunId: null,

  setActiveSession: (activeSessionId) => set({ activeSessionId }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
  addProposal: (proposal) => set((s) => ({ proposals: [...s.proposals, proposal] })),
  clearProposals: () => set({ proposals: [] }),
  setDryRun: (dryRun) => set({ dryRun }),
  setRunning: (isRunning) => set({ isRunning }),
  setActiveRunId: (activeRunId) => set({ activeRunId }),
  reset: () =>
    set({
      activeSessionId: null,
      messages: [],
      proposals: [],
      dryRun: true,
      isRunning: false,
      activeRunId: null,
    }),
}));
