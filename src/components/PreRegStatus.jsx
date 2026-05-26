import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPreRegistrationByUserId } from '../appwrite/admin';
import { getUserSubscription, isSubscriptionActive } from '../appwrite/subscription';

/**
 * PreRegStatus - Shows pre-registration status for users who submitted reviews
 * Displays their promo code and benefits
 */
const PreRegStatus = () => {
  const { user } = useAuth();
  const [preReg, setPreReg] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.$id) {
        setLoading(false);
        return;
      }

      try {
        const [preRegDoc, subDoc] = await Promise.all([
          getPreRegistrationByUserId(user.$id),
          getUserSubscription(user.$id),
        ]);
        setPreReg(preRegDoc);
        setSubscription(subDoc);
      } catch (err) {
        console.error('[PreRegStatus] Failed to fetch:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.$id]);

  const copyPromoCode = async () => {
    if (preReg?.promoCode) {
      await navigator.clipboard.writeText(preReg.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return null; // Don't show loading state for this component
  }

  // No pre-registration record
  if (!preReg) {
    return null;
  }

  // Check if user has active Plus subscription (converted)
  const hasActivePlus = subscription && 
    isSubscriptionActive(subscription) && 
    subscription.plan === 'plus';

  // If converted to Plus, show success message
  if (hasActivePlus || preReg.status === 'converted') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.5)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🌟</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#10b981', margin: '0 0 0.5rem', fontSize: '1.2rem' }}>
              You Have Plus!
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 1rem', fontSize: '0.9rem' }}>
              Thank you for being an early supporter! Your <strong style={{ color: '#10b981' }}>Plus plan is now active</strong>.
            </p>

            {/* Promo Code Section - still show for referrals */}
            <div style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1rem',
            }}>
              <label style={{
                display: 'block',
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Your Referral Code
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <code style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#a855f7',
                  letterSpacing: '2px',
                }}>
                  {preReg.promoCode}
                </code>
                <button
                  onClick={copyPromoCode}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: copied ? 'rgba(16, 185, 129, 0.2)' : 'var(--color-bg-secondary)',
                    color: copied ? '#10b981' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem',
                margin: '0.5rem 0 0',
              }}>
                Share with friends! Every 10 friends who join = +6 months free for you.
              </p>
            </div>

            {/* Referral Stats */}
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  Referrals so far:
                </span>
                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '1rem' }}>
                  {preReg.promoCodeUses || 0} / 10
                </span>
              </div>
              {preReg.bonusMonthsEarned > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.5rem',
                }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                    Bonus months earned:
                  </span>
                  <span style={{ color: '#a855f7', fontWeight: 600, fontSize: '1rem' }}>
                    +{preReg.bonusMonthsEarned} months
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Still waiting for conversion (pre-reg active)
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
      border: '1px solid rgba(168, 85, 247, 0.5)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ fontSize: '2.5rem' }}>🎉</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#a855f7', margin: '0 0 0.5rem', fontSize: '1.2rem' }}>
            You're Pre-Registered!
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 1rem', fontSize: '0.9rem' }}>
            Thank you for testing LastWeek! You'll get <strong style={{ color: '#10b981' }}>Plus free for 1 year</strong> when we launch.
          </p>

          {/* Promo Code Section */}
          <div style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <label style={{
              display: 'block',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Your Promo Code
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <code style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#a855f7',
                letterSpacing: '2px',
              }}>
                {preReg.promoCode}
              </code>
              <button
                onClick={copyPromoCode}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: copied ? 'rgba(16, 185, 129, 0.2)' : 'var(--color-bg-secondary)',
                  color: copied ? '#10b981' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              margin: '0.5rem 0 0',
            }}>
              Share with friends! Every 10 friends who join = +6 months free for you.
            </p>
          </div>

          {/* Benefits */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
            }}>
              <span style={{ color: '#10b981' }}>✓</span>
              Plus free for 1 year
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
            }}>
              <span style={{ color: '#10b981' }}>✓</span>
              Unique referral code
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
            }}>
              <span style={{ color: '#10b981' }}>✓</span>
              Early access to new features
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
            }}>
              <span style={{ color: '#10b981' }}>✓</span>
              Earn bonus months from referrals
            </div>
          </div>

          {/* Referral Stats */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderRadius: '8px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Referrals so far:
              </span>
              <span style={{ color: '#a855f7', fontWeight: 600, fontSize: '1rem' }}>
                {preReg.promoCodeUses || 0} / 10
              </span>
            </div>
            {preReg.bonusMonthsEarned > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem',
              }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  Bonus months earned:
                </span>
                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '1rem' }}>
                  +{preReg.bonusMonthsEarned} months
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreRegStatus;
