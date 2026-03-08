// ============================================================
// Plan API functions — wraps axios calls for plan CRUD & execution
// ============================================================

import apiClient from './client';
import axios from 'axios';
import type { APIError } from '@airaie/shared';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { ExecutionPlan, PlanStep } from '@/types/board';

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

// --- Transform helpers (kernel → frontend) ---

/** Map kernel PreflightResult to frontend shape */
function parsePreflight(raw: any): PreflightResult | undefined {
  if (!raw) return undefined;
  return {
    status: raw.passed ? 'pass' : 'fail',
    validators: (raw.checks ?? []).map((c: any) => ({
      name: c.name,
      // Backend sends status as string ("pass"|"fail"|"warn"), not a boolean
      status: c.status === 'pass' ? 'pass' : 'fail',
      message: c.message,
      auto_fix: c.auto_fix_suggestion,
    })),
    run_at: raw.run_at ?? new Date().toISOString(),
  };
}

/**
 * Transform kernel plan (nodes/edges DAG) → frontend plan (steps with depends_on).
 * Handles both kernel format and already-transformed frontend format gracefully.
 */
function transformPlan(raw: any): PlanResponse {
  // If the data already has steps[] (frontend shape), pass through
  if (Array.isArray(raw.steps)) {
    return {
      id: raw.id,
      card_id: raw.card_id,
      status: raw.status,
      steps: raw.steps,
      cost_estimate: raw.cost_estimate?.toString(),
      time_estimate: raw.time_estimate,
      preflight_result: raw.preflight_result ?? parsePreflight(raw.preflight),
    };
  }

  // Kernel format: nodes[] + edges[]
  const nodes: any[] = raw.nodes ?? [];
  const edges: any[] = raw.edges ?? [];

  const steps: PlanStep[] = nodes.map((node: any) => ({
    id: node.node_id,
    tool_name: node.tool_id,
    tool_version: node.tool_version,
    role: node.role,
    status: node.status ?? 'pending',
    parameters: node.parameters ?? {},
    parameter_schema: node.parameter_schema,
    depends_on: edges
      .filter((e: any) => e.to_node_id === node.node_id)
      .map((e: any) => e.from_node_id),
  }));

  return {
    id: raw.id,
    card_id: raw.card_id,
    status: raw.status,
    steps,
    cost_estimate: raw.cost_estimate?.toString(),
    time_estimate: raw.time_estimate,
    preflight_result: parsePreflight(raw.preflight),
  };
}

// --- Intent auto-provisioning (fully dynamic, no hardcoded types) ---

interface IntentTypeInfo {
  slug: string;
  name: string;
  parent_slug?: string;
}

/**
 * Select the best intent type for a card from the board's vertical.
 * Fetches intent types from the API and scores them against the card's
 * title, config, and card_type — no hardcoded mappings.
 */
async function selectIntentType(card: any, verticalSlug: string): Promise<string> {
  // If card already has an intent_type, use it directly
  if (card.intent_type) return card.intent_type;

  // Fetch all intent types for this vertical
  const { data } = await apiClient.get(
    KERNEL_ENDPOINTS.INTENT_TYPES.BY_VERTICAL(verticalSlug)
  );
  const types: IntentTypeInfo[] = data.intent_types ?? data ?? [];
  if (types.length === 0) {
    throw new Error(`No intent types available for vertical "${verticalSlug}"`);
  }

  // Score each type by matching against card title, config, and solver
  const cardTitle = (card.title || '').toLowerCase();
  const solver = ((card.config?.solver as string) || '').toLowerCase();
  const tokens = [...cardTitle.split(/\s+/), ...solver.split(/[_\s]+/)].filter(Boolean);

  // Prefer leaf types (have a parent) over root types
  const leafTypes = types.filter((t) => t.parent_slug);
  const candidates = leafTypes.length > 0 ? leafTypes : types;

  let best = candidates[0];
  let bestScore = 0;

  for (const t of candidates) {
    const slugTokens = t.slug.replace(/[._]/g, ' ').toLowerCase().split(/\s+/);
    const nameTokens = t.name.toLowerCase().split(/\s+/);
    const allTypeTokens = [...slugTokens, ...nameTokens];

    let score = 0;
    for (const token of tokens) {
      if (allTypeTokens.some((tt) => tt.includes(token) || token.includes(tt))) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }

  return best.slug;
}

/**
 * Fetch required inputs for an intent type from the API and build stubs.
 */
async function fetchRequiredInputs(intentType: string): Promise<any[]> {
  try {
    const { data } = await apiClient.get(KERNEL_ENDPOINTS.INTENT_TYPES.INPUTS(intentType));
    const inputs: any[] = data.inputs ?? [];
    return inputs
      .filter((i: any) => i.required)
      .map((i: any) => ({
        name: i.name,
        type: i.type || 'parameter',
        required: true,
        value: i.type === 'artifact' ? undefined : 'auto',
        ...(i.type === 'artifact' ? { artifact_ref: 'pending' } : {}),
      }));
  } catch {
    // If the endpoint fails, return empty (backend may skip validation)
    return [];
  }
}

/** Build acceptance criteria from card KPIs */
function buildAcceptanceCriteria(kpis: any[]): any[] {
  if (!Array.isArray(kpis) || kpis.length === 0) return [];
  return kpis
    .filter((k: any) => k.metric_key)
    .map((kpi: any, i: number) => ({
      id: `ac_${i}`,
      metric: kpi.metric_key,
      operator: kpi.target_value > 0 ? 'gte' : 'lt',
      threshold: kpi.target_value > 0 ? kpi.target_value : 1000,
      unit: kpi.unit || '',
      description: `${kpi.metric_key} acceptance check`,
    }));
}

/**
 * Auto-create an IntentSpec for a card and link it.
 * Called when plan generation fails with MISSING_INTENT_SPEC.
 * Fully dynamic — queries the backend for available intent types
 * based on the board's vertical.
 */
async function autoProvisionIntentSpec(cardId: string): Promise<void> {
  // 1. Fetch card to get board_id, config, KPIs, etc.
  const { data: card } = await apiClient.get(KERNEL_ENDPOINTS.CARDS.GET(cardId));
  const boardId = card.board_id;

  // 2. Fetch board to get vertical_id
  const { data: board } = await apiClient.get(KERNEL_ENDPOINTS.BOARDS.GET(boardId));
  const verticalSlug = board.vertical_id || 'engineering';

  // 3. Select the best intent type dynamically
  const intentType = await selectIntentType(card, verticalSlug);

  // 4. Fetch required inputs from the intent type definition
  const inputs = await fetchRequiredInputs(intentType);

  // 5. Create IntentSpec
  const { data: intent } = await apiClient.post(KERNEL_ENDPOINTS.INTENTS.CREATE(boardId), {
    intent_type: intentType,
    goal: `Execute ${card.title}`,
    card_id: cardId,
    inputs,
    acceptance_criteria: buildAcceptanceCriteria(card.kpis),
    governance: { level: 'light', require_review: false },
  });

  // 6. Link IntentSpec and intent_type to card
  const intentId = intent.id ?? intent.intent?.id;
  await apiClient.patch(KERNEL_ENDPOINTS.CARDS.UPDATE(cardId), {
    intent_spec_id: intentId,
    intent_type: intentType,
  });
}

// --- Queries ---

export async function fetchPlan(cardId: string): Promise<PlanResponse | null> {
  try {
    const { data } = await apiClient.get(KERNEL_ENDPOINTS.PLANS.GET(cardId));
    return transformPlan(data.plan ?? data);
  } catch (err) {
    // Plan service returns 503 when not configured — return null (no plan)
    if (axios.isAxiosError(err) && (err.response?.status === 503 || err.response?.status === 404)) {
      return null;
    }
    // Also handle enriched errors from our interceptor
    if ((err as APIError)?.status === 503 || (err as APIError)?.status === 404) {
      return null;
    }
    throw err;
  }
}

// --- Mutations ---

export async function generatePlan(
  cardId: string,
  options?: { pipeline_id?: string; overrides?: Record<string, unknown> }
): Promise<PlanResponse> {
  const body = {
    pipeline_id: options?.pipeline_id ?? '',
    ...(options?.overrides ? { overrides: options.overrides } : {}),
  };

  try {
    const { data } = await apiClient.post(KERNEL_ENDPOINTS.PLANS.GENERATE(cardId), body);
    return transformPlan(data.plan ?? data);
  } catch (err) {
    // Auto-provision IntentSpec if missing, then retry once
    if ((err as APIError)?.code === 'MISSING_INTENT_SPEC') {
      await autoProvisionIntentSpec(cardId);
      const { data } = await apiClient.post(KERNEL_ENDPOINTS.PLANS.GENERATE(cardId), body);
      return transformPlan(data.plan ?? data);
    }
    // Plan already exists — return the existing plan instead of erroring
    if ((err as APIError)?.code === 'PLAN_ALREADY_EXISTS') {
      const existing = await fetchPlan(cardId);
      if (existing) return existing;
    }
    throw err;
  }
}

export async function editPlan(
  cardId: string,
  payload: Record<string, unknown>
): Promise<PlanResponse> {
  const { data } = await apiClient.patch(KERNEL_ENDPOINTS.PLANS.EDIT(cardId), payload);
  return transformPlan(data.plan ?? data);
}

export async function compilePlan(cardId: string): Promise<PlanResponse> {
  // Compile returns workflow_yaml, not a plan — fetch updated plan after
  try {
    await apiClient.post(KERNEL_ENDPOINTS.PLANS.COMPILE(cardId));
  } catch (err) {
    // 409 PLAN_NOT_DRAFT = plan is already compiled/validated — just return it
    if ((err as APIError)?.code === 'PLAN_NOT_DRAFT') {
      const plan = await fetchPlan(cardId);
      if (plan) return plan;
    }
    throw err;
  }
  return fetchPlan(cardId) as Promise<PlanResponse>;
}

export async function validatePlan(cardId: string): Promise<PlanResponse> {
  // Validate returns PreflightResult. Backend returns 422 when preflight fails
  // (passed=false) — we still need to parse the result and attach to plan.
  let preflightData: any = null;
  try {
    const { data } = await apiClient.post(KERNEL_ENDPOINTS.PLANS.VALIDATE(cardId));
    preflightData = data;
  } catch (err) {
    const apiErr = err as APIError;
    // 422 = preflight failed but response body has the result
    if (apiErr?.status === 422) {
      const plan = await fetchPlan(cardId);
      if (plan) {
        return plan;
      }
    }
    // 409 PLAN_NOT_DRAFT = plan is already validated — just return it
    if (apiErr?.code === 'PLAN_NOT_DRAFT') {
      const plan = await fetchPlan(cardId);
      if (plan) return plan;
    }
    throw err;
  }
  // Fetch updated plan (now has preflight result cached)
  const plan = await fetchPlan(cardId);
  if (plan) {
    if (preflightData && !plan.preflight_result) {
      plan.preflight_result = parsePreflight(preflightData);
    }
    return plan;
  }
  throw new Error('Plan not found after validation');
}

export async function executePlan(cardId: string): Promise<PlanResponse> {
  // Execute returns ExecutePlanResult, not a plan — fetch updated plan after
  try {
    await apiClient.post(KERNEL_ENDPOINTS.PLANS.EXECUTE(cardId));
  } catch (err) {
    // 412 PLAN_NOT_VALIDATED — auto-validate then retry execute once
    if ((err as APIError)?.code === 'PLAN_NOT_VALIDATED') {
      await validatePlan(cardId);
      await apiClient.post(KERNEL_ENDPOINTS.PLANS.EXECUTE(cardId));
      return fetchPlan(cardId) as Promise<PlanResponse>;
    }
    throw err;
  }
  return fetchPlan(cardId) as Promise<PlanResponse>;
}

export async function fetchPlanExecutionStatus(
  cardId: string
): Promise<PlanExecutionStatus> {
  try {
    const plan = await fetchPlan(cardId);
    if (!plan) {
      return {
        plan_id: '',
        status: 'draft',
        steps: [],
        completed_steps: 0,
        total_steps: 0,
      };
    }
    const steps = plan.steps ?? [];
    return {
      plan_id: plan.id,
      status: plan.status,
      steps: steps.map((s) => ({
        id: s.id,
        tool_name: s.tool_name,
        status: s.status,
      })),
      completed_steps: steps.filter((s) => s.status === 'completed').length,
      total_steps: steps.length,
    };
  } catch (err) {
    if (axios.isAxiosError(err) && (err.response?.status === 503 || err.response?.status === 404)) {
      return {
        plan_id: '',
        status: 'draft',
        steps: [],
        completed_steps: 0,
        total_steps: 0,
      };
    }
    if ((err as APIError)?.status === 503 || (err as APIError)?.status === 404) {
      return {
        plan_id: '',
        status: 'draft',
        steps: [],
        completed_steps: 0,
        total_steps: 0,
      };
    }
    throw err;
  }
}
