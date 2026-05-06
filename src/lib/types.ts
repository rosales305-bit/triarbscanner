export interface Exchange {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  logo_url: string;
  created_at: string;
}

export interface ArbitrageOpportunity {
  id: string;
  exchange_id: string;
  base_currency: string;
  intermediate_currency: string;
  quote_currency: string;
  pair_a: string;
  pair_b: string;
  pair_c: string;
  rate_a: number;
  rate_b: number;
  rate_c: number;
  profit_pct: number;
  volume_usd: number;
  detected_at: string;
  expires_at: string | null;
}

export interface ScanLog {
  id: string;
  exchange_id: string;
  pairs_scanned: number;
  opportunities_found: number;
  scan_duration_ms: number;
  scanned_at: string;
}

export interface ScanResult {
  exchange: string;
  pairsScanned: number;
  opportunitiesFound: number;
  scanDurationMs: number;
  opportunities: TriangularOpportunity[];
  timestamp: string;
}

export interface TriangularOpportunity {
  base: string;
  intermediate: string;
  quote: string;
  pairA: string;
  pairB: string;
  pairC: string;
  rateA: number;
  rateB: number;
  rateC: number;
  profitPct: number;
  volumeUsd: number;
  path: string;
}
