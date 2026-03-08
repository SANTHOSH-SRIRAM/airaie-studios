// =============================================================
// Shared React Query configuration
// =============================================================

import type { QueryClientConfig } from '@tanstack/react-query';
import type { APIError } from '../api/client';

/**
 * Default React Query config for all studios.
 * Each app creates its own QueryClient with this config:
 *
 *   const queryClient = new QueryClient(defaultQueryConfig);
 */
export const defaultQueryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        const apiErr = error as unknown as APIError;
        // Don't retry 4xx (client errors)
        if (apiErr.status >= 400 && apiErr.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
};
