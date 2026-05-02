import type { ProbeLocation, PingResult } from '@pingtest/shared';
import { BaseProbe } from './base-probe.js';
import { executePing } from '../services/ping-executor.js';

export class LocalProbe extends BaseProbe {
  definition: ProbeLocation;

  constructor(def: ProbeLocation) {
    super();
    this.definition = def;
  }

  async ping(target: string, count: number, timeout: number): Promise<PingResult> {
    const start = Date.now();
    const result = await executePing(target, count, timeout);

    const now = new Date().toISOString();

    if (result.error || !result.parsed) {
      return {
        probeId: this.definition.id,
        probeName: this.definition.name,
        country: this.definition.country,
        region: this.definition.region,
        lat: this.definition.lat,
        lng: this.definition.lng,
        avgLatency: null,
        minLatency: null,
        maxLatency: null,
        stdDev: null,
        packetLoss: 100,
        packetsSent: count,
        packetsReceived: 0,
        error: result.error || 'Parse failed',
        timestamp: now,
      };
    }

    const p = result.parsed;
    return {
      probeId: this.definition.id,
      probeName: this.definition.name,
      country: this.definition.country,
      region: this.definition.region,
      lat: this.definition.lat,
      lng: this.definition.lng,
      avgLatency: p.stats.avgLatency,
      minLatency: p.stats.minLatency,
      maxLatency: p.stats.maxLatency,
      stdDev: p.stats.stdDev,
      packetLoss: p.packetLoss,
      packetsSent: p.packetsSent,
      packetsReceived: p.packetsReceived,
      error: null,
      timestamp: now,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await executePing('127.0.0.1', 1, 1000);
      return result.parsed !== null && result.parsed.packetsReceived > 0;
    } catch {
      return false;
    }
  }
}
