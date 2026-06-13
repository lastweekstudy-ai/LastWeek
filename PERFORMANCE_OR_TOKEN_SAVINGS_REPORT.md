# Performance And Token Savings Report

Generated: 2026-06-13

## Changes Made

- Chat AI context now uses the saved session `summary` as a rolling memory block.
- AI context now keeps only the latest 6 user/assistant pairs by default, plus the current message and compact session memory.
- Rolling session summaries now run every 12 messages and on session unmount.
- Duplicate chat sends are blocked with an in-flight guard in `SessionContext`.
- Streaming UI updates remain buffered instead of updating React state on every chunk.
- Flashcard creation now has an in-memory save lock and duplicate lookup before creating a card.
- Resource title generation now routes through the secure AI provider instead of a browser-side direct DeepSeek key path.
- Local AI proxy source now trims oversized prompts and keeps only recent messages before forwarding to providers.

## Estimated Token Impact

- Old large session behavior could send dozens or hundreds of historical messages when a session had grown.
- New default sends: system prompt, rolling summary, last assistant memory, up to 6 recent pairs, focused PDF/audio context, and current user message.
- For a 100-message session, expected input reduction is commonly 70-90%, depending on PDF/audio context size.
- For old sessions with huge assistant responses, the proxy input guard prevents accidental oversized payloads if deployed.

## Collections And Attributes Used

- Existing `sessions.summary` stores rolling summaries. No new attribute was added.
- Existing `messages` pagination remains in use through `getSessionMessagesPaginated`.
- Existing `flashcards` fields are used for duplicate checks: `userId`, `sessionId`, `front`, `back`.

## Appwrite Index Needs

- No indexes were created in this pass.
- Recommended indexes remain documented in `INDEX_RECOMMENDATIONS.md`.
- Flashcard duplicate lookup benefits from an index on `flashcards(userId, sessionId)`.

## Function Package

- Local source changed: `appwrite-functions/aiProxyUniversal/index.js`.
- Deploying the package is still an admin decision. This pass did not deploy or modify live Appwrite functions.

## Remaining Safe Improvements

- Move AI summarization into a server function if summaries become too expensive client-side.
- Add a stable `contentHash` attribute for flashcards later, after a backup and schema approval.
- Add server-side idempotency keys for chat sends if the Appwrite function becomes the single write path.
