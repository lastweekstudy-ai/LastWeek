import React from 'react';

const LoadingDots = ({ size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'loading-dots-sm' : 'loading-dots';
  
  return (
    <div className={sizeClass}>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

export default LoadingDots;