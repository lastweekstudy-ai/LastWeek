import React from 'react';

const LoadingSpinner = ({ size = 20, className = "" }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className="animate-spin rounded-full text-brand-500"
    >
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeDasharray="31.416"
        strokeDashoffset="8"
      />
    </svg>
  </div>
);

export default LoadingSpinner;
