import type { LatencyStats } from '@pingtest/shared';
import { stdDev } from '@pingtest/shared';

export interface ParsedPing {
  stats: LatencyStats;
  packetsSent: number;
  packetsReceived: number;
  packetLoss: number;
  rttValues: number[];
}

/**
 * Parse ping command output across platforms and locales.
 * Handles: Linux, English Windows, Chinese Windows (UTF-8 decoded).
 * Returns null if output is completely unparseable.
 */
export function parsePingOutput(raw: string): ParsedPing | null {
  const rttValues: number[] = [];

  // --- Step 1: Extract individual RTT values from reply lines ---

  // Matches "time=42ms", "time=42.3 ms", "时间=212ms", "時間=..."
  const replyRe = /(?:time|时间|시간)[=<]\s*([0-9.]+)\s*ms/gi;
  let match;
  while ((match = replyRe.exec(raw)) !== null) {
    rttValues.push(parseFloat(match[1]));
  }

  // --- Step 2: Parse summary statistics ---

  let packetsSent = 0;
  let packetsReceived = 0;
  let packetLoss = 100;
  let avgLatency: number | null = null;
  let minLatency: number | null = null;
  let maxLatency: number | null = null;

  // Linux: "4 packets transmitted, 4 received, 0% packet loss"
  // Linux: "rtt min/avg/max/mdev = 41.2/42.5/44.1/1.2 ms"
  const linuxSentRecv = /(\d+)\s+packets?\s+transmitted,\s+(\d+)\s+received/;
  const linuxLoss = /(\d+)%\s+packet\s+loss/;
  const linuxRtt = /rtt\s+min\/avg\/max\/mdev\s*=\s*([0-9.]+)\/([0-9.]+)\/([0-9.]+)\/([0-9.]+)\s*ms/;

  const lsr = linuxSentRecv.exec(raw);
  if (lsr) {
    packetsSent = parseInt(lsr[1], 10);
    packetsReceived = parseInt(lsr[2], 10);
    const ll = linuxLoss.exec(raw);
    packetLoss = ll ? parseInt(ll[1], 10) : calcLoss(packetsSent, packetsReceived);

    const lr = linuxRtt.exec(raw);
    if (lr) {
      minLatency = parseFloat(lr[1]);
      avgLatency = parseFloat(lr[2]);
      maxLatency = parseFloat(lr[3]);
    }
    return buildResult(rttValues, packetsSent, packetsReceived, packetLoss, avgLatency, minLatency, maxLatency);
  }

  // Windows (EN + ZH UTF-8): match summary lines
  // EN: "Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),"
  // ZH: "数据包: 已发送 = 4，已接收 = 4，丢失 = 0 (0% 丢失)，"
  //     "数据包: 已发送 = 2，已接收 = 2，丢失 = 0 (0% 丢失)，"

  // Match sent/received/lost using combined pattern
  const winSentRe = /(?:Sent|已发送|已发送)\s*[=＝:：]\s*(\d+)/i;
  const winRecvRe = /(?:Received|已接收|已接收)\s*[=＝:：]\s*(\d+)/i;
  const winLostRe = /(?:Lost|丢失|丢失)\s*[=＝:：]\s*(\d+)/i;

  // Min/Max/Avg
  // EN: "Minimum = 41ms, Maximum = 43ms, Average = 42ms"
  // ZH: "最短 = 212ms，最长 = 327ms，平均 = 269ms"
  const winMinRe = /(?:Minimum|最短|最短)\s*[=＝:：]\s*([0-9.]+)\s*ms/i;
  const winMaxRe = /(?:Maximum|最长|最长)\s*[=＝:：]\s*([0-9.]+)\s*ms/i;
  const winAvgRe = /(?:Average|平均|平均)\s*[=＝:：]\s*([0-9.]+)\s*ms/i;

  const ws = winSentRe.exec(raw);
  if (ws) {
    packetsSent = parseInt(ws[1], 10);
    packetsReceived = winRecvRe.exec(raw) ? parseInt(winRecvRe.exec(raw)![1], 10) : 0;
    packetLoss = winLostRe.exec(raw) ? parseInt(winLostRe.exec(raw)![1], 10) : calcLoss(packetsSent, packetsReceived);

    // Re-execute recv/lost to avoid consuming the match
    const wr = winRecvRe.exec(raw);
    const wl = winLostRe.exec(raw);
    if (wr) packetsReceived = parseInt(wr[1], 10);
    if (wl) packetLoss = parseInt(wl[1], 10);

    const wMin = winMinRe.exec(raw);
    const wMax = winMaxRe.exec(raw);
    const wAvg = winAvgRe.exec(raw);
    if (wMin) minLatency = parseFloat(wMin[1]);
    if (wMax) maxLatency = parseFloat(wMax[1]);
    if (wAvg) avgLatency = parseFloat(wAvg[1]);

    return buildResult(rttValues, packetsSent, packetsReceived, packetLoss, avgLatency, minLatency, maxLatency);
  }

  // --- Step 3: Fallback — if we have RTT values, calculate stats from them ---
  if (rttValues.length > 0) {
    packetsSent = rttValues.length;
    packetsReceived = rttValues.length;
    packetLoss = 0;
    const sum = rttValues.reduce((a, b) => a + b, 0);
    avgLatency = Math.round(sum / rttValues.length * 100) / 100;
    minLatency = Math.min(...rttValues);
    maxLatency = Math.max(...rttValues);
    return buildResult(rttValues, packetsSent, packetsReceived, packetLoss, avgLatency, minLatency, maxLatency);
  }

  // --- Step 4: Check for "Request timed out" / "请求超时" (all packets lost) ---
  if (/timed\s*out|超时|time\s*out/i.test(raw)) {
    return {
      stats: { avgLatency: null, minLatency: null, maxLatency: null, stdDev: null },
      packetsSent: 0,
      packetsReceived: 0,
      packetLoss: 100,
      rttValues: [],
    };
  }

  return null;
}

function calcLoss(sent: number, received: number): number {
  if (sent === 0) return 100;
  return Math.round(((sent - received) / sent) * 100);
}

function buildResult(
  rttValues: number[],
  packetsSent: number,
  packetsReceived: number,
  packetLoss: number,
  avgLatency: number | null,
  minLatency: number | null,
  maxLatency: number | null,
): ParsedPing {
  const mean = avgLatency ?? (rttValues.length > 0 ? rttValues.reduce((a, b) => a + b, 0) / rttValues.length : 0);
  return {
    stats: {
      avgLatency,
      minLatency,
      maxLatency,
      stdDev: rttValues.length > 1 ? Math.round(stdDev(rttValues, mean) * 100) / 100 : null,
    },
    packetsSent,
    packetsReceived,
    packetLoss,
    rttValues,
  };
}
