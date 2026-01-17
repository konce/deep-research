// API Request/Response Types

export interface StartResearchRequest {
  query: string;
  maxBudget?: number;
  searchDepth?: 'basic' | 'advanced';
}

export interface StartResearchResponse {
  sessionId: string;
  query: string;
  status: string;
  createdAt: string;
}

export interface ResearchStatusResponse {
  sessionId: string;
  query: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  totalCostUsd?: number;
  tokensUsed?: number;
}

export interface ReportResponse {
  id: string;
  title: string;
  content: string;
  format: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  session?: {
    query: string;
    totalCostUsd?: number;
  };
}

export interface ListReportsResponse {
  reports: ReportResponse[];
  total: number;
}

export interface UploadDocumentResponse {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
