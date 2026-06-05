# Mobile Navbar Toggle Button & Spacing Fix

## Issue
1. **Toggle button showing no hamburger icon** - Just a purple box on mobile
2. **No breathing space in session views on mobile** - Design too cramped

## Root Cause
The PixelIcon component for menu/close icons had hardcoded white color (`stroke="#FFFFFF"`), which didn't show properly when the button background was changed to transparent.

## Solution

### 1. Toggle Button Icon Fix

**Changed in `src/components/shared/pixel-art/PixelIcons.jsx`:**
- Changed `stroke="#FFFFFF"` to `stroke="currentColor"` for menu and close icons
- Increased strokeWidth from 2 to 3 for better visibility
- Added `strokeLinecap="round"` for smoother, more premium look
- Icons now inherit color from CSS (purple #7c3aed)

**Changed in `src/pages/landing/sections/Navbar.jsx`:**
- Removed all inline styles from toggle button
- Button now styled purely via CSS

**Changed in `src/pages/landing/landing.css`:**
```css
.navbar-mobile-toggle {
  background: transparent;  /* No background */
  border: none;             /* No border */
  color: #7c3aed;          /* Purple icon color */
}

.navbar-mobile-toggle:hover {
  color: #6d28d9;          /* Darker purple on hover */
  transform: scale(1.05);
}
```

### 2. Mobile Spacing Enhancement

**Changed in `src/styles/global.css`:**
Added comprehensive mobile spacing rules:
- Mode pages: 1.5rem padding
- Session cards: 2rem padding with 1.5rem margin
- Chat areas: 1.5rem padding
- Form containers: 2rem padding
- Dashboard grids: 1.5rem gap and padding
- Extra small devices (480px): 1.25rem padding

## Result
✅ Toggle button now shows visible purple hamburger icon  
✅ Icon color changes on hover (purple → darker purple)  
✅ No background color - clean, minimal design  
✅ All mobile views have breathing room with proper spacing  
✅ Consistent spacing across study, exam, and chat interfaces

## Files Modified
1. `src/components/shared/pixel-art/PixelIcons.jsx` - Icon color inheritance
2. `src/pages/landing/sections/Navbar.jsx` - Removed inline styles
3. `src/pages/landing/landing.css` - Transparent button styling
4. `src/styles/global.css` - Enhanced mobile spacing rules
