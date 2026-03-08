import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Landing() {
  const { signIn } = useAuth();

  return (
    <div className="landing">
      <section className="hero">
        <div className="container">
          <h1>Trade Smarter with Proven Strategies</h1>
          <p className="hero-subtitle">
            The marketplace where top strategy creators publish proprietary trading
            strategies for equities and crypto — and you subscribe to the ones that
            fit your goals.
          </p>
          <div className="hero-buttons">
            <Link to="/marketplace" className="btn btn-primary btn-lg">Browse Strategies</Link>
            <Link to="/solutions" className="btn btn-secondary btn-lg">Become a Creator</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Why NowCast?</h2>
          <div className="card-grid cols-3">
            <div className="card">
              <div className="card-icon">&#127919;</div>
              <h3>Curated Strategies</h3>
              <p>Every strategy on NowCast is published by vetted creators with verified track records. No noise, no guesswork — just proven approaches to the markets.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#128202;</div>
              <h3>Transparent Performance</h3>
              <p>Full historical performance data, risk metrics, and real-time results. You see exactly how a strategy performs before you subscribe.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#127760;</div>
              <h3>Equities & Crypto</h3>
              <p>Whether you trade stocks, ETFs, or digital assets, NowCast has strategies built for every market and every risk appetite.</p>
            </div>
          </div>
        </div>
      </section>

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

      <section className="section">
        <div className="container">
          <h2 className="section-title">Built for Two Sides of the Market</h2>
          <div className="card-grid cols-3">
            <div className="card">
              <div className="card-icon">&#9998;&#65039;</div>
              <h3>Strategy Creators</h3>
              <p>Monetize your trading edge. Publish proprietary strategies, build a subscriber base, and earn recurring revenue from your expertise.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#128100;</div>
              <h3>Subscribers</h3>
              <p>Access institutional-quality strategies without building them yourself. Subscribe, follow signals, and diversify across multiple proven approaches.</p>
            </div>
            <div className="card">
              <div className="card-icon">&#128737;&#65039;</div>
              <h3>Trust & Transparency</h3>
              <p>Every strategy has a verified track record. Performance is audited, risk metrics are public, and creator credentials are vetted.</p>
            </div>
          </div>
        </div>
      </section>

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

export default Landing;
