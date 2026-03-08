import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PortfolioTable from '../components/PortfolioTable';
import CommentSection from '../components/CommentSection';
import TagBadge from '../components/TagBadge';

const BENCHMARK_LABELS = {
  none: 'None',
  sp500: 'S&P 500',
  btc: 'Bitcoin',
  eth: 'Ethereum',
};

function calculatePerformance(trades) {
  const stats = {
    totalTrades: trades.length,
    completedTrades: 0,
    wins: 0,
    losses: 0,
    totalReturnDollar: 0,
    totalGain: 0,
    totalLoss: 0,
    gainCount: 0,
    lossCount: 0,
  };

  // Group trades by ticker
  const byTicker = {};
  trades.forEach(t => {
    if (!byTicker[t.ticker]) byTicker[t.ticker] = [];
    byTicker[t.ticker].push(t);
  });

  Object.values(byTicker).forEach(tickerTrades => {
    const buys = tickerTrades
      .filter(t => t.direction === 'buy' || t.direction === 'cover')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const sells = tickerTrades
      .filter(t => t.direction === 'sell' || t.direction === 'short')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const pairs = Math.min(buys.length, sells.length);
    for (let i = 0; i < pairs; i++) {
      const buy = buys[i];
      const sell = sells[i];
      const qty = Math.min(buy.quantity || 0, sell.quantity || 0);
      const pnl = (sell.price - buy.price) * qty;

      stats.completedTrades++;
      stats.totalReturnDollar += pnl;

      if (pnl >= 0) {
        stats.wins++;
        stats.totalGain += pnl;
        stats.gainCount++;
      } else {
        stats.losses++;
        stats.totalLoss += pnl;
        stats.lossCount++;
      }
    }
  });

  return {
    ...stats,
    winRate: stats.completedTrades > 0
      ? ((stats.wins / stats.completedTrades) * 100).toFixed(1)
      : '0.0',
    avgGain: stats.gainCount > 0
      ? (stats.totalGain / stats.gainCount).toFixed(2)
      : '0.00',
    avgLoss: stats.lossCount > 0
      ? (stats.totalLoss / stats.lossCount).toFixed(2)
      : '0.00',
  };
}

function StrategyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [strategy, setStrategy] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [trades, setTrades] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [stratRes, holdRes, updRes, subCountRes] = await Promise.all([
      supabase
        .from('nc_strategies')
        .select('*, nc_profiles(name, bio, avatar_url)')
        .eq('id', id)
        .single(),
      supabase
        .from('nc_portfolio_holdings')
        .select('*')
        .eq('strategy_id', id)
        .order('allocation_pct', { ascending: false }),
      supabase
        .from('nc_portfolio_updates')
        .select('*')
        .eq('strategy_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('nc_subscriptions')
        .select('id', { count: 'exact' })
        .eq('strategy_id', id)
        .eq('status', 'active'),
    ]);

    if (stratRes.data) setStrategy(stratRes.data);
    setHoldings(holdRes.data || []);
    setUpdates(updRes.data || []);
    setSubscriberCount(subCountRes.count || 0);

    // Fetch trades (table may not exist yet)
    try {
      const { data: tradeData } = await supabase
        .from('nc_trades')
        .select('*')
        .eq('strategy_id', id)
        .order('created_at', { ascending: false })
        .limit(20);
      setTrades(tradeData || []);
    } catch {
      setTrades([]);
    }

    if (user) {
      const { data: sub } = await supabase
        .from('nc_subscriptions')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('strategy_id', id)
        .single();
      setIsSubscribed(sub?.status === 'active');
    }

    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubscribe() {
    if (!user) return;
    setSubscriptionLoading(true);

    const { data: existing } = await supabase
      .from('nc_subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('strategy_id', id)
      .single();

    if (existing) {
      await supabase
        .from('nc_subscriptions')
        .update({ status: 'active', cancelled_at: null })
        .eq('id', existing.id);
    } else {
      await supabase.from('nc_subscriptions').insert({
        user_id: user.id,
        strategy_id: id,
      });
    }

    setIsSubscribed(true);
    setSubscriberCount(prev => prev + 1);
    setSubscriptionLoading(false);
  }

  async function handleUnsubscribe() {
    if (!user) return;
    setSubscriptionLoading(true);

    await supabase
      .from('nc_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('strategy_id', id);

    setIsSubscribed(false);
    setSubscriberCount(prev => Math.max(0, prev - 1));
    setSubscriptionLoading(false);
  }

  if (loading) {
    return <div className="container"><div className="loading">Loading strategy...</div></div>;
  }

  if (!strategy) {
    return (
      <div className="container">
        <div className="empty-state-box">
          <h3>Strategy not found</h3>
          <Link to="/marketplace" className="btn btn-primary">Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === strategy.creator_id;
  const perfStats = calculatePerformance(trades);

  return (
    <div className="strategy-detail">
      <div className="container">
        <div className="strategy-detail-header">
          <div className="strategy-detail-info">
            <h1>
              {strategy.title}
              {strategy.strategy_type && (
                <span className={`strategy-type-badge strategy-type-${strategy.strategy_type}`} style={{ marginLeft: '12px', verticalAlign: 'middle' }}>
                  {strategy.strategy_type === 'automated' ? '\uD83E\uDD16 Automated' : '\uD83D\uDC64 Manual'}
                </span>
              )}
            </h1>
            <p className="strategy-detail-creator">
              by {strategy.nc_profiles?.name || 'Unknown Creator'}
            </p>
            <div className="strategy-detail-meta">
              {strategy.risk_level && (
                <span className={`risk-badge risk-${strategy.risk_level}`}>
                  {strategy.risk_level} risk
                </span>
              )}
              {strategy.asset_class && (
                <span className="meta-badge">{strategy.asset_class}</span>
              )}
              {strategy.benchmark && strategy.benchmark !== 'none' && (
                <span className="meta-badge">vs {BENCHMARK_LABELS[strategy.benchmark] || strategy.benchmark}</span>
              )}
              <span className="meta-badge">
                {subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}
              </span>
              <span className="meta-badge price-badge">
                {strategy.subscription_price > 0
                  ? `$${Number(strategy.subscription_price).toFixed(0)}/mo`
                  : 'Free'}
              </span>
            </div>
            <div className="strategy-detail-tags">
              {strategy.tags?.map(tag => <TagBadge key={tag} tag={tag} />)}
            </div>
          </div>

          <div className="strategy-detail-actions">
            {user && !isOwner && (
              isSubscribed ? (
                <button
                  className="btn btn-secondary"
                  onClick={handleUnsubscribe}
                  disabled={subscriptionLoading}
                >
                  {subscriptionLoading ? 'Processing...' : 'Unsubscribe'}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSubscribe}
                  disabled={subscriptionLoading}
                >
                  {subscriptionLoading ? 'Processing...' : 'Subscribe'}
                </button>
              )
            )}
            {isOwner && (
              <Link to={`/creator/edit/${strategy.id}`} className="btn btn-secondary">
                Edit Strategy
              </Link>
            )}
          </div>
        </div>

        {strategy.description && (
          <div className="strategy-detail-section">
            <h2>About This Strategy</h2>
            <p>{strategy.description}</p>
          </div>
        )}

        {strategy.strategy_type === 'automated' && strategy.rules_description && (
          <div className="strategy-detail-section">
            <h2>Strategy Rules</h2>
            <div className="rules-box">
              {strategy.rules_description}
            </div>
          </div>
        )}

        {trades.length > 0 && (
          <div className="strategy-detail-section">
            <h2>Performance</h2>
            <div className="performance-stats">
              <div className="perf-stat-card">
                <span className="stat-value">{perfStats.totalTrades}</span>
                <span className="stat-label">Total Trades</span>
              </div>
              <div className="perf-stat-card">
                <span className="stat-value">{perfStats.completedTrades}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="perf-stat-card">
                <span className="stat-value">{perfStats.winRate}%</span>
                <span className="stat-label">Win Rate</span>
              </div>
              <div className="perf-stat-card">
                <span className={`stat-value ${perfStats.totalReturnDollar >= 0 ? '' : 'text-error'}`}>
                  ${perfStats.totalReturnDollar.toFixed(2)}
                </span>
                <span className="stat-label">Total Return</span>
              </div>
              <div className="perf-stat-card">
                <span className="stat-value" style={{ color: '#10b981' }}>${perfStats.avgGain}</span>
                <span className="stat-label">Avg Gain</span>
              </div>
              <div className="perf-stat-card">
                <span className="stat-value text-error">${perfStats.avgLoss}</span>
                <span className="stat-label">Avg Loss</span>
              </div>
            </div>
          </div>
        )}

        {trades.length > 0 && (
          <div className="strategy-detail-section">
            <h2>Trade History</h2>
            <div className="portfolio-table-wrapper">
              <table className="trade-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Direction</th>
                    <th>Ticker</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map(trade => (
                    <tr key={trade.id}>
                      <td>{new Date(trade.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`trade-direction trade-direction-${trade.direction}`}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="ticker-cell">{trade.ticker}</td>
                      <td>{trade.quantity}</td>
                      <td>${Number(trade.price).toFixed(2)}</td>
                      <td>{trade.rationale || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="strategy-detail-section">
          <h2>Current Portfolio</h2>
          <PortfolioTable holdings={holdings} />
        </div>

        <div className="strategy-detail-section">
          <h2>Recent Updates</h2>
          {updates.length === 0 ? (
            <p className="empty-state">No updates yet.</p>
          ) : (
            <div className="updates-list">
              {updates.map(update => (
                <div key={update.id} className="update-item">
                  <div className="update-header">
                    <span className={`update-type update-type-${update.update_type}`}>
                      {update.update_type}
                    </span>
                    {update.ticker && <span className="update-ticker">{update.ticker}</span>}
                    <span className="update-date">
                      {new Date(update.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="update-description">{update.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="strategy-detail-section">
          <CommentSection strategyId={id} />
        </div>
      </div>
    </div>
  );
}

export default StrategyDetail;
