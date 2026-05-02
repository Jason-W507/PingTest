import type { PingResult } from '@pingtest/shared';
import { config } from '../config.js';

const API_BASE = 'https://api.boce.com/v3';

// Mapping from short province name → full DataV GeoJSON province name
const SHORT_TO_FULL_PROVINCE: Record<string, string> = {
  '北京': '北京市', '天津': '天津市', '上海': '上海市', '重庆': '重庆市',
  '河北': '河北省', '山西': '山西省', '辽宁': '辽宁省', '吉林': '吉林省',
  '黑龙江': '黑龙江省', '江苏': '江苏省', '浙江': '浙江省', '安徽': '安徽省',
  '福建': '福建省', '江西': '江西省', '山东': '山东省', '河南': '河南省',
  '湖北': '湖北省', '湖南': '湖南省', '广东': '广东省', '广西': '广西壮族自治区',
  '海南': '海南省', '四川': '四川省', '贵州': '贵州省', '云南': '云南省',
  '西藏': '西藏自治区', '陕西': '陕西省', '甘肃': '甘肃省', '青海': '青海省',
  '宁夏': '宁夏回族自治区', '新疆': '新疆维吾尔自治区',
  '内蒙古': '内蒙古自治区', '香港': '香港', '澳门': '澳门', '台湾': '台湾',
};

interface BoceNode {
  id: number;
  node_name: string;
  isp_name: string;
  isp_code: number;
}

interface BoceTaskResult {
  node_id: number;
  node_name: string;
  packet_loss: number;
  packets_received: number;
  packets_transmitted: number;
  round_trip_avg: number;
  round_trip_max: number;
  round_trip_min: number;
  error_code: number;
  error: string;
  ip: string;
  ip_region: string;
}

let cachedNodes: BoceNode[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getKey(): string {
  return config.boceApiKey || process.env.BOCE_API_KEY || '';
}

export function isBoceAvailable(): boolean {
  return !!getKey();
}

/**
 * Fetch available China probe nodes from Boce API.
 * Cached for 30 minutes.
 */
async function getNodeList(): Promise<BoceNode[]> {
  const key = getKey();
  if (!key) throw new Error('BOCE_API_KEY not configured');

  if (cachedNodes && Date.now() - cacheTime < CACHE_TTL) {
    return cachedNodes;
  }

  const url = `${API_BASE}/node/list?key=${encodeURIComponent(key)}`;
  const resp = await fetch(url);
  const data = await resp.json() as { error_code: number; data: { list: BoceNode[] }; error: string };

  if (data.error_code !== 0) {
    throw new Error(`Boce node list error: ${data.error || 'unknown'}`);
  }

  cachedNodes = data.data.list;
  cacheTime = Date.now();
  console.log(`Boce: loaded ${cachedNodes.length} probe nodes`);
  return cachedNodes;
}

/**
 * Extract province name from Boce node_name.
 * Node names are like "河北电信" or "广东移动" or just "河北".
 */
function extractProvince(nodeName: string): string | null {
  // Remove common ISP suffixes
  let cleaned = nodeName
    .replace(/电信|联通|移动|广电|教育网|科技网|铁通|鹏博士|长城|华数|方正|电信通|歌华|有线|宽带|BGP|多线/g, '')
    .trim();

  // Check direct match
  if (SHORT_TO_FULL_PROVINCE[cleaned]) return SHORT_TO_FULL_PROVINCE[cleaned];

  // Check if the node name starts with a known province
  for (const [short, full] of Object.entries(SHORT_TO_FULL_PROVINCE)) {
    if (cleaned.startsWith(short) || cleaned.includes(short)) {
      return full;
    }
  }

  // Check if the node_name (with ISP) contains a known province
  for (const [short, full] of Object.entries(SHORT_TO_FULL_PROVINCE)) {
    if (nodeName.includes(short)) {
      return full;
    }
  }

  return null;
}

/**
 * Select a diverse set of nodes covering all Chinese provinces.
 * Picks 1-2 nodes per province, preferring different ISPs.
 */
function selectNodesForChina(nodes: BoceNode[]): BoceNode[] {
  const provinceNodes = new Map<string, BoceNode[]>();

  for (const node of nodes) {
    const province = extractProvince(node.node_name);
    if (!province) continue;
    const existing = provinceNodes.get(province) || [];
    existing.push(node);
    provinceNodes.set(province, existing);
  }

  // Pick 1 node per province for speed (task completes faster with fewer nodes)
  const selected: BoceNode[] = [];
  for (const [, pNodes] of provinceNodes) {
    // Prefer电信 for consistency, fallback to first available
    const dianxin = pNodes.find(n => n.isp_name === '电信');
    selected.push(dianxin || pNodes[0]);
  }

  return selected;
}

/**
 * Create a Boce ping task.
 */
async function createTask(target: string, nodeIds: number[]): Promise<string> {
  const key = getKey();
  const nodeIdsStr = nodeIds.join(',');
  const url = `${API_BASE}/task/create/ping?key=${encodeURIComponent(key)}&node_ids=${nodeIdsStr}&host=${encodeURIComponent(target)}`;

  const resp = await fetch(url);
  const data = await resp.json() as { error_code: number; data: { id: string }; error: string };

  if (data.error_code !== 0) {
    throw new Error(`Boce create task error: ${data.error || 'unknown'}`);
  }

  return data.data.id;
}

/**
 * Poll for Boce ping results.
 */
async function pollResults(taskId: string, maxWaitMs: number = 60000): Promise<BoceTaskResult[]> {
  const key = getKey();
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const url = `${API_BASE}/task/ping/${taskId}?key=${encodeURIComponent(key)}`;
    const resp = await fetch(url);
    const raw = await resp.text();

    let data: { done?: boolean; list?: BoceTaskResult[]; error_code?: number; error?: string };
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Boce poll: invalid JSON response`);
    }

    // error_code may be absent (undefined) on success — only fail on explicit error
    if (data.error_code !== undefined && data.error_code !== 0) {
      throw new Error(`Boce poll error: ${data.error || `code=${data.error_code}`}`);
    }

    if (data.done && data.list) {
      return data.list;
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  throw new Error('Boce ping test timed out');
}

/** Approximate geo coordinates for Chinese provinces (center point) */
function getProvinceCoords(province: string): { lat: number; lng: number } {
  const coords: Record<string, [number, number]> = {
    '北京市': [39.9, 116.4], '天津市': [39.1, 117.2], '上海市': [31.2, 121.5],
    '重庆市': [29.6, 106.5], '河北省': [38.0, 114.9], '山西省': [37.9, 112.6],
    '辽宁省': [41.8, 123.4], '吉林省': [43.9, 125.3], '黑龙江省': [45.8, 126.5],
    '江苏省': [32.1, 118.8], '浙江省': [30.3, 120.2], '安徽省': [31.9, 117.3],
    '福建省': [26.1, 119.3], '江西省': [28.7, 115.9], '山东省': [36.7, 117.0],
    '河南省': [34.8, 113.7], '湖北省': [30.6, 114.3], '湖南省': [28.2, 113.0],
    '广东省': [23.1, 113.3], '广西壮族自治区': [22.8, 108.3],
    '海南省': [20.0, 110.3], '四川省': [30.6, 104.1], '贵州省': [26.6, 106.7],
    '云南省': [25.0, 102.7], '西藏自治区': [29.6, 91.1], '陕西省': [34.3, 108.9],
    '甘肃省': [36.1, 103.8], '青海省': [36.6, 101.8], '宁夏回族自治区': [38.5, 106.3],
    '新疆维吾尔自治区': [43.8, 87.6], '内蒙古自治区': [40.8, 111.8],
  };
  const c = coords[province];
  return c ? { lat: c[0], lng: c[1] } : { lat: 35, lng: 105 };
}

/**
 * Run China province-level ping test using Boce API.
 * Returns PingResult[] with province-level data for the China map.
 */
export async function runBoceChinaPing(target: string, packets: number = 4): Promise<PingResult[]> {
  const key = getKey();
  if (!key) return [];

  try {
    // Get available nodes
    const allNodes = await getNodeList();
    if (allNodes.length === 0) return [];

    // Select diverse province-coverage nodes
    const selected = selectNodesForChina(allNodes);
    if (selected.length === 0) return [];

    const provinceCount = new Set(selected.map(n => extractProvince(n.node_name))).size;
    console.log(`Boce: ${selected.length} nodes across ${provinceCount} provinces`);

    // Split into batches of 20 nodes for faster completion
    const BATCH_SIZE = 20;
    const batches: BoceNode[][] = [];
    for (let i = 0; i < selected.length; i += BATCH_SIZE) {
      batches.push(selected.slice(i, i + BATCH_SIZE));
    }

    // Run all batches in parallel
    const batchResults = await Promise.all(
      batches.map(async (batch, i) => {
        const taskId = await createTask(target, batch.map((n) => n.id));
        return pollResults(taskId, 120000); // 2min timeout per batch
      }),
    );

    // Flatten results
    const results = batchResults.flat();

    // Aggregate by province (take average of ISP nodes within same province)
    const provinceData = new Map<string, {
      sum: number;
      count: number;
      min: number;
      max: number;
      loss: number;
      nodes: number;
      hasError: boolean;
    }>();

    for (const r of results) {
      const province = extractProvince(r.node_name);
      if (!province) continue;

      const existing = provinceData.get(province);
      if (r.error_code === 0 && r.packets_received > 0) {
        if (!existing) {
          provinceData.set(province, {
            sum: r.round_trip_avg,
            count: 1,
            min: r.round_trip_min,
            max: r.round_trip_max,
            loss: r.packet_loss,
            nodes: 1,
            hasError: false,
          });
        } else {
          existing.sum += r.round_trip_avg;
          existing.count += 1;
          existing.min = Math.min(existing.min, r.round_trip_min);
          existing.max = Math.max(existing.max, r.round_trip_max);
          existing.loss = (existing.loss * (existing.nodes) + r.packet_loss) / (existing.nodes + 1);
          existing.nodes += 1;
        }
      } else if (!existing) {
        provinceData.set(province, { sum: 0, count: 0, min: 0, max: 0, loss: 100, nodes: 1, hasError: true });
      }
    }

    const pingResults: PingResult[] = [];
    for (const [province, data] of provinceData) {
      const avg = data.hasError ? null : Math.round(data.sum / data.count * 100) / 100;
      const coords = getProvinceCoords(province);
      pingResults.push({
        probeId: `boce-${province}`,
        probeName: province,
        country: 'CN',
        region: province,
        lat: coords.lat,
        lng: coords.lng,
        avgLatency: avg,
        minLatency: data.hasError ? null : data.min,
        maxLatency: data.hasError ? null : data.max,
        stdDev: null,
        packetLoss: Math.round(data.loss),
        packetsSent: data.nodes * 4,
        packetsReceived: data.hasError ? 0 : data.nodes * 4,
        error: data.hasError ? 'All nodes failed' : null,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Boce: got results for ${pingResults.length} provinces`);
    return pingResults;
  } catch (err) {
    console.warn('Boce API failed:', (err as Error).message);
    return [];
  }
}
