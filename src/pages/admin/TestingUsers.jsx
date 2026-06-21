import { useEffect, useMemo, useState } from 'react';
import { getTestingUsersPage } from '../../appwrite/admin';
import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
  PageHeader,
  Pagination,
  StatCard,
  TableCard,
} from './AdminUI';
import { formatDate } from './adminFormat';

const PAGE_SIZE = 25;

const limitTone = (value, limit) => ((value || 0) >= limit ? 'danger' : (value || 0) > 0 ? 'warning' : 'neutral');

const TestingUsers = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTestingUsers = async () => {
    setLoading(true);
    setError('');
    const result = await getTestingUsersPage({ page, limit: PAGE_SIZE });
    setUsers(result.documents || []);
    setTotal(result.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      const result = await getTestingUsersPage({ page, limit: PAGE_SIZE });
      if (!cancelled) {
        setUsers(result.documents || []);
        setTotal(result.total || 0);
        setLoading(false);
      }
    };

    load().catch((err) => {
      if (!cancelled) {
        setError(err.message || 'Failed to load testing users.');
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [page]);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.email, user.userId, user.$id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [users, search]);

  const pageStats = useMemo(() => ({
    reviewed: visibleUsers.filter((user) => user.hasReviewed).length,
    preReg: visibleUsers.filter((user) => user.addedToPreReg).length,
    messages: visibleUsers.reduce((sum, user) => sum + (user.messages || 0), 0),
  }), [visibleUsers]);

  return (
    <div>
      <PageHeader
        eyebrow="Testing Mode"
        title="Testing Users"
        description="Inspect free-slot usage without dumping database IDs or loading the entire collection."
        actions={<Button onClick={loadTestingUsers} disabled={loading}>Refresh</Button>}
      />

      <div className="admin-grid admin-grid--4">
        <StatCard label="Total Testing Users" value={total} hint="Server count" />
        <StatCard label="Visible Reviewed" value={pageStats.reviewed} hint="Loaded page" tone="success" />
        <StatCard label="Visible Pre-Reg" value={pageStats.preReg} hint="Converted after review" tone="info" />
        <StatCard label="Visible Messages" value={pageStats.messages} hint="Loaded page usage" />
      </div>

      <TableCard
        title="Testing Usage"
        description="Use this to spot users near free limits before the payment flow is finalized."
        actions={(
          <input
            className="admin-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search loaded page by email or user ID"
          />
        )}
      >
        {loading ? (
          <LoadingState label="Loading testing users" />
        ) : error ? (
          <EmptyState title="Could not load testing users" description={error} />
        ) : visibleUsers.length === 0 ? (
          <EmptyState title="No testing users found" description="Users appear here after claiming a free testing slot." />
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Sessions</th>
                  <th>Messages</th>
                  <th>PDFs</th>
                  <th>Audios</th>
                  <th>Study Tools</th>
                  <th>Reviewed</th>
                  <th>Pre-Reg</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.$id}>
                    <td>
                      <strong>{user.email || 'No email'}</strong>
                      <div className="admin-muted">{user.userId || user.$id}</div>
                    </td>
                    <td><Badge tone={limitTone(user.sessions, 1)}>{user.sessions || 0}/1</Badge></td>
                    <td><Badge tone={limitTone(user.messages, 100)}>{user.messages || 0}/100</Badge></td>
                    <td><Badge tone={limitTone(user.pdfs, 1)}>{user.pdfs || 0}/1</Badge></td>
                    <td><Badge tone={limitTone(user.audios, 1)}>{user.audios || 0}/1</Badge></td>
                    <td>
                      <span className="admin-chip-row">
                        <Badge>{user.flashcards || 0} cards</Badge>
                        <Badge>{user.mcqs || 0} MCQs</Badge>
                        <Badge>{user.libraryImports || 0} imports</Badge>
                      </span>
                    </td>
                    <td><Badge tone={user.hasReviewed ? 'success' : 'neutral'}>{user.hasReviewed ? 'Yes' : 'No'}</Badge></td>
                    <td><Badge tone={user.addedToPreReg ? 'success' : 'neutral'}>{user.addedToPreReg ? 'Yes' : 'No'}</Badge></td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </TableCard>
    </div>
  );
};

export default TestingUsers;
