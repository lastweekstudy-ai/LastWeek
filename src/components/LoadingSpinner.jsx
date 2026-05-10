import React from 'react';

const LoadingSpinner = ({ size = 20, className = "" }) => (
  <div className={`loading-spinner ${className}`}>
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className="spinner-icon"
    >
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeDasharray="31.416" 
        strokeDashoffset="31.416"
      >
        <animate 
          attributeName="stroke-dasharray" 
          dur="2s" 
          values="0 31.416;15.708 15.708;0 31.416;0 31.416" 
          repeatCount="indefinite"
        />
        <animate 
          attributeName="stroke-dashoffset" 
          dur="2s" 
          values="0;-15.708;-31.416;-31.416" 
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  </div>
);

export default LoadingSpinner;