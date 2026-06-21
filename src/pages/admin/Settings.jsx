import { useEffect, useState } from 'react';
import useAdminSettings from '../../hooks/useAdminSettings';
import { formatMoney, getPreRegPricing } from '../../utils/preRegPricing';
import {
  Badge,
  Button,
  Card,
  LoadingState,
  PageHeader,
  StatCard,
  ToggleRow,
} from './AdminUI';
import { formatDateTime } from './adminFormat';

const planFields = [
  { plan: 'free', key: 'freePlanActive', label: 'Free Plan', description: 'Basic free tier with limited features.' },
  { plan: 'pro', key: 'proPlanActive', label: 'Legacy Pro Plan', description: 'Kept for existing Pro subscribers; not shown in the public lineup.' },
  { plan: 'plus', key: 'plusPlanActive', label: 'Plus Plan', description: '$9 launch plan for serious students.' },
  { plan: 'proplus', key: 'proPlusPlanActive', label: 'Pro+ Plan', description: 'Premium unlimited subscription.' },
];

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
  const [preRegPriceId, setPreRegPriceId] = useState('');
  const [preRegDisplayPrice, setPreRegDisplayPrice] = useState('4');
  const [preRegDisplayValue, setPreRegDisplayValue] = useState('108');
  const [slotDraft, setSlotDraft] = useState(10);

  useEffect(() => {
    const pricing = getPreRegPricing(settings);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreRegPriceId(settings?.preRegPriceId || '');
    setPreRegDisplayPrice(String(pricing.price));
    setPreRegDisplayValue(String(pricing.value));
    setSlotDraft(settings?.dailyFreeSlotCount || 10);
  }, [settings]);

  const handleToggle = async (toggleFn, key) => {
    setSaving(key);
    try {
      await toggleFn(!settings[key]);
    } catch (err) {
      window.alert(`Failed to update setting: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handlePlanToggle = async ({ plan, key }) => {
    setSaving(key);
    try {
      await togglePlan(plan, !settings[key]);
    } catch (err) {
      window.alert(`Failed to update plan: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleSavePreRegPrice = async () => {
    setSaving('preRegPriceId');
    try {
      await updateAdminSettings({ preRegPriceId: preRegPriceId.trim() });
      window.alert('Pre-registration price ID saved.');
    } catch (err) {
      window.alert(`Failed to save price ID: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleSavePreRegDisplayPrice = async () => {
    const price = Number(preRegDisplayPrice);
    const value = Number(preRegDisplayValue);

    if (!Number.isFinite(price) || price <= 0) {
      window.alert('Pre-registration display price must be greater than 0.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      window.alert('Pre-registration display value must be greater than 0.');
      return;
    }

    setSaving('preRegDisplayPrice');
    try {
      await updateAdminSettings({
        preRegDisplayPrice: price,
        preRegDisplayValue: value,
      });
      window.alert('Pre-registration display price saved.');
    } catch (err) {
      window.alert(
        `Failed to save display price: ${err.message}\n\nIf Appwrite says the attribute is unknown, add optional float attributes named preRegDisplayPrice and preRegDisplayValue to admin_settings.`
      );
    } finally {
      setSaving(null);
    }
  };

  const handleSaveSlotCount = async () => {
    const value = Number(slotDraft);
    if (!Number.isFinite(value) || value < 1) {
      window.alert('Daily slot count must be at least 1.');
      return;
    }

    setSaving('dailyFreeSlotCount');
    try {
      await setDailySlotCount(value);
      window.alert('Daily free slot count saved.');
    } catch (err) {
      window.alert(`Failed to save slot count: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingState label="Loading admin settings" />;

  return (
    <div>
      <PageHeader
        eyebrow="Configuration"
        title="Admin Settings"
        description="Control launch mode, plan activation, payments, and free testing gates from one place."
      />

      <div className="admin-grid admin-grid--4">
        <StatCard label="Mode" value={settings?.preRegActive ? 'Pre-Reg' : 'Commercial'} hint="Current product mode" tone={settings?.preRegActive ? 'warning' : 'success'} />
        <StatCard label="Payments" value={settings?.paymentsActive ? 'Active' : 'Off'} hint="Paddle visibility" tone={settings?.paymentsActive ? 'success' : 'neutral'} />
        <StatCard label="Daily Slots" value={settings?.dailyFreeSlotsActive ? 'Active' : 'Off'} hint={`${settings?.dailyFreeSlotCount || 10} per day`} tone={settings?.dailyFreeSlotsActive ? 'success' : 'neutral'} />
        <StatCard label="Updated" value={settings?.updatedAt ? 'Saved' : 'Unknown'} hint={formatDateTime(settings?.updatedAt)} />
      </div>

      <div className="admin-grid admin-grid--2">
        <Card title="Mode Switching" description="Use these toggles for launch and billing readiness.">
          <ToggleRow
            label="Pre-registration mode"
            description={`Enable the ${formatMoney(preRegDisplayPrice)} pre-registration flow and pause normal commercial payments.`}
            checked={settings?.preRegActive}
            onChange={() => handleToggle(togglePreReg, 'preRegActive')}
            loading={saving === 'preRegActive'}
          />
          <ToggleRow
            label="All payments"
            description="Master availability switch for payment processing."
            checked={settings?.paymentsActive}
            onChange={() => handleToggle(togglePayments, 'paymentsActive')}
            loading={saving === 'paymentsActive'}
          />
          <ToggleRow
            label="Daily free slots"
            description="Allow limited free testing with review requirement."
            checked={settings?.dailyFreeSlotsActive}
            onChange={() => handleToggle(toggleDailyFreeSlots, 'dailyFreeSlotsActive')}
            loading={saving === 'dailyFreeSlotsActive'}
          />
        </Card>

        <Card title="Plan Activation" description="Deactivated plans remain visible for comparison but cannot be purchased.">
          {planFields.map((item) => (
            <ToggleRow
              key={item.key}
              label={item.label}
              description={item.description}
              checked={settings?.[item.key]}
              onChange={() => handlePlanToggle(item)}
              loading={saving === item.key}
            />
          ))}
        </Card>
      </div>

      <div className="admin-grid admin-grid--2">
        <Card title="Pre-Registration Display Price" description="Controls website copy only. Paddle still charges whatever amount belongs to the saved price ID.">
          <div className="admin-toolbar">
            <label className="admin-field">
              <span className="admin-label">Website price</span>
              <input
                className="admin-input admin-input--small"
                type="number"
                min="0.01"
                step="0.01"
                value={preRegDisplayPrice}
                onChange={(event) => setPreRegDisplayPrice(event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Displayed value</span>
              <input
                className="admin-input admin-input--small"
                type="number"
                min="0.01"
                step="0.01"
                value={preRegDisplayValue}
                onChange={(event) => setPreRegDisplayValue(event.target.value)}
              />
            </label>
            <Button onClick={handleSavePreRegDisplayPrice} disabled={saving === 'preRegDisplayPrice'}>
              {saving === 'preRegDisplayPrice' ? 'Saving' : 'Save Display Price'}
            </Button>
          </div>
          <p className="admin-muted">
            Current public copy will show {formatMoney(preRegDisplayPrice)} for pre-registration and {formatMoney(preRegDisplayValue)} as the Plus one-year value.
          </p>
        </Card>

        <Card title="Pre-Registration Paddle Price ID" description="Paddle one-time price used by the early access checkout.">
          <div className="admin-toolbar">
            <input
              className="admin-input admin-code-input"
              value={preRegPriceId}
              onChange={(event) => setPreRegPriceId(event.target.value)}
              placeholder="pri_01..."
            />
            <Button onClick={handleSavePreRegPrice} disabled={saving === 'preRegPriceId'}>
              {saving === 'preRegPriceId' ? 'Saving' : 'Save'}
            </Button>
          </div>
          <p className="admin-muted">Create the real one-time price in Paddle, then paste only the price ID here. This ID is the payment source of truth.</p>
        </Card>

        <Card title="Daily Slot Count" description="Edit locally first, then save intentionally.">
          <div className="admin-toolbar">
            <input
              className="admin-input admin-input--small"
              type="number"
              min="1"
              max="1000"
              value={slotDraft}
              onChange={(event) => setSlotDraft(event.target.value)}
            />
            <Button onClick={handleSaveSlotCount} disabled={saving === 'dailyFreeSlotCount'}>
              {saving === 'dailyFreeSlotCount' ? 'Saving' : 'Save Count'}
            </Button>
          </div>
          <p className="admin-muted">The app currently uses the configured testing timezone logic from the existing service.</p>
        </Card>
      </div>

      <Card title="Operational Snapshot" description="Current public switches and plan activation.">
        <div className="admin-status-grid">
          <span>Pre-registration <Badge tone={settings?.preRegActive ? 'warning' : 'neutral'}>{settings?.preRegActive ? 'On' : 'Off'}</Badge></span>
          <span>Payments <Badge tone={settings?.paymentsActive ? 'success' : 'neutral'}>{settings?.paymentsActive ? 'On' : 'Off'}</Badge></span>
          <span>Daily slots <Badge tone={settings?.dailyFreeSlotsActive ? 'success' : 'neutral'}>{settings?.dailyFreeSlotsActive ? 'On' : 'Off'}</Badge></span>
          {planFields.map((item) => (
            <span key={item.key}>
              {item.label} <Badge tone={settings?.[item.key] ? 'success' : 'neutral'}>{settings?.[item.key] ? 'Active' : 'Deactivated'}</Badge>
            </span>
          ))}
        </div>
      </Card>

      <Card title="Next Admin Safety Upgrade" tone="info">
        <p className="admin-muted">
          High-risk admin writes such as granting Plus, deleting reviews, and cleaning duplicate slot documents should move into Appwrite Functions
          with server-side permission checks and audit logs before payment automation goes live.
        </p>
      </Card>
    </div>
  );
};

export default Settings;
