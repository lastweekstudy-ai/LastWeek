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

  // Determine which logo file to use
  const logoPath = variant === 'text' 
    ? '/logos/lastweek_text_logo.png'
    : '/logos/lastweek_main_logo.png';

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
  if (imageError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl border border-brand-500/30 bg-brand-600/15 font-display font-bold text-gradient ${className}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          fontSize: variant === 'text' ? '14px' : '12px',
        }}
      >
        {variant === 'text' ? 'LastWeek' : 'LW'}
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
      {variant === 'text' && <span className="text-gradient">LastWeek</span>}
    </span>
  );
};

export default BrandLogo;
