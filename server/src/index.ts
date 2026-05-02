import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { registry } from './services/probe-registry.js';
import { LocalProbe } from './probes/local-probe.js';
import { RemoteProbe } from './probes/remote-probe.js';
import type { ProbeLocation } from '@pingtest/shared';
import pingRoutes from './routes/ping.js';
import probesRoutes from './routes/probes.js';
import configRoutes from './routes/config.js';

// --- Initialize probes ---

// Register the local probe (this server itself)
const localProbe = new LocalProbe({
  id: 'local-01',
  name: config.serverName,
  country: config.serverCountry,
  region: config.serverRegion,
  lat: config.serverLat,
  lng: config.serverLng,
  provider: config.serverProvider,
});
registry.register(localProbe);

// Register remote probes from config
// Format: "id=name,url,lat,lng,country,region,provider"
for (const entry of config.remoteProbes) {
  const parts = entry.split(';');
  if (parts.length < 2) continue;
  const [id, url, lat, lng, country, region, provider] = parts.map(s => s.trim());
  const def: ProbeLocation = {
    id,
    name: id,
    country: country || 'XX',
    region: region || null,
    lat: parseFloat(lat) || 0,
    lng: parseFloat(lng) || 0,
    provider: provider || 'Unknown',
  };
  registry.register(new RemoteProbe(def, url));
  console.log(`Registered remote probe: ${id} at ${url}`);
}

// --- Express app ---

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

// API routes
app.use('/api', pingRoutes);
app.use('/api', probesRoutes);
app.use('/api', configRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', probeCount: registry.getProbeCount() });
});

// Start
app.listen(config.port, () => {
  console.log(`PingTest server running on http://localhost:${config.port}`);
  console.log(`Local probe: ${config.serverName} (${config.serverLat}, ${config.serverLng})`);
  console.log(`Total probes: ${registry.getProbeCount()}`);
});

export default app;
