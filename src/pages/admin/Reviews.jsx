import React, { useState, useEffect } from 'react';
import { getReviews, updateReview, deleteReview } from '../../appwrite/admin';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const data = await getReviews();
    setReviews(data);
    setLoading(false);
  };

  const handleApprove = async (reviewId) => {
    setActionLoading(reviewId);
    try {
      await updateReview(reviewId, { isApproved: true });
      setReviews(reviews.map(r => 
        r.$id === reviewId ? { ...r, isApproved: true } : r
      ));
    } catch (err) {
      alert(`Failed to approve: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reviewId) => {
    setActionLoading(reviewId);
    try {
      await updateReview(reviewId, { isApproved: false, isPublished: false });
      setReviews(reviews.map(r => 
        r.$id === reviewId ? { ...r, isApproved: false, isPublished: false } : r
      ));
    } catch (err) {
      alert(`Failed to reject: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    setActionLoading(reviewId);
    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter(r => r.$id !== reviewId));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePublish = async (reviewId, currentStatus) => {
    setActionLoading(reviewId);
    try {
      await updateReview(reviewId, { isPublished: !currentStatus });
      setReviews(reviews.map(r => 
        r.$id === reviewId ? { ...r, isPublished: !currentStatus } : r
      ));
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return !r.isApproved;
    if (filter === 'approved') return r.isApproved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.isApproved).length;
  const approvedCount = reviews.filter(r => r.isApproved).length;
  const publishedCount = reviews.filter(r => r.isPublished).length;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Review Management
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0' }}>
          Moderate user reviews for the website
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          padding: '1rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {reviews.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Total Reviews
          </div>
        </div>
        <div style={{
          backgroundColor: pendingCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--color-bg-secondary)',
          borderRadius: '10px',
          border: `1px solid ${pendingCount > 0 ? '#f59e0b' : 'var(--color-border)'}`,
          padding: '1rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: pendingCount > 0 ? '#f59e0b' : 'var(--color-text-primary)' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Pending Approval
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          padding: '1rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
            {approvedCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Approved
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          padding: '1rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a855f7' }}>
            {publishedCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Published
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
      }}>
        {['all', 'pending', 'approved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: filter === f ? 'none' : '1px solid var(--color-border)',
              backgroundColor: filter === f ? '#a855f7' : 'var(--color-bg-secondary)',
              color: filter === f ? 'white' : 'var(--color-text-primary)',
              cursor: 'pointer',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {f} {f === 'pending' && `(${pendingCount})`}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
          Loading reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
        }}>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            No reviews found
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredReviews.map((review) => (
            <div
              key={review.$id}
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '12px',
                border: `1px solid ${review.isApproved ? 'var(--color-border)' : '#f59e0b'}`,
                padding: '1.5rem',
                opacity: actionLoading === review.$id ? 0.7 : 1,
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {/* Star Rating */}
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: i < review.rating ? '#fbbf24' : 'var(--color-text-muted)' }}>
                        ★
                      </span>
                    ))}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                    {review.title}
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    backgroundColor: review.isApproved ? '#10b981' : '#f59e0b',
                    color: 'white',
                  }}>
                    {review.isApproved ? 'Approved' : 'Pending'}
                  </div>
                  <div style={{
                    marginTop: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    backgroundColor: review.isPublished ? '#a855f7' : 'var(--color-bg-tertiary)',
                    color: review.isPublished ? 'white' : 'var(--color-text-muted)',
                  }}>
                    {review.isPublished ? 'Published' : 'Unpublished'}
                  </div>
                </div>
              </div>

              {/* Content */}
              <p style={{
                color: 'var(--color-text-secondary)',
                margin: '0 0 1rem',
                lineHeight: 1.6,
              }}>
                {review.content}
              </p>

              {/* Meta */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
                marginBottom: '1rem',
              }}>
                <span>
                  User ID: {review.userId.slice(0, 12)}... • {new Date(review.createdAt).toLocaleDateString()}
                </span>
                <span>
                  👍 {review.helpfulCount || 0} helpful
                </span>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}>
                {!review.isApproved && (
                  <button
                    onClick={() => handleApprove(review.$id)}
                    disabled={actionLoading === review.$id}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#10b981',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    ✓ Approve
                  </button>
                )}
                {review.isApproved && (
                  <button
                    onClick={() => handleReject(review.$id)}
                    disabled={actionLoading === review.$id}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #f59e0b',
                      backgroundColor: 'transparent',
                      color: '#f59e0b',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Unapprove
                  </button>
                )}
                <button
                  onClick={() => handleTogglePublish(review.$id, review.isPublished)}
                  disabled={actionLoading === review.$id}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {review.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDelete(review.$id)}
                  disabled={actionLoading === review.$id}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #ef4444',
                    backgroundColor: 'transparent',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
