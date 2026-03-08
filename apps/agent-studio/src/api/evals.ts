import { apiClient, ENDPOINTS } from '@airaie/shared';

export interface EvalCase {
  id: string;
  agent_id: string;
  project_id: string;
  name: string;
  inputs: Record<string, unknown>;
  criteria: {
    min_actions?: number;
    max_actions?: number;
    min_score?: number;
    max_cost?: number;
    required_tools?: string[];
    forbidden_tools?: string[];
  };
  created_at: string;
  updated_at: string;
}

export async function listEvalCases(agentId: string): Promise<EvalCase[]> {
  const { data } = await apiClient.get<{ eval_cases: EvalCase[] }>(ENDPOINTS.AGENTS.EVALS(agentId));
  return data.eval_cases;
}

export async function getEvalCase(agentId: string, evalId: string): Promise<EvalCase> {
  const { data } = await apiClient.get<{ eval_case: EvalCase }>(ENDPOINTS.AGENTS.EVAL(agentId, evalId));
  return data.eval_case;
}

export async function createEvalCase(
  agentId: string,
  body: { name: string; inputs: Record<string, unknown>; criteria: Record<string, unknown> },
): Promise<EvalCase> {
  const { data } = await apiClient.post<{ eval_case: EvalCase }>(ENDPOINTS.AGENTS.EVALS(agentId), body);
  return data.eval_case;
}

export async function updateEvalCase(
  agentId: string,
  evalId: string,
  body: { name?: string; inputs?: Record<string, unknown>; criteria?: Record<string, unknown> },
): Promise<EvalCase> {
  const { data } = await apiClient.put<{ eval_case: EvalCase }>(ENDPOINTS.AGENTS.EVAL(agentId, evalId), body);
  return data.eval_case;
}

export async function deleteEvalCase(agentId: string, evalId: string): Promise<void> {
  await apiClient.delete(ENDPOINTS.AGENTS.EVAL(agentId, evalId));
}
