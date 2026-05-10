# Requirements Document

## Introduction

This feature improves the split-screen PDF study experience in the LastWeek study app. The `StudyInterface` component renders a fixed full-screen layout with a PDF viewer on the left and a `ChatInterface` on the right. Four areas are targeted: the resize handle between the two panes, the mobile tab-switching experience, PDF.js worker loading performance, and the UX shown while PDF text extraction is in progress.

## Glossary

- **StudyInterface**: The top-level React component (`StudyInterface.jsx`) that renders the split-screen study layout.
- **PDFViewer**: The standalone PDF viewer component (`PDFViewer.jsx`) used outside of study mode.
- **ResizeHandle**: The draggable divider element between the PDF pane and the Chat pane in `StudyInterface`.
- **PDFPane**: The left section of the split-screen layout that contains the PDF toolbar and the rendered PDF document.
- **ChatPane**: The right section of the split-screen layout that contains `ChatInterface`.
- **SplitRatio**: The percentage width of the PDF pane, expressed as an integer (e.g. 30, 50, 70). The Chat pane width is `100 − SplitRatio`.
- **PresetSplit**: One of three fixed SplitRatio values: 30, 50, or 70.
- **MobileTabBar**: The tab switcher rendered in the study header on viewports narrower than 768 px, allowing the user to toggle between the PDF pane and the Chat pane.
- **AskAITooltip**: The floating `✨ Ask AI` button that appears near a text selection in the PDF pane.
- **ExtractionBanner**: The current yellow overlay shown inside the PDF pane while live text extraction is running.
- **ExtractionProgressBar**: The slim, non-blocking progress indicator that replaces the ExtractionBanner.
- **Skeleton**: A shimmer/pulse animation rendered in place of PDF content while extraction is running.
- **LocalWorker**: The PDF.js worker file already present at `public/pdf.worker.min.js`, served from the same origin as the app.
- **CDNWorker**: The external worker URL currently used: `https://unpkg.com/pdfjs-dist@{version}/build/pdf.worker.min.mjs`.

---

## Requirements

### Requirement 1: Polished Resize Handle

**User Story:** As a student, I want a clearly visible and smooth resize handle between the PDF and chat panes, so that I can adjust the layout without guessing where to grab.

#### Acceptance Criteria

1. THE ResizeHandle SHALL render a visible grip indicator consisting of three short horizontal dots or lines centred within the handle area.
2. WHEN the user hovers over the ResizeHandle, THE StudyInterface SHALL change the cursor to `col-resize`.
3. WHEN the user drags the ResizeHandle, THE StudyInterface SHALL update the SplitRatio in real time with no perceptible lag (within one animation frame).
4. WHEN the user releases the ResizeHandle and the SplitRatio is within 3 percentage points of a PresetSplit value, THE StudyInterface SHALL snap the SplitRatio to that PresetSplit value.
5. THE StudyInterface SHALL constrain the SplitRatio to a minimum of 20 and a maximum of 80 during drag.
6. WHEN the user finishes a drag interaction, THE StudyInterface SHALL persist the final SplitRatio to `localStorage` under the key `study-split-ratio`.
7. WHEN the StudyInterface mounts, THE StudyInterface SHALL read the SplitRatio from `localStorage` and apply it as the initial split; IF no stored value exists, THE StudyInterface SHALL default to a SplitRatio of 50.
8. WHEN the PDF pane width is less than 320 px, THE PDFPane SHALL scale the rendered PDF page to fit within the available width without horizontal overflow.

### Requirement 2: Keyboard Shortcuts for Preset Splits

**User Story:** As a student, I want keyboard shortcuts to instantly switch between common split ratios, so that I can adjust my layout without touching the mouse.

#### Acceptance Criteria

1. WHEN the user presses `Alt+[` while StudyInterface is mounted, THE StudyInterface SHALL cycle the SplitRatio to the previous PresetSplit in the sequence 30 → 50 → 70 → 30 (wrapping).
2. WHEN the user presses `Alt+]` while StudyInterface is mounted, THE StudyInterface SHALL cycle the SplitRatio to the next PresetSplit in the sequence 30 → 50 → 70 → 30 (wrapping).
3. WHEN a preset split is applied via keyboard shortcut, THE StudyInterface SHALL persist the new SplitRatio to `localStorage` under the key `study-split-ratio`.
4. WHEN StudyInterface unmounts, THE StudyInterface SHALL remove the `Alt+[` and `Alt+]` keyboard event listeners.
5. WHERE the device viewport width is less than 768 px, THE StudyInterface SHALL NOT register the `Alt+[` and `Alt+]` keyboard shortcuts, because the split layout is not active on mobile.

### Requirement 3: Polished Mobile Tab Bar

**User Story:** As a student using a mobile device, I want a clearly styled tab bar with obvious active and inactive states, so that I always know which pane I am viewing.

#### Acceptance Criteria

1. WHERE the viewport width is less than 768 px, THE MobileTabBar SHALL display two tabs labelled "PDF" and "Chat".
2. THE MobileTabBar SHALL visually distinguish the active tab from the inactive tab using a filled background on the active tab and a muted style on the inactive tab.
3. WHEN the user taps a tab, THE StudyInterface SHALL transition the visible pane with a CSS opacity or transform animation completing within 200 ms.
4. WHEN the user swipes left on the visible pane, THE StudyInterface SHALL switch to the Chat tab IF the PDF tab is currently active.
5. WHEN the user swipes right on the visible pane, THE StudyInterface SHALL switch to the PDF tab IF the Chat tab is currently active.
6. THE StudyInterface SHALL recognise a swipe as a horizontal touch movement of at least 50 px with a horizontal-to-vertical ratio greater than 1.5.
7. WHEN the Chat tab is active, THE PDFPane SHALL remain mounted in the DOM and SHALL be hidden using CSS visibility or opacity rather than `display: none`, so that the PDF scroll position is preserved.
8. WHEN the user taps "✨ Ask AI" on a text selection, THE StudyInterface SHALL switch to the Chat tab automatically.

### Requirement 4: Viewport-Safe Ask AI Tooltip

**User Story:** As a student on a mobile device, I want the "✨ Ask AI" tooltip to always appear within the screen boundaries, so that I can tap it without it being cut off.

#### Acceptance Criteria

1. WHEN the AskAITooltip is positioned, THE StudyInterface SHALL calculate the tooltip's bounding rectangle relative to the viewport.
2. IF the calculated left edge of the AskAITooltip would be less than 8 px from the left viewport edge, THEN THE StudyInterface SHALL clamp the left position to 8 px.
3. IF the calculated right edge of the AskAITooltip would be less than 8 px from the right viewport edge, THEN THE StudyInterface SHALL clamp the right position so the tooltip remains at least 8 px from the right viewport edge.
4. IF the calculated top edge of the AskAITooltip would be less than 8 px from the top viewport edge, THEN THE StudyInterface SHALL reposition the tooltip below the selection instead of above it.
5. THE AskAITooltip SHALL remain fully visible on viewports as narrow as 320 px.

### Requirement 5: Local PDF.js Worker

**User Story:** As a student, I want the PDF viewer to load quickly and work offline, so that I am not blocked by slow or unavailable CDN resources.

#### Acceptance Criteria

1. THE StudyInterface SHALL set `pdfjs.GlobalWorkerOptions.workerSrc` to `/pdf.worker.min.js` (the local file served from `public/`).
2. THE PDFViewer SHALL set `pdfjs.GlobalWorkerOptions.workerSrc` to `/pdf.worker.min.js` (the local file served from `public/`).
3. THE StudyInterface SHALL NOT reference the CDNWorker URL (`https://unpkg.com/pdfjs-dist`) anywhere in the worker configuration.
4. THE PDFViewer SHALL NOT reference the CDNWorker URL (`https://unpkg.com/pdfjs-dist`) anywhere in the worker configuration.
5. WHEN the app is loaded without an internet connection, THE StudyInterface SHALL successfully initialise the PDF.js worker using the local file.

### Requirement 6: Non-Blocking Extraction Progress Indicator

**User Story:** As a student, I want to see PDF text extraction progress without the PDF being obscured, so that I can read the document while extraction runs in the background.

#### Acceptance Criteria

1. WHEN live text extraction begins, THE StudyInterface SHALL render the ExtractionProgressBar as a slim bar (height ≤ 6 px) at the top edge of the PDFPane, above the PDF toolbar.
2. THE ExtractionProgressBar SHALL NOT overlap or obscure the rendered PDF page or the PDF toolbar.
3. WHEN live text extraction is in progress, THE StudyInterface SHALL display the message "Extracting page N of M…" where N is the current page number and M is the total page count, in a non-blocking location such as a small badge or caption below the progress bar.
4. THE ExtractionProgressBar SHALL reflect the extraction percentage, calculated as `(N / M) × 100`, and SHALL update after each page is processed.
5. WHEN live text extraction is in progress, THE StudyInterface SHALL render a shimmer animation over the PDF viewer area to indicate that content analysis is running.
6. WHEN live text extraction completes successfully, THE StudyInterface SHALL remove the ExtractionProgressBar and the shimmer animation.
7. IF live text extraction fails, THEN THE StudyInterface SHALL display an inline error message inside the PDFPane reading "Text extraction failed. AI answers may be limited." without calling `alert()` or any native browser dialog.
8. THE inline extraction error message SHALL include a "Dismiss" control that removes the message when activated.
9. THE StudyInterface SHALL pass the total page count M to the `onProgress` callback so that the progress percentage can be computed; IF the total page count is not yet known, THE StudyInterface SHALL display "Extracting…" without a percentage.
