// ============================================================
// TanStack Query hooks for evidence & intelligence APIs
// ============================================================

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import { fetchCardEvidence } from '@api/cards';
import type { EvidenceDiff, TriageResult, ReproducibilityScore } from '@/types/board';

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
    queryFn: async () => {
      const { data } = await axios.get<{ diffs: EvidenceDiff[] }>(
        KERNEL_ENDPOINTS.BOARDS.EVIDENCE_DIFF(boardId!)
      );
      return data.diffs ?? [];
    },
    enabled: !!boardId,
  });
}

export function useTriage(boardId: string | undefined) {
  return useQuery({
    queryKey: evidenceKeys.triage(boardId!),
    queryFn: async () => {
      const { data } = await axios.get<TriageResult>(
        KERNEL_ENDPOINTS.BOARDS.TRIAGE(boardId!)
      );
      return data;
    },
    enabled: !!boardId,
  });
}

export function useReproducibility(boardId: string | undefined) {
  return useQuery({
    queryKey: evidenceKeys.reproducibility(boardId!),
    queryFn: async () => {
      const { data } = await axios.get<ReproducibilityScore>(
        KERNEL_ENDPOINTS.BOARDS.REPRODUCIBILITY(boardId!)
      );
      return data;
    },
    enabled: !!boardId,
  });
}
