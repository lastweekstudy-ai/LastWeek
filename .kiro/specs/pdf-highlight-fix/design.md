# PDF Highlight Fix — Bugfix Design

## Overview

The PDF highlight feature in `PDFViewer.jsx` is completely non-functional from a visual standpoint despite the data layer (React state + Appwrite) working correctly. Highlights are saved but never rendered; the delete function tries to remove DOM nodes that were never created; the "Ask AI" bar fires during highlight-mode selections; and page navigation wipes all visible highlights.

The fix introduces an **overlay rendering system**: absolutely-positioned `<span>` elements inside a `<div class="highlight-overlay-layer">` that sits on top of the `react-pdf` text layer. All six defects are addressed together because they share a single root cause — the absence of any DOM-level highlight rendering pipeline.

The fix is intentionally minimal: no new dependencies, no architectural changes, only targeted additions to `PDFViewer.jsx` and `PDFViewer.css`.

---

## Glossary

- **Bug_Condition (C)**: The set of inputs/states that trigger the broken behavior — specifically, any state where `savedHighlights` contains entries for the current page but no corresponding `[data-highlight-id]` span exists in the DOM inside `.highlight-overlay-layer`.
- **Property (P)**: The desired correct behavior — for every saved highlight on the current page, a positioned `<span data-highlight-id="{id}">` element exists inside `.highlight-overlay-layer` with the correct color and geometry.
- **Preservation**: All behaviors that must remain unchanged by the fix — "Ask AI" triggering when highlight mode is OFF, navigation/zoom/bookmarks/notes, memory-only fallback when Appwrite is not configured, and the sidebar listing.
- **`renderHighlightOverlays()`**: The new function in `PDFViewer.jsx` that reads `savedHighlights` filtered to `pageNumber`, uses `Range.getBoundingClientRect()` relative to the PDF page container, and writes `<span>` elements into `.highlight-overlay-layer`.
- **`highlight-overlay-layer`**: A `<div>` with `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5` placed as a sibling of the `react-pdf` `<Page>` canvas and text layer, inside a `position: relative` page wrapper.
- **`pageContainerRef`**: A React ref attached to the `position: relative` wrapper div that contains the `<Page>` component. Used as the coordinate origin for `getBoundingClientRect()` calculations.
- **`overlayLayerRef`**: A React ref attached to `.highlight-overlay-layer`. Used by `renderHighlightOverlays()` to clear and repopulate overlay spans.
- **`isBugCondition(state)`**: Returns `true` when `savedHighlights` has entries for `pageNumber` but `.highlight-overlay-layer` contains no matching `[data-highlight-id]` spans.
- **`highlightColorMap`**: A lookup object mapping color names (`'yellow'`, `'green'`, etc.) to their RGBA CSS values used for overlay backgrounds.

---

## Bug Details

### Bug Condition

The bug manifests in six related ways, all caused by the absence of a DOM overlay rendering pipeline. The `saveHighlight` function stores text in state and the database but never creates any visual element. The `removeHighlight` function queries for a DOM element that was never created. The `::selection` CSS rule is scoped to the wrong ancestor. The `mouseup` event is not stopped from propagating to the parent "Ask AI" handler. The `window.getSelection()` state is not cleared between selections. And there is no `onRenderSuccess` callback to re-draw overlays after page navigation.

**Formal Specification:**
```
FUNCTION isBugCondition(state)
  INPUT: state = { savedHighlights: Highlight[], pageNumber: number, domOverlayLayer: Element | null }
  OUTPUT: boolean

  pageHighlights := savedHighlights.filter(h => h.page == pageNumber)

  IF pageHighlights.length == 0 THEN
    RETURN false  -- no highlights to render, not a bug
  END IF

  IF domOverlayLayer == null THEN
    RETURN true   -- overlay layer doesn't exist at all
  END IF

  renderedIds := Set(domOverlayLayer.querySelectorAll('[data-highlight-id]').map(el => el.dataset.highlightId))

  FOR EACH highlight IN pageHighlights DO
    IF highlight.id NOT IN renderedIds THEN
      RETURN true  -- at least one highlight is missing its DOM span
    END IF
  END FOR

  RETURN false
END FUNCTION
```

### Examples

- **Save highlight, nothing appears**: User selects "mitochondria" on page 3, clicks 💾. State gains `{ id: "abc", page: 3, text: "mitochondria", color: "yellow" }`. No yellow span appears on the PDF. Expected: a yellow `<span data-highlight-id="abc">` is positioned over the word on the page.

- **Delete highlight, nothing changes visually**: User clicks ✕ on "mitochondria" in the sidebar. `removeHighlight("abc")` runs, calls `document.querySelector('[data-highlight-id="abc"]')` → `null`. State entry is removed but there was nothing visual to remove anyway. Expected: the overlay span is removed from `.highlight-overlay-layer`.

- **Page navigation wipes highlights**: User is on page 3 with highlights visible (hypothetically), navigates to page 4 and back to page 3. `loadPageHighlights()` reloads state but `renderHighlightOverlays()` is never called. Expected: overlays are re-drawn after `onRenderSuccess` fires.

- **Ask AI fires during highlight selection**: User is in highlight mode, selects a paragraph. The parent component's `mouseup` handler fires, showing the "Ask AI" bar. Expected: `stopPropagation()` prevents this when highlight mode is ON.

- **Selection color doesn't match chosen color**: User switches to blue highlight color. Selected text still shows the hardcoded yellow `rgba(255, 255, 0, 0.4)` from the `::selection` rule. Expected: `::selection` color updates to match `highlightColor`.

- **Second selection conflicts with first**: User selects "ATP" without saving, then selects "glucose". `window.getSelection()` may still reference the first range. Expected: `removeAllRanges()` is called before reading the new selection.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When highlight mode is OFF and the user selects text anywhere in the app, the parent component's "Ask AI" bar MUST continue to appear exactly as it does today (requirement 3.1).
- All PDF navigation (prev/next page, page input), zoom controls, bookmark toggle, and notes indicator MUST continue to function without any change (requirement 3.2).
- When the Appwrite `PDF_HIGHLIGHTS_COLLECTION_ID` environment variable is not set, highlights MUST continue to be saved in memory only and displayed visually for the current session (requirement 3.3).
- The highlights sidebar MUST continue to list all saved highlights for the current page with color indicator, text preview, and delete button (requirement 3.4).
- Page navigation MUST continue to load and display bookmarks, notes indicators, and page progress as before (requirement 3.5).

**Scope:**
All inputs that do NOT involve highlight mode being ON or the overlay rendering pipeline are completely unaffected by this fix. This includes:
- Mouse clicks on navigation buttons, zoom controls, bookmark button, notes button, close button
- Keyboard input and scroll activity tracking
- The Appwrite data layer (`createPDFHighlight`, `getPageHighlights`, `deletePDFHighlight`) — these are not modified
- The sidebar rendering logic (JSX) — the list display is not changed, only the DOM overlay rendering is added

---

## Hypothesized Root Cause

Based on code inspection of `PDFViewer.jsx`, the root causes are confirmed (not merely hypothesized):

1. **No overlay rendering pipeline exists**: `saveHighlight` stores data in state but contains zero DOM manipulation code to create visual spans. The `react-pdf` `<Page>` renders a canvas and a text layer, but no overlay layer is created or populated anywhere in the component.

2. **`::selection` CSS specificity miss**: The rule `.pdf-viewer-content.highlight-mode ::selection` applies to all descendants of `.pdf-viewer-content`, but `react-pdf` renders text spans inside `.react-pdf__Page__textContent` which may have its own `user-select` or stacking context that prevents the inherited `::selection` from applying. The rule must target `.react-pdf__Page__textContent span::selection` directly.

3. **`removeHighlight` queries a non-existent element**: The function calls `document.querySelector('[data-highlight-id="${highlightId}"]')` and attempts to unwrap it as if it were a `<mark>` wrapping text nodes. Since no such element was ever created, this is always a no-op. The correct approach is `querySelectorAll` on the overlay layer and `element.remove()`.

4. **No `onRenderSuccess` callback**: The `<Page>` component has no `onRenderSuccess` prop. Without it, there is no hook to re-draw overlays after the PDF page finishes rendering (which happens asynchronously and resets the DOM).

5. **`mouseup` propagation not stopped**: There is no `mouseup` event listener on the PDF content area that calls `stopPropagation()` when `highlightMode` is true. The parent component's handler fires unconditionally.

6. **`window.getSelection()` not cleared before new selection**: `saveHighlight` reads `window.getSelection()` directly without first calling `removeAllRanges()` to clear any stale state from a previous selection.

---

## Correctness Properties

Property 1: Bug Condition — Highlight Overlays Are Rendered

_For any_ state where `savedHighlights` contains one or more entries for the current `pageNumber` and the PDF page has finished rendering (`onRenderSuccess` has fired), the fixed `PDFViewer` component SHALL have a corresponding `<span data-highlight-id="{id}">` element inside `.highlight-overlay-layer` for every such highlight, positioned over the correct text with the correct background color.

**Validates: Requirements 2.4, 2.6**

Property 2: Preservation — Non-Highlight-Mode Behavior Unchanged

_For any_ user interaction where `highlightMode` is `false` (navigation, zoom, bookmarks, notes, text selection triggering Ask AI), the fixed `PDFViewer` component SHALL produce exactly the same behavior as the original component, with no change to event handling, rendering, or state management for those interactions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

## Fix Implementation

### Changes Required

**File**: `src/components/PDFViewer.jsx`

**New refs to add:**
```jsx
const pageContainerRef = useRef(null);
const overlayLayerRef = useRef(null);
```

**Specific Changes:**

1. **Add `renderHighlightOverlays()` function**: This function clears `.highlight-overlay-layer` and re-populates it with positioned spans for all `savedHighlights` on the current page.
   - Get the page container's bounding rect: `pageContainerRef.current.getBoundingClientRect()`
   - For each highlight, use the stored `Range` position data (or re-derive from text search) to compute `top`, `left`, `width`, `height` relative to the container
   - Create `<span>` elements with `position: absolute`, `data-highlight-id`, `background-color` from `highlightColorMap`, `pointer-events: auto` (so hover/click works), and `z-index: 5`
   - Append to `overlayLayerRef.current`

   > **Implementation note on position storage**: Since `react-pdf` re-renders the text layer asynchronously, the most reliable approach is to capture `Range.getBoundingClientRect()` at save time and store the rect coordinates in the highlight object (relative to the page container). On re-render, use those stored coordinates directly. This avoids needing to re-find text in the DOM.

2. **Update `saveHighlight()`**:
   - Call `window.getSelection().removeAllRanges()` at the start, then use `requestAnimationFrame` to re-read the selection after DOM settles
   - Capture `Range.getBoundingClientRect()` relative to `pageContainerRef.current` and store as `{ top, left, width, height }` in the highlight object
   - After state update, call `renderHighlightOverlays()`

3. **Update `removeHighlight()`**:
   - Replace the current `querySelector` + node-unwrapping logic with:
     ```js
     document.querySelectorAll(`[data-highlight-id="${highlightId}"]`)
       .forEach(el => el.remove());
     ```
   - Keep the state update and database delete calls unchanged

4. **Add `onRenderSuccess` to `<Page>`**:
   ```jsx
   <Page
     pageNumber={pageNumber}
     scale={scale}
     renderTextLayer={true}
     renderAnnotationLayer={true}
     onRenderSuccess={() => renderHighlightOverlays()}
   />
   ```

5. **Add overlay layer div inside page wrapper**:
   Wrap the `<Page>` in a `position: relative` div with `pageContainerRef`, and add the overlay layer as a sibling:
   ```jsx
   <div ref={pageContainerRef} style={{ position: 'relative', display: 'inline-block' }}>
     <Page ... />
     <div ref={overlayLayerRef} className="highlight-overlay-layer" />
   </div>
   ```

6. **Add `mouseup` suppression**:
   Add a `onMouseUp` handler to the `.pdf-viewer-content` div:
   ```jsx
   onMouseUp={(e) => { if (highlightMode) e.stopPropagation(); }}
   ```

7. **Fix `::selection` CSS scope** (in `PDFViewer.css`):
   - Remove the broad `.pdf-viewer-content.highlight-mode ::selection` rule
   - Add a targeted rule: `.react-pdf__Page__textContent span::selection`
   - Drive the color dynamically via a CSS custom property set inline on the page container: `--highlight-selection-color`

8. **Call `renderHighlightOverlays()` after `loadPageHighlights()`** resolves, so overlays appear when highlights are loaded from the database on page change.

---

**File**: `src/styles/PDFViewer.css`

**Specific Changes:**

1. **Add `.highlight-overlay-layer` styles**:
   ```css
   .highlight-overlay-layer {
     position: absolute;
     top: 0;
     left: 0;
     width: 100%;
     height: 100%;
     pointer-events: none;
     z-index: 5;
   }
   ```

2. **Add overlay span styles**:
   ```css
   .highlight-overlay-layer span {
     position: absolute;
     pointer-events: auto;
     cursor: pointer;
     border-radius: 2px;
     mix-blend-mode: multiply;
     transition: opacity 0.15s ease;
   }

   .highlight-overlay-layer span:hover {
     opacity: 0.6;
   }
   ```

3. **Fix `::selection` rule**:
   ```css
   /* Remove: .pdf-viewer-content.highlight-mode ::selection */

   /* Add: */
   .react-pdf__Page__textContent span::selection {
     background: var(--highlight-selection-color, rgba(255, 235, 59, 0.5));
   }
   .react-pdf__Page__textContent span::-moz-selection {
     background: var(--highlight-selection-color, rgba(255, 235, 59, 0.5));
   }
   ```

4. **Ensure text layer is selectable** (keep existing rule, confirm scope):
   ```css
   .pdf-viewer-content.highlight-mode .react-pdf__Page__textContent {
     user-select: text;
     -webkit-user-select: text;
   }
   ```

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code to confirm root cause analysis, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Mount `PDFViewer` with a mock PDF resource, enable highlight mode, simulate text selection and a save action, then assert that `.highlight-overlay-layer` contains a `[data-highlight-id]` span. Run on UNFIXED code to observe the failure.

**Test Cases**:
1. **Overlay not created on save** (will fail on unfixed code): Enable highlight mode, simulate selection, call `saveHighlight()`, assert `overlayLayerRef.current.children.length > 0`
2. **Delete no-op on unfixed code** (will fail on unfixed code): Call `removeHighlight("fake-id")`, assert no error thrown and DOM is unchanged (currently it silently fails)
3. **Ask AI fires in highlight mode** (will fail on unfixed code): Attach a mock handler to `document` for `mouseup`, enable highlight mode, fire a `mouseup` event on the content area, assert the mock handler was called (it should NOT be called after fix)
4. **Overlays absent after page navigation** (will fail on unfixed code): Load highlights into state, simulate `onRenderSuccess`, assert overlay spans exist

**Expected Counterexamples**:
- `overlayLayerRef.current` is `null` or empty after `saveHighlight()` — confirms no rendering pipeline
- `document.querySelector('[data-highlight-id="..."]')` returns `null` — confirms delete is a no-op
- Parent `mouseup` handler fires — confirms missing `stopPropagation()`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL state WHERE isBugCondition(state) DO
  result := renderHighlightOverlays_fixed(state)
  ASSERT overlayLayer.querySelectorAll('[data-highlight-id]').length
         == state.savedHighlights.filter(h => h.page == state.pageNumber).length
  ASSERT ALL spans have correct data-highlight-id, background-color, position
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (highlight mode OFF, or no highlights on page), the fixed component produces the same behavior as the original.

**Pseudocode:**
```
FOR ALL state WHERE NOT isBugCondition(state) DO
  ASSERT fixedComponent(state).behavior == originalComponent(state).behavior
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many combinations of page numbers, highlight counts, and mode states automatically
- It catches edge cases (0 highlights, 100 highlights, page 1 vs page 50) that manual tests miss
- It provides strong guarantees that non-highlight interactions are unaffected

**Test Plan**: Observe behavior on UNFIXED code for navigation, zoom, and Ask AI triggering, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Ask AI preservation**: For any `mouseup` event when `highlightMode = false`, assert the document-level handler fires
2. **Navigation preservation**: For any page change, assert `updatePDFProgress` is called and `pageNumber` state updates correctly
3. **Sidebar preservation**: For any `savedHighlights` array, assert the sidebar renders the correct number of highlight items
4. **Memory-only fallback**: When `createPDFHighlight` returns `null`, assert the highlight still appears in the overlay layer

### Unit Tests

- Test `renderHighlightOverlays()` with 0, 1, and N highlights for the current page
- Test `renderHighlightOverlays()` with highlights from other pages (should not render)
- Test `removeHighlight()` removes the correct span and leaves others intact
- Test `saveHighlight()` with no text selected (should be a no-op)
- Test `saveHighlight()` calls `removeAllRanges()` before reading selection
- Test `mouseup` handler calls `stopPropagation()` when `highlightMode = true`
- Test `mouseup` handler does NOT call `stopPropagation()` when `highlightMode = false`

### Property-Based Tests

- Generate random arrays of highlights (varying page, color, position) and verify that after `renderHighlightOverlays()`, exactly the highlights for `pageNumber` have DOM spans
- Generate random highlight IDs and verify that `removeHighlight(id)` removes exactly the spans with that ID and no others
- Generate random sequences of save/delete/page-change operations and verify the overlay layer always reflects the current `savedHighlights` state for the current page
- Generate random `mouseup` events with `highlightMode` toggled and verify propagation behavior matches the expected rule

### Integration Tests

- Full flow: enable highlight mode → select text → save → verify overlay appears → navigate away → navigate back → verify overlay re-appears after `onRenderSuccess`
- Delete flow: save highlight → verify overlay → click delete in sidebar → verify overlay removed → verify state entry removed
- Ask AI suppression: enable highlight mode → select text → verify Ask AI bar does NOT appear; disable highlight mode → select text → verify Ask AI bar DOES appear
- Color switching: change highlight color → select text → verify `::selection` color matches chosen color → save → verify overlay span background matches chosen color
- Memory-only mode: mock Appwrite to return `null` → save highlight → verify overlay still appears and sidebar still lists it
