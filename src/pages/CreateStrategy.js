import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { STRATEGY_TAGS, RISK_LEVELS, ASSET_CLASSES, STRATEGY_TYPES, BENCHMARKS } from '../constants/tags';
import TagBadge from '../components/TagBadge';

function CreateStrategy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: [],
    subscription_price: 0,
    risk_level: 'medium',
    asset_class: 'equities',
    strategy_type: 'manual',
    rules_description: '',
    benchmark: 'none',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      fetchStrategy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  async function fetchStrategy() {
    const { data, error: fetchError } = await supabase
      .from('nc_strategies')
      .select('*')
      .eq('id', id)
      .eq('creator_id', user.id)
      .single();

    if (fetchError || !data) {
      navigate('/creator');
      return;
    }

    setForm({
      title: data.title || '',
      description: data.description || '',
      tags: data.tags || [],
      subscription_price: data.subscription_price || 0,
      risk_level: data.risk_level || 'medium',
      asset_class: data.asset_class || 'equities',
      strategy_type: data.strategy_type || 'manual',
      rules_description: data.rules_description || '',
      benchmark: data.benchmark || 'none',
    });
    setLoading(false);
  }

  function toggleTag(tag) {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  async function handleSubmit(e, status) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      tags: form.tags,
      subscription_price: Number(form.subscription_price) || 0,
      risk_level: form.risk_level,
      asset_class: form.asset_class,
      strategy_type: form.strategy_type,
      rules_description: form.strategy_type === 'automated' ? form.rules_description.trim() : null,
      benchmark: form.benchmark,
      status: status || 'draft',
    };

    let result;
    if (isEdit) {
      result = await supabase
        .from('nc_strategies')
        .update(payload)
        .eq('id', id)
        .eq('creator_id', user.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('nc_strategies')
        .insert({ ...payload, creator_id: user.id })
        .select()
        .single();
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    navigate('/creator');
  }

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>{isEdit ? 'Edit Strategy' : 'Create New Strategy'}</h1>
          <p className="subtitle">
            {isEdit ? 'Update your strategy details' : 'Define your trading strategy'}
          </p>
        </div>

        <div className="create-form-wrapper">
          <form className="contact-form" onSubmit={e => handleSubmit(e, 'draft')}>
            {error && <div className="notification error">{error}</div>}

            <div className="form-group">
              <label htmlFor="title">Strategy Title</label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., AI Momentum Equities"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your strategy, its approach, and what makes it unique..."
                rows={5}
              />
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="filter-tags">
                {STRATEGY_TAGS.map(tag => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    selected={form.tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="strategy_type">Strategy Type</label>
                <select
                  id="strategy_type"
                  value={form.strategy_type}
                  onChange={e => setForm({ ...form, strategy_type: e.target.value })}
                >
                  {STRATEGY_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t === 'automated' ? 'Automated (rule-based algo)' : 'Manual (creator trades)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="benchmark">Benchmark</label>
                <select
                  id="benchmark"
                  value={form.benchmark}
                  onChange={e => setForm({ ...form, benchmark: e.target.value })}
                >
                  {BENCHMARKS.map(b => (
                    <option key={b} value={b}>
                      {b === 'none' ? 'None' : b === 'sp500' ? 'S&P 500' : b === 'btc' ? 'Bitcoin' : 'Ethereum'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.strategy_type === 'automated' && (
              <div className="form-group">
                <label htmlFor="rules_description">Rules Description</label>
                <textarea
                  id="rules_description"
                  value={form.rules_description}
                  onChange={e => setForm({ ...form, rules_description: e.target.value })}
                  placeholder="Describe the rules that govern this automated strategy..."
                  rows={5}
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="risk_level">Risk Level</label>
                <select
                  id="risk_level"
                  value={form.risk_level}
                  onChange={e => setForm({ ...form, risk_level: e.target.value })}
                >
                  {RISK_LEVELS.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="asset_class">Asset Class</label>
                <select
                  id="asset_class"
                  value={form.asset_class}
                  onChange={e => setForm({ ...form, asset_class: e.target.value })}
                >
                  {ASSET_CLASSES.map(a => (
                    <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Subscription Price ($/mo)</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.subscription_price}
                  onChange={e => setForm({ ...form, subscription_price: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-secondary" disabled={saving}>
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={e => handleSubmit(e, 'active')}
              >
                {saving ? 'Publishing...' : 'Publish'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/creator')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateStrategy;
