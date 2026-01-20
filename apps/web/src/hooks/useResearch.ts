// useResearch Custom Hook
// Provides research API integration with TanStack Query and SSE streaming

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { researchApi, formatAPIError } from '../api/research';
import { useSSE, type SSEMessage } from './useSSE';
import { queryKeys, invalidateResearch } from '../api/queryClient';
import type { StartResearchRequest, ResearchSession } from '@deep-research/shared-types';

/**
 * Hook to start a new research session
 *
 * @returns Mutation for starting research
 *
 * @example
 * ```typescript
 * const { mutate, isPending, error } = useStartResearch();
 *
 * const handleStart = () => {
 *   mutate({
 *     query: "What is TypeScript?",
 *     maxBudget: 2.0,
 *     searchDepth: "standard"
 *   }, {
 *     onSuccess: (session) => {
 *       navigate(`/research/${session.id}`);
 *     }
 *   });
 * };
 * ```
 */
export function useStartResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: StartResearchRequest) =>
      researchApi.startResearch(params),
    onSuccess: (session) => {
      // Invalidate research queries
      queryClient.invalidateQueries({ queryKey: queryKeys.research.all });

      // Set initial cache for this research
      queryClient.setQueryData(
        queryKeys.research.status(session.id),
        session
      );
    },
    onError: (error) => {
      console.error('[useStartResearch] Error:', formatAPIError(error));
    },
  });
}

/**
 * Hook to get research session status
 *
 * @param id - Research session ID
 * @param options - Query options
 * @returns Query with research status
 *
 * @example
 * ```typescript
 * const { data: status, isLoading, error } = useResearchStatus("res_abc123");
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return <div>Status: {status.status}</div>;
 * ```
 */
export function useResearchStatus(
  id: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: queryKeys.research.status(id),
    queryFn: () => researchApi.getStatus(id),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Hook to cancel a research session
 *
 * @returns Mutation for cancelling research
 *
 * @example
 * ```typescript
 * const { mutate: cancel, isPending } = useCancelResearch();
 *
 * const handleCancel = () => {
 *   if (confirm('Cancel research?')) {
 *     cancel(researchId, {
 *       onSuccess: () => {
 *         alert('Research cancelled');
 *       }
 *     });
 *   }
 * };
 * ```
 */
export function useCancelResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => researchApi.cancelResearch(id),
    onSuccess: (_data, id) => {
      // Invalidate status to reflect cancellation
      queryClient.invalidateQueries({ queryKey: queryKeys.research.status(id) });
    },
  });
}

/**
 * Hook to manage research with SSE streaming
 *
 * @param id - Research session ID
 * @param options - Options for SSE and polling
 * @returns Combined research state and controls
 *
 * @example
 * ```typescript
 * const {
 *   status,
 *   messages,
 *   currentStage,
 *   sourcesCount,
 *   isLoading,
 *   error,
 *   cancel
 * } = useResearchWithStream(researchId);
 *
 * return (
 *   <div>
 *     <div>Status: {status}</div>
 *     <div>Stage: {currentStage}</div>
 *     <div>Sources: {sourcesCount}</div>
 *     <button onClick={cancel}>Cancel</button>
 *   </div>
 * );
 * ```
 */
export function useResearchWithStream(
  id: string,
  options?: {
    enabled?: boolean;
    onComplete?: (session: ResearchSession) => void;
    onError?: (error: any) => void;
  }
) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // Get research status
  const {
    data: session,
    isLoading,
    error: queryError,
  } = useResearchStatus(id, {
    enabled: options?.enabled !== false,
    refetchInterval: 5000, // Poll every 5 seconds while enabled
  });

  // Connect to SSE stream when research is running
  const {
    status: sseStatus,
    messages,
    error: sseError,
    disconnect,
  } = useSSE(
    streamUrl,
    useCallback((message: SSEMessage) => {
      console.log('[useResearch] SSE message:', message.type);

      // Handle completion message
      if (message.type === 'complete' && options?.onComplete) {
        options.onComplete(message.content);
      }

      // Handle error message
      if (message.type === 'error' && options?.onError) {
        options.onError(message.content);
      }
    }, [options]),
    {
      autoReconnect: true,
      debug: false,
    }
  );

  // Cancel mutation
  const { mutate: cancelMutation, isPending: isCancelling } = useCancelResearch();

  // Enable streaming when research is running
  useState(() => {
    if (session?.status === 'running' || session?.status === 'pending') {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/research/${id}/stream`;
      setStreamUrl(url);
    } else {
      setStreamUrl(null);
      disconnect();
    }
  });

  // Cancel handler
  const cancel = useCallback(() => {
    cancelMutation(id, {
      onSuccess: () => {
        disconnect();
        invalidateResearch(id);
      },
    });
  }, [id, cancelMutation, disconnect]);

  // Compute derived state
  const isRunning = session?.status === 'running' || session?.status === 'pending';
  const isComplete = session?.status === 'completed';
  const isFailed = session?.status === 'failed';
  const isCancelled = session?.status === 'cancelled';

  // Get current stage from messages
  const currentStage = messages.length > 0
    ? messages[messages.length - 1].stage
    : undefined;

  // Get sources count from messages
  const sourcesCount = messages.reduce((count, msg) => {
    if (msg.type === 'source_found') return count + 1;
    return count;
  }, 0);

  return {
    // Session data
    session,
    status: session?.status,
    currentStage,
    sourcesCount,

    // SSE messages
    messages,
    sseStatus,

    // Loading states
    isLoading,
    isCancelling,

    // Status flags
    isRunning,
    isComplete,
    isFailed,
    isCancelled,

    // Errors
    error: queryError || sseError,

    // Actions
    cancel,
  };
}

/**
 * Hook to get specific message types from research stream
 *
 * @param messages - All SSE messages
 * @param type - Message type to filter
 * @returns Filtered messages
 *
 * @example
 * ```typescript
 * const { messages } = useResearchWithStream(id);
 * const thinkingMessages = useFilteredMessages(messages, 'thinking');
 * const sourceMessages = useFilteredMessages(messages, 'source_found');
 * ```
 */
export function useFilteredMessages(messages: SSEMessage[], type: string) {
  return messages.filter((msg) => msg.type === type);
}

/**
 * Hook to get latest message of a specific type
 *
 * @param messages - All SSE messages
 * @param type - Message type
 * @returns Latest message or null
 */
export function useLatestMessage(messages: SSEMessage[], type: string): SSEMessage | null {
  const filtered = useFilteredMessages(messages, type);
  return filtered.length > 0 ? filtered[filtered.length - 1] : null;
}
