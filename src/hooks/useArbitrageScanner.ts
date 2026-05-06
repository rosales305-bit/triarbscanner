import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { ArbitrageOpportunity, ScanLog, Exchange } from "../lib/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function useArbitrageScanner() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [selectedExchange, setSelectedExchange] = useState("cryptocom");
  const [minProfit, setMinProfit] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [scanDuration, setScanDuration] = useState(0);
  const [pairsScanned, setPairsScanned] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerScan = useCallback(async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const apiUrl = `${SUPABASE_URL}/functions/v1/scan-arbitrage?exchange=${selectedExchange}&minProfit=${minProfit}&limit=100`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Scan failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setLastScanTime(data.timestamp);
      setScanDuration(data.scanDurationMs);
      setPairsScanned(data.pairsScanned);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      setScanError(message);
      console.error("Scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  }, [selectedExchange, minProfit]);

  const fetchOpportunities = useCallback(async () => {
    const { data: exchangeData } = await supabase
      .from("exchanges")
      .select("id")
      .eq("slug", selectedExchange)
      .maybeSingle();

    if (!exchangeData) {
      setOpportunities([]);
      return;
    }

    const { data } = await supabase
      .from("arbitrage_opportunities")
      .select("*")
      .eq("exchange_id", exchangeData.id)
      .gt("expires_at", new Date().toISOString())
      .order("profit_pct", { ascending: false })
      .limit(100);
    if (data) setOpportunities(data);
  }, [selectedExchange]);

  const fetchExchanges = useCallback(async () => {
    const { data } = await supabase
      .from("exchanges")
      .select("*")
      .order("name");
    if (data) setExchanges(data);
  }, []);

  const fetchScanLogs = useCallback(async () => {
    const { data: exchangeData } = await supabase
      .from("exchanges")
      .select("id")
      .eq("slug", selectedExchange)
      .maybeSingle();

    if (!exchangeData) {
      setScanLogs([]);
      return;
    }

    const { data } = await supabase
      .from("scan_logs")
      .select("*")
      .eq("exchange_id", exchangeData.id)
      .order("scanned_at", { ascending: false })
      .limit(20);
    if (data) setScanLogs(data);
  }, [selectedExchange]);

  useEffect(() => {
    fetchExchanges();
    fetchOpportunities();
    fetchScanLogs();
  }, [fetchExchanges, fetchOpportunities, fetchScanLogs, selectedExchange]);

  useEffect(() => {
    const channel = supabase
      .channel("arbitrage-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "arbitrage_opportunities" },
        () => {
          fetchOpportunities();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scan_logs" },
        () => {
          fetchScanLogs();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exchanges" },
        () => {
          fetchExchanges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOpportunities, fetchScanLogs, fetchExchanges]);

  useEffect(() => {
    if (autoRefresh) {
      triggerScan();
      intervalRef.current = setInterval(() => {
        triggerScan();
      }, refreshInterval * 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [autoRefresh, refreshInterval, triggerScan]);

  return {
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
  };
}
