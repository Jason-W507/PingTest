// ============================================================
// Shared type definitions for PingTest
// Used by both server and client
// ============================================================

/** Probe location definition */
export interface ProbeLocation {
  id: string;
  name: string;
  country: string;
  region: string | null;
  lat: number;
  lng: number;
  provider: string;
}

/** Latency statistics from a ping test */
export interface LatencyStats {
  avgLatency: number | null;
  minLatency: number | null;
  maxLatency: number | null;
  stdDev: number | null;
}

/** A single probe's ping test result */
export interface PingResult extends LatencyStats {
  probeId: string;
  probeName: string;
  country: string;
  region: string | null;
  lat: number;
  lng: number;
  packetLoss: number;
  packetsSent: number;
  packetsReceived: number;
  /** Non-null when probe failed entirely (DNS, network error) */
  error: string | null;
  timestamp: string;
}

/** Request to run a ping test */
export interface PingTestRequest {
  target: string;
  count?: number;
  timeout?: number;
}

/** Response from a ping test */
export interface PingTestResponse {
  target: string;
  resolvedIp: string;
  timestamp: string;
  results: PingResult[];
  totalProbes: number;
  successfulProbes: number;
}

/** Probe status info */
export interface ProbeStatus {
  probe: ProbeLocation;
  status: 'online' | 'offline' | 'unknown';
  lastSeen: string | null;
}

/** GET /api/probes response */
export interface ProbeListResponse {
  probes: ProbeStatus[];
}

/** GET /api/config response */
export interface ServerConfig {
  serverName: string;
  serverLocation: {
    lat: number;
    lng: number;
    country: string;
    region: string | null;
  };
  maxPingCount: number;
  probeCount: number;
}

/** API error response */
export interface ApiError {
  error: string;
  code?: string;
}

/** Data point for China map display */
export interface ChinaMapDataPoint {
  provinceName: string;
  avgLatency: number;
  probeCount: number;
  minLatency: number;
}

/** Latency color category */
export type LatencyCategory = 'excellent' | 'good' | 'moderate' | 'poor' | 'fail';

/** Thresholds for coloring latency indicators */
export const LATENCY_THRESHOLDS = {
  excellent: 50,   // < 50ms = green
  good: 150,       // < 150ms = light green
  moderate: 300,   // < 300ms = yellow/orange
  poor: 500,       // < 500ms = orange/red
} as const;

export function getLatencyCategory(ms: number | null): LatencyCategory {
  if (ms === null) return 'fail';
  if (ms < LATENCY_THRESHOLDS.excellent) return 'excellent';
  if (ms < LATENCY_THRESHOLDS.good) return 'good';
  if (ms < LATENCY_THRESHOLDS.moderate) return 'moderate';
  if (ms < LATENCY_THRESHOLDS.poor) return 'poor';
  return 'fail';
}

export function getLatencyColor(ms: number | null): string {
  const cat = getLatencyCategory(ms);
  switch (cat) {
    case 'excellent': return '#22c55e';
    case 'good': return '#84cc16';
    case 'moderate': return '#eab308';
    case 'poor': return '#f97316';
    case 'fail': return '#ef4444';
  }
}
