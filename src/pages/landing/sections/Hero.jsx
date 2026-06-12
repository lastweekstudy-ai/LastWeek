import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../../components/shared/BrandLogo';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import { getAdminSettings, getPublishedReviews, getRemainingSlotsToday } from '../../../appwrite/admin';

const Hero = () => {
  const [adminSettings, setAdminSettings] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [remainingSlots, setRemainingSlots] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(false);

    const [settings, publishedReviews, slots] = await Promise.allSettled([
      getAdminSettings(),
      getPublishedReviews(50),
      getRemainingSlotsToday(),
    ]);

    if (settings.status === 'fulfilled') {
      setAdminSettings(settings.value);
      if (slots.status !== 'fulfilled') {
        setRemainingSlots(settings.value?.dailyFreeSlotCount || 10);
      }
    }
    if (publishedReviews.status === 'fulfilled') {
      setReviews(publishedReviews.value);
    }
    if (slots.status === 'fulfilled') {
      setRemainingSlots(slots.value);
    }
  };

  const isPreRegMode = adminSettings?.preRegActive;
  const dailyFreeSlotsActive = adminSettings?.dailyFreeSlotsActive;
  const displaySlots = remainingSlots !== null ? remainingSlots : (adminSettings?.dailyFreeSlotCount || 10);
  const totalSlots = adminSettings?.dailyFreeSlotCount || 10;

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
      </div>

      <div className="hero-content">
        {isPreRegMode && (
          <div className="hero-prereg-banner">
            <div className="prereg-banner-content">
              <span className="prereg-badge">Limited time</span>
              <h3 className="prereg-title">Pre-registration is open</h3>
              <p className="prereg-subtitle">
                Pay $5 now and get <strong>Plus free for 1 year</strong>, a $180 value.
              </p>
              <div className="prereg-actions">
                <Link to="/pre-register" className="btn btn-primary btn-sm">
                  Pre-register now
                </Link>
                {dailyFreeSlotsActive && (
                  <Link to="/auth?freeSlot=true" className="btn btn-outline btn-sm">
                    Try a free slot
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {!isPreRegMode && dailyFreeSlotsActive && (
          <div className="hero-freetier-banner">
            <div className="freetier-banner-content">
              <span className="freetier-badge">Free trial</span>
              <h3 className="freetier-title">Test every study tool today</h3>
              <p className="freetier-subtitle">
                <strong>{displaySlots}</strong> of <strong>{totalSlots}</strong> free slots remain today.
                Leave a review after testing and get Plus free for 1 year.
              </p>
              <Link to="/auth?freeSlot=true" className="btn btn-success btn-sm">
                Claim your free slot
              </Link>
            </div>
          </div>
        )}

        <div className="hero-logo-container">
          <BrandLogo variant="text" width={200} height={60} priority />
        </div>

        <h1 className="hero-title">
          Study SMARTER,<br />
          <span className="text-gradient">Not HARDER</span>
        </h1>

        <p className="hero-subtitle">
          AI-powered learning platform with 5 specialized study modes, intelligent PDF processing,
          and spaced repetition algorithms. Master any subject faster with science-backed methods.
        </p>

        <div className="hero-buttons">
          <Link to="/auth" className="btn btn-primary">
            Start learning free
            <PixelIcon type="arrow" size={18} />
          </Link>
          <a href="#features" className="btn btn-secondary">
            Learn more
            <PixelIcon type="arrow" size={18} />
          </a>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">5</div>
            <div className="stat-label">Study Modes</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">25MB</div>
            <div className="stat-label">Max File Upload</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">&lt;3s</div>
            <div className="stat-label">Avg AI Response</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime SLA</div>
          </div>
        </div>

        {adminSettings && reviews && reviews.length > 0 && (
          <div className="hero-reviews-scroll-container">
            <div className="reviews-scroll-header">
              <PixelIcon type="star" size={18} />
              <span>What Our Users Say</span>
              <span className="reviews-count">({reviews.length} verified reviews)</span>
            </div>
            <div className="reviews-scroll-wrapper">
              <div className="reviews-scroll-track">
                {[...reviews, ...reviews].map((review, index) => (
                  <div key={`${review.$id}-${index}`} className="review-scroll-card">
                    <div className="review-scroll-rating" aria-label={`${review.rating || 5} out of 5 stars`}>
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <PixelIcon key={i} type="star" size={14} />
                      ))}
                    </div>
                    <p className="review-scroll-text">
                      "{review.title || review.content?.substring(0, 100) || 'Great experience!'}"
                    </p>
                    <span className="review-scroll-author">
                      - {review.userName || 'Verified User'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
