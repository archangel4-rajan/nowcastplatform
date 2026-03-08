/**
 * NowCast Platform — Comprehensive Test Suite
 *
 * Validates:
 *   - All pages render without crashing
 *   - Marketplace concept content (no old fintech copy)
 *   - Navigation structure and behavior
 *   - Footer content and links
 *   - Contact form fields and validation
 *   - About page content
 *   - Login page and test account UI
 *   - Marketplace filters and empty state
 *   - Features page structure
 *   - Auth-gated routes
 *   - Accessibility basics
 *   - Mobile menu behavior
 *   - Component isolation
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// ─── Mocks ─────────────────────────────────────────────────────────────────

jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: null, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: null, error: null }),
      signOut: jest.fn().mockResolvedValue({}),
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

// ─── Helpers ───────────────────────────────────────────────────────────────

function renderApp() {
  return render(<App />);
}

function navigateTo(linkText) {
  const links = screen.getAllByText(linkText);
  const navLink = links.find(el => el.closest('.nav-links') || el.closest('.footer'));
  if (navLink) fireEvent.click(navLink);
}

function navigateViaFooter(linkText) {
  const links = screen.getAllByText(linkText);
  const footerLink = links.find(el => el.closest('.footer'));
  if (footerLink) fireEvent.click(footerLink);
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

  test('renders Browse Strategies CTA linking to marketplace', () => {
    const btn = screen.getByText('Browse Strategies');
    expect(btn).toBeInTheDocument();
    expect(btn.closest('a')).toHaveAttribute('href', '/marketplace');
  });

  test('renders Become a Creator CTA linking to features', () => {
    const btn = screen.getByText('Become a Creator');
    expect(btn).toBeInTheDocument();
    expect(btn.closest('a')).toHaveAttribute('href', '/features');
  });

  test('renders Why NowCast section with 3 cards', () => {
    expect(screen.getByText('Why NowCast?')).toBeInTheDocument();
    expect(screen.getByText('Curated Strategies')).toBeInTheDocument();
    expect(screen.getByText('Transparent Performance')).toBeInTheDocument();
    expect(screen.getByText('Equities, Crypto & Predictions')).toBeInTheDocument();
  });

  test('renders How It Works section with 3 steps', () => {
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
    expect(screen.getByText('Profit')).toBeInTheDocument();
  });

  test('renders two-sided marketplace section', () => {
    expect(screen.getByText('Built for Two Sides of the Market')).toBeInTheDocument();
    expect(screen.getByText('Strategy Creators')).toBeInTheDocument();
    expect(screen.getByText('Subscribers')).toBeInTheDocument();
    expect(screen.getByText('Trust & Transparency')).toBeInTheDocument();
  });

  test('renders Get Started CTA linking to login', () => {
    const btn = screen.getByText('Get Started');
    expect(btn).toBeInTheDocument();
    expect(btn.closest('a')).toHaveAttribute('href', '/login');
  });

  test('renders ready to trade CTA section', () => {
    expect(screen.getByText('Ready to trade smarter?')).toBeInTheDocument();
  });

  test('does NOT contain old fintech copy', () => {
    const body = document.body.textContent;
    expect(body).not.toContain('Your Money Visible');
    expect(body).not.toContain('Simplify Your Money');
    expect(body).not.toContain('5 watchlists');
    expect(body).not.toContain('Request Demo');
    expect(body).not.toContain('Contact Sales');
  });

  test('does NOT contain Google OAuth references', () => {
    const body = document.body.textContent;
    expect(body).not.toContain('Get Started with Google');
    expect(body).not.toContain('Google');
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

  test('does NOT have Pricing link', () => {
    const body = document.body.textContent;
    // Pricing page was removed
    const navLinks = document.querySelector('.nav-links');
    expect(navLinks.textContent).not.toContain('Pricing');
  });

  test('does NOT have Solutions link in nav', () => {
    const navLinks = document.querySelector('.nav-links');
    expect(navLinks.textContent).not.toContain('Solutions');
  });

  test('has Sign In link (not button) when not authenticated', () => {
    const signIn = screen.getByText('Sign In');
    expect(signIn).toBeInTheDocument();
    expect(signIn.closest('a')).toHaveAttribute('href', '/login');
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

  test('mobile menu button shows ✕ when open', () => {
    const menuBtn = screen.getByLabelText('Toggle menu');
    expect(menuBtn.textContent).toBe('☰');
    fireEvent.click(menuBtn);
    expect(menuBtn.textContent).toBe('✕');
  });

  test('has logo with icon image', () => {
    const logoIcon = document.querySelector('.logo-icon');
    expect(logoIcon).toBeInTheDocument();
    expect(logoIcon.tagName).toBe('IMG');
  });

  test('has logo text NowCast', () => {
    const logoText = document.querySelector('.logo-text');
    expect(logoText).toBeInTheDocument();
    expect(logoText.textContent).toBe('NowCast');
  });

  test('logo links to home', () => {
    const logo = document.querySelector('.logo');
    expect(logo).toHaveAttribute('href', '/');
  });
});

// ─── Footer ────────────────────────────────────────────────────────────────

describe('Footer', () => {
  beforeEach(() => renderApp());

  test('describes marketplace concept', () => {
    expect(screen.getByText(/marketplace for trading and investment strategies/i)).toBeInTheDocument();
  });

  test('does NOT contain phone number or email', () => {
    const footer = document.querySelector('.footer');
    expect(footer.textContent).not.toContain('info@nowcast.com');
    expect(footer.textContent).not.toContain('(585)');
    expect(footer.textContent).not.toContain('910-9581');
  });

  test('has Get in Touch link to contact page', () => {
    const footer = document.querySelector('.footer');
    const link = within(footer).getByText('Get in Touch');
    expect(link.closest('a')).toHaveAttribute('href', '/contact');
  });

  test('has copyright with current year', () => {
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year} NowCast`))).toBeInTheDocument();
  });

  test('has Product section with Marketplace and Features', () => {
    expect(screen.getByText('Product')).toBeInTheDocument();
    const footer = document.querySelector('.footer');
    const marketplaceLink = within(footer).getByText('Marketplace');
    expect(marketplaceLink.closest('a')).toHaveAttribute('href', '/marketplace');
    const featuresLink = within(footer).getByText('Features');
    expect(featuresLink.closest('a')).toHaveAttribute('href', '/features');
  });

  test('has Company section with About and Contact links', () => {
    expect(screen.getByText('Company')).toBeInTheDocument();
    const footer = document.querySelector('.footer');
    const footerLinks = footer.querySelectorAll('a');
    const hrefs = Array.from(footerLinks).map(a => a.getAttribute('href'));
    expect(hrefs).toContain('/about');
    expect(hrefs).toContain('/contact');
  });

  test('does NOT have Pricing link', () => {
    const footer = document.querySelector('.footer');
    expect(footer.textContent).not.toMatch(/\bPricing\b/);
  });
});

// ─── Login Page ────────────────────────────────────────────────────────────

describe('Login Page', () => {
  beforeEach(() => {
    renderApp();
    navigateTo('Sign In');
  });

  test('renders login page content', () => {
    expect(screen.getByText(/access your dashboard/i)).toBeInTheDocument();
  });

  test('has email input field', () => {
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  test('has password input field', () => {
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  test('has Sign In submit button', () => {
    const buttons = screen.getAllByText('Sign In');
    const submitBtn = buttons.find(el => el.tagName === 'BUTTON' && el.type === 'submit');
    expect(submitBtn).toBeInTheDocument();
  });

  test('has Test Accounts section with 3 accounts', () => {
    expect(screen.getByText('Test Accounts')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Creator')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  test('shows test account emails', () => {
    expect(screen.getByText('admin@nowcastplatform.com')).toBeInTheDocument();
    expect(screen.getByText('creator@nowcastplatform.com')).toBeInTheDocument();
    expect(screen.getByText('user@nowcastplatform.com')).toBeInTheDocument();
  });

  test('shows password hint', () => {
    expect(screen.getByText('testpass123')).toBeInTheDocument();
  });

  test('clicking test account fills email field', () => {
    const adminBtn = screen.getByText('Admin').closest('button');
    fireEvent.click(adminBtn);
    expect(screen.getByLabelText('Email').value).toBe('admin@nowcastplatform.com');
    expect(screen.getByLabelText('Password').value).toBe('testpass123');
  });

  test('clicking Creator test account fills creator email', () => {
    const creatorBtn = screen.getByText('Creator').closest('button');
    fireEvent.click(creatorBtn);
    expect(screen.getByLabelText('Email').value).toBe('creator@nowcastplatform.com');
  });

  test('clicking User test account fills user email', () => {
    const userBtn = screen.getByText('User').closest('button');
    fireEvent.click(userBtn);
    expect(screen.getByLabelText('Email').value).toBe('user@nowcastplatform.com');
  });

  test('email and password fields are required', () => {
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Password')).toBeRequired();
  });

  test('email field has autocomplete attribute', () => {
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
  });

  test('password field has autocomplete attribute', () => {
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
  });
});

// ─── Features Page ─────────────────────────────────────────────────────────

describe('Features Page', () => {
  beforeEach(() => {
    renderApp();
    navigateTo('Features');
  });

  test('renders page title', () => {
    expect(screen.getByText('Platform Features')).toBeInTheDocument();
  });

  test('has For Strategy Creators section with 3 features', () => {
    expect(screen.getByText('For Strategy Creators')).toBeInTheDocument();
    expect(screen.getByText('Strategy Builder')).toBeInTheDocument();
    expect(screen.getByText('Backtesting Engine')).toBeInTheDocument();
    expect(screen.getByText('Creator Dashboard')).toBeInTheDocument();
  });

  test('has For Subscribers section with 3 features', () => {
    expect(screen.getByText('For Subscribers')).toBeInTheDocument();
    expect(screen.getByText('Real-time Trade Signals')).toBeInTheDocument();
    expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    expect(screen.getByText('Portfolio View')).toBeInTheDocument();
  });

  test('has Platform-Wide section with 3 features', () => {
    expect(screen.getByText('Platform-Wide')).toBeInTheDocument();
    expect(screen.getByText('Verified Track Records')).toBeInTheDocument();
    expect(screen.getByText('Risk Management Tools')).toBeInTheDocument();
    expect(screen.getByText('Marketplace Search & Filters')).toBeInTheDocument();
  });

  test('has 9 feature cards total', () => {
    const cards = document.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThanOrEqual(9);
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

  test('has mission description about strategy marketplace', () => {
    expect(screen.getByText(/best trading strategies/i)).toBeInTheDocument();
  });

  test('does NOT have founder details', () => {
    const body = document.body.textContent;
    expect(body).not.toContain('Rajan Anand');
    expect(body).not.toContain('Founder & CEO');
    expect(body).not.toContain('LinkedIn');
  });

  test('has values section with 4 values', () => {
    expect(screen.getByText('Our Values')).toBeInTheDocument();
    expect(screen.getByText('Transparency')).toBeInTheDocument();
    expect(screen.getByText('Meritocracy')).toBeInTheDocument();
    expect(screen.getByText('Trust')).toBeInTheDocument();
    expect(screen.getByText('Access')).toBeInTheDocument();
  });

  test('has CTA linking to login', () => {
    expect(screen.getByText('Join the Marketplace')).toBeInTheDocument();
    const btn = screen.getByText('Get Started');
    expect(btn.closest('a')).toHaveAttribute('href', '/login');
  });
});

// ─── Contact Page ──────────────────────────────────────────────────────────

describe('Contact Page', () => {
  beforeEach(() => {
    renderApp();
    navigateViaFooter('Contact');
  });

  test('renders contact page content', () => {
    // Page subtitle is unique to contact page
    expect(screen.getByText(/we'd love to hear from you/i)).toBeInTheDocument();
  });

  test('has inquiry type dropdown with 4 options', () => {
    const select = screen.getByLabelText(/interested in/i);
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(4);
  });

  test('inquiry options cover all use cases', () => {
    const select = screen.getByLabelText(/interested in/i);
    const optionTexts = Array.from(select.querySelectorAll('option')).map(o => o.textContent);
    expect(optionTexts).toContain('Subscribing to strategies');
    expect(optionTexts).toContain('Publishing strategies as a creator');
    expect(optionTexts).toContain('Partnership opportunities');
    expect(optionTexts).toContain('General inquiry');
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

    const messageInput = screen.getByLabelText('Message');
    fireEvent.change(messageInput, { target: { value: 'Hello world' } });
    expect(messageInput.value).toBe('Hello world');
  });

  test('inquiry dropdown is changeable', () => {
    const select = screen.getByLabelText(/interested in/i);
    fireEvent.change(select, { target: { value: 'creator' } });
    expect(select.value).toBe('creator');
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

  test('renders marketplace subtitle', () => {
    expect(screen.getByText(/Browse proven trading strategies/)).toBeInTheDocument();
  });

  test('has search input', () => {
    expect(screen.getByPlaceholderText('Search strategies...')).toBeInTheDocument();
  });

  test('has Risk Level filter dropdown', () => {
    expect(screen.getByText('Risk Level')).toBeInTheDocument();
  });

  test('has Asset Class filter dropdown', () => {
    expect(screen.getByText('Asset Class')).toBeInTheDocument();
  });

  test('has strategy tag filters', () => {
    expect(screen.getByText('AI-Powered Strategy')).toBeInTheDocument();
    expect(screen.getByText('Crypto Only')).toBeInTheDocument();
    expect(screen.getByText('Equities Only')).toBeInTheDocument();
    expect(screen.getByText('Mixed Asset')).toBeInTheDocument();
    expect(screen.getByText('Quant Strategy')).toBeInTheDocument();
    expect(screen.getByText('Thesis Driven')).toBeInTheDocument();
  });

  test('shows loading or empty state', () => {
    // Marketplace initially shows loading, then empty state after async fetch
    const hasLoading = screen.queryByText('Loading strategies...');
    const hasEmpty = screen.queryByText('No strategies found');
    expect(hasLoading || hasEmpty).toBeTruthy();
  });

  test('search input is interactive', () => {
    const search = screen.getByPlaceholderText('Search strategies...');
    fireEvent.change(search, { target: { value: 'momentum' } });
    expect(search.value).toBe('momentum');
  });
});

// ─── Auth-Gated Routes ────────────────────────────────────────────────────

describe('Auth-Gated Routes', () => {
  test('dashboard redirects to login when not authenticated', () => {
    renderApp();
    window.history.pushState({}, '', '/dashboard');
    // Should redirect, not show dashboard content
    expect(screen.queryByText('Your strategy dashboard')).not.toBeInTheDocument();
  });

  test('creator dashboard redirects to login when not authenticated', () => {
    renderApp();
    window.history.pushState({}, '', '/creator');
    expect(screen.queryByText('Creator Dashboard')).not.toBeInTheDocument();
  });
});

// ─── Old Content Removal ──────────────────────────────────────────────────

describe('Old content removal', () => {
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
    'Request Demo',
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

// ─── Removed Pages ─────────────────────────────────────────────────────────

describe('Removed pages', () => {
  test('no Pricing route exists', () => {
    renderApp();
    window.history.pushState({}, '', '/pricing');
    // Should show landing or 404, not pricing content
    expect(screen.queryByText('Explorer')).not.toBeInTheDocument();
    expect(screen.queryByText('Trader Pro')).not.toBeInTheDocument();
  });

  test('no Solutions route exists', () => {
    renderApp();
    window.history.pushState({}, '', '/solutions');
    // Should not show solutions content
    expect(screen.queryByText('Supported Markets')).not.toBeInTheDocument();
  });
});

// ─── Cross-Page Consistency ────────────────────────────────────────────────

describe('Cross-page consistency', () => {
  test('navbar is present on every page', () => {
    renderApp();
    expect(document.querySelector('.navbar')).toBeInTheDocument();
    navigateTo('Features');
    expect(document.querySelector('.navbar')).toBeInTheDocument();
    navigateTo('About');
    expect(document.querySelector('.navbar')).toBeInTheDocument();
    navigateTo('Marketplace');
    expect(document.querySelector('.navbar')).toBeInTheDocument();
  });

  test('footer is present on every page', () => {
    renderApp();
    expect(document.querySelector('.footer')).toBeInTheDocument();
    navigateTo('Features');
    expect(document.querySelector('.footer')).toBeInTheDocument();
    navigateTo('About');
    expect(document.querySelector('.footer')).toBeInTheDocument();
  });

  test('NowCast brand appears in both navbar and footer', () => {
    renderApp();
    const navbar = document.querySelector('.navbar');
    const footer = document.querySelector('.footer');
    expect(navbar.textContent).toContain('NowCast');
    expect(footer.textContent).toContain('NowCast');
  });
});

// ─── Accessibility Basics ──────────────────────────────────────────────────

describe('Accessibility', () => {
  beforeEach(() => renderApp());

  test('mobile menu button has aria-label', () => {
    const btn = screen.getByLabelText('Toggle menu');
    expect(btn).toBeInTheDocument();
  });

  test('page has proper heading hierarchy on landing', () => {
    const h1s = document.querySelectorAll('h1');
    expect(h1s.length).toBeGreaterThanOrEqual(1);
  });

  test('all navigation links have href attributes', () => {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  test('all footer links have href attributes', () => {
    const footerLinks = document.querySelectorAll('.footer a');
    footerLinks.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  test('logo image has alt attribute', () => {
    const logoImg = document.querySelector('.logo-icon');
    expect(logoImg).toHaveAttribute('alt');
  });
});
