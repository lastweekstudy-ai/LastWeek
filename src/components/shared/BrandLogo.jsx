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
        className={`brand-logo-fallback ${className}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: variant === 'text' ? '14px' : '12px',
          fontWeight: 700,
          color: '#FFFFFF',
          backgroundColor: 'rgba(var(--color-accent-rgb), 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(var(--color-accent-rgb), 0.2)',
        }}
      >
        {variant === 'text' ? 'LastWeek' : 'LW'}
      </div>
    );
  }

  return (
    <img
      src={logoPath}
      alt={altText}
      width={width}
      height={height}
      className={`brand-logo ${className}`}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      style={{
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
};

export default BrandLogo;
