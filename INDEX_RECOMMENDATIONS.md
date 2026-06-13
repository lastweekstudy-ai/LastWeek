# Index Recommendations

Generated from:

- Actual schema backup: `backup/appwrite-2026-06-13T02-54-22-160Z`
- Query usage in `src/appwrite`, `src/pages`, and `src/components`

No indexes were created in this pass.

## Highest Priority

### `sessions`

Existing useful indexes include `userId`, `updatedAt`, and `userId_updatedAt`.

Recommended:

- `userId_mode_updatedAt`
  - Fields: `userId` asc, `mode` asc, `updatedAt` desc
  - Reason: dashboard/session list queries filter by `userId`, exclude `mode = exam_prep`, and sort by `updatedAt`.

### `messages`

Existing useful indexes include `sessionId_createdAt_compound`, `parentMessageId_idx`, and `userId_createdAt_compound`.

No urgent new index required for the new paginated loader.

Potential cleanup:

- Keep `sessionId + createdAt` and `parentMessageId`.
- There are overlapping indexes using both `createdAt` and `$createdAt`; after monitoring, remove duplicates only with admin approval.

### `pdf_resources`

Existing useful indexes include `userId_lastAccessedAt_compound`, `sessionId_lastAccessedAt_compound`, `public_index`, `user_original_pdf_idx`, and `cacheKey`.

Recommended:

- `userId_category_lastAccessedAt`
  - Fields: `userId` asc, `category` asc, `lastAccessedAt` desc
  - Reason: `getPDFsByCategory()`.

- `userId_isFavorite_lastAccessedAt`
  - Fields: `userId` asc, `isFavorite` asc, `lastAccessedAt` desc
  - Reason: `getUserFavoritePDFs()`.

- `userId_studyTimeMinutes`
  - Fields: `userId` asc, `studyTimeMinutes` desc
  - Reason: `getMostStudiedPDFs()`.

- `userId_viewCount`
  - Fields: `userId` asc, `viewCount` desc
  - Reason: `getMostViewedPDFs()`.

- Full-text index on `tags`
  - Type: fulltext
  - Reason: `searchPDFsByTags()` uses `Query.search('tags', ...)`.

Optional future:

- Full-text index on `aiTitle`
  - Reason: enables public library search without downloading processed text.

### `audio_lectures`

Existing indexes are weak for current query usage. The index named `original_lecture_idx` appears to index `userId`, not `originalLectureId`.

Recommended:

- `userId_sessionId_createdAt`
  - Fields: `userId` asc, `sessionId` asc, `createdAt` desc
  - Reason: session resource panel filters audio by user/session and sorts by `createdAt`.

- `userId_createdAt`
  - Fields: `userId` asc, `createdAt` desc
  - Reason: fallback/user audio lecture list.

- `isPublic_createdAt`
  - Fields: `isPublic` asc, `createdAt` desc
  - Reason: public library audio browse.

- `originalLectureId`
  - Fields: `originalLectureId` asc
  - Reason: imported-audio tracking.

- `userId_originalLectureId`
  - Fields: `userId` asc, `originalLectureId` asc
  - Reason: duplicate import checks.

## Medium Priority

### `flashcards`

Existing indexes are mostly adequate, but confirm they match these queries:

- `userId_createdAt`
  - Fields: `userId` asc, `createdAt` desc
  - Reason: flashcard library list.

- `userId_nextReviewAt`
  - Fields: `userId` asc, `nextReviewAt` asc
  - Reason: due flashcard query.

- `userId_collectionId_createdAt`
  - Fields: `userId` asc, `collectionId` asc, `createdAt` desc
  - Reason: collection-specific flashcard lists.

### `flashcard_collections`

Recommended:

- `userId_name`
  - Fields: `userId` asc, `name` asc
  - Reason: collection selector/list sorts by `name`.

### `file_attachments`

Recommended if not already present:

- `sessionId_createdAt`
  - Fields: `sessionId` asc, `createdAt` desc
  - Reason: session attachment list.

### `session_context`

Recommended if not already present:

- `sessionId_userId`
  - Fields: `sessionId` asc, `userId` asc
  - Reason: context upsert/read.

- `userId_updatedAt`
  - Fields: `userId` asc, `updatedAt` desc
  - Reason: user context history.

### `pdf_notes`

Recommended:

- `pdfResourceId_pageNumber_createdAt`
  - Fields: `pdfResourceId` asc, `pageNumber` asc, `createdAt` desc
  - Reason: page notes.

- `userId_updatedAt`
  - Fields: `userId` asc, `updatedAt` desc
  - Reason: note search result ordering.

- Full-text index on `noteText`
  - Type: fulltext
  - Reason: `Query.search('noteText', ...)`.

### `pdf_highlights`

Recommended:

- `pdfResourceId_pageNumber_createdAt`
  - Fields: `pdfResourceId` asc, `pageNumber` asc, `createdAt` desc
  - Reason: page highlights.

## Language Learning

### `lang_lessons`

Existing indexes appear close to current usage.

Recommended:

- `userId_moduleId_stageName_createdAt`
  - Fields: `userId` asc, `moduleId` asc, `stageName` asc, `$createdAt` desc
  - Reason: newest lesson lookup.

- `userId_status`
  - Fields: `userId` asc, `status` asc
  - Reason: completed/in-progress lesson lists.

### `lang_flashcard_reviews`

Recommended:

- `userId_nextReview`
  - Fields: `userId` asc, `nextReview` asc
  - Reason: due review lookup.

- `userId_itemId`
  - Fields: `userId` asc, `itemId` asc
  - Reason: review upsert.

## Admin / Billing / Testing

### `subscriptions`

Recommended:

- `userId_createdAt`
  - Fields: `userId` asc, `createdAt` desc
  - Reason: latest subscription lookup.

### `usage_tracking`

Recommended:

- `userId_month`
  - Fields: `userId` asc, `month` asc
  - Reason: monthly usage upsert/read.

### `exam_plans`

Recommended:

- `userId_examDate`
  - Fields: `userId` asc, `examDate` asc
  - Reason: exam planner list.

### `pre_registrations`

Recommended:

- `status_type_createdAt`
  - Fields: `status` asc, `type` asc, `createdAt` desc
  - Reason: admin filtered lists.

- `promoCode`
  - Fields: `promoCode` asc
  - Reason: promo lookup.

### `user_reviews`

Recommended:

- `isApproved_isPublished_createdAt`
  - Fields: `isApproved` asc, `isPublished` asc, `createdAt` desc
  - Reason: public review list.

### `daily_free_slots`

Recommended:

- `date`
  - Fields: `date` asc
  - Reason: daily slot lookup.

### `daily_slot_usage`

Recommended:

- `date_userId`
  - Fields: `date` asc, `userId` asc
  - Reason: daily slot usage checks.

### `testing_usage`

Recommended:

- `userId`
  - Fields: `userId` asc
  - Reason: testing mode lookup.

- `email`
  - Fields: `email` asc
  - Reason: testing/pre-registration conversion lookup.

## Approval Needed Before Any Index Work

Creating indexes changes live Appwrite schema. Recommended next step is to add only the highest-priority indexes above, one collection at a time, after you approve.

