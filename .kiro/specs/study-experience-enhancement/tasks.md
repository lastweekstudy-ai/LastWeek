# Implementation Plan: Study Experience Enhancement

## Overview

Six targeted improvements to `StudyInterface.jsx`, `PDFViewer.jsx`, and `StudyInterface.css`. No new dependencies are required. Tasks are grouped by requirement and kept small so each can be reviewed and tested independently.

---

## Tasks

- [ ] 1. Requirement 1 — Polished Resize Handle
  - [ ] 1.1 Replace `.resize-line` markup with `.resize-grip` dots in `StudyInterface.jsx`
    - Swap `<div className="resize-line"></div>` for `<div className="resize-grip"><span /><span /><span /></div>`
    - Add `isResizing` class to the handle element: `className={\`resize-handle ${isResizing ? 'is-resizing' : ''}\`}`
    - _Requirements: 1.1, 1.2_

  - [ ] 1.2 Add resize handle and grip CSS to `StudyInterface.css`
    - Style `.resize-handle` with `cursor: col-resize`, centred flex layout, and accent colour on hover/active
    - Style `.resize-grip` and its `span` children as 4 px circular dots with colour transition
    - _Requirements: 1.1, 1.2_

  - [ ] 1.3 Extract `snapRatio` helper and update drag constraint to [20, 80] in `StudyInterface.jsx`
    - Define `PRESETS = [30, 50, 70]` and `SNAP_THRESHOLD = 3` at module scope
    - Define pure `snapRatio(raw)` function at module scope
    - Update `handleMouseMove` to clamp between 20 and 80 (was 30–70)
    - _Requirements: 1.4, 1.5_

  - [ ] 1.4 Apply snap and persist to `localStorage` on mouse-up in `StudyInterface.jsx`
    - In `handleMouseUp`, call `snapRatio(prev)` and write result to `localStorage` under key `study-split-ratio`
    - _Requirements: 1.4, 1.6_

  - [ ] 1.5 Initialise `pdfWidth` from `localStorage` in `StudyInterface.jsx`
    - Replace `useState(50)` with a lazy initialiser that reads `study-split-ratio`, validates with `Number.isFinite` and range check, and falls back to 50
    - _Requirements: 1.7_

- [ ] 2. Requirement 2 — Keyboard Shortcuts for Preset Splits
  - [ ] 2.1 Add `Alt+[` / `Alt+]` keyboard shortcut `useEffect` to `StudyInterface.jsx`
    - Guard with `if (isMobile) return` so shortcuts are skipped on narrow viewports
    - Cycle through `PRESETS` array using modular arithmetic for both directions
    - Persist the new ratio to `localStorage` on each keypress
    - Clean up listener in the effect's return function
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Requirement 3 — Polished Mobile Tab Bar
  - [ ] 3.1 Update mobile tab bar CSS in `StudyInterface.css`
    - Style `.mobile-tabs` as a pill container with tertiary background
    - Style `.mobile-tab` with muted colour and 0.6 opacity for inactive state
    - Style `.mobile-tab.active` with accent background, white text, full opacity, and box-shadow
    - _Requirements: 3.1, 3.2_

  - [ ] 3.2 Replace `display:none` pane toggling with `.pane-hidden` CSS class in `StudyInterface.jsx`
    - Add `pane-hidden` class to the PDF pane when `isMobile && mobileTab !== 'pdf'`
    - Add `pane-hidden` class to the Chat pane when `isMobile && mobileTab !== 'chat'`
    - _Requirements: 3.3, 3.7_

  - [ ] 3.3 Add `.pane-hidden` and pane transition CSS to `StudyInterface.css`
    - `.pane-hidden`: `visibility: hidden; opacity: 0; pointer-events: none; position: absolute; width: 100% !important; height: 100%; top: 0; left: 0`
    - `.study-pdf-section, .study-chat-section`: `transition: opacity 0.2s ease`
    - _Requirements: 3.3, 3.7_

  - [ ] 3.4 Add swipe gesture detection `useEffect` to `StudyInterface.jsx`
    - Add `touchStartRef` ref to store `{ x, y }` of the initial touch
    - Attach `touchstart` and `touchend` listeners to `containerRef.current` when `isMobile` is true
    - Apply swipe rule: `|dx| >= 50` and `|dx|/|dy| > 1.5`; swipe left → `'chat'`, swipe right → `'pdf'`
    - Remove listeners in the effect's return function
    - _Requirements: 3.4, 3.5, 3.6_

- [ ] 4. Requirement 4 — Viewport-Safe Ask AI Tooltip
  - [ ] 4.1 Extract `clampTooltipX` and flip-Y logic to `src/utils/studyUtils.js`
    - Define and export `clampTooltipX(centreX, viewportWidth)` using `TOOLTIP_WIDTH = 120` and `TOOLTIP_MARGIN = 8`
    - Define and export `isSwipeGesture(dx, dy)` (extracted from the swipe effect for testability)
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ] 4.2 Apply `clampTooltipX` and top-edge flip in `handleSelectionChange` in `StudyInterface.jsx`
    - Import `clampTooltipX` from `studyUtils.js`
    - Replace raw `rect.left + rect.width / 2` with `clampTooltipX(rawX, window.innerWidth)`
    - Compute `flipped` flag when `rawY < 8`; if flipped, set `y` to `rect.bottom - containerRect.top + 8`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Requirement 5 — Local PDF.js Worker
  - [ ] 5.1 Switch `pdfjs.GlobalWorkerOptions.workerSrc` to local path in `StudyInterface.jsx`
    - Change the CDN URL assignment to `pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'`
    - _Requirements: 5.1, 5.3_

  - [ ] 5.2 Switch `pdfjs.GlobalWorkerOptions.workerSrc` to local path in `PDFViewer.jsx`
    - Change the CDN URL assignment to `pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'`
    - _Requirements: 5.2, 5.4_

- [ ] 6. Requirement 6 — Non-Blocking Extraction Progress Indicator
  - [ ] 6.1 Add `extractionPct` and `extractionError` state variables to `StudyInterface.jsx`
    - `const [extractionPct, setExtractionPct] = useState(0)`
    - `const [extractionError, setExtractionError] = useState(null)`
    - _Requirements: 6.1, 6.4, 6.7_

  - [ ] 6.2 Update `onProgress` callback and `.catch`/`.finally` in `StudyInterface.jsx`
    - In `onProgress`, compute `pct = totalPages ? Math.round((pageNum / totalPages) * 100) : 0` and call `setExtractionPct(pct)`
    - Set `extractionProgress` to `'Extracting page N of M…'` when `totalPages` is known, else `'Extracting…'`
    - In `.catch`, call `setExtractionError(err.message)` instead of `alert()`
    - In `.finally`, reset `extractionPct` to 0 and clear `extractionProgress`
    - _Requirements: 6.3, 6.4, 6.7, 6.9_

  - [ ] 6.3 Update `extractText` in `src/utils/pdfProcessor.js` to pass `totalPages` in progress callback
    - Change the `onProgress` call inside the page-iteration loop to `onProgress?.({ pageNum: i, totalPages: numPages })`
    - _Requirements: 6.9_

  - [ ] 6.4 Render `ExtractionProgressBar`, caption, error banner, and shimmer class in `StudyInterface.jsx`
    - Add progress bar wrap + fill div as first child of `.study-pdf-section` when `extracting` is true
    - Add caption div below the bar showing `extractionProgress`
    - Add inline error div with Dismiss button when `extractionError` is set; Dismiss calls `setExtractionError(null)`
    - Add `is-extracting` class to `.study-pdf-section` when `extracting` is true
    - Remove `ExtractionBanner` (yellow overlay) from the JSX
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.7, 6.8_

  - [ ] 6.5 Add extraction progress bar, caption, shimmer, and error CSS to `StudyInterface.css`
    - `.extraction-progress-bar-wrap`: `height: 4px`, overflow hidden
    - `.extraction-progress-bar`: accent colour fill, `transition: width 0.3s ease`
    - `.extraction-caption`: small muted text, no overlap with toolbar
    - `@keyframes shimmer` + `.is-extracting .pdf-viewer-area::after` shimmer overlay with `pointer-events: none`
    - `.extraction-error` and `.extraction-error-dismiss` styles
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 6.7, 6.8_

- [ ] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Property-Based and Unit Tests
  - [ ] 8.1 Install `fast-check` as a dev dependency
    - Run `npm install --save-dev fast-check` and verify it appears in `package.json` devDependencies
    - _Requirements: all_

  - [ ]* 8.2 Write property test for Property 1 — `snapRatio` stays within presets or is unchanged
    - Create `src/utils/__tests__/studyUtils.test.js`
    - Import `snapRatio` and `PRESETS` from `studyUtils.js` (or `StudyInterface.jsx` if not extracted)
    - Use `fc.float({ min: 20, max: 80 })` with 500 runs; assert result is a preset or equals input
    - **Property 1: Snap stays within presets or is unchanged**
    - **Validates: Requirements 1.4, 1.5**

  - [ ]* 8.3 Write property test for Property 2 — drag ratio always clamped to [20, 80]
    - Use `fc.float` for `clientX` (−500 to 1500) and `containerWidth` (100 to 2000) with 1000 runs
    - Assert `clamped >= 20 && clamped <= 80` for all inputs
    - **Property 2: Drag ratio is always clamped to [20, 80]**
    - **Validates: Requirements 1.5**

  - [ ]* 8.4 Write property test for Property 3 — `localStorage` round-trip preserves split ratio
    - Use `fc.integer({ min: 20, max: 80 })` with 200 runs
    - Write to `localStorage`, read back, parse, and assert equality
    - **Property 3: localStorage round-trip preserves split ratio**
    - **Validates: Requirements 1.6, 1.7**

  - [ ]* 8.5 Write property test for Property 4 — tooltip X always within viewport bounds
    - Import `clampTooltipX`, `TOOLTIP_WIDTH`, `TOOLTIP_MARGIN` from `studyUtils.js`
    - Use `fc.float({ min: 0, max: 2000 })` and `fc.integer({ min: 320, max: 2560 })` with 500 runs
    - Assert `result >= TOOLTIP_WIDTH/2 + TOOLTIP_MARGIN && result <= viewportWidth - TOOLTIP_WIDTH/2 - TOOLTIP_MARGIN`
    - **Property 4: Tooltip X is always within viewport bounds**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

  - [ ]* 8.6 Write property test for Property 5 — swipe predicate matches specification formula
    - Import `isSwipeGesture` from `studyUtils.js`
    - Use `fc.float({ min: -500, max: 500 })` for both `dx` and `dy` with 1000 runs
    - Assert `isSwipeGesture(dx, dy) === (Math.abs(dx) >= 50 && (dy === 0 || Math.abs(dx) / Math.abs(dy) > 1.5))`
    - **Property 5: Swipe predicate matches specification formula**
    - **Validates: Requirements 3.4, 3.5, 3.6**

  - [ ]* 8.7 Write property test for Property 6 — extraction progress percentage is monotonically bounded
    - Use `fc.integer({ min: 1, max: 1000 }).chain(m => fc.tuple(fc.integer({ min: 1, max: m }), fc.constant(m)))` with 500 runs
    - Assert `pct >= 0 && pct <= 100` for all `(n, m)` pairs
    - **Property 6: Extraction progress percentage is monotonically bounded**
    - **Validates: Requirements 6.3, 6.4, 6.9**

  - [ ]* 8.8 Write unit tests for worker config, keyboard shortcuts, mobile tab bar, and error handling
    - Assert `pdfjs.GlobalWorkerOptions.workerSrc === '/pdf.worker.min.js'` in both `StudyInterface` and `PDFViewer`
    - Fire `Alt+[` / `Alt+]` events at each preset and assert the cycled value
    - Render at < 768 px viewport, assert both tab labels present; click each tab, assert `.pane-hidden` on the other
    - Simulate extraction failure, assert inline error is present and `window.alert` was not called
    - Click Dismiss, assert error banner is removed
    - Set `localStorage` to `'70'` before mount, assert initial `pdfWidth` is 70
    - _Requirements: 1.7, 2.1, 2.2, 3.1, 3.2, 5.1, 5.2, 6.7, 6.8_

- [ ] 9. Final Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `snapRatio`, `PRESETS`, `SNAP_THRESHOLD`, `clampTooltipX`, and `isSwipeGesture` should be exported from `src/utils/studyUtils.js` so they are importable in tests without mounting the full component
- The `public/pdf.worker.min.js` file already exists — no download needed
- The `ExtractionBanner` (yellow overlay) is removed as part of task 6.4; the progress bar replaces it entirely
- All six correctness properties from the design document are covered by tasks 8.2–8.7

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "4.1", "5.1", "5.2", "6.1", "8.1"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.5", "2.1", "3.1", "3.4", "4.2", "6.2", "6.3"] },
    { "id": 2, "tasks": ["3.2", "3.3", "6.4", "6.5"] },
    { "id": 3, "tasks": ["8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8"] }
  ]
}
```
