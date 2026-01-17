// Research Domain Types

export interface Source {
  id: string;
  type: 'web' | 'document' | 'api';
  url?: string;
  title?: string;
  snippet?: string;
  content?: string;
  createdAt: string;
}

export interface ResearchUpdate {
  type: 'status' | 'thinking' | 'tool_use' | 'tool_result' | 'result' | 'error';
  timestamp: string;
  data: {
    message?: string;
    toolName?: string;
    toolInput?: unknown;
    toolOutput?: unknown;
    progress?: number;
    sources?: Source[];
    error?: string;
  };
}

export interface ResearchOptions {
  maxBudget?: number;
  maxTurns?: number;
  searchDepth?: 'basic' | 'advanced';
  includeDocuments?: string[];
}

export interface ResearchSession {
  id: string;
  query: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  agentSessionId?: string;
  modelUsed?: string;
  totalCostUsd?: number;
  tokensUsed?: number;
}

export interface Report {
  id: string;
  sessionId: string;
  title: string;
  content: string;
  format: 'markdown' | 'html';
  createdAt: Date;
  updatedAt: Date;
}
