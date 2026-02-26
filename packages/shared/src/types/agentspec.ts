// =============================================================
// AgentSpec types — from agentspec.schema.json
// =============================================================

export interface AgentSpec {
  api_version: string;
  kind: 'AgentSpec';
  metadata: AgentSpecMetadata;
  goal: string;
  tools: ToolPermission[];
  context_schema: ContextSchema;
  scoring: ScoringConfig;
  constraints: AgentConstraints;
  policy: PolicyConfig;
}

export interface AgentSpecMetadata {
  name: string;
  version: string;
  owner: string;
  domain_tags: string[];
}

export interface ToolPermission {
  tool_ref: string;
  permissions: ToolPermissions;
  max_invocations: number;
  required_capabilities: string[];
}

export interface ToolPermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface ContextSchema {
  required_inputs: SchemaField[];
  optional_inputs: SchemaField[];
}

export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface SchemaField {
  name: string;
  type: SchemaFieldType;
  description: string;
}

export type ScoringStrategy = 'weighted' | 'priority' | 'cost_optimized';

export interface ScoringConfig {
  strategy: ScoringStrategy;
  weights: ScoringWeights;
}

export interface ScoringWeights {
  compatibility: number;
  trust: number;
  cost: number;
}

export interface AgentConstraints {
  max_tools_per_run: number;
  timeout_seconds: number;
  max_retries: number;
  budget_limit: number;
}

export interface PolicyConfig {
  auto_approve_threshold: number;
  require_approval_for: string[];
  escalation_rules: EscalationRule[];
}

export type EscalationAction = 'require_human_approval' | 'block';

export interface EscalationRule {
  condition: string;
  action: EscalationAction;
}
