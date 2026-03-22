// ============================================================
// Card API functions — wraps axios calls with KERNEL_ENDPOINTS
// ============================================================

import apiClient from './client';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { Card, BackendCard, BackendCardGraphNode } from '@/types/board';
import { autoProvisionIntentSpec } from './plans';

// --- Card graph node/edge types ---

export interface CardGraphNode {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface CardGraphEdge {
  source: string;
  target: string;
}

export interface CardGraphResponse {
  nodes: CardGraphNode[];
  edges: CardGraphEdge[];
}

// --- Evidence types ---

export interface CardEvidence {
  id: string;
  card_id: string;
  run_id?: string;
  criterion: string;
  value: number;
  threshold: number;
  operator: string;
  passed: boolean;
  created_at: string;
}

export interface CardRun {
  id: string;
  card_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}

// --- Transformers ---

/** Transform backend card (title/card_type/kpis[]) to frontend Card (name/type/kpis{}) */
function transformCard(raw: BackendCard, dependencies: string[] = []): Card {
  const kpis: Record<string, unknown> = {};
  if (Array.isArray(raw.kpis)) {
    for (const kpi of raw.kpis) {
      if (!kpi.metric_key) continue;
      kpis[kpi.metric_key] = {
        value: kpi.target_value,
        unit: kpi.unit,
        tolerance: kpi.tolerance,
      };
    }
  }

  return {
    id: raw.id,
    board_id: raw.board_id,
    intent_spec_id: raw.intent_spec_id,
    agent_id: raw.agent_id,
    agent_version: raw.agent_version,
    name: raw.title,
    title: raw.title,
    description: raw.description,
    type: raw.card_type as Card['type'],
    intent_type: raw.intent_type,
    status: raw.status as Card['status'],
    ordinal: raw.ordinal,
    config: raw.config ?? {},
    kpis,
    dependencies,
    started_at: raw.started_at,
    completed_at: raw.completed_at,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

// --- Queries ---

export async function fetchCards(boardId: string): Promise<Card[]> {
  // Fetch cards and graph in parallel to get dependencies
  const [cardsRes, graphRes] = await Promise.all([
    apiClient.get<{ cards: BackendCard[] }>(KERNEL_ENDPOINTS.CARDS.LIST(boardId)),
    apiClient.get<{ graph: BackendCardGraphNode[] }>(KERNEL_ENDPOINTS.CARDS.GRAPH(boardId)).catch(() => null),
  ]);

  // Build dependency map from graph response
  const depsMap = new Map<string, string[]>();
  if (graphRes?.data?.graph) {
    for (const node of graphRes.data.graph) {
      depsMap.set(node.id, node.depends_on ?? []);
    }
  }

  return (cardsRes.data.cards ?? []).map((raw) =>
    transformCard(raw, depsMap.get(raw.id) ?? [])
  );
}

export async function fetchCard(id: string): Promise<Card> {
  const { data } = await apiClient.get<BackendCard>(KERNEL_ENDPOINTS.CARDS.GET(id));
  return transformCard(data);
}

export async function fetchCardGraph(boardId: string): Promise<CardGraphResponse> {
  const { data } = await apiClient.get<{ graph: BackendCardGraphNode[] }>(
    KERNEL_ENDPOINTS.CARDS.GRAPH(boardId)
  );

  const graphNodes = data.graph ?? [];

  const nodes: CardGraphNode[] = graphNodes.map((n) => ({
    id: n.id,
    name: n.title,
    type: n.card_type,
    status: n.status,
  }));

  const edges: CardGraphEdge[] = graphNodes.flatMap((n) =>
    (n.depends_on ?? []).map((dep) => ({ source: dep, target: n.id }))
  );

  return { nodes, edges };
}

export async function fetchCardEvidence(
  cardId: string,
  params?: { run_id?: string; latest?: boolean }
): Promise<CardEvidence[]> {
  const { data } = await apiClient.get<{ evidence: CardEvidence[] }>(
    KERNEL_ENDPOINTS.CARDS.EVIDENCE(cardId),
    { params }
  );
  return data.evidence ?? [];
}

export async function fetchCardRuns(cardId: string): Promise<CardRun[]> {
  const { data } = await apiClient.get<{ runs: CardRun[] }>(
    KERNEL_ENDPOINTS.CARDS.RUNS(cardId)
  );
  return data.runs ?? [];
}

// --- Mutations ---

export async function createCard(
  boardId: string,
  payload: {
    name: string;
    type: string;
    description?: string;
    dependencies?: string[];
    config?: Record<string, unknown>;
    kpis?: unknown[];
    intent_type?: string;
  }
): Promise<Card> {
  // Backend expects title + card_type
  const { data } = await apiClient.post<BackendCard>(
    KERNEL_ENDPOINTS.CARDS.LIST(boardId),
    {
      title: payload.name,
      card_type: payload.type,
      description: payload.description ?? '',
      ...(payload.config ? { config: payload.config } : {}),
      ...(payload.kpis ? { kpis: payload.kpis } : {}),
      ...(payload.intent_type ? { intent_type: payload.intent_type } : {}),
    }
  );

  // Add dependencies via separate endpoint
  const deps = payload.dependencies ?? [];
  for (const depId of deps) {
    await apiClient.post(KERNEL_ENDPOINTS.CARDS.ADD_DEPENDENCY(data.id, depId), {
      dependency_type: 'blocks',
    });
  }

  // Proactively provision IntentSpec for analysis/comparison/sweep cards with intent_type.
  // This ensures plan generation works on first click without the fail-retry cycle.
  const planEligibleTypes = ['analysis', 'comparison', 'sweep'];
  if (payload.intent_type && planEligibleTypes.includes(payload.type)) {
    try {
      await autoProvisionIntentSpec(data.id);
    } catch {
      // Non-fatal: plan generation will retry via MISSING_INTENT_SPEC fallback
    }
  }

  return transformCard(data, deps);
}

export async function updateCard(
  id: string,
  payload: Partial<Pick<Card, 'name' | 'status' | 'config' | 'kpis' | 'intent_type' | 'agent_id' | 'agent_version'>> & {
    intent_spec_id?: string;
  }
): Promise<Card> {
  // Map frontend fields to backend fields
  const backendPayload: Record<string, unknown> = {};
  if (payload.name !== undefined) backendPayload.title = payload.name;
  if (payload.status !== undefined) backendPayload.status = payload.status;
  if (payload.config !== undefined) backendPayload.config = payload.config;
  if (payload.kpis !== undefined) backendPayload.kpis = payload.kpis;
  if (payload.intent_type !== undefined) backendPayload.intent_type = payload.intent_type;
  if (payload.intent_spec_id !== undefined) backendPayload.intent_spec_id = payload.intent_spec_id;
  if (payload.agent_id !== undefined) backendPayload.agent_id = payload.agent_id;
  if (payload.agent_version !== undefined) backendPayload.agent_version = payload.agent_version;

  const { data } = await apiClient.patch<BackendCard>(
    KERNEL_ENDPOINTS.CARDS.UPDATE(id),
    backendPayload
  );
  return transformCard(data);
}

export async function deleteCard(id: string): Promise<void> {
  await apiClient.delete(KERNEL_ENDPOINTS.CARDS.DELETE(id));
}

// --- Ready cards ---

export async function fetchReadyCards(boardId: string): Promise<Card[]> {
  const { data } = await apiClient.get<{ cards: BackendCard[] }>(
    KERNEL_ENDPOINTS.CARDS.READY(boardId)
  );
  return (data.cards ?? []).map((raw) => transformCard(raw));
}

// --- Dependency mutations ---

export async function addDependency(cardId: string, depId: string): Promise<void> {
  await apiClient.post(KERNEL_ENDPOINTS.CARDS.ADD_DEPENDENCY(cardId, depId), {
    dependency_type: 'blocks',
  });
}

export async function removeDependency(cardId: string, depId: string): Promise<void> {
  await apiClient.delete(KERNEL_ENDPOINTS.CARDS.REMOVE_DEPENDENCY(cardId, depId));
}
