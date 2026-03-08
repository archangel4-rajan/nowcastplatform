import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user, profile, wallet } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchData() {
    const { data: subs } = await supabase
      .from('nc_subscriptions')
      .select('*, nc_strategies(id, title, status, risk_level, nc_profiles(name))')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const activeSubs = subs || [];
    setSubscriptions(activeSubs);

    if (activeSubs.length > 0) {
      const strategyIds = activeSubs.map(s => s.strategy_id);
      const { data: updates } = await supabase
        .from('nc_portfolio_updates')
        .select('*, nc_strategies(title)')
        .in('strategy_id', strategyIds)
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentUpdates(updates || []);
    }

    // Fetch active deployments
    try {
      const { data: deps } = await supabase
        .from('nc_deployments')
        .select('*, nc_strategies(title)')
        .eq('user_id', user.id)
        .eq('status', 'active');
      setDeployments(deps || []);
    } catch {
      // Table may not exist yet
    }

    setLoading(false);
  }

  async function handleUnsubscribe(subscriptionId) {
    await supabase
      .from('nc_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', subscriptionId);
    fetchData();
  }

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {profile?.name || 'User'}!</h1>
          <p className="subtitle">Your strategy dashboard</p>
        </div>

        <div className="dashboard-grid">
          {wallet && (
            <div className="dashboard-card">
              <h3>Wallet</h3>
              <div className="wallet-balance" style={{ fontSize: '28px' }}>
                ${Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {deployments.length > 0 && (
                <p style={{ color: 'var(--light-text)', fontSize: '14px', marginTop: '8px' }}>
                  {deployments.length} active deployment{deployments.length !== 1 ? 's' : ''}
                </p>
              )}
              <Link to="/wallet" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>
                Manage Wallet
              </Link>
            </div>
          )}

          <div className="dashboard-card">
            <h3>Profile</h3>
            <div className="profile-info">
              <p><strong>Email:</strong> {profile?.email}</p>
              <p><strong>Role:</strong> {profile?.role || 'user'}</p>
              <p><strong>Member since:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
            {profile?.role !== 'creator' && (
              <Link to="/creator" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
                Become a Creator
              </Link>
            )}
          </div>

          <div className="dashboard-card">
            <h3>My Subscriptions</h3>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-value">{subscriptions.length}</span>
                <span className="stat-label">Active Strategies</span>
              </div>
              <div className="stat">
                <span className="stat-value">--</span>
                <span className="stat-label">Combined Return</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card full-width">
            <h3>Subscribed Strategies</h3>
            {subscriptions.length === 0 ? (
              <p className="empty-state">
                No active subscriptions. <Link to="/marketplace">Browse the marketplace</Link> to find strategies.
              </p>
            ) : (
              <div className="subscription-list">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="subscription-item">
                    <div className="subscription-info">
                      <Link to={`/strategy/${sub.strategy_id}`} className="subscription-title">
                        {sub.nc_strategies?.title || 'Strategy'}
                      </Link>
                      <span className="subscription-creator">
                        by {sub.nc_strategies?.nc_profiles?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="subscription-actions">
                      <Link to={`/strategy/${sub.strategy_id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleUnsubscribe(sub.id)}
                      >
                        Unsubscribe
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-card full-width">
            <h3>Recent Signals</h3>
            {recentUpdates.length === 0 ? (
              <p className="empty-state">No recent signals from your subscribed strategies.</p>
            ) : (
              <div className="updates-list">
                {recentUpdates.map(update => (
                  <div key={update.id} className="update-item">
                    <div className="update-header">
                      <span className={`update-type update-type-${update.update_type}`}>
                        {update.update_type}
                      </span>
                      <span className="update-strategy">{update.nc_strategies?.title}</span>
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
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
