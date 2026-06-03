import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAdminSettings,
  updateAdminSettings,
  getAdminStats,
  getPreRegistrations,
  getReviews,
  getTodailySlots,
  getDailySlotsHistory,
  cleanupDuplicateDailySlots,
  getRemainingSlotsToday,
} from '../appwrite/admin';
import '../styles/Auth.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminSettings, setAdminSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [preRegs, setPreRegs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [todaySlots, setTodaySlots] = useState(null);
  const [slotsHistory, setSlotsHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if user is admin (has 'admin' label)
    if (!user || !user.labels?.includes('admin')) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settings, adminStats, preRegistrations, userReviews, slots, history] = await Promise.all([
        getAdminSettings(),
        getAdminStats(),
        getPreRegistrations(),
        getReviews(),
        getTodailySlots(),
        getDailySlotsHistory(30),
      ]);

      setAdminSettings(settings);
      setStats(adminStats);
      setPreRegs(preRegistrations);
      setReviews(userReviews);
      setTodaySlots(slots);
      setSlotsHistory(history);
    } catch (err) {
      console.error('[AdminPanel] Failed to load data:', err);
      setMessage('Failed to load admin data. Check console for errors.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (updates) => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await updateAdminSettings(updates);
      setAdminSettings(updated);
      setMessage('✅ Settings updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('[AdminPanel] Failed to update settings:', err);
      setMessage('❌ Failed to update settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    try {
      const result = await cleanupDuplicateDailySlots();
      setMessage(`✅ Cleaned up ${result.cleaned} duplicate slot documents`);
      await loadData(); // Reload data
    } catch (err) {
      setMessage('❌ Failed to cleanup: ' + err.message);
    }
  };

  const remainingSlots = todaySlots ? Math.max(0, todaySlots.totalSlots - todaySlots.usedSlots) : 0;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-primary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
          <div>Loading admin panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      padding: '2rem 1rem',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              marginBottom: '1rem',
            }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{ color: 'var(--color-text-primary)', margin: 0 }}>Admin Panel</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0' }}>
            Manage settings, view stats, and monitor free slots
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: message.startsWith('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.startsWith('✅') ? '#10b981' : '#ef4444'}`,
            color: message.startsWith('✅') ? '#10b981' : '#ef4444',
            marginBottom: '1.5rem',
          }}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid var(--color-border)',
          overflowX: 'auto',
        }}>
          {['overview', 'settings', 'free-slots', 'pre-regs', 'reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--color-accent)' : 'transparent'}`,
                color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 600 : 400,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>Dashboard Overview</h2>
            
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <StatCard
                title="Pre-Registrations"
                value={stats?.totalPreRegistrations || 0}
                subtitle={`${stats?.activePreRegistrations || 0} active`}
                icon="🎉"
              />
              <StatCard
                title="Daily Free Slots"
                value={`${todaySlots?.usedSlots || 0} / ${todaySlots?.totalSlots || 0}`}
                subtitle={`${remainingSlots} remaining today`}
                icon="🎁"
              />
              <StatCard
                title="Reviews"
                value={stats?.totalReviews || 0}
                subtitle={`${stats?.approvedReviews || 0} approved, ${stats?.pendingReviews || 0} pending`}
                icon="⭐"
              />
              <StatCard
                title="Promo Code Uses"
                value={stats?.totalPromoCodeUses || 0}
                subtitle={`${stats?.totalBonusMonthsEarned || 0} bonus months earned`}
                icon="🎫"
              />
            </div>

            {/* Today's Slot Info */}
            {todaySlots && (
              <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}>
                <h3 style={{ color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
                  Today's Free Slots ({todaySlots.date})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Total Slots</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {todaySlots.totalSlots}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Used</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                      {todaySlots.usedSlots}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Remaining</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                      {remainingSlots}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Utilization</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {todaySlots.totalSlots > 0 ? Math.round((todaySlots.usedSlots / todaySlots.totalSlots) * 100) : 0}%
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={handleCleanupDuplicates}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    🧹 Cleanup Duplicate Slots
                  </button>
                </div>
              </div>
            )}

            {/* Current Settings */}
            <div style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}>
              <h3 style={{ color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>Current Settings</h3>
              <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
                <SettingRow label="Pre-Registration Active" value={adminSettings?.preRegActive ? '✅ Yes' : '❌ No'} />
                <SettingRow label="Payments Active" value={adminSettings?.paymentsActive ? '✅ Yes' : '❌ No'} />
                <SettingRow label="Daily Free Slots Active" value={adminSettings?.dailyFreeSlotsActive ? '✅ Yes' : '❌ No'} />
                <SettingRow label="Daily Free Slot Count" value={adminSettings?.dailyFreeSlotCount || 10} />
                <SettingRow label="Free Plan Active" value={adminSettings?.freePlanActive ? '✅ Yes' : '❌ No'} />
                <SettingRow label="Pro Plan Active" value={adminSettings?.proPlanActive ? '✅ Yes' : '❌ No'} />
                <SettingRow label="Plus Plan Active" value={adminSettings?.plusPlanActive ? '✅ Yes' : '❌ No'} />
                <SettingRow label="Pro+ Plan Active" value={adminSettings?.proPlusPlanActive ? '✅ Yes' : '❌ No'} />
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>Admin Settings</h2>
            
            <div style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}>
              <SettingToggle
                label="Pre-Registration Active"
                description="Enable $5 pre-registration mode for new users"
                checked={adminSettings?.preRegActive || false}
                onChange={(checked) => handleSettingsUpdate({ preRegActive: checked })}
                disabled={saving}
              />
              
              <SettingToggle
                label="Payments Active"
                description="Enable Paddle payment processing for subscriptions"
                checked={adminSettings?.paymentsActive !== false}
                onChange={(checked) => handleSettingsUpdate({ paymentsActive: checked })}
                disabled={saving}
              />
              
              <SettingToggle
                label="Daily Free Slots Active"
                description="Enable free testing slots for new users (resets daily)"
                checked={adminSettings?.dailyFreeSlotsActive || false}
                onChange={(checked) => handleSettingsUpdate({ dailyFreeSlotsActive: checked })}
                disabled={saving}
              />
              
              <SettingNumber
                label="Daily Free Slot Count"
                description="Number of free slots available per day (US Eastern time)"
                value={adminSettings?.dailyFreeSlotCount || 10}
                onChange={(value) => handleSettingsUpdate({ dailyFreeSlotCount: value })}
                disabled={saving}
                min={1}
                max={100}
              />
              
              <h3 style={{ color: 'var(--color-text-primary)', margin: '1.5rem 0 1rem', fontSize: '1rem' }}>
                Plan Visibility
              </h3>
              
              <SettingToggle
                label="Free Plan Active"
                description="Show free plan on pricing page"
                checked={adminSettings?.freePlanActive !== false}
                onChange={(checked) => handleSettingsUpdate({ freePlanActive: checked })}
                disabled={saving}
              />
              
              <SettingToggle
                label="Pro Plan Active"
                description="Show Pro plan on pricing page"
                checked={adminSettings?.proPlanActive !== false}
                onChange={(checked) => handleSettingsUpdate({ proPlanActive: checked })}
                disabled={saving}
              />
              
              <SettingToggle
                label="Plus Plan Active"
                description="Show Plus plan on pricing page"
                checked={adminSettings?.plusPlanActive !== false}
                onChange={(checked) => handleSettingsUpdate({ plusPlanActive: checked })}
                disabled={saving}
              />
              
              <SettingToggle
                label="Pro+ Plan Active"
                description="Show Pro+ plan on pricing page"
                checked={adminSettings?.proPlusPlanActive !== false}
                onChange={(checked) => handleSettingsUpdate({ proPlusPlanActive: checked })}
                disabled={saving}
              />
            </div>
          </div>
        )}

        {/* Free Slots Tab */}
        {activeTab === 'free-slots' && (
          <div>
            <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>Free Slots History</h2>
            
            <div style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-primary)' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-primary)' }}>Total Slots</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-primary)' }}>Used</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-primary)' }}>Remaining</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-primary)' }}>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {slotsHistory.map(slot => {
                    const remaining = Math.max(0, slot.totalSlots - slot.usedSlots);
                    const utilization = slot.totalSlots > 0 ? Math.round((slot.usedSlots / slot.totalSlots) * 100) : 0;
                    return (
                      <tr key={slot.$id} style={{ borderTop: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--color-text-primary)' }}>{slot.date}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{slot.totalSlots}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>{slot.usedSlots}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{remaining}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--color-accent)', fontWeight: 600 }}>{utilization}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pre-Regs Tab */}
        {activeTab === 'pre-regs' && (
          <div>
            <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>
              Pre-Registrations ({preRegs.length})
            </h2>
            
            <div style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '1rem',
              maxHeight: '600px',
              overflowY: 'auto',
            }}>
              {preRegs.map(preReg => (
                <div key={preReg.$id} style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.9rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{preReg.name || 'No name'}</strong>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      backgroundColor: preReg.type === 'paid' ? 'rgba(var(--color-accent-rgb), 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: preReg.type === 'paid' ? 'var(--color-accent)' : '#10b981',
                    }}>
                      {preReg.type}
                    </span>
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>{preReg.email}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Promo: {preReg.promoCode} | Uses: {preReg.promoCodeUses} | Bonus: {preReg.bonusMonthsEarned} months
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>
              Reviews ({reviews.length})
            </h2>
            
            <div style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '1rem',
              maxHeight: '600px',
              overflowY: 'auto',
            }}>
              {reviews.map(review => (
                <div key={review.$id} style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{review.userName}</strong>
                      <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                        {'★'.repeat(review.rating || 5)}{'☆'.repeat(5 - (review.rating || 5))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: review.isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: review.isApproved ? '#10b981' : '#ef4444',
                      }}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {review.title}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    {review.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, subtitle, icon }) => (
  <div style={{
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '1.5rem',
  }}>
    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{title}</div>
    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{subtitle}</div>
  </div>
);

const SettingRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
    <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{value}</span>
  </div>
);

const SettingToggle = ({ label, description, checked, onChange, disabled }) => (
  <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
      <div>
        <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{description}</div>
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span style={{
          position: 'absolute',
          cursor: disabled ? 'not-allowed' : 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
          transition: '0.2s',
          borderRadius: '24px',
          opacity: disabled ? 0.5 : 1,
        }}>
          <span style={{
            position: 'absolute',
            content: '',
            height: '18px',
            width: '18px',
            left: checked ? '28px' : '3px',
            bottom: '3px',
            backgroundColor: 'white',
            transition: '0.2s',
            borderRadius: '50%',
          }} />
        </span>
      </label>
    </div>
  </div>
);

const SettingNumber = ({ label, description, value, onChange, disabled, min, max }) => (
  <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
      <div>
        <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{description}</div>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        min={min}
        max={max}
        style={{
          width: '80px',
          padding: '0.5rem',
          borderRadius: '6px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
          fontSize: '1rem',
          textAlign: 'center',
        }}
      />
    </div>
  </div>
);

export default AdminPanel;
