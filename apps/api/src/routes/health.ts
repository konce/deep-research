import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      api: 'healthy',
      // Add database check if needed
    },
  };

  res.json(health);
});

export default router;
