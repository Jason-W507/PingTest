import type { ProbeLocation, PingResult } from '@pingtest/shared';
import type { BaseProbe } from '../probes/base-probe.js';

export class ProbeRegistry {
  private probes: Map<string, BaseProbe> = new Map();

  register(probe: BaseProbe): void {
    this.probes.set(probe.definition.id, probe);
  }

  getAllDefinitions(): ProbeLocation[] {
    return Array.from(this.probes.values()).map(p => ({ ...p.definition }));
  }

  getChinaProbes(): BaseProbe[] {
    return Array.from(this.probes.values()).filter(p => p.definition.country === 'CN');
  }

  getGlobalProbes(): BaseProbe[] {
    return Array.from(this.probes.values());
  }

  getProbeCount(): number {
    return this.probes.size;
  }

  async runPingTest(target: string, count: number, timeout: number): Promise<PingResult[]> {
    const allProbes = Array.from(this.probes.values());
    const settled = await Promise.allSettled(
      allProbes.map(p => p.ping(target, count, timeout))
    );

    return settled.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        probeId: allProbes[i].definition.id,
        probeName: allProbes[i].definition.name,
        country: allProbes[i].definition.country,
        region: allProbes[i].definition.region,
        lat: allProbes[i].definition.lat,
        lng: allProbes[i].definition.lng,
        avgLatency: null,
        minLatency: null,
        maxLatency: null,
        stdDev: null,
        packetLoss: 100,
        packetsSent: count,
        packetsReceived: 0,
        error: String(r.reason),
        timestamp: new Date().toISOString(),
      } satisfies PingResult;
    });
  }
}

/** Singleton registry instance */
export const registry = new ProbeRegistry();
