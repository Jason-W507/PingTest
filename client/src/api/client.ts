import axios from 'axios';
import type { PingTestRequest, PingTestResponse, ProbeListResponse, ServerConfig } from '@pingtest/shared';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export async function runPingTest(req: PingTestRequest): Promise<PingTestResponse> {
  const { data } = await api.post<PingTestResponse>('/ping', req);
  return data;
}

export async function getProbes(): Promise<ProbeListResponse> {
  const { data } = await api.get<ProbeListResponse>('/probes');
  return data;
}

export async function getServerConfig(): Promise<ServerConfig> {
  const { data } = await api.get<ServerConfig>('/config');
  return data;
}
