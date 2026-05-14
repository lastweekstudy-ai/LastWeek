# Mobile Responsive Implementation Plan

**Date**: May 14, 2026  
**Goal**: Make the entire LastWeek website fully mobile responsive  
**Reference**: `docs/mobile-responsive.css` (comprehensive design specification)  
**Current Status**: Partial implementation in `src/styles/mobile-responsive.css`

---

## 📊 Current Status Analysis

### ✅ Already Implemented (Partial)
- Global mobile fixes (viewport, overflow prevention)
- Study mode mobile responsiveness (basic)
- Chat interface mobile responsiveness (basic)
- Exam mode mobile responsiveness
- Split screen layout mobile responsiveness
- Touch device optimizations
- Safe area insets for notched devices

### ❌ Missing from Implementation
1. **Design Tokens** — Typography scaling, root container adjustments
2. **Language Learning** — Dashboard, lesson, practice pages
3. **Flashcard** — Stacked confidence buttons, proper sizing
4. **Inline Quiz** — Touch-friendly options, no hover effects
5. **Message Formatter** — Responsive text, code block overflow
6. **Audio Lecture Viewer** — Tab switcher, mobile-active panels
7. **PDF Viewer** — Bottom toolbar, bottom sheets, color picker
8. **File Prompt Input** — Stacked actions, full-width button
9. **Tablet breakpoint** — 768-1125px optimizations
10. **Small phone breakpoint** — <480px optimizations
11. **Landscape handling** — Special layouts for landscape orientation
12. **Scrollbar styling** — Thinner scrollbars on mobile

---

## 🎯 Implementation Tasks

### Phase 1: Foundation & Design Tokens (Priority: HIGH)

#### Task 1.1: Typography Scaling
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
/* Tablet (≤1125px) */
@media (max-width: 1125px) {
  :root {
    font-size: 16px;           /* 18px → 16px */
    letter-spacing: 0.14px;
  }

  #root {
    width: 100%;
    border-inline: none;       /* Remove side borders */
  }

  h1 {
    font-size: 36px;           /* 56px → 36px */
    letter-spacing: -1px;
    margin: 20px 0;
  }

  h2 {
    font-size: 20px;           /* 24px → 20px */
  }
}

/* Mobile (≤767px) */
@media (max-width: 767px) {
  :root {
    font-size: 15px;           /* 16px → 15px */
    letter-spacing: 0.1px;
  }

  h1 {
    font-size: 28px;           /* 36px → 28px */
    letter-spacing: -0.5px;
    margin: 16px 0;
  }

  h2 {
    font-size: 18px;           /* 20px → 18px */
    margin: 0 0 6px;
  }

  code {
    font-size: 13px;           /* 15px → 13px */
    padding: 3px 6px;
  }
}

/* Small phones (≤479px) */
@media (max-width: 479px) {
  :root {
    font-size: 14px;           /* 15px → 14px */
  }

  h1 {
    font-size: 24px;           /* 28px → 24px */
  }

  h2 {
    font-size: 16px;           /* 18px → 16px */
  }
}
```

**Why**: Progressive typography scaling ensures readability on smaller screens while maximizing content space.

---

#### Task 1.2: Root Container Adjustments
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
- Remove 1126px width constraint on tablet/mobile
- Remove side borders on tablet/mobile
- Full-width layout on smaller screens

**Impact**: Makes the app feel native on mobile instead of desktop-constrained.

---

### Phase 2: Chat Interface Enhancements (Priority: HIGH)

#### Task 2.1: Chat Message Improvements
**File**: `src/styles/mobile-responsive.css`  
**Status**: ⚠️ Partially Implemented

**What to improve**:
```css
/* Tablet (≤1125px) */
@media (max-width: 1125px) {
  .chat-input-area {
    padding: 0 24px;
  }

  .chat-messages-improved {
    padding: 16px 20px;
    padding-bottom: 200px;
  }

  .chat-message-improved.user,
  .chat-message-improved.assistant {
    max-width: 92%;
  }
}

/* Mobile (≤767px) */
@media (max-width: 767px) {
  .chat-messages-improved {
    padding: 12px 12px;
    padding-bottom: 180px;
    gap: 12px;
  }

  .message-avatar {
    width: 36px;               /* 52px → 36px */
    height: 36px;
  }

  .chat-input-improved {
    min-height: 44px;          /* Touch target */
    font-size: 15px;
    padding: 10px 14px;
  }

  .chat-send-btn-improved {
    width: 44px;
    height: 44px;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .scroll-to-bottom-btn {
    bottom: 120px;
    right: 16px;
    width: 40px;
    height: 40px;
  }

  .math-keyboard {
    max-height: 110px;
    padding: 8px;
  }

  .math-sym-btn {
    min-width: 34px;
    height: 30px;
    font-size: 13px;
  }
}
```

**Why**: Current implementation is basic. Need proper avatar sizing, touch targets, and math keyboard optimization.

---

### Phase 3: Language Learning Pages (Priority: HIGH)

#### Task 3.1: Language Learning Dashboard
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
/* Mobile (≤767px) */
@media (max-width: 767px) {
  .language-learning-container {
    padding: 16px 12px;
  }

  /* Header: stack title and selector */
  .language-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .language-selector {
    width: 100%;
  }

  /* Stages: horizontal scroll */
  .learning-stages {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
    gap: 8px;
  }

  .stage-card {
    flex: 0 0 auto;
    min-width: 140px;
    scroll-snap-align: start;
  }

  /* Modules: single column */
  .modules-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .module-card {
    flex-direction: row;      /* Icon left, content right */
    align-items: flex-start;
    gap: 12px;
  }

  .module-icon {
    width: 44px;
    height: 44px;
    font-size: 1.4rem;
    flex-shrink: 0;
    margin-bottom: 0;
  }

  /* Stats: 2×2 grid */
  .stats-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
}
```

**Files to check**:
- `src/components/language-learning/LanguageLearning.jsx`
- `src/styles/LanguageLearning.css` (if exists)

**Why**: Language learning is a major feature that needs proper mobile layout.

---

#### Task 3.2: Language Lesson Page
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
/* Mobile (≤767px) */
@media (max-width: 767px) {
  .lesson-header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 16px;
  }

  .lesson-header h2 {
    font-size: 1rem;
    flex: 1;
    text-align: center;
  }

  /* Progress steps: scale down */
  .progress-steps {
    gap: 4px;
    width: 100%;
    justify-content: center;
    order: 3;
  }

  .progress-step {
    width: 28px;
    height: 28px;
    font-size: 0.7rem;
  }

  .lesson-content {
    padding: 1rem;
  }

  .example-card {
    flex-direction: row;
    gap: 8px;
  }

  .option-btn {
    padding: 0.85rem 1rem;    /* Larger touch target */
  }

  .score-value {
    font-size: 2.5rem;
  }
}
```

**Files to check**:
- `src/components/language-learning/LanguageLearningLesson.jsx`
- `src/styles/LanguageLearningLesson.css` (if exists)

---

#### Task 3.3: Language Practice Page
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
/* Mobile (≤767px) */
@media (max-width: 767px) {
  .practice-modes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .practice-mode-card {
    padding: 12px;
  }

  .audio-controls {
    flex-direction: column;
    gap: 8px;
  }

  .audio-btn {
    width: 100%;
    justify-content: center;
    padding: 0.75rem;
    min-height: 44px;
  }
}

/* Small phones (≤479px) */
@media (max-width: 479px) {
  .practice-modes {
    grid-template-columns: 1fr;
  }

  .practice-mode-card {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
}
```

---

### Phase 4: Interactive Components (Priority: HIGH)

#### Task 4.1: Flashcard Mobile Optimization
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
/* Mobile (≤767px) */
@media (max-width: 767px) {
  .inline-flashcard-face {
    padding: 1rem 1.125rem;
    min-height: 140px;
  }

  /* Confidence buttons: stacked, full width */
  .inline-confidence-buttons {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    width: 100%;
  }

  .inline-confidence-btn {
    padding: 0.625rem 1rem;
    text-align: center;
    justify-content: center;
    min-height: 44px;
  }
}
```

**Files to check**:
- `src/components/shared/Flashcard.jsx`
- `src/styles/Flashcard.css`

**Why**: Stacked buttons are easier to tap on mobile than horizontal layout.

---

#### Task 4.2: Inline Quiz Mobile Optimization
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
/* Mobile (≤767px) */
@media (max-width: 767px) {
  .iq-option {
    padding: 0.75rem 0.875rem;
  }

  /* Disable hover slide on mobile */
  .iq-option:not(:disabled):hover {
    transform: none;
  }

  .iq-option:not(:disabled):active {
    transform: translateX(3px);  /* Active (tap) instead */
  }

  .iq-option-label {
    width: 1.5rem;
    height: 1.5rem;
  }
}
```

**Files to check**:
- `src/components/shared/InlineQuiz.jsx`
- `src/styles/InlineQuiz.css`

**Why**: Touch devices don't have hover, need active states instead.

---

#### Task 4.3: Message Formatter Mobile Optimization
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
/* Mobile (≤767px) */
@media (max-width: 767px) {
  .formatted-message {
    font-size: 0.9375rem;
    line-height: 1.65;
  }

  .formatted-message h1 {
    font-size: 1.125rem;
  }

  .formatted-message h2 {
    font-size: 1rem;
  }

  /* Prevent code overflow */
  .formatted-message pre {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
  }
}
```

**Files to check**:
- `src/components/shared/MessageFormatter.jsx`
- `src/styles/MessageFormatter.css`

---

### Phase 5: Study Modes (Priority: MEDIUM)

#### Task 5.1: Audio Lecture Viewer Mobile
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
/* Mobile (≤767px) */
@media (max-width: 767px) {
  /* Tab bar to switch between panels */
  .alv-mobile-tabs {
    display: flex !important;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--border);
  }

  .alv-mobile-tab {
    flex: 1;
    padding: 10px;
    text-align: center;
    min-height: 44px;
  }

  .alv-mobile-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  /* Body: stack panels */
  .alv-body {
    flex-direction: column;
  }

  .alv-resize-handle {
    display: none !important;
  }

  .alv-left,
  .alv-right {
    width: 100% !important;
    display: none;
  }

  .alv-left.mobile-active,
  .alv-right.mobile-active {
    display: flex;
    flex: 1;
  }
}

/* Landscape: show both panels */
@media (max-width: 767px) and (orientation: landscape) {
  .alv-body {
    flex-direction: row;
  }

  .alv-left,
  .alv-right {
    display: flex !important;
    width: 50% !important;
  }

  .alv-resize-handle {
    display: flex !important;
  }

  .alv-mobile-tabs {
    display: none !important;
  }
}
```

**Files to check**:
- `src/components/audio/AudioLectureViewer.jsx`
- `src/styles/AudioLectureViewer.css`
- `src/styles/AudioLectureViewerMobile.css` (already exists!)

**Note**: There's already a separate mobile CSS file. Need to merge or consolidate.

---

#### Task 5.2: PDF Viewer Mobile
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
/* Mobile (≤767px) */
@media (max-width: 767px) {
  /* Move toolbar to BOTTOM (thumb-friendly) */
  .pdf-viewer-toolbar {
    order: 10;
    border-bottom: none;
    border-top: 1px solid var(--border);
  }

  .pdf-viewer-container {
    flex-direction: column;
  }

  .pdf-viewer-header  { order: 1; }
  .pdf-viewer-content { order: 2; flex: 1; }
  .pdf-viewer-toolbar { order: 3; }

  /* Sidebars: slide from BOTTOM */
  .pdf-bookmarks-sidebar,
  .pdf-highlights-sidebar {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 60vh;
    border-left: none;
    border-top: 1px solid var(--border);
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
  }

  /* Handle bar for bottom sheets */
  .pdf-bookmarks-sidebar::before,
  .pdf-highlights-sidebar::before {
    content: '';
    display: block;
    width: 36px;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 8px auto 12px;
  }

  /* Color picker: larger swatches */
  .color-option {
    width: 36px;
    height: 36px;
  }
}
```

**Files to check**:
- `src/components/pdf/PDFViewer.jsx`
- `src/styles/PDFViewer.css`
- `src/styles/PDFViewerMobile.css` (already exists!)

**Note**: There's already a separate mobile CSS file. Need to merge or consolidate.

---

#### Task 5.3: File Prompt Input Mobile
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
/* Mobile (≤767px) */
@media (max-width: 767px) {
  .file-prompt-input {
    padding: 12px;
    border-radius: 10px;
  }

  /* Stack actions: button above hints */
  .prompt-actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .send-btn {
    width: 100%;
    justify-content: center;
    min-height: 44px;
    order: 1;
  }

  .prompt-hints {
    text-align: center;
    order: 2;
  }
}
```

**Files to check**:
- `src/components/shared/FilePromptInput.jsx`
- `src/styles/FilePromptInput.css`

---

### Phase 6: Global Utilities (Priority: MEDIUM)

#### Task 6.1: Touch Interaction Fixes
**File**: `src/styles/mobile-responsive.css`  
**Status**: ⚠️ Partially Implemented

**What to add**:
```css
/* Disable hover on touch devices */
@media (hover: none) {
  .module-card:hover,
  .stage-card:hover {
    transform: none;
    box-shadow: none;
  }

  /* Use :active for tap feedback */
  .module-card:active {
    transform: scale(0.98);
  }

  .inline-confidence-btn:active {
    transform: translateY(1px);
    opacity: 0.85;
  }
}
```

**Why**: Prevents sticky hover states on touch devices.

---

#### Task 6.2: Overflow Prevention
**File**: `src/styles/mobile-responsive.css`  
**Status**: ✅ Already Implemented

**Current implementation is good**. Just verify:
- No horizontal scroll
- Word breaking in messages
- 44px minimum touch targets
- Responsive images/media

---

#### Task 6.3: Scrollbar Styling
**File**: `src/styles/mobile-responsive.css`  
**Status**: ❌ Not Implemented

**What to add**:
```css
@media (max-width: 1125px) {
  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 2px;
  }
}
```

**Why**: Thinner scrollbars look cleaner on mobile.

---

### Phase 7: Additional Pages (Priority: LOW)

#### Task 7.1: Dashboard Mobile
**Files to check**:
- `src/pages/Dashboard.jsx`
- `src/styles/Dashboard.css`

**What to add**: Single column layout, stacked cards, mobile navigation.

---

#### Task 7.2: Settings Mobile
**Files to check**:
- `src/pages/Settings.jsx`
- `src/styles/Settings.css`

**What to add**: Full-width form inputs, stacked sections, larger touch targets.

---

#### Task 7.3: Landing Pages Mobile
**Files to check**:
- `src/pages/Landing.jsx`
- `src/styles/Landing.css`
- `src/styles/LandingNew.css`
- `src/styles/LandingPro.css`

**What to add**: Hero section scaling, stacked features, mobile CTAs.

---

#### Task 7.4: Navbar Mobile
**Files to check**:
- `src/components/layout/Navbar.jsx`
- `src/styles/Navbar.css`

**What to add**: Hamburger menu, bottom navigation, mobile logo sizing.

---

#### Task 7.5: Profile Dropdown Mobile
**Files to check**:
- `src/components/layout/ProfileDropdown.jsx`
- `src/styles/ProfileDropdown.css`

**What to add**: Full-width dropdown, larger touch targets, bottom sheet style.

---

### Phase 8: Testing & Verification (Priority: HIGH)

#### Task 8.1: Device Testing
**Devices to test**:
- iPhone SE (375×667) — Small phone
- iPhone 12/13 (390×844) — Standard phone
- iPhone 14 Pro Max (430×932) — Large phone
- iPad Mini (768×1024) — Small tablet
- iPad Pro (1024×1366) — Large tablet
- Android phones (various sizes)

**What to test**:
- Typography scaling
- Touch targets (44px minimum)
- Horizontal scroll (should not exist)
- Keyboard behavior
- Safe area insets (notch/home bar)
- Landscape orientation
- Bottom sheets
- Tab switchers

---

#### Task 8.2: Browser Testing
**Browsers to test**:
- Safari iOS (primary)
- Chrome Android (primary)
- Firefox Mobile
- Samsung Internet

**What to test**:
- CSS compatibility
- Touch events
- Scrolling behavior
- Viewport units (vh, vw)
- Safe area insets

---

#### Task 8.3: Accessibility Testing
**What to test**:
- Touch target sizes (44px minimum)
- Color contrast ratios
- Font sizes (minimum 14px)
- Focus indicators
- Screen reader compatibility

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Task 1.1: Typography scaling (all breakpoints)
- [ ] Task 1.2: Root container adjustments
- [ ] Task 6.3: Scrollbar styling
- [ ] Task 6.1: Touch interaction fixes

### Phase 2: Core Features (Week 1-2)
- [ ] Task 2.1: Chat interface enhancements
- [ ] Task 4.1: Flashcard mobile optimization
- [ ] Task 4.2: Inline quiz mobile optimization
- [ ] Task 4.3: Message formatter mobile optimization

### Phase 3: Language Learning (Week 2)
- [ ] Task 3.1: Language learning dashboard
- [ ] Task 3.2: Language lesson page
- [ ] Task 3.3: Language practice page

### Phase 4: Study Modes (Week 2-3)
- [ ] Task 5.1: Audio lecture viewer mobile
- [ ] Task 5.2: PDF viewer mobile
- [ ] Task 5.3: File prompt input mobile

### Phase 5: Additional Pages (Week 3)
- [ ] Task 7.1: Dashboard mobile
- [ ] Task 7.2: Settings mobile
- [ ] Task 7.3: Landing pages mobile
- [ ] Task 7.4: Navbar mobile
- [ ] Task 7.5: Profile dropdown mobile

### Phase 6: Testing (Week 3-4)
- [ ] Task 8.1: Device testing
- [ ] Task 8.2: Browser testing
- [ ] Task 8.3: Accessibility testing

---

## 🔧 Technical Implementation Notes

### Approach 1: Consolidate into Single File (Recommended)
**Pros**:
- Single source of truth
- Easier to maintain
- No duplicate rules
- Clear breakpoint organization

**Cons**:
- Large file size
- Need to carefully organize

**Action**: Merge all mobile styles into `src/styles/mobile-responsive.css`

---

### Approach 2: Keep Separate Mobile Files
**Pros**:
- Component-specific mobile styles
- Smaller individual files
- Can load conditionally

**Cons**:
- Duplicate rules
- Hard to maintain consistency
- Multiple files to update

**Action**: Keep `AudioLectureViewerMobile.css` and `PDFViewerMobile.css` separate, but ensure they follow the same patterns.

---

### Recommended Approach: Hybrid
1. **Global mobile styles** → `src/styles/mobile-responsive.css`
2. **Component-specific complex mobile styles** → Separate files (e.g., `AudioLectureViewerMobile.css`)
3. **Simple component mobile styles** → Add to main component CSS file

---

## 📱 Breakpoint Strategy

### Desktop (1126px+)
- Baseline styles
- No media queries needed
- Centered 1126px container
- Side borders

### Tablet (768px–1125px)
- Remove side borders
- Full-width layout
- Reduce font sizes (18px → 16px)
- Reduce padding/margins
- Keep side-by-side layouts where possible

### Mobile (480px–767px)
- Stack layouts vertically
- Bottom toolbars
- Tab switchers (replace split-panes)
- Bottom sheets (replace sidebars)
- Reduce font sizes (16px → 15px)
- 44px minimum touch targets

### Small Phones (<480px)
- Single column layouts
- Further reduce font sizes (15px → 14px)
- Compact spacing
- Simplified UI elements

### Landscape Phone
- Show split-panes (more horizontal space)
- Keep horizontal layouts
- Reduce vertical padding

---

## 🎨 Design Principles

### 1. Touch-First
- 44px minimum touch targets
- No hover effects (use :active)
- Bottom UI elements (thumb zone)
- Larger tap areas

### 2. Progressive Disclosure
- Tab switchers (show one panel at a time)
- Bottom sheets (slide up from bottom)
- Collapsible sections
- Simplified navigation

### 3. Content Priority
- Reduce padding/margins
- Smaller font sizes
- Hide non-essential elements
- Focus on primary actions

### 4. Performance
- Thinner scrollbars
- Disable animations on low-end devices
- Lazy load images
- Optimize touch events

### 5. Accessibility
- 44px minimum touch targets
- Sufficient color contrast
- Readable font sizes (minimum 14px)
- Focus indicators
- Screen reader support

---

## 🚀 Quick Start

### Step 1: Backup Current File
```bash
cp src/styles/mobile-responsive.css src/styles/mobile-responsive.backup.css
```

### Step 2: Start with Foundation
Implement Phase 1 tasks first (typography, root container, scrollbars).

### Step 3: Test on Real Device
Use browser dev tools + real device testing.

### Step 4: Iterate by Component
Implement one component at a time, test, then move to next.

### Step 5: Cross-Browser Testing
Test on Safari iOS, Chrome Android, Firefox Mobile.

---

## 📊 Success Metrics

### Quantitative
- [ ] 100% of pages responsive on mobile
- [ ] All touch targets ≥44px
- [ ] No horizontal scroll on any page
- [ ] Font sizes ≥14px on small phones
- [ ] Page load time <3s on 3G

### Qualitative
- [ ] Feels native on mobile
- [ ] Easy to use with one hand
- [ ] No accidental taps
- [ ] Smooth scrolling
- [ ] Intuitive navigation

---

## 📞 Support & Resources

### Documentation
- `docs/mobile-responsive.css` — Complete mobile design spec
- `docs/design-reference/12-mobile-responsive.md` — Mobile design documentation
- `DESIGN_DOCUMENTATION_COMPLETE.md` — Full design system

### Testing Tools
- Chrome DevTools (Device Mode)
- Firefox Responsive Design Mode
- Safari Web Inspector (iOS Simulator)
- BrowserStack (Real device testing)
- Lighthouse (Performance & Accessibility)

### Reference
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design (Mobile)](https://m3.material.io/)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: May 14, 2026  
**Status**: Ready to implement  
**Estimated Time**: 3-4 weeks for full implementation
