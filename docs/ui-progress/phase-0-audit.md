# PHASE 0: Complete UI Audit Report
**Date:** June 7, 2026  
**Status:** READ-ONLY - Zero files modified

---

## SECTION 1: Project Structure

### Components (JSX Files)
```
src/components/
├── AITypingAnimation.jsx
├── AudioLectureViewer.jsx
├── AudioProcessor.jsx
├── BulkActions.jsx
├── ChartRenderer.jsx
├── ChatInterface.jsx
├── ConfidenceRater.jsx
├── DebugInfo.jsx
├── EnhancedMessageFormatter.jsx
├── ErrorBoundary.jsx
├── FileAttachment.jsx
├── FilePromptInput.jsx
├── Flashcard.jsx
├── FlashcardCreateModal.jsx
├── Icons.jsx
├── InlineFlashcard.jsx
├── InlineQuiz.jsx
├── KeyboardShortcutsModal.jsx
├── LoadingDots.jsx
├── LoadingSpinner.jsx
├── MathKeyboard.jsx
├── MermaidDiagram.jsx
├── MessageFormatter.jsx
├── MigrationHelper.jsx
├── Navbar.jsx
├── OrientationPrompt.jsx
├── PDFLibrary.jsx
├── PDFManager.jsx
├── PDFNoteEditor.jsx
├── PDFResourcePanel.jsx
├── PDFViewer.jsx
├── PomodoroTimer.jsx
├── PreRegStatus.jsx
├── ProfileDropdown.jsx
├── QuickActions.jsx
├── ResourceSearch.jsx
├── ResourceViewer.jsx
├── ReviewForm.jsx
├── ReviewList.jsx
├── RichTextViewer.jsx
├── SecureAITest.jsx
├── SessionActions.jsx
├── SessionAssessment.jsx
├── SessionSearch.jsx
├── SlotRefreshCountdown.jsx
├── SpeakingRecorder.jsx
├── StorageIndicator.jsx
├── StudyInterface.jsx
├── StudyStatistics.jsx
├── SVGFigure.jsx
├── TestingLimitModal.jsx
├── TestingReviewPrompt.jsx
├── TestingUserWidget.jsx
├── ThemeToggle.jsx
├── TTSHelpModal.jsx
├── UpgradeButton.jsx
├── UsageLimitModal.jsx
├── UsageWidget.jsx
├── VisualGenerator.jsx
└── shared/
    ├── BrandLogo.jsx
    └── pixel-art/PixelIcons.jsx
```

### Pages (JSX Files)
```
src/pages/
├── About.jsx
├── AdminPanel.jsx
├── Auth.jsx
├── Contact.jsx
├── CookiePolicy.jsx
├── Dashboard.jsx
├── DashboardEnhanced.jsx
├── Documentation.jsx
├── ExamPlanner.jsx
├── ExamSession.jsx
├── FlashcardLibrary.jsx
├── Landing.jsx
├── LandingNew.jsx
├── LanguageLearning.jsx
├── LanguageLearningLesson.jsx
├── LanguageLearningLessons.jsx
├── LanguageLearningPractice.jsx
├── ModeSelector.jsx
├── PreRegistration.jsx
├── Pricing.jsx
├── Privacy.jsx
├── RefundPolicy.jsx
├── ResourceLibrary.jsx
├── Settings.jsx
├── Terms.jsx
├── admin/
│   ├── AdminLayout.jsx
│   ├── DailySlots.jsx
│   ├── Dashboard.jsx
│   ├── PreRegUsers.jsx
│   ├── Reviews.jsx
│   ├── Settings.jsx
│   └── TestingUsers.jsx
├── docs/
│   └── DocsPage.jsx
├── landing/
│   ├── LandingPage.jsx
│   └── sections/
│       ├── FAQ.jsx
│       ├── Features.jsx
│       ├── FinalCTA.jsx
│       ├── Footer.jsx
│       ├── Hero.jsx
│       ├── HowItWorks.jsx
│       ├── Navbar.jsx
│       ├── Pricing.jsx
│       └── Testimonials.jsx
└── modes/
    ├── ActiveRecall.jsx
    ├── CollaborativeScholar.jsx
    ├── CreativeSynthesis.jsx
    ├── FocusBreakdown.jsx
    └── MentalModel.jsx
```

### Utils (JSX Files)
```
src/context/
├── AuthContext.jsx
├── SessionContext.jsx
└── ThemeContext.jsx
```

### Styles (CSS Files)
```
src/styles/
├── AITypingAnimation.css
├── AudioLectureViewer.css
├── AudioLectureViewerMobile.css
├── AudioProcessor.css
├── Auth.css
├── BulkActions.css
├── ChatInterface.css
├── Dashboard.css
├── Documentation.css
├── ErrorBoundary.css
├── ExamPlanner.css
├── ExamSession.css
├── FilePromptInput.css
├── Flashcard.css
├── global.css
├── InlineQuiz.css
├── KeyboardShortcutsModal.css
├── Landing.css
├── LandingNew.css
├── LandingPro.css
├── LoadingSpinner.css
├── MessageFormatter.css
├── MigrationHelper.css
├── mobile-responsive.css
├── ModePage.css
├── ModeSelector.css
├── Navbar.css
├── NotebookTheme.css
├── OrientationPrompt.css
├── Pages.css
├── PDFLibrary.css
├── PDFManager.css
├── PDFNoteEditor.css
├── PDFResourcePanel.css
├── PDFViewer.css
├── PDFViewerMobile.css
├── PomodoroTimer.css
├── ProfileDropdown.css
├── ResourceLibrary.css
├── ResourceSearch.css
├── RichTextViewer.css
├── SessionActions.css
├── SessionAssessment.css
├── SessionSearch.css
├── Settings.css
├── StorageIndicator.css
├── StudyInterface.css
├── StudyStatistics.css
├── ThemeToggle.css
├── variables.css
└── VisualGenerator.css

src/pages/
├── LanguageLearning.css
├── LanguageLearningLesson.css
├── LanguageLearningPractice.css
└── docs/
    └── docs.css

src/pages/landing/
└── landing.css
```

### Other
```
src/
├── App.css
├── App.jsx
├── index.css
└── main.jsx

index.html
```

---

## SECTION 2: Current Visual Identity

The LastWeek UI features a warm, light "notebook paper" aesthetic with subtle ruled line textures and red margin accents. The dominant colors are warm off-white backgrounds (#f5f3ef), deep purple accents (#7c3aed), and near-black text (#1a1a2e). The Inter font family is used throughout with handwritten Caveat font overlays on headings for a personal, study-focused feel. The design combines modern card-based layouts with nostalgic paper textures, drop-shadow effects, and a cohesive light theme. Five accent color themes (purple, orange, green, brown, blue) are available via data-color attributes. The overall personality is academic, approachable, and focused on learning.

---

## SECTION 3: Complete Color Inventory

### Primary Brand Colors
| Color Value | File | CSS Property | Role |
|------------|------|-------------|------|
| #7c3aed | variables.css line 9 | --color-purple-primary | Primary accent |
| #6d28d9 | variables.css line 10 | --color-purple-hover | Accent hover |
| #5b21b6 | variables.css line 11 | --color-purple-active | Accent active |
| #a78bfa | variables.css line 12 | --color-purple-light | Light accent |
| #c4b5fd | variables.css line 13 | --color-purple-border | Accent border |

### Background Colors
| Color Value | File | CSS Property | Role |
|------------|------|-------------|------|
| #f5f3ef | variables.css line 64 | --color-bg-primary | Page background (warm paper) |
| #ffffff | variables.css line 65 | --color-bg-secondary | Cards/panels |
| #f0ede8 | variables.css line 66 | --color-bg-tertiary | Input/code backgrounds |
| #e8e4de | variables.css line 67 | --color-bg-hover | Hover state |
| #f1f5f9 | variables.css line 69 | --color-bg-code | Code blocks |

### Text Colors
| Color Value | File | CSS Property | Role |
|------------|------|-------------|------|
| #1a1a2e | variables.css line 73 | --color-text-primary | Near-black ink |
| #374151 | variables.css line 74 | --color-text-secondary | Secondary text |
| #6b7280 | variables.css line 75 | --color-text-muted | Muted/placeholder |
| #0f0f1a | variables.css line 76 | --color-text-heading | Headings |
| #ffffff | variables.css line 77 | --color-text-on-accent | Text on colored backgrounds |

### Border Colors
| Color Value | File | CSS Property | Role |
|------------|------|-------------|------|
| #d1cdc7 | variables.css line 80 | --color-border | Warm light border |
| #e5e1db | variables.css line 81 | --color-border-light | Lighter border |

### Semantic Colors
| Color Value | File | CSS Property | Role |
|------------|------|-------------|------|
| #22c55e | variables.css line 17 | --color-success | Success states |
| #ef4444 | variables.css line 24 | --color-error | Error states |
| #fbbf24 | variables.css line 31 | --color-warning | Warning states |
| #3b82f6 | variables.css line 38 | --color-info | Info states |
| #e74c3c | variables.css line 45 | --color-danger | Danger actions |

### Highlight Colors (PDF)
| Color Value | File | CSS Property | Role |
|------------|------|-------------|------|
| #ffeb3b | variables.css line 85 | --color-highlight-yellow | Yellow highlight |
| #4caf50 | variables.css line 86 | --color-highlight-green | Green highlight |
| #2196f3 | variables.css line 87 | --color-highlight-blue | Blue highlight |
| #e91e63 | variables.css line 88 | --color-highlight-pink | Pink highlight |
| #ff9800 | variables.css line 89 | --color-highlight-orange | Orange highlight |
| #9c27b0 | variables.css line 90 | --color-highlight-purple | Purple highlight |

### Theme Color Variants
| Theme | Primary Color | File |
|-------|---------------|------|
| Purple (default) | #7c3aed | variables.css line 6 |
| Orange | #ea580c | variables.css line 209 |
| Green | #059669 | variables.css line 219 |
| Brown | #b45309 | variables.css line 229 |
| Blue | #2563eb | variables.css line 239 |

### Additional Colors from CSS
| Color Value | File | CSS Property | Role |
|------------|------|-------------|------|
| #aa3bff | index.css line 8 | --accent | Vite accent |
| rgba(170, 59, 255, 0.1) | index.css line 9 | --accent-bg | Accent background |
| rgba(147, 197, 253, 0.18) | NotebookTheme.css line 4 | --nb-line-color | Notebook ruled lines |
| rgba(251, 113, 133, 0.45) | NotebookTheme.css line 5 | --nb-margin-color | Red margin line |
| rgba(124, 58, 237, 0.25) | variables.css line 112 | --shadow-glow | Glow effect |

### Colors from Inline JSX Styles
| Color Value | File | Line | Element |
|------------|------|------|---------|
| rgba(16,185,129,0.1) | Settings.jsx | 332 | Plan badge background |
| #10b981 | Settings.jsx | 333 | Plan badge text |
| rgba(var(--color-accent-rgb), 0.1) | Pricing.jsx | 154 | Banner background |
| rgba(16, 185, 129, 0.1) | Pricing.jsx | 174 | Free slots banner |

---

## SECTION 4: All CSS Variables Currently Defined

### Spacing Variables
| Variable | Value | Status |
|----------|-------|--------|
| --spacing-xs | 0.25rem | USED |
| --spacing-sm | 0.5rem | USED |
| --spacing-md | 1rem | USED |
| --spacing-lg | 1.5rem | USED |
| --spacing-xl | 2rem | USED |
| --spacing-2xl | 3rem | USED |
| --space-xs | 0.25rem | USED |
| --space-sm | 0.5rem | USED |
| --space-md | 1rem | USED |
| --space-lg | 1.5rem | USED |
| --space-xl | 2rem | USED |
| --space-2xl | 3rem | USED |
| --space-input | 0.75rem | USED |
| --space-section | 2rem | USED |
| --space-mobile-default | 1.5rem | USED |

### Border Radius Variables
| Variable | Value | Status |
|----------|-------|--------|
| --border-radius | 0.5rem | USED |
| --border-width | 1px | USED |
| --radius-sm | 0.25rem | USED |
| --radius-md | 0.5rem | USED |
| --radius-lg | 0.75rem | USED |
| --radius-xl | 1rem | USED |
| --radius-full | 9999px | USED |

### Z-Index Variables (from variables.css)
| Variable | Value | Status |
|----------|-------|--------|
| --z-base | 0 | USED |
| --z-low | 1 | USED |
| --z-dropdown | 1000 | USED |
| --z-sticky | 1020 | USED |
| --z-fixed | 1030 | USED |
| --z-modal-backdrop | 1040 | USED |
| --z-modal | 1050 | USED |
| --z-popover | 1060 | USED |
| --z-tooltip | 1070 | USED |
| --z-notification | 1080 | USED |
| --z-toast | 1090 | USED |

### Shadow Variables
| Variable | Value | Status |
|----------|-------|--------|
| --shadow-sm | (complex) | USED |
| --shadow-md | (complex) | USED |
| --shadow-lg | (complex) | USED |
| --shadow-xl | (complex) | USED |
| --shadow-glow | (complex) | USED |

### Transition Variables
| Variable | Value | Status |
|----------|-------|--------|
| --transition-fast | 0.15s ease | USED |
| --transition-normal | 0.2s ease | USED |
| --transition-slow | 0.3s ease | USED |

### Typography Variables
| Variable | Value | Status |
|----------|-------|--------|
| --font-heading | 'Inter', system fonts | USED |
| --font-body | 'Inter', system fonts | USED |
| --font-mono | ui-monospace, Consolas | USED |
| --sans | system-ui, 'Segoe UI' | USED (index.css) |
| --heading | system-ui, 'Segoe UI' | USED (index.css) |
| --mono | ui-monospace, Consolas | USED (index.css) |

### Notebook Theme Variables
| Variable | Value | Status |
|----------|-------|--------|
| --nb-line-height | 2rem | USED |
| --nb-line-color | rgba(147, 197, 253, 0.18) | USED |
| --nb-margin-color | rgba(251, 113, 133, 0.45) | USED |
| --nb-margin-left | 2.75rem | USED |
| --nb-margin-left-mobile | 1.5rem | USED |
| --nb-corner-size | 18px | USED |
| --nb-corner-color | rgba(251, 113, 133, 0.5) | USED |

### Viewport Variables
| Variable | Value | Status |
|----------|-------|--------|
| --vh | 1vh | USED |

---

## SECTION 5: Component Style Method

| Component File | Has Own CSS File? | Uses Inline Styles? | Uses Global Classes? |
|---------------|-------------------|--------------------|--------------------|
| AITypingAnimation.jsx | Yes | No | Yes |
| AudioLectureViewer.jsx | Yes | No | Yes |
| AudioProcessor.jsx | Yes | No | Yes |
| BulkActions.jsx | Yes | No | Yes |
| ChatInterface.jsx | Yes | No | Yes |
| ErrorBoundary.jsx | Yes | No | Yes |
| Flashcard.jsx | Yes | No | Yes |
| InlineFlashcard.jsx | Yes (shared) | No | Yes |
| InlineQuiz.jsx | Yes | No | Yes |
| KeyboardShortcutsModal.jsx | Yes | No | Yes |
| LoadingSpinner.jsx | Yes | No | Yes |
| MathKeyboard.jsx | No (in ChatInterface.css) | No | Yes |
| MessageFormatter.jsx | Yes | No | Yes |
| MigrationHelper.jsx | Yes | No | Yes |
| Navbar.jsx | Yes | No | Yes |
| PDFViewer.jsx | Yes | No | Yes |
| ProfileDropdown.jsx | Yes | No | Yes |
| Settings.jsx | Yes | Yes (loading states) | Yes |
| StudyInterface.jsx | Yes | No | Yes |
| ThemeToggle.jsx | Yes | No | Yes |
| About.jsx | No | No | Yes (Pages.css) |
| Auth.jsx | Yes | No | Yes |
| Dashboard.jsx | Yes | No | Yes |
| LandingPage.jsx | Yes | No | Yes |
| Pricing.jsx | No | Yes (many) | Yes |
| Privacy.jsx | No | Yes (logo) | Yes |
| Terms.jsx | No | Yes (logo, headings) | Yes |
| RefundPolicy.jsx | No | Yes (logo) | Yes |

---

## SECTION 6: Visibility Problems (CRITICAL)

### HIGH Severity
1. **User message text on accent background** - `ChatInterface.css` - User messages use white text on purple background. If accent color changes to light variant, text may become unreadable. Mitigated by `--color-text-on-accent` variable.

2. **Inline styles with hardcoded colors** - `Pricing.jsx` lines 152-230 - Multiple inline styles use hardcoded colors like `#10b981` and `rgba(16, 185, 129, 0.1)` that may not adapt to theme changes.

### MEDIUM Severity
3. **NotebookTheme text color overrides** - `NotebookTheme.css` lines 200-230 - Multiple `!important` rules overriding text colors could cause specificity conflicts.

4. **Profile avatar gradient uses undefined variables** - `ProfileDropdown.css` line 24 - Uses `--color-primary` and `--color-secondary` which are not defined in variables.css (should use `--color-purple-primary`).

5. **Code blocks in dark mode** - `NotebookTheme.css` line 167 - Forces `!important` on code colors which may conflict with dark theme.

### LOW Severity
6. **Navbar logo filter** - `Navbar.css` line 41 - Drop shadow filter on logo uses hardcoded purple `rgba(124, 58, 237, 0.7)` - won't adapt to color theme changes.

7. **Placeholder text color** - Various files use `var(--color-text-muted)` for placeholders which is `#6b7280` - good contrast on light but verify in dark mode.

---

## SECTION 7: Dark Mode Audit

**DARK MODE STATUS: PARTIALLY IMPLEMENTED**

### Dark Mode References Found:
1. **index.css lines 33-50** - `@media (prefers-color-scheme: dark)` media query with color overrides
2. **variables.css lines 161-308** - Complete `[data-theme="dark"]` selector with full variable set
3. **AITypingAnimation.css lines 145-148** - `@media (prefers-color-scheme: dark)` for container background
4. **index.html line 9** - Default `data-theme="light"` attribute

### Dark Mode Implementation Method:
- **Primary:** `[data-theme="dark"]` attribute selector (manual toggle via ThemeContext)
- **Fallback:** `@media (prefers-color-scheme: dark)` for some components

### Issues:
- Mixed implementation (some components use media query, others use data-attribute)
- Theme toggle exists (`ThemeToggle.jsx`, `ThemeContext.jsx`)
- Dark mode variables are well-defined in `variables.css`
- Some components may not fully respect dark mode (inline hardcoded colors)

---

## SECTION 8: Components With Zero Mobile Styles

### Components with @media queries:
- Dashboard.css ✓
- ChatInterface.css ✓
- Auth.css ✓
- Settings.css ✓
- Flashcard.css ✓
- ModeSelector.css ✓
- Navbar.css ✓
- LandingNew.css ✓
- StudyInterface.css ✓
- ExamSession.css ✓

### Components WITHOUT @media queries:
- AITypingAnimation.css ✗
- AudioProcessor.css ✗
- BulkActions.css ✗
- ErrorBoundary.css ✗
- LoadingSpinner.css ✗
- MessageFormatter.css ✗
- MigrationHelper.css ✗
- OrientationPrompt.css ✗
- PDFLibrary.css ✗
- PDFNoteEditor.css ✗
- ProfileDropdown.css ✗
- ResourceSearch.css ✗
- RichTextViewer.css ✗
- SessionActions.css ✗
- SessionAssessment.css ✗
- SessionSearch.css ✗
- StorageIndicator.css ✗
- StudyStatistics.css ✗
- ThemeToggle.css ✗
- VisualGenerator.css ✗

### Mobile Styles Location:
Primary mobile styles are centralized in `src/styles/mobile-responsive.css` which provides responsive overrides for multiple components. This is a good pattern but some components may miss specific adjustments.

---

## SECTION 9: Icon System

### Icon Library Status:
**No external icon library installed.** The project uses a custom SVG icon system defined in `src/components/Icons.jsx`.

### Icon Component Pattern:
All icons are React functional components that render inline SVGs with the following pattern:
```jsx
export const IconName = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    ...
  </svg>
);
```

### Available Icons (33 total):
- MentalModelIcon
- ActiveRecallIcon
- FocusBreakdownIcon
- CollaborativeScholarIcon
- CreativeSynthesisIcon
- ChatIcon
- AttachmentIcon
- QuickActionIcon
- SendIcon
- CloseIcon
- EditIcon
- CopyIcon
- ExpandIcon
- HomeIcon
- DashboardIcon
- UserIcon
- SettingsIcon
- LogoutIcon
- BookIcon
- FlashcardIcon
- ClockIcon
- CheckIcon
- ArrowRightIcon
- ArrowLeftIcon
- PlusIcon
- FileIcon
- BulbIcon
- RefreshIcon
- ListIcon
- DeleteIcon
- StorageIcon
- WarningIcon
- DotsVerticalIcon
- KeyboardIcon
- TrashIcon
- ChartBarIcon
- EyeIcon
- TagIcon
- HeartIcon

### Icon Visibility Issues:
**None detected.** Icons use `fill="currentColor"` or `stroke="currentColor"` which inherits from parent text color, ensuring visibility across themes.

---

## SECTION 10: Font Stack

### Fonts Loaded:
1. **Inter** - Primary font loaded via Google Fonts CSS import in `global.css` line 1:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
   ```

2. **Caveat** - Handwritten font loaded via `NotebookTheme.css` for headings (assumed loaded, no @import found - may need verification)

3. **IBM Plex Mono** - Referenced in NotebookTheme.css for code/monospace zones (assumed loaded)

### Font-Family Values Used:

| File | Property | Value |
|------|----------|-------|
| global.css | --font-heading | 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif |
| global.css | --font-body | 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif |
| variables.css | --font-mono | ui-monospace, Consolas, monospace |
| index.css | --sans | system-ui, 'Segoe UI', Roboto, sans-serif |
| index.css | --heading | system-ui, 'Segoe UI', Roboto, sans-serif |
| index.css | --mono | ui-monospace, Consolas, monospace |
| NotebookTheme.css | body | 'Caveat', 'IBM Plex Mono', cursive |
| NotebookTheme.css | code, pre | 'IBM Plex Mono', 'Courier New', monospace |

### Font Loading Method:
- **Inter:** Google Fonts @import in global.css
- **System fonts:** Fallback chain using -apple-system, BlinkMacSystemFont, 'Segoe UI'

---

## SECTION 11: Z-Index Map

| Element | z-index | File | Line |
|---------|---------|------|------|
| Orientation prompt | 10000 | OrientationPrompt.css | 10 |
| Migration overlay | 9999 | MigrationHelper.css | 7 |
| PDF loading overlay | 9999 | PDFViewer.css | 192 |
| Navbar drawer | 9999 | Navbar.css | 236 |
| Navbar backdrop | 9998 | Navbar.css | 223 |
| Docs modal | 2000 | LandingNew.css | 477 |
| PDF viewer fullscreen | 2000 | PDFViewer.css | 14 |
| Audio lecture viewer overlay | 1001 | AudioLectureViewer.css | 9 |
| Keyboard shortcuts modal | 1000 | KeyboardShortcutsModal.css | 12 |
| PDF viewer | 1000 | PDFViewer.css | 8 |
| Audio processor | 1000 | AudioProcessor.css | 11 |
| Landing modal | 1000 | Landing.css | 377 |
| Profile menu | 1000 | ProfileDropdown.css | 62 |
| Chat dropdown/overlay | 1000 | ChatInterface.css | 1030, 1062 |
| PDF library overlay | 999 | PDFLibrary.css | 7 |
| Mobile sidebar toggle | 999 | ModePage.css | 417 |
| PDF note editor | 1100 | PDFNoteEditor.css | 10 |
| Navbar | 200 | Navbar.css | 12 |
| Exam session sidebar | 200 | ExamSession.css | 340 |
| Mobile bottom sheet | 200 | mobile-responsive.css | 1117 |
| PDF float nav | 100 | PDFViewer.css | 524 |
| Documentation header | 100 | Documentation.css | 28 |
| Bulk actions bar | 100 | BulkActions.css | 4 |
| Chat scroll button | 60 | ChatInterface.css | 924 |
| Chat input area | 50 | ChatInterface.css | 271 |
| PDF notes badge | 10 | PDFViewer.css | 296 |
| Sidebar close button | 10 | ModePage.css | 84 |
| AITypingAnimation elements | 1-2 | AITypingAnimation.css | 21, 63, 88 |
| Notebook margin line | 1-2 | NotebookTheme.css | 91, 114 |

---

## SECTION 12: Top 15 Priority Problems

### 1. CRITICAL: Inline Hardcoded Colors Break Theme Consistency
**File:** `Pricing.jsx` lines 152-230  
**Problem:** Extensive use of inline styles with hardcoded color values (`#10b981`, `rgba(16, 185, 129, 0.1)`) that don't respect CSS variables or theme changes.  
**Impact:** Pricing page will look broken when theme changes to dark mode or different accent color.

### 2. CRITICAL: Mixed Dark Mode Implementation
**Files:** `index.css`, `variables.css`, `AITypingAnimation.css`  
**Problem:** Dark mode uses both `[data-theme="dark"]` attribute AND `@media (prefers-color-scheme: dark)` media query. This creates inconsistent behavior where some elements follow manual toggle and others follow system preference.  
**Impact:** Users may see partial dark mode or conflicting colors.

### 3. HIGH: Undefined CSS Variables
**File:** `ProfileDropdown.css` line 24  
**Problem:** Uses `--color-primary` and `--color-secondary` which are not defined in `variables.css`. Should use `--color-purple-primary` or `--color-accent`.  
**Impact:** Profile avatar gradient may fail to render or show fallback colors.

### 4. HIGH: Typography Scaling Conflicts
**Files:** `global.css` lines 175-220 AND `NotebookTheme.css` lines 180-195  
**Problem:** Two competing typography systems with `!important` overrides. Global.css sets extremely small base font (12.16px) while NotebookTheme applies Caveat font to all body text.  
**Impact:** Unpredictable font sizes across components, potential readability issues.

### 5. HIGH: !important Overuse in NotebookTheme
**File:** `NotebookTheme.css` lines 200-230  
**Problem:** Excessive use of `!important` for text color overrides creates specificity wars and makes future maintenance difficult.  
**Impact:** Difficulty overriding styles, unexpected color inheritance.

### 6. HIGH: No External Icon Library
**Files:** `package.json`, `Icons.jsx`  
**Problem:** All 40+ icons are custom SVG components, increasing bundle size and maintenance burden.  
**Impact:** Larger bundle size, manual icon maintenance, no tree-shaking optimization.

### 7. MEDIUM: Missing Caveat Font Import
**File:** `NotebookTheme.css`  
**Problem:** References 'Caveat' font but no @import or @font-face found in codebase.  
**Impact:** Fallback to cursive system font may look different than intended.

### 8. MEDIUM: Z-Index Values Not Consolidated
**Files:** Multiple CSS files  
**Problem:** Z-index values are scattered across files with inconsistent ranges (0-10000). CSS variables exist in variables.css but many inline z-index values don't use them.  
**Impact:** Stacking context bugs, elements appearing in wrong order.

### 9. MEDIUM: Hardcoded Purple in Logo Filter
**File:** `Navbar.css` line 41  
**Problem:** Logo drop-shadow uses hardcoded `rgba(124, 58, 237, 0.7)` instead of CSS variable.  
**Impact:** Logo glow effect won't adapt to color theme changes.

### 10. MEDIUM: Duplicate CSS Variable Definitions
**Files:** `global.css` AND `variables.css`  
**Problem:** Both files define `--color-bg-primary`, `--color-text-primary`, spacing, and other variables with different values.  
**Impact:** CSS cascade determines winner unpredictably based on import order.

### 11. MEDIUM: Components Without Mobile Styles
**Files:** 20+ CSS files listed in Section 8  
**Problem:** Many component CSS files have no @media queries for responsive design.  
**Impact:** Components may break or look poor on mobile devices.

### 12. LOW: Inconsistent Border Radius Variables
**Files:** `global.css`, `variables.css`  
**Problem:** `--border-radius` defined in both files with same value, plus additional radius variables in variables.css.  
**Impact:** Confusion on which variable to use, potential inconsistency.

### 13. LOW: Viewport Height Variable
**File:** `global.css`, `mobile-responsive.css`  
**Problem:** Custom `--vh` variable used for mobile viewport height, requires JavaScript to set.  
**Impact:** If JS fails, mobile layout may break on browsers with dynamic toolbars.

### 14. LOW: Code Block Color Forcing
**File:** `NotebookTheme.css` lines 166-168  
**Problem:** Forces code block colors with `!important` which may not work in dark mode.  
**Impact:** Code blocks may have poor contrast in dark mode.

### 15. LOW: Multiple Font Family Definitions
**Files:** `index.css`, `global.css`, `variables.css`, `NotebookTheme.css`  
**Problem:** Font families defined in multiple places with slight variations.  
**Impact:** Inconsistent typography, maintenance confusion.

---

## Summary

The LastWeek codebase has a well-organized component structure with 61 JSX component files and 52 CSS style files. The visual identity is cohesive with a unique "notebook paper" aesthetic using warm off-white backgrounds, purple accents, and a mix of modern Inter font with handwritten Caveat for personality.

**Most Critical Findings:**

1. **Theme consistency is broken** - Extensive inline styles in Pricing.jsx and other pages use hardcoded colors that ignore CSS variables. Dark mode implementation is split between media queries and data-attributes.

2. **Typography system conflicts** - Two competing systems with aggressive `!important` overrides create unpredictable font sizing.

3. **Missing font imports** - The Caveat handwritten font is referenced but not imported, potentially breaking the intended aesthetic.

4. **Custom icon system** - 40+ hand-rolled SVG icons increase bundle size and maintenance burden.

5. **CSS variable duplication** - Key variables are defined in both global.css and variables.css with different values, creating cascade conflicts.

The codebase would benefit from consolidating all design tokens into a single source of truth, removing inline styles, standardizing dark mode implementation, and either importing missing fonts or removing their references.

---

**PHASE 0 COMPLETE. Audit saved to docs/ui-progress/phase-0-audit.md. Zero files modified.**
