-- NowCast Platform — Migration 004: Notifications & Leaderboard Support
-- Run in Supabase SQL Editor

-- ─── Notifications ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nc_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nc_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('trade', 'subscription', 'system', 'milestone')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  strategy_id UUID REFERENCES nc_strategies(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nc_notifications_user ON nc_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nc_notifications_unread ON nc_notifications(user_id, read) WHERE read = false;

ALTER TABLE nc_notifications ENABLE ROW LEVEL SECURITY;

-- Users see only their own notifications
CREATE POLICY "nc_notifications_select" ON nc_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "nc_notifications_insert" ON nc_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "nc_notifications_update" ON nc_notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "nc_notifications_delete" ON nc_notifications FOR DELETE USING (user_id = auth.uid());

-- ─── Notify subscribers on new trade (trigger) ──────────────────────────────

CREATE OR REPLACE FUNCTION nc_notify_trade() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO nc_notifications (user_id, type, title, message, strategy_id)
  SELECT
    s.user_id,
    'trade',
    UPPER(NEW.direction) || ' ' || NEW.ticker,
    NEW.direction || ' ' || NEW.quantity || ' ' || NEW.ticker || ' @ $' || NEW.price ||
      CASE WHEN NEW.rationale IS NOT NULL THEN ' — ' || LEFT(NEW.rationale, 100) ELSE '' END,
    NEW.strategy_id
  FROM nc_subscriptions s
  WHERE s.strategy_id = NEW.strategy_id
    AND s.status = 'active';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER nc_trade_notify
  AFTER INSERT ON nc_trades
  FOR EACH ROW EXECUTE FUNCTION nc_notify_trade();

-- ─── Leaderboard: Strategy Performance View ─────────────────────────────────
-- Materialized for performance — refresh periodically or on demand

CREATE MATERIALIZED VIEW IF NOT EXISTS nc_strategy_leaderboard AS
SELECT
  s.id AS strategy_id,
  s.title,
  s.creator_id,
  p.name AS creator_name,
  s.asset_class,
  s.risk_level,
  s.strategy_type,
  s.subscription_price,
  s.tags,
  s.created_at,
  -- Trade stats
  COUNT(t.id) AS total_trades,
  COUNT(CASE WHEN t.direction = 'buy' THEN 1 END) AS buy_count,
  COUNT(CASE WHEN t.direction = 'sell' THEN 1 END) AS sell_count,
  -- Subscriber count
  (SELECT COUNT(*) FROM nc_subscriptions sub WHERE sub.strategy_id = s.id AND sub.status = 'active') AS subscriber_count,
  -- Capital deployed
  COALESCE((SELECT SUM(d.current_value) FROM nc_deployments d WHERE d.strategy_id = s.id AND d.status = 'active'), 0) AS total_capital_deployed,
  -- Performance: calculate from completed round-trip trades
  -- Win rate from buy-sell pairs
  s.simulation_capital,
  s.current_position
FROM nc_strategies s
LEFT JOIN nc_profiles p ON s.creator_id = p.id
LEFT JOIN nc_trades t ON t.strategy_id = s.id
WHERE s.status = 'active'
GROUP BY s.id, s.title, s.creator_id, p.name, s.asset_class, s.risk_level,
         s.strategy_type, s.subscription_price, s.tags, s.created_at,
         s.simulation_capital, s.current_position;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nc_leaderboard_strategy ON nc_strategy_leaderboard(strategy_id);

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION nc_refresh_leaderboard() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY nc_strategy_leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Seed some notifications for test users ──────────────────────────────────

INSERT INTO nc_notifications (user_id, type, title, message, strategy_id)
SELECT
  (SELECT id FROM nc_profiles WHERE email = 'user@nowcastplatform.com'),
  'system',
  'Welcome to NowCast!',
  'Your account is set up. Browse the marketplace to find strategies worth following.',
  NULL
WHERE EXISTS (SELECT 1 FROM nc_profiles WHERE email = 'user@nowcastplatform.com');

INSERT INTO nc_notifications (user_id, type, title, message, strategy_id)
SELECT
  (SELECT id FROM nc_profiles WHERE email = 'creator@nowcastplatform.com'),
  'milestone',
  'Strategy Published',
  'Your strategy "BTC Momentum Shield" is now live on the marketplace!',
  (SELECT id FROM nc_strategies WHERE title = 'BTC Momentum Shield')
WHERE EXISTS (SELECT 1 FROM nc_profiles WHERE email = 'creator@nowcastplatform.com');
