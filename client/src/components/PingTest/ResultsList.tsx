import type { PingResult } from '@pingtest/shared';
import { getLatencyCategory, getLatencyColor } from '@pingtest/shared';

interface Props {
  results: PingResult[];
}

function LatencyBar({ ms, max }: { ms: number | null; max: number }) {
  if (ms === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-700 rounded-full" />
        <span className="text-xs text-red-400 w-16 text-right">Timeout</span>
      </div>
    );
  }

  const pct = max > 0 ? Math.min((ms / max) * 100, 100) : 0;
  const color = getLatencyColor(ms);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="latency-bar"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-gray-300 w-16 text-right font-mono">{ms} ms</span>
    </div>
  );
}

export default function ResultsList({ results }: Props) {
  if (results.length === 0) return null;

  const maxLatency = Math.max(
    ...results.map((r) => r.avgLatency ?? 0),
    50 // minimum scale
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Results</h3>
      <div className="space-y-1.5">
        {results.map((r) => (
          <div
            key={r.probeId}
            className="flex items-center gap-4 px-4 py-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
          >
            {/* Location info */}
            <div className="w-40 shrink-0">
              <div className="text-sm font-medium text-white truncate">{r.probeName}</div>
              <div className="text-xs text-gray-500">
                {r.region ? `${r.region}, ` : ''}{r.country}
              </div>
            </div>

            {/* Latency bar */}
            <div className="flex-1 min-w-0">
              <LatencyBar ms={r.avgLatency} max={maxLatency} />
            </div>

            {/* Min/Max detail */}
            <div className="hidden sm:flex gap-3 text-xs text-gray-500 font-mono w-40 shrink-0 justify-end">
              {r.minLatency !== null && (
                <span title="Min">↓{r.minLatency}</span>
              )}
              {r.maxLatency !== null && (
                <span title="Max">↑{r.maxLatency}</span>
              )}
            </div>

            {/* Packet loss */}
            <div className="w-14 text-right shrink-0">
              {r.packetLoss > 0 ? (
                <span className="text-xs text-red-400 font-mono">{r.packetLoss}% loss</span>
              ) : (
                <span className="text-xs text-green-400 font-mono">0%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
