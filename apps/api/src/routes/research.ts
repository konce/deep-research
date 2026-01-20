import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { getAgentService } from '../services/agent/AgentService';
import { getWorkflowManager, type DeepResearchOptions } from '../services/agent/workflows/DeepResearch';

const router: Router = Router();
const prisma = new PrismaClient();
const agentService = getAgentService();
const workflowManager = getWorkflowManager();

// POST /api/research/start - Start a new research session
router.post('/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, maxBudget, searchDepth } = req.body;

    // Validation
    if (!query || typeof query !== 'string') {
      throw new AppError('Query is required and must be a string', 400);
    }

    if (query.trim().length < 5) {
      throw new AppError('Query must be at least 5 characters long', 400);
    }

    console.log('[API] Starting new research session');
    console.log(`[API] Query: "${query}"`);

    // Create research session in database
    const session = await prisma.researchSession.create({
      data: {
        query,
        status: 'pending',
        modelUsed: process.env.DEFAULT_MODEL || 'claude-sonnet-4-5-20250929',
      },
    });

    console.log(`[API] Created session: ${session.id}`);

    // Prepare research options
    const researchOptions: DeepResearchOptions = {
      maxBudget,
      searchDepth,
      includeDocuments: req.body.documentIds, // Array of document IDs to analyze
    };

    // Create workflow
    const workflow = workflowManager.createWorkflow(session.id);

    // Start research in background (non-blocking)
    const researchPromise = (async () => {
      try {
        const generator = workflow.execute(session.id, query, researchOptions);

        // Consume the generator (without blocking the response)
        for await (const event of generator) {
          console.log(`[API] Research progress: ${event.stage} (${event.progress}%)`);
        }

        console.log(`[API] Research completed: ${session.id}`);
        workflowManager.removeWorkflow(session.id);
      } catch (error) {
        console.error(`[API] Research failed: ${session.id}`, error);
        workflowManager.removeWorkflow(session.id);
      }
    })();

    // Don't await the research - it runs in background
    researchPromise.catch((err) => {
      console.error('[API] Unhandled research error:', err);
      workflowManager.removeWorkflow(session.id);
    });

    // Return session info immediately
    res.json({
      sessionId: session.id,
      query: session.query,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/research/:id/status - Get research session status
router.get('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    const session = await prisma.researchSession.findUnique({
      where: { id },
      include: {
        sources: true,
        report: true,
      },
    });

    if (!session) {
      throw new AppError('Research session not found', 404);
    }

    res.json({
      sessionId: session.id,
      query: session.query,
      status: session.status,
      modelUsed: session.modelUsed,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      completedAt: session.completedAt?.toISOString(),
      totalCostUsd: session.totalCostUsd,
      tokensUsed: session.tokensUsed,
      sourcesCount: session.sources.length,
      hasReport: !!session.report,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/research/:id/stream - SSE endpoint for research progress
router.get('/:id/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    // Verify session exists
    const session = await prisma.researchSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new AppError('Research session not found', 404);
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log(`[API] SSE stream connected for session: ${id}`);

    // Send initial connection event
    res.write(`data: ${JSON.stringify({
      type: 'status',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Connected to research stream',
        sessionId: id,
        status: session.status,
      }
    })}\n\n`);

    // If research is already completed or failed, send historical messages
    if (session.status === 'completed' || session.status === 'failed' || session.status === 'cancelled') {
      console.log(`[API] Sending historical messages for ${session.status} session`);

      const messages = await prisma.researchMessage.findMany({
        where: { researchSessionId: id },
        orderBy: { timestamp: 'asc' },
      });

      for (const msg of messages) {
        try {
          const content = JSON.parse(msg.content);
          res.write(`data: ${JSON.stringify({
            type: msg.type,
            timestamp: msg.timestamp.toISOString(),
            data: content,
          })}\n\n`);
        } catch (err) {
          console.error('[API] Error parsing message:', err);
        }
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({
        type: 'status',
        timestamp: new Date().toISOString(),
        data: {
          message: `Research ${session.status}`,
          status: session.status,
        }
      })}\n\n`);

      res.end();
    } else {
      // Research is still running or pending
      // Use EventEmitter for real-time updates (Phase 5)

      console.log(`[API] Research is ${session.status}, setting up real-time stream`);

      // Get workflow if exists
      const workflow = workflowManager.getWorkflow(id);

      if (workflow) {
        // Listen to workflow progress events
        const progressHandler = (event: any) => {
          res.write(`data: ${JSON.stringify({
            type: 'progress',
            timestamp: event.timestamp,
            data: {
              stage: event.stage,
              progress: event.progress,
              message: event.message,
            }
          })}\n\n`);
        };

        const agentUpdateHandler = (update: any) => {
          res.write(`data: ${JSON.stringify({
            type: 'agent-update',
            timestamp: new Date().toISOString(),
            data: update.data,
          })}\n\n`);
        };

        // Attach event listeners
        workflow.on('progress', progressHandler);
        workflow.on('agent-update', agentUpdateHandler);

        // Cleanup on disconnect
        req.on('close', () => {
          console.log(`[API] Client disconnected from stream: ${id}`);
          workflow.off('progress', progressHandler);
          workflow.off('agent-update', agentUpdateHandler);
        });

        // Keep-alive ping
        const keepAlive = setInterval(() => {
          res.write(`: keepalive\n\n`);
        }, 15000);

        req.on('close', () => {
          clearInterval(keepAlive);
        });
      } else {
        // Workflow not found, fallback to polling
        console.log(`[API] Workflow not found, using polling fallback`);

        const keepAlive = setInterval(() => {
          res.write(`: keepalive\n\n`);
        }, 15000);

        const statusPoll = setInterval(async () => {
          try {
            const updatedSession = await prisma.researchSession.findUnique({
              where: { id },
            });

            if (updatedSession && updatedSession.status !== session.status) {
              res.write(`data: ${JSON.stringify({
                type: 'status',
                timestamp: new Date().toISOString(),
                data: {
                  message: `Research status: ${updatedSession.status}`,
                  status: updatedSession.status,
                }
              })}\n\n`);

              if (updatedSession.status === 'completed' || updatedSession.status === 'failed') {
                clearInterval(keepAlive);
                clearInterval(statusPoll);
                res.end();
              }
            }
          } catch (err) {
            console.error('[API] Error polling status:', err);
          }
        }, 3000);

        req.on('close', () => {
          console.log(`[API] Client disconnected from stream: ${id}`);
          clearInterval(keepAlive);
          clearInterval(statusPoll);
        });
      }
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/research/:id/cancel - Cancel a research session
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    // Verify session exists
    const session = await prisma.researchSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new AppError('Research session not found', 404);
    }

    if (session.status !== 'running' && session.status !== 'pending') {
      throw new AppError(`Cannot cancel research with status: ${session.status}`, 400);
    }

    console.log(`[API] Cancelling research session: ${id}`);

    // Cancel via WorkflowManager (which will cancel AgentService internally)
    const cancelled = workflowManager.cancelWorkflow(id);

    if (!cancelled) {
      // Fallback to direct AgentService cancellation
      await agentService.cancelResearch(id);
    }

    res.json({
      success: true,
      sessionId: id,
      message: 'Research session cancellation requested',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
