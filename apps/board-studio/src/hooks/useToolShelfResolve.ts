// ============================================================
// useToolShelfResolve — React Query hook for V2 tool shelf resolution
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { resolveToolShelf } from '@api/toolshelf';
import type { ResolveResultV2 } from '@api/toolshelf';

export function useToolShelfResolve(
  intentType: string | undefined,
  projectId: string | undefined,
) {
  return useQuery<ResolveResultV2>({
    queryKey: ['toolshelf', 'resolve', intentType, projectId],
    queryFn: () => resolveToolShelf(intentType!, projectId!),
    enabled: !!intentType && !!projectId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
