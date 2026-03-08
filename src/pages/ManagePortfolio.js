import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PortfolioTable from '../components/PortfolioTable';
import { ASSET_TYPES, TRADE_DIRECTIONS } from '../constants/tags';

function ManagePortfolio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [strategy, setStrategy] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTrade, setSavingTrade] = useState(false);
  const [error, setError] = useState('');
  const [tradeError, setTradeError] = useState('');

  const [newHolding, setNewHolding] = useState({
    ticker: '',
    asset_type: 'stock',
    allocation_pct: '',
    entry_price: '',
    notes: '',
  });

  const [newTrade, setNewTrade] = useState({
    direction: 'buy',
    ticker: '',
    market_type: 'stock',
    quantity: '',
    price: '',
    rationale: '',
    price_target: '',
    stop_loss: '',
    conviction: '3',
    resolution_date: '',
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

    // Fetch trades (table may not exist yet)
    try {
      const { data: tradeData } = await supabase
        .from('nc_trades')
        .select('*')
        .eq('strategy_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      setTrades(tradeData || []);
    } catch {
      setTrades([]);
    }

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

  async function handleLogTrade(e) {
    e.preventDefault();
    setTradeError('');

    if (!newTrade.ticker.trim()) {
      setTradeError('Ticker is required.');
      return;
    }
    if (!newTrade.quantity || Number(newTrade.quantity) <= 0) {
      setTradeError('Quantity must be greater than 0.');
      return;
    }
    if (!newTrade.price || Number(newTrade.price) <= 0) {
      setTradeError('Price must be greater than 0.');
      return;
    }

    setSavingTrade(true);

    try {
      const payload = {
        strategy_id: id,
        direction: newTrade.direction,
        ticker: newTrade.ticker.trim().toUpperCase(),
        market_type: newTrade.market_type,
        quantity: Number(newTrade.quantity),
        price: Number(newTrade.price),
        rationale: newTrade.rationale.trim() || null,
        price_target: newTrade.price_target ? Number(newTrade.price_target) : null,
        stop_loss: newTrade.stop_loss ? Number(newTrade.stop_loss) : null,
        conviction: Number(newTrade.conviction),
        resolution_date: newTrade.market_type === 'prediction' && newTrade.resolution_date
          ? newTrade.resolution_date
          : null,
      };

      const { error: insertError } = await supabase
        .from('nc_trades')
        .insert(payload);

      if (insertError) {
        setTradeError(insertError.message);
        setSavingTrade(false);
        return;
      }

      setNewTrade({
        direction: 'buy',
        ticker: '',
        market_type: 'stock',
        quantity: '',
        price: '',
        rationale: '',
        price_target: '',
        stop_loss: '',
        conviction: '3',
        resolution_date: '',
      });
      setSavingTrade(false);
      fetchData();
    } catch (err) {
      setTradeError('Failed to log trade. The trades table may not be set up yet.');
      setSavingTrade(false);
    }
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

        {/* Trade Log - Primary Section */}
        <div className="dashboard-card" style={{ marginBottom: '24px' }}>
          <div className="card-header-actions">
            <h3>Log Trade</h3>
          </div>

          <form className="trade-log-form" onSubmit={handleLogTrade}>
            {tradeError && <div className="notification error">{tradeError}</div>}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="trade-direction">Direction</label>
                <select
                  id="trade-direction"
                  value={newTrade.direction}
                  onChange={e => setNewTrade({ ...newTrade, direction: e.target.value })}
                >
                  {TRADE_DIRECTIONS.map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="trade-ticker">Ticker</label>
                <input
                  id="trade-ticker"
                  type="text"
                  value={newTrade.ticker}
                  onChange={e => setNewTrade({ ...newTrade, ticker: e.target.value })}
                  placeholder="e.g., BTC"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="trade-market-type">Market Type</label>
                <select
                  id="trade-market-type"
                  value={newTrade.market_type}
                  onChange={e => setNewTrade({ ...newTrade, market_type: e.target.value })}
                >
                  {ASSET_TYPES.map(t => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="trade-quantity">Quantity</label>
                <input
                  id="trade-quantity"
                  type="number"
                  min="0"
                  step="any"
                  value={newTrade.quantity}
                  onChange={e => setNewTrade({ ...newTrade, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="trade-price">Price ($)</label>
                <input
                  id="trade-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTrade.price}
                  onChange={e => setNewTrade({ ...newTrade, price: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="trade-price-target">Price Target ($)</label>
                <input
                  id="trade-price-target"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTrade.price_target}
                  onChange={e => setNewTrade({ ...newTrade, price_target: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label htmlFor="trade-stop-loss">Stop Loss ($)</label>
                <input
                  id="trade-stop-loss"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTrade.stop_loss}
                  onChange={e => setNewTrade({ ...newTrade, stop_loss: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label htmlFor="trade-conviction">Conviction (1-5)</label>
                <select
                  id="trade-conviction"
                  value={newTrade.conviction}
                  onChange={e => setNewTrade({ ...newTrade, conviction: e.target.value })}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              {newTrade.market_type === 'prediction' && (
                <div className="form-group">
                  <label htmlFor="trade-resolution-date">Resolution Date</label>
                  <input
                    id="trade-resolution-date"
                    type="date"
                    value={newTrade.resolution_date}
                    onChange={e => setNewTrade({ ...newTrade, resolution_date: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="trade-rationale">Rationale</label>
              <textarea
                id="trade-rationale"
                value={newTrade.rationale}
                onChange={e => setNewTrade({ ...newTrade, rationale: e.target.value })}
                placeholder="Why are you making this trade?"
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={savingTrade}>
                {savingTrade ? 'Logging...' : 'Log Trade'}
              </button>
            </div>
          </form>

          {trades.length > 0 && (
            <>
              <h4 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '15px', color: '#6b7280' }}>
                Recent Trades
              </h4>
              <div className="portfolio-table-wrapper">
                <table className="trade-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Direction</th>
                      <th>Ticker</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Conviction</th>
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
                        <td>{'★'.repeat(trade.conviction || 0)}</td>
                        <td>{trade.rationale || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Portfolio Holdings - Secondary Section */}
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
