# Requirements: Enhanced Flashcard & MCQ System

## Mind Map

```
Enhanced Flashcard & MCQ System
├── FLASHCARD SYSTEM
│   ├── Auto-save (fix broken pipeline)
│   │   ├── Pass front/back from InlineFlashcard → onRate
│   │   └── Save to Appwrite on confidence rating
│   ├── Manual Creation
│   │   ├── "Create Flashcard" button in chat toolbar
│   │   └── Simple form: front / back / collection
│   ├── Collections
│   │   ├── NEW Appwrite collection: flashcard_collections
│   │   │   └── Fields: userId, name, color, icon, createdAt
│   │   ├── Add collectionId field to existing flashcards collection
│   │   ├── Default collection: "General"
│   │   └── Assign card to collection from InlineFlashcard or manually
│   ├── Review / Revision
│   │   ├── Flashcard Library page (already partially exists)
│   │   ├── Filter by collection
│   │   └── Spaced repetition (SM-2 already implemented)
│   └── Availability
│       ├── Normal chat ✓ (fix existing)
│       ├── Language learning (add hooks)
│       └── Exam sessions (add hooks)
│
└── MCQ SYSTEM
    ├── State Persistence (fix refresh bug)
    │   ├── Store answers in localStorage keyed by messageId
    │   ├── On load, restore answered state from localStorage
    │   └── MCQRenderer reads initial state from localStorage
    └── No new Appwrite collection needed (study_schedule already tracks MCQ)
```

## Problem Analysis

### Problem 1: Flashcards Always Show 0
**Root cause**: `InlineFlashcard.onRate(score)` only passes the confidence score — it does NOT pass `front` or `back`. So `createFlashcard` is called with `front='Flashcard'` and `back=''` as fallbacks. The cards ARE being saved (if the collection exists), but with empty content.

**Secondary issue**: The `flashcards` Appwrite collection may not exist or may have wrong permissions.

### Problem 2: MCQ Answers Reset on Refresh
**Root cause**: `InlineQuiz` uses local React state (`useState`) for `selected`/`revealed`. When the page refreshes, all state is lost. The message content in Appwrite still contains the raw `[MCQ]...[/MCQ]` markup, so it re-renders as unanswered.

**Fix**: Persist MCQ answers in `localStorage` keyed by `messageId + questionIndex`. On mount, restore state from localStorage.

## Requirements

### REQ-1: Fix Flashcard Auto-Save Pipeline
- When user rates a flashcard (clicks confidence button), the card MUST be saved to Appwrite with correct `front` and `back` content
- `InlineFlashcard` must pass `(score, front, back)` to `onRate`
- `EnhancedMessageFormatter` must forward `front`/`back` when wiring `onRate`
- `usePerformanceTracking.handleFlashcardRate(confidence, front, back)` already accepts these — just needs to receive them

### REQ-2: Manual Flashcard Creation
- A "＋ Flashcard" button appears in the chat toolbar (next to attachment/math buttons)
- Clicking opens a modal with: Front (textarea), Back (textarea), Collection (dropdown)
- On save, creates flashcard in Appwrite immediately (no AI needed)
- Available in all chat contexts (normal chat, language learning, exam sessions)

### REQ-3: Flashcard Collections
- **New Appwrite collection needed**: `flashcard_collections`
  - Fields: `userId` (string), `name` (string), `color` (string), `icon` (string), `createdAt` (datetime)
- **Existing `flashcards` collection needs new field**: `collectionId` (string, optional)
- Default collection: "General" (created automatically for new users)
- User can create/rename/delete collections from the Flashcard Library
- When rating an AI flashcard, user can pick a collection (or default to "General")

### REQ-4: Flashcard Library (Fix Count + Add Collections View)
- Dashboard flashcard count must reflect actual saved cards
- Flashcard Library page shows cards grouped by collection
- Filter/search by collection, subject, date
- Cards show front/back preview, confidence level, next review date
- "Review Due Cards" button starts a review session

### REQ-5: Flashcards in Language Learning & Exam Sessions
- Language learning lesson/practice pages must wire `onFlashcardRate` through `usePerformanceTracking`
- Exam session pages must wire `onFlashcardRate` through `usePerformanceTracking`
- The `InlineFlashcard` component is already used everywhere via `EnhancedMessageFormatter` — just needs the hook wired

### REQ-6: MCQ Answer Persistence
- When user answers an MCQ question, the answer is saved to `localStorage`
- Key format: `mcq_answers_{messageId}_{questionIndex}`
- On component mount, `InlineQuiz` checks localStorage for a saved answer
- If found: render in "already answered" state (show correct/wrong, explanation, no re-answering)
- If not found: render as fresh unanswered question
- localStorage is cleared when the session is deleted

## New Appwrite Collections Required

### `flashcard_collections` (NEW — you need to create this)
| Field | Type | Required |
|-------|------|----------|
| userId | String | Yes |
| name | String | Yes |
| color | String | No (default: #a855f7) |
| icon | String | No (default: 📚) |
| createdAt | DateTime | Yes |

### `flashcards` collection (EXISTING — add one field)
| New Field | Type | Required |
|-----------|------|----------|
| collectionId | String | No |
| source | String | No (values: 'ai', 'manual', 'language', 'exam') |
| subject | String | No |

## Task List

### Phase 1: Fix Core Bugs (no new collections needed)
- [ ] TASK-1: Fix `InlineFlashcard` to pass `front`/`back` to `onRate`
- [ ] TASK-2: Fix `EnhancedMessageFormatter` to forward `front`/`back` in flashcard wrapper
- [ ] TASK-3: Fix MCQ persistence with localStorage in `InlineQuiz`
- [ ] TASK-4: Wire `usePerformanceTracking` in language learning pages
- [ ] TASK-5: Wire `usePerformanceTracking` in exam session pages

### Phase 2: Collections & Manual Creation (needs new Appwrite collection)
- [ ] TASK-6: Create `flashcard_collections` Appwrite functions in `database.js`
- [ ] TASK-7: Build `FlashcardCreateModal` component
- [ ] TASK-8: Add "＋ Flashcard" button to `ChatInterface` toolbar
- [ ] TASK-9: Update `InlineFlashcard` to show collection picker after rating
- [ ] TASK-10: Update Flashcard Library to show collections view

### Phase 3: Polish
- [ ] TASK-11: Remove debug console.log statements from chart components
- [ ] TASK-12: Update dashboard stats to show correct count
