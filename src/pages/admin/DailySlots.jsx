import React, { useState, useEffect } from 'react';
import { getDailySlotsHistory, getRemainingSlotsToday, getTodailySlots, cleanupDuplicateDailySlots } from '../../appwrite/admin';
import useAdminSettings from '../../hooks/useAdminSettings';

const DailySlots = () => {
  const { dailyFreeSlotsActive, dailyFreeSlotCount, toggleDailyFreeSlots, setDailySlotCount, settings } = useAdminSettings();
  const [history, setHistory] = useState([]);
  const [todaySlots, setTodaySlots] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [historyData, todayData, remainingData] = await Promise.all([
      getDailySlotsHistory(30),
      getTodailySlots().catch(() => null),
      getRemainingSlotsToday().catch(() => null),
    ]);
    setHistory(historyData);
    setTodaySlots(todayData);
    setRemaining(remainingData);
    setLoading(false);
  };
  
  const handleCleanupDuplicates = async () => {
    if (!confirm('This will delete duplicate daily slot documents for today. Continue?')) return;
    
    setCleaning(true);
    try {
      const result = await cleanupDuplicateDailySlots();
      alert(`Cleaned up ${result.cleaned} duplicate documents.`);
      loadData();
    } catch (err) {
      alert(`Failed to cleanup: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const handleToggleSlots = async () => {
    setSaving(true);
    try {
      await toggleDailyFreeSlots(!dailyFreeSlotsActive);
    } catch (err) {
      alert(`Failed to toggle: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSlotCountChange = async (e) => {
    const value = parseInt(e.target.value) || 10;
    if (value < 1) return;
    setSaving(true);
    try {
      await setDailySlotCount(value);
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Calculate stats
  const totalSlotsGiven = history.reduce((sum, h) => sum + (h.usedSlots || 0), 0);
  const avgUsage = history.length > 0 
    ? (history.reduce((sum, h) => sum + h.usedSlots, 0) / history.length).toFixed(1)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Daily Free Slots
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0' }}>
          Manage daily free testing slots for new users
        </p>
      </div>

      {/* Today's Status */}
      <div style={{
        backgroundColor: dailyFreeSlotsActive ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: `1px solid ${dailyFreeSlotsActive ? '#10b981' : 'var(--color-border)'}`,
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              {dailyFreeSlotsActive ? '✅ Daily Free Slots Active' : '⏸️ Daily Free Slots Disabled'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
              {dailyFreeSlotsActive 
                ? 'New users can claim a free testing slot today' 
                : 'Enable to allow free testing with review requirement'}
            </p>
          </div>
          <button
            onClick={handleToggleSlots}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: dailyFreeSlotsActive ? '#ef4444' : '#10b981',
              color: 'white',
              cursor: saving ? 'wait' : 'pointer',
              fontWeight: 600,
            }}
          >
            {saving ? 'Saving...' : dailyFreeSlotsActive ? 'Disable' : 'Enable'}
          </button>
        </div>

        {dailyFreeSlotsActive && todaySlots && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {todaySlots.totalSlots}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Slots</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                {remaining ?? '?'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Remaining</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                {todaySlots.usedSlots}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Used Today</div>
            </div>
          </div>
        )}
      </div>

      {/* Slot Count Setting */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
          Slot Configuration
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ color: 'var(--color-text-secondary)' }}>
            Daily Slot Count:
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={settings?.dailyFreeSlotCount || dailyFreeSlotCount || 10}
            onChange={handleSlotCountChange}
            disabled={saving}
            style={{
              width: '100px',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              textAlign: 'center',
            }}
          />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            slots per day (US Eastern Time)
          </span>
          <button
            onClick={handleCleanupDuplicates}
            disabled={cleaning}
            style={{
              marginLeft: 'auto',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #f59e0b',
              backgroundColor: 'transparent',
              color: '#f59e0b',
              cursor: cleaning ? 'wait' : 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {cleaning ? 'Cleaning...' : 'Cleanup Duplicates'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {history.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Days Tracked
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {totalSlotsGiven}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Total Slots Given
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {avgUsage}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Avg Usage/Day
          </div>
        </div>
      </div>

      {/* History Table */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            Slot Usage History (Last 30 Days)
          </h2>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading history...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Total Slots</th>
                  <th style={thStyle}>Used</th>
                  <th style={thStyle}>Remaining</th>
                  <th style={thStyle}>Usage %</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                      No history yet
                    </td>
                  </tr>
                ) : (
                  history.map((h, i) => {
                    const usagePercent = h.totalSlots > 0 
                      ? Math.round((h.usedSlots / h.totalSlots) * 100) 
                      : 0;
                    return (
                      <tr key={h.$id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                        <td style={tdStyle}>{h.date}</td>
                        <td style={tdStyle}>{h.totalSlots}</td>
                        <td style={tdStyle}>{h.usedSlots}</td>
                        <td style={tdStyle}>{h.totalSlots - h.usedSlots}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '60px',
                              height: '6px',
                              borderRadius: '3px',
                              backgroundColor: 'var(--color-bg-tertiary)',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${usagePercent}%`,
                                height: '100%',
                                backgroundColor: usagePercent >= 80 ? '#10b981' : usagePercent >= 50 ? '#f59e0b' : '#6b7280',
                              }} />
                            </div>
                            <span>{usagePercent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const thStyle = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.75rem 1rem',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
};

export default DailySlots;
