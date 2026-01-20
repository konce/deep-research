import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { getAgentService } from '../services/agent/AgentService';

const router: Router = Router();
const prisma = new PrismaClient();
const agentService = getAgentService();

// POST /api/research/start - Start a new research session
router.post('/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, maxBudget, searchDepth, includeDocuments } = req.body;

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

    // Start research in background (non-blocking)
    const researchPromise = (async () => {
      try {
        const generator = agentService.conductResearch(session.id, query, {
          maxBudget,
          searchDepth,
          includeDocuments,
        });

        // Consume the generator (without blocking the response)
        for await (const update of generator) {
          // Updates are being processed and saved by AgentService
          console.log(`[API] Research update: ${update.type}`);
        }

        console.log(`[API] Research completed: ${session.id}`);
      } catch (error) {
        console.error(`[API] Research failed: ${session.id}`, error);
      }
    })();

    // Don't await the research - it runs in background
    researchPromise.catch((err) => {
      console.error('[API] Unhandled research error:', err);
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
      // Phase 2: Just keep the connection alive with periodic updates
      // Phase 3: Will implement real-time streaming via EventEmitter

      console.log(`[API] Research is ${session.status}, keeping connection alive`);

      const keepAlive = setInterval(() => {
        res.write(`: keepalive\n\n`);
      }, 15000);

      // Poll for status updates every 3 seconds
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

            // If research completed, end the stream
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
        res.end();
      });
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

    // Cancel via AgentService
    await agentService.cancelResearch(String(id));

    res.json({
      success: true,
      sessionId: id,
      message: 'Research session cancelled',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
