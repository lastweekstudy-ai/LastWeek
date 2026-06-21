import { useEffect, useMemo, useState } from 'react';
import { getPreRegistrationsPage, getPromoCodeUsagePage, grantSinglePreRegistrationReward } from '../../appwrite/admin';
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
} from './AdminUI';
import { formatDate } from './adminFormat';

const PAGE_SIZE = 25;
const PROMO_PAGE_SIZE = 10;

const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const typeTone = (type) => {
  if (type === 'paid') return 'success';
  if (type === 'reviewer') return 'info';
  if (type === 'free_slot') return 'warning';
  return 'neutral';
};

const statusTone = (status) => {
  if (status === 'active') return 'success';
  if (status === 'expired') return 'danger';
  if (status === 'converted') return 'info';
  return 'neutral';
};

const PreRegUsers = () => {
  const [preRegs, setPreRegs] = useState([]);
  const [total, setTotal] = useState(0);
  const [promoUsages, setPromoUsages] = useState([]);
  const [promoTotal, setPromoTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [promoPage, setPromoPage] = useState(0);
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [promoLoading, setPromoLoading] = useState(true);
  const [grantingId, setGrantingId] = useState('');
  const [grantNotice, setGrantNotice] = useState('');

  const loadPreRegs = async () => {
    setLoading(true);
    const result = await getPreRegistrationsPage({ filters, page, limit: PAGE_SIZE });
    setPreRegs(result.documents || []);
    setTotal(result.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!cancelled) {
        await loadPreRegs();
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setPromoLoading(true);
      const result = await getPromoCodeUsagePage({ page: promoPage, limit: PROMO_PAGE_SIZE });
      if (!cancelled) {
        setPromoUsages(result.documents || []);
        setPromoTotal(result.total || 0);
        setPromoLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [promoPage]);

  const visiblePreRegs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return preRegs;
    return preRegs.filter((item) =>
      [item.email, item.name, item.promoCode, item.userId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [preRegs, search]);

  const visibleOwed = useMemo(() => {
    const months = visiblePreRegs.reduce((sum, item) => sum + (item.bonusMonthsEarned || 0), 0);
    return { months, value: (months * 9).toFixed(2) };
  }, [visiblePreRegs]);

  const exportCSV = () => {
    const headers = ['Email', 'Name', 'Type', 'Promo Code', 'Uses', 'Bonus Months', 'Status', 'Plus Until', 'Created'];
    const rows = visiblePreRegs.map((item) => [
      item.email,
      item.name || '',
      item.type || '',
      item.promoCode || '',
      item.promoCodeUses || 0,
      item.bonusMonthsEarned || 0,
      item.status || '',
      formatDate(item.plusUntil),
      formatDate(item.createdAt),
    ]);

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pre-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updateFilter = (key, value) => {
    setPage(0);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleGrantSingle = async (item) => {
    if (item.status !== 'active') return;
    const confirmed = window.confirm(`Grant Plus reward to ${item.email || item.userId || 'this pre-registration'} now?`);
    if (!confirmed) return;

    setGrantingId(item.$id);
    setGrantNotice('');
    try {
      const result = await grantSinglePreRegistrationReward(item.$id);
      const detail = result.details?.[0];
      setGrantNotice(`${detail?.email || item.email || 'User'} converted until ${formatDate(detail?.plusUntil)}.`);
      await loadPreRegs();
    } catch (err) {
      window.alert(`Failed to grant reward: ${err.message}`);
    } finally {
      setGrantingId('');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Growth"
        title="Pre-Registrations"
        description="Review signups, promo codes, reviewer rewards, and early Plus obligations."
        actions={<Button onClick={exportCSV} disabled={visiblePreRegs.length === 0}>Export visible CSV</Button>}
      />

      {grantNotice && (
        <Card className="admin-callout" style={{ marginBottom: '1rem' }}>
          {grantNotice}
        </Card>
      )}

      <div className="admin-grid admin-grid--4">
        <StatCard label="Total Matching" value={total} hint="Server-side filtered records" />
        <StatCard label="Loaded Page" value={visiblePreRegs.length} hint={`Page ${page + 1}`} />
        <StatCard label="Active Here" value={visiblePreRegs.filter((item) => item.status === 'active').length} hint="Current page only" tone="success" />
        <StatCard label="Visible Owed" value={`$${visibleOwed.value}`} hint={`${visibleOwed.months} Plus months`} tone="warning" />
      </div>

      <Card title="Controls" description="Filters are server-side. Search narrows the currently loaded page.">
        <div className="admin-toolbar">
          <input
            className="admin-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search loaded page by email, name, user ID, or promo code"
          />
          <select className="admin-select" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="converted">Converted</option>
          </select>
          <select className="admin-select" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
            <option value="">All types</option>
            <option value="paid">Paid</option>
            <option value="free_slot">Free slot</option>
            <option value="reviewer">Reviewer</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <LoadingState label="Loading pre-registrations" />
      ) : visiblePreRegs.length === 0 ? (
        <EmptyState title="No pre-registrations found" description="Try a different status/type filter or clear the page search." />
      ) : (
        <TableCard title="Pre-Registration Records">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Type</th>
                <th>Promo</th>
                <th>Uses</th>
                <th>Bonus</th>
                <th>Status</th>
                <th>Plus Until</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visiblePreRegs.map((item) => (
                <tr key={item.$id}>
                  <td>{item.email || 'Unknown'}</td>
                  <td>{item.name || 'Not set'}</td>
                  <td><Badge tone={typeTone(item.type)}>{item.type || 'unknown'}</Badge></td>
                  <td><code>{item.promoCode || '-'}</code></td>
                  <td>{item.promoCodeUses || 0}</td>
                  <td>{item.bonusMonthsEarned || 0} mo</td>
                  <td><Badge tone={statusTone(item.status)}>{item.status || 'unknown'}</Badge></td>
                  <td>{formatDate(item.plusUntil)}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <Button
                      size="sm"
                      onClick={() => handleGrantSingle(item)}
                      disabled={item.status !== 'active' || grantingId === item.$id}
                    >
                      {grantingId === item.$id ? 'Granting' : 'Grant Plus'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </TableCard>
      )}

      <TableCard title="Promo Code Usage" description="Paged safely so this view does not pull the full usage collection.">
        {promoLoading ? (
          <LoadingState label="Loading promo usage" />
        ) : promoUsages.length === 0 ? (
          <EmptyState title="No promo usage yet" description="Usage records will appear here as users redeem referral codes." />
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Promo Code</th>
                  <th>Referrer</th>
                  <th>New User Email</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {promoUsages.map((item) => (
                  <tr key={item.$id}>
                    <td><code>{item.promoCode || '-'}</code></td>
                    <td>{item.referrerId ? `${item.referrerId.slice(0, 12)}...` : '-'}</td>
                    <td>{item.newUserEmail || '-'}</td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={promoPage} pageSize={PROMO_PAGE_SIZE} total={promoTotal} onPageChange={setPromoPage} />
          </>
        )}
      </TableCard>
    </div>
  );
};

export default PreRegUsers;
