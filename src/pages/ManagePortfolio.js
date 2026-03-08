import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PortfolioTable from '../components/PortfolioTable';
import { ASSET_TYPES } from '../constants/tags';

function ManagePortfolio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [strategy, setStrategy] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [newHolding, setNewHolding] = useState({
    ticker: '',
    asset_type: 'stock',
    allocation_pct: '',
    entry_price: '',
    notes: '',
  });

  const fetchData = useCallback(async () => {
    const { data: strat } = await supabase
      .from('nc_strategies')
      .select('*')
      .eq('id', id)
      .eq('creator_id', user.id)
      .single();

    if (!strat) {
      navigate('/creator');
      return;
    }

    setStrategy(strat);

    const { data: holds } = await supabase
      .from('nc_portfolio_holdings')
      .select('*')
      .eq('strategy_id', id)
      .order('allocation_pct', { ascending: false });

    setHoldings(holds || []);
    setLoading(false);
  }, [id, user.id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddHolding(e) {
    e.preventDefault();
    setError('');

    if (!newHolding.ticker.trim()) {
      setError('Ticker is required.');
      return;
    }
    if (!newHolding.allocation_pct || Number(newHolding.allocation_pct) <= 0) {
      setError('Allocation % must be greater than 0.');
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase
      .from('nc_portfolio_holdings')
      .insert({
        strategy_id: id,
        ticker: newHolding.ticker.trim().toUpperCase(),
        asset_type: newHolding.asset_type,
        allocation_pct: Number(newHolding.allocation_pct),
        entry_price: newHolding.entry_price ? Number(newHolding.entry_price) : null,
        notes: newHolding.notes.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    await supabase.from('nc_portfolio_updates').insert({
      strategy_id: id,
      update_type: 'add',
      ticker: newHolding.ticker.trim().toUpperCase(),
      description: `Added ${newHolding.ticker.trim().toUpperCase()} at ${newHolding.allocation_pct}% allocation`,
    });

    setNewHolding({ ticker: '', asset_type: 'stock', allocation_pct: '', entry_price: '', notes: '' });
    setAdding(false);
    setSaving(false);
    fetchData();
  }

  async function handleRemoveHolding(holding) {
    await supabase
      .from('nc_portfolio_holdings')
      .delete()
      .eq('id', holding.id);

    await supabase.from('nc_portfolio_updates').insert({
      strategy_id: id,
      update_type: 'remove',
      ticker: holding.ticker,
      description: `Removed ${holding.ticker} from portfolio`,
    });

    fetchData();
  }

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  const totalAllocation = holdings.reduce((sum, h) => sum + Number(h.allocation_pct), 0);

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Manage Portfolio</h1>
            <p className="subtitle">{strategy?.title}</p>
          </div>
          <Link to="/creator" className="btn btn-secondary">Back to Dashboard</Link>
        </div>

        <div className="portfolio-summary">
          <div className="dashboard-card">
            <h3>Portfolio Summary</h3>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-value">{holdings.length}</span>
                <span className="stat-label">Holdings</span>
              </div>
              <div className="stat">
                <span className={`stat-value ${totalAllocation > 100 ? 'text-error' : ''}`}>
                  {totalAllocation.toFixed(1)}%
                </span>
                <span className="stat-label">Total Allocation</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header-actions">
            <h3>Current Holdings</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
              Add Holding
            </button>
          </div>

          {adding && (
            <form className="add-holding-form" onSubmit={handleAddHolding}>
              {error && <div className="notification error">{error}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ticker">Ticker</label>
                  <input
                    id="ticker"
                    type="text"
                    value={newHolding.ticker}
                    onChange={e => setNewHolding({ ...newHolding, ticker: e.target.value })}
                    placeholder="e.g., AAPL"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="asset_type">Type</label>
                  <select
                    id="asset_type"
                    value={newHolding.asset_type}
                    onChange={e => setNewHolding({ ...newHolding, asset_type: e.target.value })}
                  >
                    {ASSET_TYPES.map(t => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="allocation">Allocation %</label>
                  <input
                    id="allocation"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newHolding.allocation_pct}
                    onChange={e => setNewHolding({ ...newHolding, allocation_pct: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="entry_price">Entry Price ($)</label>
                  <input
                    id="entry_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newHolding.entry_price}
                    onChange={e => setNewHolding({ ...newHolding, entry_price: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <input
                  id="notes"
                  type="text"
                  value={newHolding.notes}
                  onChange={e => setNewHolding({ ...newHolding, notes: e.target.value })}
                  placeholder="Optional notes about this position"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Adding...' : 'Add'}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAdding(false); setError(''); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <PortfolioTable holdings={holdings} onRemove={handleRemoveHolding} />
        </div>
      </div>
    </div>
  );
}

export default ManagePortfolio;
