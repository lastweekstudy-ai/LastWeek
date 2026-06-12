import React from 'react';

const LoadingDots = ({ size = 'md' }) => {
  const dotClass = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`${dotClass} animate-bounce rounded-full bg-brand-500 [animation-delay:0ms]`}></span>
      <span className={`${dotClass} animate-bounce rounded-full bg-brand-500 [animation-delay:150ms]`}></span>
      <span className={`${dotClass} animate-bounce rounded-full bg-brand-500 [animation-delay:300ms]`}></span>
    </div>
  );
};

export default LoadingDots;
