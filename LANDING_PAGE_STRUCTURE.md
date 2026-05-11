# Landing Page Structure & Kiro Edit Permissions

## Overview
This document outlines the new landing page structure and clarifies which files Kiro is allowed to edit.

## ✅ KIRO CAN EDIT (Landing Page Only)

### Landing Page Files
- `src/pages/landing/LandingPage.jsx` - Main landing page component
- `src/pages/landing/landing.css` - Landing page styles
- `src/pages/landing/sections/Navbar.jsx` - Navigation bar
- `src/pages/landing/sections/Hero.jsx` - Hero section
- `src/pages/landing/sections/Features.jsx` - Features section
- `src/pages/landing/sections/HowItWorks.jsx` - How it works section
- `src/components/shared/pixel-art/PixelIcons.jsx` - Pixel art icons (used by landing)
- `src/components/shared/BrandLogo.jsx` - Brand logo component (used by landing)

### Route
- `/` (Landing page route only)

## ❌ KIRO CANNOT EDIT (Protected Pages)

### Documentation Pages
- `src/pages/docs/` - All documentation pages
- `/docs` route

### About Page
- `src/pages/about/` - About page
- `/about` route

### Policy Pages
- `src/pages/policies/` - All policy pages
- `/privacy-policy`, `/terms-and-conditions`, `/cookie-policy`, `/refund-policy` routes

### Contact Page
- `src/pages/contact/` - Contact page
- `/contact` route

### Security Page
- `src/pages/security/` - Security page
- `/security` route

### Roadmap Page
- `src/pages/roadmap/` - Roadmap page
- `/roadmap` route

### Status Page
- `src/pages/status/` - Status page
- `/status` route

### Other Protected Files
- `src/App.jsx` - Only the landing page route can be modified
- `src/main.jsx` - Cannot be edited
- `src/context/` - Cannot be edited
- `src/hooks/` - Cannot be edited
- `src/utils/` - Cannot be edited
- `src/appwrite/` - Cannot be edited
- `src/components/` (except shared pixel-art and BrandLogo) - Cannot be edited

## Project Structure

```
src/
├── pages/
│   ├── landing/                    ✅ EDITABLE BY KIRO
│   │   ├── LandingPage.jsx
│   │   ├── landing.css
│   │   └── sections/
│   │       ├── Navbar.jsx
│   │       ├── Hero.jsx
│   │       ├── Features.jsx
│   │       └── HowItWorks.jsx
│   ├── docs/                       ❌ PROTECTED
│   ├── about/                      ❌ PROTECTED
│   ├── policies/                   ❌ PROTECTED
│   ├── contact/                    ❌ PROTECTED
│   ├── security/                   ❌ PROTECTED
│   ├── roadmap/                    ❌ PROTECTED
│   └── status/                     ❌ PROTECTED
├── components/
│   ├── shared/
│   │   ├── pixel-art/
│   │   │   └── PixelIcons.jsx      ✅ EDITABLE BY KIRO
│   │   └── BrandLogo.jsx           ✅ EDITABLE BY KIRO
│   └── [other components]          ❌ PROTECTED
├── context/                        ❌ PROTECTED
├── hooks/                          ❌ PROTECTED
├── utils/                          ❌ PROTECTED
├── appwrite/                       ❌ PROTECTED
├── App.jsx                         ❌ PROTECTED (except landing route)
└── main.jsx                        ❌ PROTECTED
```

## Landing Page Sections

### 1. Navbar
- Sticky navigation with logo
- Desktop and mobile responsive
- Links to features, how it works, pricing, FAQ
- CTA button for "Get Started"
- Mobile hamburger menu

### 2. Hero Section
- Large headline with gradient text
- Supporting subtitle
- Primary and secondary CTA buttons
- Product statistics (4 key metrics)
- Floating background elements with purple glow

### 3. Features Section
- 6 feature cards in responsive grid
- Pixel-art icons for each feature
- Hover effects with glow and lift
- Dark glassmorphic design

### 4. How It Works
- 4-step process visualization
- Step numbers and icons
- Connector lines on desktop
- Responsive grid layout

## Design System

### Colors
- Background Primary: `#0A0A0A`
- Background Secondary: `#121212`
- Primary Purple: `#8B5CF6`
- Secondary Purple: `#A855F7`
- Text White: `#FFFFFF`
- Text Muted: `#A1A1AA`
- Border Color: `rgba(139, 92, 246, 0.2)`
- Glow Color: `rgba(139, 92, 246, 0.35)`

### Typography
- Font Family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Headings: 800 font-weight
- Body: 400-500 font-weight

### Spacing
- Container max-width: 1200px
- Container padding: 2rem (responsive)
- Section padding: 6rem vertical
- Gap between items: 2rem

### Border Radius
- Cards: 16px
- Buttons: 12px
- Icons: 12px

## Pixel-Art Icons

All icons are custom SVG-based pixel art (no standard emojis):
- Logo
- Menu/Close
- Book
- Brain
- Chart
- Share
- Clock
- Flash
- Target
- Arrow
- Checkmark
- Code
- Settings
- Star
- Heart
- Search
- Download
- External

## Brand Assets

### Logo Files (in `/public/logos/`)
- `lastweek_main_logo.ico` - Favicon
- `lastweek_main_logo.png` - Icon logo
- `lastweek_text_logo.png` - Text logo

### Usage
- Navbar: Icon on mobile, text on desktop
- Hero: Text logo
- Footer: Text logo
- All pages: Consistent branding

## Responsive Breakpoints

- Mobile: < 480px
- Tablet: 480px - 768px
- Desktop: > 768px
- Large Desktop: > 1024px

## Performance Considerations

- Lazy loading for images
- CSS animations for smooth transitions
- Backdrop blur for glassmorphism
- Optimized SVG icons
- Minimal JavaScript

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- High contrast colors
- Focus indicators
- Reduced motion support

## SEO

- Unique meta tags per page
- Open Graph tags
- Semantic heading hierarchy
- Structured data
- Mobile-friendly design

## Future Sections to Add

- Testimonials section
- Pricing section
- FAQ section
- Final CTA section
- Footer with links

## Important Notes

1. **Kiro Edit Scope**: Only modify files in `src/pages/landing/` and related shared components
2. **No Other Pages**: Do not create or modify any other page routes
3. **Pixel Art Only**: Use only pixel-art style icons, no standard emojis
4. **Authentic Content**: Use real statistics and honest descriptions
5. **Brand Consistency**: Always use the official logo files from `/public/logos/`
6. **Responsive Design**: Test on mobile, tablet, and desktop
7. **Performance**: Keep animations smooth and optimize for Lighthouse scores

## Testing

```bash
# Build
npm run build

# Dev server
npm run dev

# Check at http://localhost:5174
```

## Deployment

The landing page is production-ready and can be deployed immediately. All code follows best practices for:
- Performance
- Accessibility
- SEO
- Mobile responsiveness
- Code maintainability
