import type { PingResult } from '@pingtest/shared';

const API_BASE = 'https://api.globalping.io/v1';

// Locations to ping from for world map coverage
const WORLD_LOCATIONS = [
  { country: 'US', limit: 2 },
  { country: 'DE', limit: 1 },
  { country: 'JP', limit: 1 },
  { country: 'SG', limit: 1 },
  { country: 'GB', limit: 1 },
  { country: 'BR', limit: 1 },
  { country: 'AU', limit: 1 },
  { country: 'IN', limit: 1 },
  { country: 'AE', limit: 1 },
  { country: 'KR', limit: 1 },
  { country: 'NL', limit: 1 },
  { country: 'CA', limit: 1 },
  { country: 'ZA', limit: 1 },
];

// China-specific locations
const CHINA_LOCATIONS = [
  { country: 'CN', limit: 8 },
];

interface GlobalpingProbeResult {
  probe: {
    country: string;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    continent: string;
    state: string | null;
    asn: number;
    network: string;
  };
  result: {
    status: string;
    rawOutput: string;
    stats?: {
      min: number;
      max: number;
      avg: number;
      loss: number;
    };
  };
}

/**
 * Create a ping measurement on Globalping.
 * Returns the measurement ID for polling.
 */
async function createMeasurement(
  target: string,
  locations: Array<{ country?: string; limit?: number }>,
  packets: number = 4,
): Promise<string> {
  const response = await fetch(`${API_BASE}/measurements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'ping',
      target,
      locations,
      measurementOptions: { packets },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Globalping API error ${response.status}: ${text}`);
  }

  const data = await response.json() as { id: string; probesCount: number };
  console.log(`Globalping measurement created: ${data.id} (${data.probesCount} probes)`);
  return data.id;
}

/**
 * Poll for measurement results.
 * Globalping typically completes in 5–20 seconds.
 */
async function pollMeasurement(id: string, maxWaitMs: number = 25000): Promise<GlobalpingProbeResult[]> {
  const start = Date.now();
  const pollInterval = 1500;

  while (Date.now() - start < maxWaitMs) {
    const response = await fetch(`${API_BASE}/measurements/${id}`);

    if (!response.ok) {
      throw new Error(`Globalping poll error ${response.status}`);
    }

    const data = await response.json() as {
      id: string;
      status: string;
      results: GlobalpingProbeResult[];
    };

    if (data.status === 'finished') {
      return data.results;
    }

    // Wait before polling again
    await new Promise((r) => setTimeout(r, pollInterval));
  }

  throw new Error('Globalping measurement timed out');
}

/**
 * Parse Globalping raw ping output into structured latency stats.
 * Globalping runs Linux ping, so output is in Linux format.
 */
function parseGlobalpingOutput(rawOutput: string): {
  minLatency: number | null;
  maxLatency: number | null;
  avgLatency: number | null;
  packetLoss: number;
  packetsSent: number;
  packetsReceived: number;
} {
  // Try to extract from summary line: "rtt min/avg/max/mdev = 1.234/2.345/3.456/0.567 ms"
  const rttRe = /rtt\s+min\/avg\/max\/mdev\s*=\s*([0-9.]+)\/([0-9.]+)\/([0-9.]+)\/([0-9.]+)\s*ms/;
  const rttMatch = rttRe.exec(rawOutput);

  // Packet stats: "4 packets transmitted, 4 received, 0% packet loss"
  const pktRe = /(\d+)\s+packets?\s+transmitted,\s+(\d+)\s+received,\s+(\d+)%\s+packet\s+loss/;
  const pktMatch = pktRe.exec(rawOutput);

  const packetsSent = pktMatch ? parseInt(pktMatch[1], 10) : 0;
  const packetsReceived = pktMatch ? parseInt(pktMatch[2], 10) : 0;
  const packetLoss = pktMatch ? parseInt(pktMatch[3], 10) : 100;

  if (rttMatch) {
    return {
      minLatency: parseFloat(rttMatch[1]),
      avgLatency: parseFloat(rttMatch[2]),
      maxLatency: parseFloat(rttMatch[3]),
      packetLoss,
      packetsSent,
      packetsReceived,
    };
  }

  return {
    minLatency: null,
    maxLatency: null,
    avgLatency: null,
    packetLoss: 100,
    packetsSent,
    packetsReceived,
  };
}

/**
 * Run a distributed ping test using Globalping API.
 * Returns PingResult[] that can be used directly by the frontend.
 */
export async function runGlobalpingPing(target: string, packets: number = 4): Promise<PingResult[]> {
  // Combine world + china locations
  const allLocations = [...WORLD_LOCATIONS, ...CHINA_LOCATIONS];

  const measurementId = await createMeasurement(target, allLocations, packets);
  const results = await pollMeasurement(measurementId);

  const pingResults: PingResult[] = [];
  const seenCountries = new Map<string, number>(); // country -> count for dedup naming

  for (const r of results) {
    const parsed = parseGlobalpingOutput(r.result.rawOutput);
    const country = r.probe.country || 'XX';
    const city = r.probe.city || r.probe.state || country;
    const lat = r.probe.latitude || 0;
    const lng = r.probe.longitude || 0;

    // Deduplicate probe names within same country
    const countryCount = seenCountries.get(country) || 0;
    seenCountries.set(country, countryCount + 1);
    const probeName = countryCount > 0
      ? `${city} #${countryCount + 1}`
      : city;

    pingResults.push({
      probeId: `gp-${r.probe.asn}-${city}`,
      probeName,
      country,
      region: r.probe.state || r.probe.city || null,
      lat,
      lng,
      avgLatency: parsed.avgLatency,
      minLatency: parsed.minLatency,
      maxLatency: parsed.maxLatency,
      stdDev: null,
      packetLoss: parsed.packetLoss,
      packetsSent: parsed.packetsSent,
      packetsReceived: parsed.packetsReceived,
      error: parsed.avgLatency === null ? 'All packets lost' : null,
      timestamp: new Date().toISOString(),
    });
  }

  return pingResults;
}
