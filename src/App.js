import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Amplify } from '@aws-amplify/core';

import awsConfig from './aws-config';
import './App.css';

// Configure Amplify
Amplify.configure(awsConfig);

// ─── Auth Context ──────────────────────────────────────────────────────────

const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  function checkAuth() {
    const idToken = localStorage.getItem('idToken');
    if (idToken) {
      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        setUser({
          userId: payload.sub,
          email: payload.email,
          name: payload.name || payload.email?.split('@')[0] || 'User',
        });
        setProfile({
          userId: payload.sub,
          email: payload.email,
          name: payload.name || payload.email?.split('@')[0] || 'User',
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error parsing token:', error);
        localStorage.removeItem('idToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
  }

  function handleSignIn() {
    const domain = 'us-east-1penywcxrn.auth.us-east-1.amazoncognito.com';
    const clientId = '6ehv64bhjglup1i0dkvo2a8m68';
    const redirectUri = window.location.origin + '/callback';
    const url = `https://${domain}/login?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;
    window.location.href = url;
  }

  function handleSignOut() {
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  }

  const value = {
    user,
    profile,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// ─── Navbar ────────────────────────────────────────────────────────────────

function Navbar() {
  const { user, signIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo">
          <svg width="160" height="48" viewBox="0 0 160 48">
            <text x="0" y="36" fontFamily="Inter, sans-serif" fontSize="32" fontWeight="700" fill="#2563eb">
              NowCast
            </text>
          </svg>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/features" onClick={() => setMenuOpen(false)}>Features</Link>
          <Link to="/solutions" onClick={() => setMenuOpen(false)}>Solutions</Link>
          <Link to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={signOut} className="btn btn-secondary">Sign Out</button>
            </>
          ) : (
            <button onClick={signIn} className="btn btn-primary">Sign In</button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-section">
            <h4>NowCast</h4>
            <p>The marketplace for trading and investment strategies.</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <Link to="/features">Features</Link>
            <Link to="/solutions">Solutions</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>info@nowcast.com</p>
            <p>(585) 910-9581</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} NowCast. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────

function LandingPage() {
  const { signIn } = useAuth();

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Trade Smarter with Proven Strategies</h1>
          <p className="hero-subtitle">
            The marketplace where top strategy creators publish proprietary trading
            strategies for equities and crypto — and you subscribe to the ones that
            fit your goals.
          </p>
          <div className="hero-buttons">
            <Link to="/pricing" className="btn btn-primary btn-lg">Browse Strategies</Link>
            <Link to="/solutions" className="btn btn-secondary btn-lg">Become a Creator</Link>
          </div>
        </div>
      </section>

      {/* Why NowCast */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Why NowCast?</h2>
          <div className="card-grid cols-3">
            <div className="card">
              <div className="card-icon">🎯</div>
              <h3>Curated Strategies</h3>
              <p>Every strategy on NowCast is published by vetted creators with verified track records. No noise, no guesswork — just proven approaches to the markets.</p>
            </div>
            <div className="card">
              <div className="card-icon">📊</div>
              <h3>Transparent Performance</h3>
              <p>Full historical performance data, risk metrics, and real-time results. You see exactly how a strategy performs before you subscribe.</p>
            </div>
            <div className="card">
              <div className="card-icon">🌐</div>
              <h3>Equities & Crypto</h3>
              <p>Whether you trade stocks, ETFs, or digital assets, NowCast has strategies built for every market and every risk appetite.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="card-grid cols-3">
            <div className="card text-center">
              <div className="step-number">1</div>
              <h3>Discover</h3>
              <p>Browse strategies by asset class, risk level, time horizon, and historical performance.</p>
            </div>
            <div className="card text-center">
              <div className="step-number">2</div>
              <h3>Subscribe</h3>
              <p>Pick the strategies that match your goals and subscribe with one click.</p>
            </div>
            <div className="card text-center">
              <div className="step-number">3</div>
              <h3>Profit</h3>
              <p>Receive real-time signals and trade alerts from your subscribed strategies.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Sides */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Built for Two Sides of the Market</h2>
          <div className="card-grid cols-3">
            <div className="card">
              <div className="card-icon">✏️</div>
              <h3>Strategy Creators</h3>
              <p>Monetize your trading edge. Publish proprietary strategies, build a subscriber base, and earn recurring revenue from your expertise.</p>
            </div>
            <div className="card">
              <div className="card-icon">👤</div>
              <h3>Subscribers</h3>
              <p>Access institutional-quality strategies without building them yourself. Subscribe, follow signals, and diversify across multiple proven approaches.</p>
            </div>
            <div className="card">
              <div className="card-icon">🛡️</div>
              <h3>Trust & Transparency</h3>
              <p>Every strategy has a verified track record. Performance is audited, risk metrics are public, and creator credentials are vetted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section-cta">
        <div className="container text-center">
          <h2>Ready to trade smarter?</h2>
          <p className="cta-subtitle">Join NowCast and access proven strategies from top creators.</p>
          <button onClick={signIn} className="btn btn-primary btn-lg">Get Started with Google</button>
        </div>
      </section>
    </div>
  );
}

// ─── Features Page ─────────────────────────────────────────────────────────

function FeaturesPage() {
  return (
    <div className="page">
      <div className="page-hero">
        <div className="container">
          <h1>Platform Features</h1>
          <p className="page-subtitle">Everything strategy creators need to publish and monetize — and everything subscribers need to discover and follow winning strategies.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <h2 className="section-title">For Strategy Creators</h2>
          <div className="card-grid cols-3">
            <div className="card">
              <div className="card-icon">🛠️</div>
              <h3>Strategy Builder</h3>
              <p>Define your trading logic, entry and exit rules, position sizing, and risk parameters through an intuitive strategy editor. Support for equities, ETFs, and crypto assets.</p>
            </div>
            <div className="card">
              <div className="card-icon">📈</div>
              <h3>Backtesting Engine</h3>
              <p>Test your strategies against years of historical market data before publishing. Validate performance across bull markets, bear markets, and everything in between.</p>
            </div>
            <div className="card">
              <div className="card-icon">📋</div>
              <h3>Creator Dashboard</h3>
              <p>Track your subscriber count, revenue, strategy performance, and audience analytics in one place. Understand what's working and optimize your offerings.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">For Subscribers</h2>
          <div className="card-grid cols-3">
            <div className="card">
              <div className="card-icon">🔔</div>
              <h3>Real-time Trade Signals</h3>
              <p>Get instant notifications when your subscribed strategies generate buy or sell signals. Never miss a trade — alerts via email, SMS, or in-app push notifications.</p>
            </div>
            <div className="card">
              <div className="card-icon">📊</div>
              <h3>Performance Analytics</h3>
              <p>Deep-dive into any strategy's historical returns, drawdowns, Sharpe ratio, win rate, and risk-adjusted performance. Compare strategies side by side.</p>
            </div>
            <div className="card">
              <div className="card-icon">💼</div>
              <h3>Portfolio View</h3>
              <p>See all your active strategy subscriptions in one unified dashboard. Track combined performance, exposure, and allocation across your entire strategy portfolio.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Platform-Wide</h2>
          <div className="card-grid cols-3">
            <div className="card">
              <div className="card-icon">✅</div>
              <h3>Verified Track Records</h3>
              <p>All strategy performance is independently verified and audited. No cherry-picked results — what you see is what actually happened in real market conditions.</p>
            </div>
            <div className="card">
              <div className="card-icon">⚠️</div>
              <h3>Risk Management Tools</h3>
              <p>Built-in risk scoring for every strategy. Set personal risk limits, get alerts when strategies exceed drawdown thresholds, and manage your overall exposure.</p>
            </div>
            <div className="card">
              <div className="card-icon">🔍</div>
              <h3>Marketplace Search & Filters</h3>
              <p>Find strategies by asset class, risk level, time horizon, minimum track record length, historical returns, and creator reputation.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Solutions Page ────────────────────────────────────────────────────────

function SolutionsPage() {
  return (
    <div className="page">
      <div className="page-hero">
        <div className="container">
          <h1>Solutions</h1>
          <p className="page-subtitle">Whether you build strategies or follow them, NowCast gives you the tools and marketplace to succeed.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <h2 className="section-title">For Strategy Creators</h2>
          <p className="section-description">You've spent years developing your trading edge. Now turn it into a business.</p>
          <div className="card-grid cols-3">
            <div className="card">
              <h3>Monetize Your Expertise</h3>
              <p>Publish your proprietary strategies and set your own subscription price. You keep 80% of every dollar your subscribers pay — NowCast handles billing, delivery, and infrastructure.</p>
            </div>
            <div className="card">
              <h3>Build Your Reputation</h3>
              <p>Your verified track record speaks for itself. As your strategies perform, your creator profile grows — attracting more subscribers and more revenue organically.</p>
            </div>
            <div className="card">
              <h3>Focus on Alpha</h3>
              <p>You focus on generating returns. We handle everything else — the platform, the subscriber management, the analytics, the payments, and the marketing exposure.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">For Subscribers</h2>
          <p className="section-description">Stop guessing. Start following strategies with real track records.</p>
          <div className="card-grid cols-3">
            <div className="card">
              <h3>Access Proven Strategies</h3>
              <p>Browse a curated marketplace of strategies across equities and crypto. Every strategy has verified performance data — no black boxes, no hype, just results.</p>
            </div>
            <div className="card">
              <h3>Diversify Your Approach</h3>
              <p>Subscribe to multiple strategies across different asset classes, time horizons, and risk profiles. Build a diversified portfolio of approaches rather than relying on a single bet.</p>
            </div>
            <div className="card">
              <h3>Trade with Confidence</h3>
              <p>Receive real-time trade signals directly from the strategies you follow. Know exactly when to enter and exit positions — backed by data, not emotion.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Supported Markets</h2>
          <p className="section-description">Strategies across the asset classes that matter most.</p>
          <div className="card-grid cols-3">
            <div className="card">
              <div className="card-icon">📈</div>
              <h3>Equities</h3>
              <p>US stocks, international markets, ETFs, sector rotations, momentum plays, value strategies, and more. From day trading to long-term investing.</p>
            </div>
            <div className="card">
              <div className="card-icon">₿</div>
              <h3>Cryptocurrency</h3>
              <p>Bitcoin, Ethereum, altcoins, and DeFi strategies. Swing trading, trend following, mean reversion, and yield strategies across the crypto ecosystem.</p>
            </div>
            <div className="card">
              <div className="card-icon">🌍</div>
              <h3>Multi-Asset</h3>
              <p>Cross-asset strategies that combine equities and crypto for diversified exposure. Macro-driven approaches that allocate dynamically based on market conditions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cta">
        <div className="container text-center">
          <h2>Ready to Get Started?</h2>
          <p className="cta-subtitle">Whether you're a creator or a subscriber, NowCast is where strategies meet the market.</p>
          <div className="hero-buttons" style={{ justifyContent: 'center' }}>
            <Link to="/contact" className="btn btn-primary btn-lg">Join NowCast</Link>
            <Link to="/pricing" className="btn btn-secondary btn-lg">View Pricing</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Pricing Page ──────────────────────────────────────────────────────────

function PricingPage() {
  const { signIn } = useAuth();

  return (
    <div className="page">
      <div className="page-hero">
        <div className="container">
          <h1>Pricing</h1>
          <p className="page-subtitle">Transparent pricing for subscribers and creators. No hidden fees, no surprises.</p>
        </div>
      </div>

      {/* Subscriber Pricing */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">For Subscribers</h2>
          <p className="section-description">Choose the plan that matches your trading style. Upgrade or downgrade anytime.</p>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Explorer</h3>
              <div className="price">Free</div>
              <ul className="pricing-features">
                <li>Browse all strategies</li>
                <li>View full performance history</li>
                <li>1 active strategy subscription</li>
                <li>Delayed trade signals</li>
                <li>Community access</li>
              </ul>
              <button onClick={signIn} className="btn btn-secondary" style={{ width: '100%' }}>Sign Up Free</button>
            </div>

            <div className="pricing-card featured">
              <div className="featured-badge">Most Popular</div>
              <h3>Trader</h3>
              <div className="price">$29<span>/month</span></div>
              <ul className="pricing-features">
                <li>Unlimited strategy subscriptions</li>
                <li>Real-time trade signals</li>
                <li>Advanced analytics & risk tools</li>
                <li>Portfolio-level performance view</li>
                <li>Priority support</li>
              </ul>
              <button onClick={signIn} className="btn btn-primary" style={{ width: '100%' }}>Start Trading</button>
            </div>

            <div className="pricing-card">
              <h3>Trader Pro</h3>
              <div className="price">$79<span>/month</span></div>
              <ul className="pricing-features">
                <li>Everything in Trader</li>
                <li>API access for automated execution</li>
                <li>Custom alerts & webhooks</li>
                <li>Strategy comparison tools</li>
                <li>Dedicated account manager</li>
              </ul>
              <button onClick={signIn} className="btn btn-secondary" style={{ width: '100%' }}>Go Pro</button>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Pricing */}
      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">For Strategy Creators</h2>
          <p className="section-description">Free to publish. You earn when your subscribers pay.</p>
          <div className="pricing-grid" style={{ maxWidth: '700px' }}>
            <div className="pricing-card featured">
              <h3>Creator</h3>
              <div className="price">Free to publish</div>
              <ul className="pricing-features">
                <li>Publish unlimited strategies</li>
                <li>Set your own subscription price</li>
                <li>Keep 80% of subscriber revenue</li>
                <li>Backtesting engine access</li>
                <li>Creator analytics dashboard</li>
                <li>Subscriber management tools</li>
                <li>Verified track record badge</li>
              </ul>
              <button onClick={signIn} className="btn btn-primary" style={{ width: '100%' }}>Start Creating</button>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3>How Creator Revenue Works</h3>
              <p style={{ marginBottom: '16px' }}>You set the price for each strategy. Subscribers pay that price monthly. NowCast takes a 20% platform fee and you keep the rest.</p>
              <p style={{ marginBottom: '16px' }}><strong>Example:</strong> If you price a strategy at $50/month and have 100 subscribers, you earn $4,000/month.</p>
              <p>Payouts are processed monthly. No upfront costs, no listing fees, no minimums.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="card">
              <h3>Do subscribers pay per strategy on top of the platform fee?</h3>
              <p>The platform fee (Explorer/Trader/Trader Pro) gives you access to the marketplace and tools. Individual strategy subscriptions are priced separately by each creator.</p>
            </div>
            <div className="card">
              <h3>Can I cancel anytime?</h3>
              <p>Yes. Both platform subscriptions and individual strategy subscriptions can be cancelled at any time. No lock-in contracts.</p>
            </div>
            <div className="card">
              <h3>How are strategy track records verified?</h3>
              <p>All strategies go through our verification process. Performance is calculated from actual signal history on the platform — no self-reported or hypothetical returns.</p>
            </div>
            <div className="card">
              <h3>Is there a minimum track record to publish?</h3>
              <p>New strategies start with a "New" badge. After 90 days of live signals on the platform, they earn a "Verified" badge with audited performance data.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── About Page ────────────────────────────────────────────────────────────

function AboutPage() {
  return (
    <div className="page">
      <div className="page-hero">
        <div className="container">
          <h1>About NowCast</h1>
          <p className="page-subtitle">Building the marketplace that connects strategy creators with the traders who need them.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="about-mission">
            <div className="mission-text">
              <h2>Our Mission</h2>
              <p>The best trading strategies in the world are locked inside the heads of individual traders and small firms. Meanwhile, millions of retail traders are looking for an edge — and getting noise instead of signal.</p>
              <p>NowCast exists to fix that. We're building the marketplace that lets strategy creators publish their proprietary approaches to the markets, and lets subscribers discover, evaluate, and follow the strategies that fit their goals.</p>
              <p>Transparent performance. Verified track records. Fair revenue sharing. That's it.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container text-center">
          <h2 className="section-title">Our Team</h2>
          <p className="section-description">Meet the founder behind NowCast</p>
          <div className="team-section">
            <div className="team-member">
              <h3>Rajan Anand</h3>
              <p className="team-role">Founder & CEO</p>
              <a
                href="https://www.linkedin.com/in/rajan-anand/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ fontSize: '14px', padding: '8px 20px' }}
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Our Values</h2>
          <div className="card-grid cols-4">
            <div className="card text-center">
              <div className="card-icon">👁️</div>
              <h3>Transparency</h3>
              <p>Every strategy's performance is public and verified. No hidden results, no cherry-picked data.</p>
            </div>
            <div className="card text-center">
              <div className="card-icon">🏆</div>
              <h3>Meritocracy</h3>
              <p>The best strategies rise to the top. Creators succeed based on performance, not marketing.</p>
            </div>
            <div className="card text-center">
              <div className="card-icon">🛡️</div>
              <h3>Trust</h3>
              <p>Verified creators, audited track records, and fair revenue sharing build lasting trust.</p>
            </div>
            <div className="card text-center">
              <div className="card-icon">🔓</div>
              <h3>Access</h3>
              <p>Institutional-quality strategies shouldn't be gatekept. Everyone deserves a real edge.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cta">
        <div className="container text-center">
          <h2>Join the Marketplace</h2>
          <p className="cta-subtitle">Whether you create strategies or follow them, NowCast is where the market meets.</p>
          <Link to="/contact" className="btn btn-primary btn-lg">Get Started</Link>
        </div>
      </section>
    </div>
  );
}

// ─── Contact Page ──────────────────────────────────────────────────────────

function ContactPage() {
  const [formState, setFormState] = useState({
    inquiry_type: 'subscriber',
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [status, setStatus] = useState(null); // 'sending' | 'success' | 'error'

  function handleChange(e) {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('https://formspree.io/f/xbdgeokl', {
        method: 'POST',
        body: JSON.stringify(formState),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });

      if (response.ok) {
        setStatus('success');
        setFormState({ inquiry_type: 'subscriber', name: '', email: '', company: '', message: '' });
        setTimeout(() => setStatus(null), 5000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus(null), 5000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus(null), 5000);
    }
  }

  return (
    <div className="page">
      <div className="page-hero">
        <div className="container">
          <h1>Get in Touch</h1>
          <p className="page-subtitle">Whether you want to publish strategies, subscribe to them, or just learn more — we'd love to hear from you.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="contact-form-wrapper">
            {status === 'success' && (
              <div className="notification success">Thank you for reaching out! We'll get back to you soon.</div>
            )}
            {status === 'error' && (
              <div className="notification error">Something went wrong. Please try again.</div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="inquiry_type">I'm interested in...</label>
                <select id="inquiry_type" name="inquiry_type" value={formState.inquiry_type} onChange={handleChange} required>
                  <option value="subscriber">Subscribing to strategies</option>
                  <option value="creator">Publishing strategies as a creator</option>
                  <option value="partnership">Partnership opportunities</option>
                  <option value="general">General inquiry</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" type="text" placeholder="Your Name" value={formState.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="Your Email" value={formState.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="company">Company (optional)</label>
                <input id="company" name="company" type="text" placeholder="Your Company or Fund" value={formState.company} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell us about your trading background, what markets you're interested in, or any questions you have."
                  value={formState.message}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Dashboard (Protected) ────────────────────────────────────────────────

function Dashboard() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {profile?.name || 'User'}!</h1>
          <p className="subtitle">Your strategy dashboard</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Profile</h3>
            <div className="profile-info">
              <p><strong>Email:</strong> {profile?.email}</p>
              <p><strong>User ID:</strong> {profile?.userId?.slice(0, 8)}...</p>
              <p><strong>Member since:</strong> {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>My Subscriptions</h3>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-value">0</span>
                <span className="stat-label">Active Strategies</span>
              </div>
              <div className="stat">
                <span className="stat-value">--</span>
                <span className="stat-label">Combined Return</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card full-width">
            <h3>Recent Signals</h3>
            <p className="empty-state">No signals yet. Subscribe to a strategy to start receiving trade alerts.</p>
          </div>

          <div className="dashboard-card full-width">
            <h3>Strategy Marketplace</h3>
            <p className="empty-state">
              Browse strategies in the <Link to="/pricing">marketplace</Link> and subscribe to start trading.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Callback (OAuth) ──────────────────────────────────────────────────────

function Callback() {
  const [status, setStatus] = useState('Processing sign-in...');

  useEffect(() => {
    async function handleCallback() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      const hashUrlParams = new URLSearchParams(window.location.hash.substring(1));
      const idToken = hashUrlParams.get('id_token');

      if (!code && !idToken) {
        setStatus('No authorization code found. Please try again.');
        return;
      }

      if (idToken) {
        localStorage.setItem('idToken', idToken);
        const accessToken = hashUrlParams.get('access_token');
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        setStatus('Sign-in successful! Redirecting...');
        setTimeout(() => { window.location.href = '/dashboard'; }, 500);
        return;
      }

      try {
        const tokenEndpoint = 'https://us-east-1penywcxrn.auth.us-east-1.amazoncognito.com/oauth2/token';
        const clientId = '6ehv64bhjglup1i0dkvo2a8m68';
        const redirectUri = window.location.origin + '/callback';

        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            code: code,
            redirect_uri: redirectUri,
          }),
        });

        if (!response.ok) throw new Error('Token exchange failed');

        const tokens = await response.json();
        localStorage.setItem('idToken', tokens.id_token);
        localStorage.setItem('accessToken', tokens.access_token);
        localStorage.setItem('refreshToken', tokens.refresh_token);

        setStatus('Sign-in successful! Redirecting...');
        setTimeout(() => { window.location.href = '/dashboard'; }, 500);
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('Sign-in failed. Please try again.');
      }
    }

    handleCallback();
  }, []);

  return (
    <div className="callback">
      <div className="container">
        <div className="callback-card">
          <div className="spinner"></div>
          <p>{status}</p>
        </div>
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/callback" element={<Callback />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/solutions" element={<SolutionsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
