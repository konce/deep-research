import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const router: Router = Router();
const prisma = new PrismaClient();

// GET /api/reports - Get all reports
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '20', offset = '0', sortBy = 'createdAt', order = 'desc' } = req.query;

    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    // Validate pagination
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new AppError('Invalid limit parameter (must be 1-100)', 400);
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      throw new AppError('Invalid offset parameter', 400);
    }

    // Get total count
    const totalCount = await prisma.report.count();

    // Get reports with pagination
    const reports = await prisma.report.findMany({
      take: limitNum,
      skip: offsetNum,
      orderBy: {
        [sortBy as string]: order === 'asc' ? 'asc' : 'desc',
      },
      include: {
        researchSession: {
          select: {
            query: true,
            status: true,
            modelUsed: true,
            sources: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Format response
    const formattedReports = reports.map((report) => ({
      id: report.id,
      title: report.title,
      format: report.format,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      researchSession: {
        id: report.researchSessionId,
        query: report.researchSession.query,
        status: report.researchSession.status,
        modelUsed: report.researchSession.modelUsed,
        sourcesCount: report.researchSession.sources.length,
      },
    }));

    res.json({
      reports: formattedReports,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:id - Get a specific report
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { format } = req.query;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        researchSession: {
          select: {
            query: true,
            status: true,
            modelUsed: true,
            totalCostUsd: true,
            tokensUsed: true,
            createdAt: true,
            completedAt: true,
            sources: {
              select: {
                id: true,
                type: true,
                title: true,
                url: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    // Calculate statistics from content
    const wordCount = report.content.split(/\s+/).filter((w) => w.length > 0).length;
    const charCount = report.content.length;
    const estimatedReadingTime = Math.ceil(wordCount / 225);

    const response: any = {
      id: report.id,
      title: report.title,
      content: report.content,
      format: report.format,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      statistics: {
        wordCount,
        charCount,
        estimatedReadingTime,
      },
      researchSession: {
        id: report.researchSessionId,
        query: report.researchSession.query,
        status: report.researchSession.status,
        modelUsed: report.researchSession.modelUsed,
        totalCostUsd: report.researchSession.totalCostUsd,
        tokensUsed: report.researchSession.tokensUsed,
        createdAt: report.researchSession.createdAt.toISOString(),
        completedAt: report.researchSession.completedAt?.toISOString(),
        sourcesCount: report.researchSession.sources.length,
        sources: report.researchSession.sources,
      },
    };

    // Return in requested format
    if (format === 'html') {
      // TODO: Convert Markdown to HTML in future
      response.contentHtml = report.content; // Placeholder
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:id/download - Download report as file
router.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { format = 'markdown' } = req.query;

    const report = await prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
      },
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    // Generate filename
    const safeTitle = report.title
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase()
      .replace(/^-+|-+$/g, '');

    const timestamp = report.createdAt.toISOString().split('T')[0];
    const filename = `${safeTitle}-${timestamp}`;

    // Set response headers based on format
    if (format === 'markdown' || format === 'md') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"`);
      res.send(report.content);
    } else if (format === 'txt' || format === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
      res.send(report.content);
    } else {
      throw new AppError('Invalid format. Supported formats: markdown, md, txt, text', 400);
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:id/stats - Get report statistics
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    const report = await prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        researchSession: {
          select: {
            sources: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    // Calculate detailed statistics
    const content = report.content;
    const lines = content.split('\n');
    const words = content.split(/\s+/).filter((w) => w.length > 0);

    // Count headings
    const h1Count = (content.match(/^# /gm) || []).length;
    const h2Count = (content.match(/^## /gm) || []).length;
    const h3Count = (content.match(/^### /gm) || []).length;

    // Count links
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;

    // Count code blocks
    const codeBlockCount = (content.match(/```/g) || []).length / 2;

    // Calculate reading time (225 words per minute average)
    const estimatedReadingTime = Math.ceil(words.length / 225);

    res.json({
      reportId: id,
      title: report.title,
      statistics: {
        wordCount: words.length,
        charCount: content.length,
        lineCount: lines.length,
        paragraphCount: content.split(/\n\s*\n/).length,
        headings: {
          h1: h1Count,
          h2: h2Count,
          h3: h3Count,
          total: h1Count + h2Count + h3Count,
        },
        links: linkCount,
        codeBlocks: codeBlockCount,
        sourcesReferenced: report.researchSession.sources.length,
        estimatedReadingTime,
        createdAt: report.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reports/:id - Delete a report
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    // Delete report
    await prisma.report.delete({
      where: { id },
    });

    console.log(`[API] Deleted report: ${id} ("${report.title}")`);

    res.json({
      success: true,
      reportId: id,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
