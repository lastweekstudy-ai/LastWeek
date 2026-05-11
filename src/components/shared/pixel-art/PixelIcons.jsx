// Pixel-art style icons - retro 8-bit inspired
// All icons are custom SVG-based pixel art, no standard emojis

export const PixelIcon = ({ type, size = 24, className = '' }) => {
  const baseSize = size;
  
  const icons = {
    // Logo and branding
    logo: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <rect x="4" y="4" width="24" height="24" fill="#8B5CF6" stroke="#A855F7" strokeWidth="2"/>
        <rect x="8" y="8" width="4" height="4" fill="#A855F7"/>
        <rect x="20" y="8" width="4" height="4" fill="#A855F7"/>
        <rect x="8" y="20" width="4" height="4" fill="#A855F7"/>
        <rect x="20" y="20" width="4" height="4" fill="#A855F7"/>
      </svg>
    ),
    
    // Navigation and UI
    menu: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <line x1="4" y1="8" x2="28" y2="8" stroke="#FFFFFF" strokeWidth="2"/>
        <line x1="4" y1="16" x2="28" y2="16" stroke="#FFFFFF" strokeWidth="2"/>
        <line x1="4" y1="24" x2="28" y2="24" stroke="#FFFFFF" strokeWidth="2"/>
      </svg>
    ),
    
    close: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <line x1="8" y1="8" x2="24" y2="24" stroke="#FFFFFF" strokeWidth="2"/>
        <line x1="24" y1="8" x2="8" y2="24" stroke="#FFFFFF" strokeWidth="2"/>
      </svg>
    ),
    
    // Features and capabilities
    book: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <rect x="6" y="4" width="20" height="24" fill="#8B5CF6" stroke="#A855F7" strokeWidth="2"/>
        <line x1="16" y1="4" x2="16" y2="28" stroke="#A855F7" strokeWidth="2"/>
        <rect x="8" y="8" width="2" height="2" fill="#A855F7"/>
        <rect x="8" y="14" width="2" height="2" fill="#A855F7"/>
        <rect x="8" y="20" width="2" height="2" fill="#A855F7"/>
        <rect x="22" y="8" width="2" height="2" fill="#A855F7"/>
        <rect x="22" y="14" width="2" height="2" fill="#A855F7"/>
        <rect x="22" y="20" width="2" height="2" fill="#A855F7"/>
      </svg>
    ),
    
    brain: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="10" cy="10" r="3" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <circle cx="22" cy="10" r="3" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <circle cx="16" cy="22" r="4" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <line x1="10" y1="13" x2="16" y2="18" stroke="#A855F7" strokeWidth="1"/>
        <line x1="22" y1="13" x2="16" y2="18" stroke="#A855F7" strokeWidth="1"/>
      </svg>
    ),
    
    chart: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <rect x="4" y="20" width="3" height="8" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <rect x="10" y="14" width="3" height="14" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <rect x="16" y="8" width="3" height="20" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <rect x="22" y="12" width="3" height="16" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <line x1="2" y1="28" x2="28" y2="28" stroke="#A855F7" strokeWidth="1"/>
      </svg>
    ),
    
    share: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="8" cy="8" r="2" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <circle cx="24" cy="8" r="2" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <circle cx="16" cy="24" r="2" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <line x1="10" y1="9" x2="22" y2="9" stroke="#A855F7" strokeWidth="1"/>
        <line x1="10" y1="10" x2="15" y2="23" stroke="#A855F7" strokeWidth="1"/>
        <line x1="22" y1="10" x2="17" y2="23" stroke="#A855F7" strokeWidth="1"/>
      </svg>
    ),
    
    clock: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="12" fill="none" stroke="#8B5CF6" strokeWidth="2"/>
        <line x1="16" y1="6" x2="16" y2="10" stroke="#A855F7" strokeWidth="2"/>
        <line x1="16" y1="16" x2="22" y2="22" stroke="#A855F7" strokeWidth="2"/>
        <circle cx="16" cy="16" r="1" fill="#A855F7"/>
      </svg>
    ),
    
    flash: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <polygon points="16,2 22,14 16,14 24,28 8,16 14,16" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
      </svg>
    ),
    
    target: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="14" fill="none" stroke="#8B5CF6" strokeWidth="2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#A855F7" strokeWidth="2"/>
        <circle cx="16" cy="16" r="3" fill="#A855F7"/>
      </svg>
    ),
    
    // Action icons
    arrow: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <line x1="4" y1="16" x2="24" y2="16" stroke="#FFFFFF" strokeWidth="2"/>
        <polygon points="24,16 18,10 20,16 18,22" fill="#FFFFFF"/>
      </svg>
    ),
    
    checkmark: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <polyline points="6,16 12,22 26,8" fill="none" stroke="#10b981" strokeWidth="2"/>
      </svg>
    ),
    
    // Documentation and content
    code: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <polyline points="10,6 4,16 10,26" fill="none" stroke="#8B5CF6" strokeWidth="2"/>
        <polyline points="22,6 28,16 22,26" fill="none" stroke="#8B5CF6" strokeWidth="2"/>
        <line x1="14" y1="4" x2="18" y2="28" stroke="#A855F7" strokeWidth="2"/>
      </svg>
    ),
    
    settings: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="3" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <rect x="14" y="2" width="4" height="4" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <rect x="14" y="26" width="4" height="4" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <rect x="2" y="14" width="4" height="4" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
        <rect x="26" y="14" width="4" height="4" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
      </svg>
    ),
    
    // Status and feedback
    star: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <polygon points="16,2 20,12 30,12 22,18 26,28 16,22 6,28 10,18 2,12 12,12" fill="#A855F7" stroke="#A855F7" strokeWidth="1"/>
      </svg>
    ),
    
    heart: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M16 28C16 28 4 20 4 12C4 8 7 5 10 5C12 5 14 6 16 8C18 6 20 5 22 5C25 5 28 8 28 12C28 20 16 28 16 28Z" fill="#8B5CF6" stroke="#A855F7" strokeWidth="1"/>
      </svg>
    ),
    
    // Utility
    search: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="12" cy="12" r="8" fill="none" stroke="#8B5CF6" strokeWidth="2"/>
        <line x1="18" y1="18" x2="26" y2="26" stroke="#A855F7" strokeWidth="2"/>
      </svg>
    ),
    
    download: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <line x1="16" y1="4" x2="16" y2="20" stroke="#8B5CF6" strokeWidth="2"/>
        <polyline points="10,16 16,22 22,16" fill="none" stroke="#A855F7" strokeWidth="2"/>
        <line x1="4" y1="26" x2="28" y2="26" stroke="#8B5CF6" strokeWidth="2"/>
      </svg>
    ),
    
    external: (
      <svg width={baseSize} height={baseSize} viewBox="0 0 32 32" fill="none" className={className}>
        <rect x="6" y="6" width="16" height="16" fill="none" stroke="#8B5CF6" strokeWidth="2"/>
        <line x1="22" y1="6" x2="26" y2="2" stroke="#A855F7" strokeWidth="2"/>
        <line x1="26" y1="2" x2="26" y2="10" stroke="#A855F7" strokeWidth="2"/>
        <line x1="26" y1="2" x2="18" y2="10" stroke="#A855F7" strokeWidth="2"/>
      </svg>
    ),
  };
  
  return icons[type] || icons.logo;
};

export default PixelIcon;
