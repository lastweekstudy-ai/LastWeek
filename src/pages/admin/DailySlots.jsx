import { useEffect, useMemo, useState } from 'react';
import { cleanupDuplicateDailySlots, getDailySlotsHistoryPage, getRemainingSlotsToday, getTodailySlots } from '../../appwrite/admin';
import useAdminSettings from '../../hooks/useAdminSettings';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Pagination,
  StatCard,
  TableCard,
  ToggleRow,
} from './AdminUI';

const PAGE_SIZE = 25;

const DailySlots = () => {
  const { dailyFreeSlotsActive, dailyFreeSlotCount, toggleDailyFreeSlots, setDailySlotCount, settings } = useAdminSettings();
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [todaySlots, setTodaySlots] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [slotDraft, setSlotDraft] = useState(settings?.dailyFreeSlotCount || dailyFreeSlotCount || 10);
  const [cleanupText, setCleanupText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlotDraft(settings?.dailyFreeSlotCount || dailyFreeSlotCount || 10);
  }, [dailyFreeSlotCount, settings?.dailyFreeSlotCount]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [historyData, todayData, remainingData] = await Promise.all([
        getDailySlotsHistoryPage({ page, limit: PAGE_SIZE }),
        getTodailySlots().catch(() => null),
        getRemainingSlotsToday().catch(() => null),
      ]);
      if (!cancelled) {
        setHistory(historyData.documents || []);
        setTotal(historyData.total || 0);
        setTodaySlots(todayData);
        setRemaining(remainingData);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const visibleStats = useMemo(() => {
    const used = history.reduce((sum, item) => sum + (item.usedSlots || 0), 0);
    const capacity = history.reduce((sum, item) => sum + (item.totalSlots || 0), 0);
    return {
      used,
      average: history.length ? (used / history.length).toFixed(1) : '0',
      usagePercent: capacity ? Math.round((used / capacity) * 100) : 0,
    };
  }, [history]);

  const handleToggleSlots = async () => {
    setSaving('active');
    try {
      await toggleDailyFreeSlots(!dailyFreeSlotsActive);
    } catch (err) {
      window.alert(`Failed to toggle slots: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveSlotCount = async () => {
    const value = Number(slotDraft);
    if (!Number.isFinite(value) || value < 1) {
      window.alert('Slot count must be at least 1.');
      return;
    }

    setSaving('count');
    try {
      await setDailySlotCount(value);
      window.alert('Daily slot count saved.');
    } catch (err) {
      window.alert(`Failed to update slot count: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const handleCleanupDuplicates = async () => {
    setSaving('cleanup');
    try {
      const result = await cleanupDuplicateDailySlots();
      setCleanupText('');
      window.alert(`Cleaned up ${result.cleaned || 0} duplicate documents.`);
    } catch (err) {
      window.alert(`Failed to cleanup duplicates: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Launch Control"
        title="Daily Free Slots"
        description="Manage the testing slot gate without scanning usage collections or writing settings accidentally."
        actions={<Button onClick={() => setPage(0)} disabled={loading}>Refresh</Button>}
      />

      <div className="admin-grid admin-grid--4">
        <StatCard label="Mode" value={dailyFreeSlotsActive ? 'Active' : 'Off'} hint="Free testing gate" tone={dailyFreeSlotsActive ? 'success' : 'neutral'} />
        <StatCard label="Remaining Today" value={remaining ?? '-'} hint={todaySlots ? `${todaySlots.usedSlots || 0}/${todaySlots.totalSlots || 0} used` : 'No slot doc'} tone="info" />
        <StatCard label="Visible Used" value={visibleStats.used} hint={`${visibleStats.average} per loaded day`} />
        <StatCard label="Visible Fill Rate" value={`${visibleStats.usagePercent}%`} hint="Loaded page only" tone="warning" />
      </div>

      <Card title="Today" description="This controls whether new users can claim a daily testing slot.">
        <ToggleRow
          label="Daily free slots"
          description={dailyFreeSlotsActive ? 'New users can claim testing access today.' : 'Testing slot claims are disabled.'}
          checked={dailyFreeSlotsActive}
          onChange={handleToggleSlots}
          loading={saving === 'active'}
        />
        <div className="admin-toolbar admin-section">
          <input
            className="admin-input admin-input--small"
            type="number"
            min="1"
            max="1000"
            value={slotDraft}
            onChange={(event) => setSlotDraft(event.target.value)}
          />
          <Button onClick={handleSaveSlotCount} disabled={saving === 'count'}>
            {saving === 'count' ? 'Saving' : 'Save Count'}
          </Button>
          <span className="admin-muted">Slots per day. Changes apply through the shared admin settings document.</span>
        </div>
      </Card>

      <Card
        title="Maintenance"
        description="Duplicate cleanup deletes duplicate daily slot documents for today. Keep it manual and intentional."
        tone="warning"
      >
        <div className="admin-toolbar">
          <input
            className="admin-input"
            value={cleanupText}
            onChange={(event) => setCleanupText(event.target.value)}
            placeholder="Type CLEANUP to enable duplicate cleanup"
          />
          <Button variant="danger" onClick={handleCleanupDuplicates} disabled={cleanupText !== 'CLEANUP' || saving === 'cleanup'}>
            {saving === 'cleanup' ? 'Cleaning' : 'Cleanup Duplicates'}
          </Button>
        </div>
      </Card>

      <TableCard title="Slot Usage History" description="Paged Appwrite reads keep this usable as daily slot history grows.">
        {loading ? (
          <LoadingState label="Loading slot history" />
        ) : history.length === 0 ? (
          <EmptyState title="No slot history yet" description="Daily usage documents will appear here after slots are claimed." />
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Slots</th>
                  <th>Used</th>
                  <th>Remaining</th>
                  <th>Usage</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const totalSlots = item.totalSlots || 0;
                  const usedSlots = item.usedSlots || 0;
                  const usagePercent = totalSlots ? Math.round((usedSlots / totalSlots) * 100) : 0;
                  return (
                    <tr key={item.$id}>
                      <td>{item.date}</td>
                      <td>{totalSlots}</td>
                      <td>{usedSlots}</td>
                      <td>{Math.max(0, totalSlots - usedSlots)}</td>
                      <td>
                        <div className="admin-progress">
                          <span style={{ width: `${Math.min(100, usagePercent)}%` }} />
                        </div>
                        <Badge tone={usagePercent >= 80 ? 'success' : usagePercent >= 50 ? 'warning' : 'neutral'}>
                          {usagePercent}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </TableCard>
    </div>
  );
};

export default DailySlots;
