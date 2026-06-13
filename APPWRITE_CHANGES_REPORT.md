# Appwrite Changes Report

Generated: 2026-06-13

## Live Appwrite Changes

None in this pass.

## Schema Changes

None.

## Index Changes

None.

## Document/User/File Changes

None made manually by Codex.

## Local Appwrite-Related Code Changes

- `src/utils/contextManager.js`: uses existing `sessions.summary` as compact rolling memory and caps recent pairs.
- `src/hooks/useSessionSummary.js`: saves summaries every 12 messages.
- `src/context/SessionContext.jsx`: blocks duplicate in-flight sends.
- `src/appwrite/database.js`: adds duplicate flashcard lookup and in-memory lock before creating a card.
- `src/appwrite/resourceLibrary.js`: routes AI title generation through secure AI provider.
- `appwrite-functions/aiProxyUniversal/index.js`: adds local proxy input trimming guards.

## Approval Needed Later

- Deploy the updated AI proxy package if you want server-side trimming live.
- Add recommended indexes from `INDEX_RECOMMENDATIONS.md` only after confirming they match Appwrite Console state.
- Optional future schema: add `flashcards.contentHash` for stronger duplicate prevention.
