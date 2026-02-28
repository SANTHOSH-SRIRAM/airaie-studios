// ============================================================
// Board domain type definitions
// ============================================================

// --- Enums / Unions ---

export type BoardMode = 'explore' | 'study' | 'release';
export type BoardStatus = 'draft' | 'active' | 'completed' | 'archived';
export type CardStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'skipped'
  | 'waived'
  | 'cancelled';
export type CardType =
  | 'simulation'
  | 'optimization'
  | 'validation'
  | 'manufacturing'
  | 'analysis'
  | 'custom'
  | 'research';
export type GateType = 'AutoGate' | 'ReviewGate' | 'ComplianceGate';
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
  project_id: string;
  parent_board_id?: string;
  readiness: number;
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
  name: string;
  title?: string;
  description?: string;
  type: CardType;
  status: CardStatus;
  ordinal: number;
  config: Record<string, unknown>;
  kpis: Record<string, unknown>;
  dependencies: string[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Gate {
  id: string;
  board_id: string;
  name: string;
  type: GateType;
  status: GateStatus;
  requirements: GateRequirement[];
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
}

// --- Templates & Intents ---

export interface BoardTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  vertical_id: string;
  cards: TemplateCard[];
  gates: TemplateGate[];
  parameters: TemplateParameter[];
}

export interface TemplateCard {
  name: string;
  type: CardType;
  description?: string;
  config?: Record<string, unknown>;
  depends_on?: number[];
}

export interface TemplateGate {
  name: string;
  type: GateType;
  requirements?: { name: string; description: string }[];
}

export interface TemplateParameter {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  description?: string;
  required?: boolean;
  default_value?: unknown;
  options?: string[];
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

// --- API query parameters ---

export interface BoardListParams {
  mode?: BoardMode;
  status?: BoardStatus;
  type?: string;
  search?: string;
  sort?: string;
  sort_dir?: 'asc' | 'desc';
  parent_id?: string;
}
