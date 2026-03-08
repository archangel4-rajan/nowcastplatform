import React from 'react';
import { Link } from 'react-router-dom';

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
            <Link to="/marketplace">Marketplace</Link>
            <Link to="/features">Features</Link>
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

export default Footer;
