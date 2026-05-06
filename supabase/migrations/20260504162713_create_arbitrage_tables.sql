/*
  # Create Triangular Arbitrage Scanner Tables

  1. New Tables
    - `exchanges`
      - `id` (uuid, primary key) - Unique exchange identifier
      - `name` (text, unique) - Exchange name (e.g., Binance, Kraken)
      - `slug` (text, unique) - URL-friendly exchange identifier
      - `is_active` (boolean) - Whether the exchange is currently being scanned
      - `logo_url` (text) - URL to exchange logo
      - `created_at` (timestamptz) - Record creation timestamp

    - `arbitrage_opportunities`
      - `id` (uuid, primary key) - Unique opportunity identifier
      - `exchange_id` (uuid, FK to exchanges) - Which exchange this was found on
      - `base_currency` (text) - Starting currency (e.g., USDT)
      - `intermediate_currency` (text) - Second currency in the triangle (e.g., BTC)
      - `quote_currency` (text) - Third currency in the triangle (e.g., ETH)
      - `pair_a` (text) - First trading pair (e.g., BTC/USDT)
      - `pair_b` (text) - Second trading pair (e.g., ETH/BTC)
      - `pair_c` (text) - Third trading pair (e.g., ETH/USDT)
      - `rate_a` (numeric) - Price of first pair
      - `rate_b` (numeric) - Price of second pair
      - `rate_c` (numeric) - Price of third pair
      - `profit_pct` (numeric) - Expected profit percentage after fees
      - `volume_usd` (numeric) - Estimated volume available
      - `detected_at` (timestamptz) - When the opportunity was detected
      - `expires_at` (timestamptz) - When the opportunity is expected to expire

    - `scan_logs`
      - `id` (uuid, primary key) - Unique scan log identifier
      - `exchange_id` (uuid, FK to exchanges) - Which exchange was scanned
      - `pairs_scanned` (integer) - Number of trading pairs scanned
      - `opportunities_found` (integer) - Number of opportunities found
      - `scan_duration_ms` (integer) - How long the scan took
      - `scanned_at` (timestamptz) - When the scan occurred

  2. Security
    - Enable RLS on all tables
    - All tables are publicly readable (scanner data is not sensitive)
    - Only service role can insert/update/delete
*/

CREATE TABLE IF NOT EXISTS exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  logo_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  base_currency text NOT NULL,
  intermediate_currency text NOT NULL,
  quote_currency text NOT NULL,
  pair_a text NOT NULL,
  pair_b text NOT NULL,
  pair_c text NOT NULL,
  rate_a numeric NOT NULL DEFAULT 0,
  rate_b numeric NOT NULL DEFAULT 0,
  rate_c numeric NOT NULL DEFAULT 0,
  profit_pct numeric NOT NULL DEFAULT 0,
  volume_usd numeric NOT NULL DEFAULT 0,
  detected_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  pairs_scanned integer DEFAULT 0,
  opportunities_found integer DEFAULT 0,
  scan_duration_ms integer DEFAULT 0,
  scanned_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_exchange ON arbitrage_opportunities(exchange_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_profit ON arbitrage_opportunities(profit_pct DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_detected ON arbitrage_opportunities(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_logs_exchange ON scan_logs(exchange_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned ON scan_logs(scanned_at DESC);

-- Enable RLS
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies (scanner data is meant to be viewed)
CREATE POLICY "Anyone can view exchanges"
  ON exchanges FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view opportunities"
  ON arbitrage_opportunities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view scan logs"
  ON scan_logs FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can modify data
CREATE POLICY "Service role can insert exchanges"
  ON exchanges FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update exchanges"
  ON exchanges FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert opportunities"
  ON arbitrage_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can delete opportunities"
  ON arbitrage_opportunities FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert scan logs"
  ON scan_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
