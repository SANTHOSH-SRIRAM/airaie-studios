import { create } from 'zustand';
import type { RunEvent } from '@airaie/shared';

export interface ExecutionEvent {
  id: string;
  timestamp: string;
  type: string;
  nodeId?: string;
  payload?: Record<string, unknown>;
}

export interface InspectorItem {
  type: 'tool' | 'node' | 'proposal' | 'run' | 'memory' | 'eval';
  id: string;
  name: string;
  data: Record<string, unknown>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'stdout' | 'stderr' | 'info' | 'debug';
  source: string;
  message: string;
}

export interface Artifact {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  runId: string;
  url?: string;
}

export interface CostEntry {
  runId: string;
  agentId: string;
  cost: number;
  budgetLimit: number;
  timestamp: string;
  breakdown?: { tool: string; cost: number }[];
}

export interface NetworkRequest {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  requestSize?: number;
  responseSize?: number;
  error?: string;
}

interface ExecutionState {
  events: ExecutionEvent[];
  problems: Array<{ id: string; severity: 'error' | 'warning' | 'info'; message: string; source: string }>;
  inspectorItem: InspectorItem | null;
  logs: LogEntry[];
  artifacts: Artifact[];
  cost: CostEntry | null;
  totalCost: number;
  networkRequests: NetworkRequest[];

  addEvent: (event: ExecutionEvent) => void;
  clearEvents: () => void;
  addProblem: (problem: ExecutionState['problems'][0]) => void;
  clearProblems: () => void;
  setInspectorItem: (item: InspectorItem | null) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setArtifacts: (artifacts: Artifact[]) => void;
  addArtifact: (artifact: Artifact) => void;
  setCost: (cost: CostEntry | null) => void;
  addCost: (amount: number) => void;
  addNetworkRequest: (req: NetworkRequest) => void;
  updateNetworkRequest: (id: string, update: Partial<NetworkRequest>) => void;
  clearNetworkRequests: () => void;
  clearAll: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  events: [],
  problems: [],
  inspectorItem: null,
  logs: [],
  artifacts: [],
  cost: null,
  totalCost: 0,
  networkRequests: [],

  addEvent: (event) => set((s) => ({
    events: [...s.events.slice(-999), event],
  })),
  clearEvents: () => set({ events: [] }),
  addProblem: (problem) => set((s) => ({
    problems: [...s.problems, problem],
  })),
  clearProblems: () => set({ problems: [] }),
  setInspectorItem: (item) => set({ inspectorItem: item }),

  addLog: (log) => set((s) => ({
    logs: [...s.logs.slice(-4999), log],
  })),
  clearLogs: () => set({ logs: [] }),

  setArtifacts: (artifacts) => set({ artifacts }),
  addArtifact: (artifact) => set((s) => ({
    artifacts: [...s.artifacts, artifact],
  })),

  setCost: (cost) => set({ cost }),
  addCost: (amount) => set((s) => ({ totalCost: s.totalCost + amount })),

  addNetworkRequest: (req) => set((s) => ({
    networkRequests: [...s.networkRequests.slice(-499), req],
  })),
  updateNetworkRequest: (id, update) => set((s) => ({
    networkRequests: s.networkRequests.map((r) =>
      r.id === id ? { ...r, ...update } : r
    ),
  })),
  clearNetworkRequests: () => set({ networkRequests: [] }),

  clearAll: () => set({
    events: [],
    problems: [],
    inspectorItem: null,
    logs: [],
    artifacts: [],
    cost: null,
    totalCost: 0,
    networkRequests: [],
  }),
}));
