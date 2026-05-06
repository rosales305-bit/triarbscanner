import { TrendingUp, Search, BarChart3 } from "lucide-react";

interface StatsCardsProps {
  totalOpportunities: number;
  bestProfit: number;
  pairsScanned: number;
  scanDuration: number;
  avgProfit: number;
}

export function StatsCards({
  totalOpportunities,
  bestProfit,
  pairsScanned,
  scanDuration,
  avgProfit,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Opportunities",
      value: totalOpportunities.toString(),
      icon: TrendingUp,
      color: "emerald",
      subtext: "Active now",
    },
    {
      label: "Best Profit",
      value: bestProfit > 0 ? `${bestProfit.toFixed(2)}%` : "--",
      icon: BarChart3,
      color: "cyan",
      subtext: "After fees",
    },
    {
      label: "Avg Profit",
      value: avgProfit > 0 ? `${avgProfit.toFixed(2)}%` : "--",
      icon: TrendingUp,
      color: "amber",
      subtext: "Mean return",
    },
    {
      label: "Pairs Scanned",
      value: pairsScanned > 0 ? pairsScanned.toLocaleString() : "--",
      icon: Search,
      color: "blue",
      subtext: scanDuration > 0 ? `${scanDuration}ms` : "Not scanned",
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; ring: string; text: string }> = {
    emerald: {
      bg: "bg-emerald-500/10",
      icon: "text-emerald-400",
      ring: "ring-emerald-500/20",
      text: "text-emerald-400",
    },
    cyan: {
      bg: "bg-cyan-500/10",
      icon: "text-cyan-400",
      ring: "ring-cyan-500/20",
      text: "text-cyan-400",
    },
    amber: {
      bg: "bg-amber-500/10",
      icon: "text-amber-400",
      ring: "ring-amber-500/20",
      text: "text-amber-400",
    },
    blue: {
      bg: "bg-blue-500/10",
      icon: "text-blue-400",
      ring: "ring-blue-500/20",
      text: "text-blue-400",
    },
  };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const colors = colorMap[stat.color];
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-slate-700/60 hover:bg-slate-900/80"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold tracking-tight ${colors.text}`}>
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600">{stat.subtext}</p>
              </div>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg} ring-1 ${colors.ring}`}
              >
                <Icon className={`h-4 w-4 ${colors.icon}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
