// TanStack Query Client Configuration
// Provides centralized query client setup with default options

import { QueryClient } from '@tanstack/react-query';

/**
 * Query Keys Structure
 * Organized by resource type for easy invalidation and caching
 */
export const queryKeys = {
  // Research queries
  research: {
    all: ['research'] as const,
    status: (id: string) => ['research', id, 'status'] as const,
    stream: (id: string) => ['research', id, 'stream'] as const,
  },

  // Reports queries
  reports: {
    all: ['reports'] as const,
    list: (params?: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      order?: string;
    }) => ['reports', 'list', params] as const,
    detail: (id: string) => ['reports', id] as const,
    stats: (id: string) => ['reports', id, 'stats'] as const,
  },

  // Documents queries
  documents: {
    all: ['documents'] as const,
    detail: (id: string) => ['documents', id] as const,
  },
} as const;

/**
 * Create and configure QueryClient
 * with default options optimized for this application
 */
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: How long data is considered fresh
        staleTime: 1000 * 60 * 5, // 5 minutes

        // Cache time: How long unused data stays in cache
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)

        // Retry failed requests
        retry: 1,

        // Retry delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus
        refetchOnWindowFocus: false,

        // Refetch on reconnect
        refetchOnReconnect: 'always',

        // Refetch on mount
        refetchOnMount: true,
      },

      mutations: {
        // Retry mutations once
        retry: 1,

        // Retry delay for mutations
        retryDelay: 1000,
      },
    },
  });
};

/**
 * Singleton query client instance
 * Create once and reuse throughout the application
 */
export const queryClient = createQueryClient();

/**
 * Utility function to invalidate all research-related queries
 */
export const invalidateResearch = async (id?: string) => {
  if (id) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.research.status(id) });
  } else {
    await queryClient.invalidateQueries({ queryKey: queryKeys.research.all });
  }
};

/**
 * Utility function to invalidate all reports-related queries
 */
export const invalidateReports = async (id?: string) => {
  if (id) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.reports.detail(id) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.reports.stats(id) });
  } else {
    await queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
  }
};

/**
 * Utility function to prefetch report
 * Useful for hover states or predictive loading
 */
export const prefetchReport = async (
  id: string,
  fetchFn: () => Promise<any>
) => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.reports.detail(id),
    queryFn: fetchFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Utility function to set query data manually
 * Useful for optimistic updates
 */
export const setReportData = (id: string, data: any) => {
  queryClient.setQueryData(queryKeys.reports.detail(id), data);
};

/**
 * Utility function to get cached report data
 */
export const getReportData = (id: string) => {
  return queryClient.getQueryData(queryKeys.reports.detail(id));
};

/**
 * Utility function to remove query from cache
 */
export const removeQuery = (queryKey: readonly unknown[]) => {
  queryClient.removeQueries({ queryKey });
};

/**
 * Clear all queries from cache
 * Useful for logout or reset scenarios
 */
export const clearAllQueries = () => {
  queryClient.clear();
};
