import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminSettings from '../../hooks/useAdminSettings';
import { getAdminStats, getRemainingSlotsToday, completeAllPreRegistrations } from '../../appwrite/admin';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    settings,
    loading,
    togglePreReg,
    togglePayments,
    toggleDailyFreeSlots,
    setDailySlotCount,
    togglePlan,
    refresh,
  } = useAdminSettings();

  const [stats, setStats] = useState(null);
  const [remainingSlots, setRemainingSlots] = useState(null);
  const [saving, setSaving] = useState(null);
  const [slotCountInput, setSlotCountInput] = useState(settings?.dailyFreeSlotCount || 10);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [completingPreReg, setCompletingPreReg] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  // Sync slot count input with settings when they load
  useEffect(() => {
    if (settings?.dailyFreeSlotCount) {
      setSlotCountInput(settings.dailyFreeSlotCount);
    }
  }, [settings?.dailyFreeSlotCount]);

  const loadStats = async () => {
    const [statsData, slotsData] = await Promise.all([
      getAdminStats(),
      getRemainingSlotsToday(),
    ]);
    setStats(statsData);
    setRemainingSlots(slotsData);
  };

  const handleToggle = async (toggleFn, key) => {
    setSaving(key);
    setSaveSuccess(null);
    try {
      await toggleFn(!settings[key]);
      setSaveSuccess(key);
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleSlotCountSave = async () => {
    if (slotCountInput < 1) return;
    setSaving('dailyFreeSlotCount');
    setSaveSuccess(null);
    try {
      await setDailySlotCount(slotCountInput);
      await refresh(); // Refresh settings from server
      setSaveSuccess('dailyFreeSlotCount');
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleCompletePreRegistrations = async () => {
    if (!confirm('This will grant Plus plans to ALL active pre-registered users. Continue?')) {
      return;
    }
    
    if (!confirm('Are you SURE? This action cannot be easily undone.')) {
      return;
    }

    setCompletingPreReg(true);
    setCompletionResult(null);
    
    try {
      const result = await completeAllPreRegistrations();
      setCompletionResult(result);
      await loadStats(); // Refresh stats
    } catch (err) {
      alert(`Failed to complete pre-registrations: ${err.message}`);
    } finally {
      setCompletingPreReg(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading admin settings...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Admin Dashboard
            </h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0' }}>
              Manage pre-registration, payments, and website settings
            </p>
          </div>
          {saveSuccess && (
            <div style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              color: '#10b981',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              ✓ Settings saved!
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <StatCard
            label="Pre-Registrations"
            value={stats.totalPreRegistrations}
            subtext={`${stats.activePreRegistrations} active`}
            icon="📋"
          />
          <StatCard
            label="Promo Code Uses"
            value={stats.totalPromoCodeUses}
            subtext={`${stats.totalPromoCodesIssued} codes issued`}
            icon="🎟️"
          />
          <StatCard
            label="Bonus Months Owed"
            value={stats.totalBonusMonthsEarned}
            subtext={`$${stats.estimatedOwedValue} value`}
            icon="⏱️"
          />
          <StatCard
            label="Reviews"
            value={stats.totalReviews}
            subtext={`${stats.pendingReviews} pending approval`}
            icon="⭐"
          />
          <StatCard
            label="Today's Free Slots"
            value={remainingSlots ?? '?'}
            subtext={`of ${settings?.dailyFreeSlotCount || 10} total`}
            icon="🎫"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
          Quick Toggles
        </h2>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Pre-Registration Toggle */}
          <ToggleRow
            label="Pre-Registration Mode"
            description="Enable pre-registration ($5 for 1 year Plus)"
            checked={settings?.preRegActive}
            onChange={() => handleToggle(togglePreReg, 'preRegActive')}
            loading={saving === 'preRegActive'}
          />

          {/* Payments Toggle */}
          <ToggleRow
            label="All Payments"
            description="Master toggle for all payment processing"
            checked={settings?.paymentsActive}
            onChange={() => handleToggle(togglePayments, 'paymentsActive')}
            loading={saving === 'paymentsActive'}
          />

          {/* Daily Free Slots Toggle */}
          <ToggleRow
            label="Daily Free Slots"
            description="Allow daily free testing with review requirement"
            checked={settings?.dailyFreeSlotsActive}
            onChange={() => handleToggle(toggleDailyFreeSlots, 'dailyFreeSlotsActive')}
            loading={saving === 'dailyFreeSlotsActive'}
          />

          {/* Daily Slot Count */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 0',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                Daily Slot Count
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Number of free testing slots per day (US time)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                min="1"
                max="1000"
                value={slotCountInput}
                onChange={(e) => setSlotCountInput(parseInt(e.target.value) || 1)}
                disabled={saving === 'dailyFreeSlotCount'}
                style={{
                  width: '80px',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  textAlign: 'center',
                }}
              />
              <button
                onClick={handleSlotCountSave}
                disabled={saving === 'dailyFreeSlotCount' || slotCountInput === settings?.dailyFreeSlotCount}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: saveSuccess === 'dailyFreeSlotCount' ? '#10b981' : 'var(--color-accent)',
                  color: 'white',
                  cursor: saving === 'dailyFreeSlotCount' ? 'wait' : 'pointer',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  opacity: slotCountInput === settings?.dailyFreeSlotCount ? 0.5 : 1,
                }}
              >
                {saving === 'dailyFreeSlotCount' ? 'Saving...' : saveSuccess === 'dailyFreeSlotCount' ? '✓ Saved!' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Toggles */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
          Plan Availability
        </h2>
        
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <ToggleRow
            label="Free Plan"
            description="Basic free tier with limited features"
            checked={settings?.freePlanActive}
            onChange={() => handleToggle(() => togglePlan('free', !settings?.freePlanActive), 'freePlanActive')}
            loading={saving === 'freePlanActive'}
          />
          <ToggleRow
            label="Pro Plan ($9.99/mo)"
            description="Mid-tier subscription"
            checked={settings?.proPlanActive}
            onChange={() => handleToggle(() => togglePlan('pro', !settings?.proPlanActive), 'proPlanActive')}
            loading={saving === 'proPlanActive'}
          />
          <ToggleRow
            label="Plus Plan ($14.99/mo)"
            description="Higher-tier subscription"
            checked={settings?.plusPlanActive}
            onChange={() => handleToggle(() => togglePlan('plus', !settings?.plusPlanActive), 'plusPlanActive')}
            loading={saving === 'plusPlanActive'}
          />
          <ToggleRow
            label="Pro+ Plan ($19.99/mo)"
            description="Premium unlimited subscription"
            checked={settings?.proPlusPlanActive}
            onChange={() => handleToggle(() => togglePlan('proplus', !settings?.proPlusPlanActive), 'proPlusPlanActive')}
            loading={saving === 'proPlusPlanActive'}
          />
        </div>
      </div>

      {/* Complete Pre-Registrations */}
      {stats?.activePreRegistrations > 0 && (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          border: '1px solid rgba(var(--color-accent-rgb), 0.5)',
          padding: '1.5rem',
          marginTop: '2rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
            🎁 Complete Pre-Registrations
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
            Grant Plus plans to all {stats.activePreRegistrations} active pre-registered users. 
            Each user gets 12 months base + bonus months from referrals.
          </p>
          
          <button
            onClick={handleCompletePreRegistrations}
            disabled={completingPreReg}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: completingPreReg ? 'var(--color-text-muted)' : 'var(--color-accent)',
              color: 'white',
              cursor: completingPreReg ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {completingPreReg ? 'Processing...' : 'Grant Plus to All Pre-Registered Users'}
          </button>
          
          {completionResult && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: completionResult.failed === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${completionResult.failed === 0 ? '#10b981' : '#ef4444'}`,
            }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: completionResult.failed === 0 ? '#10b981' : '#ef4444' }}>
                {completionResult.success}/{completionResult.total} users converted successfully
              </p>
              {completionResult.failed > 0 && (
                <p style={{ margin: 0, color: '#ef4444', fontSize: '0.85rem' }}>
                  {completionResult.failed} users failed. Check console for details.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/admin/pre-reg')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          View Pre-Registrations →
        </button>
        <button
          onClick={() => navigate('/admin/reviews')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Moderate Reviews →
        </button>
        <button
          onClick={() => { refresh(); loadStats(); }}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, subtext, icon }) => (
  <div style={{
    backgroundColor: 'var(--color-bg-secondary)',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    padding: '1.25rem',
  }}>
    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
      {label}
    </div>
    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
      {subtext}
    </div>
  </div>
);

// Toggle Row Component
const ToggleRow = ({ label, description, checked, onChange, loading }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid var(--color-border)',
  }}>
    <div>
      <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        {description}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {loading && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>Saving...</span>
      )}
      <button
        onClick={onChange}
        disabled={loading}
        style={{
          width: '50px',
          height: '28px',
          borderRadius: '14px',
          border: 'none',
          backgroundColor: checked ? '#10b981' : 'var(--color-bg-tertiary)',
          cursor: loading ? 'wait' : 'pointer',
          position: 'relative',
          transition: 'background-color 0.2s',
        }}
      >
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          backgroundColor: 'white',
          position: 'absolute',
          top: '3px',
          left: checked ? '25px' : '3px',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  </div>
);

export default Dashboard;
