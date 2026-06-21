import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializePaddle } from '@paddle/paddle-js';
import { useAuth } from '../context/AuthContext';
import useCombinedLimits from '../hooks/useCombinedLimits';
import { getPaddleClientToken, getPaddleEnvironment, isMissingPaddlePrice } from '../utils/paddleConfig';

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
  priceId = import.meta.env.VITE_PADDLE_PLUS_PRICE_ID || 'pri_REPLACE_ME',
  label = 'Upgrade to Plus',
  className = '',
  onSuccess = null,
  navigateToPricing = false,
}) => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { plan, refresh: refreshLimits } = useCombinedLimits();
  const [paddle, setPaddle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const clientToken = getPaddleClientToken();
    if (!clientToken) {
      console.warn('[UpgradeButton] VITE_PADDLE_CLIENT_TOKEN not set in .env');
      return;
    }

    initializePaddle({
      environment: getPaddleEnvironment(),
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
          }, 2500);

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
    // Paddle should initialize once for this mounted button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckout = async () => {
    // If navigateToPricing mode, just go to pricing page
    if (navigateToPricing) {
      navigate('/pricing');
      return;
    }

    if (!paddle) { setError('Payment system not ready. Please try again.'); return; }
    if (!user)   { setError('Please log in to upgrade.'); return; }
    if (isMissingPaddlePrice(priceId)) {
      setError('Payment price is not configured. Please contact support.');
      return;
    }

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
      proplus: 'Pro+',
      plus: 'Plus',
      pro: 'Pro',
    }[plan] || (user?.labels?.includes('premium') ? 'Pro' : null);

    if (badgeText) {
      return (
        <span className={`badge ${className}`}>
          {badgeText}
        </span>
      );
    }
  }

  // Show "Processing..." for a moment after payment before user re-fetches
  if (paid && !isPaid) {
    return (
      <span className="badge-green">
        Payment successful - updating...
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleCheckout}
        disabled={!navigateToPricing && (loading || !paddle)}
        className={`btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {navigateToPricing ? (label || 'View Plans') : (loading ? 'Opening Checkout...' : label)}
      </button>
      {error && (
        <span className="text-xs font-medium text-red-500">{error}</span>
      )}
    </div>
  );
};

export default UpgradeButton;
