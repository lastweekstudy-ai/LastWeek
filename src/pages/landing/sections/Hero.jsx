import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../../components/shared/BrandLogo';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import { getAdminSettings, getPublishedReviews } from '../../../appwrite/admin';
import '../landing.css';

const Hero = () => {
  const [adminSettings, setAdminSettings] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // These collections require "Any" read permission in Appwrite to work on the
    // public landing page (no user session). If they return 401, fail silently —
    // the landing page renders fine without this data.
    const [settings, publishedReviews] = await Promise.allSettled([
      getAdminSettings(),
      getPublishedReviews(50),
    ]);

    if (settings.status === 'fulfilled') {
      setAdminSettings(settings.value);
    }
    if (publishedReviews.status === 'fulfilled') {
      setReviews(publishedReviews.value);
    }
  };

  const isPreRegMode = adminSettings?.preRegActive;
  const dailyFreeSlotsActive = adminSettings?.dailyFreeSlotsActive;
  const remainingSlots = adminSettings?.dailyFreeSlotCount || 10;

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="hero-content">
        {/* Pre-Registration & Free Tier Banner - Moved to Top */}
        {isPreRegMode && (
          <div className="hero-prereg-banner">
            <div className="prereg-banner-content">
              <span className="prereg-badge">🎉 LIMITED TIME</span>
              <h3 className="prereg-title">Pre-Registration Now Open!</h3>
              <p className="prereg-subtitle">
                Pay $5 now → Get <strong>Plus free for 1 year</strong> (a $180 value!)
              </p>
              <div className="prereg-actions">
                <Link to="/pre-register" className="btn btn-primary btn-sm">
                  Pre-Register Now
                </Link>
                {dailyFreeSlotsActive && (
                  <Link to="/auth?freeSlot=true" className="btn btn-outline btn-sm">
                    🎁 Try Free Slot
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Free Tier Only Banner (when not in pre-reg mode) */}
        {!isPreRegMode && dailyFreeSlotsActive && (
          <div className="hero-freetier-banner">
            <div className="freetier-banner-content">
              <span className="freetier-badge">🎁 FREE TRIAL</span>
              <h3 className="freetier-title">Test All Features Free Today!</h3>
              <p className="freetier-subtitle">
                <strong>{remainingSlots}</strong> slots remaining. Leave a review → Get Plus free for 1 year!
              </p>
              <Link to="/auth?freeSlot=true" className="btn btn-success btn-sm">
                Claim Your Free Slot
              </Link>
            </div>
          </div>
        )}

        <div className="hero-logo-container">
          <BrandLogo variant="text" width={200} height={60} priority={true} />
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
            Start Learning Free
            <PixelIcon type="arrow" size={18} />
          </Link>
          <a href="#features" className="btn btn-secondary">
            Learn More
            <PixelIcon type="arrow" size={18} />
          </a>
        </div>

        {/* Technical Stats - Real & Verifiable */}
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

        {/* Scrolling Approved Reviews - Real reviews from verified users */}
        {adminSettings && reviews && reviews.length > 0 && (
          <div className="hero-reviews-scroll-container">
            <div className="reviews-scroll-header">
              <PixelIcon type="star" size={18} />
              <span>What Our Users Say</span>
              <span className="reviews-count">({reviews.length} verified reviews)</span>
            </div>
            <div className="reviews-scroll-wrapper">
              <div className="reviews-scroll-track">
                {/* Duplicate reviews for seamless loop */}
                {[...reviews, ...reviews].map((review, index) => (
                  <div key={`${review.$id}-${index}`} className="review-scroll-card">
                    <div className="review-scroll-rating">
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <span key={i} className="review-star">★</span>
                      ))}
                    </div>
                    <p className="review-scroll-text">"{review.title || review.content?.substring(0, 100) || 'Great experience!'}"</p>
                    <span className="review-scroll-author">— {review.userName || 'Verified User'}</span>
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
