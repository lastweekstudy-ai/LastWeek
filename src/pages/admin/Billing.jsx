import { useEffect, useMemo, useState } from 'react';
import { getSubscriptionsPage } from '../../appwrite/admin';
import { Badge, Button, PageHeader, Pagination, StatCard, TableCard } from './AdminUI';
import { formatDate, formatDateTime } from './adminFormat';

const PAGE_SIZE = 25;

const statusTone = (status) => {
  if (status === 'active' || status === 'trialing') return 'success';
  if (status === 'past_due') return 'warning';
  if (status === 'canceled' || status === 'paused') return 'danger';
  return 'neutral';
};

const planName = (plan) => {
  if (plan === 'proplus') return 'Pro+';
  if (plan === 'plus') return 'Plus';
  if (plan === 'pro') return 'Pro';
  return plan || 'Unknown';
};

const formatAmount = (amount, currency) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return amount || 'N/A';

  const value = numeric > 100 ? numeric / 100 : numeric;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ''}`.trim();
  }
};

const Billing = () => {
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ documents: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const loadPage = async (nextPage = page) => {
    setLoading(true);
    setError('');
    try {
      const result = await getSubscriptionsPage({ page: nextPage, limit: PAGE_SIZE });
      setData(result);
      setPage(nextPage);
    } catch (err) {
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.documents;

    return data.documents.filter((subscription) => [
      subscription.userId,
      subscription.paddleSubscriptionId,
      subscription.paddleCustomerId,
      subscription.priceId,
      subscription.plan,
      subscription.status,
    ].some((value) => String(value || '').toLowerCase().includes(needle)));
  }, [data.documents, query]);

  const pageStats = useMemo(() => {
    const active = data.documents.filter((item) => item.status === 'active' || item.status === 'trialing').length;
    const risk = data.documents.filter((item) => item.status === 'past_due' || item.status === 'paused').length;
    const canceled = data.documents.filter((item) => item.status === 'canceled').length;
    return { active, risk, canceled };
  }, [data.documents]);

  return (
    <div>
      <PageHeader
        eyebrow="Revenue"
        title="Billing"
        description="Read-only subscription visibility from Appwrite. Payment state changes should continue through Paddle webhooks."
        actions={<Button onClick={() => loadPage(page)} disabled={loading}>{loading ? 'Refreshing' : 'Refresh'}</Button>}
      />

      <div className="admin-grid admin-grid--4">
        <StatCard label="Total Records" value={data.total || 0} subtext="Subscriptions collection" />
        <StatCard label="Active On Page" value={pageStats.active} tone="success" />
        <StatCard label="Needs Attention" value={pageStats.risk} tone="warning" />
        <StatCard label="Canceled On Page" value={pageStats.canceled} tone="danger" />
      </div>

      <TableCard
        title="Subscriptions"
        description="Search filters the current page only. Add Appwrite indexes before enabling server-side plan/status filters."
        actions={
          <input
            className="admin-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search current page..."
          />
        }
      >
        {error && <div className="admin-empty">{error}</div>}
        {!error && filtered.length === 0 && !loading && (
          <div className="admin-empty">
            <strong>No subscriptions found</strong>
            <div style={{ marginTop: '0.35rem' }}>There are no records on this page matching the current search.</div>
          </div>
        )}
        {!error && filtered.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Period</th>
                <th>Paddle IDs</th>
                <th>Amount</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((subscription) => (
                <tr key={subscription.$id}>
                  <td>
                    <div className="admin-row-title">{subscription.userId || 'Unknown user'}</div>
                    <div className="admin-muted">{subscription.$id}</div>
                  </td>
                  <td>{planName(subscription.plan)}</td>
                  <td><Badge tone={statusTone(subscription.status)}>{subscription.status || 'unknown'}</Badge></td>
                  <td>
                    <div>{formatDate(subscription.currentPeriodStart)}</div>
                    <div className="admin-muted">to {formatDate(subscription.currentPeriodEnd)}</div>
                  </td>
                  <td>
                    <div className="admin-row-muted">Sub: {subscription.paddleSubscriptionId || 'N/A'}</div>
                    <div className="admin-row-muted">Customer: {subscription.paddleCustomerId || 'N/A'}</div>
                    <div className="admin-row-muted">Price: {subscription.priceId || 'N/A'}</div>
                  </td>
                  <td>{formatAmount(subscription.amount, subscription.currency)} / {subscription.interval || 'period'}</td>
                  <td>{formatDateTime(subscription.updatedAt || subscription.$updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={data.total || 0}
        loading={loading}
        onPageChange={loadPage}
      />
    </div>
  );
};

export default Billing;
