import { Clock, Zap } from "lucide-react";
import type { ScanLog, Exchange } from "../lib/types";

interface ScanHistoryProps {
  scanLogs: ScanLog[];
  exchanges: Exchange[];
}

export function ScanHistory({ scanLogs, exchanges }: ScanHistoryProps) {
  const exchangeMap = new Map(exchanges.map((e) => [e.id, e.name]));

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-300">Scan History</h3>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {scanLogs.length === 0 ? (
          <p className="text-xs text-slate-600 py-4 text-center">No scans yet</p>
        ) : (
          scanLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg bg-slate-800/30 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-amber-400" />
                <span className="font-medium text-slate-300">
                  {exchangeMap.get(log.exchange_id) || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <span>{log.pairs_scanned} pairs</span>
                <span className="text-emerald-400">{log.opportunities_found} found</span>
                <span>{log.scan_duration_ms}ms</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
