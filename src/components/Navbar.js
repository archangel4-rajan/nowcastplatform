import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo">
          <img src="/logo-icon.png" alt="" className="logo-icon" />
          <span className="logo-text">NowCast</span>
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
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              {profile?.role === 'creator' && (
                <Link to="/creator" onClick={() => setMenuOpen(false)}>Creator Studio</Link>
              )}
              <div className="nav-user">
                <span className="nav-user-name">{profile?.name || 'User'}</span>
                <button onClick={signOut} className="btn btn-secondary btn-sm">Sign Out</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/features" onClick={() => setMenuOpen(false)}>Features</Link>
              <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
              <Link to="/login" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Sign In</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
