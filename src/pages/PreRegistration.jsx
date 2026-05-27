import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializePaddle } from '@paddle/paddle-js';
import { getAdminSettings, createPreRegistration, getPreRegistrationByUserId, isExistingUser } from '../appwrite/admin';

/**
 * Pre-Registration Page
 * 
 * $5 path: User fills form → pays $5 → added to pre-reg list
 * NO website access - just collects info for when pre-reg ends
 * Gets Plus for 1 year when pre-reg ends
 */
const PreRegistration = () => {
  const navigate = useNavigate();
  const [paddle, setPaddle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');
  const [adminSettings, setAdminSettings] = useState(null);
  const [existingPreReg, setExistingPreReg] = useState(null);
  
  // Form state for non-logged-in users
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
    initPaddle();
  }, []);

  const loadData = async () => {
    try {
      const settings = await getAdminSettings();
      setAdminSettings(settings);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const initPaddle = async () => {
    const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
    if (!clientToken) {
      setError('Payment system not configured');
      return;
    }

    try {
      const paddleInstance = await initializePaddle({
        environment: import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox',
        token: clientToken,
        eventCallback: async (event) => {
          if (event.name === 'checkout.completed') {
            console.log('[PreReg] Payment completed:', event.data);
            setPaid(true);
            setLoading(false);
          }
          if (event.name === 'checkout.closed') {
            setLoading(false);
          }
        },
      });

      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    } catch (err) {
      console.error('[PreReg] Paddle init failed:', err);
      setError('Payment system unavailable');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Please enter your name';
    }
    if (!formData.email.trim()) {
      return 'Please enter your email';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handlePayment = async () => {
    if (!paddle) {
      setError('Payment system not ready');
      return;
    }

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    // Check if email is already an existing user
    const existing = await isExistingUser(formData.email);
    if (existing) {
      setFormError('This email is already registered. Existing users cannot join pre-registration.');
      return;
    }

    const priceId = adminSettings?.preRegPriceId || import.meta.env.VITE_PADDLE_PRE_REG_PRICE_ID;

    if (!priceId) {
      setError('Pre-registration price not configured. Please contact support.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: formData.email },
        customData: {
          userName: formData.name,
          userEmail: formData.email,
          preReg: true,
          type: 'paid',
        },
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
          locale: 'en',
        },
      });
    } catch (err) {
      console.error('[PreReg] Checkout failed:', err);
      setError('Failed to open checkout');
      setLoading(false);
    }
  };

  // Pre-reg mode not active
  // Show loading state while fetching settings
  if (!adminSettings) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          padding: '2.5rem',
          maxWidth: '500px',
          width: '100%',
        }}>
          <div style={{ 
            width: '100%', 
            height: '100px', 
            backgroundColor: 'var(--color-bg-tertiary)', 
            borderRadius: '12px',
            marginBottom: '1.5rem',
            animation: 'pulse 2s infinite',
          }} />
          <div style={{ 
            width: '60%', 
            height: '32px', 
            backgroundColor: 'var(--color-bg-tertiary)', 
            borderRadius: '8px',
            margin: '0 auto 1rem',
            animation: 'pulse 2s infinite',
          }} />
          <div style={{ 
            width: '80%', 
            height: '18px', 
            backgroundColor: 'var(--color-bg-tertiary)', 
            borderRadius: '4px',
            margin: '0 auto',
            animation: 'pulse 2s infinite',
          }} />
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (!adminSettings.preRegActive) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          padding: '2rem',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          <h2 style={{ color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
            Pre-Registration Closed
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            Pre-registration is not currently active. Check back later or explore our regular plans.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#a855f7',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  // Payment successful
  if (paid) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '16px',
          border: '1px solid #10b981',
          padding: '2rem',
          maxWidth: '450px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: '#10b981', margin: '0 0 1rem' }}>
            Payment Successful!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Thank you for pre-registering, <strong>{formData.name}</strong>!
          </p>
          <div style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
              You'll receive <strong style={{ color: '#a855f7' }}>Plus free for 1 year</strong> when pre-registration ends.
            </p>
            <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.85rem' }}>
              We'll email you at <strong>{formData.email}</strong> with your promo code and instructions.
            </p>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Every 10 friends who join with your promo code = +6 months free for you!
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#a855f7',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Show payment form
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        padding: '2.5rem',
        maxWidth: '500px',
        width: '100%',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          <h1 style={{ color: '#a855f7', margin: '0 0 0.5rem', fontSize: '1.5rem' }}>
            🎉 Pre-Registration
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Pay $5 now → Get Plus free for 1 year
          </p>
        </div>

        {/* Price */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: '0.25rem',
          }}>
            $5
          </div>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.85rem' }}>
            One-time payment • No subscription
          </p>
        </div>

        {/* Benefits */}
        <div style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <h4 style={{ color: 'var(--color-text-primary)', margin: '0 0 0.75rem', fontSize: '0.95rem' }}>
            What you get:
          </h4>
          <ul style={{ margin: 0, padding: '0 0 0 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            <li style={{ marginBottom: '0.25rem' }}>✅ <strong style={{ color: '#a855f7' }}>Plus plan free for 1 year</strong> (a $180 value)</li>
            <li style={{ marginBottom: '0.25rem' }}>✅ Unique promo code to share with friends</li>
            <li style={{ marginBottom: '0.25rem' }}>✅ Every 10 signups = +6 months free for you</li>
            <li style={{ marginBottom: '0.25rem' }}>✅ 100 sessions, 7,000 messages/month</li>
            <li>✅ Early access to all new features</li>
          </ul>
        </div>

        {/* Payment Temporarily Disabled Notice */}
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          <p style={{ color: '#f59e0b', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
            ⚠️ Payments Temporarily Unavailable
          </p>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
            We're currently resolving an issue with our payment provider. Please check back soon or try our free trial!
          </p>
        </div>

        {/* Try Free Trial Button */}
        <button
          onClick={() => navigate('/auth?freeSlot=true')}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#10b981',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            marginBottom: '1rem',
          }}
        >
          🎁 Try Free Trial Instead
        </button>

        {/* Disabled Pay Button */}
        <button
          disabled
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#4b5563',
            color: '#9ca3af',
            cursor: 'not-allowed',
            fontWeight: 600,
            fontSize: '1rem',
            opacity: 0.6,
          }}
        >
          Pay $5 & Pre-Register (Coming Soon)
        </button>

        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.75rem',
          marginTop: '1rem',
          textAlign: 'center',
        }}>
          Secure payment powered by Paddle
        </p>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              textDecoration: 'underline',
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreRegistration;
