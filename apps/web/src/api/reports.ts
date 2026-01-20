// Reports API Functions
// Provides typed API functions for reports-related endpoints

import type { Report } from '@deep-research/shared-types';

/**
 * API base URL
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * API Error class (reuse from research.ts)
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new APIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    throw new APIError(
      errorData.message || errorData.error || 'An error occurred',
      response.status,
      errorData.code,
      errorData.details
    );
  }

  return response.json();
}

/**
 * Reports list response type
 */
export interface ReportsListResponse {
  reports: Array<{
    id: string;
    title: string;
    format: string;
    createdAt: string;
    updatedAt: string;
    researchSession: {
      id: string;
      query: string;
      status: string;
      modelUsed: string;
      sourcesCount: number;
    };
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Report detail response type
 */
export interface ReportDetailResponse extends Report {
  statistics: {
    wordCount: number;
    charCount: number;
    estimatedReadingTime: number;
  };
  researchSession: {
    id: string;
    query: string;
    status: string;
    modelUsed: string;
    totalCostUsd: number;
    tokensUsed: number;
    createdAt: string;
    completedAt?: string;
    sourcesCount: number;
    sources: Array<{
      id: string;
      type: string;
      title?: string;
      url?: string;
    }>;
  };
}

/**
 * Report statistics response type
 */
export interface ReportStatsResponse {
  reportId: string;
  title: string;
  statistics: {
    wordCount: number;
    charCount: number;
    lineCount: number;
    paragraphCount: number;
    headings: {
      h1: number;
      h2: number;
      h3: number;
      total: number;
    };
    links: number;
    codeBlocks: number;
    sourcesReferenced: number;
    estimatedReadingTime: number;
    createdAt: string;
  };
}

/**
 * Delete report response type
 */
export interface DeleteReportResponse {
  success: boolean;
  reportId: string;
  message: string;
}

/**
 * Reports API namespace
 */
export const reportsApi = {
  /**
   * List all reports with pagination and sorting
   *
   * @param params - Query parameters
   * @returns Promise resolving to reports list
   *
   * @example
   * ```typescript
   * const result = await reportsApi.listReports({
   *   limit: 20,
   *   offset: 0,
   *   sortBy: 'createdAt',
   *   order: 'desc'
   * });
   * console.log(result.reports.length); // 20
   * console.log(result.pagination.hasMore); // true
   * ```
   */
  listReports: async (params?: {
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'title';
    order?: 'asc' | 'desc';
  }): Promise<ReportsListResponse> => {
    const searchParams = new URLSearchParams();

    if (params?.limit !== undefined) {
      searchParams.set('limit', params.limit.toString());
    }
    if (params?.offset !== undefined) {
      searchParams.set('offset', params.offset.toString());
    }
    if (params?.sortBy) {
      searchParams.set('sortBy', params.sortBy);
    }
    if (params?.order) {
      searchParams.set('order', params.order);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/reports?${searchParams.toString()}`
    );

    return handleResponse<ReportsListResponse>(response);
  },

  /**
   * Get a single report by ID
   *
   * @param id - Report ID
   * @returns Promise resolving to report details
   *
   * @example
   * ```typescript
   * const report = await reportsApi.getReport("rep_abc123");
   * console.log(report.title);
   * console.log(report.content); // Full Markdown content
   * console.log(report.statistics.wordCount); // 1234
   * ```
   */
  getReport: async (id: string): Promise<ReportDetailResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}`);
    return handleResponse<ReportDetailResponse>(response);
  },

  /**
   * Get detailed statistics for a report
   *
   * @param id - Report ID
   * @returns Promise resolving to report statistics
   *
   * @example
   * ```typescript
   * const stats = await reportsApi.getStats("rep_abc123");
   * console.log(stats.statistics.wordCount); // 1234
   * console.log(stats.statistics.headings.h2); // 10
   * console.log(stats.statistics.estimatedReadingTime); // 5 minutes
   * ```
   */
  getStats: async (id: string): Promise<ReportStatsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}/stats`);
    return handleResponse<ReportStatsResponse>(response);
  },

  /**
   * Download a report as a file
   *
   * @param id - Report ID
   * @param format - File format (markdown or txt)
   * @returns Promise that resolves when download starts
   *
   * @example
   * ```typescript
   * // Download as Markdown
   * await reportsApi.downloadReport("rep_abc123", "markdown");
   *
   * // Download as text
   * await reportsApi.downloadReport("rep_abc123", "txt");
   * ```
   */
  downloadReport: async (
    id: string,
    format: 'markdown' | 'md' | 'txt' | 'text' = 'markdown'
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/api/reports/${id}/download?format=${format}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || errorData.error || 'Download failed',
        response.status
      );
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `report-${id}.${format === 'txt' || format === 'text' ? 'txt' : 'md'}`;

    if (contentDisposition) {
      const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Delete a report
   *
   * @param id - Report ID
   * @returns Promise resolving to deletion confirmation
   *
   * @example
   * ```typescript
   * const result = await reportsApi.deleteReport("rep_abc123");
   * console.log(result.success); // true
   * console.log(result.message); // "Report deleted successfully"
   * ```
   */
  deleteReport: async (id: string): Promise<DeleteReportResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
      method: 'DELETE',
    });

    return handleResponse<DeleteReportResponse>(response);
  },
};

/**
 * Utility function to format report date
 */
export function formatReportDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Utility function to format report time
 */
export function formatReportDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Utility function to get relative time
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatReportDate(dateString);
}

/**
 * Utility function to format reading time
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (remainingMins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMins} min`;
}

/**
 * Utility function to format word count
 */
export function formatWordCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * Utility function to truncate report title
 */
export function truncateTitle(title: string, maxLength: number = 50): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 3) + '...';
}

/**
 * Utility function to extract first paragraph from content
 */
export function extractPreview(content: string, maxLength: number = 150): string {
  // Remove markdown headings
  const withoutHeadings = content.replace(/^#+\s+/gm, '');

  // Get first paragraph
  const firstParagraph = withoutHeadings.split('\n\n')[0];

  // Truncate if needed
  if (firstParagraph.length <= maxLength) return firstParagraph;
  return firstParagraph.slice(0, maxLength - 3) + '...';
}
