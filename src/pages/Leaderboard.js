import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Leaderboard() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetFilter, setAssetFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('subscribers');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      // Try materialized view first
      let { data, error } = await supabase
        .from('nc_strategy_leaderboard')
        .select('*')
        .limit(50);

      if (error || !data) {
        // Fallback: query strategies directly
        const res = await supabase
          .from('nc_strategies')
          .select('*, nc_profiles(name)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50);

        const strats = res.data || [];

        // Fetch subscriber counts
        const ids = strats.map((s) => s.id);
        let subCounts = {};
        let tradeCounts = {};
        let capitalCounts = {};

        if (ids.length > 0) {
          try {
            const { data: subs } = await supabase
              .from('nc_subscriptions')
              .select('strategy_id')
              .in('strategy_id', ids)
              .eq('status', 'active');
            (subs || []).forEach((s) => {
              subCounts[s.strategy_id] = (subCounts[s.strategy_id] || 0) + 1;
            });
          } catch { /* table may not exist */ }

          try {
            const { data: trades } = await supabase
              .from('nc_trades')
              .select('strategy_id')
              .in('strategy_id', ids);
            (trades || []).forEach((t) => {
              tradeCounts[t.strategy_id] = (tradeCounts[t.strategy_id] || 0) + 1;
            });
          } catch { /* table may not exist */ }

          try {
            const { data: deps } = await supabase
              .from('nc_deployments')
              .select('strategy_id, current_value')
              .in('strategy_id', ids)
              .eq('status', 'active');
            (deps || []).forEach((d) => {
              capitalCounts[d.strategy_id] =
                (capitalCounts[d.strategy_id] || 0) + Number(d.current_value || 0);
            });
          } catch { /* table may not exist */ }
        }

        data = strats.map((s) => ({
          strategy_id: s.id,
          title: s.title,
          creator_name: s.nc_profiles?.name || 'Unknown',
          asset_class: s.asset_class,
          risk_level: s.risk_level,
          strategy_type: s.strategy_type,
          subscription_price: s.subscription_price,
          total_trades: tradeCounts[s.id] || 0,
          subscriber_count: subCounts[s.id] || 0,
          total_capital_deployed: capitalCounts[s.id] || 0,
        }));
      }

      setStrategies(data || []);
    } catch {
      setStrategies([]);
    }
    setLoading(false);
  }

  const filtered = strategies.filter((s) => {
    if (assetFilter && s.asset_class !== assetFilter) return false;
    if (riskFilter && s.risk_level !== riskFilter) return false;
    if (typeFilter && s.strategy_type !== typeFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'subscribers') return (b.subscriber_count || 0) - (a.subscriber_count || 0);
    if (sortBy === 'trades') return (b.total_trades || 0) - (a.total_trades || 0);
    if (sortBy === 'capital') return (b.total_capital_deployed || 0) - (a.total_capital_deployed || 0);
    return 0;
  });

  const top20 = sorted.slice(0, 20);

  const riskColors = { low: 'risk-low', medium: 'risk-medium', high: 'risk-high' };

  return (
    <div className="page">
      <div className="leaderboard-hero">
        <div className="container">
          <h1>Strategy Leaderboard</h1>
          <p className="page-subtitle">
            Top performing strategies ranked by real results
          </p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: '32px' }}>
        <div className="container">
          <div className="leaderboard-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Asset Class</label>
                <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="equities">Equities</option>
                  <option value="crypto">Crypto</option>
                  <option value="prediction">Prediction</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Risk Level</label>
                <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Strategy Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="automated">Automated</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
          </div>

          <div className="leaderboard-sort-tabs">
            <span className="leaderboard-sort-label">Sort by:</span>
            {[
              { key: 'subscribers', label: 'Subscribers' },
              { key: 'trades', label: 'Total Trades' },
              { key: 'capital', label: 'Capital Deployed' },
            ].map((s) => (
              <button
                key={s.key}
                className={`leaderboard-sort-btn ${sortBy === s.key ? 'active' : ''}`}
                onClick={() => setSortBy(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading">Loading leaderboard...</div>
          ) : top20.length === 0 ? (
            <div className="empty-state-box">
              <h3>No strategies yet</h3>
              <p>Check back soon as creators publish their strategies.</p>
            </div>
          ) : (
            <div className="leaderboard-table">
              {top20.map((s, i) => (
                <Link
                  to={`/strategy/${s.strategy_id}`}
                  key={s.strategy_id}
                  className="leaderboard-row"
                >
                  <span className="leaderboard-rank">#{i + 1}</span>
                  <div className="leaderboard-info">
                    <span className="leaderboard-name">{s.title}</span>
                    <span className="leaderboard-creator">
                      by {s.creator_name}
                    </span>
                  </div>
                  <div className="leaderboard-badges">
                    {s.strategy_type && (
                      <span className={`strategy-type-badge strategy-type-${s.strategy_type}`}>
                        {s.strategy_type === 'automated' ? '\uD83E\uDD16' : '\uD83D\uDC64'}{' '}
                        {s.strategy_type === 'automated' ? 'Auto' : 'Manual'}
                      </span>
                    )}
                    {s.asset_class && (
                      <span className="meta-badge">{s.asset_class}</span>
                    )}
                    {s.risk_level && (
                      <span className={`risk-badge ${riskColors[s.risk_level] || ''}`}>
                        {s.risk_level}
                      </span>
                    )}
                  </div>
                  <div className="leaderboard-stats">
                    <div className="leaderboard-stat">
                      <span className="leaderboard-stat-value">{s.total_trades || 0}</span>
                      <span className="leaderboard-stat-label">Trades</span>
                    </div>
                    <div className="leaderboard-stat">
                      <span className="leaderboard-stat-value">{s.subscriber_count || 0}</span>
                      <span className="leaderboard-stat-label">Subs</span>
                    </div>
                    <div className="leaderboard-stat">
                      <span className="leaderboard-stat-value">
                        ${Number(s.total_capital_deployed || 0).toLocaleString('en-US', {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <span className="leaderboard-stat-label">Capital</span>
                    </div>
                    <div className="leaderboard-stat">
                      <span className="leaderboard-stat-value">
                        {s.subscription_price > 0
                          ? `$${Number(s.subscription_price).toFixed(0)}/mo`
                          : 'Free'}
                      </span>
                      <span className="leaderboard-stat-label">Price</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Leaderboard;

// Export a lightweight preview component for the landing page
export function TopStrategiesPreview({ strategies }) {
  if (!strategies || strategies.length === 0) return null;

  const top3 = strategies.slice(0, 3);

  return (
    <section className="section section-alt">
      <div className="container">
        <h2 className="section-title">Top Strategies</h2>
        <p className="section-description">
          The highest-ranked strategies on the platform right now
        </p>
        <div className="card-grid cols-3">
          {top3.map((s, i) => (
            <Link
              to={`/strategy/${s.strategy_id}`}
              key={s.strategy_id}
              className="top-strategy-card"
            >
              <div className="top-strategy-rank">#{i + 1}</div>
              <h3>{s.title}</h3>
              <p className="top-strategy-creator">by {s.creator_name}</p>
              <div className="top-strategy-stats">
                <span>{s.subscriber_count || 0} subscribers</span>
                <span>{s.total_trades || 0} trades</span>
                <span>
                  {s.subscription_price > 0
                    ? `$${Number(s.subscription_price).toFixed(0)}/mo`
                    : 'Free'}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center" style={{ marginTop: '32px' }}>
          <Link to="/leaderboard" className="btn btn-primary">
            View Full Leaderboard
          </Link>
        </div>
      </div>
    </section>
  );
}
