import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Pricing() {
  const { signIn } = useAuth();

  return (
    <div className="page">
      <div className="page-hero">
        <div className="container">
          <h1>Pricing</h1>
          <p className="page-subtitle">Transparent pricing for subscribers and creators. No hidden fees, no surprises.</p>
        </div>
      </div>

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
              <button onClick={signIn} className="btn btn-secondary btn-full">Sign Up Free</button>
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
              <button onClick={signIn} className="btn btn-primary btn-full">Start Trading</button>
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
              <button onClick={signIn} className="btn btn-secondary btn-full">Go Pro</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">For Strategy Creators</h2>
          <p className="section-description">Free to publish. You earn when your subscribers pay.</p>
          <div className="pricing-grid pricing-grid-narrow">
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
              <button onClick={signIn} className="btn btn-primary btn-full">Start Creating</button>
            </div>

            <div className="card revenue-card">
              <h3>How Creator Revenue Works</h3>
              <p>You set the price for each strategy. Subscribers pay that price monthly. NowCast takes a 20% platform fee and you keep the rest.</p>
              <p><strong>Example:</strong> If you price a strategy at $50/month and have 100 subscribers, you earn $4,000/month.</p>
              <p>Payouts are processed monthly. No upfront costs, no listing fees, no minimums.</p>
            </div>
          </div>
        </div>
      </section>

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

export default Pricing;
