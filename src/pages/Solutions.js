import React from 'react';
import { Link } from 'react-router-dom';

function Solutions() {
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
              <div className="card-icon">&#128200;</div>
              <h3>Equities</h3>
              <p>US stocks, international markets, ETFs, sector rotations, momentum plays, value strategies, and more. From day trading to long-term investing.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#8383;</div>
              <h3>Cryptocurrency</h3>
              <p>Bitcoin, Ethereum, altcoins, and DeFi strategies. Swing trading, trend following, mean reversion, and yield strategies across the crypto ecosystem.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#127757;</div>
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
            <Link to="/features" className="btn btn-secondary btn-lg">View Features</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Solutions;
