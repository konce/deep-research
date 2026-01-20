// Research API Functions
// Provides typed API functions for research-related endpoints

import type {
  ResearchSession,
  StartResearchRequest,
  ResearchStatusResponse,
} from '@deep-research/shared-types';

/**
 * Cancel research response type
 */
export interface CancelResearchResponse {
  success: boolean;
  sessionId: string;
  message: string;
}

/**
 * API base URL
 * Use environment variable or default to localhost:3000
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Generic API error class
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
 * Handle API response and throw errors if needed
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
 * Research API namespace
 * Contains all research-related API functions
 */
export const researchApi = {
  /**
   * Start a new research session
   *
   * @param params - Research parameters
   * @returns Promise resolving to research session data
   *
   * @example
   * ```typescript
   * const session = await researchApi.startResearch({
   *   query: "What is TypeScript?",
   *   maxBudget: 2.0,
   *   searchDepth: "advanced"
   * });
   * console.log(session.id); // "res_abc123"
   * ```
   */
  startResearch: async (
    params: StartResearchRequest
  ): Promise<ResearchSession> => {
    const response = await fetch(`${API_BASE_URL}/api/research/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    return handleResponse<ResearchSession>(response);
  },

  /**
   * Get research session status
   *
   * @param id - Research session ID
   * @returns Promise resolving to research status
   *
   * @example
   * ```typescript
   * const status = await researchApi.getStatus("res_abc123");
   * console.log(status.status); // "running"
   * console.log(status.currentStage); // "research"
   * ```
   */
  getStatus: async (id: string): Promise<ResearchStatusResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/research/${id}/status`);
    return handleResponse<ResearchStatusResponse>(response);
  },

  /**
   * Cancel an ongoing research session
   *
   * @param id - Research session ID
   * @returns Promise resolving to cancellation confirmation
   *
   * @example
   * ```typescript
   * const result = await researchApi.cancelResearch("res_abc123");
   * console.log(result.success); // true
   * ```
   */
  cancelResearch: async (id: string): Promise<CancelResearchResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/research/${id}/cancel`, {
      method: 'POST',
    });

    return handleResponse<CancelResearchResponse>(response);
  },

  /**
   * Connect to SSE stream for real-time research updates
   *
   * @param id - Research session ID
   * @param onMessage - Callback for each SSE message
   * @param onError - Optional error callback
   * @returns EventSource instance (call .close() to disconnect)
   *
   * @example
   * ```typescript
   * const eventSource = researchApi.streamResearch(
   *   "res_abc123",
   *   (data) => {
   *     console.log('Message:', data.type, data.content);
   *   },
   *   (error) => {
   *     console.error('Stream error:', error);
   *   }
   * );
   *
   * // Later: disconnect
   * eventSource.close();
   * ```
   */
  streamResearch: (
    id: string,
    onMessage: (data: any) => void,
    onError?: (error: Event) => void
  ): EventSource => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/api/research/${id}/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('[Research Stream] Failed to parse message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[Research Stream] Connection error:', error);

      // Check if connection is closed
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('[Research Stream] Connection closed');
      }

      // Call custom error handler if provided
      if (onError) {
        onError(error);
      }
    };

    // Log connection opened
    eventSource.addEventListener('open', () => {
      console.log('[Research Stream] Connection opened');
    });

    return eventSource;
  },
};

/**
 * Type guard to check if an error is an APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

/**
 * Utility function to format API errors for display
 */
export function formatAPIError(error: unknown): string {
  if (isAPIError(error)) {
    if (error.details) {
      return `${error.message} (${JSON.stringify(error.details)})`;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

/**
 * Utility function to check if research is in progress
 */
export function isResearchInProgress(status: string): boolean {
  return status === 'pending' || status === 'running';
}

/**
 * Utility function to check if research is complete
 */
export function isResearchComplete(status: string): boolean {
  return status === 'completed';
}

/**
 * Utility function to check if research has failed
 */
export function isResearchFailed(status: string): boolean {
  return status === 'failed';
}

/**
 * Utility function to check if research was cancelled
 */
export function isResearchCancelled(status: string): boolean {
  return status === 'cancelled';
}

/**
 * Get human-readable status text
 */
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    running: 'In Progress',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };

  return statusMap[status] || status;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'text-yellow-600',
    running: 'text-blue-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
    cancelled: 'text-gray-600',
  };

  return colorMap[status] || 'text-gray-600';
}
