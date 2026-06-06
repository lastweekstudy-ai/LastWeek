import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../../components/shared/BrandLogo';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import '../landing.css';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const footerLinks = [
    { label: 'Docs', href: '/docs' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Security', href: '/security' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src="/logos/lastweek_main_logo.png" alt="LastWeek" style={{ height: '36px', objectFit: 'contain' }} />
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links-desktop">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="navbar-link">
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <Link to="/auth" className="navbar-cta">
          Get Started
          <PixelIcon type="arrow" size={16} />
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            width: '30px',
            height: '24px',
            justifyContent: 'center'
          }}>
            <div style={{ 
              width: '30px', 
              height: '4px', 
              backgroundColor: '#7c3aed',
              borderRadius: '2px',
              display: 'block'
            }}></div>
            <div style={{ 
              width: '30px', 
              height: '4px', 
              backgroundColor: '#7c3aed',
              borderRadius: '2px',
              display: 'block'
            }}></div>
            <div style={{ 
              width: '30px', 
              height: '4px', 
              backgroundColor: '#7c3aed',
              borderRadius: '2px',
              display: 'block'
            }}></div>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="navbar-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="navbar-mobile-divider" />
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="navbar-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/auth" className="navbar-mobile-cta">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
