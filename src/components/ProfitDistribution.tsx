import { BarChart3 } from "lucide-react";
import type { ArbitrageOpportunity } from "../lib/types";

interface ProfitDistributionProps {
  opportunities: ArbitrageOpportunity[];
}

export function ProfitDistribution({ opportunities }: ProfitDistributionProps) {
  if (opportunities.length === 0) return null;

  const buckets = [
    { label: "<0.1%", min: 0, max: 0.1, count: 0, color: "bg-slate-600" },
    { label: "0.1-0.25%", min: 0.1, max: 0.25, count: 0, color: "bg-amber-500" },
    { label: "0.25-0.5%", min: 0.25, max: 0.5, count: 0, color: "bg-cyan-500" },
    { label: "0.5-1%", min: 0.5, max: 1, count: 0, color: "bg-emerald-500" },
    { label: ">1%", min: 1, max: Infinity, count: 0, color: "bg-emerald-400" },
  ];

  for (const opp of opportunities) {
    for (const b of buckets) {
      if (opp.profit_pct >= b.min && opp.profit_pct < b.max) {
        b.count++;
        break;
      }
    }
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-300">Profit Distribution</h3>
      </div>
      <div className="space-y-2">
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="w-16 text-[11px] text-slate-500 text-right">{b.label}</span>
            <div className="flex-1 h-4 rounded-full bg-slate-800/40 overflow-hidden">
              <div
                className={`h-full rounded-full ${b.color} transition-all duration-500`}
                style={{ width: `${(b.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-6 text-[11px] text-slate-400 text-right">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
