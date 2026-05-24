import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, register, loginGuest } = useAuth();

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
        await login(formData.email, formData.password);
      } else {
        // Validate signup fields
        const validationError = validateSignup();
        if (validationError) {
          setError(validationError);
          setLoading(false);
          return;
        }

        await register(formData.email, formData.password, formData.name, {
          dateOfBirth: formData.dateOfBirth,
          agreedTermsAt: new Date().toISOString(),
          agreedPrivacyAt: new Date().toISOString(),
          agreedDataCollectionAt: new Date().toISOString(),
        });
      }
      navigate('/dashboard');
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

  return (
    <div className="auth">
      <button className="home-button" onClick={() => navigate('/')} title="Back to Home">
        ← Home
      </button>
      <div className="container">
        <div className="auth-container">
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
        </div>
      </div>
    </div>
  );
};

export default Auth;
