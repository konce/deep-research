// Agent Service - Core orchestrator for research sessions
// Integrates Claude Agent SDK with MCP tools and database persistence

import { query, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { PrismaClient } from '@prisma/client';
import type { ResearchUpdate } from '@deep-research/shared-types';
import type { ResearchOptions } from './types';

import { webSearchTool } from './tools/webSearch';
import { documentReaderTool } from './tools/documentReader';
import { reportWriterTool } from './tools/reportWriter';
import { generateResearchPrompt } from './prompts/researcher';

/**
 * AgentService - Main service class for managing research sessions
 */
export class AgentService {
  private mcpServer: any;
  private prisma: PrismaClient;
  private activeResearch: Map<string, AbortController>;
  private maxConcurrent: number;

  constructor() {
    this.prisma = new PrismaClient();
    this.activeResearch = new Map();
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_RESEARCH || '2', 10);

    console.log('[AgentService] Initializing MCP server with tools...');

    // Initialize MCP server with custom tools
    this.mcpServer = createSdkMcpServer({
      name: 'deep-research-tools',
      version: '1.0.0',
      tools: [webSearchTool, documentReaderTool, reportWriterTool],
    });

    console.log('[AgentService] MCP server initialized successfully');
  }

  /**
   * Conduct a research session using Claude Agent SDK
   * Returns an async generator that yields research updates in real-time
   */
  async *conductResearch(
    sessionId: string,
    researchQuery: string,
    options: ResearchOptions = {}
  ): AsyncGenerator<ResearchUpdate> {
    console.log(`[AgentService] Starting research session: ${sessionId}`);
    console.log(`[AgentService] Query: "${researchQuery}"`);
    console.log(`[AgentService] Options:`, options);

    // Check concurrent limit
    if (this.activeResearch.size >= this.maxConcurrent) {
      throw new Error(
        `Maximum concurrent research sessions reached (${this.maxConcurrent}). Please wait for other sessions to complete.`
      );
    }

    // Update session status to running
    await this.prisma.researchSession.update({
      where: { id: sessionId },
      data: {
        status: 'running',
        updatedAt: new Date(),
      },
    });

    // Create abort controller for cancellation
    const controller = new AbortController();
    this.activeResearch.set(sessionId, controller);

    try {
      // Generate system prompt
      const prompt = generateResearchPrompt(researchQuery, options);

      // Get configuration from environment
      const maxTurns = options.maxTurns || parseInt(process.env.MAX_TURNS || '50', 10);
      const maxBudget = options.maxBudget || parseFloat(process.env.MAX_BUDGET_PER_RESEARCH || '3.0');
      const model = process.env.DEFAULT_MODEL || 'claude-sonnet-4-5-20250929';

      console.log(`[AgentService] Configuration: model=${model}, maxTurns=${maxTurns}, maxBudget=$${maxBudget}`);

      // Yield initial status
      yield {
        type: 'status',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Research started',
          progress: 0,
        },
      };

      // Call Agent SDK query
      let messageCount = 0;
      let lastUsage: any = null;

      for await (const message of query({
        prompt,
        options: {
          model,
          mcpServers: {
            'deep-research-tools': this.mcpServer,
          },
          allowedTools: [
            'mcp__deep-research-tools__web_search',
            'mcp__deep-research-tools__document_reader',
            'mcp__deep-research-tools__report_writer',
          ],
          maxTurns,
          maxBudgetUsd: maxBudget,
        },
      })) {
        messageCount++;
        console.log(`[AgentService] Message ${messageCount}:`, message.type);

        // Check for abort
        if (controller.signal.aborted) {
          throw new Error('Research cancelled by user');
        }

        // Process and persist message
        const update = await this.processMessage(sessionId, message);

        // Track usage for cost calculation (if available in message)
        if ((message as any).usage) {
          lastUsage = (message as any).usage;
        }

        // Calculate progress (estimate based on turns)
        const progress = Math.min(Math.round((messageCount / maxTurns) * 100), 99);
        if (update.data) {
          update.data.progress = progress;
        }

        // Yield update to stream
        yield update;
      }

      // Research completed successfully
      console.log(`[AgentService] Research completed: ${sessionId} (${messageCount} messages)`);

      // Update session with final data
      await this.completeResearch(sessionId, lastUsage);

      // Yield final completion status
      yield {
        type: 'status',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Research completed successfully',
          progress: 100,
        },
      };
    } catch (error) {
      // Handle errors
      console.error(`[AgentService] Research failed: ${sessionId}`, error);

      await this.failResearch(sessionId, error);

      // Yield error event
      yield {
        type: 'error',
        timestamp: new Date().toISOString(),
        data: {
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };

      throw error;
    } finally {
      // Cleanup
      this.activeResearch.delete(sessionId);
      console.log(`[AgentService] Cleaned up research session: ${sessionId}`);
    }
  }

  /**
   * Process a single Agent message and save to database
   */
  private async processMessage(sessionId: string, message: any): Promise<ResearchUpdate> {
    // Determine message type
    const messageType = this.getMessageType(message);

    // Save message to database
    try {
      await this.prisma.researchMessage.create({
        data: {
          researchSessionId: sessionId,
          type: messageType,
          content: JSON.stringify(message),
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('[AgentService] Failed to save message:', error);
    }

    // Handle specific message types
    // Agent SDK uses 'user' type for tool call results
    console.log('[processMessage] message.type:', message.type, 'messageType:', messageType);
    if (message.type === 'user' && message.message) {
      console.log('[processMessage] Calling handleToolResult');
      await this.handleToolResult(sessionId, message);
    } else if (message.type === 'user') {
      console.log('[processMessage] message.type is user but no message.message');
    }

    // Format update for SSE stream
    const update: ResearchUpdate = {
      type: this.mapMessageTypeToUpdateType(messageType),
      timestamp: new Date().toISOString(),
      data: this.formatMessageData(message),
    };

    return update;
  }

  /**
   * Handle tool results (save sources, reports, etc.)
   */
  private async handleToolResult(sessionId: string, message: any) {
    try {
      console.log('[handleToolResult] Called for session:', sessionId);
      console.log('[handleToolResult] Message type:', message.type);
      console.log('[handleToolResult] Has message.message:', !!message.message);
      console.log('[handleToolResult] Has message.message.content:', !!message.message?.content);

      // Access the correct nested structure: message.message.content
      if (!message.message?.content || !Array.isArray(message.message.content)) {
        console.log('[handleToolResult] No valid message.message.content, returning');
        return;
      }

      console.log('[handleToolResult] Processing', message.message.content.length, 'content blocks');

      // Check each content block for tool results
      for (const content of message.message.content) {
        console.log('[handleToolResult] Content type:', content.type);
        if (content.type === 'tool_result' && content.content?.[0]?.text) {
          const toolUseId = content.tool_use_id || '';
          console.log('[handleToolResult] Found tool_result, toolUseId:', toolUseId);

          // Parse the JSON string from content.content[0].text
          const resultData = JSON.parse(content.content[0].text);

          // Check if this is a web_search result
          if (toolUseId.includes('web_search') || resultData.query) {
            console.log('[handleToolResult] Saving web_search results');
            await this.saveSources(sessionId, resultData);
          }

          // Check if this is a report_writer result
          if (toolUseId.includes('report_writer') || resultData.markdown) {
            console.log('[handleToolResult] Saving report');
            await this.saveReport(sessionId, resultData);
          }
        }
      }
    } catch (error) {
      console.error('[AgentService] Failed to handle tool result:', error);
    }
  }

  /**
   * Save search results as Sources
   */
  private async saveSources(sessionId: string, resultData: any) {
    try {
      // resultData is already parsed JSON from handleToolResult
      if (!resultData.results || !Array.isArray(resultData.results)) {
        return;
      }

      console.log(`[AgentService] Saving ${resultData.results.length} search results as sources`);

      // Save each result as a Source
      for (const result of resultData.results) {
        await this.prisma.source.create({
          data: {
            researchSessionId: sessionId,
            type: 'web',
            url: result.url,
            title: result.title,
            snippet: result.snippet,
            content: result.content,
          },
        });
      }

      console.log(`[AgentService] Successfully saved ${resultData.results.length} sources`);
    } catch (error) {
      console.error('[AgentService] Error saving sources:', error);
    }
  }

  /**
   * Save final report
   */
  private async saveReport(sessionId: string, resultData: any) {
    try {
      // resultData is already parsed JSON from handleToolResult
      if (!resultData.markdown || !resultData.metadata) {
        return;
      }

      console.log(`[AgentService] Saving research report: "${resultData.metadata.title}"`);

      // Create or update report
      await this.prisma.report.upsert({
        where: {
          researchSessionId: sessionId,
        },
        create: {
          researchSessionId: sessionId,
          title: resultData.metadata.title,
          content: resultData.markdown,
          format: 'markdown',
        },
        update: {
          title: resultData.metadata.title,
          content: resultData.markdown,
          updatedAt: new Date(),
        },
      });

      console.log(`[AgentService] Successfully saved report`);
    } catch (error) {
      console.error('[AgentService] Error saving report:', error);
    }
  }

  /**
   * Mark research as completed
   */
  private async completeResearch(sessionId: string, usage: any) {
    try {
      const updateData: any = {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      };

      // Extract cost and token info from usage
      if (usage) {
        if (usage.totalCostUsd !== undefined) {
          updateData.totalCostUsd = usage.totalCostUsd;
        }
        if (usage.totalTokens !== undefined) {
          updateData.tokensUsed = usage.totalTokens;
        }
      }

      await this.prisma.researchSession.update({
        where: { id: sessionId },
        data: updateData,
      });

      console.log(`[AgentService] Research marked as completed: ${sessionId}`);
    } catch (error) {
      console.error('[AgentService] Error completing research:', error);
    }
  }

  /**
   * Mark research as failed
   */
  private async failResearch(sessionId: string, error: any) {
    try {
      await this.prisma.researchSession.update({
        where: { id: sessionId },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      });

      // Optionally save error as a message
      await this.prisma.researchMessage.create({
        data: {
          researchSessionId: sessionId,
          type: 'error',
          content: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          }),
          timestamp: new Date(),
        },
      });

      console.log(`[AgentService] Research marked as failed: ${sessionId}`);
    } catch (err) {
      console.error('[AgentService] Error marking research as failed:', err);
    }
  }

  /**
   * Cancel an ongoing research session
   */
  async cancelResearch(sessionId: string): Promise<void> {
    console.log(`[AgentService] Cancelling research: ${sessionId}`);

    const controller = this.activeResearch.get(sessionId);

    if (controller) {
      controller.abort();

      await this.prisma.researchSession.update({
        where: { id: sessionId },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.activeResearch.delete(sessionId);

      console.log(`[AgentService] Research cancelled: ${sessionId}`);
    } else {
      console.log(`[AgentService] Research not found in active sessions: ${sessionId}`);
    }
  }

  /**
   * Get research session status
   */
  async getStatus(sessionId: string) {
    return await this.prisma.researchSession.findUnique({
      where: { id: sessionId },
      include: {
        sources: true,
        report: true,
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  }

  /**
   * Get message type from Agent SDK message
   */
  private getMessageType(message: any): string {
    if (message.type === 'result') {
      return 'result';
    }
    if (message.type === 'toolUse') {
      return 'tool_use';
    }
    if (message.type === 'toolResult') {
      return 'tool_result';
    }
    if (message.type === 'thinking') {
      return 'thinking';
    }
    if (message.type === 'user') {
      return 'user';
    }
    return 'assistant';
  }

  /**
   * Map Agent message type to ResearchUpdate type
   */
  private mapMessageTypeToUpdateType(messageType: string): ResearchUpdate['type'] {
    const typeMap: Record<string, ResearchUpdate['type']> = {
      result: 'result',
      tool_use: 'tool_use',
      tool_result: 'tool_result',
      thinking: 'thinking',
      assistant: 'status',
      error: 'error',
    };

    return typeMap[messageType] || 'status';
  }

  /**
   * Format message data for SSE stream
   */
  private formatMessageData(message: any): any {
    const data: any = {};

    if (message.type === 'toolUse') {
      data.toolName = message.name;
      data.toolInput = message.input;
    }

    if (message.type === 'toolResult') {
      data.toolName = message.toolName;
      if (message.result && message.result.content) {
        try {
          const resultText = message.result.content[0]?.text;
          if (resultText) {
            data.toolOutput = JSON.parse(resultText);
          }
        } catch {
          data.toolOutput = message.result;
        }
      }
    }

    if (message.type === 'result') {
      data.result = message.result;
    }

    if (message.content) {
      data.message = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    }

    return data;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.prisma.$disconnect();
    console.log('[AgentService] Cleanup complete');
  }
}

/**
 * Create a singleton instance
 */
let agentServiceInstance: AgentService | null = null;

export function getAgentService(): AgentService {
  if (!agentServiceInstance) {
    agentServiceInstance = new AgentService();
  }
  return agentServiceInstance;
}
