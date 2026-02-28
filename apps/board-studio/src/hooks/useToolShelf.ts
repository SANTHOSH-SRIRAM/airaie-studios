// ============================================================
// TanStack Query hook for ToolShelf resolution
// ============================================================
//
// IMPORTANT: Uses POST /v0/toolshelf/resolve/v2 with the card's
// intent spec as body. Does NOT use GET by card ID.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { useCardDetail } from '@hooks/useCards';
import { resolveTools } from '@api/toolshelf';
import type { ToolEntry } from '@/types/board';

// --- Query key factory ---

export const toolShelfKeys = {
  all: ['toolshelf'] as const,
  resolve: (cardId: string) => [...toolShelfKeys.all, 'resolve', cardId] as const,
};

/**
 * Resolves tools for a card by fetching the card's intent spec,
 * then POSTing to /v0/toolshelf/resolve/v2.
 */
export function useToolShelf(cardId: string | undefined) {
  const { data: card } = useCardDetail(cardId);

  return useQuery<ToolEntry[]>({
    queryKey: toolShelfKeys.resolve(cardId!),
    queryFn: async () => {
      // card.config contains the intent spec
      const intentSpec = card?.config ?? {};
      return resolveTools(intentSpec);
    },
    enabled: !!cardId && !!card,
  });
}
