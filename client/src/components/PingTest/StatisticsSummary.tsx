import type { PingTestResponse } from '@pingtest/shared';

interface Props {
  data: PingTestResponse;
}

export default function StatisticsSummary({ data }: Props) {
  const successful = data.results.filter((r) => r.avgLatency !== null);
  const allLatencies = successful
    .map((r) => r.avgLatency!)
    .filter((l) => l !== null);

  const globalMin = allLatencies.length > 0 ? Math.min(...allLatencies) : null;
  const globalMax = allLatencies.length > 0 ? Math.max(...allLatencies) : null;
  const globalAvg =
    allLatencies.length > 0
      ? Math.round((allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length) * 100) / 100
      : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="stat-card">
        <div className="text-xs text-gray-400 mb-1">Target</div>
        <div className="text-sm font-mono text-white truncate" title={data.target}>
          {data.target}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 font-mono">{data.resolvedIp}</div>
      </div>
      <div className="stat-card">
        <div className="text-xs text-gray-400 mb-1">Probes Responded</div>
        <div className="text-lg font-semibold">
          <span className="text-green-400">{data.successfulProbes}</span>
          <span className="text-gray-600"> / {data.totalProbes}</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="text-xs text-gray-400 mb-1">Min / Avg / Max</div>
        <div className="text-sm font-mono">
          {globalMin !== null ? (
            <>
              <span className="text-green-400">{globalMin}</span>
              <span className="text-gray-600"> / </span>
              <span className="text-yellow-400">{globalAvg}</span>
              <span className="text-gray-600"> / </span>
              <span className="text-red-400">{globalMax}</span>
              <span className="text-gray-500"> ms</span>
            </>
          ) : (
            <span className="text-red-400">All failed</span>
          )}
        </div>
      </div>
      <div className="stat-card">
        <div className="text-xs text-gray-400 mb-1">Timestamp</div>
        <div className="text-sm font-mono text-gray-300">
          {new Date(data.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
