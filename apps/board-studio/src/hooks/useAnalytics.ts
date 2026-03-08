// ============================================================
// TanStack Query hook for analytics dashboard
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsSummary } from '@api/analytics';
import type { AnalyticsSummary } from '@api/analytics';

export const analyticsKeys = {
  summary: ['analytics', 'summary'] as const,
};

export function useAnalyticsSummary() {
  return useQuery<AnalyticsSummary>({
    queryKey: analyticsKeys.summary,
    queryFn: fetchAnalyticsSummary,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
