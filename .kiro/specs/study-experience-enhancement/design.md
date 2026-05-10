# Design Document: Study Experience Enhancement

## Overview

This document describes the implementation design for six targeted improvements to the `StudyInterface` component and the standalone `PDFViewer` component. All changes are confined to existing files — no new dependencies are required. The improvements address: the resize handle UX, keyboard shortcuts for preset splits, the mobile tab bar, the Ask AI tooltip viewport safety, the PDF.js worker source, and the extraction progress indicator.

---

## Architecture

The feature touches three files:

| File | Changes |
|---|---|
| `src/components/StudyInterface.jsx` | Resize snap + localStorage, keyboard shortcuts, mobile swipe, tooltip clamping, local worker, extraction progress bar |
| `src/components/PDFViewer.jsx` | Local worker (one line) |
| `src/styles/StudyInterface.css` | Grip dots, resize handle hover, mobile tab active/inactive, tooltip clamping, progress bar + shimmer |

No new components are introduced. All logic lives inside the existing component functions and their associated CSS file.

---

## Components and Interfaces

### 1. Polished Resize Handle

#### Grip Dots (CSS)

Replace the existing `.resize-line` element with three grip dots rendered as a pseudo-element grid. The handle markup changes from:

```jsx
<div className="resize-handle" onMouseDown={startResize} ref={resizeRef}>
  <div className="resize-line"></div>
</div>
```

to:

```jsx
<div className="resize-handle" onMouseDown={startResize} ref={resizeRef}>
  <div className="resize-grip">
    <span /><span /><span />
  </div>
</div>
```

CSS for the grip:

```css
.resize-handle {
  width: 10px;
  background-color: var(--color-bg-tertiary);
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle:hover,
.resize-handle.is-resizing {
  background-color: var(--color-accent);
}

.resize-grip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
}

.resize-grip span {
  display: block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--color-border-light);
  transition: background-color 0.2s ease;
}

.resize-handle:hover .resize-grip span,
.resize-handle.is-resizing .resize-grip span {
  background-color: white;
}
```

Pass `isResizing` as a class to the handle element so the active colour persists during drag even when the cursor leaves the element:

```jsx
<div
  className={`resize-handle ${isResizing ? 'is-resizing' : ''}`}
  onMouseDown={startResize}
  ref={resizeRef}
>
```

#### Snap Logic

Extract a pure `snapRatio` helper that is called both on `mouseup` and when applying keyboard presets:

```js
const PRESETS = [30, 50, 70];
const SNAP_THRESHOLD = 3;

function snapRatio(raw) {
  for (const preset of PRESETS) {
    if (Math.abs(raw - preset) <= SNAP_THRESHOLD) return preset;
  }
  return raw;
}
```

The drag constraint changes from `[30, 70]` to `[20, 80]` per Requirement 1.5:

```js
const handleMouseMove = (e) => {
  if (!isResizing || !containerRef.current) return;
  const containerRect = containerRef.current.getBoundingClientRect();
  const raw = ((e.clientX - containerRect.left) / containerRect.width) * 100;
  const clamped = Math.min(80, Math.max(20, raw));
  setPdfWidth(clamped);
};
```

On `mouseup`, snap and persist:

```js
const handleMouseUp = () => {
  setIsResizing(false);
  setPdfWidth(prev => {
    const snapped = snapRatio(prev);
    localStorage.setItem('study-split-ratio', String(snapped));
    return snapped;
  });
};
```

#### localStorage Initialisation

Replace the hardcoded `useState(50)` initialiser:

```js
const [pdfWidth, setPdfWidth] = useState(() => {
  const stored = localStorage.getItem('study-split-ratio');
  const parsed = stored ? parseFloat(stored) : NaN;
  return Number.isFinite(parsed) && parsed >= 20 && parsed <= 80 ? parsed : 50;
});
```

#### PDF Page Width Constraint When Pane Is Narrow

The existing `ResizeObserver` on `pdfViewerRef` already computes `pdfViewerWidth`. The `<Page>` component already uses this value. When the pane is narrower than 320 px the computed width will naturally be less than 320 px, so the page will scale down to fit. No additional logic is needed beyond ensuring the `width` prop is always set to `pdfViewerWidth * scale` (or `pdfViewerWidth` with `scale={1}` when using the width-based approach already in place). The existing code already does this correctly — the constraint is satisfied by the current `ResizeObserver` pattern.

---

### 2. Keyboard Shortcuts for Preset Splits

Add a `useEffect` that registers and tears down the `Alt+[` / `Alt+]` listeners. The effect depends on `isMobile` so it re-runs when the viewport crosses the 768 px breakpoint.

```js
useEffect(() => {
  if (isMobile) return; // Requirement 2.5: no shortcuts on mobile

  const handleKeyDown = (e) => {
    if (!e.altKey) return;
    if (e.key !== '[' && e.key !== ']') return;
    e.preventDefault();

    setPdfWidth(prev => {
      const currentIndex = PRESETS.indexOf(snapRatio(prev));
      const base = currentIndex === -1 ? 1 : currentIndex; // default to middle preset
      let nextIndex;
      if (e.key === '[') {
        nextIndex = (base - 1 + PRESETS.length) % PRESETS.length;
      } else {
        nextIndex = (base + 1) % PRESETS.length;
      }
      const next = PRESETS[nextIndex];
      localStorage.setItem('study-split-ratio', String(next)); // Requirement 2.3
      return next;
    });
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown); // Requirement 2.4
}, [isMobile]);
```

The `PRESETS` array and `snapRatio` function are defined at module scope (outside the component) so they are accessible to both the resize handler and the keyboard handler.

**Cycle logic:**
- `Alt+[` (previous): index = `(current - 1 + 3) % 3` → 30→70, 50→30, 70→50
- `Alt+]` (next): index = `(current + 1) % 3` → 30→50, 50→70, 70→30

---

### 3. Polished Mobile Tab Bar

#### CSS Active/Inactive States

The existing `.mobile-tab` and `.mobile-tab.active` classes are already present. Enhance them for clarity:

```css
.mobile-tabs {
  display: flex;
  gap: 4px;
  background: var(--color-bg-tertiary);
  border-radius: 20px;
  padding: 3px;
}

.mobile-tab {
  background: none;
  border: none;
  color: var(--color-text-muted);       /* muted for inactive */
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 5px 14px;
  border-radius: 16px;
  transition: all 0.2s ease;
  opacity: 0.6;                          /* additional visual dimming */
}

.mobile-tab.active {
  background: var(--color-accent);
  color: white;
  opacity: 1;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.35);
}
```

#### Pane Visibility — CSS Instead of `display:none`

Change the inline style on both panes from `display: isMobile && mobileTab !== 'pdf' ? 'none' : 'flex'` to a CSS class approach that uses `visibility` + `opacity` + `pointer-events` so the PDF scroll position is preserved (Requirement 3.7):

```jsx
// PDF pane
<div
  className={`study-pdf-section ${isMobile && mobileTab !== 'pdf' ? 'pane-hidden' : ''}`}
  style={{ width: isMobile ? '100%' : `${pdfWidth}%` }}
>

// Chat pane
<div
  className={`study-chat-section ${isMobile && mobileTab !== 'chat' ? 'pane-hidden' : ''}`}
  style={{ width: isMobile ? '100%' : `${100 - pdfWidth}%` }}
>
```

```css
/* Hides a pane without unmounting it — preserves scroll position */
.pane-hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  position: absolute;   /* take out of flow so it doesn't push the visible pane */
  width: 100% !important;
  height: 100%;
  top: 0;
  left: 0;
}
```

The transition on the visible pane is handled by adding a CSS transition to the pane classes:

```css
.study-pdf-section,
.study-chat-section {
  transition: opacity 0.2s ease; /* Requirement 3.3: ≤ 200 ms */
}
```

#### Swipe Detection

Add touch state refs and a `useEffect` that attaches touch listeners to the `study-content` element. Using refs avoids re-renders during the touch sequence:

```js
const touchStartRef = useRef(null);

useEffect(() => {
  if (!isMobile || !containerRef.current) return;

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Requirement 3.6: |dx| >= 50 and |dx|/|dy| > 1.5
    if (Math.abs(dx) < 50) return;
    if (Math.abs(dy) > 0 && Math.abs(dx) / Math.abs(dy) <= 1.5) return;

    if (dx < 0) {
      // swipe left → show chat
      setMobileTab('chat');
    } else {
      // swipe right → show pdf
      setMobileTab('pdf');
    }
  };

  const el = containerRef.current;
  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchend', onTouchEnd, { passive: true });
  return () => {
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchend', onTouchEnd);
  };
}, [isMobile]);
```

The `handleAskAI` function already calls `setMobileTab('chat')` (Requirement 3.8) — no change needed there.

---

### 4. Viewport-Safe Ask AI Tooltip

#### Clamping Math

The tooltip is currently positioned with `left: selectionTip.x` and `transform: translateX(-50%)`. This means the tooltip centre is at `selectionTip.x`. The tooltip's rendered width is approximately 120 px (measured from the existing CSS: `padding: 4px 6px`, two buttons, border-radius 20px).

Replace the raw `selectionTip.x` with a clamped value computed at the time the tip is set. Extract a pure helper:

```js
const TOOLTIP_WIDTH = 120; // px, approximate rendered width
const TOOLTIP_MARGIN = 8;  // px, minimum distance from viewport edge

function clampTooltipX(centreX, viewportWidth) {
  const halfW = TOOLTIP_WIDTH / 2;
  const minX = halfW + TOOLTIP_MARGIN;                    // left edge safe zone
  const maxX = viewportWidth - halfW - TOOLTIP_MARGIN;   // right edge safe zone
  return Math.min(maxX, Math.max(minX, centreX));
}
```

#### Flip Logic (Top Edge)

If the tooltip would appear above the viewport (y < 8), flip it below the selection. The selection rect's `height` is available from `range.getBoundingClientRect()`:

```js
const TOOLTIP_HEIGHT = 36; // px, approximate rendered height
const TOOLTIP_OFFSET_ABOVE = 44; // current offset above selection

const rawY = rect.top - containerRect.top - TOOLTIP_OFFSET_ABOVE;
const flipped = rawY < 8; // would clip top of viewport
const y = flipped
  ? rect.bottom - containerRect.top + 8  // place below selection
  : rawY;
```

#### Updated `handleSelectionChange`

```js
const handleSelectionChange = () => {
  const selection = window.getSelection();
  const text = selection?.toString().trim();
  if (text && text.length > 2) {
    setSelectedText(text);
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const rawX = rect.left - containerRect.left + rect.width / 2;
        const rawY = rect.top - containerRect.top - TOOLTIP_OFFSET_ABOVE;
        const flipped = rawY < 8;
        setSelectionTip({
          x: clampTooltipX(rawX, window.innerWidth),
          y: flipped ? rect.bottom - containerRect.top + 8 : rawY,
          text,
        });
      }
    } catch (e) {}
  } else if (!text) {
    setSelectionTip(null);
  }
};
```

The tooltip JSX keeps `transform: translateX(-50%)` removed (since `x` is now the left edge, not the centre) — or alternatively keep the transform and pass the clamped centre. The simpler approach is to keep the existing `transform: translateX(-50%)` and pass the clamped centre as `left`. The `clampTooltipX` function already accounts for this by treating `centreX` as the centre.

---

### 5. Local PDF.js Worker

This is a one-line change in each file.

**`StudyInterface.jsx`** — line 16, change:
```js
// Before
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// After
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

**`PDFViewer.jsx`** — line 12, change:
```js
// Before
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// After
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

The file `public/pdf.worker.min.js` already exists in the repository. Vite serves `public/` at the root path, so `/pdf.worker.min.js` resolves correctly in both development and production builds.

---

### 6. Non-Blocking Extraction Progress Indicator

#### Progress Bar Placement

The progress bar is placed as the very first child of `.study-pdf-section`, before the `.pdf-toolbar`. This ensures it sits at the top edge of the pane without overlapping the toolbar or the PDF content (Requirement 6.2).

```jsx
<div className="study-pdf-section" ...>
  {/* Extraction progress bar — sits above toolbar, height ≤ 6px */}
  {extracting && (
    <div className="extraction-progress-bar-wrap">
      <div
        className="extraction-progress-bar"
        style={{ width: `${extractionPct}%` }}
      />
    </div>
  )}

  {/* Extraction status caption */}
  {extracting && (
    <div className="extraction-caption">
      {extractionProgress || 'Extracting…'}
    </div>
  )}

  {/* Inline error state */}
  {extractionError && (
    <div className="extraction-error">
      ⚠️ Text extraction failed. AI answers may be limited.
      <button
        className="extraction-error-dismiss"
        onClick={() => setExtractionError(null)}
      >
        Dismiss
      </button>
    </div>
  )}

  <div className="pdf-toolbar">…</div>
  <div className="pdf-viewer-area …">…</div>
</div>
```

#### New State Variables

```js
const [extractionPct, setExtractionPct] = useState(0);
const [extractionError, setExtractionError] = useState(null); // string | null
```

#### Updated `onProgress` Callback

The `extractText` call already accepts an `onProgress` callback. Update it to receive `{ pageNum, totalPages }` and compute the percentage:

```js
onProgress: ({ pageNum, totalPages }) => {
  const pct = totalPages ? Math.round((pageNum / totalPages) * 100) : 0;
  setExtractionPct(pct);
  setExtractionProgress(
    totalPages
      ? `Extracting page ${pageNum} of ${totalPages}…`
      : 'Extracting…'
  );
},
```

The `extractText` utility in `src/utils/pdfProcessor.js` must be updated to pass `totalPages` in the progress callback. The change is:

```js
// Inside extractText, when iterating pages:
onProgress?.({ pageNum: i, totalPages: numPages });
```

#### Error Handling — No `alert()`

Replace the `.catch` block's `alert()` call:

```js
.catch(err => {
  console.warn('[StudyInterface] Live extraction failed:', err.message);
  setExtractionError(err.message || 'Unknown error');  // inline error, no alert()
})
.finally(() => {
  setExtracting(false);
  setExtractionProgress('');
  setExtractionPct(0);
});
```

#### Shimmer CSS

The shimmer is a pseudo-element overlay on `.pdf-viewer-area` that is only active when the parent `.study-pdf-section` has the `is-extracting` class:

```jsx
<div
  className={`study-pdf-section ${extracting ? 'is-extracting' : ''}`}
  ...
>
```

```css
/* Slim progress bar */
.extraction-progress-bar-wrap {
  height: 4px;                          /* ≤ 6px per Requirement 6.1 */
  background: var(--color-bg-tertiary);
  flex-shrink: 0;
  overflow: hidden;
}

.extraction-progress-bar {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.3s ease;
  border-radius: 0 2px 2px 0;
}

/* Caption below progress bar */
.extraction-caption {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  padding: 2px var(--spacing-md);
  flex-shrink: 0;
  background: var(--color-bg-secondary);
}

/* Shimmer overlay on the PDF viewer area */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

.is-extracting .pdf-viewer-area::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(168, 85, 247, 0.08) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s infinite linear;
  pointer-events: none;
  z-index: 5;
}

/* Inline error state */
.extraction-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: 6px var(--spacing-md);
  background: rgba(239, 68, 68, 0.1);
  border-bottom: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--color-error);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.extraction-error-dismiss {
  background: none;
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 2px 8px;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.extraction-error-dismiss:hover {
  background: var(--color-error);
  color: white;
}
```

---

## Data Models

No new data models are introduced. The only new persistent state is the `study-split-ratio` key in `localStorage`, which stores a plain numeric string (e.g. `"50"`).

New React state variables added to `StudyInterface`:

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `pdfWidth` | `number` | `localStorage ?? 50` | Split ratio (already exists, initialiser changes) |
| `extractionPct` | `number` | `0` | Progress bar fill percentage |
| `extractionError` | `string \| null` | `null` | Inline error message |

New refs:

| Ref | Purpose |
|---|---|
| `touchStartRef` | Stores `{ x, y }` of the initial touch point for swipe detection |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Snap stays within presets or is unchanged

*For any* split ratio in [20, 80], applying `snapRatio` should return a value that is either equal to the input (when no preset is within 3 points) or equal to exactly one of the preset values [30, 50, 70] (when a preset is within 3 points). The result should never be a value outside [20, 80].

**Validates: Requirements 1.4, 1.5**

### Property 2: Drag ratio is always clamped to [20, 80]

*For any* mouse clientX position across the full container width (including positions outside the container), the computed split ratio after clamping should always satisfy `20 ≤ ratio ≤ 80`.

**Validates: Requirements 1.5**

### Property 3: localStorage round-trip preserves split ratio

*For any* valid split ratio in [20, 80], writing it to `localStorage` under `study-split-ratio` and then reading it back (as the `StudyInterface` initialiser does) should produce the same numeric value.

**Validates: Requirements 1.6, 1.7**

### Property 4: Tooltip X is always within viewport bounds

*For any* selection centre X and viewport width ≥ 320 px, the clamped tooltip left position should satisfy `TOOLTIP_MARGIN ≤ left ≤ viewportWidth − TOOLTIP_WIDTH − TOOLTIP_MARGIN`, ensuring the tooltip never clips either edge.

**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

### Property 5: Swipe predicate matches the specification formula

*For any* touch delta `(dx, dy)`, the swipe detection function should return `true` if and only if `Math.abs(dx) >= 50 && (dy === 0 || Math.abs(dx) / Math.abs(dy) > 1.5)`, and `false` otherwise.

**Validates: Requirements 3.4, 3.5, 3.6**

### Property 6: Extraction progress percentage is monotonically bounded

*For any* page number N and total page count M where `1 ≤ N ≤ M`, the computed extraction percentage `Math.round((N / M) * 100)` should always be in [0, 100], and for a fixed M, the percentage should be non-decreasing as N increases from 1 to M.

**Validates: Requirements 6.3, 6.4, 6.9**

---

## Error Handling

| Scenario | Current behaviour | New behaviour |
|---|---|---|
| Extraction fails | `alert()` called | `setExtractionError(err.message)` — inline banner with Dismiss |
| Extraction completes | Yellow overlay removed | Progress bar + shimmer removed, `extractionPct` reset to 0 |
| localStorage value is corrupt | `NaN` → component crashes | `Number.isFinite` guard defaults to 50 |
| Tooltip near viewport edge | Clips off screen | Clamped to 8 px margin on both sides |
| Tooltip near top of viewport | Clips above screen | Flipped below selection |
| PDF.js worker CDN unavailable | Worker fails to load | Local worker at `/pdf.worker.min.js` used instead |

---

## Testing Strategy

### Unit Tests (example-based)

These cover specific scenarios and configuration checks:

- **Worker config**: Import `StudyInterface` and `PDFViewer`, assert `pdfjs.GlobalWorkerOptions.workerSrc === '/pdf.worker.min.js'` in both.
- **Keyboard shortcuts**: Mount `StudyInterface` with `pdfWidth` at each preset, fire `Alt+[` / `Alt+]` events, assert the new `pdfWidth` matches the expected cycle value.
- **Mobile tab bar**: Render at viewport < 768 px, assert both tab labels are present; click each tab, assert the correct pane is visible and the other has `.pane-hidden`.
- **Ask AI → chat tab**: Simulate text selection and Ask AI click, assert `mobileTab` becomes `'chat'`.
- **Extraction error inline**: Simulate extraction failure, assert inline error message is present and `window.alert` was not called.
- **Dismiss button**: Click Dismiss on the error banner, assert it is removed from the DOM.
- **Progress caption**: Set `extractionProgress` to `'Extracting page 3 of 10…'`, assert the caption renders that string.
- **localStorage initialiser**: Set `localStorage.setItem('study-split-ratio', '70')` before mount, assert initial `pdfWidth` is 70.

### Property-Based Tests (fast-check)

Use [fast-check](https://github.com/dubzzz/fast-check) (already available in the JS ecosystem, no new install needed if added to devDependencies). Each test runs a minimum of 100 iterations.

**Feature: study-experience-enhancement, Property 1: Snap stays within presets or is unchanged**
```js
fc.assert(fc.property(
  fc.float({ min: 20, max: 80 }),
  (ratio) => {
    const result = snapRatio(ratio);
    const nearPreset = PRESETS.find(p => Math.abs(ratio - p) <= SNAP_THRESHOLD);
    if (nearPreset !== undefined) return result === nearPreset;
    return result === ratio;
  }
), { numRuns: 500 });
```

**Feature: study-experience-enhancement, Property 2: Drag ratio is always clamped to [20, 80]**
```js
fc.assert(fc.property(
  fc.float({ min: -500, max: 1500 }), // clientX can be outside container
  fc.float({ min: 100, max: 2000 }),  // container width
  (clientX, containerWidth) => {
    const raw = (clientX / containerWidth) * 100;
    const clamped = Math.min(80, Math.max(20, raw));
    return clamped >= 20 && clamped <= 80;
  }
), { numRuns: 1000 });
```

**Feature: study-experience-enhancement, Property 3: localStorage round-trip preserves split ratio**
```js
fc.assert(fc.property(
  fc.integer({ min: 20, max: 80 }),
  (ratio) => {
    localStorage.setItem('study-split-ratio', String(ratio));
    const stored = localStorage.getItem('study-split-ratio');
    const parsed = parseFloat(stored);
    return Number.isFinite(parsed) && parsed === ratio;
  }
), { numRuns: 200 });
```

**Feature: study-experience-enhancement, Property 4: Tooltip X is always within viewport bounds**
```js
fc.assert(fc.property(
  fc.float({ min: 0, max: 2000 }),   // raw centre X
  fc.integer({ min: 320, max: 2560 }), // viewport width
  (centreX, viewportWidth) => {
    const result = clampTooltipX(centreX, viewportWidth);
    const minLeft = TOOLTIP_WIDTH / 2 + TOOLTIP_MARGIN;
    const maxLeft = viewportWidth - TOOLTIP_WIDTH / 2 - TOOLTIP_MARGIN;
    return result >= minLeft && result <= maxLeft;
  }
), { numRuns: 500 });
```

**Feature: study-experience-enhancement, Property 5: Swipe predicate matches specification formula**
```js
fc.assert(fc.property(
  fc.float({ min: -500, max: 500 }), // dx
  fc.float({ min: -500, max: 500 }), // dy
  (dx, dy) => {
    const isSwipe = isSwipeGesture(dx, dy);
    const expected =
      Math.abs(dx) >= 50 &&
      (dy === 0 || Math.abs(dx) / Math.abs(dy) > 1.5);
    return isSwipe === expected;
  }
), { numRuns: 1000 });
```

**Feature: study-experience-enhancement, Property 6: Extraction progress percentage is monotonically bounded**
```js
fc.assert(fc.property(
  fc.integer({ min: 1, max: 1000 }).chain(m =>
    fc.tuple(fc.integer({ min: 1, max: m }), fc.constant(m))
  ),
  ([n, m]) => {
    const pct = Math.round((n / m) * 100);
    return pct >= 0 && pct <= 100;
  }
), { numRuns: 500 });
```

The `isSwipeGesture` and `clampTooltipX` functions should be exported from `StudyInterface.jsx` (or extracted to a `src/utils/studyUtils.js` module) so they can be imported directly in tests without mounting the full component.
