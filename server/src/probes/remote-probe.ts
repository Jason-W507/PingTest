import type { ProbeLocation, PingResult } from '@pingtest/shared';
import { BaseProbe } from './base-probe.js';

/**
 * Remote probe that delegates ping execution to an external probe-agent via HTTP.
 * Used when deploying probe agents to distributed VPS locations.
 */
export class RemoteProbe extends BaseProbe {
  definition: ProbeLocation;
  private agentUrl: string;

  constructor(def: ProbeLocation, agentUrl: string) {
    super();
    this.definition = def;
    this.agentUrl = agentUrl.replace(/\/$/, '');
  }

  async ping(target: string, count: number, timeout: number): Promise<PingResult> {
    const response = await fetch(`${this.agentUrl}/api/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, count, timeout }),
      signal: AbortSignal.timeout(timeout * count + 5000),
    });

    if (!response.ok) {
      throw new Error(`Remote probe returned ${response.status}`);
    }

    const data = await response.json();
    // The remote agent returns PingTestResponse; extract the first (only) result
    if (data.results && data.results.length > 0) {
      return data.results[0] as PingResult;
    }
    throw new Error('Remote probe returned no results');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.agentUrl}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
