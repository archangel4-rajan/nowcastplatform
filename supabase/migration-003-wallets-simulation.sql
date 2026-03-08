-- NowCast Platform — Migration 003: Wallets & Strategy Simulation
-- Run in Supabase SQL Editor after migration-002

-- ─── Wallets ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nc_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES nc_profiles(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nc_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES nc_wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'deploy', 'return', 'earning', 'fee')),
  amount NUMERIC NOT NULL,
  description TEXT,
  strategy_id UUID REFERENCES nc_strategies(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Deployments: user capital deployed to strategies
CREATE TABLE IF NOT EXISTS nc_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nc_profiles(id),
  strategy_id UUID NOT NULL REFERENCES nc_strategies(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  current_value NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn')),
  deployed_at TIMESTAMPTZ DEFAULT now(),
  withdrawn_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_nc_wallets_user ON nc_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_nc_wallet_tx_wallet ON nc_wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_nc_deployments_user ON nc_deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_nc_deployments_strategy ON nc_deployments(strategy_id);

-- Updated_at triggers
CREATE TRIGGER nc_wallets_updated_at
  BEFORE UPDATE ON nc_wallets
  FOR EACH ROW EXECUTE FUNCTION nc_update_updated_at();

-- ─── Strategy Simulation State ───────────────────────────────────────────────

-- Track current position for automated strategies
ALTER TABLE nc_strategies ADD COLUMN IF NOT EXISTS current_position TEXT DEFAULT 'none' CHECK (current_position IN ('none', 'holding', 'cash'));
ALTER TABLE nc_strategies ADD COLUMN IF NOT EXISTS position_entry_price NUMERIC;
ALTER TABLE nc_strategies ADD COLUMN IF NOT EXISTS last_price_check TIMESTAMPTZ;
ALTER TABLE nc_strategies ADD COLUMN IF NOT EXISTS simulation_capital NUMERIC DEFAULT 100000;

-- Set BTC Momentum Shield to "holding" since last trade was a buy
UPDATE nc_strategies
SET current_position = 'holding', position_entry_price = 67500, simulation_capital = 100000
WHERE title = 'BTC Momentum Shield';

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE nc_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_deployments ENABLE ROW LEVEL SECURITY;

-- Wallets: users can only see/modify their own
CREATE POLICY "nc_wallets_select" ON nc_wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "nc_wallets_insert" ON nc_wallets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "nc_wallets_update" ON nc_wallets FOR UPDATE USING (user_id = auth.uid());

-- Wallet transactions: users see their own
CREATE POLICY "nc_wallet_tx_select" ON nc_wallet_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM nc_wallets WHERE id = wallet_id AND user_id = auth.uid())
);
CREATE POLICY "nc_wallet_tx_insert" ON nc_wallet_transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM nc_wallets WHERE id = wallet_id AND user_id = auth.uid())
);

-- Deployments: users see their own, creators can see deployments to their strategies
CREATE POLICY "nc_deployments_select" ON nc_deployments FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM nc_strategies WHERE id = strategy_id AND creator_id = auth.uid())
);
CREATE POLICY "nc_deployments_insert" ON nc_deployments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "nc_deployments_update" ON nc_deployments FOR UPDATE USING (user_id = auth.uid());

-- ─── Deploy Capital RPC (atomic) ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION nc_deploy_capital(
  p_user_id UUID,
  p_strategy_id UUID,
  p_amount NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_deployment_id UUID;
BEGIN
  -- Get wallet
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM nc_wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RETURN json_build_object('error', 'No wallet found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN json_build_object('error', 'Insufficient balance');
  END IF;

  -- Deduct from wallet
  UPDATE nc_wallets SET balance = balance - p_amount WHERE id = v_wallet_id;

  -- Create deployment
  INSERT INTO nc_deployments (user_id, strategy_id, amount, current_value)
  VALUES (p_user_id, p_strategy_id, p_amount, p_amount)
  RETURNING id INTO v_deployment_id;

  -- Log transaction
  INSERT INTO nc_wallet_transactions (wallet_id, type, amount, description, strategy_id)
  VALUES (v_wallet_id, 'deploy', -p_amount, 'Deployed to strategy', p_strategy_id);

  RETURN json_build_object('success', true, 'deployment_id', v_deployment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Withdraw Capital RPC (atomic) ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION nc_withdraw_capital(
  p_user_id UUID,
  p_deployment_id UUID
) RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_current_value NUMERIC;
  v_strategy_id UUID;
  v_deployment_user UUID;
BEGIN
  -- Get deployment
  SELECT user_id, strategy_id, current_value INTO v_deployment_user, v_strategy_id, v_current_value
  FROM nc_deployments WHERE id = p_deployment_id AND status = 'active' FOR UPDATE;

  IF v_deployment_user IS NULL THEN
    RETURN json_build_object('error', 'Deployment not found');
  END IF;

  IF v_deployment_user != p_user_id THEN
    RETURN json_build_object('error', 'Not your deployment');
  END IF;

  -- Get wallet
  SELECT id INTO v_wallet_id FROM nc_wallets WHERE user_id = p_user_id;

  -- Return capital to wallet
  UPDATE nc_wallets SET balance = balance + v_current_value WHERE id = v_wallet_id;

  -- Mark deployment withdrawn
  UPDATE nc_deployments SET status = 'withdrawn', withdrawn_at = now() WHERE id = p_deployment_id;

  -- Log transaction
  INSERT INTO nc_wallet_transactions (wallet_id, type, amount, description, strategy_id)
  VALUES (v_wallet_id, 'return', v_current_value, 'Withdrawn from strategy', v_strategy_id);

  RETURN json_build_object('success', true, 'returned', v_current_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Seed wallets for test accounts ──────────────────────────────────────────

INSERT INTO nc_wallets (user_id, balance)
SELECT id, CASE
  WHEN email = 'creator@nowcastplatform.com' THEN 50000
  WHEN email = 'user@nowcastplatform.com' THEN 10000
  WHEN email = 'admin@nowcastplatform.com' THEN 25000
END
FROM nc_profiles
WHERE email IN ('creator@nowcastplatform.com', 'user@nowcastplatform.com', 'admin@nowcastplatform.com')
ON CONFLICT (user_id) DO NOTHING;

-- Log initial deposits
INSERT INTO nc_wallet_transactions (wallet_id, type, amount, description)
SELECT w.id, 'deposit', w.balance, 'Initial deposit'
FROM nc_wallets w
WHERE NOT EXISTS (SELECT 1 FROM nc_wallet_transactions WHERE wallet_id = w.id);
