import React, { useState } from 'react';

/**
 * Reusable BrandLogo component
 * Displays LastWeek branding with fallback handling
 */
const BrandLogo = ({
  variant = 'icon', // 'icon' or 'text'
  width = 40,
  height = 40,
  className = '',
  priority = false,
  alt = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // The icon PNG has a baked-in dark background, so render a theme-aware mark.
  const logoPath = '/logos/lastweek_text_logo.png';

  // Default alt text
  const altText = alt || (variant === 'text' ? 'LastWeek wordmark' : 'LastWeek logo');

  // Handle image load errors
  const handleError = () => {
    setImageError(true);
    if (process.env.NODE_ENV === 'development') {
      console.error(`Failed to load logo: ${logoPath}`);
    }
  };

  // Fallback text if image fails to load
  if (variant === 'icon') {
    return (
      <span
        className={`lastweek-nav-mark ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        aria-label={altText}
        role="img"
      >
        LW
      </span>
    );
  }

  if (variant === 'text') {
    return (
      <span
        className={`inline-flex items-center gap-2 font-display font-bold text-surface-900 dark:text-white ${className}`}
        style={{
          minHeight: `${height}px`,
          fontSize: Math.max(18, Math.round(height * 0.34)),
        }}
      >
        <span className="lastweek-nav-mark" style={{ width: `${Math.min(width, height)}px`, height: `${Math.min(width, height)}px` }} aria-hidden="true">
          LW
        </span>
        <span className="text-gradient">LastWeek</span>
      </span>
    );
  }

  if (imageError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl border border-brand-500/30 bg-brand-600/15 font-display font-bold text-gradient ${className}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          fontSize: '12px',
        }}
      >
        LW
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold text-surface-900 dark:text-white ${className}`}>
      <img
        src={logoPath}
        alt={altText}
        width={width}
        height={height}
        className="block object-contain"
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
    </span>
  );
};

export default BrandLogo;
