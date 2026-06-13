# Performance Audit Report

Generated from code inspection plus latest read-only Appwrite backup:

- Backup run: `backup/appwrite-2026-06-13T02-54-22-160Z`
- Manifest: `backup/manifest.json`
- Appwrite changes made: none
- Live data changed: none

## Backup Summary

- Databases exported: 1 (`lastweek_db`)
- Collections/tables exported: 34
- Users exported: 86
- Storage buckets exported: 1 (`pdfs`)
- Storage file metadata exported: 30

## Highest Impact Problems Found

### 1. Old session open was loading too much

Before this pass, session open called `getSessionMessagesWithChunks()` which queried up to 3000 message/chunk documents at once. Large old sessions had to finish loading and reassembling before the UI became usable.

Fix applied:

- Added paginated message loading in `src/appwrite/messageChunking.js`.
- Session open now loads the newest page first.
- Added `loadOlderMessages()` state support in `src/context/SessionContext.jsx`.
- Chat UI shows a `Load older messages` button when older history exists.

### 2. Chat rendering was too expensive

The chat rendered every message and reparsed markdown/charts/MCQs/flashcards repeatedly. Streaming also updated React state on every token/chunk.

Fix applied:

- Throttled streaming UI updates to reduce full-list state churn.
- Memoized `EnhancedMessageFormatter`.
- Added a lightweight render window in `ChatInterface` for very large loaded histories.
- Kept existing message behavior and existing formatter features.

### 3. Resource lists were transferring huge documents

PDF list queries fetched `extractedText`, `manifest`, and `figureRegistry`. Audio list queries fetched `transcript` and `lectureNotes`. These fields are only needed after opening the study view.

Fix applied:

- Added `Query.select()` to PDF list queries.
- Added `Query.select()` to audio lecture list queries.
- PDF/audio detail views now fetch the full document only when opened.

### 4. Dashboard initial load waited for secondary data

The dashboard waited for sessions, testing data, flashcards, storage usage, and exam plans before leaving the loading screen.

Fix applied:

- Dashboard renders after core session data loads.
- Flashcards, storage counts, and exam plans hydrate in the background.
- Storage usage no longer scans message `content`; it uses count-based estimates.

### 5. Public resource search had N+1 duplicate checks

Search and library pages checked whether each result had already been imported with one query per result.

Fix applied:

- Added `getUserImportedResourceIds()`.
- Resource search/library now fetch imported IDs once and compare locally.
- Public result list queries now avoid heavy text fields.

### 6. Language learning deleted data during read

`getLessonByModuleAndStage()` deleted duplicate lesson docs while reading. That is risky and should not happen during normal app usage.

Fix applied:

- Removed delete-on-read behavior.
- The function now returns the newest matching lesson only.
- Any duplicate cleanup should be a separate admin-only script after approval.

## Remaining Performance Risks

- Chat still keeps loaded messages in React state. The new page size and render window reduce the blast radius, but true virtualization would be a larger UI change.
- Public resource keyword search now avoids heavy `extractedText` / transcript scans. For deeper content search, add real full-text indexes and query them server-side.
- PDF/audio study views still render large notes/transcripts directly once opened. Further optimization would chunk or virtualize long transcript/note rendering.
- Some destructive helper functions still use unpaginated reads before delete, for example session deletion. They were not changed because this pass avoided risky behavior changes.
- Importing shared resources still copies large processed text/notes by design. This is functional behavior, not changed.

## Files Changed

- `package.json`
- `package-lock.json`
- `scripts/appwrite-backup.mjs`
- `src/appwrite/messageChunking.js`
- `src/appwrite/database.js`
- `src/context/SessionContext.jsx`
- `src/components/ChatInterface.jsx`
- `src/components/EnhancedMessageFormatter.jsx`
- `src/index.css`
- `src/appwrite/pdfResources.js`
- `src/appwrite/audioLecture.js`
- `src/components/PDFLibrary.jsx`
- `src/appwrite/resourceLibrary.js`
- `src/components/ResourceSearch.jsx`
- `src/pages/ResourceLibrary.jsx`
- `src/pages/DashboardEnhanced.jsx`
- `src/appwrite/languageLearning.js`

## Not Changed

- No Appwrite collections, attributes, indexes, users, files, or documents were changed.
- No live data cleanup was run.
- No indexes were created.
- `backup/` contents were not modified after the completed backup run.

## Verification

- `npm.cmd run build`: passed.
- `npm.cmd run lint`: failed on existing broad lint configuration/issues, including Appwrite function Node globals, bundled `public/pdf.worker.min.js`, unused imports, and older React hook lint findings. These failures were not introduced by the performance changes.
- `npm.cmd run test`: failed in existing PDF processor/context/AI streaming tests. The failures are tied to PDF worker setup, existing assertions, and Appwrite function-based AI calls in the test environment, not the Appwrite pagination/list-query changes.
