# Usage Limits — Architecture & Implementation Plan

## Final Tier Configuration

| Limit | Free | Pro $9.99 | Plus $14.99 | Pro+ $19.99 |
|---|---|---|---|---|
| Sessions/month | 5 | 30 | 100 | Unlimited |
| AI Messages/month | 500 | 3,000 | 7,000 | Unlimited |
| PDF Uploads | 3 total (5MB) | 20/month (10MB) | 60/month (15MB) | Unlimited (20MB) |
| Audio Uploads | 1 total (10MB) | 10/month (25MB) | 30/month (50MB) | Unlimited (100MB) |
| Flashcards/month | 30 | Unlimited | Unlimited | Unlimited |
| MCQs/month | 20 | Unlimited | Unlimited | Unlimited |
| Language Learning | ❌ | ✅ | ✅ | ✅ |
| Exam Plans (active) | 1 | 3 | 10 | Unlimited |
| Library Import | Unlimited | Unlimited | Unlimited | Unlimited |
| TTS/month | 10 | 50 | 200 | Unlimited |
| Storage | 50MB | 500MB | 2GB | 10GB |

## Architecture

### How tier is determined
1. Check `user.labels` for `premium` (legacy — treat as Pro)
2. Check `subscriptions` collection for active subscription → get `plan` field
3. If no subscription → Free tier
4. Plan values: `free`, `pro`, `plus`, `pro_plus`

### Usage tracking — `usage_tracking` collection (NEW)
One document per user per month. Resets on the 1st of each month.

```
{
  userId: string,
  month: string (e.g. "2026-05"),
  sessionsCreated: number,
  messagesUsed: number,
  pdfsUploaded: number,
  audiosUploaded: number,
  flashcardsCreated: number,
  mcqsAnswered: number,
  ttsUsed: number,
  storageUsedBytes: number,
  updatedAt: string
}
```

### Enforcement points (where limits are checked)
1. **Session creation** → `useSession.startSession()` → check sessionsCreated < limit
2. **AI message send** → `useSession.sendMessageWithAI()` → check messagesUsed < limit
3. **PDF upload** → `PDFLibrary` / `FilePromptInput` → check pdfsUploaded < limit AND file size < max
4. **Audio upload** → `AudioProcessor` → check audiosUploaded < limit AND file size < max
5. **Flashcard creation** → `usePerformanceTracking.handleFlashcardRate()` → check flashcardsCreated < limit
6. **MCQ answer** → `usePerformanceTracking.handleMCQAnswer()` → check mcqsAnswered < limit
7. **Language Learning access** → route guard on `/language-learning/*` → check plan !== 'free'
8. **Exam plan creation** → `ExamPlanner` → check active plans < limit
9. **TTS play** → `ttsService` → check ttsUsed < limit

### New files to create
- `src/config/planLimits.js` — tier definitions (limits per plan)
- `src/hooks/useUsageLimits.js` — hook that loads usage, checks limits, provides `canDo(action)` and `getUsage()`
- `src/appwrite/usageTracking.js` — CRUD for usage_tracking collection
- `src/components/UsageLimitModal.jsx` — modal shown when user hits a limit (with upgrade CTA)

### Files to modify
- `src/hooks/useSession.js` — check session + message limits before creating/sending
- `src/hooks/usePerformanceTracking.js` — check flashcard + MCQ limits
- `src/components/PDFLibrary.jsx` — check PDF upload limit + file size
- `src/components/AudioProcessor.jsx` — check audio upload limit + file size
- `src/tts/useTTS.js` or `ttsService.js` — check TTS limit
- `src/pages/ExamPlanner.jsx` — check exam plan limit
- `src/pages/LanguageLearning.jsx` — block if free tier
- `src/App.jsx` — add route guard for language learning

### Appwrite changes needed
- Create `usage_tracking` collection with attributes listed above
- Add index: `userId + month` (compound, unique)

### Paddle changes needed
- Create 3 prices in Paddle:
  - Pro: $9.99/month (already exists: `pri_01ks7zcvs99ceath0325eq3j4x`)
  - Plus: $14.99/month (CREATE NEW)
  - Pro+: $19.99/month (CREATE NEW)
- Update webhook to set correct `plan` value based on price ID

## Task List

1. Create `src/config/planLimits.js`
2. Create `src/appwrite/usageTracking.js`
3. Create `src/hooks/useUsageLimits.js`
4. Create `src/components/UsageLimitModal.jsx`
5. Modify `useSession.js` — add limit checks
6. Modify `usePerformanceTracking.js` — add limit checks
7. Modify `PDFLibrary.jsx` — add upload limit checks
8. Modify `AudioProcessor.jsx` — add upload limit checks
9. Modify TTS service — add limit check
10. Modify `ExamPlanner.jsx` — add plan limit check
11. Add language learning route guard
12. Update webhook to map price IDs to plan names
13. Update `UpgradeButton` to show correct plan options
14. Test build
15. Write Appwrite setup instructions
