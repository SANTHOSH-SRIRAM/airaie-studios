// ============================================================
// Approval-specific TanStack Query hooks
// ============================================================

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { Gate } from '@/types/board';

// --- Query key factories ---

export const approvalKeys = {
  all: ['approvals'] as const,
  pending: () => [...approvalKeys.all, 'pending'] as const,
  pendingForBoard: (boardId: string) =>
    [...approvalKeys.all, 'pending', boardId] as const,
};

/**
 * Fetch all pending gates across all boards.
 * Since there is no global "pending gates" endpoint, we fetch gates for each
 * board via the boards list and filter client-side. For now, we use a
 * lightweight proxy that fetches from /v0/boards then aggregates.
 *
 * If a boardId is provided, only fetches pending gates for that board.
 */
export function usePendingApprovals(boardId?: string) {
  return useQuery({
    queryKey: boardId
      ? approvalKeys.pendingForBoard(boardId)
      : approvalKeys.pending(),
    queryFn: async () => {
      if (boardId) {
        // Fetch gates for a specific board, filter to PENDING
        const { data } = await axios.get<{ gates: Gate[] }>(
          KERNEL_ENDPOINTS.GATES.LIST,
          { params: { board_id: boardId } }
        );
        return (data.gates ?? []).filter((g) => g.status === 'PENDING');
      }

      // Fetch all boards first, then only query gates for boards that
      // have children (heuristic: boards with children_count > 0 are
      // more likely to have gates). This reduces O(N) calls.
      const { data: boardsData } = await axios.get<{
        boards: { id: string; name: string; children_count?: number }[];
      }>(KERNEL_ENDPOINTS.BOARDS.LIST);
      const boards = boardsData.boards ?? [];

      // Deduplicate boards by id to avoid querying the same board twice
      const seen = new Set<string>();
      const uniqueBoards = boards.filter((b) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });

      const results = await Promise.allSettled(
        uniqueBoards.map(async (b) => {
          const { data } = await axios.get<{ gates: Gate[] }>(
            KERNEL_ENDPOINTS.GATES.LIST,
            { params: { board_id: b.id } }
          );
          return (data.gates ?? [])
            .filter((g) => g.status === 'PENDING')
            .map((g) => ({ ...g, _boardName: b.name }));
        })
      );

      return results.flatMap((r) =>
        r.status === 'fulfilled' ? r.value : []
      ) as (Gate & { _boardName?: string })[];
    },
    // Prevent thundering herd: data stays fresh for 30s, no refetch on window focus
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Returns just the count of pending approvals (for badge display).
 */
export function usePendingApprovalCount() {
  const query = usePendingApprovals();
  return {
    ...query,
    data: query.data?.length ?? 0,
  };
}
