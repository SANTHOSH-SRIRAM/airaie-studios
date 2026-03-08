// ============================================================
// TanStack Query hooks for evidence & intelligence APIs
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { fetchCardEvidence } from '@api/cards';
import { fetchEvidenceDiff, fetchTriage, fetchReproducibility } from '@api/boards';

// --- Query key factories ---

export const evidenceKeys = {
  all: ['evidence'] as const,
  card: (cardId: string, params?: { run_id?: string; latest?: boolean }) =>
    [...evidenceKeys.all, 'card', cardId, params] as const,
  diff: (boardId: string) => [...evidenceKeys.all, 'diff', boardId] as const,
  triage: (boardId: string) => [...evidenceKeys.all, 'triage', boardId] as const,
  reproducibility: (boardId: string) =>
    [...evidenceKeys.all, 'reproducibility', boardId] as const,
};

// --- Queries ---

export function useCardEvidence(
  cardId: string | undefined,
  params?: { run_id?: string; latest?: boolean }
) {
  return useQuery({
    queryKey: evidenceKeys.card(cardId!, params),
    queryFn: () => fetchCardEvidence(cardId!, params),
    enabled: !!cardId,
  });
}

export function useEvidenceDiff(boardId: string | undefined) {
  return useQuery({
    queryKey: evidenceKeys.diff(boardId!),
    queryFn: () => fetchEvidenceDiff(boardId!),
    enabled: !!boardId,
  });
}

export function useTriage(boardId: string | undefined) {
  return useQuery({
    queryKey: evidenceKeys.triage(boardId!),
    queryFn: () => fetchTriage(boardId!),
    enabled: !!boardId,
  });
}

export function useReproducibility(boardId: string | undefined) {
  return useQuery({
    queryKey: evidenceKeys.reproducibility(boardId!),
    queryFn: () => fetchReproducibility(boardId!),
    enabled: !!boardId,
  });
}
