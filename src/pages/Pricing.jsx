import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UpgradeButton from '../components/UpgradeButton';
import useUsageLimits from '../hooks/useUsageLimits';
import { PLANS, formatLimit } from '../config/planLimits';

const CHECK = '✅';
const CROSS = '❌';

const FEATURES = [
  { label: 'Sessions per month', key: 'sessions', format: (v) => formatLimit(v) },
  { label: 'AI Messages per month', key: 'messages', format: (v) => formatLimit(v) },
  { label: 'PDF Uploads per month', key: 'pdfs', format: (v) => formatLimit(v) },
  { label: 'Max PDF size', key: 'pdfMaxSizeMB', format: (v) => `${v} MB` },
  { label: 'Audio Uploads per month', key: 'audios', format: (v) => formatLimit(v) },
  { label: 'Max Audio size', key: 'audioMaxSizeMB', format: (v) => `${v} MB` },
  { label: 'Flashcards per month', key: 'flashcards', format: (v) => formatLimit(v) },
  { label: 'MCQs per month', key: 'mcqs', format: (v) => formatLimit(v) },
  { label: 'Active Exam Plans', key: 'examPlans', format: (v) => formatLimit(v) },
  { label: 'Storage', key: 'storageMB', format: (v) => v >= 1024 ? `${v / 1024} GB` : `${v} MB` },
  { label: 'Language Learning', key: 'languageLearning', format: (v) => v ? CHECK : CROSS },
  { label: 'Library Import', key: 'libraryImport', format: (v) => v ? CHECK : CROSS },
  { label: 'Text-to-Speech (Browser)', label2: 'All plans', format: () => '✅ Unlimited' },
];

const PADDLE_PRICES = {
  pro: import.meta.env.VITE_PADDLE_PRO_PLAN_PRICE_ID,
  plus: import.meta.env.VITE_PADDLE_PLUS_PLAN_PRICE_ID,
  proplus: import.meta.env.VITE_PADDLE_PRO_PLUS_PRICE_ID,
};

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan: currentPlan } = useUsageLimits();
  const [billing, setBilling] = useState('monthly');

  const tiers = [
    { id: 'free', highlight: false },
    { id: 'pro', highlight: true, badge: 'Most Popular' },
    { id: 'plus', highlight: false },
    { id: 'proplus', highlight: false, badge: 'Best Value' },
  ];

  const annualDiscount = 0.25; // 25% off annual
  const getPrice = (plan) => {
    const monthly = PLANS[plan]?.price || 0;
    if (billing === 'annual') return (monthly * (1 - annualDiscount)).toFixed(2);
    return monthly.toFixed(2);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      padding: '3rem 1rem',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
            Simple, transparent pricing
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: '0 0 1.5rem' }}>
            Start free. Upgrade when you need more.
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '999px', padding: '4px', border: '1px solid var(--color-border)' }}>
            {['monthly', 'annual'].map(b => (
              <button key={b} onClick={() => setBilling(b)} style={{
                padding: '0.4rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                backgroundColor: billing === b ? '#a855f7' : 'transparent',
                color: billing === b ? 'white' : 'var(--color-text-muted)',
                transition: 'all 0.2s',
              }}>
                {b === 'monthly' ? 'Monthly' : 'Annual (–25%)'}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {tiers.map(({ id, highlight, badge }) => {
            const plan = PLANS[id];
            const isCurrent = currentPlan === id;
            const priceId = PADDLE_PRICES[id];

            return (
              <div key={id} style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: highlight ? '2px solid #a855f7' : '1px solid var(--color-border)',
                position: 'relative',
                boxShadow: highlight ? '0 0 30px rgba(168,85,247,0.15)' : 'none',
              }}>
                {badge && (
                  <span style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#a855f7', color: 'white', fontSize: '0.72rem', fontWeight: 700,
                    padding: '0.2rem 0.75rem', borderRadius: '999px', whiteSpace: 'nowrap',
                  }}>{badge}</span>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      ${getPrice(id)}
                    </span>
                    {plan.price > 0 && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        /month
                      </span>
                    )}
                  </div>
                  {billing === 'annual' && plan.price > 0 && (
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#10b981' }}>
                      Billed annually — save 25%
                    </p>
                  )}
                </div>

                {/* Key limits */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <li style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    📅 <strong>{formatLimit(plan.sessions)}</strong> sessions/month
                  </li>
                  <li style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    💬 <strong>{formatLimit(plan.messages)}</strong> AI messages/month
                  </li>
                  <li style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    📄 <strong>{formatLimit(plan.pdfs)}</strong> PDF uploads/month
                  </li>
                  <li style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    🎙️ <strong>{formatLimit(plan.audios)}</strong> audio uploads/month
                  </li>
                  <li style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    🌐 Language Learning: <strong>{plan.languageLearning ? 'Included' : 'Not included'}</strong>
                  </li>
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div style={{
                    width: '100%', padding: '0.6rem', borderRadius: '8px', textAlign: 'center',
                    backgroundColor: 'rgba(168,85,247,0.1)', color: '#a855f7', fontWeight: 600, fontSize: '0.9rem',
                  }}>
                    ✓ Current Plan
                  </div>
                ) : id === 'free' ? (
                  <button onClick={() => navigate('/dashboard')} style={{
                    width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  }}>
                    Continue Free
                  </button>
                ) : priceId ? (
                  <UpgradeButton priceId={priceId} label={`Upgrade to ${plan.name}`} />
                ) : (
                  <button disabled style={{
                    width: '100%', padding: '0.6rem', borderRadius: '8px', border: 'none',
                    backgroundColor: '#a855f7', color: 'white', cursor: 'not-allowed', fontWeight: 600, fontSize: '0.9rem', opacity: 0.6,
                  }}>
                    Coming Soon
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Full comparison table */}
        <div style={{ backgroundColor: 'var(--color-bg-secondary)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Feature</th>
                {tiers.map(({ id }) => (
                  <th key={id} style={{ padding: '1rem', textAlign: 'center', color: currentPlan === id ? '#a855f7' : 'var(--color-text-primary)', fontWeight: 700 }}>
                    {PLANS[id].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>
                    {feature.label}
                  </td>
                  {tiers.map(({ id }) => {
                    const plan = PLANS[id];
                    const value = feature.key ? plan[feature.key] : null;
                    const display = feature.key ? feature.format(value) : feature.format();
                    return (
                      <td key={id} style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          <p>Questions? <a href="/contact" style={{ color: '#a855f7' }}>Contact us</a> — we reply within 24 hours.</p>
          <p>All plans include browser TTS (text-to-speech) at no extra cost.</p>
          <p>Library imports are free for all plans — no processing cost.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
