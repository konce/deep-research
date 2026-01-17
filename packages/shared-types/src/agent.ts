// Agent-specific Types

export interface WebSearchToolInput {
  query: string;
  numResults?: number;
  searchDepth?: 'basic' | 'advanced';
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  content: string;
  publishedDate?: string;
  score?: number;
}

export interface DocumentReaderToolInput {
  documentId: string;
  chunkSize?: number;
}

export interface ReportWriterToolInput {
  title: string;
  sections: ReportSection[];
  citations: Citation[];
}

export interface ReportSection {
  heading: string;
  content: string;
  subsections?: ReportSection[];
}

export interface Citation {
  id: string;
  title: string;
  url?: string;
  source: string;
}

export interface AgentConfig {
  model: string;
  maxTurns: number;
  maxBudgetUsd: number;
  systemPrompt: string;
  tools: string[];
}
