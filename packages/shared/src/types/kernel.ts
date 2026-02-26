// =============================================================
// Kernel TypeScript types — generated from model.go JSON tags
// =============================================================

// --- Enums (string unions) ---

export type RunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELED'
  | 'AWAITING_APPROVAL';

export type NodeRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'RETRYING'
  | 'BLOCKED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'SKIPPED'
  | 'CANCELED';

export type GateStatus =
  | 'PENDING'
  | 'EVALUATING'
  | 'PASSED'
  | 'FAILED'
  | 'WAIVED';

export type WorkflowVersionStatus = 'draft' | 'compiled' | 'published';
export type AgentVersionStatus = 'draft' | 'validated' | 'published';
export type RunType = 'tool' | 'workflow' | 'agent';
export type SessionStatus = 'active' | 'closed' | 'expired';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired';
export type GateType = 'evidence' | 'review' | 'compliance';
export type GateReqType = 'run_succeeded' | 'artifact_exists' | 'role_signed' | 'metric_threshold';
export type GateApprovalAction = 'approve' | 'reject' | 'waive';
export type BoardType = 'research' | 'engineering' | string;
export type BoardStatus = 'DRAFT' | 'ARCHIVED' | string;
export type RecordType =
  | 'hypothesis'
  | 'claim'
  | 'protocol_step'
  | 'run_reference'
  | 'note'
  | 'engineering_change'
  | 'acceptance_criteria'
  | 'validation_result'
  | 'decision'
  | 'requirement';
export type AttachmentKind = 'evidence' | 'input' | 'output' | 'report' | 'supporting';
export type UserStatus = 'active' | 'suspended' | 'deactivated';
export type ProjectMemberRole = 'owner' | 'maintainer' | 'viewer';
export type ToolVersionStatus = 'draft' | 'published' | 'deprecated';

// --- Core Models ---

export interface KernelTool {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface KernelToolVersion {
  id: string;
  tool_id: string;
  version: string;
  status: ToolVersionStatus;
  contract: Record<string, unknown>;
  created_at: string;
  published_at?: string;
  deprecated_at?: string;
  deprecate_message?: string;
}

export interface KernelWorkflow {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface KernelWorkflowVersion {
  id: string;
  workflow_id: string;
  version: number;
  dsl: Record<string, unknown>;
  ast?: Record<string, unknown>;
  status: WorkflowVersionStatus;
  created_at: string;
}

export interface KernelAgent {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface KernelAgentVersion {
  id: string;
  agent_id: string;
  version: number;
  spec: Record<string, unknown>;
  status: AgentVersionStatus;
  created_at: string;
  published_at?: string;
}

export interface KernelRun {
  id: string;
  project_id: string;
  run_type: RunType;
  workflow_id?: string;
  workflow_version?: number;
  tool_ref?: string;
  agent_id?: string;
  status: RunStatus;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  actor: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  cost_estimate: number;
  cost_actual: number;
}

export interface KernelNodeRun {
  id: string;
  run_id: string;
  node_id: string;
  job_id?: string;
  tool_ref: string;
  status: NodeRunStatus;
  attempt: number;
  inputs_hash: string;
  output_artifacts?: string[];
  logs_ref?: string;
  started_at?: string;
  completed_at?: string;
  cost_estimate: number;
  cost_actual: number;
}

export interface KernelArtifact {
  id: string;
  project_id: string;
  name: string;
  type: string;
  content_hash: string;
  size_bytes: number;
  storage_uri: string;
  metadata?: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

export interface KernelArtifactLineage {
  id: string;
  input_artifact: string;
  output_artifact: string;
  run_id: string;
  node_id: string;
  transform: string;
  created_at: string;
}

export interface KernelNodeRunArtifact {
  node_run_id: string;
  artifact_id: string;
  direction: 'input' | 'output';
}

export interface KernelAuditEvent {
  id: string;
  project_id: string;
  event_type: string;
  run_id?: string;
  node_id?: string;
  board_id?: string;
  gate_id?: string;
  actor: string;
  payload: Record<string, unknown>;
  created_at: string;
}

// --- Board Models ---

export interface KernelBoard {
  id: string;
  project_id: string;
  type: BoardType;
  name: string;
  description?: string;
  status: BoardStatus;
  owner: string;
  metadata?: Record<string, unknown>;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface KernelBoardRecord {
  id: string;
  board_id: string;
  record_type: RecordType;
  title: string;
  content: Record<string, unknown>;
  run_id?: string;
  artifact_id?: string;
  actor: string;
  created_at: string;
}

export interface KernelBoardAttachment {
  id: string;
  board_id: string;
  artifact_id: string;
  record_id?: string;
  kind: AttachmentKind;
  label?: string;
  added_by: string;
  created_at: string;
}

// --- Gate Models ---

export interface KernelGate {
  id: string;
  board_id: string;
  project_id: string;
  name: string;
  gate_type: GateType;
  status: GateStatus;
  description?: string;
  metadata?: Record<string, unknown>;
  evaluated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface KernelGateRequirement {
  id: string;
  gate_id: string;
  req_type: GateReqType;
  description: string;
  config: Record<string, unknown>;
  satisfied: boolean;
  evidence?: Record<string, unknown>;
  evaluated_at?: string;
  created_at: string;
}

export interface KernelGateApproval {
  id: string;
  gate_id: string;
  action: GateApprovalAction;
  actor: string;
  role?: string;
  rationale?: string;
  created_at: string;
}

// --- Project & Auth ---

export interface KernelProject {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface KernelUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface KernelAPIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
}

export interface KernelProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  created_at: string;
}

// --- Session & Memory ---

export interface KernelSession {
  id: string;
  agent_id: string;
  project_id: string;
  context: Record<string, unknown>;
  history: unknown[];
  status: SessionStatus;
  created_at: string;
  expires_at: string;
}

export interface KernelAgentMemory {
  id: string;
  agent_id: string;
  project_id: string;
  memory_type: string;
  content: string;
  tags: string[];
  relevance: number;
  source_run_id?: string;
  created_at: string;
  updated_at: string;
}

// --- Approval ---

export interface KernelApprovalRequest {
  id: string;
  run_id: string;
  agent_id: string;
  project_id: string;
  proposal_json: Record<string, unknown>;
  status: ApprovalStatus;
  assignee?: string;
  deadline?: string;
  decided_by?: string;
  decided_at?: string;
  rationale?: string;
  created_at: string;
}

// --- Domain Registry ---

export interface KernelVertical {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

export interface KernelBoardTypeDefinition {
  id: string;
  vertical_id: string;
  slug: string;
  name: string;
  description?: string;
  initial_status: string;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

export interface KernelBoardStatusDefinition {
  id: string;
  board_type_id: string;
  slug: string;
  name: string;
  ordinal: number;
  is_terminal: boolean;
}

export interface KernelBoardStatusTransition {
  id: string;
  board_type_id: string;
  from_status: string;
  to_status: string;
  requires_gate: boolean;
}

export interface KernelGateTypeDefinition {
  id: string;
  vertical_id: string;
  slug: string;
  name: string;
  description?: string;
  is_builtin: boolean;
  created_at: string;
}

export interface KernelReqTypeDefinition {
  id: string;
  vertical_id: string;
  slug: string;
  name: string;
  evaluator: string;
  config_schema?: Record<string, unknown>;
  is_builtin: boolean;
  created_at: string;
}

export interface KernelRecordTypeDefinition {
  id: string;
  vertical_id: string;
  slug: string;
  name: string;
  description?: string;
  is_builtin: boolean;
  created_at: string;
}

export interface KernelVerticalTemplate {
  id: string;
  vertical_id: string;
  name: string;
  version: number;
  description?: string;
  template: Record<string, unknown>;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// --- Quotas ---

export interface KernelProjectQuota {
  project_id: string;
  max_concurrent_runs: number;
  max_cpu_per_job: number;
  max_memory_mb_per_job: number;
  max_timeout_s_per_job: number;
  max_daily_runs: number;
  enabled: boolean;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface KernelSandboxPolicy {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  allowed_adapters: string[];
  network_default: string;
  fs_default: string;
  allowed_secrets: string[];
  max_cpu_per_job?: number;
  max_memory_mb_job?: number;
  max_timeout_s_job?: number;
  enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

// --- Paginated Response ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
