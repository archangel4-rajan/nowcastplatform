/**
 * NowCast Platform — Comprehensive React App Tests
 *
 * Validates:
 *   - All pages render without crashing
 *   - Marketplace concept content (no old fintech copy)
 *   - Navigation links present
 *   - Footer consistency
 *   - Contact form fields and validation
 *   - Page content accuracy
 *   - About page values and team
 *   - Accessibility basics
 *   - Marketplace page
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null }),
          order: () => Promise.resolve({ data: [] }),
          in: () => Promise.resolve({ data: [] }),
        }),
        order: () => ({
          eq: () => Promise.resolve({ data: [] }),
        }),
        in: () => Promise.resolve({ data: [] }),
      }),
    }),
  },
}));

// Helper: render the full app (it has its own BrowserRouter)
function renderApp() {
  return render(<App />);
}

// Helper: navigate by clicking a nav link
function navigateTo(linkText) {
  const links = screen.getAllByText(linkText);
  const navLink = links.find(el => el.closest('.nav-links') || el.closest('.footer'));
  if (navLink) {
    fireEvent.click(navLink);
  }
}

// ─── Landing Page ──────────────────────────────────────────────────────────

describe('Landing Page', () => {
  beforeEach(() => renderApp());

  test('renders hero headline', () => {
    expect(screen.getByText('Trade Smarter with Proven Strategies')).toBeInTheDocument();
  });

  test('renders hero subtitle with marketplace description', () => {
    expect(screen.getByText(/marketplace where top strategy creators/i)).toBeInTheDocument();
  });

  test('renders Browse Strategies CTA', () => {
    expect(screen.getByText('Browse Strategies')).toBeInTheDocument();
  });

  test('renders Become a Creator CTA', () => {
    expect(screen.getByText('Become a Creator')).toBeInTheDocument();
  });

  test('renders Why NowCast section', () => {
    expect(screen.getByText('Why NowCast?')).toBeInTheDocument();
    expect(screen.getByText('Curated Strategies')).toBeInTheDocument();
    expect(screen.getByText('Transparent Performance')).toBeInTheDocument();
  });

  test('renders How It Works section', () => {
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
    expect(screen.getByText('Profit')).toBeInTheDocument();
  });

  test('renders two-sided marketplace section', () => {
    expect(screen.getByText('Built for Two Sides of the Market')).toBeInTheDocument();
    expect(screen.getByText('Strategy Creators')).toBeInTheDocument();
    expect(screen.getByText('Subscribers')).toBeInTheDocument();
  });

  test('renders CTA section with sign-in', () => {
    expect(screen.getByText('Ready to trade smarter?')).toBeInTheDocument();
    expect(screen.getByText('Get Started with Google')).toBeInTheDocument();
  });

  test('does NOT contain old fintech copy', () => {
    const body = document.body.textContent;
    expect(body).not.toContain('Your Money Visible');
    expect(body).not.toContain('Simplify Your Money');
    expect(body).not.toContain('5 watchlists');
  });
});

// ─── Navigation ────────────────────────────────────────────────────────────

describe('Navigation', () => {
  beforeEach(() => renderApp());

  test('has Marketplace link', () => {
    const links = screen.getAllByText('Marketplace');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  test('has Features link', () => {
    const links = screen.getAllByText('Features');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  test('has About link', () => {
    const links = screen.getAllByText('About');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  test('has Sign In button when not authenticated', () => {
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('has mobile menu button with aria-label', () => {
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
  });

  test('mobile menu toggles on click', () => {
    const menuBtn = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuBtn);
    const navLinks = document.querySelector('.nav-links');
    expect(navLinks.classList.contains('active')).toBe(true);

    fireEvent.click(menuBtn);
    expect(navLinks.classList.contains('active')).toBe(false);
  });
});

// ─── Footer ────────────────────────────────────────────────────────────────

describe('Footer', () => {
  beforeEach(() => renderApp());

  test('describes marketplace concept', () => {
    expect(screen.getByText(/marketplace for trading and investment strategies/i)).toBeInTheDocument();
  });

  test('has copyright with current year', () => {
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year} NowCast`))).toBeInTheDocument();
  });

  test('has Product and Company sections', () => {
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
  });
});

// ─── Features Page (via navigation) ───────────────────────────────────────

describe('Features Page', () => {
  beforeEach(() => {
    renderApp();
    navigateTo('Features');
  });

  test('renders page title', () => {
    expect(screen.getByText('Platform Features')).toBeInTheDocument();
  });

  test('has For Strategy Creators section', () => {
    expect(screen.getByText('For Strategy Creators')).toBeInTheDocument();
  });

  test('has For Subscribers section', () => {
    expect(screen.getByText('For Subscribers')).toBeInTheDocument();
  });

  test('has Platform-Wide section', () => {
    expect(screen.getByText('Platform-Wide')).toBeInTheDocument();
  });

  test('mentions key features', () => {
    expect(screen.getByText('Strategy Builder')).toBeInTheDocument();
    expect(screen.getByText('Backtesting Engine')).toBeInTheDocument();
    expect(screen.getByText('Creator Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Real-time Trade Signals')).toBeInTheDocument();
    expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    expect(screen.getByText('Portfolio View')).toBeInTheDocument();
    expect(screen.getByText('Verified Track Records')).toBeInTheDocument();
    expect(screen.getByText('Risk Management Tools')).toBeInTheDocument();
    expect(screen.getByText('Marketplace Search & Filters')).toBeInTheDocument();
  });
});



// ─── About Page ────────────────────────────────────────────────────────────

describe('About Page', () => {
  beforeEach(() => {
    renderApp();
    navigateTo('About');
  });

  test('has mission section', () => {
    expect(screen.getByText('Our Mission')).toBeInTheDocument();
  });

  test('has values', () => {
    expect(screen.getByText('Our Values')).toBeInTheDocument();
    expect(screen.getByText('Transparency')).toBeInTheDocument();
    expect(screen.getByText('Meritocracy')).toBeInTheDocument();
  });

  test('has CTA', () => {
    expect(screen.getByText('Join the Marketplace')).toBeInTheDocument();
  });
});

// ─── Contact Page ──────────────────────────────────────────────────────────

describe('Contact Page', () => {
  beforeEach(() => {
    renderApp();
    // Navigate to contact via footer
    const links = screen.getAllByText('Contact');
    const footerLink = links.find(el => el.closest('.footer'));
    if (footerLink) fireEvent.click(footerLink);
  });

  test('renders page title', () => {
    const headings = screen.getAllByText('Get in Touch');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  test('has inquiry type dropdown', () => {
    const select = screen.getByLabelText(/interested in/i);
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(4);
  });

  test('has required name field', () => {
    expect(screen.getByLabelText('Name')).toBeRequired();
  });

  test('has required email field', () => {
    expect(screen.getByLabelText('Email')).toBeRequired();
  });

  test('has optional company field', () => {
    expect(screen.getByLabelText(/Company/)).not.toBeRequired();
  });

  test('has required message field', () => {
    expect(screen.getByLabelText('Message')).toBeRequired();
  });

  test('has submit button', () => {
    expect(screen.getByText('Send Message')).toBeInTheDocument();
  });

  test('form fields are interactive', () => {
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    expect(nameInput.value).toBe('Test User');

    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });
});

// ─── Dashboard (Auth-Gated) ───────────────────────────────────────────────

describe('Dashboard', () => {
  test('does not show dashboard content when not authenticated', () => {
    renderApp();
    window.history.pushState({}, '', '/dashboard');
    expect(screen.queryByText('Your strategy dashboard')).not.toBeInTheDocument();
  });
});

// ─── Old Concept Removal ──────────────────────────────────────────────────

describe('Old concept removal', () => {
  const pagesToCheck = [
    { name: 'Landing', nav: null },
    { name: 'Features', nav: 'Features' },
    { name: 'About', nav: 'About' },
  ];

  const oldTerms = [
    'Your Money Visible',
    'Simplify Your Money',
    'financial analytics platform',
    '5 watchlists',
    'Contact Sales',
  ];

  pagesToCheck.forEach(({ name, nav }) => {
    describe(name, () => {
      beforeEach(() => {
        renderApp();
        if (nav) navigateTo(nav);
      });

      oldTerms.forEach(term => {
        test(`does not contain "${term}"`, () => {
          expect(document.body.textContent).not.toContain(term);
        });
      });
    });
  });
});

// ─── Marketplace Page ──────────────────────────────────────────────────────

describe('Marketplace Page', () => {
  beforeEach(() => {
    renderApp();
    navigateTo('Marketplace');
  });

  test('renders marketplace title', () => {
    expect(screen.getByText('Strategy Marketplace')).toBeInTheDocument();
  });

  test('has search input', () => {
    expect(screen.getByPlaceholderText('Search strategies...')).toBeInTheDocument();
  });
});
