// Agent Service Internal Types
// These types are specific to the Agent Service implementation

import type { ResearchUpdate } from '@deep-research/shared-types';

/**
 * Research options for conducting a research session
 */
export interface ResearchOptions {
  maxBudget?: number;
  maxTurns?: number;
  searchDepth?: 'basic' | 'advanced';
  includeDocuments?: string[];
}

/**
 * Agent message types from Claude Agent SDK
 */
export type AgentMessageType =
  | 'result'
  | 'toolUse'
  | 'toolResult'
  | 'thinking'
  | 'error';

/**
 * Internal representation of an Agent message
 */
export interface AgentMessage {
  type: AgentMessageType;
  content: any;
  timestamp: Date;
  metadata?: {
    toolName?: string;
    toolInput?: any;
    toolOutput?: any;
    usage?: UsageInfo;
  };
}

/**
 * Usage information from Agent SDK
 */
export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCostUsd?: number;
}

/**
 * Research session state
 */
export type ResearchStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * MCP Tool result format
 */
export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
