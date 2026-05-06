import { Activity, Radio } from "lucide-react";

interface HeaderProps {
  isScanning: boolean;
  lastScanTime: string | null;
  autoRefresh: boolean;
}

export function Header({ isScanning, lastScanTime, autoRefresh }: HeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                TriArb<span className="text-emerald-400">Scanner</span>
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Triangular Arbitrage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {autoRefresh && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                <Radio className="h-3 w-3 animate-pulse" />
                Live
              </div>
            )}
            {isScanning && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Scanning...
              </div>
            )}
            {lastScanTime && !isScanning && (
              <span className="text-xs text-slate-500">
                Last scan: {new Date(lastScanTime).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
