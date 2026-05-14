# Mobile Responsive Design (mobile-responsive.css)

**File**: `src/styles/mobile-responsive.css`

**Purpose**: Complete responsive overrides for all screen sizes. Adapts desktop-first design (1126px) to tablet, mobile, and small phone screens.

---

## Breakpoints

```css
/* Desktop:  1126px+   (baseline, no overrides) */
/* Tablet:   768px–1125px */
/* Mobile:   480px–767px */
/* Small:    <480px */
```

**Design Intent**: 
- **Desktop-first**: Base styles optimized for 1126px
- **Progressive enhancement**: Each breakpoint adds mobile-specific improvements
- **Touch-friendly**: 44px minimum touch targets on mobile
- **Performance**: Thinner scrollbars, disabled hover effects on touch

---

## 1. Design Tokens (index.css)

### Tablet (≤1125px)

```css
:root {
  font-size: 16px;           /* 18px → 16px */
  letter-spacing: 0.14px;    /* 0.18px → 0.14px */
}

#root {
  width: 100%;
  border-inline: none;       /* Remove side borders */
}

h1 {
  font-size: 36px;           /* 56px → 36px (36% smaller) */
  letter-spacing: -1px;
  margin: 20px 0;
}

h2 {
  font-size: 20px;           /* 24px → 20px */
}
```

**Design Intent**: 
- **Remove side borders**: Full-width on tablet
- **Reduce font sizes**: More content fits on screen
- **Tighter letter-spacing**: Compensates for smaller text

### Mobile (≤767px)

```css
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
```

**Design Intent**: 
- **Further reduction**: More aggressive scaling for small screens
- **Tighter margins**: Maximize content space

### Small Phones (≤479px)

```css
:root {
  font-size: 14px;           /* 15px → 14px */
}

h1 {
  font-size: 24px;           /* 28px → 24px */
}

h2 {
  font-size: 16px;           /* 18px → 16px */
}
```

**Design Intent**: 
- **Minimum readable sizes**: Don't go smaller than this
- **Preserve hierarchy**: h1 still larger than h2

---

## 2. Chat Interface

### Mobile (≤767px)

```css
/* Messages */
.chat-messages-improved {
  padding: 12px 12px;
  padding-bottom: 180px;     /* 200px → 180px */
  gap: 12px;                 /* 20px → 12px */
}

.chat-message-improved.user,
.chat-message-improved.assistant {
  max-width: 100%;           /* No max-width constraint */
}

.chat-message-improved.user .message-bubble {
  max-width: 88%;            /* Slightly narrower for user */
}

/* Avatars — smaller */
.message-avatar {
  width: 36px;               /* 52px → 36px */
  height: 36px;
}

/* Input */
.chat-input-improved {
  min-height: 44px;          /* 52px → 44px (touch target) */
  font-size: 15px;
  padding: 10px 14px;
}

.chat-send-btn-improved {
  width: 44px;               /* 52px → 44px */
  height: 44px;
}

/* Quick actions — 2 columns */
.quick-actions-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

/* Scroll button */
.scroll-to-bottom-btn {
  bottom: 120px;             /* 140px → 120px */
  right: 16px;               /* 32px → 16px */
  width: 40px;               /* 44px → 40px */
  height: 40px;
}

/* Math keyboard — tighter */
.math-keyboard {
  max-height: 110px;         /* 130px → 110px */
  padding: 8px;
}

.math-sym-btn {
  min-width: 34px;           /* 38px → 34px */
  height: 30px;              /* 34px → 30px */
  font-size: 13px;
}
```

**Design Intent**: 
- **Reduce padding**: More space for messages
- **Smaller avatars**: 36px still recognizable
- **44px touch targets**: Meets accessibility guidelines
- **2-column quick actions**: Fits better on narrow screens
- **Compact math keyboard**: Doesn't take too much space

---

## 3. Language Learning Dashboard

### Mobile (≤767px)

```css
/* Header: stack vertically */
.language-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.language-selector {
  width: 100%;               /* Full-width dropdown */
}

/* Stages: horizontal scroll */
.learning-stages {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  gap: 8px;
}

.stage-card {
  flex: 0 0 auto;            /* Don't shrink, scroll instead */
  min-width: 140px;
  scroll-snap-align: start;
}

/* Modules: single column */
.modules-grid {
  grid-template-columns: 1fr;
  gap: 12px;
}

.module-card {
  flex-direction: row;       /* Icon left, content right */
  align-items: flex-start;
  gap: 12px;
}

.module-icon {
  width: 44px;               /* 56px → 44px */
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
```

**Design Intent**: 
- **Stack header**: Title above selector
- **Horizontal scroll stages**: Keep horizontal (familiar pattern)
- **Scroll snap**: Smooth scrolling between stages
- **Single-column modules**: Full-width cards
- **Icon left**: More compact layout
- **2×2 stats grid**: Fits better than 4 columns

**Why horizontal scroll stages?**: 
- Familiar pattern (Instagram stories, app store)
- Shows progression left-to-right
- Doesn't take vertical space

---

## 4. Language Lesson

### Mobile (≤767px)

```css
/* Header: wrap and reorder */
.lesson-header {
  flex-wrap: wrap;
  gap: 10px;
}

.lesson-header h2 {
  flex: 1;
  text-align: center;
}

/* Progress steps: move below title */
.progress-steps {
  gap: 4px;
  width: 100%;
  justify-content: center;
  order: 3;                  /* Move to bottom */
}

.progress-step {
  width: 28px;               /* 32px → 28px */
  height: 28px;
  font-size: 0.7rem;
}

/* Content */
.lesson-content {
  padding: 1rem;             /* 2rem → 1rem */
}

/* Examples: keep horizontal */
.example-card {
  flex-direction: row;
  gap: 8px;
}

.example-number {
  width: 20px;               /* 24px → 20px */
  height: 20px;
  font-size: 0.65rem;
}

/* Mastery options: larger touch target */
.option-btn {
  padding: 0.85rem 1rem;     /* Increased for touch */
}

/* Results */
.score-value {
  font-size: 2.5rem;         /* 3rem → 2.5rem */
}
```

**Design Intent**: 
- **Wrap header**: Back button, title, progress steps stack
- **Smaller progress circles**: 28px still tappable
- **Reduce padding**: More content visible
- **Larger option buttons**: Easier to tap
- **Slightly smaller score**: Still prominent

---

## 5. Language Practice

### Mobile (≤767px)

```css
.practice-modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.practice-mode-card {
  padding: 12px;
}

/* Audio controls: stack vertically */
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
```

**Design Intent**: 
- **2-column grid**: Practice types side-by-side
- **Stack audio controls**: Full-width buttons easier to tap

### Small Phones (≤479px)

```css
.practice-modes {
  grid-template-columns: 1fr;  /* Single column */
}

.practice-mode-card {
  flex-direction: row;         /* Icon left, text right */
  align-items: center;
  gap: 12px;
}
```

**Design Intent**: 
- **Single column**: On very small screens
- **Horizontal layout**: Icon + text side-by-side

---

## 6. Flashcard

### Mobile (≤767px)

```css
.inline-flashcard-face {
  padding: 1rem 1.125rem;
  min-height: 140px;           /* 160px → 140px */
}

/* Confidence buttons: stacked */
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
  min-height: 44px;            /* Touch target */
}
```

**Design Intent**: 
- **Slightly shorter cards**: 140px still readable
- **Stack confidence buttons**: Full-width, easier to tap
- **44px minimum**: Meets touch target guidelines

---

## 7. Inline Quiz

### Mobile (≤767px)

```css
.iq-option {
  padding: 0.75rem 0.875rem;  /* Larger touch target */
}

/* Disable hover slide on mobile */
.iq-option:not(:disabled):hover {
  transform: none;
}

.iq-option:not(:disabled):active {
  transform: translateX(3px);  /* Active (tap) instead */
}

.iq-option-label {
  width: 1.5rem;               /* 1.6rem → 1.5rem */
  height: 1.5rem;
}
```

**Design Intent**: 
- **Larger padding**: Easier to tap
- **No hover effects**: Touch devices don't have hover
- **Active state**: Slide on tap (not hover)

---

## 8. Message Formatter

### Mobile (≤767px)

```css
.formatted-message {
  font-size: 0.9375rem;
  line-height: 1.65;
}

.formatted-message h1 {
  font-size: 1.125rem;         /* Smaller headings */
}

/* Prevent code overflow */
.formatted-message pre {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
}
```

**Design Intent**: 
- **Slightly smaller text**: Fits better
- **Scrollable code blocks**: Prevents horizontal overflow
- **Smooth scrolling**: -webkit-overflow-scrolling: touch

---

## 9. Audio Lecture Viewer

### Mobile (≤767px)

```css
/* Tab switcher (hidden on desktop) */
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

/* Hide resize handle */
.alv-resize-handle {
  display: none !important;
}

/* Each panel full width, only active shown */
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
```

**Design Intent**: 
- **Tab switcher**: "Notes" / "Chat" tabs at top
- **Stack panels**: One visible at a time
- **No resize handle**: Not needed on mobile
- **Full-width panels**: Maximize space

### Landscape Phone

```css
@media (max-width: 767px) and (orientation: landscape) {
  /* Show both panels in landscape */
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

**Design Intent**: 
- **Landscape = desktop layout**: More horizontal space
- **Split-screen**: Both panels visible
- **Resize handle**: Allow adjusting split

---

## 10. PDF Viewer

### Mobile (≤767px)

```css
/* Move toolbar to BOTTOM (thumb-friendly) */
.pdf-viewer-toolbar {
  order: 10;                   /* Push after content */
  border-bottom: none;
  border-top: 1px solid var(--border);
}

/* Reorder flex items */
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
```

**Design Intent**: 
- **Bottom toolbar**: Easier to reach with thumb
- **Bottom sheets**: Sidebars slide up from bottom (iOS pattern)
- **Handle bar**: Visual indicator for dragging
- **60vh height**: Doesn't cover entire screen

**Why bottom toolbar?**: 
- Thumb zone: Bottom 1/3 of screen is easiest to reach
- Common pattern: iOS Safari, Chrome mobile
- Page navigation most frequent action

---

## 11. File Prompt Input

### Mobile (≤767px)

```css
/* Stack actions: button above hints */
.prompt-actions {
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
}

.prompt-hints {
  text-align: center;
  order: 2;                    /* Hints below button */
}

.send-btn {
  width: 100%;
  justify-content: center;
  min-height: 44px;
  order: 1;
}
```

**Design Intent**: 
- **Full-width button**: Easier to tap
- **Button first**: Primary action more prominent
- **Centered hints**: Balanced layout

---

## 12. Global Utility

### Touch Interaction Fixes

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

**Design Intent**: 
- **No hover effects**: Touch devices don't have hover
- **Active states**: Tap feedback instead
- **Prevents sticky hover**: Common mobile bug

### Overflow Prevention

```css
@media (max-width: 767px) {
  * {
    -webkit-tap-highlight-color: transparent;
  }

  html, body {
    overflow-x: hidden;
    max-width: 100vw;
  }

  img, video, iframe {
    max-width: 100%;
    height: auto;
  }

  .message-bubble,
  .formatted-message {
    word-break: break-word;
    overflow-wrap: break-word;
  }

  /* Minimum touch targets */
  button, [role="button"], input[type="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

**Design Intent**: 
- **No tap flash**: Remove blue highlight on tap
- **No horizontal scroll**: Prevent accidental sideways scroll
- **Responsive media**: Images/videos scale down
- **Word breaking**: Long words don't overflow
- **44px touch targets**: Accessibility guideline

### Safe Area (Notch/Home Bar)

```css
@supports (padding: max(0px)) {
  @media (max-width: 767px) {
    .chat-input-area {
      padding-bottom: max(8px, env(safe-area-inset-bottom));
    }

    .pdf-viewer-toolbar {
      padding-bottom: max(8px, env(safe-area-inset-bottom));
    }
  }
}
```

**Design Intent**: 
- **Safe area insets**: Avoid notch and home bar
- **Progressive enhancement**: Only on supported devices
- **Bottom padding**: Ensures buttons aren't hidden

---

## 13. Scrollbar Styling

### Tablet/Mobile (≤1125px)

```css
::-webkit-scrollbar {
  width: 4px;                  /* 6px → 4px */
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}
```

**Design Intent**: 
- **Thinner scrollbars**: Less intrusive on small screens
- **Transparent track**: Cleaner look
- **Subtle thumb**: Only visible when scrolling

---

## Summary

### Key Mobile Adaptations

1. **Typography**: 18px → 16px (tablet) → 15px (mobile) → 14px (small)
2. **Touch targets**: 44px minimum (accessibility)
3. **No hover effects**: Use :active instead
4. **Bottom toolbars**: Thumb-friendly positioning
5. **Bottom sheets**: Sidebars slide from bottom (not right)
6. **Tab switchers**: Replace split-panes on mobile
7. **Single columns**: Stack layouts vertically
8. **Horizontal scroll**: Keep stages horizontal (familiar pattern)
9. **Safe area insets**: Avoid notch/home bar
10. **Overflow prevention**: No horizontal scroll, word breaking

### Breakpoint Strategy

| Screen | Width | Font | h1 | Strategy |
|--------|-------|------|-----|----------|
| Desktop | 1126px+ | 18px | 56px | Baseline (no overrides) |
| Tablet | 768-1125px | 16px | 36px | Remove borders, reduce sizes |
| Mobile | 480-767px | 15px | 28px | Stack layouts, bottom UI |
| Small | <480px | 14px | 24px | Single columns, compact |

### Mobile-First Principles

1. **Touch-first**: 44px minimum, no hover
2. **Thumb zone**: Bottom 1/3 easiest to reach
3. **One-handed**: Bottom nav, bottom toolbars
4. **Vertical scroll**: Natural mobile pattern
5. **Progressive disclosure**: Tabs, bottom sheets
6. **Performance**: Thinner scrollbars, disabled animations

### Landscape Handling

- **Audio viewer**: Show both panels (split-screen)
- **Stats**: Keep horizontal layout
- **Progress steps**: Keep horizontal
- **Reduced padding**: Maximize vertical space

### Technical Notes

- **@media (hover: none)**: Detects touch devices
- **scroll-snap-type**: Smooth scrolling between items
- **-webkit-overflow-scrolling: touch**: Momentum scrolling
- **env(safe-area-inset-bottom)**: Notch/home bar spacing
- **order**: Reorder flex items (toolbar to bottom)
- **::before**: Create handle bars for bottom sheets
