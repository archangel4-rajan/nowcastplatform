import React from 'react';

function Features() {
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
              <div className="card-icon">&#128736;&#65039;</div>
              <h3>Strategy Builder</h3>
              <p>Define your trading logic, entry and exit rules, position sizing, and risk parameters through an intuitive strategy editor. Support for equities, ETFs, and crypto assets.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#128200;</div>
              <h3>Backtesting Engine</h3>
              <p>Test your strategies against years of historical market data before publishing. Validate performance across bull markets, bear markets, and everything in between.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#128203;</div>
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
              <div className="card-icon">&#128276;</div>
              <h3>Real-time Trade Signals</h3>
              <p>Get instant notifications when your subscribed strategies generate buy or sell signals. Never miss a trade — alerts via email, SMS, or in-app push notifications.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#128202;</div>
              <h3>Performance Analytics</h3>
              <p>Deep-dive into any strategy's historical returns, drawdowns, Sharpe ratio, win rate, and risk-adjusted performance. Compare strategies side by side.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#128188;</div>
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
              <div className="card-icon">&#9989;</div>
              <h3>Verified Track Records</h3>
              <p>All strategy performance is independently verified and audited. No cherry-picked results — what you see is what actually happened in real market conditions.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#9888;&#65039;</div>
              <h3>Risk Management Tools</h3>
              <p>Built-in risk scoring for every strategy. Set personal risk limits, get alerts when strategies exceed drawdown thresholds, and manage your overall exposure.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#128269;</div>
              <h3>Marketplace Search & Filters</h3>
              <p>Find strategies by asset class, risk level, time horizon, minimum track record length, historical returns, and creator reputation.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Features;
