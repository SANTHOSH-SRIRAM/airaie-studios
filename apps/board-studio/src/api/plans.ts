// ============================================================
// Plan API functions — wraps axios calls for plan CRUD & execution
// ============================================================

import axios from 'axios';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { ExecutionPlan } from '@/types/board';

// --- Extended plan type with preflight + execution fields ---

export interface PlanResponse extends ExecutionPlan {
  preflight_result?: PreflightResult;
}

export interface PreflightResult {
  status: 'pass' | 'fail';
  validators: ValidatorResult[];
  run_at: string;
}

export interface ValidatorResult {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
  auto_fix?: string;
}

export interface PlanExecutionStatus {
  plan_id: string;
  status: 'draft' | 'validated' | 'executing' | 'completed' | 'failed';
  steps: {
    id: string;
    tool_name: string;
    status: string;
  }[];
  completed_steps: number;
  total_steps: number;
}

// --- Queries ---

export async function fetchPlan(cardId: string): Promise<PlanResponse> {
  const { data } = await axios.get<PlanResponse>(
    KERNEL_ENDPOINTS.PLANS.GET(cardId)
  );
  return data;
}

// --- Mutations ---

export async function generatePlan(cardId: string): Promise<PlanResponse> {
  const { data } = await axios.post<PlanResponse>(
    KERNEL_ENDPOINTS.PLANS.GENERATE(cardId)
  );
  return data;
}

export async function editPlan(
  cardId: string,
  payload: Record<string, unknown>
): Promise<PlanResponse> {
  const { data } = await axios.patch<PlanResponse>(
    KERNEL_ENDPOINTS.PLANS.EDIT(cardId),
    payload
  );
  return data;
}

export async function compilePlan(cardId: string): Promise<PlanResponse> {
  const { data } = await axios.post<PlanResponse>(
    KERNEL_ENDPOINTS.PLANS.COMPILE(cardId)
  );
  return data;
}

export async function validatePlan(cardId: string): Promise<PlanResponse> {
  const { data } = await axios.post<PlanResponse>(
    KERNEL_ENDPOINTS.PLANS.VALIDATE(cardId)
  );
  return data;
}

export async function executePlan(cardId: string): Promise<PlanResponse> {
  const { data } = await axios.post<PlanResponse>(
    KERNEL_ENDPOINTS.PLANS.EXECUTE(cardId)
  );
  return data;
}

export async function fetchPlanExecutionStatus(
  cardId: string
): Promise<PlanExecutionStatus> {
  const { data } = await axios.get<PlanExecutionStatus>(
    KERNEL_ENDPOINTS.PLANS.GET(cardId)
  );
  return {
    plan_id: data.plan_id ?? (data as unknown as ExecutionPlan).id,
    status: (data as unknown as ExecutionPlan).status ?? data.status,
    steps: ((data as unknown as ExecutionPlan).steps ?? data.steps).map((s) => ({
      id: s.id,
      tool_name: s.tool_name,
      status: s.status,
    })),
    completed_steps: ((data as unknown as ExecutionPlan).steps ?? data.steps).filter(
      (s) => s.status === 'completed'
    ).length,
    total_steps: ((data as unknown as ExecutionPlan).steps ?? data.steps).length,
  };
}
