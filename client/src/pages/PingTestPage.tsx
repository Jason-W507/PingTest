import { usePingTest } from '../hooks/usePingTest';
import TargetInput from '../components/PingTest/TargetInput';
import WorldMap from '../components/PingTest/WorldMap';
import ChinaMap from '../components/PingTest/ChinaMap';
import ResultsList from '../components/PingTest/ResultsList';
import StatisticsSummary from '../components/PingTest/StatisticsSummary';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorDisplay from '../components/shared/ErrorDisplay';
import EmptyState from '../components/shared/EmptyState';

export default function PingTestPage() {
  const { state, startTest } = usePingTest();

  return (
    <div className="space-y-6">
      {/* Input */}
      <TargetInput
        onStart={startTest}
        loading={state.phase === 'loading'}
      />

      {/* Error */}
      {state.phase === 'error' && (
        <ErrorDisplay message={state.message} onRetry={() => startTest('8.8.8.8', 4)} />
      )}

      {/* Loading */}
      {state.phase === 'loading' && <LoadingSpinner text="Pinging from probe locations..." />}

      {/* Results */}
      {state.phase === 'success' && (
        <>
          <StatisticsSummary data={state.data} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* World Map */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">World View</h3>
              <WorldMap results={state.data.results} />
            </div>

            {/* China Map */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">China View</h3>
              <ChinaMap results={state.data.results} />
            </div>
          </div>

          {/* Results List */}
          <ResultsList results={state.data.results} />
        </>
      )}

      {/* Empty */}
      {state.phase === 'idle' && (
        <EmptyState text="Enter an IP address or domain above to test network connectivity" />
      )}
    </div>
  );
}
