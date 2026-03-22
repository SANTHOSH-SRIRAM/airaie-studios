// ============================================================
// Board domain type definitions
// ============================================================

// --- Enums / Unions ---

export type BoardMode = 'explore' | 'study' | 'release';
export type BoardStatus = string;
export type CardStatus =
  | 'draft'
  | 'ready'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'skipped';
export type CardType =
  | 'analysis'
  | 'comparison'
  | 'sweep'
  | 'agent'
  | 'gate'
  | 'milestone';
export type GateType = 'evidence' | 'review' | 'compliance' | 'manufacturing' | 'exception';

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  analysis: 'Analysis',
  comparison: 'Comparison',
  sweep: 'Parametric Sweep',
  agent: 'Agent Task',
  gate: 'Gate Card',
  milestone: 'Milestone',
};
export type GateStatus = 'PENDING' | 'EVALUATING' | 'PASSED' | 'FAILED' | 'WAIVED';
export type TrustLevel = 'CERTIFIED' | 'VERIFIED' | 'EXPERIMENTAL';

// --- Core entities ---

export interface Board {
  id: string;
  name: string;
  description?: string;
  mode: BoardMode;
  status: BoardStatus;
  type: string;
  vertical_id?: string;
  project_id: string;
  owner?: string;
  parent_board_id?: string;
  readiness?: number;
  intent_spec?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  children_count?: number;
}

export interface BoardSummary {
  overall_readiness: number;
  readiness: {
    design: number;
    validation: number;
    compliance: number;
    manufacturing: number;
    approvals: number;
  };
  card_progress: { completed: number; total: number };
  card_status_breakdown: Record<string, number>;
  gate_count: number;
  gate_summary: { name: string; type: GateType; status: GateStatus }[];
}

export interface Card {
  id: string;
  board_id: string;
  intent_spec_id?: string;
  agent_id?: string;
  agent_version?: number;
  name: string;
  title?: string;
  description?: string;
  type: CardType;
  intent_type?: string;
  status: CardStatus;
  ordinal: number;
  config: Record<string, unknown>;
  kpis: Record<string, unknown>;
  dependencies: string[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;

  // Execution lifecycle (populated from backend)
  execution_plan_id?: string;
  selected_tool?: {
    slug: string;
    version: string;
    trust_level: string;
    match_score: number;
  };

  // Cost & time
  cost_estimate?: number;
  time_estimate?: string;
  actual_cost?: number;
  actual_duration?: number;

  // Evidence summary
  evidence_summary?: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };

  // Preflight
  preflight_status?: 'pending' | 'passed' | 'failed' | 'skipped';
  preflight_blockers?: number;
  preflight_warnings?: number;
}

export interface Gate {
  id: string;
  board_id: string;
  name: string;
  type: GateType;
  status: GateStatus;
  requirements: GateRequirement[];
  /** Policy reference that triggered this gate decision */
  policy_ref?: string;
  /** User who manually approved the gate */
  approved_by?: string;
  // Audit trail timestamps (populated when backend supports history)
  created_at?: string;
  evaluated_at?: string;
  approved_at?: string;
  rejected_at?: string;
}

export interface GateRequirement {
  id: string;
  name: string;
  description: string;
  satisfied: boolean;
  metric?: { value: number; threshold: number; operator: string };
}

export interface ToolEntry {
  id: string;
  name: string;
  type: 'tool' | 'pipeline';
  trust_level: TrustLevel;
  score: number;
  rank_explanation: string[];
  available: boolean;
  unavailable_reason?: string;
}

export interface ExecutionPlan {
  id: string;
  card_id: string;
  status: 'draft' | 'validated' | 'executing' | 'completed' | 'failed';
  steps: PlanStep[];
  cost_estimate?: string;
  time_estimate?: string;
}

export interface PlanStep {
  id: string;
  tool_name: string;
  tool_version?: string;
  role: string;
  status: string;
  parameters: Record<string, unknown>;
  parameter_schema?: Record<string, unknown>;
  depends_on: string[];
  progress?: number; // 0-100, populated during execution
  duration_ms?: number;
  error?: string;
}

// --- Verticals ---

export interface Vertical {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  is_builtin: boolean;
}

// --- Templates & Intents ---

export interface BoardTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  vertical_id: string;
  mode: BoardMode;
  is_builtin: boolean;
  tags?: string[];
  // Backend returns these field names
  cards_template: TemplateCard[];
  gates_template: TemplateGate[];
  parameter_schema: Record<string, unknown>;
  intent_spec_template: Record<string, unknown>;
}

export interface TemplateCard {
  title: string;
  card_type: string;
  description?: string;
  order: number;
  config?: Record<string, unknown>;
  kpis?: { metric_key: string; target_value: number; unit?: string; tolerance?: number }[];
  depends_on?: number[];
  dependency_type?: string;
  intent_type?: string;
}

export interface TemplateGate {
  name: string;
  gate_order: number;
  requirements?: { req_type: string; description: string }[];
  after_card?: number | null;
}

export interface IntentType {
  slug: string;
  name: string;
  description: string;
  vertical_id: string;
  parent_slug?: string;
  parameters: IntentParameter[];
}

export interface IntentParameter {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  description?: string;
  required?: boolean;
  default_value?: unknown;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// --- Intelligence views ---

export interface EvidenceDiff {
  card_id: string;
  card_name: string;
  kpi_key: string;
  baseline: number;
  current: number;
  delta: number;
  improved: boolean;
  operator: string;
  threshold: number;
}

export interface TriageResult {
  board_id: string;
  failures: TriageFailure[];
}

export interface TriageFailure {
  card_id: string;
  card_name: string;
  kpi_key: string;
  severity: 'critical' | 'warning' | 'info';
  value: number;
  threshold: number;
  operator: string;
  overshoot_pct: number;
  action: string;
  insights: string[];
}

export interface ReproducibilityScore {
  board_id: string;
  score: number;
  interpretation: 'high' | 'medium' | 'low';
  cv: number;
  run_count: number;
}

// --- Board Records & Attachments ---

export type RecordType = 'hypothesis' | 'decision' | 'requirement' | 'observation' | 'risk' | 'action_item';

export interface BoardRecord {
  id: string;
  board_id: string;
  type: RecordType;
  content: string;
  metadata?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type AttachmentKind = 'file' | 'link' | 'artifact' | 'evidence';

export interface BoardAttachment {
  id: string;
  board_id: string;
  kind: AttachmentKind;
  name: string;
  url?: string;
  mime_type?: string;
  size_bytes?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// --- API query parameters ---

export interface BoardListParams {
  mode?: BoardMode | (string & {});
  status?: BoardStatus | (string & {});
  type?: string;
  search?: string;
  sort?: string;
  sort_dir?: 'asc' | 'desc';
  parent_id?: string;
  offset?: number;
  limit?: number;
}

// --- Backend response types (used internally by API transformers) ---

export interface BackendCard {
  id: string;
  board_id: string;
  intent_spec_id?: string;
  card_type: string;
  intent_type?: string;
  agent_id?: string;
  agent_version?: number;
  title: string;
  description: string;
  status: string;
  ordinal: number;
  config?: Record<string, unknown>;
  kpis?: { metric_key: string; target_value: number; unit?: string; tolerance?: number }[];
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface BackendCardGraphNode extends BackendCard {
  depends_on: string[];
  blocks: string[];
}

export interface BackendGate {
  id: string;
  board_id: string;
  project_id: string;
  name: string;
  gate_type: string;
  status: string;
  description?: string;
  metadata?: unknown;
  evaluated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendBoardSummary {
  board_id: string;
  mode: string;
  card_stats: {
    total: number;
    draft: number;
    ready: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    blocked: number;
    skipped: number;
  };
  gate_stats: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
  };
  readiness_scores: Record<string, number>;
  overall_readiness: number;
  next_actions?: {
    priority: string;
    category: string;
    description: string;
    card_id?: string;
    gate_id?: string;
  }[];
  gates?: { name?: string; type?: string; status?: string }[];
  child_summaries?: BackendBoardSummary[];
}
