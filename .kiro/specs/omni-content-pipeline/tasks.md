# Implementation Tasks — Omni-Content Pipeline

## Task Dependency Graph

```
Phase 1 (PDF Extraction)
  Task 1 → Task 2 → Task 3

Phase 2 (Streaming)
  Task 4 → Task 5 → Task 6 → Task 7

Phase 3 (Context Manager)
  Task 8 → Task 9

Phase 4 (Spaced Repetition)
  Task 10 → Task 11 → Task 12

Testing
  Task 13 (depends on Tasks 1–3)
  Task 14 (depends on Tasks 4–7)
  Task 15 (depends on Tasks 8–9)
  Task 16 (depends on Tasks 10–12)
```

---

## Phase 1 — Smart PDF Extraction with Vision Fallback

### Task 1: Create `src/utils/pdfProcessor.js` — Core Extraction Pipeline

**References:** Requirements 1.1–1.8, Design §Phase 1

Create the new file `src/utils/pdfProcessor.js` with the following exports:

- **`computeGarbageRatio(text)`** — Returns the ratio (0–1) of garbage characters in a string. Garbage characters are: non-printable characters below U+0020 (except `\t`, `\n`, `\r`), the Unicode replacement character U+FFFD, and characters outside the Basic Multilingual Plane that are not CJK Unified Ideographs (U+4E00–U+9FFF, U+3400–U+4DBF, U+20000–U+2A6DF).

- **`classifyPage(textItems, threshold = 0.3)`** — Accepts an array of raw text strings from PDF.js. Returns `'bad'` if the array is empty OR if `computeGarbageRatio(textItems.join(''))` exceeds `threshold`; otherwise returns `'good'`.

- **`wrapPageContent(pageNum, content)`** — Returns the string `=== PAGE {pageNum} ===\n{content}\n=== END PAGE {pageNum} ===`.

- **`extractText(arrayBuffer, options)`** — Main async function. Accepts:
  - `arrayBuffer` — raw PDF binary
  - `options.onProgress(pageResult)` — callback fired once per page with `{ pageNum, method, charCount, garbageRatio }`
  - `options.processImage(base64, prompt)` — injected Gemini Vision caller
  - `options.garbageThreshold` (default `0.3`)
  - `options.canvasScale` (default `1.5`)

  Algorithm:
  1. Load the PDF with `pdfjs-dist` (`pdfjsLib.getDocument({ data: arrayBuffer })`).
  2. For each page (1 to N):
     a. Extract text items via `page.getTextContent()`.
     b. Call `classifyPage(textItems, garbageThreshold)`.
     c. If `'good'`: use the joined text directly.
     d. If `'bad'`:
        - Render the page to an offscreen `<canvas>` at `canvasScale` using `page.render()`.
        - Export as Base64 PNG via `canvas.toDataURL('image/png')` (strip the `data:image/png;base64,` prefix).
        - Call `options.processImage(base64, ocrPrompt)` with a 30-second timeout (use `Promise.race` with a `setTimeout` rejection).
        - On success: use the returned Markdown as the page content.
        - On canvas render failure OR `processImage` failure/timeout: use the placeholder `[Page {pageNum}: image-only — could not extract text]`.
     e. Wrap the final content with `wrapPageContent(pageNum, content)`.
     f. Call `options.onProgress({ pageNum, method: 'pdfjs'|'vision', charCount, garbageRatio })`.
  3. After all pages: if every page is a placeholder (no page has ≥ 1 non-placeholder character), throw `new Error('PDF extraction failed: no readable content found in any page')`.
  4. Return the combined text (all wrapped pages joined by `\n\n`).

The OCR prompt to pass to `processImage`:
```
Convert this PDF page image to Markdown. Preserve headings, lists, tables, and mathematical expressions as Markdown. Return plain-text paragraphs for any content that cannot be mapped to those structures.
```

---

### Task 2: Integrate `pdfProcessor.js` into `FileAttachment.jsx`

**References:** Requirements 1.1–1.8, Design §Phase 1 data flow

Locate the PDF processing logic inside `src/components/FileAttachment.jsx` (the section that uses `pdfjs-dist` to extract text from uploaded PDFs). Replace it with a call to `extractText` from `pdfProcessor.js`.

- Import `extractText` from `../utils/pdfProcessor`.
- Import `useGemini` and destructure `processImage` from it.
- Pass `processImage` as `options.processImage` to `extractText`.
- Pass an `onProgress` callback that updates a per-page progress state (e.g., `Processing page {pageNum} of {total}…`). Display this progress text in the UI while extraction is running.
- The returned combined text replaces the previously extracted text string — all downstream usage (building the `aiContextMessage` for the chat) remains unchanged.
- If `extractText` throws (all-placeholder case), surface the error message to the user in the existing error display area.

---

### Task 3: Integrate `pdfProcessor.js` into `PDFViewer.jsx` (Study Mode)

**References:** Requirements 1.1–1.8, Design §Phase 1 data flow

Locate the PDF text extraction logic inside `src/components/PDFViewer.jsx` (the section that iterates pages and builds the `extractedText` string for study mode). Replace it with a call to `extractText` from `pdfProcessor.js`.

- Import `extractText` from `../utils/pdfProcessor`.
- Import `useGemini` and destructure `processImage`.
- Pass `processImage` as `options.processImage`.
- Pass an `onProgress` callback that updates the existing per-page loading indicator (e.g., `Extracting page {pageNum}…`).
- The returned combined text is stored in the same state variable that was previously populated by the manual page loop — all downstream usage (passing text to `useSession.sendMessageWithAI`) remains unchanged.
- On error, display the error message in the existing PDF error state.

---

## Phase 2 — Streaming AI Responses

### Task 4: Add `askStream` to `src/hooks/useDeepSeek.js`

**References:** Requirements 2.1–2.3, 2.7, Design §Phase 2 `useDeepSeek`

Add a new exported method `askStream` to the existing `useDeepSeek` hook alongside the existing `ask` method.

```js
const askStream = async (systemPrompt, messagesHistory, onChunk, retryCount = 0) => { ... }
```

Implementation:
1. Call `fetch('https://api.deepseek.com/chat/completions', ...)` with `stream: true` in the request body (all other fields identical to `makeRequest`).
2. Read the response body as a `ReadableStream` via `response.body.getReader()` and a `TextDecoder`.
3. Maintain a line buffer. For each complete line:
   - If it starts with `data: `, extract the payload after `data: `.
   - If payload is `[DONE]`, resolve with the fully assembled text.
   - Otherwise, `JSON.parse` the payload, extract `choices[0].delta.content ?? ''`, append to `assembled`, and call `onChunk(delta)`.
   - If `JSON.parse` throws, log a warning and skip the chunk (do not throw).
4. On network error before `[DONE]`: if `retryCount < 2`, wait 2 seconds and call `askStream` recursively with `retryCount + 1`. On the third failure, throw.
5. Return the `askStream` function in the hook's return value alongside `ask`.

---

### Task 5: Add `sendMessageStreaming` and `isStreaming` to `src/context/SessionContext.jsx`

**References:** Requirements 2.4, 2.6, 2.8, Design §Phase 2 `SessionContext`

Modify `src/context/SessionContext.jsx`:

1. Add state: `const [isStreaming, setIsStreaming] = useState(false);`

2. Add method `sendMessageStreaming(userMessage, streamCallback, fileAttachment = null)`:
   - Save the user message to Appwrite via `createMessage` (same as `sendMessage`).
   - Update local `messages` state with the saved user message.
   - Create a local placeholder message object:
     ```js
     { $id: `streaming-${Date.now()}`, role: 'assistant', content: '', isStreaming: true, createdAt: new Date().toISOString() }
     ```
   - Append the placeholder to `messages` state.
   - Set `isStreaming` to `true`.
   - Call `await streamCallback(onChunk)` where `onChunk(delta)` updates the placeholder message's `content` in-place:
     ```js
     setMessages(prev => prev.map(m => m.$id === placeholderId ? { ...m, content: m.content + delta } : m));
     ```
   - On completion: call `createMessage(sessionId, userId, 'assistant', fullText)` exactly once. Replace the placeholder in state with the persisted document. Call `updateSession`.
   - Set `isStreaming` to `false` in a `finally` block.
   - On error: set `isStreaming` to `false`, set `error`, remove the placeholder from state, and re-throw.

3. Expose `isStreaming` and `sendMessageStreaming` in the context `value` object.

---

### Task 6: Route `useSession.js` through `sendMessageStreaming`

**References:** Requirements 2.4, 2.5, 2.8, Design §Phase 2 `useSession`

Modify `src/hooks/useSession.js`:

1. Import `askStream` from `useDeepSeek` (destructure alongside `ask`).
2. Add `isAnalysing` state (`useState(false)`) to track the Gemini pre-analysis phase separately from streaming.
3. In `sendMessageWithAI`, after building `finalContextMessage` and `contextualMessages`:
   - **For study-mode and regular (non-file) messages**: call `sessionContext.sendMessageStreaming(messageToSave, async (onChunk) => { return await askStream(systemPrompt, contextualMessages, onChunk); }, fileAttachment)`.
   - **For file-upload messages (Gemini pre-analysis path)**: set `isAnalysing = true`, run the existing Gemini pre-analysis block, set `isAnalysing = false`, then call `sendMessageStreaming` with the assembled `finalContextMessage`.
   - Remove the old `sessionContext.sendMessage(messageToSave, async () => askDeepSeek(...))` call.
4. Return `isAnalysing` from the hook alongside the existing context spread.

---

### Task 7: Update `src/components/ChatInterface.jsx` for Streaming UI

**References:** Requirements 2.5, 2.8, Design §Phase 2 `ChatInterface`

Modify `src/components/ChatInterface.jsx`:

1. Add `isStreaming` and `isAnalysing` to the component's props (both default to `false`).
2. **Disable the send button** when `isStreaming` is `true` (in addition to the existing `isLoading` check): `disabled={!input.trim() || isLoading || isStreaming}`.
3. **Typing cursor**: in the `MessageItem` component, when rendering an assistant message that has `message.isStreaming === true`, append a blinking cursor character `▋` after the message text. Apply a CSS class `streaming-cursor` to it (add the keyframe animation `@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }` and `animation: blink 1s step-start infinite` to `.streaming-cursor` in `ChatInterface.css`).
4. **Analysing indicator**: when `isAnalysing` is `true`, show the existing `<LoadingDots />` spinner with the label "Analysing…" instead of the generic loading indicator.
5. Pass `isStreaming` and `isAnalysing` from the parent mode pages (`ActiveRecall.jsx`, `MentalModel.jsx`, `FocusBreakdown.jsx`, `CollaborativeScholar.jsx`, `CreativeSynthesis.jsx`) by reading them from `useSession()`.

---

## Phase 3 — Smart Context with Sliding Window

### Task 8: Create `src/utils/contextManager.js`

**References:** Requirements 3.1–3.7, Design §Phase 3

Create the new file `src/utils/contextManager.js` with the following exports:

- **`estimateTokens(messages)`** — Returns `Math.ceil(totalChars / 4)` where `totalChars` is the sum of `role.length + content.length` for every message in the array.

- **`buildSessionMemory(messages, n = 3, maxChars = 500)`** — Filters `messages` to assistant-role only, takes the last `n`, truncates each to `maxChars` characters, joins with `\n`, and returns the result as a string. Returns `null` if there are fewer than 4 assistant messages in the history.

- **`buildContextMessages(messages, aiContextMessage, activeSession, tokenBudget = 28000, options = {})`** — Returns `{ messages: [...], tokenEstimate: number, evictedCount: number, hasSessionMemory: boolean }`.

  Algorithm:
  1. Build the two fixed priming messages (always retained):
     ```js
     [
       { role: 'user', content: `[CONTEXT] I am studying: ${activeSession.subject}. Current learning mode: ${activeSession.mode}. Please stay focused on this subject throughout our conversation.` },
       { role: 'assistant', content: `Understood. I will focus entirely on ${activeSession.subject} using the ${activeSession.mode} approach. Let's begin.` }
     ]
     ```
  2. Call `buildSessionMemory(messages)`. If non-null, create a session memory message: `{ role: 'user', content: '[SESSION MEMORY]\n' + sessionMemory }`.
  3. Strip large PDF/study-mode blocks from historical messages (same logic as the current `useSession.js` `historicalMessages` map — replace `[STUDY MODE:` and `COMPLETE DOCUMENT TEXT:` blocks with the first 200 chars or the extracted user question).
  4. Collect historical user/assistant pairs newest-first.
  5. Sliding window: add pairs until `estimateTokens(window)` would exceed `tokenBudget`, but always keep a minimum of 2 pairs even if over budget. Track `evictedCount`.
  6. If `options.pageContext` is provided: build a page context block for `options.currentPage ± 1` using the same `extractFocusedPageContext` logic from `useSession.js`. Add it to the messages array. If still over budget, trim to single page only.
  7. Add the new user message: `{ role: 'user', content: aiContextMessage }`.
  8. If `evictedCount > 0`, log: `console.log('[contextManager] Evicted ${evictedCount} messages. Token estimate: ${tokenEstimate}')`.
  9. Return the assembled result.

---

### Task 9: Wire `contextManager.js` into `src/hooks/useSession.js`

**References:** Requirements 3.1–3.7, Design §Phase 3

Modify `src/hooks/useSession.js`:

1. Import `buildContextMessages` from `../utils/contextManager`.
2. Remove the inline `contextMessages` array construction and the `historicalMessages` map that currently builds `contextualMessages`.
3. Replace with:
   ```js
   const { messages: contextualMessages } = buildContextMessages(
     messages,
     finalContextMessage,
     activeSession,
     28000,
     { currentPage: requestedPage, pageContext: fullText }
   );
   ```
   where `requestedPage` and `fullText` are extracted from the study-mode path (already parsed earlier in the function).
4. Remove the `extractFocusedPageContext` helper function from `useSession.js` — it is now handled inside `contextManager.js`.
5. The `finalContextMessage` passed to `buildContextMessages` should be the raw user question only (not the full assembled study-mode block), since `contextManager` handles page context injection via `options.pageContext`.

---

## Phase 4 — Spaced Repetition Scheduler

### Task 10: Create `src/appwrite/studySchedule.js`

**References:** Requirements 4.1–4.12, Design §Phase 4

Create the new file `src/appwrite/studySchedule.js`:

```js
import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const STUDY_SCHEDULE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_STUDY_SCHEDULE_COLLECTION_ID;
```

Implement the following exports:

- **`applySM2(record, confidence)`** — Pure function. Accepts `{ interval, easeFactor, repetitions }` and `confidence` (1, 2, or 3). Returns updated `{ interval, easeFactor, repetitions, nextReviewDate }` (ISO 8601 `YYYY-MM-DD` UTC string) according to the SM-2 rules:
  - confidence 1 (hard): `repetitions = 0`, `interval = 1`, `easeFactor = Math.max(1.3, easeFactor - 0.2)`, `nextReviewDate = today + 1 day`
  - confidence 2 (okay): `repetitions += 1`, `interval = Math.max(1, Math.floor(interval * easeFactor * 0.9))`, `easeFactor` unchanged, `nextReviewDate = today + interval days`
  - confidence 3 (easy): `repetitions += 1`, `interval = Math.max(1, Math.floor(interval * easeFactor))`, `easeFactor = Math.min(4.0, easeFactor + 0.1)`, `nextReviewDate = today + interval days`
  - Clamp: if computed `nextReviewDate` is not strictly after today, set it to today + 1 day.

- **`upsertStudySchedule(userId, sessionId, subject, topic, confidence)`** — Async. Queries the `studySchedule` collection for an existing record matching `userId`, `sessionId`, and `topic`. If not found: creates a new document with initial state `{ userId, sessionId, subject, topic, repetitions: 0, easeFactor: 2.5, interval: 1, nextReviewDate: today + 1 day }`. If found: calls `applySM2(existingRecord, confidence)` and updates the document. On Appwrite write failure: does NOT throw — instead returns `null` and lets the caller handle the error display.

- **`getDueSchedules(userId)`** — Async. Queries the `studySchedule` collection for all records where `userId` equals the given value AND `nextReviewDate` is less than or equal to today's UTC date string (`YYYY-MM-DD`). Returns the array of documents. On failure, throws so the caller can display an isolated error.

---

### Task 11: Extend `src/pages/modes/ActiveRecall.jsx` to call `upsertStudySchedule`

**References:** Requirements 4.1, 4.10, Design §Phase 4 `ActiveRecall`

Modify `src/pages/modes/ActiveRecall.jsx`:

1. Import `upsertStudySchedule` from `../../appwrite/studySchedule`.
2. Add state: `const [scheduleError, setScheduleError] = useState(null)`.
3. In `handleConfidenceRating(confidence)`:
   - Derive `topic`: take the last assistant message's `content`, trim to the first 80 characters. Fall back to `activeSession.subject` if no assistant message exists or the content is empty.
   - Call `upsertStudySchedule(user.$id, activeSession.$id, activeSession.subject, topic, confidence)` in a try/catch.
   - On failure: set `scheduleError` to a user-friendly message (e.g., `'Could not save review schedule. Your session continues normally.'`). Clear it after 5 seconds using `setTimeout`.
   - On success: clear `scheduleError`.
4. Render a dismissible toast notification when `scheduleError` is non-null. The toast must:
   - Be visible for at least 5 seconds (auto-dismiss via `setTimeout`).
   - Have a manual dismiss button (✕).
   - Not block, pause, or overlay the chat interface.
   - Use inline styles or a new CSS class `schedule-error-toast` in `ActiveRecall.css` (or the nearest existing stylesheet).

---

### Task 12: Add "Due for Review" section to `src/pages/Dashboard.jsx`

**References:** Requirements 4.6–4.9, 4.11, Design §Phase 4 `Dashboard`

Modify `src/pages/Dashboard.jsx`:

1. Import `getDueSchedules` from `../appwrite/studySchedule`.
2. Add state: `const [dueSchedules, setDueSchedules] = useState([])` and `const [scheduleError, setScheduleError] = useState(null)`.
3. In `loadDashboardData`, add a parallel call (alongside the existing flashcard load):
   ```js
   getDueSchedules(user.$id)
     .then(schedules => setDueSchedules(schedules))
     .catch(err => setScheduleError('Could not load review schedule.'));
   ```
4. Add a "Due for Review" section **above** the "Recent Study Sessions" section. The section must:
   - Show a heading with a clock/calendar icon.
   - If `scheduleError` is non-null: display the error message inside the section only (do not affect the rest of the Dashboard).
   - If `dueSchedules.length === 0` and no error: display `"No reviews due today"`.
   - If `dueSchedules.length > 0`: render a list where each item shows:
     - Subject
     - Topic label
     - Session title (query from `sessions` state by matching `sessionId`, or display `sessionId` as fallback)
     - Days overdue: `Math.floor((Date.now() - new Date(schedule.nextReviewDate).getTime()) / 86400000)` — display `"Due today"` when 0, `"{n} day(s) overdue"` when > 0.
   - Each item is clickable and navigates to `/session/{schedule.sessionId}`.
5. Add the `VITE_APPWRITE_STUDY_SCHEDULE_COLLECTION_ID` variable to `.env` with a placeholder value `your_study_schedule_collection_id_here` (do not overwrite any existing value if already present).

---

## Testing

### Task 13: Property-Based Tests for Phase 1 (PDF Extraction)

**References:** Design §Properties 1–4, §Testing Strategy

Install `fast-check` as a dev dependency: `npm install --save-dev fast-check`.

Create `src/utils/__tests__/pdfProcessor.test.js`:

```js
// Feature: omni-content-pipeline
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeGarbageRatio, classifyPage, wrapPageContent } from '../pdfProcessor';
```

Write the following tests:

1. **Property 1 — Page classification correctness** (`fc.property`):
   - Generate arbitrary arrays of strings and arbitrary thresholds (0–1).
   - Assert: `classifyPage(items, threshold) === 'bad'` iff `items.length === 0` OR `computeGarbageRatio(items.join('')) > threshold`.
   - `numRuns: 100`.

2. **Property 2 — Page content wrapper format** (`fc.property`):
   - Generate arbitrary positive integers (pageNum) and arbitrary strings (content).
   - Assert: result starts with `=== PAGE {pageNum} ===`, ends with `=== END PAGE {pageNum} ===`, and contains `content` verbatim.
   - `numRuns: 100`.

3. **Property 3 — Progress callback invoked exactly once per page** (example-based with mock):
   - Mock a 3-page PDF where page 1 is good, page 2 is bad (Gemini returns Markdown), page 3 is bad (Gemini times out → placeholder).
   - Assert the `onProgress` callback is called exactly 3 times with ascending `pageNum` values.

4. **Property 4 — All-placeholder PDF throws** (example-based):
   - Mock a 2-page PDF where both pages trigger the placeholder path.
   - Assert `extractText` throws with a message containing `'no readable content'`.

---

### Task 14: Property-Based Tests for Phase 2 (Streaming)

**References:** Design §Properties 5–6, §Testing Strategy

Create `src/hooks/__tests__/useDeepSeek.streaming.test.js`:

1. **Property 5 — Streaming assembly invariant** (`fc.property`):
   - Generate arbitrary arrays of non-empty strings (chunks).
   - Mock `fetch` to return a `ReadableStream` that emits those chunks as SSE `data:` lines followed by `data: [DONE]`.
   - Call `askStream` and collect the assembled result.
   - Assert: assembled result equals `chunks.join('')`.
   - `numRuns: 100`.

2. **Property 6 — In-place streaming message accumulation** (example-based):
   - Render a minimal React component that uses `sendMessageStreaming` from a mocked `SessionContext`.
   - Deliver 5 chunks sequentially.
   - After each chunk, assert the placeholder message's `content` equals the concatenation of chunks delivered so far.

3. **Unit test — Retry fires at most 2 times** (example-based):
   - Mock `fetch` to always throw a network error.
   - Assert `askStream` calls `fetch` exactly 3 times (initial + 2 retries) before throwing.

4. **Unit test — `[DONE]` sentinel closes the stream** (example-based):
   - Mock a stream that emits one chunk then `[DONE]`.
   - Assert the returned promise resolves (does not hang).

---

### Task 15: Property-Based Tests for Phase 3 (Context Manager)

**References:** Design §Properties 7–9, §Testing Strategy

Create `src/utils/__tests__/contextManager.test.js`:

1. **Property 7 — Token budget never exceeded** (`fc.property`):
   - Generate arbitrary arrays of `{ role, content }` messages (role alternating user/assistant, content up to 2000 chars each) and arbitrary `tokenBudget` values (500–28000).
   - Call `buildContextMessages(messages, 'test question', { subject: 'Math', mode: 'active_recall' }, tokenBudget)`.
   - Assert: `estimateTokens(result.messages) <= tokenBudget` OR the mandatory minimum (2 priming + 2 pairs) alone exceeds the budget.
   - `numRuns: 100`.

2. **Property 8 — Priming messages always retained and no mid-string truncation** (`fc.property`):
   - Generate large message histories that force eviction.
   - Assert: the first two messages in the output are exactly the priming messages (string equality).
   - Assert: every message in the output is an exact match of a message from the input (no partial strings).
   - `numRuns: 100`.

3. **Property 9 — Session Memory block character limits** (`fc.property`):
   - Generate message histories with more than 4 assistant messages.
   - Call `buildSessionMemory(messages)`.
   - Assert: result contains at most 3 segments, each ≤ 500 chars, total ≤ 1500 chars.
   - `numRuns: 100`.

4. **Unit test — Eviction count logged** (example-based):
   - Spy on `console.log`.
   - Call `buildContextMessages` with a history large enough to trigger eviction.
   - Assert `console.log` was called with a message containing `'Evicted'`.

---

### Task 16: Property-Based Tests for Phase 4 (SM-2 Scheduler)

**References:** Design §Properties 10–12, §Testing Strategy

Create `src/appwrite/__tests__/studySchedule.test.js`:

1. **Property 10 — SM-2 invariants across all confidence levels** (`fc.property`):
   - Generate arbitrary `{ interval: integer(1–365), easeFactor: float(1.3–4.0), repetitions: integer(0–100) }` and `confidence: integer(1–3)`.
   - Call `applySM2(record, confidence)`.
   - Assert all simultaneously:
     - `result.easeFactor >= 1.3 && result.easeFactor <= 4.0`
     - `result.interval >= 1`
     - `result.nextReviewDate > todayString` (strictly after today)
     - confidence 1: `result.repetitions === 0`, `result.interval === 1`, `result.easeFactor === Math.max(1.3, record.easeFactor - 0.2)`
     - confidence 2: `result.repetitions === record.repetitions + 1`, `result.interval === Math.max(1, Math.floor(record.interval * record.easeFactor * 0.9))`, `result.easeFactor === record.easeFactor`
     - confidence 3: `result.repetitions === record.repetitions + 1`, `result.interval === Math.max(1, Math.floor(record.interval * record.easeFactor))`, `result.easeFactor === Math.min(4.0, record.easeFactor + 0.1)`
   - `numRuns: 100`.

2. **Property 11 — Due schedules filter correctness** (example-based with mocked Appwrite):
   - Create a set of schedule records with `nextReviewDate` values spanning yesterday, today, and tomorrow.
   - Mock `databases.listDocuments` to return all records.
   - Assert `getDueSchedules` returns only records with `nextReviewDate <= today`.

3. **Property 12 — Days-overdue calculation correctness** (`fc.property`):
   - Generate arbitrary past dates (0–30 days ago).
   - Compute the days-overdue value using the same formula as the Dashboard.
   - Assert: result equals `Math.floor((now - date) / 86400000)` and is 0 when the date is today.
   - `numRuns: 100`.

4. **Unit test — New record initialised with correct defaults** (example-based with mocked Appwrite):
   - Mock `databases.listDocuments` to return empty (no existing record).
   - Mock `databases.createDocument` to capture the payload.
   - Call `upsertStudySchedule(...)` with any confidence.
   - Assert the created document has `repetitions: 0`, `easeFactor: 2.5`, `interval: 1`, and `nextReviewDate` equal to tomorrow's UTC date.

5. **Unit test — Appwrite write failure does not throw** (example-based):
   - Mock `databases.createDocument` to throw.
   - Call `upsertStudySchedule(...)`.
   - Assert it returns `null` without throwing.
