import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getAdminSettings, 
  checkDailySlotAvailability, 
  getRemainingSlotsToday,
  getUserDailySlotUsage,
  initializeTestingUsage,
  isExistingUser,
} from '../appwrite/admin';
import SlotRefreshCountdown from '../components/SlotRefreshCountdown';
import '../styles/Auth.css';

const MIN_AGE = 13;

/**
 * Calculate age from date of birth string (YYYY-MM-DD)
 */
const calculateAge = (dob) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    dateOfBirth: '',
    agreeTerms: false,
    agreePrivacy: false,
    agreeDataCollection: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestLoginAttempted, setGuestLoginAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Pre-reg and daily slots state
  const [adminSettings, setAdminSettings] = useState(null);
  const [remainingSlots, setRemainingSlots] = useState(null);
  const [showFreeSlotFlow, setShowFreeSlotFlow] = useState(false);
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [preRegEmail, setPreRegEmail] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, register, loginGuest } = useAuth();

  // Load admin settings on mount
  useEffect(() => {
    loadAdminSettings();
  }, []);

  // Check if we're in pre-reg mode and handle flows
  useEffect(() => {
    const checkFreeSlotFlow = async () => {
      // Check if user is trying to claim a free slot
      if (searchParams.get('freeSlot') === 'true' && adminSettings?.dailyFreeSlotsActive) {
        setCheckingSlot(true);
        const available = await checkDailySlotAvailability();
        if (available) {
          const remaining = await getRemainingSlotsToday();
          setRemainingSlots(remaining);
          setShowFreeSlotFlow(true);
          setIsLogin(false); // Switch to signup mode
        } else {
          setError('All free testing slots for today have been taken. Please try again tomorrow!');
        }
        setCheckingSlot(false);
      }
    };
    
    if (adminSettings) {
      checkFreeSlotFlow();
    }
  }, [searchParams, adminSettings]);

  const loadAdminSettings = async () => {
    try {
      console.log('[Auth] Loading admin settings...');
      const settings = await getAdminSettings();
      console.log('[Auth] Admin settings loaded:', settings);
      setAdminSettings(settings);
      
      if (settings.dailyFreeSlotsActive) {
        console.log('[Auth] Daily free slots active, fetching remaining slots...');
        const remaining = await getRemainingSlotsToday();
        console.log('[Auth] Remaining slots:', remaining);
        setRemainingSlots(remaining);
      }
    } catch (err) {
      console.error('[Auth] Failed to load admin settings:', err);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Check if guest login was requested
  useEffect(() => {
    if (searchParams.get('guest') === 'true' && !guestLoginAttempted && !loading) {
      setGuestLoginAttempted(true);
      handleGuestLogin();
    }
  }, [searchParams, guestLoginAttempted, loading]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
  };

  const validateSignup = () => {
    if (!formData.name.trim()) {
      return 'Full name is required';
    }
    if (formData.name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (!formData.dateOfBirth) {
      return 'Date of birth is required';
    }
    const age = calculateAge(formData.dateOfBirth);
    if (age < MIN_AGE) {
      return `You must be at least ${MIN_AGE} years old to use LastWeek. We comply with COPPA regulations to protect children's privacy.`;
    }
    if (!formData.agreeTerms) {
      return 'You must agree to the Terms of Service';
    }
    if (!formData.agreePrivacy) {
      return 'You must agree to the Privacy Policy';
    }
    if (!formData.agreeDataCollection) {
      return 'You must acknowledge our data collection practices';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // In pre-reg mode, allow existing users to login
        await login(formData.email, formData.password);
        navigate('/dashboard');
      } else {
        // Validate signup fields
        const validationError = validateSignup();
        if (validationError) {
          setError(validationError);
          setLoading(false);
          return;
        }

        // Check if this is a free slot flow
        if (showFreeSlotFlow) {
          // Check if email already used a free slot or is existing user
          const existing = await getUserDailySlotUsage(formData.email);
          if (existing) {
            setError('This email has already used a free testing slot. Each email can only use the free slot once.');
            setLoading(false);
            return;
          }

          const isExisting = await isExistingUser(formData.email);
          if (isExisting) {
            setError('Existing users cannot join pre-registration. Please login with your existing account.');
            setLoading(false);
            return;
          }
        }

        const userData = {
          dateOfBirth: formData.dateOfBirth,
          agreedTermsAt: new Date().toISOString(),
          agreedPrivacyAt: new Date().toISOString(),
          agreedDataCollectionAt: new Date().toISOString(),
        };

        // Register the user
        const newUser = await register(formData.email, formData.password, formData.name, userData);

        // Initialize testing usage after registration
        if (showFreeSlotFlow && newUser) {
          console.log('[Auth] Free slot flow - newUser:', newUser);
          console.log('[Auth] Attempting to initialize testing usage...');
          
          try {
            // 1. Initialize testing usage document (for one-time limits tracking)
            const testingDoc = await initializeTestingUsage(newUser.$id, formData.email);
            console.log('[Auth] Testing usage created:', testingDoc.$id);
            
            // 2. Claim the daily slot (increments usedSlots counter and records usage)
            const { claimDailySlot } = await import('../appwrite/admin');
            await claimDailySlot(newUser.$id, formData.email);
            console.log('[Auth] Daily slot claimed');
            
          } catch (err) {
            console.error('[Auth] Failed to initialize testing usage:', err);
            console.error('[Auth] Error details:', err.message);
            // Don't block registration, but log the error
          }
        } else if (showFreeSlotFlow) {
          console.error('[Auth] showFreeSlotFlow is true but newUser is:', newUser);
        }

        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await loginGuest();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      dateOfBirth: '',
      agreeTerms: false,
      agreePrivacy: false,
      agreeDataCollection: false,
    });
  };

  // Max date for DOB (today minus MIN_AGE years)
  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - MIN_AGE);
  const maxDobString = maxDobDate.toISOString().split('T')[0];

  // In pre-reg mode, existing users can LOGIN (not blocked), but new signups are blocked
  // The pre-reg blocking screen should only show when user tries to SIGN UP, not login
  const isPreRegBlocked = false; // Never block - we show pre-reg info in signup form instead

  // Show loading state while fetching admin settings
  if (!adminSettings) {
    return (
      <div className="auth">
        <button className="home-button" onClick={() => navigate('/')} title="Back to Home">
          ← Home
        </button>
        <div className="container">
          <div className="auth-container">
            <div className="auth-header" style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                backgroundColor: 'var(--color-bg-secondary)', 
                borderRadius: '16px',
                margin: '0 auto 16px',
                animation: 'pulse 2s infinite',
              }} />
              <div style={{ 
                width: '200px', 
                height: '28px', 
                backgroundColor: 'var(--color-bg-secondary)', 
                borderRadius: '8px',
                margin: '0 auto 1rem',
                animation: 'pulse 2s infinite',
              }} />
              <div style={{ 
                width: '250px', 
                height: '18px', 
                backgroundColor: 'var(--color-bg-secondary)', 
                borderRadius: '4px',
                margin: '0 auto',
                animation: 'pulse 2s infinite',
              }} />
            </div>
          </div>
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

  return (
    <div className="auth">
      <button className="home-button" onClick={() => navigate('/')} title="Back to Home">
        ← Home
      </button>
      <div className="container">
        <div className="auth-container">
          
          {/* ── Pre-Registration Mode Info (shown to new users trying to sign up) ─────────────────────────────────────── */}
          {adminSettings?.preRegActive && !isLogin && !showFreeSlotFlow ? (
            <>
              <div className="auth-header">
                <img
                  src="/logos/lastweek_main_logo.png"
                  alt="LastWeek"
                  className="auth-logo-img"
                  onClick={() => navigate('/')}
                  style={{ height: '100px', cursor: 'pointer', marginBottom: '16px' }}
                />
                <h2 className="auth-title">🎉 Pre-Registration Open</h2>
                <p className="auth-subtitle">
                  We're currently in pre-registration mode. Sign up is limited.
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                border: '1px solid rgba(var(--color-accent-rgb), 0.5)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}>
                <h3 style={{ color: 'var(--color-accent)', margin: '0 0 1rem', fontSize: '1.1rem', textAlign: 'center' }}>
                  Two Ways to Join
                </h3>

                {/* Option 1: Pay $5 */}
                <div style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}>
                  <h4 style={{ color: 'var(--color-text-primary)', margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
                    💳 Pay $5 Now
                  </h4>
                  <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
                    Get <strong style={{ color: 'var(--color-accent)' }}>Plus free for 1 year</strong> (a $180 value!) 
                    + unique promo code. Every 10 friends who join = +6 months free!
                  </p>
                  <button
                    onClick={() => navigate('/pre-register')}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'var(--color-accent)',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Pre-Register Now
                  </button>
                </div>

                {/* Option 2: Free Testing Slot */}
                {adminSettings?.dailyFreeSlotsActive ? (
                  <div style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: '8px',
                    padding: '1rem',
                  }}>
                    <h4 style={{ color: 'var(--color-text-primary)', margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
                      🎁 Free Testing Slot
                    </h4>
                    <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
                      <strong style={{ color: '#10b981' }}>{remainingSlots ?? adminSettings?.dailyFreeSlotCount ?? 10}</strong> of <strong>{adminSettings?.dailyFreeSlotCount ?? 10}</strong> slots remaining today (US time).
                      Test all features once, leave a review, and get <strong style={{ color: '#10b981' }}>Plus free for 1 year</strong>!
                    </p>
                    {(remainingSlots ?? adminSettings?.dailyFreeSlotCount ?? 10) > 0 ? (
                      <>
                        <button
                          onClick={() => {
                            setShowFreeSlotFlow(true);
                            setIsLogin(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #10b981',
                            backgroundColor: 'transparent',
                            color: '#10b981',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                          }}
                        >
                          Claim Free Slot
                        </button>
                        <SlotRefreshCountdown />
                      </>
                    ) : (
                      <div>
                        <p style={{ color: '#f59e0b', margin: '0 0 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
                          ⏰ All slots taken today. Check back tomorrow!
                        </p>
                        <SlotRefreshCountdown />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.85rem' }}>
                      Free testing slots are currently not available.
                    </p>
                  </div>
                )}
              </div>

              {/* Existing user login link */}
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setShowFreeSlotFlow(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-accent)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '0.85rem',
                    }}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* ── Normal Auth Form ─────────────────────────────────────────── */}
              <div className="auth-header">
                <img
                  src="/logos/lastweek_main_logo.png"
                  alt="LastWeek"
                  className="auth-logo-img"
                  onClick={() => navigate('/')}
                  style={{ height: '100px', cursor: 'pointer', marginBottom: '16px' }}
                />
                <h2 className="auth-title">
                  {isLogin ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="auth-subtitle">
                  {isLogin
                    ? 'Sign in to continue your study sessions'
                    : 'Join thousands of students studying smarter with AI'}
                </p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                {/* ── Free Slot Banner ─────────────────────────────────────── */}
                {showFreeSlotFlow && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                  }}>
                    <h4 style={{ color: '#10b981', margin: '0 0 0.5rem', fontSize: '1rem' }}>
                      🎁 Free Testing Slot
                    </h4>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.85rem' }}>
                      <strong>{remainingSlots ?? '?'}</strong> slots remaining today! 
                      Try all features once. Leave a review and get <strong>Plus free for 1 year</strong>!
                    </p>
                  </div>
                )}

            {/* ── Signup-only fields ─────────────────────────────────────── */}
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="form-input"
                    max={maxDobString}
                    required
                  />
                  <small className="form-hint">You must be at least 13 years old to use LastWeek</small>
                </div>
              </>
            )}

            {/* ── Shared fields ───────────────────────────────────────────── */}
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder={isLogin ? 'Enter your password' : 'Create a password (min 8 characters)'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)', fontSize: '0.85rem',
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* ── Confirm password (signup only) ──────────────────────────── */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            {/* ── Legal agreements (signup only) ──────────────────────────── */}
            {!isLogin && (
              <div className="auth-legal" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '1rem 0' }}>
                <label className="auth-checkbox" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <span>
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                      Terms of Service
                    </a>{' '}
                    *
                  </span>
                </label>

                <label className="auth-checkbox" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleInputChange}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <span>
                    I have read and agree to the{' '}
                    <a href="/privacy" target="_blank" rel="noopener" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                      Privacy Policy
                    </a>{' '}
                    *
                  </span>
                </label>

                <label className="auth-checkbox" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="agreeDataCollection"
                    checked={formData.agreeDataCollection}
                    onChange={handleInputChange}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <span>
                    I understand that LastWeek collects my study data (sessions, messages, flashcards, uploaded files) to provide AI tutoring services. My data is stored securely and never sold to third parties. *
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            className="btn btn-secondary auth-guest"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            Continue as Guest
          </button>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                className="auth-toggle"
                onClick={toggleMode}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
