import { ArrowRight, TrendingUp } from "lucide-react";
import { useState } from "react";
import type { ArbitrageOpportunity } from "../lib/types";

interface OpportunitiesTableProps {
  opportunities: ArbitrageOpportunity[];
}

type SortKey = "profit_pct" | "volume_usd" | "detected_at";
type SortDir = "asc" | "desc";

function formatNumber(n: number, decimals = 6): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(decimals);
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n > 0) return `$${n.toFixed(0)}`;
  return "--";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 5000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function getProfitColor(pct: number): string {
  if (pct >= 1) return "text-emerald-400";
  if (pct >= 0.5) return "text-cyan-400";
  if (pct >= 0.2) return "text-amber-400";
  return "text-slate-400";
}

function getProfitBg(pct: number): string {
  if (pct >= 1) return "bg-emerald-500/10 ring-emerald-500/20";
  if (pct >= 0.5) return "bg-cyan-500/10 ring-cyan-500/20";
  if (pct >= 0.2) return "bg-amber-500/10 ring-amber-500/20";
  return "bg-slate-500/10 ring-slate-500/20";
}

export function OpportunitiesTable({ opportunities }: OpportunitiesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("profit_pct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...opportunities].sort((a, b) => {
    const mul = sortDir === "desc" ? -1 : 1;
    return mul * ((a[sortKey] as number) - (b[sortKey] as number));
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className={`ml-1 text-[10px] ${sortKey === col ? "text-emerald-400" : "text-slate-600"}`}>
      {sortKey === col ? (sortDir === "desc" ? "\u25BC" : "\u25B2") : "\u25BD"}
    </span>
  );

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800/60 bg-slate-900/30 py-16 backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/50 ring-1 ring-slate-700/50">
          <TrendingUp className="h-5 w-5 text-slate-600" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-500">No opportunities found</p>
        <p className="mt-1 text-xs text-slate-600">Click "Scan Now" to search for arbitrage</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800/60">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Path
              </th>
              <th
                onClick={() => toggleSort("profit_pct")}
                className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                Profit <SortIcon col="profit_pct" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rates
              </th>
              <th
                onClick={() => toggleSort("volume_usd")}
                className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                Volume <SortIcon col="volume_usd" />
              </th>
              <th
                onClick={() => toggleSort("detected_at")}
                className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                Detected <SortIcon col="detected_at" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {sorted.map((opp) => {
              const isExpanded = expandedId === opp.id;
              return (
                <tr
                  key={opp.id}
                  onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                  className="group cursor-pointer transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-6 items-center rounded-md bg-slate-800/60 px-1.5 text-xs font-bold text-white ring-1 ring-slate-700/50">
                        {opp.base_currency}
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-600" />
                      <span className="inline-flex h-6 items-center rounded-md bg-slate-800/60 px-1.5 text-xs font-bold text-white ring-1 ring-slate-700/50">
                        {opp.intermediate_currency}
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-600" />
                      <span className="inline-flex h-6 items-center rounded-md bg-slate-800/60 px-1.5 text-xs font-bold text-white ring-1 ring-slate-700/50">
                        {opp.quote_currency}
                      </span>
                      <ArrowRight className="h-3 w-3 text-emerald-500/50" />
                      <span className="inline-flex h-6 items-center rounded-md bg-emerald-500/10 px-1.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                        {opp.base_currency}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-500">
                        <span>
                          Step 1: {opp.pair_a} @ {formatNumber(opp.rate_a)}
                        </span>
                        <span>
                          Step 2: {opp.pair_b} @ {formatNumber(opp.rate_b)}
                        </span>
                        <span>
                          Step 3: {opp.pair_c} @ {formatNumber(opp.rate_c)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${getProfitBg(opp.profit_pct)} ${getProfitColor(opp.profit_pct)}`}
                    >
                      +{opp.profit_pct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-xs text-slate-400">
                      <div>{formatNumber(opp.rate_a)}</div>
                      <div className="text-slate-600">{formatNumber(opp.rate_b)}</div>
                      <div className="text-slate-600">{formatNumber(opp.rate_c)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {formatVolume(opp.volume_usd)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">
                    {timeAgo(opp.detected_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
