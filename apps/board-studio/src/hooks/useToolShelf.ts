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

export const toolShelfKeys = {
  all: ['toolshelf'] as const,
  resolve: (cardId: string) => [...toolShelfKeys.all, 'resolve', cardId] as const,
};

export function useToolShelf(cardId: string | undefined) {
  const { data: card } = useCardDetail(cardId);

  return useQuery<ToolEntry[]>({
    queryKey: toolShelfKeys.resolve(cardId!),
    queryFn: () => {
      // Pass the card's type as intent_type (e.g. "simulation", "analysis")
      // and card.config as optional configuration context
      return resolveTools(card!.type, card?.config ?? {});
    },
    enabled: !!cardId && !!card,
  });
}
