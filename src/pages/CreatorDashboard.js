import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function CreatorDashboard() {
  const { user, profile, updateProfile } = useAuth();
  const [strategies, setStrategies] = useState([]);
  const [subscriberCounts, setSubscriberCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [onboardForm, setOnboardForm] = useState({ name: '', bio: '' });
  const [onboardError, setOnboardError] = useState('');

  useEffect(() => {
    if (profile?.role === 'creator') {
      fetchStrategies();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function fetchStrategies() {
    const { data } = await supabase
      .from('nc_strategies')
      .select('*')
      .eq('creator_id', user.id)
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

  async function handleOnboard(e) {
    e.preventDefault();
    setOnboardError('');
    if (!onboardForm.name.trim()) {
      setOnboardError('Name is required.');
      return;
    }
    try {
      await updateProfile({
        name: onboardForm.name.trim(),
        bio: onboardForm.bio.trim(),
        role: 'creator',
      });
      setOnboarding(false);
      fetchStrategies();
    } catch (err) {
      setOnboardError('Failed to update profile. Please try again.');
    }
  }

  async function toggleStatus(strategy) {
    const newStatus = strategy.status === 'active' ? 'paused' : 'active';
    await supabase
      .from('nc_strategies')
      .update({ status: newStatus })
      .eq('id', strategy.id);
    fetchStrategies();
  }

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  if (profile?.role !== 'creator') {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="dashboard-header">
            <h1>Become a Creator</h1>
            <p className="subtitle">Share your trading strategies and earn revenue from subscribers.</p>
          </div>

          {!onboarding ? (
            <div className="empty-state-box">
              <h3>Ready to share your strategies?</h3>
              <p>Creators can publish trading strategies, manage portfolios, and earn recurring revenue from subscribers.</p>
              <button className="btn btn-primary" onClick={() => {
                setOnboarding(true);
                setOnboardForm({ name: profile?.name || '', bio: profile?.bio || '' });
              }}>
                Become a Creator
              </button>
            </div>
          ) : (
            <div className="onboard-form-wrapper">
              <form className="contact-form" onSubmit={handleOnboard}>
                {onboardError && <div className="notification error">{onboardError}</div>}
                <div className="form-group">
                  <label htmlFor="creator-name">Display Name</label>
                  <input
                    id="creator-name"
                    type="text"
                    value={onboardForm.name}
                    onChange={e => setOnboardForm({ ...onboardForm, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="creator-bio">Bio</label>
                  <textarea
                    id="creator-bio"
                    value={onboardForm.bio}
                    onChange={e => setOnboardForm({ ...onboardForm, bio: e.target.value })}
                    placeholder="Tell subscribers about your trading experience and approach..."
                    rows={4}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Start Creating</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setOnboarding(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Creator Dashboard</h1>
            <p className="subtitle">Manage your strategies and track performance</p>
          </div>
          <Link to="/creator/new" className="btn btn-primary">Create New Strategy</Link>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Overview</h3>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-value">{strategies.length}</span>
                <span className="stat-label">Strategies</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {Object.values(subscriberCounts).reduce((a, b) => a + b, 0)}
                </span>
                <span className="stat-label">Total Subscribers</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card full-width">
            <h3>Your Strategies</h3>
            {strategies.length === 0 ? (
              <div className="empty-state">
                <p>You haven't created any strategies yet.</p>
                <Link to="/creator/new" className="btn btn-primary btn-sm">Create Your First Strategy</Link>
              </div>
            ) : (
              <div className="creator-strategy-list">
                {strategies.map(strategy => (
                  <div key={strategy.id} className="creator-strategy-item">
                    <div className="creator-strategy-info">
                      <Link to={`/strategy/${strategy.id}`} className="creator-strategy-title">
                        {strategy.title}
                      </Link>
                      <div className="creator-strategy-meta">
                        <span className={`status-badge status-${strategy.status}`}>
                          {strategy.status}
                        </span>
                        <span>{subscriberCounts[strategy.id] || 0} subscribers</span>
                        <span>
                          {strategy.subscription_price > 0
                            ? `$${Number(strategy.subscription_price).toFixed(0)}/mo`
                            : 'Free'}
                        </span>
                      </div>
                    </div>
                    <div className="creator-strategy-actions">
                      <Link to={`/creator/edit/${strategy.id}`} className="btn btn-secondary btn-sm">
                        Edit
                      </Link>
                      <Link to={`/creator/strategy/${strategy.id}/portfolio`} className="btn btn-secondary btn-sm">
                        Portfolio
                      </Link>
                      <button
                        className={`btn btn-sm ${strategy.status === 'active' ? 'btn-warning' : 'btn-primary'}`}
                        onClick={() => toggleStatus(strategy)}
                      >
                        {strategy.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                    </div>
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

export default CreatorDashboard;
