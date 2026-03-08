// ============================================================
// Execution lifecycle type definitions
// ============================================================

// --- Execution Plan ---

export type PlanStatus = 'draft' | 'validated' | 'executing' | 'completed' | 'failed';

export type NodeRole =
  | 'validate_input'
  | 'preprocess'
  | 'solve'
  | 'postprocess'
  | 'report'
  | 'evidence'
  | 'approval';

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface PlanNode {
  node_id: string;
  tool_id: string;
  tool_version: string;
  role: NodeRole;
  parameters: Record<string, unknown>;
  is_editable: boolean;
  is_required: boolean;
  // Runtime fields (populated during execution)
  status?: NodeStatus;
  progress?: number; // 0–100
  duration_ms?: number;
  error?: string;
}

export interface PlanEdge {
  from_node_id: string;
  to_node_id: string;
}

export interface ExecutionPlan {
  id: string;
  card_id: string;
  pipeline_id: string;
  nodes: PlanNode[];
  edges: PlanEdge[];
  bindings: Record<string, string>;
  expected_outputs: string[];
  cost_estimate: number;
  time_estimate: string;
  status: PlanStatus;
  preflight_result?: PreflightResult;
  workflow_id?: string;
  run_id?: string;
  created_at: string;
  updated_at: string;
}

// --- Preflight ---

export interface PreflightCheck {
  name: string;
  category: 'universal' | 'domain';
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: Record<string, unknown>;
  duration_ms: number;
}

export interface PreflightBlocker {
  check_name: string;
  message: string;
  auto_fix?: string;
}

export interface PreflightWarning {
  check_name: string;
  message: string;
  suggestion?: string;
}

export interface PreflightResult {
  passed: boolean;
  checks: PreflightCheck[];
  blockers: PreflightBlocker[];
  warnings: PreflightWarning[];
  total_ms: number;
  run_at: string;
}

// --- Tool Recommendations ---

export type TrustLevel = 'certified' | 'verified' | 'experimental';

export interface PipelineOption {
  id: string;
  name: string;
  steps: string[];
  cost_estimate: number;
  time_estimate: string;
}

export interface ToolRecommendation {
  slug: string;
  name: string;
  version: string;
  trust_level: TrustLevel;
  match_score: number;
  match_reasons: string[];
  cost_estimate: number;
  time_estimate: string;
  pipelines?: PipelineOption[];
}

// --- Evidence ---

export type EvidenceEvaluation = 'pass' | 'fail' | 'warning' | 'info';
export type EvidenceOperator = 'lt' | 'lte' | 'gt' | 'gte' | 'eq';

export interface CardEvidence {
  id: string;
  card_id: string;
  artifact_id?: string;
  run_id?: string;
  criterion_id?: string;
  threshold?: number;
  operator?: EvidenceOperator;
  passed?: boolean;
  metadata?: Record<string, unknown>;
  version: number;
  metric_key: string;
  metric_value: number;
  metric_unit: string;
  evaluation: EvidenceEvaluation;
  created_at: string;
}

// --- Execution State (frontend-only enrichment) ---

export type ExecutionState =
  | 'idle'
  | 'tool_select'
  | 'planning'
  | 'preflight'
  | 'executing'
  | 'evidence_gathering'
  | 'gate_evaluation';

// --- Decision Traces ---

export type DecisionType =
  | 'tool_selection'
  | 'parameter_override'
  | 'gate_evaluation'
  | 'plan_generation'
  | 'evidence_assessment'
  | 'escalation'
  | 'retry';

export interface DecisionTrace {
  id: string;
  run_id: string;
  card_id: string;
  board_id: string;
  decision_type: DecisionType;
  title: string;
  reasoning: string;
  inputs: Record<string, unknown>;
  outcome: Record<string, unknown>;
  alternatives_considered?: { label: string; reason_rejected: string }[];
  confidence?: number; // 0–1
  actor: string;
  created_at: string;
}

// --- Run with extended fields ---

export type RunType = 'tool' | 'workflow' | 'agent';

export interface Run {
  id: string;
  card_id?: string;
  board_id?: string;
  project_id: string;
  run_type: RunType;
  tool_ref?: string;
  workflow_id?: string;
  agent_id?: string;
  status: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  actor: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  cost_estimate?: number;
  cost_actual?: number;
  created_at: string;
}

// --- Agent Memory ---

export type MemoryType = 'episodic' | 'semantic' | 'procedural';

export interface AgentMemory {
  id: string;
  agent_id: string;
  type: MemoryType;
  content: string;
  metadata?: Record<string, unknown>;
  embedding_id?: string;
  created_at: string;
  updated_at: string;
}
