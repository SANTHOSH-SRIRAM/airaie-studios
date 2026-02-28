// ============================================================
// Composite hook combining board detail + summary data
// ============================================================

import { useBoardDetail as useBoardDetailQuery, useBoardSummary } from '@hooks/useBoards';

/**
 * Combines useBoardDetail and useBoardSummary into a single hook
 * for the board detail dashboard page.
 */
export function useBoardDashboard(boardId: string | undefined) {
  const boardQuery = useBoardDetailQuery(boardId);
  const summaryQuery = useBoardSummary(boardId);

  return {
    board: boardQuery.data,
    summary: summaryQuery.data,
    isLoading: boardQuery.isLoading || summaryQuery.isLoading,
    error: boardQuery.error || summaryQuery.error,
    refetch: () => {
      boardQuery.refetch();
      summaryQuery.refetch();
    },
  };
}
