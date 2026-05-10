# Bugfix Requirements Document

## Introduction

The PDF highlight feature in `PDFViewer.jsx` is broken across six distinct behaviors. Highlights are stored in state and persisted to the Appwrite database, but they are never visually rendered on the PDF page. Additionally, the "Ask AI" bar in the parent component conflicts with text selection in highlight mode, the selection state is not cleared between selections causing conflicts, and the delete function attempts to remove DOM nodes that were never created. Together these issues make the highlight feature completely non-functional from a user perspective despite the underlying data layer working correctly.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN highlight mode is ON and the user selects text on the PDF page THEN the system shows no visual highlight color on the selected text during selection (the `::selection` CSS rule exists but does not apply because the `highlight-mode` class is on the outer content div, not the text layer itself)

1.2 WHEN the user selects text anywhere in the app THEN the system triggers the "Ask AI" bar/popup in the navbar, and when highlight mode is ON and a large block of text is selected, this bar covers the UI and its close (✕) button becomes unreachable

1.3 WHEN the user selects text a second time in highlight mode without saving the first selection THEN the system conflicts with the previous `window.getSelection()` state instead of cleanly replacing it, causing unpredictable selection behavior

1.4 WHEN the user saves a highlight by clicking 💾 THEN the system stores the highlight text in React state and the Appwrite database but does NOT render any colored overlay on the PDF page — the text on the PDF canvas/text layer shows no background color

1.5 WHEN the user clicks the ✕ delete button on a highlight in the sidebar THEN the system calls `removeHighlight`, which attempts `document.querySelector([data-highlight-id="..."])` to remove a DOM element, but no such element was ever created, so the visual removal is a no-op (only the state entry is removed)

1.6 WHEN the user navigates to a different page and returns to a previously highlighted page THEN the system loads highlights from the database into state but never re-renders the colored overlays on the PDF text layer, so all highlights are invisible after page navigation

### Expected Behavior (Correct)

2.1 WHEN highlight mode is ON and the user selects text on the PDF page THEN the system SHALL display a colored highlight background on the selected text in real time, matching the chosen highlight color

2.2 WHEN highlight mode is ON and the user selects text THEN the system SHALL suppress the parent component's "Ask AI" selection handler so the bar does not appear, keeping the full UI accessible

2.3 WHEN the user selects text a second time in highlight mode without saving THEN the system SHALL clear the previous `window.getSelection()` state and replace it cleanly with the new selection

2.4 WHEN the user saves a highlight by clicking 💾 THEN the system SHALL render an absolutely-positioned colored `<span>` overlay on top of the PDF text layer at the correct position, using the `Range` / `getBoundingClientRect()` API, so the highlighted text is visually marked on the page

2.5 WHEN the user clicks the ✕ delete button on a highlight in the sidebar THEN the system SHALL remove the corresponding overlay `<span>` element from the DOM (identified by `data-highlight-id`) as well as removing the entry from state and the database

2.6 WHEN the user navigates to a different page and returns to a previously highlighted page THEN the system SHALL re-render all stored highlight overlays for that page onto the PDF text layer after the page finishes rendering

### Unchanged Behavior (Regression Prevention)

3.1 WHEN highlight mode is OFF and the user selects text anywhere in the app THEN the system SHALL CONTINUE TO trigger the "Ask AI" bar as it does today

3.2 WHEN the user interacts with the PDF viewer without highlight mode (navigation, zoom, bookmarks, notes) THEN the system SHALL CONTINUE TO function exactly as before with no change to those behaviors

3.3 WHEN the user saves a highlight and the Appwrite database is not configured (collection ID missing) THEN the system SHALL CONTINUE TO save the highlight in memory only and display it visually for the current session

3.4 WHEN the user views the highlights sidebar THEN the system SHALL CONTINUE TO list all saved highlights for the current page with their color indicator, text preview, and delete button

3.5 WHEN the user navigates between pages THEN the system SHALL CONTINUE TO load and display bookmarks, notes indicators, and page progress as before
