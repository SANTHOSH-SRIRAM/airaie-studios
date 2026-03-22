// ============================================================
// Governance type definitions (AGOV-01 through AGOV-05)
// ============================================================

// --- ActionProposal types (AGOV-01) ---

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'partial';
export type ActionApproval = 'pending' | 'approved' | 'rejected' | 'auto-approved';

export interface ProposalAction {
  id: string;
  tool_name: string;
  tool_version?: string;
  description: string;
  confidence: number; // 0-1
  approval: ActionApproval;
  auto_approve_threshold: number; // actions above this are auto-approved
  depends_on: string[];
  parameters: Record<string, unknown>;
  estimated_cost?: number;
  estimated_duration?: string;
}

export interface ActionProposal {
  id: string;
  card_id: string;
  run_id?: string;
  agent_id: string;
  status: ProposalStatus;
  actions: ProposalAction[];
  created_at: string;
  updated_at: string;
}

// --- DecisionTrace 8-phase types (AGOV-02) ---

export type DecisionPhase =
  | 'context'
  | 'scoring'
  | 'validation'
  | 'proposal'
  | 'policy'
  | 'plan'
  | 'execution'
  | 'recording';

export interface DecisionPhaseDetail {
  phase: DecisionPhase;
  status: 'completed' | 'active' | 'pending' | 'skipped';
  timestamp?: string;
  summary: string;
  data: Record<string, unknown>;
}

export interface DecisionTraceTimeline {
  id: string;
  run_id: string;
  phases: DecisionPhaseDetail[];
}

// --- Three-layer governance types (AGOV-05) ---

export type GovernanceVerdict = 'pass' | 'warning' | 'block';

export interface ToolContractGovernance {
  sandbox_enabled: boolean;
  audit_logging: boolean;
  quota_remaining?: number;
  quota_limit?: number;
  verdict: GovernanceVerdict;
  details: string[];
}

export interface SandboxPolicy {
  project_id: string;
  adapter_limits: Record<string, unknown>;
  resource_limits: Record<string, unknown>;
  verdict: GovernanceVerdict;
  details: string[];
}

export interface PolicyEngineVerdict {
  decision: 'auto-approve' | 'needs-approval' | 'blocked';
  rationale: string;
  policy_refs: string[];
  verdict: GovernanceVerdict;
}

export interface GovernanceLayers {
  tool_contract: ToolContractGovernance;
  sandbox_policy: SandboxPolicy;
  policy_engine: PolicyEngineVerdict;
}

// --- Board mode governance (AGOV-04) ---

export interface BoardModeGovernance {
  mode: 'explore' | 'study' | 'release';
  effects: string[];
  requires_approval: boolean;
}
