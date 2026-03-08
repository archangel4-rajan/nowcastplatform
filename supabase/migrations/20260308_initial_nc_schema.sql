-- NowCast Platform — Database Migration
-- IMPORTANT: This Supabase project is shared with AIOpenLibrary.
-- All NowCast tables are prefixed with nc_ to avoid conflicts.

-- ─── Tables ──────────────────────────────────────────────────────────────────

-- nc_profiles (extends supabase auth.users)
CREATE TABLE nc_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'creator')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- nc_strategies
CREATE TABLE nc_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES nc_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  subscription_price NUMERIC DEFAULT 0,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  asset_class TEXT CHECK (asset_class IN ('equities', 'crypto', 'mixed')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- nc_portfolio_holdings (current portfolio state for a strategy)
CREATE TABLE nc_portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES nc_strategies(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  asset_type TEXT CHECK (asset_type IN ('stock', 'etf', 'crypto')),
  allocation_pct NUMERIC NOT NULL,
  entry_price NUMERIC,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- nc_portfolio_updates (signal history / changelog)
CREATE TABLE nc_portfolio_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES nc_strategies(id) ON DELETE CASCADE,
  update_type TEXT CHECK (update_type IN ('add', 'remove', 'rebalance', 'note')),
  ticker TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- nc_subscriptions
CREATE TABLE nc_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nc_profiles(id),
  strategy_id UUID NOT NULL REFERENCES nc_strategies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(user_id, strategy_id)
);

-- nc_comments
CREATE TABLE nc_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nc_profiles(id),
  strategy_id UUID NOT NULL REFERENCES nc_strategies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_nc_strategies_creator ON nc_strategies(creator_id);
CREATE INDEX idx_nc_strategies_status ON nc_strategies(status);
CREATE INDEX idx_nc_portfolio_holdings_strategy ON nc_portfolio_holdings(strategy_id);
CREATE INDEX idx_nc_portfolio_updates_strategy ON nc_portfolio_updates(strategy_id);
CREATE INDEX idx_nc_subscriptions_user ON nc_subscriptions(user_id);
CREATE INDEX idx_nc_subscriptions_strategy ON nc_subscriptions(strategy_id);
CREATE INDEX idx_nc_comments_strategy ON nc_comments(strategy_id);

-- ─── Auto-create nc_profiles on user signup ──────────────────────────────────

CREATE OR REPLACE FUNCTION handle_nc_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO nc_profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_nc
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_nc_new_user();

-- ─── Updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION nc_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nc_profiles_updated_at
  BEFORE UPDATE ON nc_profiles
  FOR EACH ROW EXECUTE FUNCTION nc_update_updated_at();

CREATE TRIGGER nc_strategies_updated_at
  BEFORE UPDATE ON nc_strategies
  FOR EACH ROW EXECUTE FUNCTION nc_update_updated_at();

CREATE TRIGGER nc_portfolio_holdings_updated_at
  BEFORE UPDATE ON nc_portfolio_holdings
  FOR EACH ROW EXECUTE FUNCTION nc_update_updated_at();

CREATE TRIGGER nc_comments_updated_at
  BEFORE UPDATE ON nc_comments
  FOR EACH ROW EXECUTE FUNCTION nc_update_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE nc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_portfolio_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_comments ENABLE ROW LEVEL SECURITY;

-- nc_profiles: anyone can read, users can update their own
CREATE POLICY "nc_profiles_select" ON nc_profiles FOR SELECT USING (true);
CREATE POLICY "nc_profiles_update" ON nc_profiles FOR UPDATE USING (auth.uid() = id);

-- nc_strategies: anyone can read active, creators CRUD their own
CREATE POLICY "nc_strategies_select" ON nc_strategies FOR SELECT USING (status = 'active' OR creator_id = auth.uid());
CREATE POLICY "nc_strategies_insert" ON nc_strategies FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "nc_strategies_update" ON nc_strategies FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "nc_strategies_delete" ON nc_strategies FOR DELETE USING (creator_id = auth.uid());

-- nc_portfolio_holdings: anyone can read holdings for active strategies, creators CRUD their own
CREATE POLICY "nc_holdings_select" ON nc_portfolio_holdings FOR SELECT USING (
  EXISTS (SELECT 1 FROM nc_strategies WHERE id = strategy_id AND (status = 'active' OR creator_id = auth.uid()))
);
CREATE POLICY "nc_holdings_insert" ON nc_portfolio_holdings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM nc_strategies WHERE id = strategy_id AND creator_id = auth.uid())
);
CREATE POLICY "nc_holdings_update" ON nc_portfolio_holdings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM nc_strategies WHERE id = strategy_id AND creator_id = auth.uid())
);
CREATE POLICY "nc_holdings_delete" ON nc_portfolio_holdings FOR DELETE USING (
  EXISTS (SELECT 1 FROM nc_strategies WHERE id = strategy_id AND creator_id = auth.uid())
);

-- nc_portfolio_updates: anyone can read, creators insert for their own strategies
CREATE POLICY "nc_updates_select" ON nc_portfolio_updates FOR SELECT USING (true);
CREATE POLICY "nc_updates_insert" ON nc_portfolio_updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM nc_strategies WHERE id = strategy_id AND creator_id = auth.uid())
);

-- nc_subscriptions: users CRUD their own, creators can read subscriptions to their strategies
CREATE POLICY "nc_subscriptions_select" ON nc_subscriptions FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM nc_strategies WHERE id = strategy_id AND creator_id = auth.uid())
);
CREATE POLICY "nc_subscriptions_insert" ON nc_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "nc_subscriptions_update" ON nc_subscriptions FOR UPDATE USING (user_id = auth.uid());

-- nc_comments: anyone can read, authenticated users insert, users update/delete their own
CREATE POLICY "nc_comments_select" ON nc_comments FOR SELECT USING (true);
CREATE POLICY "nc_comments_insert" ON nc_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nc_comments_update" ON nc_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "nc_comments_delete" ON nc_comments FOR DELETE USING (auth.uid() = user_id);
