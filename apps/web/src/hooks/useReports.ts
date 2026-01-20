// useReports Custom Hook
// Provides reports API integration with TanStack Query

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';
import { queryKeys, invalidateReports } from '../api/queryClient';

/**
 * Hook to list all reports with pagination
 *
 * @param params - Query parameters
 * @returns Query with reports list
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useReportsList({
 *   limit: 20,
 *   offset: 0,
 *   sortBy: 'createdAt',
 *   order: 'desc'
 * });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error</div>;
 *
 * return (
 *   <div>
 *     {data.reports.map(report => (
 *       <ReportCard key={report.id} report={report} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useReportsList(params?: {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'title';
  order?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: queryKeys.reports.list(params),
    queryFn: () => reportsApi.listReports(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to get a single report by ID
 *
 * @param id - Report ID
 * @param options - Query options
 * @returns Query with report details
 *
 * @example
 * ```typescript
 * const { data: report, isLoading, error } = useReport(reportId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error />;
 *
 * return (
 *   <div>
 *     <h1>{report.title}</h1>
 *     <MarkdownViewer content={report.content} />
 *   </div>
 * );
 * ```
 */
export function useReport(
  id: string,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: queryKeys.reports.detail(id),
    queryFn: () => reportsApi.getReport(id),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get report statistics
 *
 * @param id - Report ID
 * @param options - Query options
 * @returns Query with report statistics
 *
 * @example
 * ```typescript
 * const { data: stats } = useReportStats(reportId);
 *
 * return (
 *   <div>
 *     <p>Words: {stats?.statistics.wordCount}</p>
 *     <p>Reading time: {stats?.statistics.estimatedReadingTime} min</p>
 *   </div>
 * );
 * ```
 */
export function useReportStats(
  id: string,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: queryKeys.reports.stats(id),
    queryFn: () => reportsApi.getStats(id),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 10, // 10 minutes (stats don't change)
  });
}

/**
 * Hook to download a report
 *
 * @returns Mutation for downloading report
 *
 * @example
 * ```typescript
 * const { mutate: download, isPending } = useDownloadReport();
 *
 * const handleDownload = (format: 'markdown' | 'txt') => {
 *   download({ id: reportId, format }, {
 *     onSuccess: () => {
 *       toast.success('Downloaded!');
 *     }
 *   });
 * };
 * ```
 */
export function useDownloadReport() {
  return useMutation({
    mutationFn: ({
      id,
      format,
    }: {
      id: string;
      format?: 'markdown' | 'md' | 'txt' | 'text';
    }) => reportsApi.downloadReport(id, format),
    onSuccess: () => {
      console.log('[useDownloadReport] Download started');
    },
    onError: (error) => {
      console.error('[useDownloadReport] Error:', error);
    },
  });
}

/**
 * Hook to delete a report
 *
 * @returns Mutation for deleting report
 *
 * @example
 * ```typescript
 * const { mutate: deleteReport, isPending } = useDeleteReport();
 *
 * const handleDelete = () => {
 *   if (confirm('Delete this report?')) {
 *     deleteReport(reportId, {
 *       onSuccess: () => {
 *         navigate('/reports');
 *       }
 *     });
 *   }
 * };
 * ```
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reportsApi.deleteReport(id),
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.reports.detail(id) });
      queryClient.removeQueries({ queryKey: queryKeys.reports.stats(id) });

      // Invalidate list to reflect deletion
      invalidateReports();

      console.log('[useDeleteReport] Report deleted:', id);
    },
    onError: (error) => {
      console.error('[useDeleteReport] Error:', error);
    },
  });
}

/**
 * Hook for pagination state management
 *
 * @param initialLimit - Initial page size
 * @returns Pagination state and controls
 *
 * @example
 * ```typescript
 * const {
 *   limit,
 *   offset,
 *   page,
 *   setPage,
 *   nextPage,
 *   prevPage,
 *   hasMore
 * } = usePagination(20);
 *
 * const { data } = useReportsList({ limit, offset });
 *
 * return (
 *   <div>
 *     <ReportsList reports={data?.reports} />
 *     <button onClick={prevPage} disabled={page === 1}>Previous</button>
 *     <span>Page {page}</span>
 *     <button onClick={nextPage} disabled={!hasMore}>Next</button>
 *   </div>
 * );
 * ```
 */
export function usePagination(initialLimit: number = 20) {
  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);

  const page = Math.floor(offset / limit) + 1;

  const setPage = (newPage: number) => {
    setOffset((newPage - 1) * limit);
  };

  const nextPage = () => {
    setOffset((prev) => prev + limit);
  };

  const prevPage = () => {
    setOffset((prev) => Math.max(0, prev - limit));
  };

  const reset = () => {
    setOffset(0);
  };

  return {
    limit,
    offset,
    page,
    setLimit: (newLimit: number) => {
      setLimit(newLimit);
      setOffset(0); // Reset to first page when changing limit
    },
    setPage,
    setOffset,
    nextPage,
    prevPage,
    reset,
  };
}

/**
 * Hook for sorting state management
 *
 * @param initialSortBy - Initial sort field
 * @param initialOrder - Initial sort order
 * @returns Sorting state and controls
 *
 * @example
 * ```typescript
 * const { sortBy, order, toggleSort, setSortBy, setOrder } = useSorting(
 *   'createdAt',
 *   'desc'
 * );
 *
 * const { data } = useReportsList({ sortBy, order });
 *
 * return (
 *   <div>
 *     <button onClick={() => toggleSort('createdAt')}>
 *       Date {sortBy === 'createdAt' && (order === 'desc' ? '↓' : '↑')}
 *     </button>
 *     <button onClick={() => toggleSort('title')}>
 *       Title {sortBy === 'title' && (order === 'desc' ? '↓' : '↑')}
 *     </button>
 *   </div>
 * );
 * ```
 */
export function useSorting(
  initialSortBy: 'createdAt' | 'title' = 'createdAt',
  initialOrder: 'asc' | 'desc' = 'desc'
) {
  const [sortBy, setSortBy] = useState<'createdAt' | 'title'>(initialSortBy);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);

  const toggleSort = (field: 'createdAt' | 'title') => {
    if (sortBy === field) {
      // Toggle order if same field
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // Switch to new field with default order
      setSortBy(field);
      setOrder('desc');
    }
  };

  return {
    sortBy,
    order,
    setSortBy,
    setOrder,
    toggleSort,
  };
}

/**
 * Combined hook for reports list with pagination and sorting
 *
 * @param initialLimit - Initial page size
 * @param initialSortBy - Initial sort field
 * @param initialOrder - Initial sort order
 * @returns Combined state and data
 *
 * @example
 * ```typescript
 * const {
 *   data,
 *   isLoading,
 *   page,
 *   sortBy,
 *   order,
 *   nextPage,
 *   prevPage,
 *   toggleSort
 * } = useReportsWithPagination(20, 'createdAt', 'desc');
 * ```
 */
export function useReportsWithPagination(
  initialLimit: number = 20,
  initialSortBy: 'createdAt' | 'title' = 'createdAt',
  initialOrder: 'asc' | 'desc' = 'desc'
) {
  const pagination = usePagination(initialLimit);
  const sorting = useSorting(initialSortBy, initialOrder);

  const query = useReportsList({
    limit: pagination.limit,
    offset: pagination.offset,
    sortBy: sorting.sortBy,
    order: sorting.order,
  });

  return {
    ...query,
    ...pagination,
    ...sorting,
    hasMore: query.data?.pagination.hasMore ?? false,
    total: query.data?.pagination.total ?? 0,
  };
}
