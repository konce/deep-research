// useSSE Custom Hook
// Manages Server-Sent Events (SSE) connections with React lifecycle

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * SSE message type
 */
export interface SSEMessage {
  type: string;
  content?: any;
  timestamp?: string;
  [key: string]: any;
}

/**
 * SSE connection status
 */
export type SSEStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * SSE hook options
 */
export interface UseSSEOptions {
  /**
   * Auto-reconnect on connection loss
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Reconnect delay in milliseconds
   * @default 3000
   */
  reconnectDelay?: number;

  /**
   * Maximum number of reconnect attempts
   * @default 5
   */
  maxReconnectAttempts?: number;

  /**
   * Callback for when connection opens
   */
  onOpen?: () => void;

  /**
   * Callback for when connection closes
   */
  onClose?: () => void;

  /**
   * Callback for errors
   */
  onError?: (error: Event) => void;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Custom hook for managing SSE connections
 *
 * @param url - SSE endpoint URL (can be null to not connect)
 * @param onMessage - Callback for each message received
 * @param options - Additional options
 * @returns SSE connection state and controls
 *
 * @example
 * ```typescript
 * const { status, messages, error, connect, disconnect } = useSSE(
 *   `/api/research/${id}/stream`,
 *   (message) => {
 *     console.log('Received:', message);
 *   },
 *   {
 *     autoReconnect: true,
 *     onOpen: () => console.log('Connected!'),
 *   }
 * );
 * ```
 */
export function useSSE(
  url: string | null,
  onMessage: (message: SSEMessage) => void,
  options: UseSSEOptions = {}
) {
  const {
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    debug = false,
  } = options;

  const [status, setStatus] = useState<SSEStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<SSEMessage[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isManualDisconnectRef = useRef(false);

  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log('[useSSE]', ...args);
      }
    },
    [debug]
  );

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (!url) {
      log('No URL provided, skipping connection');
      return;
    }

    if (eventSourceRef.current) {
      log('Already connected, skipping');
      return;
    }

    log('Connecting to:', url);
    setStatus('connecting');
    setError(null);
    isManualDisconnectRef.current = false;

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.addEventListener('open', () => {
        log('Connection opened');
        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      });

      // Message received
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SSEMessage;
          log('Message received:', data.type);

          // Update messages array
          setMessages((prev) => [...prev, data]);

          // Call onMessage callback
          onMessage(data);
        } catch (err) {
          log('Failed to parse message:', err);
          console.error('[useSSE] Failed to parse message:', err);
        }
      };

      // Error occurred
      eventSource.onerror = (event) => {
        log('Connection error:', event);

        // Check if connection is closed
        if (eventSource.readyState === EventSource.CLOSED) {
          log('Connection closed');
          setStatus('disconnected');
          onClose?.();

          // Attempt reconnection if not manually disconnected
          if (
            autoReconnect &&
            !isManualDisconnectRef.current &&
            reconnectAttemptsRef.current < maxReconnectAttempts
          ) {
            reconnectAttemptsRef.current++;
            log(
              `Attempting reconnect ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${reconnectDelay}ms`
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              eventSourceRef.current?.close();
              eventSourceRef.current = null;
              connect();
            }, reconnectDelay);
          } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            const errorMsg = `Failed to reconnect after ${maxReconnectAttempts} attempts`;
            log(errorMsg);
            setError(errorMsg);
            setStatus('error');
          }
        } else {
          setStatus('error');
        }

        onError?.(event);
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect';
      log('Connection error:', errorMsg);
      setError(errorMsg);
      setStatus('error');
    }
  }, [
    url,
    onMessage,
    autoReconnect,
    reconnectDelay,
    maxReconnectAttempts,
    onOpen,
    onClose,
    onError,
    log,
  ]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    log('Disconnecting');
    isManualDisconnectRef.current = true;

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, [log]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    log('Clearing messages');
    setMessages([]);
  }, [log]);

  /**
   * Reset error state
   */
  const clearError = useCallback(() => {
    log('Clearing error');
    setError(null);
  }, [log]);

  // Auto-connect on mount if URL is provided
  useEffect(() => {
    if (url) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [url]); // Only reconnect if URL changes

  return {
    /** Current connection status */
    status,

    /** Error message if any */
    error,

    /** Array of all received messages */
    messages,

    /** Current number of reconnect attempts */
    reconnectAttempts: reconnectAttemptsRef.current,

    /** Connect to SSE endpoint */
    connect,

    /** Disconnect from SSE endpoint */
    disconnect,

    /** Clear all messages */
    clearMessages,

    /** Clear error state */
    clearError,

    /** Whether currently connected */
    isConnected: status === 'connected',

    /** Whether connecting */
    isConnecting: status === 'connecting',

    /** Whether disconnected */
    isDisconnected: status === 'disconnected',

    /** Whether in error state */
    isError: status === 'error',
  };
}

/**
 * Utility hook to use SSE with automatic filtering by message type
 *
 * @param url - SSE endpoint URL
 * @param messageType - Filter messages by this type
 * @param onMessage - Callback for filtered messages
 * @param options - SSE options
 *
 * @example
 * ```typescript
 * useSSEFiltered(
 *   `/api/research/${id}/stream`,
 *   'thinking',
 *   (message) => {
 *     console.log('Thinking:', message.content);
 *   }
 * );
 * ```
 */
export function useSSEFiltered(
  url: string | null,
  messageType: string,
  onMessage: (message: SSEMessage) => void,
  options?: UseSSEOptions
) {
  return useSSE(
    url,
    (message) => {
      if (message.type === messageType) {
        onMessage(message);
      }
    },
    options
  );
}
