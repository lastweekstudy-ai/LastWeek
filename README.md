# LastWeek — AI-Powered Study Platform

> Master any subject in one week. AI tutoring, spaced-repetition flashcards, exam planning, language learning, audio lectures, and PDF study tools — all in one app.

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

Copy `.env.example` → `.env` and fill in your keys (see `INFRASTRUCTURE.md`).

---

## What It Does

LastWeek is a React + Vite SPA backed by Appwrite (auth + database + storage), three AI providers (DeepSeek, Groq, Gemini), and Cloudflare R2 for audio storage.

### 5 Study Modes
| Mode | Description |
|---|---|
| Mental Model | Concept-first teaching with analogies and visual aids |
| Active Recall | Socratic questioning and spaced-repetition quizzes |
| Focus Breakdown | Pomodoro-integrated deep-dive sessions |
| Collaborative Scholar | Debate and peer-review with historical personas |
| Creative Synthesis | Mind maps, storytelling, and project-based learning |

### Other Features
- **Exam Planner** — create an exam plan, auto-schedule topics by deadline, track progress
- **Language Learning** — structured roadmap, lessons, practice, SRS flashcards
- **Audio Lectures** — upload audio → AI generates lecture notes + transcript + highlights
- **PDF Study** — upload PDFs, highlight, annotate, ask AI questions about content
- **Flashcard Library** — all AI-generated flashcards saved with spaced-repetition scheduling
- **Inline MCQs** — multiple-choice questions in chat, answers persist across refreshes
- **Charts & Diagrams** — bar/line/pie/area charts (Recharts), Mermaid diagrams, SVG figures
- **TTS** — Gemini-powered text-to-speech via Appwrite function

---

## Project Structure

```
src/
├── appwrite/          # Appwrite SDK wrappers (database, auth, storage, exam planner, etc.)
├── components/        # Shared UI components
│   ├── ChatInterface.jsx
│   ├── EnhancedMessageFormatter.jsx   # Renders markdown, charts, flashcards, MCQs
│   ├── ChartRenderer.jsx              # Recharts wrapper
│   ├── InlineFlashcard.jsx
│   ├── InlineQuiz.jsx
│   ├── AudioLectureViewer.jsx
│   ├── PDFLibrary.jsx
│   └── ...
├── context/           # React context (Auth, Session, Theme)
├── hooks/             # Custom hooks (useSession, usePerformanceTracking, etc.)
├── pages/
│   ├── modes/         # MentalModel, ActiveRecall, FocusBreakdown, CollaborativeScholar, CreativeSynthesis
│   ├── ExamSession.jsx
│   ├── ExamPlanner.jsx
│   ├── FlashcardLibrary.jsx
│   ├── LanguageLearning.jsx
│   └── ...
├── services/          # AI provider clients (DeepSeek, Groq, Gemini)
├── styles/            # CSS files per component/page
├── tts/               # TTS service
└── utils/
    ├── promptBuilder.js    # All AI system prompts
    ├── chartFixer.js       # Auto-fix malformed AI chart output
    ├── spacedRepetition.js
    └── ...
appwrite-functions/
├── geminiTTS/         # Appwrite function: Gemini TTS
└── processYoutube/    # Appwrite function: YouTube transcript extraction
```

---

## AI System

### Providers (tried in order, first success wins)
1. **DeepSeek** (`VITE_DEEPSEEK_API_KEY`) — primary, best instruction-following
2. **Groq** (`VITE_GROQ_API_KEY`) — fast fallback, llama-3.3-70b
3. **Gemini** (`VITE_GEMINI_API_KEY`) — final fallback

### Chart Format
AI must output charts as:
```
[CHART:bar:Title]
[{"name":"Category","value":85},{"name":"Category2","value":92}]
[/CHART]
```
Types: `bar`, `line`, `pie`, `area`. The `chartFixer.js` utility auto-detects and repairs malformed chart output from the AI.

### Flashcard Format
```
**FRONT OF CARD**
[question]

---

**BACK OF CARD**
[answer]

---

**How confident were you?**
1 - Not at all | 2 - Somewhat | 3 - Fully confident

===

**FRONT OF CARD**
[next card...]
```
Cards separated by `===`. All cards in one response.

### MCQ Format
```
[MCQ]
Q: Question text
A) Option A
B) Option B
C) Option C
D) Option D
CORRECT: B
EXPLANATION: Optional explanation
[/MCQ]
```

---

## Appwrite Collections

| Collection ID | Purpose |
|---|---|
| `sessions` | Study sessions |
| `messages` | Chat messages |
| `flashcards` | Saved flashcards with SRS data |
| `flashcard_collections` | User-created flashcard folders |
| `user_profiles` | User settings and stats |
| `file_attachments` | PDF/file metadata |
| `pdf_resources` | PDF study resources |
| `pdf_notes` | PDF annotations |
| `pdf_highlights` | PDF highlights |
| `study_schedule` | Spaced repetition schedule |
| `session_context` | Student assessment data |
| `exam_plans` | Exam planner data |
| `youtube_studies` | YouTube study sessions |
| `audio_lectures` | Audio lecture metadata + notes |
| `tts_cache_metadata` | TTS audio cache |
| `tts_usage` | TTS usage tracking |
| `lang_users` | Language learning user data |
| `lang_roadmaps` | Language learning roadmaps |
| `lang_lessons` | Language lessons |
| `lang_lesson_attempts` | Lesson attempt history |
| `lang_practice_sessions` | Practice session data |
| `lang_flashcard_reviews` | Language flashcard SRS |
| `lang_conversation_sessions` | Conversation practice |
| `lang_user_points` | Gamification points |
| `lang_srs_items` | SRS items for language |

### Appwrite Functions
| Function ID | Purpose |
|---|---|
| `6a085d370023ba29cc6c` | Gemini TTS — converts text to speech |
| `6a00e9fc000241b4faca` | processYoutube — extracts YouTube transcripts |

### Storage Bucket
- `6995f259001c9af55009` — PDF and file uploads

---

## Spaced Repetition

Confidence ratings map to next review intervals:
- `1` (Hard) → 1 day
- `2` (Okay) → 3 days  
- `3` (Easy) → 7 days

Implemented in `src/utils/spacedRepetition.js`. Flashcard library shows "Due Today" badge when `nextReviewAt <= now`.

---

## Environment Variables

See `INFRASTRUCTURE.md` for the full list with descriptions and cost analysis.

---

## Known Behaviours

- **Chart fixer** (`chartFixer.js`) only runs on responses shorter than 2000 chars that contain chart keywords. It will not touch lecture notes or long documents.
- **MCQ answers** persist in `localStorage` keyed by `mcq_answer_{messageId}_q{n}`.
- **Flashcards** are saved to Appwrite on every rating (Hard/Okay/Easy).
- **Audio lectures** are stored in Cloudflare R2; metadata in Appwrite `audio_lectures` collection.
- The `ExamSession` page uses `es-*` CSS classes (defined in `src/styles/ExamSession.css`).
