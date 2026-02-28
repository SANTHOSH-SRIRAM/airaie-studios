// ============================================================
// Card API functions — wraps axios calls with KERNEL_ENDPOINTS
// ============================================================

import axios from 'axios';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { Card } from '@/types/board';

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

// --- Queries ---

export async function fetchCards(boardId: string): Promise<Card[]> {
  const { data } = await axios.get<{ cards: Card[] }>(
    KERNEL_ENDPOINTS.CARDS.LIST(boardId)
  );
  return data.cards ?? [];
}

export async function fetchCard(id: string): Promise<Card> {
  const { data } = await axios.get<Card>(KERNEL_ENDPOINTS.CARDS.GET(id));
  return data;
}

export async function fetchCardGraph(boardId: string): Promise<CardGraphResponse> {
  const { data } = await axios.get<CardGraphResponse>(
    KERNEL_ENDPOINTS.CARDS.GRAPH(boardId)
  );
  return data;
}

export async function fetchCardEvidence(
  cardId: string,
  params?: { run_id?: string; latest?: boolean }
): Promise<CardEvidence[]> {
  const { data } = await axios.get<{ evidence: CardEvidence[] }>(
    KERNEL_ENDPOINTS.CARDS.EVIDENCE(cardId),
    { params }
  );
  return data.evidence ?? [];
}

export async function fetchCardRuns(cardId: string): Promise<CardRun[]> {
  const { data } = await axios.get<{ runs: CardRun[] }>(
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
  }
): Promise<Card> {
  const { data } = await axios.post<Card>(
    KERNEL_ENDPOINTS.CARDS.LIST(boardId),
    payload
  );
  return data;
}

export async function updateCard(
  id: string,
  payload: Partial<Pick<Card, 'name' | 'status' | 'config' | 'kpis'>>
): Promise<Card> {
  const { data } = await axios.patch<Card>(
    KERNEL_ENDPOINTS.CARDS.UPDATE(id),
    payload
  );
  return data;
}
