import React from 'react';
import { Link } from 'react-router-dom';

function About() {
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

      <section className="section">
        <div className="container">
          <h2 className="section-title">Our Values</h2>
          <div className="card-grid cols-4">
            <div className="card text-center">
              <div className="card-icon">&#128065;&#65039;</div>
              <h3>Transparency</h3>
              <p>Every strategy's performance is public and verified. No hidden results, no cherry-picked data.</p>
            </div>
            <div className="card text-center">
              <div className="card-icon">&#127942;</div>
              <h3>Meritocracy</h3>
              <p>The best strategies rise to the top. Creators succeed based on performance, not marketing.</p>
            </div>
            <div className="card text-center">
              <div className="card-icon">&#128737;&#65039;</div>
              <h3>Trust</h3>
              <p>Verified creators, audited track records, and fair revenue sharing build lasting trust.</p>
            </div>
            <div className="card text-center">
              <div className="card-icon">&#128275;</div>
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

export default About;
