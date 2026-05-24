import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../../components/shared/BrandLogo';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import '../landing.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Documentation', href: '/docs' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '#' },
      { label: 'Roadmap', href: '#' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'Cookies', href: '/cookies' },
    ],
    Social: [
      { label: 'Twitter / X', href: 'https://x.com/LastWeek_AI', icon: 'external' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/lastweekstudy-ai/', icon: 'external' },
      { label: 'Discord', href: '#', icon: 'external' },
      { label: 'Email', href: 'mailto:contact@lastweekai.study', icon: 'external' },
    ],
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/logos/lastweek_text_logo.png" alt="LastWeek" style={{ height: '34px', objectFit: 'contain' }} />
            </Link>
            <p className="footer-tagline">
              AI-powered learning platform for students who refuse to let time constraints limit their potential.
            </p>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="footer-section">
              <h4 className="footer-section-title">{category}</h4>
              <ul className="footer-links">
                {links.map((link, index) => (
                  <li key={index}>
                    {link.href.startsWith('/') ? (
                      <Link to={link.href} className="footer-link">
                        {link.label}
                        {link.icon && <PixelIcon type={link.icon} size={12} />}
                      </Link>
                    ) : (
                      <a href={link.href} className="footer-link">
                        {link.label}
                        {link.icon && <PixelIcon type={link.icon} size={12} />}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} LastWeek. All rights reserved.
          </p>
          <p className="footer-note">
            Built for students who refuse to let time constraints limit their potential.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
