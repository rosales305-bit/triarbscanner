import { Header } from "./components/Header";
import { StatsCards } from "./components/StatsCards";
import { ScannerControls } from "./components/ScannerControls";
import { OpportunitiesTable } from "./components/OpportunitiesTable";
import { ScanHistory } from "./components/ScanHistory";
import { ProfitDistribution } from "./components/ProfitDistribution";
import { useArbitrageScanner } from "./hooks/useArbitrageScanner";
import { AlertTriangle } from "lucide-react";

function App() {
  const {
    opportunities,
    exchanges,
    scanLogs,
    selectedExchange,
    setSelectedExchange,
    minProfit,
    setMinProfit,
    isScanning,
    lastScanTime,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    triggerScan,
    scanDuration,
    pairsScanned,
    scanError,
  } = useArbitrageScanner();

  const bestProfit = opportunities.length > 0 ? opportunities[0].profit_pct : 0;
  const avgProfit =
    opportunities.length > 0
      ? opportunities.reduce((sum, o) => sum + o.profit_pct, 0) / opportunities.length
      : 0;

  const filteredOpportunities = opportunities.filter((o) => o.profit_pct >= minProfit);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-slate-950 to-slate-950" />
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNDksMTU3LDE3MCwwLjA0KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

      <div className="relative z-10">
        <Header isScanning={isScanning} lastScanTime={lastScanTime} autoRefresh={autoRefresh} />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {/* Error banner */}
            {scanError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {scanError}
              </div>
            )}

            {/* Stats */}
            <StatsCards
              totalOpportunities={filteredOpportunities.length}
              bestProfit={bestProfit}
              pairsScanned={pairsScanned}
              scanDuration={scanDuration}
              avgProfit={avgProfit}
            />

            {/* Controls */}
            <ScannerControls
              selectedExchange={selectedExchange}
              setSelectedExchange={setSelectedExchange}
              minProfit={minProfit}
              setMinProfit={setMinProfit}
              isScanning={isScanning}
              autoRefresh={autoRefresh}
              setAutoRefresh={setAutoRefresh}
              refreshInterval={refreshInterval}
              setRefreshInterval={setRefreshInterval}
              onScan={triggerScan}
            />

            {/* Main content grid */}
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <OpportunitiesTable opportunities={filteredOpportunities} />
              </div>
              <div className="space-y-4">
                <ProfitDistribution opportunities={filteredOpportunities} />
                <ScanHistory scanLogs={scanLogs} exchanges={exchanges} />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/40 py-4 text-center text-xs text-slate-600">
          TriArbScanner -- Triangular arbitrage opportunities are time-sensitive and may expire before execution. Not financial advice.
        </footer>
      </div>
    </div>
  );
}

export default App;
