import { Play, Pause, RefreshCw, Settings } from "lucide-react";
import { useState } from "react";

interface ScannerControlsProps {
  selectedExchange: string;
  setSelectedExchange: (e: string) => void;
  minProfit: number;
  setMinProfit: (v: number) => void;
  isScanning: boolean;
  autoRefresh: boolean;
  setAutoRefresh: (v: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (v: number) => void;
  onScan: () => void;
}

const EXCHANGES = [
  { id: "cryptocom", name: "Crypto.com", fee: "0.40%" },
  { id: "kraken", name: "Kraken", fee: "0.26%" },
  { id: "gemini", name: "Gemini", fee: "0.40%" },
  { id: "coinbase", name: "Coinbase", fee: "0.60%" },
];

export function ScannerControls({
  selectedExchange,
  setSelectedExchange,
  minProfit,
  setMinProfit,
  isScanning,
  autoRefresh,
  setAutoRefresh,
  refreshInterval,
  setRefreshInterval,
  onScan,
}: ScannerControlsProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Exchange Selector */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/50 p-1">
            {EXCHANGES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedExchange(ex.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  selectedExchange === ex.id
                    ? "bg-emerald-500/20 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {ex.name}
                <span className="ml-1.5 text-[10px] opacity-60">{ex.fee}</span>
              </button>
            ))}
          </div>

          {/* Min Profit Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Min Profit</label>
            <div className="flex items-center gap-1 rounded-lg bg-slate-800/50 px-2 py-1">
              {[0, 0.1, 0.25, 0.5, 1].map((v) => (
                <button
                  key={v}
                  onClick={() => setMinProfit(v)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-all ${
                    minProfit === v
                      ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              autoRefresh
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                : "bg-slate-800/50 text-slate-400 hover:text-slate-300"
            }`}
          >
            {autoRefresh ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {autoRefresh ? "Pause" : "Auto"}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              showSettings
                ? "bg-slate-700/50 text-slate-300"
                : "bg-slate-800/50 text-slate-400 hover:text-slate-300"
            }`}
          >
            <Settings className="h-3 w-3" />
          </button>

          {/* Scan Button */}
          <button
            onClick={onScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-emerald-500/30 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isScanning ? "animate-spin" : ""}`} />
            Scan Now
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-3 flex items-center gap-4 border-t border-slate-800/40 pt-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Refresh Interval</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="rounded-md border border-slate-700/50 bg-slate-800/50 px-2 py-1 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-emerald-500/50"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={120}>2min</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
