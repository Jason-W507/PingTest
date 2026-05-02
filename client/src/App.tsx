import PingTestPage from './pages/PingTestPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xl font-bold text-blue-400">PingTest</span>
          <span className="text-xs text-gray-500 hidden sm:inline">Network Connectivity Tool</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <PingTestPage />
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-gray-500 text-xs">
        PingTest &mdash; Enter an IP or domain to test network latency from multiple locations.
        Powered by local probe + Globalping + Boce distributed network.
      </footer>
    </div>
  );
}
