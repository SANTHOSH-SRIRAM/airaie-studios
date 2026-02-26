// =============================================================
// ActionProposal types — from actionproposal.schema.json
// =============================================================

export type ProposalStatus = 'draft' | 'approved' | 'executing' | 'completed' | 'rejected';

export interface ActionProposal {
  id: string;
  agent_id: string;
  agent_version: number;
  goal: string;
  status: ProposalStatus;
  actions: ProposedAction[];
  dependencies: ActionDependency[];
  total_score: number;
  estimated_cost: number;
  constraints: AppliedConstraints;
}

export interface ProposedAction {
  action_id: string;
  tool_ref: string;
  permissions: ActionPermissions;
  inputs: Record<string, unknown>;
  order: number;
  scoring: ActionScoring;
  justification: string;
  requires_approval: boolean;
}

export interface ActionPermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface ActionScoring {
  compatibility: number;
  trust: number;
  cost: number;
  final_score: number;
  strategy: string;
}

export interface ActionDependency {
  action_id: string;
  depends_on: string[];
}

export interface AppliedConstraints {
  max_tools_per_run: number;
  timeout_seconds: number;
  max_retries: number;
  budget_limit: number;
  tools_selected: number;
  budget_used: number;
}
