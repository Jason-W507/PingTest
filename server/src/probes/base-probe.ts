import type { ProbeLocation, PingResult } from '@pingtest/shared';

export abstract class BaseProbe {
  abstract readonly definition: ProbeLocation;
  abstract ping(target: string, count: number, timeout: number): Promise<PingResult>;
  abstract healthCheck(): Promise<boolean>;
}
