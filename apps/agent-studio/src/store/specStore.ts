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
  agentName: string;
  goal: string;
  tools: ToolPermission[];
  contextSchema: ContextSchema;
  scoring: ScoringConfig;
  constraints: AgentConstraints;
  policy: PolicyConfig;
  domainTags: string[];
  deniedCapabilities: string[];
  isDirty: boolean;

  setAgentName: (name: string) => void;
  setGoal: (goal: string) => void;
  setTools: (tools: ToolPermission[]) => void;
  addTool: (tool: ToolPermission) => void;
  removeTool: (toolRef: string) => void;
  setContextSchema: (schema: ContextSchema) => void;
  setScoring: (scoring: ScoringConfig) => void;
  setConstraints: (constraints: AgentConstraints) => void;
  setPolicy: (policy: PolicyConfig) => void;
  setDomainTags: (tags: string[]) => void;
  setDeniedCapabilities: (caps: string[]) => void;
  setSpec: (spec: Record<string, unknown>) => void;
  setDirty: (dirty: boolean) => void;
  buildSpec: (version: string, owner: string) => AgentSpec;
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
  agentName: 'Untitled Agent',
  goal: '',
  tools: [],
  contextSchema: defaultContextSchema,
  scoring: defaultScoring,
  constraints: defaultConstraints,
  policy: defaultPolicy,
  domainTags: [],
  deniedCapabilities: [],
  isDirty: false,

  setAgentName: (agentName) => set({ agentName, isDirty: true }),
  setGoal: (goal) => set({ goal, isDirty: true }),
  setTools: (tools) => set({ tools, isDirty: true }),
  addTool: (tool) => set((s) => ({ tools: [...s.tools, tool], isDirty: true })),
  removeTool: (toolRef) =>
    set((s) => ({ tools: s.tools.filter((t) => t.tool_ref !== toolRef), isDirty: true })),
  setContextSchema: (contextSchema) => set({ contextSchema, isDirty: true }),
  setScoring: (scoring) => set({ scoring, isDirty: true }),
  setConstraints: (constraints) => set({ constraints, isDirty: true }),
  setPolicy: (policy) => set({ policy, isDirty: true }),
  setDomainTags: (domainTags) => set({ domainTags, isDirty: true }),
  setDeniedCapabilities: (deniedCapabilities) => set({ deniedCapabilities, isDirty: true }),
  setSpec: (spec) => {
    const meta = spec.metadata as Record<string, unknown> | undefined;
    set({
      agentName: (meta?.name as string) ?? get().agentName,
      goal: (spec.goal as string) ?? '',
      tools: (spec.tools as ToolPermission[]) ?? [],
      contextSchema: (spec.context_schema as ContextSchema) ?? defaultContextSchema,
      scoring: (spec.scoring as ScoringConfig) ?? defaultScoring,
      constraints: (spec.constraints as AgentConstraints) ?? defaultConstraints,
      policy: (spec.policy as PolicyConfig) ?? defaultPolicy,
      domainTags: (meta?.domain_tags as string[]) ?? [],
      deniedCapabilities: (spec.denied_capabilities as string[]) ?? [],
      isDirty: false,
    });
  },
  setDirty: (isDirty) => set({ isDirty }),

  buildSpec: (version, owner) => {
    const s = get();
    return {
      api_version: 'v1',
      kind: 'AgentSpec',
      metadata: { name: s.agentName, version, owner, domain_tags: s.domainTags },
      goal: s.goal,
      tools: s.tools,
      context_schema: s.contextSchema,
      scoring: s.scoring,
      constraints: s.constraints,
      policy: s.policy,
      ...(s.deniedCapabilities.length > 0 && { denied_capabilities: s.deniedCapabilities }),
    };
  },

  reset: () =>
    set({
      agentName: 'Untitled Agent',
      goal: '',
      tools: [],
      contextSchema: defaultContextSchema,
      scoring: defaultScoring,
      constraints: defaultConstraints,
      policy: defaultPolicy,
      domainTags: [],
      deniedCapabilities: [],
      isDirty: false,
    }),
}));
