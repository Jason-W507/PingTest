import { Router, type Request, type Response } from 'express';
import { isValidTarget } from '@pingtest/shared';
import { registry } from '../services/probe-registry.js';
import { resolveTarget } from '../services/resolver.js';
import { runGlobalpingPing } from '../services/globalping.js';
import { runBoceChinaPing, isBoceAvailable } from '../services/boce.js';
import { config } from '../config.js';

const router = Router();

router.post('/ping', async (req: Request, res: Response) => {
  const { target, count, timeout, noGlobalping, noBoce } = req.body || {};

  if (!target || !isValidTarget(String(target))) {
    res.status(400).json({ error: 'Invalid target address' });
    return;
  }

  const pingCount = Math.min(
    Math.max(1, parseInt(String(count), 10) || config.defaultPingCount),
    config.maxPingCount,
  );
  const pingTimeout = Math.min(
    Math.max(500, parseInt(String(timeout), 10) || config.defaultPingTimeout),
    10000,
  );

  // Resolve hostname → IP
  let resolvedIp: string;
  try {
    const resolved = await resolveTarget(String(target).trim());
    resolvedIp = resolved.resolvedIp;
  } catch (err) {
    res.status(400).json({ error: `DNS resolution failed: ${(err as Error).message}` });
    return;
  }

  // Run local probes + Globalping + Boce in parallel
  const [localResults, globalpingResults, boceResults] = await Promise.all([
    registry.runPingTest(resolvedIp, pingCount, pingTimeout),
    noGlobalping
      ? Promise.resolve([])
      : runGlobalpingPing(resolvedIp, pingCount).catch((err) => {
          console.warn('Globalping API failed:', err.message);
          return [];
        }),
    noBoce || !isBoceAvailable()
      ? Promise.resolve([])
      : runBoceChinaPing(resolvedIp, pingCount).catch((err) => {
          console.warn('Boce API failed:', err.message);
          return [];
        }),
  ]);

  // Merge: local results first, then Globalping world data, then Boce China province data
  const merged = [...localResults];
  const seenCountries = new Set(localResults.map((r) => r.country));

  // Add Globalping results for countries not already covered
  for (const gr of globalpingResults) {
    if (!seenCountries.has(gr.country)) {
      merged.push(gr);
      seenCountries.add(gr.country);
    }
  }

  // Add Boce province-level China results
  // Boce results give province granularity, which is better than a single CN entry
  for (const br of boceResults) {
    merged.push(br);
  }

  // Sort by latency (fastest first, failures at end)
  merged.sort((a, b) => {
    if (a.avgLatency === null && b.avgLatency === null) return 0;
    if (a.avgLatency === null) return 1;
    if (b.avgLatency === null) return -1;
    return a.avgLatency - b.avgLatency;
  });

  const successfulProbes = merged.filter((r) => r.error === null).length;

  res.json({
    target: String(target).trim(),
    resolvedIp,
    timestamp: new Date().toISOString(),
    results: merged,
    totalProbes: merged.length,
    successfulProbes,
  });
});

export default router;
