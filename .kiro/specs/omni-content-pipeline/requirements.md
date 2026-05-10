# Requirements Document

## Introduction

The **Omni-Content Pipeline** is a four-phase upgrade to the LastWeek AI study platform that addresses the four most significant limitations in the current system:

1. **Phase 1 — Smart Extraction with Vision Fallback**: The current PDF processor (`pdfProcessor.js`) silently fails on scanned pages, image-heavy PDFs, and documents with non-Latin or symbol-heavy fonts (e.g., Bengali, Arabic, physics equations). This phase adds a quality-detection step after PDF.js extraction and routes low-quality pages to Gemini Vision for image-based OCR and Markdown conversion, ensuring every page yields clean, readable text.

2. **Phase 2 — Streaming Responses**: DeepSeek responses are currently fetched in a single blocking call; students see a loading spinner for 10–30 seconds before any text appears. This phase switches to server-sent event (SSE) streaming so tokens are displayed incrementally as they are generated.

3. **Phase 3 — Smart Context with Sliding Window**: Conversation history and PDF context are currently truncated with a hard `substring(0, 15000)` cut, which can silently drop important context or still overflow the model's token budget. This phase replaces that with a token-budget-aware sliding window that keeps the most recent messages and a rolling session summary.

4. **Phase 4 — Spaced Repetition Scheduler**: Active Recall mode collects confidence ratings (1 = hard, 2 = okay, 3 = easy) but discards them after computing a fixed next-review date. This phase persists a full SM-2 schedule record per topic and surfaces due items on the Dashboard.

---

## Glossary

- **PDF.js**: Client-side JavaScript library (`pdfjs-dist`) used to parse PDF binary data and extract text items with positional metadata.
- **Vision Fallback**: The process of rendering a PDF page to a raster image and sending it to Gemini Vision when PDF.js text extraction yields insufficient or garbled text.
- **Garbage-Character Density**: The ratio of non-printable, replacement (U+FFFD), or visually nonsensical characters to total characters on a page, used to detect font-encoding failures.
- **OCR (Optical Character Recognition)**: Conversion of a raster image of text into machine-readable characters; performed here by Gemini Vision.
- **Base64 PNG**: A lossless raster image encoded as a Base64 string, used to transmit a rendered PDF page to the Gemini Vision API.
- **SSE (Server-Sent Events)**: A unidirectional HTTP streaming protocol where the server pushes newline-delimited `data:` chunks to the client; used by the DeepSeek API when `stream: true`.
- **Streaming Response**: An AI response delivered incrementally as tokens are generated, rather than as a single payload after full generation.
- **Token Budget**: The maximum number of tokens allocated for the messages array sent to the language model; estimated at 4 characters per token with a budget of 28,000 tokens for message history.
- **Sliding Window**: A context-management strategy that retains the most recent messages that fit within the token budget, discarding older messages when the budget is exceeded.
- **Session Memory**: A rolling plain-text summary of the last three AI responses, prepended to the context window to preserve topic continuity when older messages are evicted.
- **SM-2 Algorithm**: The SuperMemo 2 spaced repetition algorithm that computes the next review interval and an ease factor from a confidence rating (1–3 mapped to SM-2 quality 0–5).
- **Ease Factor (EF)**: A floating-point multiplier (minimum 1.3) in the SM-2 algorithm that scales the review interval; starts at 2.5 and adjusts based on confidence ratings.
- **Repetition Count**: The number of consecutive successful reviews of a topic; resets to 0 when confidence is rated 1 (hard).
- **StudySchedule**: An Appwrite database document that stores the SM-2 state (interval, ease factor, repetition count, next review date) for a specific topic within a session.
- **Due for Review**: A topic whose `nextReviewDate` is on or before the current calendar date.
- **Gemini Vision**: The multimodal capability of the Gemini model (`gemini-flash-latest`) that accepts inline image data alongside a text prompt.
- **DeepSeek**: The primary teaching AI (`deepseek-chat`) used for all text reasoning and educational responses.
- **Appwrite**: The backend-as-a-service platform providing authentication, database, and file storage for the platform.
- **Canvas Render**: The process of drawing a PDF page onto an HTML `<canvas>` element at a specified scale and exporting it as a PNG image.

---

## Requirements

### Requirement 1: Smart PDF Extraction with Vision Fallback

**User Story:** As a student, I want to upload any PDF — including scanned textbooks, handwritten notes, and documents with non-Latin scripts or mathematical equations — so that I can study the content without manually copying text.

#### Acceptance Criteria

1. WHEN a PDF page is extracted by the PDF Processor AND the page yields zero text items, THEN the PDF Processor SHALL classify that page as a bad page and route it to the Vision Fallback.

2. WHEN a PDF page is extracted by the PDF Processor AND the ratio of garbage characters (non-printable, replacement character U+FFFD, or characters outside the Basic Multilingual Plane that are not CJK Unified Ideographs) to total characters exceeds 0.3, THEN the PDF Processor SHALL classify that page as a bad page and route it to the Vision Fallback.

3. WHEN a page is routed to the Vision Fallback, THEN the PDF Processor SHALL render that page to a canvas at a minimum scale of 1.5 and export it as a Base64-encoded PNG. IF the canvas render itself fails, THEN the PDF Processor SHALL insert the placeholder defined in criterion 6 for that page and continue without throwing.

4. WHEN a Base64 PNG of a page is sent to the Vision Processor, THEN the Vision Processor SHALL return a Markdown representation of the page content, preserving headings, lists, tables, and mathematical expressions as Markdown; any content that cannot be mapped to those structures SHALL be returned as plain-text paragraphs.

5. WHEN the Vision Processor returns a Markdown result for a bad page, THEN the PDF Processor SHALL substitute that Markdown in place of the failed PDF.js extraction for that page, using the same `=== PAGE X === ... === END PAGE X ===` wrapper format.

6. WHEN the Vision Processor call fails or exceeds a 30-second timeout for a bad page, THEN the PDF Processor SHALL insert a placeholder `[Page X: image-only — could not extract text]` in the page slot and continue processing remaining pages without throwing.

7. WHEN all pages have been processed (via PDF.js or Vision Fallback), THEN the PDF Processor SHALL return the combined text only if at least one page yielded at least 1 character of non-placeholder content; otherwise it SHALL throw an error with a descriptive message.

8. WHEN a PDF is processed with Vision Fallback enabled, THEN the PDF Processor SHALL invoke the caller-supplied progress callback exactly once per page immediately after that page completes processing, passing an object containing: `pageNum` (integer), `method` (`"pdfjs"` or `"vision"`), `charCount` (integer), and `garbageRatio` (float 0–1).

---

### Requirement 2: Streaming AI Responses

**User Story:** As a student, I want to see the AI's response appear word-by-word as it is generated, so that I can start reading immediately instead of waiting for the full response.

#### Acceptance Criteria

1. WHEN the AI Client sends a request to the DeepSeek API with streaming enabled, THEN the AI Client SHALL open an SSE connection and begin receiving response chunks before the full response is complete.

2. WHEN an SSE chunk is received, THEN the AI Client SHALL parse the `data:` field, extract the delta text, and invoke the caller-supplied `onChunk` callback with that text fragment.

3. WHEN the SSE stream emits a `[DONE]` sentinel, THEN the AI Client SHALL close the stream and resolve the response with the fully assembled text.

4. WHEN the Session Manager receives a streaming AI request, THEN the Session Manager SHALL create a placeholder AI message in the local message state immediately and update that message's content in-place as each chunk arrives.

5. WHEN a streaming response is in progress, THEN the Chat Interface SHALL display the partial message text with a visible typing indicator appended to the end of the current text.

6. WHEN a streaming response completes, THEN the Session Manager SHALL persist the final assembled message to the Appwrite database exactly once.

7. IF the SSE connection is interrupted before the `[DONE]` sentinel is received, THEN the AI Client SHALL retry the request up to 2 times with a 2-second delay between attempts before surfacing an error to the caller.

8. WHILE a streaming response is in progress, THE Session Manager SHALL prevent the user from sending a new message (the send control SHALL be disabled).

---

### Requirement 3: Smart Context with Sliding Window

**User Story:** As a student, I want the AI to remember the full context of my current study session without errors or silent truncation, so that long conversations and large PDFs do not cause the AI to lose track of what we discussed.

#### Acceptance Criteria

1. WHEN the Context Manager builds the messages array for an AI request, THEN the Context Manager SHALL estimate token count as `ceil(totalCharacters / 4)` — where `totalCharacters` is the sum of character lengths of all role and content fields in the messages array — and SHALL include only the most recent messages that fit within a 28,000-token budget.

2. WHEN messages are evicted from the context window due to the token budget, THEN the Context Manager SHALL always retain the two fixed context-priming messages (subject/mode declaration and AI acknowledgement) regardless of their age, and the sliding window SHALL retain a minimum of 2 user/assistant message pairs even if doing so exceeds the token budget.

3. WHEN the session contains more than 3 AI responses and older messages are being evicted, THEN the Context Manager SHALL prepend a Session Memory block — constructed by client-side concatenation of the last 3 AI response texts, each truncated to 500 characters, separated by newlines — before the sliding window of user/assistant messages. The Session Memory block SHALL NOT exceed 1,500 characters total.

4. WHEN a PDF study query is being processed AND a `currentPage` value is available, THEN the Context Manager SHALL include the focused page context (current page ± 1 page) within the token budget, counting its characters against the 28,000-token limit. IF no `currentPage` is available, THEN the Context Manager SHALL use the first available page as the focused context.

5. WHEN the total context (priming messages + session memory + page context + sliding window) exceeds the 28,000-token budget, THEN the Context Manager SHALL reduce the sliding window first (removing oldest pairs), then reduce the page context (trimming to the single current page only), and SHALL NOT evict the priming messages or session memory.

6. THE Context Manager SHALL never silently truncate a message mid-string; it SHALL include a message in full or exclude it entirely.

7. WHEN the Context Manager evicts one or more messages, THEN the Context Manager SHALL log the number of evicted messages and the resulting token estimate to the browser console.

---

### Requirement 4: Spaced Repetition Scheduler

**User Story:** As a student, I want the platform to schedule my Active Recall reviews using my past confidence ratings, so that I am reminded to revisit difficult topics at the right time and can track what is due for review today.

#### Acceptance Criteria

1. WHEN a student submits a confidence rating (1, 2, or 3) in Active Recall mode, THEN the Scheduler SHALL create or update a StudySchedule record in the Appwrite `studySchedule` collection for the combination of (userId, sessionId, topic), using an upsert strategy (update if exists, create if not).

2. WHEN a StudySchedule record is created for the first time, THEN the Scheduler SHALL initialise it with `repetitions = 0`, `easeFactor = 2.5`, `interval = 1`, and `nextReviewDate` set to the current UTC date plus 1 day (formatted as ISO 8601 date string `YYYY-MM-DD`).

3. WHEN a confidence rating of 1 (hard) is submitted for an existing StudySchedule record, THEN the Scheduler SHALL reset `repetitions` to 0, set `interval` to 1, decrease `easeFactor` by 0.2 (minimum 1.3), and set `nextReviewDate` to the current UTC date plus 1 day.

4. WHEN a confidence rating of 2 (okay) is submitted for an existing StudySchedule record, THEN the Scheduler SHALL increment `repetitions` by 1, set `interval` to `max(1, floor(previousInterval × easeFactor × 0.9))`, leave `easeFactor` unchanged, and set `nextReviewDate` to the current UTC date plus the new interval in days.

5. WHEN a confidence rating of 3 (easy) is submitted for an existing StudySchedule record, THEN the Scheduler SHALL increment `repetitions` by 1, set `interval` to `max(1, floor(previousInterval × easeFactor))`, increase `easeFactor` by 0.1 (maximum 4.0), and set `nextReviewDate` to the current UTC date plus the new interval in days.

6. WHEN the Dashboard is loaded for a logged-in user, THEN the Dashboard SHALL query the `studySchedule` collection for all records belonging to that user where `nextReviewDate` is on or before the current UTC calendar date and display them in a "Due for Review" section.

7. WHEN the "Due for Review" section is displayed, THEN the Dashboard SHALL show for each due item: the subject, the topic label, the session title, and the number of days overdue, calculated as `floor((currentUTCDate − nextReviewDate) in whole days)` (0 if due today).

8. WHEN the "Due for Review" section is displayed AND no items are due, THEN the Dashboard SHALL display a "No reviews due today" message in place of the list.

9. WHEN a student clicks a due item in the "Due for Review" section, THEN the Dashboard SHALL navigate to the Active Recall session associated with that StudySchedule record.

10. IF the Appwrite write for a StudySchedule record fails, THEN the Scheduler SHALL display a dismissible notification visible for a minimum of 5 seconds that does not pause, block, or terminate the Active Recall session.

11. IF the Appwrite query for due items on the Dashboard fails, THEN the Dashboard SHALL display an error message within the "Due for Review" section without affecting the rest of the Dashboard.

12. THE `studySchedule` Appwrite collection SHALL contain the following fields: `userId` (string), `sessionId` (string), `subject` (string), `topic` (string), `nextReviewDate` (ISO 8601 date string `YYYY-MM-DD`, UTC), `interval` (integer, days), `easeFactor` (float), `repetitions` (integer).

---

## Open Questions and Ambiguities

### Phase 1

- **OQ-1.1 — Garbage-character threshold**: The 0.3 ratio is a proposed default. PDFs with mixed Latin and CJK content may trigger false positives. Should the threshold be configurable per-session or per-upload?
- **OQ-1.2 — Canvas scale**: Scale 1.5 is proposed for the canvas render. Higher scales (2.0–3.0) improve OCR accuracy but increase base64 payload size and Gemini API latency. What is the acceptable trade-off?
- **OQ-1.3 — Gemini Vision rate limits**: If a 50-page scanned PDF triggers 50 Vision Fallback calls in sequence, Gemini's free-tier rate limits may be hit. Should Vision Fallback calls be batched or rate-limited client-side?
- **OQ-1.4 — Appwrite 10 MB storage limit**: A scanned PDF with Vision Fallback produces a larger extracted-text payload than a native PDF. The existing 10 MB Appwrite bucket limit applies to the original file, not the extracted text. No change needed here, but confirm.

### Phase 2

- **OQ-2.1 — Streaming in study mode**: The current study-mode path in `useSession.js` builds a focused context and calls `askDeepSeek` directly. Should streaming apply to study-mode queries as well, or only to regular chat messages?
- **OQ-2.2 — Database persistence timing**: The current `sendMessage` in `SessionContext` saves the AI message after the full response. With streaming, the message is assembled incrementally. Should partial messages be saved as drafts, or only the final assembled message?
- **OQ-2.3 — Gemini pre-analysis and streaming**: The `useSession` hook runs a Gemini pre-analysis step before calling DeepSeek for file-upload messages. Gemini does not stream. Should the streaming indicator appear only after Gemini finishes, or should there be a separate "analysing…" state?

### Phase 3

- **OQ-3.1 — Session Memory generation**: The requirement specifies "a plain-text summary of the last 3 AI responses." Who generates this summary — a dedicated Gemini/DeepSeek call, or a simple client-side concatenation/truncation of the last 3 responses? A dedicated summarisation call adds latency and cost.
- **OQ-3.2 — Token budget for PDF context**: The focused page context (current page ± 1) can itself be very large for dense textbooks. Should the page context have its own sub-budget (e.g., max 8,000 tokens) independent of the sliding window budget?

### Phase 4

- **OQ-4.1 — Topic extraction**: Requirement 4.1 references a "topic" field. The current Active Recall mode does not extract a topic label from the conversation. How should the topic be determined — from the session subject, from the last AI question, or entered manually by the student?
- **OQ-4.2 — Multiple ratings per session**: A student may rate confidence multiple times in a single session on the same topic. Should each rating update the same StudySchedule record (upsert), or create a new record?
- **OQ-4.3 — Existing flashcard SRS**: The platform already has a `flashcards` collection with `confidence` and `nextReviewAt` fields and a partial SM-2 implementation in `spacedRepetition.js`. The new `studySchedule` collection is separate and session/topic-scoped rather than flashcard-scoped. Should the two systems eventually be unified, or remain independent?
- **OQ-4.4 — Dashboard "Due for Review" empty state**: What should the Dashboard display when no items are due? A motivational message, a count of upcoming reviews, or nothing?
