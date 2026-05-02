import { Router, type Request, type Response } from 'express';
import { registry } from '../services/probe-registry.js';
import { config } from '../config.js';

const router = Router();

router.get('/config', (_req: Request, res: Response) => {
  res.json({
    serverName: config.serverName,
    serverLocation: {
      lat: config.serverLat,
      lng: config.serverLng,
      country: config.serverCountry,
      region: config.serverRegion,
    },
    maxPingCount: config.maxPingCount,
    probeCount: registry.getProbeCount(),
  });
});

export default router;
