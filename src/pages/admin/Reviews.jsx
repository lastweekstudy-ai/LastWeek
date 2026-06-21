import { useEffect, useMemo, useState } from 'react';
import { deleteReview, getReviewsPage, updateReview } from '../../appwrite/admin';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Pagination,
  StatCard,
} from './AdminUI';
import { formatDate } from './adminFormat';

const PAGE_SIZE = 20;

const filterToQuery = (filter) => {
  if (filter === 'pending') return { isApproved: false };
  if (filter === 'approved') return { isApproved: true };
  if (filter === 'published') return { isPublished: true };
  return {};
};

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadReviews = async () => {
    setLoading(true);
    const result = await getReviewsPage({ filters: filterToQuery(filter), page, limit: PAGE_SIZE });
    setReviews(result.documents || []);
    setTotal(result.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getReviewsPage({ filters: filterToQuery(filter), page, limit: PAGE_SIZE });
      if (!cancelled) {
        setReviews(result.documents || []);
        setTotal(result.total || 0);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [filter, page]);

  const pageStats = useMemo(() => ({
    pending: reviews.filter((review) => !review.isApproved).length,
    approved: reviews.filter((review) => review.isApproved).length,
    published: reviews.filter((review) => review.isPublished).length,
  }), [reviews]);

  const changeFilter = (nextFilter) => {
    setPage(0);
    setFilter(nextFilter);
  };

  const mutateReview = async (reviewId, patch) => {
    setActionLoading(reviewId);
    try {
      await updateReview(reviewId, patch);
      setReviews((items) => items.map((item) => (item.$id === reviewId ? { ...item, ...patch } : item)));
    } catch (err) {
      window.alert(`Failed to update review: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId) => {
    setActionLoading(reviewId);
    try {
      await deleteReview(reviewId);
      setReviews((items) => items.filter((item) => item.$id !== reviewId));
      setDeleteConfirm(null);
    } catch (err) {
      window.alert(`Failed to delete review: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Moderation"
        title="Review Management"
        description="Approve, publish, and remove public reviews with a cleaner audit-friendly workflow."
        actions={<Button onClick={loadReviews} disabled={loading}>Refresh</Button>}
      />

      <div className="admin-grid admin-grid--4">
        <StatCard label="Matching Reviews" value={total} hint="Current server filter" />
        <StatCard label="Pending Here" value={pageStats.pending} hint="Loaded page" tone="warning" />
        <StatCard label="Approved Here" value={pageStats.approved} hint="Loaded page" tone="success" />
        <StatCard label="Published Here" value={pageStats.published} hint="Loaded page" tone="info" />
      </div>

      <Card title="Moderation Queue">
        <div className="admin-tabs">
          {['all', 'pending', 'approved', 'published'].map((item) => (
            <button
              key={item}
              type="button"
              className={`admin-tab ${filter === item ? 'is-active' : ''}`}
              onClick={() => changeFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <LoadingState label="Loading reviews" />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews found" description="There are no reviews matching this moderation filter." />
      ) : (
        <div className="admin-review-list">
          {reviews.map((review) => (
            <article className="admin-review-card" key={review.$id} aria-busy={actionLoading === review.$id}>
              <div className="admin-review-card__header">
                <div>
                  <div className="admin-stars" aria-label={`${review.rating || 0} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <span key={index} className={index < (review.rating || 0) ? 'is-filled' : ''}>★</span>
                    ))}
                  </div>
                  <h2>{review.title || 'Untitled review'}</h2>
                  <p>{review.userName || review.userId || 'Unknown user'} / {formatDate(review.createdAt)}</p>
                </div>
                <div className="admin-badge-row">
                  <Badge tone={review.isApproved ? 'success' : 'warning'}>{review.isApproved ? 'Approved' : 'Pending'}</Badge>
                  <Badge tone={review.isPublished ? 'info' : 'neutral'}>{review.isPublished ? 'Published' : 'Unpublished'}</Badge>
                </div>
              </div>

              <p className="admin-review-card__body">{review.content || 'No review text.'}</p>

              <div className="admin-review-card__meta">
                <span>User ID: {review.userId ? `${review.userId.slice(0, 16)}...` : '-'}</span>
                <span>{review.helpfulCount || 0} helpful votes</span>
              </div>

              <div className="admin-actions">
                {review.isApproved ? (
                  <Button variant="secondary" onClick={() => mutateReview(review.$id, { isApproved: false, isPublished: false })} disabled={actionLoading === review.$id}>
                    Unapprove
                  </Button>
                ) : (
                  <Button variant="success" onClick={() => mutateReview(review.$id, { isApproved: true })} disabled={actionLoading === review.$id}>
                    Approve
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => mutateReview(review.$id, { isPublished: !review.isPublished })}
                  disabled={actionLoading === review.$id}
                >
                  {review.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                {deleteConfirm === review.$id ? (
                  <>
                    <Button variant="danger" onClick={() => handleDelete(review.$id)} disabled={actionLoading === review.$id}>
                      Confirm Delete
                    </Button>
                    <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="danger" onClick={() => setDeleteConfirm(review.$id)} disabled={actionLoading === review.$id}>
                    Delete
                  </Button>
                )}
              </div>
            </article>
          ))}
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default Reviews;
