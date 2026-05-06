import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PairData {
  base: string;
  quote: string;
  bid: number;
  ask: number;
  volume: number;
}

interface TriangularOpportunity {
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

// --- US-Friendly Exchange API Fetchers ---

async function fetchKraken(): Promise<PairData[]> {
  const pairsRes = await fetch("https://api.kraken.com/0/public/AssetPairs", {
    headers: { "User-Agent": "TriArbScanner/1.0" },
  });
  const pairsData = await pairsRes.json();

  const normalizeKraken = (s: string): string => {
    if (s === "XXBT") return "BTC";
    if (s === "XETH") return "ETH";
    if (s === "XLTC") return "LTC";
    if (s === "XXMR") return "XMR";
    if (s === "XDG") return "DOGE";
    if (s === "USDT") return "USDT";
    if (s === "USDC") return "USDC";
    if (s.startsWith("Z")) return s.slice(1);
    if (s.startsWith("X") && s.length === 4) return s.slice(1);
    return s;
  };

  const relevantPairs: string[] = [];
  const pairInfo: Record<string, { base: string; quote: string }> = {};

  for (const [key, val] of Object.entries(pairsData.result || {})) {
    const v = val as any;
    if (key.endsWith(".d")) continue;
    if (!v.wsname) continue;

    const base = normalizeKraken(v.base);
    const quote = normalizeKraken(v.quote);

    relevantPairs.push(key);
    pairInfo[key] = { base, quote };
  }

  const batchSize = 20;
  const results: PairData[] = [];

  for (let i = 0; i < relevantPairs.length; i += batchSize) {
    const batch = relevantPairs.slice(i, i + batchSize);
    const pairParam = batch.join(",");

    try {
      const tickerRes = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pairParam}`, {
        headers: { "User-Agent": "TriArbScanner/1.0" },
      });
      const tickerData = await tickerRes.json();

      for (const [pairKey, info] of Object.entries(tickerData.result || {})) {
        const t = info as any;
        const pInfo = pairInfo[pairKey];
        if (!pInfo) continue;

        const bid = parseFloat(t.b?.[0] || "0");
        const ask = parseFloat(t.a?.[0] || "0");
        const volume = parseFloat(t.v?.[1] || "0");

        if (bid > 0 && ask > 0) {
          results.push({ base: pInfo.base, quote: pInfo.quote, bid, ask, volume });
        }
      }
    } catch {
      // Skip failed batches
    }
  }

  return results;
}

async function fetchCoinbase(): Promise<PairData[]> {
  const res = await fetch("https://api.exchange.coinbase.com/products", {
    headers: { "User-Agent": "TriArbScanner/1.0" },
  });
  const products = await res.json();

  // Filter to spot pairs only (no perps)
  const spotProducts = products.filter((p: any) => {
    const id: string = p.id || "";
    return !id.includes("-PERP") && !id.includes("-FUT") && p.trading_disabled !== true;
  });

  // Fetch tickers in batches
  const batchSize = 10;
  const results: PairData[] = [];

  for (let i = 0; i < spotProducts.length; i += batchSize) {
    const batch = spotProducts.slice(i, i + batchSize);
    const tickers = await Promise.all(
      batch.map(async (p: any) => {
        try {
          const tickerRes = await fetch(
            `https://api.exchange.coinbase.com/products/${p.id}/ticker`,
            { headers: { "User-Agent": "TriArbScanner/1.0" } }
          );
          const ticker = await tickerRes.json();
          const [base, quote] = (p.id as string).split("-");
          const bid = parseFloat(ticker.bid || "0");
          const ask = parseFloat(ticker.ask || "0");
          const vol = parseFloat(ticker.volume || "0");
          if (bid > 0 && ask > 0) {
            return { base, quote, bid, ask, volume: vol } as PairData;
          }
        } catch {
          // skip
        }
        return null;
      })
    );
    for (const t of tickers) {
      if (t) results.push(t);
    }
  }

  return results;
}

async function fetchGemini(): Promise<PairData[]> {
  // Get all symbols first
  const symbolsRes = await fetch("https://api.gemini.com/v1/symbols", {
    headers: { "User-Agent": "TriArbScanner/1.0" },
  });
  const symbols: string[] = await symbolsRes.json();

  // Fetch tickers in batches
  const batchSize = 10;
  const results: PairData[] = [];

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const tickers = await Promise.all(
      batch.map(async (sym: string) => {
        try {
          const tickerRes = await fetch(`https://api.gemini.com/v1/pubticker/${sym}`, {
            headers: { "User-Agent": "TriArbScanner/1.0" },
          });
          const ticker = await tickerRes.json();
          if (!ticker.bid || !ticker.ask) return null;

          const bid = parseFloat(ticker.bid);
          const ask = parseFloat(ticker.ask);
          if (bid <= 0 || ask <= 0) return null;

          // Gemini symbols like "btcusd" -> parse base/quote
          const upper = sym.toUpperCase();
          const knownQuotes = ["USD", "USDT", "USDC", "BTC", "ETH", "EUR", "GBP", "SGD", "GUSD"];
          let base = "";
          let quote = "";
          for (const q of knownQuotes) {
            if (upper.endsWith(q)) {
              base = upper.slice(0, upper.length - q.length);
              quote = q;
              break;
            }
          }
          if (!base || !quote) return null;

          const vol = parseFloat(ticker.volume?.USD || "0");
          return { base, quote, bid, ask, volume: vol } as PairData;
        } catch {
          return null;
        }
      })
    );
    for (const t of tickers) {
      if (t) results.push(t);
    }
  }

  return results;
}

async function fetchCryptoCom(): Promise<PairData[]> {
  const res = await fetch("https://api.crypto.com/v2/public/get-ticker", {
    headers: { "User-Agent": "TriArbScanner/1.0" },
  });
  const data = await res.json();
  const tickers = data.result?.data || [];

  return tickers
    .map((t: any) => {
      const instrument: string = t.i || "";
      // Skip perps
      if (instrument.includes("-PERP") || instrument.includes("-FUT")) return null;

      const parts = instrument.split("_");
      if (parts.length === 2) {
        const base = parts[0];
        const quote = parts[1];
      } else {
        // Some instruments like "BTCUSD-PERP" or "WALUSD-PERP"
        return null;
      }

      const base = parts[0];
      const quote = parts[1];
      const bid = parseFloat(t.b || "0");
      const ask = parseFloat(t.a || "0");
      const vol = parseFloat(t.vv || "0"); // vv = quote volume
      if (bid <= 0 || ask <= 0) return null;
      return { base, quote, bid, ask, volume: vol } as PairData;
    })
    .filter((p): p is PairData => p !== null);
}

const EXCHANGE_FETCHERS: Record<string, { fetch: () => Promise<PairData[]>; fee: number; label: string }> = {
  kraken: { fetch: fetchKraken, fee: 0.26, label: "Kraken" },
  coinbase: { fetch: fetchCoinbase, fee: 0.6, label: "Coinbase" },
  gemini: { fetch: fetchGemini, fee: 0.4, label: "Gemini" },
  cryptocom: { fetch: fetchCryptoCom, fee: 0.4, label: "Crypto.com" },
};

// --- Arbitrage Detection ---

function computeTriangles(
  pairs: PairData[],
  feePct: number
): TriangularOpportunity[] {
  const opportunities: TriangularOpportunity[] = [];
  const pairMap = new Map<string, { bid: number; ask: number; volume: number }>();
  const adj = new Map<string, Set<string>>();

  for (const p of pairs) {
    const key = `${p.base}/${p.quote}`;
    pairMap.set(key, { bid: p.bid, ask: p.ask, volume: p.volume });
    if (!adj.has(p.base)) adj.set(p.base, new Set());
    adj.get(p.base)!.add(p.quote);
    if (!adj.has(p.quote)) adj.set(p.quote, new Set());
    adj.get(p.quote)!.add(p.base);
  }

  for (const [base, baseNeighbors] of adj) {
    for (const mid of baseNeighbors) {
      if (mid === base) continue;
      const midNeighbors = adj.get(mid);
      if (!midNeighbors) continue;

      for (const quote of midNeighbors) {
        if (quote === base || quote === mid) continue;
        const quoteNeighbors = adj.get(quote);
        if (!quoteNeighbors || !quoteNeighbors.has(base)) continue;

        const ab = pairMap.get(`${base}/${mid}`);
        const ba = pairMap.get(`${mid}/${base}`);
        const bc = pairMap.get(`${mid}/${quote}`);
        const cb = pairMap.get(`${quote}/${mid}`);
        const ca = pairMap.get(`${quote}/${base}`);
        const ac = pairMap.get(`${base}/${quote}`);

        if ((!ab && !ba) || (!bc && !cb) || (!ca && !ac)) continue;

        let amount = 1000;
        let valid = true;
        let rateA = 0, rateB = 0, rateC = 0;
        let pairAName = "", pairBName = "", pairCName = "";

        if (ab && ab.ask > 0) {
          amount = (amount / ab.ask) * (1 - feePct / 100);
          rateA = ab.ask;
          pairAName = `${base}/${mid}`;
        } else if (ba && ba.bid > 0) {
          amount = (amount * ba.bid) * (1 - feePct / 100);
          rateA = ba.bid;
          pairAName = `${mid}/${base}`;
        } else {
          valid = false;
        }

        if (valid) {
          if (bc && bc.ask > 0) {
            amount = (amount / bc.ask) * (1 - feePct / 100);
            rateB = bc.ask;
            pairBName = `${mid}/${quote}`;
          } else if (cb && cb.bid > 0) {
            amount = (amount * cb.bid) * (1 - feePct / 100);
            rateB = cb.bid;
            pairBName = `${quote}/${mid}`;
          } else {
            valid = false;
          }
        }

        if (valid) {
          if (ca && ca.ask > 0) {
            amount = (amount / ca.ask) * (1 - feePct / 100);
            rateC = ca.ask;
            pairCName = `${quote}/${base}`;
          } else if (ac && ac.bid > 0) {
            amount = (amount * ac.bid) * (1 - feePct / 100);
            rateC = ac.bid;
            pairCName = `${base}/${quote}`;
          } else {
            valid = false;
          }
        }

        if (valid) {
          const profitPct = ((amount - 1000) / 1000) * 100;
          if (profitPct > 0 && profitPct < 10) {
            const volA = (ab || ba)?.volume || 0;
            const volB = (bc || cb)?.volume || 0;
            const volC = (ca || ac)?.volume || 0;
            const minVol = Math.min(volA || Infinity, volB || Infinity, volC || Infinity);

            opportunities.push({
              base,
              intermediate: mid,
              quote,
              pairA: pairAName,
              pairB: pairBName,
              pairC: pairCName,
              rateA,
              rateB,
              rateC,
              profitPct: Math.round(profitPct * 100) / 100,
              volumeUsd: minVol === Infinity ? 0 : minVol,
              path: `${base} -> ${mid} -> ${quote} -> ${base}`,
            });
          }
        }
      }
    }
  }

  const seen = new Set<string>();
  return opportunities
    .filter((o) => {
      const key = `${o.base}-${o.intermediate}-${o.quote}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.profitPct - a.profitPct);
}

// --- Main Handler ---

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const exchange = url.searchParams.get("exchange") || "kraken";
    const minProfit = parseFloat(url.searchParams.get("minProfit") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "100");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = Date.now();

    const fetcher = EXCHANGE_FETCHERS[exchange];
    if (!fetcher) {
      return new Response(
        JSON.stringify({ error: `Unknown exchange: ${exchange}. Supported: ${Object.keys(EXCHANGE_FETCHERS).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pairs = await fetcher.fetch();
    const feePct = fetcher.fee;

    const opportunities = computeTriangles(pairs, feePct);
    const filtered = opportunities
      .filter((o) => o.profitPct >= minProfit)
      .slice(0, limit);

    const scanDuration = Date.now() - startTime;

    const { data: exchangeData } = await supabase
      .from("exchanges")
      .select("id")
      .eq("slug", exchange)
      .maybeSingle();

    let exchangeId = exchangeData?.id;

    if (!exchangeId) {
      const { data: newExchange } = await supabase
        .from("exchanges")
        .insert({
          name: fetcher.label,
          slug: exchange,
          is_active: true,
        })
        .select("id")
        .maybeSingle();
      exchangeId = newExchange?.id;
    }

    if (exchangeId) {
      await supabase.from("scan_logs").insert({
        exchange_id: exchangeId,
        pairs_scanned: pairs.length,
        opportunities_found: filtered.length,
        scan_duration_ms: scanDuration,
      });

      await supabase.from("arbitrage_opportunities").delete().eq("exchange_id", exchangeId);

      if (filtered.length > 0) {
        const insertData = filtered.map((o) => ({
          exchange_id: exchangeId,
          base_currency: o.base,
          intermediate_currency: o.intermediate,
          quote_currency: o.quote,
          pair_a: o.pairA,
          pair_b: o.pairB,
          pair_c: o.pairC,
          rate_a: o.rateA,
          rate_b: o.rateB,
          rate_c: o.rateC,
          profit_pct: o.profitPct,
          volume_usd: o.volumeUsd,
          detected_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30000).toISOString(),
        }));
        await supabase.from("arbitrage_opportunities").insert(insertData);
      }
    }

    return new Response(
      JSON.stringify({
        exchange,
        pairsScanned: pairs.length,
        opportunitiesFound: filtered.length,
        scanDurationMs: scanDuration,
        opportunities: filtered,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
