import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminSettings } from '../../../appwrite/admin';
import SlotRefreshCountdown from '../../../components/SlotRefreshCountdown';
import { getPreRegPricing } from '../../../utils/preRegPricing';

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
    planKey: 'free',
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
    name: 'Plus',
    price: '$9',
    period: '/month',
    description: 'For students juggling multiple subjects',
    badge: 'Most Popular',
    highlighted: true,
    cta: 'Start Plus',
    ctaLink: '/auth',
    planKey: 'plus',
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
    planKey: 'proplus',
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
  const [adminSettings, setAdminSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getAdminSettings()
      .then((settings) => {
        if (!cancelled) setAdminSettings(settings);
      })
      .catch((err) => {
        console.error('Failed to load admin settings:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingSettings(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Show loading skeleton while fetching admin settings
  if (loadingSettings) {
    return (
      <section id="pricing" className="pricing">
        <div className="container">
          <div style={{ 
            width: '300px', 
            height: '32px', 
            backgroundColor: 'var(--color-bg-secondary)', 
            borderRadius: '8px',
            margin: '0 auto 1rem',
            animation: 'pulse 2s infinite',
          }} />
          <div style={{ 
            width: '400px', 
            height: '20px', 
            backgroundColor: 'var(--color-bg-secondary)', 
            borderRadius: '4px',
            margin: '0 auto 2rem',
            animation: 'pulse 2s infinite',
          }} />
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '16px',
                padding: '1.5rem',
                height: '400px',
                animation: 'pulse 2s infinite',
              }} />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </section>
    );
  }

  // Determine if pre-reg mode is active
  const isPreRegMode = adminSettings?.preRegActive;
  const paymentsActive = adminSettings?.paymentsActive;
  const dailyFreeSlotsActive = adminSettings?.dailyFreeSlotsActive;
  const preRegPricing = getPreRegPricing(adminSettings);

  const getPlanActive = (planKey) => {
    if (!adminSettings) return true;
    const planMap = {
      free: adminSettings.freePlanActive,
      plus: adminSettings.plusPlanActive,
      proplus: adminSettings.proPlusPlanActive,
    };
    return planMap[planKey] !== false;
  };

  // Get CTA for a plan based on admin settings
  const getCTA = (plan) => {
    if (!getPlanActive(plan.planKey)) {
      return { text: 'Currently unavailable', link: null, disabled: true };
    }
    if (isPreRegMode) {
      if (plan.planKey === 'plus') {
        return { text: `Pre-Register (${preRegPricing.priceLabel})`, link: '/pre-register' };
      }
      return { text: 'Pre-registration only', link: null, disabled: true };
    }
    if (!paymentsActive) {
      if (plan.planKey === 'free' && dailyFreeSlotsActive) {
        return { text: 'Try Free Today', link: '/auth?freeSlot=true' };
      }
      return { text: 'Coming Soon', link: null, disabled: true };
    }
    return { text: plan.cta, link: plan.ctaLink };
  };

  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <h2 className="section-title">Simple, Transparent Pricing</h2>
        <p className="section-subtitle">
          {isPreRegMode 
            ? '🎉 Pre-Registration is now open! Get Plus free for 1 year!'
            : 'Start free. Upgrade when you need more. All plans include unlimited text-to-speech and library imports.'}
        </p>

        {/* Pre-Registration Banner */}
        {isPreRegMode && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
            border: '1px solid rgba(var(--color-accent-rgb), 0.5)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h3 style={{ color: 'var(--color-accent)', margin: '0 0 0.5rem', fontSize: '1.25rem', textAlign: 'center' }}>
              🎉 Pre-Registration Now Open!
            </h3>
            <p style={{ color: 'var(--text-secondary, #a1a1aa)', margin: '0 0 1.5rem', fontSize: '0.95rem', textAlign: 'center' }}>
              Two ways to get <strong style={{ color: 'var(--color-accent)' }}>Plus free for 1 year</strong> (a {preRegPricing.valueLabel} value!)
            </p>

            {/* Two Options Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
            }}>
              {/* Option 1: paid pre-registration */}
              <div style={{
                backgroundColor: 'rgba(var(--color-accent-rgb), 0.1)',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid rgba(var(--color-accent-rgb), 0.3)',
              }}>
                <h4 style={{ color: 'var(--color-accent)', margin: '0 0 0.5rem', fontSize: '1rem' }}>
                  💳 Pay {preRegPricing.priceLabel} Now
                </h4>
                <p style={{ color: 'var(--text-secondary, #a1a1aa)', margin: '0 0 1rem', fontSize: '0.85rem' }}>
                  One-time payment. Get your promo code instantly. Every 10 friends who join = +6 months free!
                </p>
                <Link
                  to="/pre-register"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  Pre-Register Now
                </Link>
              </div>

              {/* Option 2: Free Testing Slot */}
              {adminSettings?.dailyFreeSlotsActive && (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}>
                  <h4 style={{ color: '#10b981', margin: '0 0 0.5rem', fontSize: '1rem' }}>
                    🎁 Free Testing Slot
                  </h4>
                  <p style={{ color: 'var(--text-secondary, #a1a1aa)', margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
                    <strong style={{ color: '#10b981' }}>{adminSettings?.dailyFreeSlotCount ?? 10}</strong> slots available daily.
                    Test ALL features once. Leave a review and get Plus free for 1 year!
                  </p>
                  <Link
                    to="/auth?freeSlot=true"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #10b981',
                      backgroundColor: 'transparent',
                      color: '#10b981',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    Claim Free Slot
                  </Link>
                  <SlotRefreshCountdown />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Daily Free Slots Banner */}
        {!paymentsActive && dailyFreeSlotsActive && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '16px',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            textAlign: 'center',
          }}>
            <h3 style={{ color: '#10b981', margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
              🎁 Free Testing Available Today!
            </h3>
            <p style={{ color: 'var(--text-secondary, #a1a1aa)', margin: 0, fontSize: '0.95rem' }}>
              Try all features for free! Leave a review and get added to our pre-registration list with{' '}
              <strong style={{ color: '#10b981' }}>1 year of Plus free</strong>. Limited slots daily.
            </p>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`,
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          {plans.map((plan) => {
            const cta = getCTA(plan);
            const planActive = getPlanActive(plan.planKey);
            const badge = planActive ? plan.badge : 'Unavailable';
            return (
              <div
                key={plan.name}
                className={`pricing-card ${plan.highlighted && planActive ? 'highlighted' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: planActive ? 1 : 0.72,
                }}
              >
                {badge && (
                  <div
                    className="pricing-badge"
                    style={!planActive ? { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' } : undefined}
                  >
                    {badge}
                  </div>
                )}

                <h3 className="pricing-name">{plan.name}</h3>
                <div className="pricing-amount">
                  <span className="price">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>
                <p className="pricing-description">{plan.description}</p>

                {cta.disabled ? (
                  <div
                    className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      marginBottom: '1.5rem',
                      opacity: 0.5,
                      cursor: 'not-allowed',
                      textAlign: 'center',
                    }}
                  >
                    {cta.text}
                  </div>
                ) : (
                  <Link
                    to={cta.link}
                    className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem' }}
                  >
                    {cta.text}
                  </Link>
                )}

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
            );
          })}
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
