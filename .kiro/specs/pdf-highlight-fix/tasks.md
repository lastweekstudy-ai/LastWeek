# Implementation Plan

- [ ] 1. Add overlay infrastructure to PDFViewer.jsx
  - Add `pageContainerRef` and `overlayLayerRef` refs using `useRef(null)` alongside the existing refs
  - Wrap the `<Page>` component in a `position: relative` div with `ref={pageContainerRef}` and `style={{ position: 'relative', display: 'inline-block' }}`
  - Add `<div ref={overlayLayerRef} className="highlight-overlay-layer" />` as a sibling inside that wrapper, after the `<Page>` component
  - _Requirements: 2.4, 2.6_

- [ ] 2. Implement `renderHighlightOverlays()` and wire it up
  - Add `highlightColorMap` lookup object mapping color names (`'yellow'`, `'green'`, `'blue'`, `'pink'`, `'orange'`, `'purple'`) to their RGBA CSS values
  - Add `renderHighlightOverlays()` function that: guards if `overlayLayerRef.current` is null, clears the overlay layer with `overlayLayerRef.current.innerHTML = ''`, filters `savedHighlights` to the current `pageNumber`, and for each highlight creates a `<span>` with `position: absolute`, `data-highlight-id`, `background-color` from `highlightColorMap`, `pointer-events: auto`, `border-radius: 2px`, and the stored `{ top, left, width, height }` rect coordinates, then appends it to `overlayLayerRef.current`
  - Add `onRenderSuccess={() => renderHighlightOverlays()}` prop to the `<Page>` component
  - Call `renderHighlightOverlays()` after `loadPageHighlights()` resolves (inside the `loadPageHighlights` async function, after `setSavedHighlights` is called)
  - _Requirements: 2.4, 2.6_

- [ ] 3. Fix `saveHighlight()` to capture position and trigger render
  - At the start of `saveHighlight`, call `window.getSelection().removeAllRanges()` to clear any stale selection state, then wrap the rest of the function body in a `requestAnimationFrame` callback so the selection is re-read after the DOM settles
  - After obtaining the `Range` from `window.getSelection().getRangeAt(0)`, call `Range.getBoundingClientRect()` and subtract `pageContainerRef.current.getBoundingClientRect()` to get coordinates relative to the page container; store `{ top, left, width, height }` in the highlight object
  - After the `setSavedHighlights` call that adds the new highlight, call `renderHighlightOverlays()`
  - _Requirements: 2.3, 2.4_

- [ ] 4. Fix `removeHighlight()` to remove overlay spans
  - Replace the existing `querySelector` + node-unwrapping block (the `if (highlightElement)` block that calls `insertBefore` and `removeChild`) with: `document.querySelectorAll('[data-highlight-id="${highlightId}"]').forEach(el => el.remove())`
  - Keep the `setSavedHighlights` state update and the `deletePDFHighlight` database call unchanged
  - _Requirements: 2.5_

- [ ] 5. Add Ask AI suppression and fix selection CSS
  - Add `onMouseUp={(e) => { if (highlightMode) e.stopPropagation(); }}` to the `.pdf-viewer-content` div in the JSX
  - Set `--highlight-selection-color` as an inline CSS variable on the `pageContainerRef` wrapper div based on `highlightColor` state, using the same RGBA values from `highlightColorMap` (e.g., `style={{ position: 'relative', display: 'inline-block', '--highlight-selection-color': highlightColorMap[highlightColor] }}`)
  - In `PDFViewer.css`: add `.highlight-overlay-layer` rule with `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5`
  - In `PDFViewer.css`: add `.highlight-overlay-layer span` rule with `position: absolute; pointer-events: auto; cursor: pointer; border-radius: 2px; mix-blend-mode: multiply; transition: opacity 0.15s ease` and a `.highlight-overlay-layer span:hover` rule with `opacity: 0.6`
  - In `PDFViewer.css`: replace the broad `.pdf-viewer-content.highlight-mode ::selection` and `.pdf-viewer-content.highlight-mode ::-moz-selection` rules with targeted `.react-pdf__Page__textContent span::selection` and `.react-pdf__Page__textContent span::-moz-selection` rules using `background: var(--highlight-selection-color, rgba(255, 235, 59, 0.5))`
  - _Requirements: 2.1, 2.2, 3.1_
