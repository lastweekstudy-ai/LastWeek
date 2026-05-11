import React from 'react';
import { Link } from 'react-router-dom';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import '../landing.css';

const Pricing = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for trying out LastWeek',
      features: [
        'Up to 3 study sessions',
        '50MB storage',
        'Basic AI features',
        'Community support',
        'Access to all 5 study modes',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: '/month',
      description: 'For serious students',
      features: [
        'Unlimited study sessions',
        '10GB storage',
        'Advanced AI features',
        'Priority support',
        'Offline access',
        'Advanced analytics',
        'Resource sharing',
        'Collaborative features',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Team',
      price: '$29.99',
      period: '/month',
      description: 'For study groups and classes',
      features: [
        'Everything in Pro',
        'Up to 10 team members',
        'Shared resource library',
        'Team analytics',
        'Admin controls',
        'Custom branding',
        'API access',
        'Dedicated support',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <h2 className="section-title">Simple, Transparent Pricing</h2>
        <p className="section-subtitle">Choose the plan that fits your learning goals</p>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.highlighted ? 'highlighted' : ''}`}>
              {plan.highlighted && <div className="pricing-badge">Most Popular</div>}
              
              <h3 className="pricing-name">{plan.name}</h3>
              <div className="pricing-amount">
                <span className="price">{plan.price}</span>
                {plan.period && <span className="period">{plan.period}</span>}
              </div>
              <p className="pricing-description">{plan.description}</p>

              <Link to="/auth" className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}>
                {plan.cta}
                <PixelIcon type="arrow" size={16} />
              </Link>

              <div className="pricing-features">
                {plan.features.map((feature, i) => (
                  <div key={i} className="pricing-feature">
                    <PixelIcon type="checkmark" size={16} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="pricing-note">
          All plans include a 14-day free trial. No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
