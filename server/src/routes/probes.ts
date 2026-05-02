import { Router, type Request, type Response } from 'express';
import { registry } from '../services/probe-registry.js';

const router = Router();

router.get('/probes', (_req: Request, res: Response) => {
  const definitions = registry.getAllDefinitions();
  const probes = definitions.map(p => ({
    probe: p,
    status: 'unknown' as const,
    lastSeen: null,
  }));
  res.json({ probes });
});

export default router;
