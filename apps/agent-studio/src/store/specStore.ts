import { create } from 'zustand';
import type {
  AgentSpec,
  ToolPermission,
  ContextSchema,
  ScoringConfig,
  AgentConstraints,
  PolicyConfig,
} from '@airaie/shared';

interface SpecState {
  goal: string;
  tools: ToolPermission[];
  contextSchema: ContextSchema;
  scoring: ScoringConfig;
  constraints: AgentConstraints;
  policy: PolicyConfig;
  isDirty: boolean;

  setGoal: (goal: string) => void;
  setTools: (tools: ToolPermission[]) => void;
  addTool: (tool: ToolPermission) => void;
  removeTool: (toolRef: string) => void;
  setContextSchema: (schema: ContextSchema) => void;
  setScoring: (scoring: ScoringConfig) => void;
  setConstraints: (constraints: AgentConstraints) => void;
  setPolicy: (policy: PolicyConfig) => void;
  setDirty: (dirty: boolean) => void;
  buildSpec: (name: string, version: string, owner: string) => AgentSpec;
  reset: () => void;
}

const defaultContextSchema: ContextSchema = {
  required_inputs: [],
  optional_inputs: [],
};

const defaultScoring: ScoringConfig = {
  strategy: 'weighted',
  weights: { compatibility: 0.4, trust: 0.35, cost: 0.25 },
};

const defaultConstraints: AgentConstraints = {
  max_tools_per_run: 10,
  timeout_seconds: 300,
  max_retries: 3,
  budget_limit: 1.0,
};

const defaultPolicy: PolicyConfig = {
  auto_approve_threshold: 0.85,
  require_approval_for: [],
  escalation_rules: [],
};

export const useSpecStore = create<SpecState>((set, get) => ({
  goal: '',
  tools: [],
  contextSchema: defaultContextSchema,
  scoring: defaultScoring,
  constraints: defaultConstraints,
  policy: defaultPolicy,
  isDirty: false,

  setGoal: (goal) => set({ goal, isDirty: true }),
  setTools: (tools) => set({ tools, isDirty: true }),
  addTool: (tool) => set((s) => ({ tools: [...s.tools, tool], isDirty: true })),
  removeTool: (toolRef) =>
    set((s) => ({ tools: s.tools.filter((t) => t.tool_ref !== toolRef), isDirty: true })),
  setContextSchema: (contextSchema) => set({ contextSchema, isDirty: true }),
  setScoring: (scoring) => set({ scoring, isDirty: true }),
  setConstraints: (constraints) => set({ constraints, isDirty: true }),
  setPolicy: (policy) => set({ policy, isDirty: true }),
  setDirty: (isDirty) => set({ isDirty }),

  buildSpec: (name, version, owner) => {
    const s = get();
    return {
      api_version: 'v1',
      kind: 'AgentSpec',
      metadata: { name, version, owner, domain_tags: [] },
      goal: s.goal,
      tools: s.tools,
      context_schema: s.contextSchema,
      scoring: s.scoring,
      constraints: s.constraints,
      policy: s.policy,
    };
  },

  reset: () =>
    set({
      goal: '',
      tools: [],
      contextSchema: defaultContextSchema,
      scoring: defaultScoring,
      constraints: defaultConstraints,
      policy: defaultPolicy,
      isDirty: false,
    }),
}));
