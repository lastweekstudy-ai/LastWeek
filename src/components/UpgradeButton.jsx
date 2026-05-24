import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializePaddle } from '@paddle/paddle-js';
import { useAuth } from '../context/AuthContext';
import useUsageLimits from '../hooks/useUsageLimits';

/**
 * UpgradeButton
 *
 * Props:
 *   priceId           — Paddle Price ID
 *   label             — Button text
 *   className         — CSS class
 *   onSuccess         — Callback after checkout
 *   navigateToPricing — If true, button goes to /pricing instead of opening checkout
 */
const UpgradeButton = ({
  priceId = import.meta.env.VITE_PADDLE_PRO_PLAN_PRICE_ID || 'pri_REPLACE_ME',
  label = 'Upgrade to Pro',
  className = '',
  onSuccess = null,
  navigateToPricing = false,
}) => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { plan, planName, refresh: refreshLimits } = useUsageLimits();
  const [paddle, setPaddle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
    if (!clientToken) {
      console.warn('[UpgradeButton] VITE_PADDLE_CLIENT_TOKEN not set in .env');
      return;
    }

    initializePaddle({
      environment: import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox',
      token: clientToken,
      eventCallback: async (event) => {
        if (event.name === 'checkout.completed') {
          console.log('[Paddle] Checkout completed:', event.data);
          setPaid(true);
          setLoading(false);

          // Wait a moment for the webhook to process, then refresh user
          // The webhook adds the 'premium' label to Appwrite
          setTimeout(async () => {
            try {
              await refreshUser();   // re-fetch user labels
              refreshLimits();       // re-fetch usage limits & plan
            } catch (e) {
              console.warn('[UpgradeButton] Could not auto-refresh user:', e.message);
            }
          }, 2500); // 2.5s — enough time for webhook to process

          onSuccess?.(event.data);
        }
        if (event.name === 'checkout.closed') {
          setLoading(false);
        }
      },
    }).then((paddleInstance) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
        console.log('[Paddle] Initialized successfully');
      }
    }).catch((err) => {
      console.error('[Paddle] Initialization failed:', err);
      setError('Payment system unavailable');
    });
  }, []);

  const handleCheckout = async () => {
    // If navigateToPricing mode, just go to pricing page
    if (navigateToPricing) {
      navigate('/pricing');
      return;
    }

    if (!paddle) { setError('Payment system not ready. Please try again.'); return; }
    if (!user)   { setError('Please log in to upgrade.'); return; }

    setLoading(true);
    setError('');

    try {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: user.email },
        customData: {
          appwriteUserId: user.$id,
          userName: user.name || '',
        },
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
          locale: 'en',
        },
      });
    } catch (err) {
      console.error('[Paddle] Failed to open checkout:', err);
      setError('Failed to open checkout. Please try again.');
      setLoading(false);
    }
  };

  // Determine badge based on actual plan (not just 'premium' label)
  const isPaid = plan !== 'free' ||
    user?.labels?.includes('premium') ||
    user?.labels?.includes('pro') ||
    user?.labels?.includes('plus') ||
    user?.labels?.includes('proplus');

  if (isPaid) {
    const badgeText = {
      proplus: '🚀 Pro+',
      plus: '✨ Plus',
      pro: '⭐ Pro',
    }[plan] || (user?.labels?.includes('premium') ? '⭐ Pro' : null);

    if (badgeText) {
      return (
        <span className={`upgrade-badge ${className}`} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.8rem',
          borderRadius: '999px',
          backgroundColor: 'rgba(168, 85, 247, 0.12)',
          color: '#a855f7',
          fontSize: '0.8rem',
          fontWeight: 600,
        }}>
          {badgeText}
        </span>
      );
    }
  }

  // Show "Processing..." for a moment after payment before user re-fetches
  if (paid && !isPaid) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.4rem 0.8rem', borderRadius: '999px',
        backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981',
        fontSize: '0.8rem', fontWeight: 600,
      }}>
        ✓ Payment successful — updating...
      </span>
    );
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem' }}>
      <button
        onClick={handleCheckout}
        disabled={!navigateToPricing && (loading || !paddle)}
        className={className}
        style={{
          padding: '0.6rem 1.25rem',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#a855f7',
          color: 'white',
          cursor: (!navigateToPricing && (loading || !paddle)) ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: '0.9rem',
          opacity: (!navigateToPricing && (loading || !paddle)) ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {navigateToPricing ? (label || 'View Plans') : (loading ? 'Opening Checkout...' : label)}
      </button>
      {error && (
        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>
      )}
    </div>
  );
};

export default UpgradeButton;
