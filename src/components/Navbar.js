import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, profile, signIn, signOut } = useAuth();
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
          {menuOpen ? '\u2715' : '\u2630'}
        </button>

        <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/marketplace" onClick={() => setMenuOpen(false)}>Marketplace</Link>
          <Link to="/features" onClick={() => setMenuOpen(false)}>Features</Link>
          <Link to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              {profile?.role === 'creator' && (
                <Link to="/creator" onClick={() => setMenuOpen(false)}>Creator</Link>
              )}
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

export default Navbar;
