import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TEST_ACCOUNTS = [
  { label: 'Admin', email: 'admin@nowcastplatform.com', role: 'admin' },
  { label: 'Creator', email: 'creator@nowcastplatform.com', role: 'creator' },
  { label: 'User', email: 'user@nowcastplatform.com', role: 'user' },
];

function Login() {
  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    }
    setLoading(false);
  }

  function fillTestAccount(account) {
    setEmail(account.email);
    setPassword('testpass123');
    setError('');
  }

  return (
    <div className="page">
      <div className="page-hero">
        <div className="container">
          <h1>Sign In</h1>
          <p className="page-subtitle">Sign in to access your dashboard, subscribe to strategies, or manage your creator profile.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="contact-form-wrapper">
            {error && <div className="notification error">{error}</div>}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="test-accounts">
              <h4>Test Accounts</h4>
              <p className="test-accounts-hint">Click to fill credentials (password: <code>testpass123</code>)</p>
              <div className="test-accounts-grid">
                {TEST_ACCOUNTS.map(account => (
                  <button
                    key={account.email}
                    className="test-account-btn"
                    onClick={() => fillTestAccount(account)}
                    type="button"
                  >
                    <span className="test-account-label">{account.label}</span>
                    <span className="test-account-email">{account.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
