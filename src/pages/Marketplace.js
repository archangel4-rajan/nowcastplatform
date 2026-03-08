import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import StrategyCard from '../components/StrategyCard';
import TagBadge from '../components/TagBadge';
import { STRATEGY_TAGS, RISK_LEVELS, ASSET_CLASSES } from '../constants/tags';

function Marketplace() {
  const [strategies, setStrategies] = useState([]);
  const [subscriberCounts, setSubscriberCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [riskFilter, setRiskFilter] = useState('');
  const [assetFilter, setAssetFilter] = useState('');

  useEffect(() => {
    fetchStrategies();
  }, []);

  async function fetchStrategies() {
    const { data } = await supabase
      .from('nc_strategies')
      .select('*, nc_profiles(name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const strats = data || [];
    setStrategies(strats);

    if (strats.length > 0) {
      const ids = strats.map(s => s.id);
      const { data: subs } = await supabase
        .from('nc_subscriptions')
        .select('strategy_id')
        .in('strategy_id', ids)
        .eq('status', 'active');

      const counts = {};
      (subs || []).forEach(sub => {
        counts[sub.strategy_id] = (counts[sub.strategy_id] || 0) + 1;
      });
      setSubscriberCounts(counts);
    }

    setLoading(false);
  }

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  const filtered = strategies.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.title.toLowerCase().includes(q) && !s.description?.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedTags.length > 0) {
      if (!selectedTags.some(tag => s.tags?.includes(tag))) return false;
    }
    if (riskFilter && s.risk_level !== riskFilter) return false;
    if (assetFilter && s.asset_class !== assetFilter) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-hero">
        <div className="container">
          <h1>Strategy Marketplace</h1>
          <p className="page-subtitle">Browse proven trading strategies from top creators. Subscribe and start trading.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="marketplace-filters">
            <div className="filter-search">
              <input
                type="text"
                placeholder="Search strategies..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Risk Level</label>
                <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
                  <option value="">All</option>
                  {RISK_LEVELS.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Asset Class</label>
                <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)}>
                  <option value="">All</option>
                  {ASSET_CLASSES.map(a => (
                    <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-tags">
              {STRATEGY_TAGS.map(tag => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  selected={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading strategies...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state-box">
              <h3>No strategies found</h3>
              <p>Try adjusting your filters or check back later for new strategies.</p>
            </div>
          ) : (
            <div className="strategy-grid">
              {filtered.map(strategy => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  subscriberCount={subscriberCounts[strategy.id]}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Marketplace;
