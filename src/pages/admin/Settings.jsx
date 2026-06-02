import React, { useState } from 'react';
import useAdminSettings from '../../hooks/useAdminSettings';

const Settings = () => {
  const {
    settings,
    loading,
    togglePreReg,
    togglePayments,
    toggleDailyFreeSlots,
    setDailySlotCount,
    togglePlan,
    updateAdminSettings,
  } = useAdminSettings();

  const [saving, setSaving] = useState(null);
  const [preRegPriceId, setPreRegPriceId] = useState(settings?.preRegPriceId || '');

  const handleToggle = async (toggleFn, key) => {
    setSaving(key);
    try {
      await toggleFn(!settings[key]);
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handlePlanToggle = async (planKey) => {
    const fieldMap = {
      free: 'freePlanActive',
      pro: 'proPlanActive',
      plus: 'plusPlanActive',
      proplus: 'proPlusPlanActive',
    };
    const key = fieldMap[planKey];
    setSaving(key);
    try {
      await togglePlan(planKey, !settings[key]);
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleSavePreRegPrice = async () => {
    setSaving('preRegPriceId');
    try {
      await updateAdminSettings({ preRegPriceId });
      alert('Pre-registration price ID saved!');
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Admin Settings
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0' }}>
          Configure all website settings in one place
        </p>
      </div>

      {/* Mode Switching */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
          Mode Switching
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Switch between commercial and promotional modes. All data syncs properly when switching modes.
        </p>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <ToggleRow
            label="Pre-Registration Mode"
            description="Enable pre-registration ($5 for 1 year Plus). Disables normal payments when active."
            checked={settings?.preRegActive}
            onChange={() => handleToggle(togglePreReg, 'preRegActive')}
            loading={saving === 'preRegActive'}
          />
          <ToggleRow
            label="All Payments"
            description="Master toggle for all payment processing via Paddle"
            checked={settings?.paymentsActive}
            onChange={() => handleToggle(togglePayments, 'paymentsActive')}
            loading={saving === 'paymentsActive'}
          />
          <ToggleRow
            label="Daily Free Slots"
            description="Allow daily free testing with review requirement"
            checked={settings?.dailyFreeSlotsActive}
            onChange={() => handleToggle(toggleDailyFreeSlots, 'dailyFreeSlotsActive')}
            loading={saving === 'dailyFreeSlotsActive'}
          />
        </div>
      </div>

      {/* Plan Availability */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
          Plan Availability
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Control which plans are available for purchase/signup
        </p>
        
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <ToggleRow
            label="Free Plan"
            description="Basic free tier with limited features"
            checked={settings?.freePlanActive}
            onChange={() => handlePlanToggle('free')}
            loading={saving === 'freePlanActive'}
          />
          <ToggleRow
            label="Pro Plan ($9.99/mo)"
            description="Mid-tier subscription"
            checked={settings?.proPlanActive}
            onChange={() => handlePlanToggle('pro')}
            loading={saving === 'proPlanActive'}
          />
          <ToggleRow
            label="Plus Plan ($14.99/mo)"
            description="Higher-tier subscription"
            checked={settings?.plusPlanActive}
            onChange={() => handlePlanToggle('plus')}
            loading={saving === 'plusPlanActive'}
          />
          <ToggleRow
            label="Pro+ Plan ($19.99/mo)"
            description="Premium unlimited subscription"
            checked={settings?.proPlusPlanActive}
            onChange={() => handlePlanToggle('proplus')}
            loading={saving === 'proPlusPlanActive'}
          />
        </div>
      </div>

      {/* Pre-Registration Configuration */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
          Pre-Registration Configuration
        </h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
          }}>
            Pre-Registration Price ID (Paddle)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={preRegPriceId}
              onChange={(e) => setPreRegPriceId(e.target.value)}
              placeholder="pri_01xxx..."
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={handleSavePreRegPrice}
              disabled={saving === 'preRegPriceId'}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Save
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Create a $5 one-time price in Paddle Dashboard → Catalog → Prices
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
          }}>
            Daily Free Slot Count
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={settings?.dailyFreeSlotCount || 10}
            onChange={async (e) => {
              const value = parseInt(e.target.value) || 10;
              setSaving('dailyFreeSlotCount');
              try {
                await setDailySlotCount(value);
              } catch (err) {
                alert(`Failed to update: ${err.message}`);
              } finally {
                setSaving(null);
              }
            }}
            disabled={saving === 'dailyFreeSlotCount'}
            style={{
              width: '100px',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
            }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Number of free testing slots per day (US Eastern Time)
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
          Current Status Overview
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          <StatusItem 
            label="Mode" 
            value={settings?.preRegActive ? 'Pre-Registration' : 'Commercial'} 
            color={settings?.preRegActive ? 'var(--color-accent)' : '#10b981'}
          />
          <StatusItem 
            label="Payments" 
            value={settings?.paymentsActive ? 'Active' : 'Disabled'} 
            color={settings?.paymentsActive ? '#10b981' : '#ef4444'}
          />
          <StatusItem 
            label="Daily Slots" 
            value={settings?.dailyFreeSlotsActive ? 'Active' : 'Disabled'} 
            color={settings?.dailyFreeSlotsActive ? '#10b981' : '#6b7280'}
          />
          <StatusItem 
            label="Free Plan" 
            value={settings?.freePlanActive ? 'Available' : 'Hidden'} 
            color={settings?.freePlanActive ? '#10b981' : '#6b7280'}
          />
          <StatusItem 
            label="Pro Plan" 
            value={settings?.proPlanActive ? 'Available' : 'Hidden'} 
            color={settings?.proPlanActive ? '#10b981' : '#6b7280'}
          />
          <StatusItem 
            label="Plus Plan" 
            value={settings?.plusPlanActive ? 'Available' : 'Hidden'} 
            color={settings?.plusPlanActive ? '#10b981' : '#6b7280'}
          />
          <StatusItem 
            label="Pro+ Plan" 
            value={settings?.proPlusPlanActive ? 'Available' : 'Hidden'} 
            color={settings?.proPlusPlanActive ? '#10b981' : '#6b7280'}
          />
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Last updated: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'N/A'}
        </div>
      </div>
    </div>
  );
};

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
);

// Status Item Component
const StatusItem = ({ label, value, color }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: 'var(--color-bg-primary)',
    borderRadius: '8px',
  }}>
    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
      {label}
    </span>
    <span style={{ color, fontWeight: 600, fontSize: '0.875rem' }}>
      {value}
    </span>
  </div>
);

export default Settings;
