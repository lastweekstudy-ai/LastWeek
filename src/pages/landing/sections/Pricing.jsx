import React from 'react';
import { Link } from 'react-router-dom';
import '../landing.css';

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CROSS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Try LastWeek with no commitment',
    badge: null,
    highlighted: false,
    cta: 'Get Started Free',
    ctaLink: '/auth',
    features: [
      { text: '5 sessions / month', included: true },
      { text: '500 AI messages / month', included: true },
      { text: '3 PDF uploads (5MB each)', included: true },
      { text: '1 audio upload (10MB)', included: true },
      { text: '30 flashcards / month', included: true },
      { text: '20 MCQs / month', included: true },
      { text: 'All 5 study modes', included: true },
      { text: 'Exam planner (1 plan)', included: true },
      { text: 'Language learning', included: false },
      { text: 'Community resource library', included: true },
    ],
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    description: 'For students with one active subject',
    badge: 'Most Popular',
    highlighted: true,
    cta: 'Start Pro',
    ctaLink: '/auth',
    features: [
      { text: '30 sessions / month', included: true },
      { text: '3,000 AI messages / month', included: true },
      { text: '20 PDF uploads (10MB each)', included: true },
      { text: '10 audio uploads (25MB each)', included: true },
      { text: 'Unlimited flashcards', included: true },
      { text: 'Unlimited MCQs', included: true },
      { text: 'All 5 study modes', included: true },
      { text: 'Exam planner (3 active plans)', included: true },
      { text: 'Language learning', included: true },
      { text: 'Community resource library', included: true },
    ],
  },
  {
    name: 'Plus',
    price: '$14.99',
    period: '/month',
    description: 'For students juggling multiple subjects',
    badge: null,
    highlighted: false,
    cta: 'Start Plus',
    ctaLink: '/auth',
    features: [
      { text: '100 sessions / month', included: true },
      { text: '7,000 AI messages / month', included: true },
      { text: '60 PDF uploads (15MB each)', included: true },
      { text: '30 audio uploads (50MB each)', included: true },
      { text: 'Unlimited flashcards', included: true },
      { text: 'Unlimited MCQs', included: true },
      { text: 'All 5 study modes', included: true },
      { text: 'Exam planner (10 active plans)', included: true },
      { text: 'Language learning', included: true },
      { text: 'Community resource library', included: true },
    ],
  },
  {
    name: 'Pro+',
    price: '$19.99',
    period: '/month',
    description: 'No limits — for exam season warriors',
    badge: 'Best Value',
    highlighted: false,
    cta: 'Start Pro+',
    ctaLink: '/auth',
    features: [
      { text: 'Unlimited sessions', included: true },
      { text: 'Unlimited AI messages', included: true },
      { text: 'Unlimited PDFs (20MB each)', included: true },
      { text: 'Unlimited audio (100MB each)', included: true },
      { text: 'Unlimited flashcards', included: true },
      { text: 'Unlimited MCQs', included: true },
      { text: 'All 5 study modes', included: true },
      { text: 'Unlimited exam plans', included: true },
      { text: 'Language learning', included: true },
      { text: 'Community resource library', included: true },
    ],
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <h2 className="section-title">Simple, Transparent Pricing</h2>
        <p className="section-subtitle">
          Start free. Upgrade when you need more. All plans include unlimited text-to-speech and library imports.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card ${plan.highlighted ? 'highlighted' : ''}`}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {plan.badge && <div className="pricing-badge">{plan.badge}</div>}

              <h3 className="pricing-name">{plan.name}</h3>
              <div className="pricing-amount">
                <span className="price">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
              <p className="pricing-description">{plan.description}</p>

              <Link
                to={plan.ctaLink}
                className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem' }}
              >
                {plan.cta}
              </Link>

              <div className="pricing-features" style={{ flex: 1 }}>
                {plan.features.map((feature, i) => (
                  <div key={i} className="pricing-feature">
                    {feature.included ? CHECK : CROSS}
                    <span style={{ color: feature.included ? 'var(--text-muted, #a1a1aa)' : '#4b5563', textDecoration: feature.included ? 'none' : 'line-through' }}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="pricing-note" style={{ textAlign: 'center', color: 'var(--text-muted, #a1a1aa)', fontSize: '0.875rem' }}>
          All plans include browser text-to-speech (unlimited) and free community library imports.
          No credit card required for the free plan.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
