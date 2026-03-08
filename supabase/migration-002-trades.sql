-- NowCast Platform — Migration 002: Trade Journal & Strategy Types
-- Run in Supabase SQL Editor after migration.sql

-- ─── Strategy Type & Benchmark ───────────────────────────────────────────────

-- Add strategy_type: 'automated' (rule-based algo) or 'manual' (creator trades, followers copy)
ALTER TABLE nc_strategies ADD COLUMN IF NOT EXISTS strategy_type TEXT DEFAULT 'manual' CHECK (strategy_type IN ('automated', 'manual'));

-- For automated strategies: human-readable description of the rules
ALTER TABLE nc_strategies ADD COLUMN IF NOT EXISTS rules_description TEXT;

-- Benchmark to compare against
ALTER TABLE nc_strategies ADD COLUMN IF NOT EXISTS benchmark TEXT DEFAULT 'none' CHECK (benchmark IN ('none', 'sp500', 'btc', 'eth'));

-- Update asset_class constraint to include 'prediction'
ALTER TABLE nc_strategies DROP CONSTRAINT IF EXISTS nc_strategies_asset_class_check;
ALTER TABLE nc_strategies ADD CONSTRAINT nc_strategies_asset_class_check CHECK (asset_class IN ('equities', 'crypto', 'prediction', 'mixed'));

-- Update portfolio holdings asset_type to include 'prediction'
ALTER TABLE nc_portfolio_holdings DROP CONSTRAINT IF EXISTS nc_portfolio_holdings_asset_type_check;
ALTER TABLE nc_portfolio_holdings ADD CONSTRAINT nc_portfolio_holdings_asset_type_check CHECK (asset_type IN ('stock', 'etf', 'crypto', 'prediction'));

-- ─── Trade Journal ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nc_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES nc_strategies(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell', 'short', 'cover')),
  ticker TEXT NOT NULL,
  market_type TEXT NOT NULL CHECK (market_type IN ('stock', 'etf', 'crypto', 'prediction')),
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  rationale TEXT,
  price_target NUMERIC,
  stop_loss NUMERIC,
  conviction INT CHECK (conviction BETWEEN 1 AND 5),
  -- For prediction markets
  resolution_date TIMESTAMPTZ,
  resolution_outcome TEXT CHECK (resolution_outcome IN ('win', 'loss', 'pending', NULL)),
  -- Immutability
  created_at TIMESTAMPTZ DEFAULT now(),
  locked_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour'),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nc_trades_strategy ON nc_trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_nc_trades_created ON nc_trades(strategy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nc_trades_ticker ON nc_trades(strategy_id, ticker);

-- Updated_at trigger
CREATE TRIGGER nc_trades_updated_at
  BEFORE UPDATE ON nc_trades
  FOR EACH ROW EXECUTE FUNCTION nc_update_updated_at();

-- ─── RLS for nc_trades ───────────────────────────────────────────────────────

ALTER TABLE nc_trades ENABLE ROW LEVEL SECURITY;

-- Anyone can read trades for active strategies
CREATE POLICY "nc_trades_select" ON nc_trades FOR SELECT USING (
  EXISTS (SELECT 1 FROM nc_strategies WHERE id = strategy_id AND (status = 'active' OR creator_id = auth.uid()))
);

-- Creators can insert trades for their own strategies
CREATE POLICY "nc_trades_insert" ON nc_trades FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM nc_strategies WHERE id = strategy_id AND creator_id = auth.uid())
);

-- Creators can update trades only before they're locked (1 hour window)
CREATE POLICY "nc_trades_update" ON nc_trades FOR UPDATE USING (
  EXISTS (SELECT 1 FROM nc_strategies WHERE id = strategy_id AND creator_id = auth.uid())
  AND locked_at > now()
);

-- No deletes — trades are immutable
-- CREATE POLICY "nc_trades_delete" — intentionally omitted

-- ─── Seed: BTC Momentum Strategy ─────────────────────────────────────────────
-- Uses the creator@nowcastplatform.com account

DO $$
DECLARE
  creator_uuid UUID;
  strategy_uuid UUID;
BEGIN
  -- Get the creator account
  SELECT id INTO creator_uuid FROM nc_profiles WHERE email = 'creator@nowcastplatform.com';

  IF creator_uuid IS NULL THEN
    RAISE NOTICE 'creator@nowcastplatform.com not found, skipping seed';
    RETURN;
  END IF;

  -- Create the strategy
  strategy_uuid := gen_random_uuid();

  INSERT INTO nc_strategies (id, creator_id, title, description, tags, subscription_price, risk_level, asset_class, status, strategy_type, rules_description, benchmark)
  VALUES (
    strategy_uuid,
    creator_uuid,
    'BTC Momentum Shield',
    'A simple, automated strategy that protects against major Bitcoin drawdowns. Holds BTC during uptrends and rotates to USDC when price breaks below key support levels. Designed to capture most of Bitcoin''s upside while avoiding the worst crashes.',
    ARRAY['Crypto Only', 'Quant Strategy', 'AI-Powered Strategy'],
    29,
    'medium',
    'crypto',
    'active',
    'automated',
    E'**Rules:**\n1. HOLD BTC when price is above $67,000\n2. SELL all BTC → USDC when price drops below $65,000\n3. BUY BTC with all USDC when price rises above $67,000\n\nThe $2,000 buffer between sell ($65K) and buy ($67K) prevents whipsaw trades during sideways chop.\n\n**Execution:** Automated via API. Checks price every 5 minutes. Market orders with 0.5% slippage tolerance.',
    'btc'
  );

  -- Seed historical trades (realistic BTC price action over past months)
  -- Trade 1: Initial BTC purchase
  INSERT INTO nc_trades (strategy_id, direction, ticker, market_type, quantity, price, rationale, created_at, locked_at)
  VALUES (strategy_uuid, 'buy', 'BTC', 'crypto', 1.5, 68200, 'Strategy launch. BTC above $67K threshold — entering full position.', '2025-10-15 14:30:00+00', '2025-10-15 15:30:00+00');

  -- Trade 2: Sell on breakdown below 65K
  INSERT INTO nc_trades (strategy_id, direction, ticker, market_type, quantity, price, rationale, created_at, locked_at)
  VALUES (strategy_uuid, 'sell', 'BTC', 'crypto', 1.5, 64800, 'BTC broke below $65K trigger. Rotating to USDC to protect capital.', '2025-11-08 09:15:00+00', '2025-11-08 10:15:00+00');

  -- Trade 3: Buy back above 67K
  INSERT INTO nc_trades (strategy_id, direction, ticker, market_type, quantity, price, rationale, created_at, locked_at)
  VALUES (strategy_uuid, 'buy', 'BTC', 'crypto', 1.45, 67300, 'BTC reclaimed $67K. Re-entering position. Slight size reduction from slippage.', '2025-11-22 16:45:00+00', '2025-11-22 17:45:00+00');

  -- Trade 4: Sell on another breakdown
  INSERT INTO nc_trades (strategy_id, direction, ticker, market_type, quantity, price, rationale, created_at, locked_at)
  VALUES (strategy_uuid, 'sell', 'BTC', 'crypto', 1.45, 64500, 'Second breakdown below $65K. Selling to USDC. Market showing weakness.', '2025-12-10 11:20:00+00', '2025-12-10 12:20:00+00');

  -- Trade 5: Buy on recovery
  INSERT INTO nc_trades (strategy_id, direction, ticker, market_type, quantity, price, rationale, created_at, locked_at)
  VALUES (strategy_uuid, 'buy', 'BTC', 'crypto', 1.38, 67800, 'BTC back above $67K after consolidation. Re-entering.', '2026-01-05 08:00:00+00', '2026-01-05 09:00:00+00');

  -- Trade 6: Sell on Jan dip
  INSERT INTO nc_trades (strategy_id, direction, ticker, market_type, quantity, price, rationale, created_at, locked_at)
  VALUES (strategy_uuid, 'sell', 'BTC', 'crypto', 1.38, 64200, 'January selloff triggered $65K threshold. Moving to safety.', '2026-01-18 20:10:00+00', '2026-01-18 21:10:00+00');

  -- Trade 7: Buy on Feb recovery
  INSERT INTO nc_trades (strategy_id, direction, ticker, market_type, quantity, price, rationale, created_at, locked_at)
  VALUES (strategy_uuid, 'buy', 'BTC', 'crypto', 1.30, 67500, 'BTC clearing $67K with volume. Bullish structure forming.', '2026-02-12 13:30:00+00', '2026-02-12 14:30:00+00');

  -- Trade 8: Still holding (current position)
  -- No sell — strategy is currently long BTC

  RAISE NOTICE 'Seeded BTC Momentum Shield strategy with 7 trades (currently holding BTC)';
END $$;
