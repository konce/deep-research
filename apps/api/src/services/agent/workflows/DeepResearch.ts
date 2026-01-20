import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { getAgentService } from '../AgentService';

/**
 * Research stages
 */
export enum ResearchStage {
  INITIALIZING = 'initializing',
  PLANNING = 'planning',
  SEARCHING = 'searching',
  ANALYZING_DOCUMENTS = 'analyzing_documents',
  SYNTHESIZING = 'synthesizing',
  GENERATING_REPORT = 'generating_report',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Research progress event
 */
export interface ResearchProgressEvent {
  sessionId: string;
  stage: ResearchStage;
  progress: number; // 0-100
  message: string;
  timestamp: string;
  metadata?: any;
}

/**
 * Research options
 */
export interface DeepResearchOptions {
  maxBudget?: number;
  searchDepth?: 'basic' | 'advanced';
  includeDocuments?: string[]; // Document IDs to analyze
  maxTurns?: number;
}

/**
 * Deep Research Workflow
 * Orchestrates multi-stage research process with progress tracking
 */
export class DeepResearchWorkflow extends EventEmitter {
  private prisma: PrismaClient;
  private agentService: ReturnType<typeof getAgentService>;
  private currentStage: ResearchStage = ResearchStage.INITIALIZING;
  private progressPercentage: number = 0;
  private cancelled: boolean = false;

  // Stage weights for progress calculation
  private readonly stageWeights: Partial<Record<ResearchStage, number>> = {
    [ResearchStage.INITIALIZING]: 5,
    [ResearchStage.PLANNING]: 10,
    [ResearchStage.SEARCHING]: 30,
    [ResearchStage.ANALYZING_DOCUMENTS]: 20,
    [ResearchStage.SYNTHESIZING]: 20,
    [ResearchStage.GENERATING_REPORT]: 15,
  };

  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.agentService = getAgentService();
  }

  /**
   * Execute deep research workflow
   */
  async *execute(
    sessionId: string,
    query: string,
    options: DeepResearchOptions = {}
  ): AsyncGenerator<ResearchProgressEvent> {
    console.log(`[DeepResearchWorkflow] Starting research: ${sessionId}`);
    console.log(`[DeepResearchWorkflow] Query: "${query}"`);
    console.log(`[DeepResearchWorkflow] Options:`, options);

    try {
      // Stage 1: Initializing
      yield* this.runStage(
        sessionId,
        ResearchStage.INITIALIZING,
        'Initializing research session...',
        async () => {
          // Validate session
          const session = await this.prisma.researchSession.findUnique({
            where: { id: sessionId },
          });

          if (!session) {
            throw new Error(`Session ${sessionId} not found`);
          }

          // Check if documents are requested and exist
          if (options.includeDocuments && options.includeDocuments.length > 0) {
            const documents = await this.prisma.document.findMany({
              where: { id: { in: options.includeDocuments } },
            });

            if (documents.length !== options.includeDocuments.length) {
              throw new Error('Some requested documents not found');
            }

            console.log(`[DeepResearchWorkflow] ${documents.length} documents will be analyzed`);
          }
        }
      );

      // Check cancellation
      if (this.cancelled) {
        yield* this.handleCancellation(sessionId);
        return;
      }

      // Stage 2: Planning
      yield* this.runStage(
        sessionId,
        ResearchStage.PLANNING,
        'Planning research approach...',
        async () => {
          // Agent will plan in its first few turns
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      );

      // Check cancellation
      if (this.cancelled) {
        yield* this.handleCancellation(sessionId);
        return;
      }

      // Stage 3: Searching & Analyzing (combined with Agent execution)
      yield* this.runStage(
        sessionId,
        ResearchStage.SEARCHING,
        'Searching web and analyzing sources...',
        async () => {
          // This is where the main Agent work happens
          // We'll delegate to AgentService and track its progress
          await this.executeAgentResearch(sessionId, query, options);
        }
      );

      // Check cancellation
      if (this.cancelled) {
        yield* this.handleCancellation(sessionId);
        return;
      }

      // Stage 4: Completed
      this.currentStage = ResearchStage.COMPLETED;
      this.progressPercentage = 100;

      yield {
        sessionId,
        stage: ResearchStage.COMPLETED,
        progress: 100,
        message: 'Research completed successfully',
        timestamp: new Date().toISOString(),
      };

      console.log(`[DeepResearchWorkflow] Research completed: ${sessionId}`);
    } catch (error) {
      console.error(`[DeepResearchWorkflow] Research failed:`, error);

      this.currentStage = ResearchStage.FAILED;

      yield {
        sessionId,
        stage: ResearchStage.FAILED,
        progress: this.progressPercentage,
        message: `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };

      throw error;
    }
  }

  /**
   * Execute a research stage
   */
  private async *runStage(
    sessionId: string,
    stage: ResearchStage,
    message: string,
    action: () => Promise<void>
  ): AsyncGenerator<ResearchProgressEvent> {
    this.currentStage = stage;
    const stageProgress = this.calculateStageProgress(stage);

    console.log(`[DeepResearchWorkflow] Stage: ${stage} (${stageProgress}%)`);

    const event: ResearchProgressEvent = {
      sessionId,
      stage,
      progress: stageProgress,
      message,
      timestamp: new Date().toISOString(),
    };

    // Emit event for SSE streaming
    this.emit('progress', event);

    // Also yield for generator consumers
    yield event;

    await action();

    this.progressPercentage = stageProgress;
  }

  /**
   * Execute Agent research and track progress
   */
  private async executeAgentResearch(
    sessionId: string,
    query: string,
    options: DeepResearchOptions
  ): Promise<void> {
    // Delegate to AgentService
    const generator = this.agentService.conductResearch(sessionId, query, options);

    for await (const update of generator) {
      // Map Agent updates to workflow events
      // This allows us to track sub-progress within the searching stage
      if (update.type === 'status') {
        // Agent is working, emit sub-progress
        this.emit('agent-update', update);
      }

      // Check for cancellation
      if (this.cancelled) {
        // Cancel the agent research
        await this.agentService.cancelResearch(sessionId);
        break;
      }
    }
  }

  /**
   * Calculate progress percentage for a stage
   */
  private calculateStageProgress(stage: ResearchStage): number {
    // Terminal stages return 100%
    if (stage === ResearchStage.COMPLETED || stage === ResearchStage.FAILED || stage === ResearchStage.CANCELLED) {
      return 100;
    }

    const stages = [
      ResearchStage.INITIALIZING,
      ResearchStage.PLANNING,
      ResearchStage.SEARCHING,
      ResearchStage.ANALYZING_DOCUMENTS,
      ResearchStage.SYNTHESIZING,
      ResearchStage.GENERATING_REPORT,
    ];

    let totalWeight = 0;
    let currentWeight = 0;

    for (const s of stages) {
      const weight = this.stageWeights[s] || 0;
      if (s === stage) {
        currentWeight = totalWeight;
        break;
      }
      totalWeight += weight;
    }

    // Add total weights
    totalWeight = Object.values(this.stageWeights).reduce((a, b) => a + b, 0);

    return Math.round((currentWeight / totalWeight) * 100);
  }

  /**
   * Cancel the research
   */
  cancel(): void {
    console.log('[DeepResearchWorkflow] Cancellation requested');
    this.cancelled = true;
  }

  /**
   * Handle cancellation
   */
  private async *handleCancellation(sessionId: string): AsyncGenerator<ResearchProgressEvent> {
    this.currentStage = ResearchStage.CANCELLED;

    yield {
      sessionId,
      stage: ResearchStage.CANCELLED,
      progress: this.progressPercentage,
      message: 'Research cancelled by user',
      timestamp: new Date().toISOString(),
    };

    // Update database
    await this.prisma.researchSession.update({
      where: { id: sessionId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Get current progress
   */
  getCurrentProgress(): { stage: ResearchStage; progress: number } {
    return {
      stage: this.currentStage,
      progress: this.progressPercentage,
    };
  }
}

/**
 * Workflow manager for tracking active workflows
 */
class WorkflowManager {
  private workflows: Map<string, DeepResearchWorkflow> = new Map();

  /**
   * Create a new workflow
   */
  createWorkflow(sessionId: string): DeepResearchWorkflow {
    const workflow = new DeepResearchWorkflow();
    this.workflows.set(sessionId, workflow);
    return workflow;
  }

  /**
   * Get workflow by session ID
   */
  getWorkflow(sessionId: string): DeepResearchWorkflow | undefined {
    return this.workflows.get(sessionId);
  }

  /**
   * Remove workflow
   */
  removeWorkflow(sessionId: string): void {
    const workflow = this.workflows.get(sessionId);
    if (workflow) {
      workflow.removeAllListeners();
      this.workflows.delete(sessionId);
    }
  }

  /**
   * Cancel a workflow
   */
  cancelWorkflow(sessionId: string): boolean {
    const workflow = this.workflows.get(sessionId);
    if (workflow) {
      workflow.cancel();
      return true;
    }
    return false;
  }
}

// Singleton instance
let workflowManager: WorkflowManager | null = null;

/**
 * Get or create workflow manager singleton
 */
export function getWorkflowManager(): WorkflowManager {
  if (!workflowManager) {
    workflowManager = new WorkflowManager();
    console.log('[WorkflowManager] Manager initialized');
  }
  return workflowManager;
}
