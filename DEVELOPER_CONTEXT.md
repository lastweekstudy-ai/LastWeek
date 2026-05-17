# LastWeek — Developer Context

Everything a new developer needs to understand the codebase, architecture decisions, and how all the pieces connect.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7 |
| Styling | Plain CSS (no Tailwind), CSS variables for theming |
| Backend/DB | Appwrite Cloud (auth, database, storage, functions) |
| AI | DeepSeek V3 → Groq Llama-3.3-70B → Gemini Flash (cascade) |
| Charts | Recharts |
| Math | KaTeX (via remark-math + rehype-katex) |
| Diagrams | Mermaid.js |
| PDF | react-pdf |
| Audio Storage | Cloudflare R2 |
| TTS | Gemini 2.5 Flash (via Appwrite function) |

---

## Architecture

### Data Flow
```
User types message
  → ChatInterface.jsx (UI)
  → useSession hook (state management)
  → sendMessageStreaming()
  → AI provider cascade (DeepSeek → Groq → Gemini)
  → streaming chunks update messages state
  → EnhancedMessageFormatter renders response
     ├── Detects flashcards → FlashcardSetRenderer
     ├── Detects MCQs → MCQRenderer → InlineQuiz
     ├── Detects [CHART:...] → ChartRenderer (Recharts)
     ├── Detects ```mermaid → MermaidDiagram
     ├── Detects [FIGURE:...] → SVGFigure
     └── Everything else → ReactMarkdown
  → Message saved to Appwrite
```

### Session System
- Every chat is a "session" stored in Appwrite `sessions` collection
- Sessions have a `mode` (mental_model, active_recall, focus_breakdown, collaborative_scholar, creative_synthesis, exam_prep)
- `useSession` hook manages: loading sessions, sending messages, streaming AI responses
- `SessionContext` provides session state to all components
- `SessionRoute` in `App.jsx` routes to the correct mode page based on `session.mode`

### AI Provider Cascade
Located in `src/hooks/useDeepSeek.js` (despite the name, it handles all three providers):
1. Try DeepSeek first
2. On failure/rate-limit → try Groq
3. On failure → try Gemini
4. All providers use the same message format (OpenAI-compatible)

### Prompt System
`src/utils/promptBuilder.js` exports one function per mode:
- `buildMentalModelPrompt(subject, sessionContext)`
- `buildActiveRecallPrompt(subject, sessionContext)`
- `buildFocusBreakdownPrompt(subject, sessionContext)`
- `buildCollaborativeScholarPrompt(subject, persona, sessionContext)`
- `buildCreativeSynthesisPrompt(subject, sessionContext)`

Each prompt includes:
1. `TEACHING_CORE_RULES` — curriculum completeness, depth rules
2. `FLASHCARD_AND_MCQ_RULES` — exact format for flashcards and MCQs
3. `VISUAL_EXAMPLES` — chart format enforcement
4. `MATH_RULES`, `SVG_RULES`, `MERMAID_RULES`
5. Student profile (from session assessment)
6. Mode-specific instructions

### Student Assessment
Before the first AI message in a session, the user completes a 4-question assessment:
- Knowledge level (complete_beginner / beginner / intermediate / advanced)
- Learning goal (exam_prep / deep_understanding / real_world_application / quick_overview)
- Time available (1-2_days / 3-5_days / 1-2_weeks / flexible)
- Preferred style (analogies / step_by_step / visual / stories)

This is stored in `session_context` collection and injected into every subsequent prompt via `buildStudentProfile()`.

---

## Key Components

### EnhancedMessageFormatter
`src/components/EnhancedMessageFormatter.jsx`

The most important rendering component. Processes every AI message:

1. Runs `processAIResponse()` from `chartFixer.js` — only on short responses (<2000 chars) with chart keywords
2. Checks for flashcard format (`**FRONT OF CARD**`) → renders `FlashcardSetRenderer`
3. Checks for MCQ format (`[MCQ]...[/MCQ]`) → renders `MCQRenderer`
4. Splits remaining content on chart/mermaid/figure markers
5. Renders each segment: chart → `ChartRenderer`, mermaid → `MermaidDiagram`, figure → `SVGFigure`, text → `ReactMarkdown`

**Critical:** Never run `processAIResponse` on lecture notes or long documents — the chartFixer will destroy them. The 2000-char limit and CSS property guard prevent this.

### usePerformanceTracking
`src/hooks/usePerformanceTracking.js`

Called by all 5 mode pages and ExamSession. Handles:
- `handleFlashcardRate(confidence, front, back)` — saves flashcard to Appwrite, updates SRS schedule
- `handleMCQAnswer(isCorrect, questionText)` — updates SRS schedule

### FlashcardLibrary
`src/pages/FlashcardLibrary.jsx`

Full flashcard management page at `/flashcards`:
- Shows all cards with "Due Today" highlighting
- Collections sidebar (create, delete, move cards between collections)
- Review mode (shows cards one at a time, rate confidence)
- Search across all cards
- Create manual flashcards via `FlashcardCreateModal`

### ExamSession
`src/pages/ExamSession.jsx`

Dedicated exam prep page at `/exam-session/:planId/:topicIndex`:
- Uses `es-*` CSS classes (all defined in `src/styles/ExamSession.css`)
- Left sidebar: topic list with progress dots
- Top bar: exam name, topic, days left, progress bar, Mark Done button
- Chat area: full ChatInterface
- Bypasses the 5-mode system entirely

### AudioLectureViewer
`src/components/AudioLectureViewer.jsx`

Renders audio lecture resources in the PDF Library panel:
- Audio player with playback controls
- Lecture notes tab (rendered via `EnhancedMessageFormatter`)
- Transcript tab with text highlighting
- Chat tab for asking questions about the lecture
- Highlight system: select text → save highlight → highlights persist in Appwrite

---

## CSS Architecture

No CSS framework. All styles are plain CSS with CSS custom properties.

### Theme Variables (defined in `src/styles/global.css`)
```css
--color-bg-primary      /* main background */
--color-bg-secondary    /* card/panel background */
--color-bg-tertiary     /* input/hover background */
--color-text-primary    /* main text */
--color-text-secondary  /* secondary text */
--color-text-muted      /* placeholder/disabled text */
--color-border          /* borders */
--color-accent          /* purple #a855f7 */
--color-accent-hover    /* darker purple */
--color-error           /* red */
--shadow-sm, --shadow-md, --shadow-lg
--border-radius
--spacing-xs/sm/md/lg
```

### CSS File Map
| File | Covers |
|---|---|
| `global.css` | CSS variables, reset, base styles |
| `ModePage.css` | All 5 mode pages layout |
| `ExamSession.css` | ExamSession `es-*` classes |
| `ChatInterface.css` | Chat UI |
| `MessageFormatter.css` | Message rendering |
| `InlineQuiz.css` | MCQ component |
| `mobile-responsive.css` | Mobile overrides |
| `FilePromptInput.css` | File upload input |
| `RichTextViewer.css` | Rich text display |
| `ErrorBoundary.css` | Error boundary UI |

---

## Spaced Repetition

`src/utils/spacedRepetition.js`

```js
getNextReviewDate(confidence):
  1 (Hard)  → now + 1 day
  2 (Okay)  → now + 3 days
  3 (Easy)  → now + 7 days
```

`getDueFlashcards(userId)` queries Appwrite for cards where `nextReviewAt <= now`.

---

## MCQ Persistence

MCQ answers are saved to `localStorage` with key `mcq_answer_{messageId}_q{questionNumber}`.

On component mount, `InlineQuiz` reads saved answers and fires `onAnswer({ restored: true })` to restore parent score state. The `MCQRenderer` in `EnhancedMessageFormatter` initialises `answers` state from localStorage so the score is correct on restore.

---

## Chart System

### Format
```
[CHART:bar:Title]
[{"name":"Label","value":85},...]
[/CHART]
```

### Auto-fix (`chartFixer.js`)
Only triggers when ALL conditions are true:
- Response is < 2000 chars
- No markdown headers (`# ...`)
- No CSS property names (`width:`, `radius:`, etc.)
- Contains a chart keyword (`bar chart`, `graph`, etc.)
- Does NOT already have `[CHART:...]` tags

Fixes: colon-separated data (`Category: 85`), table format, malformed `value\nCategory\n0612` format.

---

## Language Learning System

Routes: `/language-learning`, `/language-learning/lessons`, `/language-learning/lessons/:moduleId/:stageId`, `/language-learning/practice`

Collections: `lang_users`, `lang_roadmaps`, `lang_lessons`, `lang_lesson_attempts`, `lang_practice_sessions`, `lang_flashcard_reviews`, `lang_conversation_sessions`, `lang_user_points`, `lang_srs_items`

The language system has its own AI service (`src/services/languageAI.js`) with language-specific prompts separate from the study mode prompts.

---

## TTS System

Flow:
1. User clicks TTS button on a message
2. `src/tts/ttsService.js` checks `tts_cache_metadata` for cached audio
3. Cache miss → calls Appwrite function `geminiTTS`
4. Function calls Gemini 2.5 Flash TTS API
5. Audio stored in Cloudflare R2
6. URL saved to `tts_cache_metadata`
7. Audio plays in browser

---

## Common Patterns

### Adding a new Appwrite collection
1. Create collection in Appwrite console
2. Add env var to `.env`: `VITE_APPWRITE_NEWCOLLECTION_COLLECTION_ID=new_collection`
3. Add constant in `src/appwrite/database.js`: `const NEW_COLLECTION_ID = import.meta.env.VITE_APPWRITE_NEWCOLLECTION_COLLECTION_ID`
4. Export CRUD functions

### Adding a new study mode
1. Create `src/pages/modes/NewMode.jsx` (copy structure from `MentalModel.jsx`)
2. Add prompt builder in `promptBuilder.js`
3. Add route in `App.jsx`
4. Add case in `SessionRoute` switch
5. Add mode option in `ModeSelector.jsx`

### Adding a new chart type
1. Add case in `ChartRenderer.jsx` `renderChart()` switch
2. Add type to `CHART_REGEX` in `EnhancedMessageFormatter.jsx`
3. Add example to `VISUAL_EXAMPLES` in `promptBuilder.js`

---

## Testing

```bash
npm run test        # run all tests once
npm run test:watch  # watch mode
```

Tests are in `src/__tests__/` using Vitest + React Testing Library.

---

## Deployment

The app is a static SPA — build with `npm run build` and deploy `dist/` to any static host (Cloudflare Pages, Vercel, Netlify).

Appwrite functions are deployed separately:
```bash
# From appwrite-functions/geminiTTS/
appwrite functions createDeployment --functionId=<id> --entrypoint=index.js --code=.
```

---

## Debugging Tips

### Charts not rendering
- Check console for `[chartFixer]` and `[ChartRenderer]` logs
- Verify AI response contains `[CHART:bar:Title]` not `[CHART:type:title]`
- Check `dataStr` in the chart found log — must be valid JSON

### Flashcards showing wrong count
- Check console for `[extractFlashcards]` logs
- Verify AI response uses `===` between cards
- Check `FRONT OF CARD count` vs `Extracted` count in logs

### Audio lecture notes disappearing
- Check if `chartFixer` is triggering (look for "Content was modified by chart fixer" with length 10584 → 297)
- The lecture content should NOT trigger chartFixer (it's > 2000 chars and has markdown headers)
- If it does trigger, check `hasUnformattedChartData` guards in `chartFixer.js`

### Appwrite 404 on document
- The document ID stored in the app no longer exists in Appwrite
- Common with `pdf_resources` — the resource was deleted but the reference remains
- `PDFLibrary.jsx` handles this gracefully with a try/catch

### MCQ answers not persisting
- Check `localStorage` in DevTools → Application → Local Storage
- Keys should be `mcq_answer_{messageId}_q{n}`
- If `messageId` is undefined, the message wasn't saved to Appwrite yet
