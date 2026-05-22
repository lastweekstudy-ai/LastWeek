import React from 'react';
import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import '../styles/Pages.css';

const Pricing = () => {
  useScrollToTop();

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      description: 'Perfect for trying out LastWeek',
      features: [
        'Up to 3 study sessions per day',
        '50MB file storage',
        'Basic AI tutoring (limited messages)',
        'Access to all 5 study modes',
        'Community support',
      ],
      limitations: [
        'Limited AI messages per day',
        'No offline access',
        'Basic analytics only',
      ],
      cta: 'Get Started Free',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: '/month',
      description: 'For serious students who want unlimited learning',
      features: [
        'Unlimited study sessions',
        '10GB file storage',
        'Unlimited AI tutoring messages',
        'All 5 study modes with advanced features',
        'Language learning with AI pronunciation coach',
        'PDF & audio lecture processing',
        'Spaced repetition flashcards',
        'Advanced learning analytics',
        'Priority support',
        'Offline access',
      ],
      limitations: [],
      cta: 'Start 14-Day Free Trial',
      highlighted: true,
    },
    {
      name: 'Team',
      price: '$29.99',
      period: '/month',
      description: 'For study groups, tutors, and classrooms',
      features: [
        'Everything in Pro',
        'Up to 10 team members',
        'Shared resource library',
        'Team progress analytics',
        'Admin controls & user management',
        'Custom branding options',
        'API access for integrations',
        'Dedicated account manager',
      ],
      limitations: [],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="page-container">
      <nav className="page-navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span>LastWeek</span>
          </Link>
          <div className="navbar-links">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </nav>

      <div className="page-content">
        <div className="page-header">
          <h1>Simple, Transparent Pricing</h1>
          <p>Choose the plan that fits your learning goals. No hidden fees. Cancel anytime.</p>
        </div>

        <div className="pricing-page-grid">
          {plans.map((plan, index) => (
            <div key={index} className={`pricing-page-card ${plan.highlighted ? 'highlighted' : ''}`}>
              {plan.highlighted && <div className="pricing-page-badge">Most Popular</div>}
              
              <h2 className="pricing-page-name">{plan.name}</h2>
              <div className="pricing-page-amount">
                <span className="pricing-page-price">{plan.price}</span>
                {plan.period && <span className="pricing-page-period">{plan.period}</span>}
              </div>
              <p className="pricing-page-description">{plan.description}</p>

              <Link to="/auth" className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`} style={{ display: 'inline-block', marginBottom: '1.5rem', textDecoration: 'none' }}>
                {plan.cta}
              </Link>

              <div className="pricing-page-features">
                <h4>What's included:</h4>
                {plan.features.map((feature, i) => (
                  <div key={i} className="pricing-page-feature">
                    <span className="feature-check">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
                {plan.limitations.length > 0 && (
                  <>
                    <h4 style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Limitations:</h4>
                    {plan.limitations.map((limitation, i) => (
                      <div key={i} className="pricing-page-feature limitation">
                        <span className="feature-x">✗</span>
                        <span>{limitation}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="page-section" style={{ marginTop: '3rem' }}>
          <h2>Frequently Asked Questions</h2>
          
          <div className="faq-item">
            <h3>What payment methods do you accept?</h3>
            <p>We accept all major credit and debit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay through our payment processor Paddle. Paddle handles all billing and payment processing securely.</p>
          </div>

          <div className="faq-item">
            <h3>Is there a free trial?</h3>
            <p>Yes! The Pro plan includes a 14-day free trial. No credit card required to start. You can cancel anytime during the trial without being charged.</p>
          </div>

          <div className="faq-item">
            <h3>Can I cancel my subscription?</h3>
            <p>Absolutely. You can cancel your subscription at any time from your account settings. Your access continues until the end of your current billing period. See our <Link to="/refund-policy">Refund Policy</Link> for details.</p>
          </div>

          <div className="faq-item">
            <h3>What happens to my data if I cancel?</h3>
            <p>Your data is retained for 30 days after cancellation. During this period, you can reactivate your account and pick up where you left off. After 30 days, your data is permanently deleted per our <Link to="/privacy">Privacy Policy</Link>.</p>
          </div>

          <div className="faq-item">
            <h3>Do you offer student discounts?</h3>
            <p>Yes! Contact us at contact@lastweekai.study with your student ID for a 30% discount on the Pro plan.</p>
          </div>

          <div className="faq-item">
            <h3>Is my payment information secure?</h3>
            <p>Yes. All payments are processed by Paddle, a PCI-DSS compliant payment processor. We never store your credit card details on our servers.</p>
          </div>
        </div>

        <div className="page-section" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>
            By subscribing, you agree to our <Link to="/terms">Terms of Service</Link>, <Link to="/privacy">Privacy Policy</Link>, and <Link to="/refund-policy">Refund Policy</Link>.
          </p>
        </div>
      </div>

      <footer className="page-footer">
        <p>&copy; 2026 LastWeek. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Pricing;
