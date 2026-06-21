import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminSettings from '../../hooks/useAdminSettings';
import { completeAllPreRegistrations, getAdminStats, getRemainingSlotsToday } from '../../appwrite/admin';
import { Badge, Button, Card, PageHeader, StatCard, ToggleRow } from './AdminUI';

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
  const [slotCountInput, setSlotCountInput] = useState(10);
  const [notice, setNotice] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [completingPreReg, setCompletingPreReg] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);

  const loadStats = async () => {
    const [statsData, slotsData] = await Promise.all([getAdminStats(), getRemainingSlotsToday()]);
    setStats(statsData);
    setRemainingSlots(slotsData);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
  }, []);

  useEffect(() => {
    if (settings?.dailyFreeSlotCount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlotCountInput(settings.dailyFreeSlotCount);
    }
  }, [settings?.dailyFreeSlotCount]);

  const flashNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const handleToggle = async (toggleFn, key) => {
    setSaving(key);
    try {
      await toggleFn(!settings[key]);
      flashNotice('Settings saved');
    } catch (err) {
      window.alert(`Failed to update: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleSlotCountSave = async () => {
    if (slotCountInput < 1) return;
    setSaving('dailyFreeSlotCount');
    try {
      await setDailySlotCount(slotCountInput);
      await refresh();
      await loadStats();
      flashNotice('Daily slot count saved');
    } catch (err) {
      window.alert(`Failed to update: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleCompletePreRegistrations = async () => {
    if (confirmText !== 'GRANT PLUS') return;
    setCompletingPreReg(true);
    setCompletionResult(null);

    try {
      const result = await completeAllPreRegistrations();
      setCompletionResult(result);
      setConfirmText('');
      await loadStats();
    } catch (err) {
      window.alert(`Failed to complete pre-registrations: ${err.message}`);
    } finally {
      setCompletingPreReg(false);
    }
  };

  if (loading) {
    return <Card><div className="admin-loading">Loading admin dashboard...</div></Card>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Command Center"
        title="Admin Dashboard"
        description="Control launch modes, payments, plan activation, daily testing slots, and high-level product health."
        actions={
          <>
            {notice && <Badge tone="success">{notice}</Badge>}
            <Button onClick={() => { refresh(); loadStats(); }}>Refresh</Button>
          </>
        }
      />

      {stats && (
        <div className="admin-grid">
          <StatCard label="Pre-Registrations" value={stats.totalPreRegistrations} subtext={`${stats.activePreRegistrations} active`} />
          <StatCard label="Promo Uses" value={stats.totalPromoCodeUses} subtext={`${stats.totalPromoCodesIssued} codes issued`} />
          <StatCard label="Bonus Months Owed" value={stats.totalBonusMonthsEarned} subtext={`$${stats.estimatedOwedValue} estimated value`} />
          <StatCard label="Reviews" value={stats.totalReviews} subtext={`${stats.pendingReviews} pending approval`} />
          <StatCard label="Today's Free Slots" value={remainingSlots ?? '?'} subtext={`of ${settings?.dailyFreeSlotCount || 10} total`} />
        </div>
      )}

      <Card className="admin-section">
        <p className="admin-eyebrow">Live Controls</p>
        <h2 style={{ margin: '0.35rem 0 0.75rem' }}>Quick Toggles</h2>
        <ToggleRow
          label="Pre-Registration Mode"
          description="Enable the promotional pre-registration flow."
          checked={settings?.preRegActive}
          onChange={() => handleToggle(togglePreReg, 'preRegActive')}
          loading={saving === 'preRegActive'}
        />
        <ToggleRow
          label="All Payments"
          description="Master switch for payment processing through Paddle."
          checked={settings?.paymentsActive}
          onChange={() => handleToggle(togglePayments, 'paymentsActive')}
          loading={saving === 'paymentsActive'}
        />
        <ToggleRow
          label="Daily Free Slots"
          description="Allow free testing slots with review requirement."
          checked={settings?.dailyFreeSlotsActive}
          onChange={() => handleToggle(toggleDailyFreeSlots, 'dailyFreeSlotsActive')}
          loading={saving === 'dailyFreeSlotsActive'}
        />
        <div className="admin-toggle-row">
          <div>
            <div className="admin-toggle-title">Daily Slot Count</div>
            <div className="admin-toggle-desc">Number of free testing slots available per day.</div>
          </div>
          <div className="admin-actions">
            <input
              className="admin-input"
              type="number"
              min="1"
              max="1000"
              value={slotCountInput}
              onChange={(e) => setSlotCountInput(parseInt(e.target.value, 10) || 1)}
              disabled={saving === 'dailyFreeSlotCount'}
              style={{ width: '110px' }}
            />
            <Button
              variant="primary"
              onClick={handleSlotCountSave}
              disabled={saving === 'dailyFreeSlotCount' || slotCountInput === settings?.dailyFreeSlotCount}
            >
              {saving === 'dailyFreeSlotCount' ? 'Saving' : 'Save'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="admin-section">
        <p className="admin-eyebrow">Plan Gates</p>
        <h2 style={{ margin: '0.35rem 0 0.75rem' }}>Plan Activation</h2>
        <p className="admin-muted" style={{ marginTop: 0 }}>
          Deactivated public plans stay visible for comparison, but checkout/action buttons are disabled.
        </p>
        {[
          ['free', 'freePlanActive', 'Free Plan', 'Basic free tier with limited features.'],
          ['pro', 'proPlanActive', 'Legacy Pro Plan', 'Kept for existing Pro subscribers; not shown in the public lineup.'],
          ['plus', 'plusPlanActive', 'Plus Plan', '$9 launch plan for serious students.'],
          ['proplus', 'proPlusPlanActive', 'Pro+ Plan', 'Premium unlimited subscription.'],
        ].map(([plan, key, label, description]) => (
          <ToggleRow
            key={key}
            label={label}
            description={description}
            checked={settings?.[key]}
            onChange={() => handleToggle(() => togglePlan(plan, !settings?.[key]), key)}
            loading={saving === key}
          />
        ))}
      </Card>

      {stats?.activePreRegistrations > 0 && (
        <Card className="admin-section admin-danger-zone">
          <p className="admin-eyebrow">Danger Zone</p>
          <h2 style={{ margin: '0.35rem 0 0.5rem' }}>Complete Pre-Registrations</h2>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            This grants Plus plans to all {stats.activePreRegistrations} active pre-registered users.
            The grant runs through the Paddle webhook function so Appwrite user labels and subscriptions are updated server-side.
          </p>
          <div className="admin-toolbar" style={{ marginTop: '1rem' }}>
            <input
              className="admin-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type GRANT PLUS to enable"
            />
            <Button
              variant="danger"
              onClick={handleCompletePreRegistrations}
              disabled={confirmText !== 'GRANT PLUS' || completingPreReg}
            >
              {completingPreReg ? 'Processing' : 'Grant Plus'}
            </Button>
          </div>
          {completionResult && (
            <div className="admin-callout" style={{ marginTop: '1rem' }}>
              <strong>{completionResult.success}/{completionResult.total} converted</strong>
              {completionResult.skipped > 0 && <div>{completionResult.skipped} skipped because no matching Appwrite account was found yet.</div>}
              {completionResult.failed > 0 && <div>{completionResult.failed} failed. Check the browser console for details.</div>}
            </div>
          )}
        </Card>
      )}

      <div className="admin-actions admin-section">
        <Button onClick={() => navigate('/admin/pre-reg')}>View Pre-Registrations</Button>
        <Button onClick={() => navigate('/admin/billing')}>Billing</Button>
        <Button onClick={() => navigate('/admin/reviews')}>Moderate Reviews</Button>
        <Button onClick={() => navigate('/admin/testing-users')}>Testing Users</Button>
      </div>
    </div>
  );
};

export default Dashboard;
