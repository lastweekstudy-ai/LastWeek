# LastWeek — Full Project Audit

> Generated: May 31, 2026  
> Purpose: Complete architecture, feature, and environment reference for rapid development and debugging.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Environment Variables (.env)](#3-environment-variables-env)
4. [Architecture Overview](#4-architecture-overview)
5. [Routing & Pages](#5-routing--pages)
6. [Authentication System](#6-authentication-system)
7. [Study Modes (Core Feature)](#7-study-modes-core-feature)
8. [AI Provider System](#8-ai-provider-system)
9. [Appwrite Database Collections](#9-appwrite-database-collections)
10. [Appwrite Functions (Serverless)](#10-appwrite-functions-serverless)
11. [Feature: Flashcard System](#11-feature-flashcard-system)
12. [Feature: Exam Planner](#12-feature-exam-planner)
13. [Feature: Language Learning](#13-feature-language-learning)
14. [Feature: PDF Study Tools](#14-feature-pdf-study-tools)
15. [Feature: Audio Lectures](#15-feature-audio-lectures)
16. [Feature: YouTube Study](#16-feature-youtube-study)
17. [Feature: TTS (Text-to-Speech)](#17-feature-tts-text-to-speech)
18. [Subscription & Billing (Paddle)](#18-subscription--billing-paddle)
19. [Usage Limits & Plan Enforcement](#19-usage-limits--plan-enforcement)
20. [Admin Panel](#20-admin-panel)
21. [Pre-Registration System](#21-pre-registration-system)
22. [Testing Mode](#22-testing-mode)
23. [Cloudflare R2 Storage](#23-cloudflare-r2-storage)
24. [Spaced Repetition (SM-2)](#24-spaced-repetition-sm-2)
25. [UI Components Reference](#25-ui-components-reference)
26. [Hooks Reference](#26-hooks-reference)
27. [Utilities Reference](#27-utilities-reference)
28. [Styles Reference](#28-styles-reference)
29. [Known Issues & Notes](#29-known-issues--notes)

---

## 1. Project Overview

**LastWeek** is a React + Vite SPA (Single Page Application) — an AI-powered study platform. The tagline is "Master any subject in one week." It combines AI tutoring, spaced-repetition flashcards, exam planning, language learning, audio lecture processing, and PDF study tools.

- **Frontend**: React 19, Vite 8, React Router 7
- **Backend**: Appwrite (auth, database, storage, serverless functions)
- **AI**: Groq (Llama 3.3 70B, Whisper), DeepSeek, Gemini 2.0 Flash
- **Billing**: Paddle (sandbox/live)
- **Audio Storage**: Cloudflare R2 (S3-compatible)
- **Deployment**: Vercel (`.vercel/` config present)

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19.2.5 |
| Build Tool | Vite | 8.0.10 |
| Router | React Router DOM | 7.14.2 |
| Backend/Auth | Appwrite SDK | 25.0.0 |
| AI — Primary | Groq (Llama 3.3 70B) | API |
| AI — Fallback 1 | DeepSeek Chat | API |
| AI — Fallback 2 | Gemini 2.0 Flash | API |
| AI — Vision | Groq Vision / Gemini | API |
| AI — Transcription | Groq Whisper Large V3 | API |
| Billing | Paddle JS | 1.6.4 |
| Audio Storage | Cloudflare R2 (AWS S3 SDK) | 3.1045.0 |
| Charts | Recharts | 3.8.1 |
| Diagrams | Mermaid | 11.14.0 |
| Math Rendering | KaTeX + rehype-katex | 0.16.22 |
| Markdown | react-markdown + remark-gfm | 10.1.0 |
| PDF Rendering | react-pdf | 9.1.1 |
| Code Editor | Monaco Editor | 4.7.0 |
| Date Utils | date-fns | 4.1.0 |
| Testing | Vitest + Testing Library | 4.1.5 |

---

## 3. Environment Variables (.env)

> **Security note**: All `VITE_` prefixed variables are exposed to the browser bundle. API keys here are client-side. The non-`VITE_` variables at the bottom are for Appwrite serverless functions only.

### Appwrite Core
| Variable | Value / Purpose |
|---|---|
| `VITE_APPWRITE_PROJECT_ID` | `69958be2003344c314a1` — Appwrite project ID |
| `VITE_APPWRITE_ENDPOINT` | `https://sgp.cloud.appwrite.io/v1` — Singapore region |
| `VITE_APPWRITE_DATABASE_ID` | `69f742a2001f393e4b85` — Main database |
| `VITE_APPWRITE_STORAGE_BUCKET_ID` | `your_bucket_id` ⚠️ **NOT SET** — PDF/file uploads |

### Appwrite Collections (all use string IDs matching collection names)
| Variable | Collection ID |
|---|---|
| `VITE_APPWRITE_SESSIONS_COLLECTION_ID` | `sessions` |
| `VITE_APPWRITE_MESSAGES_COLLECTION_ID` | `messages` |
| `VITE_APPWRITE_FLASHCARDS_COLLECTION_ID` | `flashcards` |
| `VITE_APPWRITE_FLASHCARD_COLLECTIONS_COLLECTION_ID` | `flashcard_collections` |
| `VITE_APPWRITE_PROFILES_COLLECTION_ID` | `user_profiles` |
| `VITE_APPWRITE_ATTACHMENTS_COLLECTION_ID` | `file_attachments` |
| `VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID` | `pdf_resources` |
| `VITE_APPWRITE_PDF_NOTES_COLLECTION_ID` | `pdf_notes` |
| `VITE_APPWRITE_PDF_HIGHLIGHTS_COLLECTION_ID` | `pdf_highlights` |
| `VITE_APPWRITE_STUDY_SCHEDULE_COLLECTION_ID` | `study_schedule` |
| `VITE_APPWRITE_SESSION_CONTEXT_COLLECTION_ID` | `session_context` |
| `VITE_APPWRITE_EXAM_PLANS_COLLECTION_ID` | `exam_plans` |
| `VITE_APPWRITE_YOUTUBE_STUDIES_COLLECTION_ID` | `youtube_studies` |
| `VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID` | `audio_lectures` |
| `VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID` | `subscriptions` |

### Admin & Pre-Registration Collections
| Variable | Collection ID |
|---|---|
| `VITE_APPWRITE_ADMIN_SETTINGS_COLLECTION_ID` | `admin_settings` |
| `VITE_APPWRITE_PRE_REGISTRATIONS_COLLECTION_ID` | `pre_registrations` |
| `VITE_APPWRITE_PROMO_CODE_USAGE_COLLECTION_ID` | `promo_code_usage` |
| `VITE_APPWRITE_USER_REVIEWS_COLLECTION_ID` | `user_reviews` |
| `VITE_APPWRITE_DAILY_FREE_SLOTS_COLLECTION_ID` | `daily_free_slots` |
| `VITE_APPWRITE_DAILY_SLOT_USAGE_COLLECTION_ID` | `daily_slot_usage` |
| `VITE_APPWRITE_TESTING_USAGE_COLLECTION_ID` | `testing_usage` |

### Language Learning Collections
| Variable | Collection ID |
|---|---|
| `VITE_LANG_USERS_COLLECTION_ID` | `lang_users` |
| `VITE_LANG_ROADMAPS_COLLECTION_ID` | `lang_roadmaps` |
| `VITE_LANG_LESSONS_COLLECTION_ID` | `lang_lessons` |
| `VITE_LANG_LESSON_ATTEMPTS_COLLECTION_ID` | `lang_lesson_attempts` |
| `VITE_LANG_PRACTICE_SESSIONS_COLLECTION_ID` | `lang_practice_sessions` |
| `VITE_LANG_FLASHCARD_REVIEWS_COLLECTION_ID` | `lang_flashcard_reviews` |
| `VITE_LANG_CONVERSATION_SESSIONS_COLLECTION_ID` | `lang_conversation_sessions` |
| `VITE_LANG_USER_POINTS_COLLECTION_ID` | `lang_user_points` |
| `VITE_LANG_SRS_ITEMS_COLLECTION_ID` | `lang_srs_items` |

### TTS Collections
| Variable | Collection ID |
|---|---|
| `VITE_TTS_CACHE_COLLECTION_ID` | `tts_cache_metadata` |
| `VITE_TTS_USAGE_COLLECTION_ID` | `tts_usage` |

### Appwrite Functions
| Variable | Value |
|---|---|
| `VITE_APPWRITE_PROCESS_YOUTUBE_FUNCTION_ID` | `your_function_id` ⚠️ **NOT SET** |
| `VITE_GEMINI_TTS_FUNCTION_ID` | `your_function_id` ⚠️ **NOT SET** |

### AI API Keys (client-side — exposed in bundle)
| Variable | Purpose |
|---|---|
| `VITE_DEEPSEEK_API_KEY` | DeepSeek Chat API |
| `VITE_GEMINI_API_KEY` | Gemini 2.0 Flash (text + vision + TTS) |
| `VITE_GROQ_API_KEY` | Groq (Llama 70B, Whisper transcription) |

### Cloudflare R2
| Variable | Purpose |
|---|---|
| `VITE_CLOUDFLARE_ACCOUNT_ID` | R2 account ID |
| `VITE_CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 access key |
| `VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret key |
| `VITE_CLOUDFLARE_R2_BUCKET_NAME` | `lastweek-audio` |
| `VITE_CLOUDFLARE_R2_PUBLIC_URL` | Public R2 URL for audio playback |

### Paddle Billing
| Variable | Purpose |
|---|---|
| `VITE_PADDLE_ENV` | `sandbox` or `production` |
| `VITE_PADDLE_ENVIRONMENT` | Same as above (duplicate) |
| `VITE_PADDLE_CLIENT_TOKEN` | Paddle.js client token |
| `VITE_PADDLE_NOTIFICATION_ID` | Paddle notification webhook ID |
| `VITE_PADDLE_PRE_REG_PRICE_ID` | Pre-registration one-time price |
| `VITE_PADDLE_PRO_PRICE_ID` | Pro plan price ID |
| `VITE_PADDLE_PLUS_PRICE_ID` | Plus plan price ID |
| `VITE_PADDLE_PROPLUS_PRICE_ID` | Pro+ plan price ID |

### Server-Side Only (Appwrite Functions — no VITE_ prefix)
| Variable | Purpose |
|---|---|
| `APPWRITE_ENDPOINT` | Server-side Appwrite endpoint |
| `APPWRITE_PROJECT_ID` | Server-side project ID |
| `APPWRITE_DATABASE_ID` | Server-side database ID |
| `APPWRITE_API_KEY` | Server API key (admin privileges) |
| `DEEPSEEK_API_KEY` | DeepSeek key for functions |
| `PADDLE_*_PRICE_ID` | Price IDs for webhook validation |

> ⚠️ **Critical gaps**: `VITE_APPWRITE_STORAGE_BUCKET_ID`, `VITE_APPWRITE_PROCESS_YOUTUBE_FUNCTION_ID`, and `VITE_GEMINI_TTS_FUNCTION_ID` are set to placeholder values. PDF uploads and YouTube/TTS features will fail until these are filled in.

---

## 4. Architecture Overview

```
Browser (React SPA)
│
├── React Router — client-side routing
├── Context Providers
│   ├── AuthContext     — user session, login/logout/register
│   ├── SessionContext  — active study session state
│   └── ThemeContext    — dark/light mode
│
├── Pages (src/pages/)
│   ├── Public: Landing, Auth, About, Contact, Privacy, Terms, Pricing, Docs, PreRegistration
│   ├── Protected: Dashboard, ModeSelector, Settings, PDFManager, ExamPlanner, FlashcardLibrary
│   ├── Study Modes: MentalModel, ActiveRecall, FocusBreakdown, CollaborativeScholar, CreativeSynthesis
│   ├── Language Learning: LanguageLearning, LanguageLearningLessons, LanguageLearningLesson, LanguageLearningPractice
│   └── Admin: AdminLayout > Dashboard, PreRegUsers, DailySlots, Reviews, Settings, TestingUsers
│
├── Services (src/services/)
│   ├── aiProvider.js   — Groq / DeepSeek / Gemini with smart failover + streaming
│   └── languageAI.js   — Language learning AI (lesson gen, roadmap, conversation)
│
├── Appwrite SDK Wrappers (src/appwrite/)
│   ├── config.js       — Client, Account, Databases, Storage, Functions instances
│   ├── auth.js         — register, login, logout, guest, prefs
│   ├── database.js     — sessions, messages, flashcards, profiles, attachments, collections
│   ├── storage.js      — Appwrite Storage (PDF/file uploads)
│   ├── r2Storage.js    — Cloudflare R2 (audio uploads via AWS S3 SDK)
│   ├── subscription.js — Paddle subscription records
│   ├── usageTracking.js — Monthly usage counters
│   ├── admin.js        — Admin settings, pre-reg, promo codes, reviews, daily slots, testing users
│   ├── examPlanner.js  — Exam plans CRUD + schedule generation + AI prompt builder
│   ├── languageLearning.js — Language user, roadmap, lessons, SRS, practice, conversation
│   ├── audioLecture.js — Audio upload → transcribe → DeepSeek notes → save
│   ├── pdfResources.js — PDF resource CRUD, bookmarks, highlights, stats
│   ├── pdfNotes.js     — PDF page notes CRUD
│   ├── pdfHighlights.js — PDF text highlights CRUD
│   ├── youtubeStudy.js — YouTube processing via Appwrite Function
│   ├── sessionContext.js — Student assessment context per session
│   ├── studySchedule.js  — SM-2 spaced repetition schedule
│   └── resourceLibrary.js — Shared resource library
│
├── Appwrite Functions (appwrite-functions/)
│   ├── geminiTTS/      — Gemini TTS: text → base64 PCM audio
│   ├── processYoutube/ — YouTube transcript → DeepSeek → study material
│   └── paddleWebhook/  — Paddle events → Appwrite user labels + subscription records
│
└── External APIs (direct from browser)
    ├── Groq API        — chat completions (streaming), Whisper transcription
    ├── DeepSeek API    — chat completions (streaming + non-streaming)
    ├── Gemini API      — text, vision, multimodal
    └── Cloudflare R2   — audio file storage (S3-compatible)
```

### Data Flow: Study Session

```
User opens /session/new/mental-model
  → MentalModel.jsx mounts
  → useSession hook creates session in Appwrite (sessions collection)
  → SessionAssessment component asks 4 questions (level, goal, time, style)
  → Responses saved to session_context collection
  → buildStudentProfile() injects context into system prompt
  → User types message → ChatInterface.jsx
  → smartChatStream() tries Groq 70B → DeepSeek → Gemini → Groq 8B
  → Streaming response rendered by EnhancedMessageFormatter
  → Message saved to messages collection
  → AI response parsed for: flashcards, MCQs, charts, Mermaid, SVG figures, LaTeX
```

---

## 5. Routing & Pages

### Public Routes (no auth required)
| Path | Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Marketing landing page |
| `/about` | `About` | About page |
| `/contact` | `Contact` | Contact form |
| `/privacy` | `Privacy` | Privacy policy |
| `/terms` | `Terms` | Terms of service |
| `/refund-policy` | `RefundPolicy` | Refund policy |
| `/cookies` | `CookiePolicy` | Cookie policy |
| `/auth` | `Auth` | Login / Register |
| `/docs` | `DocsPage` | Documentation |
| `/docs/:slug` | `DocsPage` | Doc section |
| `/docs/:slug/:sectionId` | `DocsPage` | Doc subsection |
| `/pre-register` | `PreRegistration` | Pre-registration (public) |

### Protected Routes (require login)
| Path | Component | Purpose |
|---|---|---|
| `/dashboard` | `DashboardEnhanced` | Main dashboard |
| `/mode-select` | `ModeSelector` | Choose study mode |
| `/settings` | `Settings` | User settings |
| `/pdf-manager` | `PDFManager` | PDF library manager |
| `/exam-planner` | `ExamPlanner` | Exam plan creation |
| `/exam-session/:planId/:topicIndex` | `ExamSession` | Exam study session |
| `/flashcards` | `FlashcardLibrary` | All flashcards |
| `/pricing` | `Pricing` | Pricing page |
| `/tts-demo` | `TTSDemo` | TTS demo |
| `/session/:sessionId` | `SessionRoute` | Load existing session |
| `/session/new/mental-model` | `MentalModel` | New mental model session |
| `/session/new/active-recall` | `ActiveRecall` | New active recall session |
| `/session/new/focus-breakdown` | `FocusBreakdown` | New focus breakdown session |
| `/session/new/collaborative-scholar` | `CollaborativeScholar` | New collaborative session |
| `/session/new/creative-synthesis` | `CreativeSynthesis` | New creative synthesis session |

### Language Learning Routes (require login + plan check)
| Path | Component |
|---|---|
| `/language-learning` | `LanguageLearning` |
| `/language-learning/lessons` | `LanguageLearningLessons` |
| `/language-learning/lessons/:moduleId/:stageId` | `LanguageLearningLesson` |
| `/language-learning/practice` | `LanguageLearningPractice` |
| `/language-learning/continue` | `LanguageLearning` |

### Admin Routes (require `admin` label on user)
| Path | Component |
|---|---|
| `/admin` | `AdminDashboard` |
| `/admin/testing-users` | `AdminTestingUsers` |
| `/admin/pre-reg` | `AdminPreReg` |
| `/admin/daily-slots` | `AdminDailySlots` |
| `/admin/reviews` | `AdminReviews` |
| `/admin/settings` | `AdminSettings` |

### Route Guards
- `ProtectedRoute` — redirects to `/auth` if no user
- `LanguageLearningGuard` — redirects to `/pricing` if plan doesn't include language learning (free plan)
- `AdminRoute` — redirects to `/dashboard` if user doesn't have `admin` label

---

## 6. Authentication System

**File**: `src/appwrite/auth.js`, `src/context/AuthContext.jsx`

### Auth Methods
| Function | Description |
|---|---|
| `registerUser(email, password, name, profileData)` | Creates Appwrite account, auto-logs in, saves prefs (DOB, consent timestamps) |
| `loginUser(email, password)` | Creates email/password session |
| `logoutUser()` | Deletes current session |
| `getCurrentUser()` | Returns current user or null (silent fail) |
| `getUserPrefs()` | Returns user preferences object |
| `updateUserPrefs(prefs)` | Updates user preferences |
| `loginAsGuest()` | Creates anonymous session |

### AuthContext Values
| Value | Type | Description |
|---|---|---|
| `user` | object\|null | Current Appwrite user object |
| `loading` | boolean | True while checking auth on mount |
| `isGuest` | boolean | True if anonymous session |
| `login(email, password)` | function | Login and set user |
| `register(email, password, name, profileData)` | function | Register, login, create profile |
| `logout()` | function | Logout and clear user |
| `loginGuest()` | function | Anonymous login |
| `refreshUser()` | function | Re-fetch user (used after webhook updates labels) |

### User Labels (set by Paddle webhook)
| Label | Meaning |
|---|---|
| `admin` | Admin panel access |
| `premium` | Has any paid plan |
| `pro` | Pro plan |
| `plus` | Plus plan (pre-reg or paid) |
| `proplus` | Pro+ plan |
| `guest` | Anonymous user |

### Profile Data (stored in Appwrite account.prefs)
- `dateOfBirth` — for age verification
- `agreedTermsAt` — consent timestamp
- `agreedPrivacyAt` — consent timestamp
- `agreedDataCollectionAt` — consent timestamp
- `signupCompletedAt` — registration timestamp

---

## 7. Study Modes (Core Feature)

All 5 modes share the same `ChatInterface` + `StudyInterface` components but use different AI system prompts from `src/utils/promptBuilder.js`.

### Mode Files
| Mode | File | Route |
|---|---|---|
| Mental Model | `src/pages/modes/MentalModel.jsx` | `/session/new/mental-model` |
| Active Recall | `src/pages/modes/ActiveRecall.jsx` | `/session/new/active-recall` |
| Focus Breakdown | `src/pages/modes/FocusBreakdown.jsx` | `/session/new/focus-breakdown` |
| Collaborative Scholar | `src/pages/modes/CollaborativeScholar.jsx` | `/session/new/collaborative-scholar` |
| Creative Synthesis | `src/pages/modes/CreativeSynthesis.jsx` | `/session/new/creative-synthesis` |

### Mode Descriptions & Prompts
| Mode | Teaching Approach |
|---|---|
| **Mental Model** | Concept-first teaching. Full curriculum coverage. Analogies after structure. Mermaid/SVG/charts for visuals. |
| **Active Recall** | Socratic questioning. Tests before explaining. Spaced repetition integration. Flashcard generation. |
| **Focus Breakdown** | Pomodoro-integrated. Breaks topic into timed chunks. Tracks focus sessions. |
| **Collaborative Scholar** | Debate and peer-review with historical personas. Challenges student's reasoning. |
| **Creative Synthesis** | Mind maps, storytelling, project-based learning. Connects topics creatively. |

### Session Lifecycle
1. User navigates to `/session/new/:mode` or `/session/:sessionId`
2. `useSession` hook creates/loads session in Appwrite `sessions` collection
3. `SessionAssessment` component shows 4 questions (skippable):
   - Current knowledge level (complete_beginner / beginner / intermediate / advanced)
   - Learning goal (free text)
   - Time available (1-2 days / 3-5 days / 1-2 weeks / flexible)
   - Preferred style (analogies / step_by_step / visual / stories)
4. Responses saved to `session_context` collection
5. `buildStudentProfile()` injects context into every AI system prompt
6. Chat messages saved to `messages` collection
7. Session summary auto-generated on close

### AI Response Parsing (EnhancedMessageFormatter)
The `EnhancedMessageFormatter` component parses AI responses for special blocks:
- `[CHART:type:title]...[/CHART]` → Recharts interactive chart
- ` ```mermaid ``` ` → Mermaid diagram
- `[FIGURE:title]<svg>...</svg>[/FIGURE]` → SVG figure
- `**FRONT OF CARD**...**BACK OF CARD**...===` → Interactive flashcard
- `[MCQ]...[/MCQ]` → Interactive multiple choice question
- `$...$` and `$$...$$` → KaTeX math rendering

---

## 8. AI Provider System

**File**: `src/services/aiProvider.js`

### Provider Priority (Smart Failover)

**Small context (< 8,000 tokens estimated):**
1. Groq Llama 3.3 70B (streaming) — 1000 RPD, 12k TPM
2. DeepSeek Chat (streaming) — paid, reliable
3. Gemini 2.0 Flash (non-streaming, emitted as one chunk)
4. Groq Llama 3.1 8B (streaming) — 14400 RPD, 6k TPM
5. Groq Gemma 2 9B (streaming) — fallback

**Large context (> 8,000 tokens):**
1. DeepSeek Chat — no strict TPM limit
2. Gemini 2.0 Flash — 2M context window
3. Groq Llama 3.1 8B (truncated)

### Key Functions
| Function | Description |
|---|---|
| `smartChatStream(systemPrompt, messages, onChunk)` | Streaming with failover — used by all study modes |
| `smartChat(systemPrompt, messages)` | Non-streaming with failover |
| `smartAnalyzeDocument(text, prompt)` | Document analysis: Gemini → DeepSeek → Groq |
| `callGroqStream(systemPrompt, messages, onChunk, model)` | Direct Groq streaming |
| `callDeepSeekStream(systemPrompt, messages, onChunk)` | Direct DeepSeek streaming |
| `callGeminiText(prompt, systemInstruction)` | Direct Gemini text |
| `callGeminiVision(base64Image, prompt, mimeType)` | Gemini image analysis |
| `callGroqVision(base64Image, prompt, mimeType)` | Groq vision (Llama 4 Scout) |
| `transcribeAudio(audioFile, language)` | Groq Whisper transcription with audio compression |
| `smartGenerateJSON(prompt)` | JSON generation with failover (used by language AI) |

### Token Management
- `estimateTokens(text)` — approximates tokens as `text.length / 4`
- `truncateMessages(systemPrompt, messages, tokenLimit)` — drops oldest messages to fit budget
- Per-model token limits: Llama 70B = 9000, Llama 8B = 4500

### Rate Limit Handling
- 429 errors set `groqRateLimited = true` — all subsequent Groq calls skipped in that request
- Exponential backoff for retryable errors (5xx, network)
- DeepSeek network errors retry up to 2 times with 2s delay

### Audio Compression (Whisper)
Before sending to Groq Whisper, audio is compressed client-side:
- Decoded via Web Audio API
- Mixed down to mono
- Resampled to 16kHz
- Re-encoded as WebM/Opus at 12kbps
- Only used if compressed file is smaller than original

---

## 9. Appwrite Database Collections

All collections live in database `69f742a2001f393e4b85` on `https://sgp.cloud.appwrite.io/v1`.

### Core Study Collections

**`sessions`** — Study sessions
| Field | Type | Notes |
|---|---|---|
| userId | string | Owner |
| mode | string | mental_model / active_recall / focus_breakdown / collaborative_scholar / creative_synthesis / exam_prep |
| subject | string | Topic being studied |
| title | string | Session title |
| summary | string | AI-generated summary |
| createdAt | datetime | |
| updatedAt | datetime | |

**`messages`** — Chat messages
| Field | Type | Notes |
|---|---|---|
| sessionId | string | Parent session |
| userId | string | Owner |
| role | string | user / assistant |
| content | string | Message text (up to 1MB, truncated if larger) |
| createdAt | datetime | |

**`flashcards`** — Spaced repetition flashcards
| Field | Type | Notes |
|---|---|---|
| userId | string | Owner |
| sessionId | string | Source session |
| front | string | Question/prompt |
| back | string | Answer (1-5 words) |
| confidence | integer | 0-3 |
| nextReviewAt | datetime | SM-2 next review date |
| collectionId | string\|null | Flashcard collection |
| source | string | ai / manual |
| subject | string\|null | |
| createdAt | datetime | |

**`flashcard_collections`** — User-created flashcard folders
| Field | Type | Notes |
|---|---|---|
| userId | string | Owner |
| name | string | Collection name |
| color | string | Hex color (default #a855f7) |
| icon | string | Emoji icon (default 📚) |
| createdAt | datetime | |

**`user_profiles`** — User settings and stats
| Field | Type | Notes |
|---|---|---|
| userId | string | Owner |
| displayName | string | |
| currentMode | string\|null | Last used mode |
| totalSessions | integer | |
| createdAt | datetime | |

**`file_attachments`** — File metadata for session attachments
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| sessionId | string | |
| fileName | string | |
| fileType | string | MIME type |
| fileSize | integer | Bytes |
| fileId | string\|null | Appwrite Storage file ID |
| content | string\|null | Extracted text (max 50k chars) |
| createdAt | datetime | |

**`session_context`** — Student assessment per session
| Field | Type | Notes |
|---|---|---|
| sessionId | string | |
| userId | string | |
| mode | string | |
| responses | string | JSON stringified responses |
| currentLevel | string | complete_beginner / beginner / intermediate / advanced |
| learningGoal | string | |
| timeAvailable | string | |
| preferredStyle | string | |
| priorKnowledge | string | |
| specificChallenges | string | |
| assessmentCompleted | boolean | |
| updatedAt | datetime | |
| createdAt | datetime | |

**`study_schedule`** — SM-2 spaced repetition schedule
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| sessionId | string | |
| subject | string | |
| topic | string | |
| repetitions | integer | SM-2 repetition count |
| easeFactor | float | SM-2 ease factor (default 2.5) |
| interval | integer | Days until next review |
| nextReviewDate | string | YYYY-MM-DD |

### PDF Collections

**`pdf_resources`** — PDF and file resources
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| sessionId | string | |
| fileName | string | |
| fileSize | integer | |
| storageFileId | string | Appwrite Storage ID |
| pageCount | integer | |
| extractedText | string\|null | Up to 1MB |
| notes | string | User notes |
| currentPage | integer | Reading progress |
| bookmarks | string | JSON array |
| highlights | string | JSON array |
| tags | string | Also used to store file MIME type |
| lastAccessedAt | datetime | |
| createdAt | datetime | |
| isFavorite | boolean | |
| category | string\|null | |
| viewCount | integer | |
| studyTimeMinutes | integer | |
| isPublic | boolean | |
| aiTitle | string\|null | AI-generated title |

**`pdf_notes`** — Page-level notes
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| pdfResourceId | string | |
| pageNumber | integer | |
| noteText | string | Max 10k chars |
| position | string | JSON position data |
| color | string | yellow / blue / green / pink |
| createdAt | datetime | |
| updatedAt | datetime | |

**`pdf_highlights`** — Text highlights
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| pdfResourceId | string | |
| pageNumber | integer | |
| highlightedText | string | Max 5k chars |
| position | string | JSON position data |
| color | string | |
| createdAt | datetime | |

### Exam Planner

**`exam_plans`**
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| examName | string | |
| examDate | string | ISO date |
| topics | string | JSON stringified array of `{name, done, sessionId, subtopics}` |
| createdAt | datetime | |
| updatedAt | datetime | |

### YouTube Study

**`youtube_studies`**
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| videoId | string | YouTube video ID (used as cache key) |
| youtubeUrl | string | |
| title | string | AI-inferred title |
| summary | string[] | 10 key points |
| detailedNotes | string | 3-4 paragraph prose |
| flashcards | string | JSON stringified array |
| quiz | string | JSON stringified array |
| keyTopics | string[] | 8 topics |
| createdAt | datetime | |

### Audio Lectures

**`audio_lectures`**
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| title | string | AI-inferred from notes |
| audioFileId | string | R2 file key for deletion |
| audioUrl | string | Public R2 URL |
| transcript | string | Full Whisper transcript |
| lectureNotes | string | DeepSeek structured notes (markdown) |
| duration | integer | Seconds (currently 0) |
| isPublic | boolean | |
| sessionId | string\|null | Optional session link |
| createdAt | datetime | |
| updatedAt | datetime | |

> ⚠️ Note: `audio_lectures` is at Appwrite's column limit. `trackAudioLectureView` and `trackAudioStudyTime` are no-ops.

### Subscription & Billing

**`subscriptions`**
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| paddleSubscriptionId | string | |
| paddleCustomerId | string | |
| plan | string | free / pro / plus / proplus |
| status | string | active / trialing / past_due / canceled / paused |
| currentPeriodStart | datetime | |
| currentPeriodEnd | datetime | |
| canceledAt | datetime\|null | |
| priceId | string | Paddle price ID |
| currency | string | |
| amount | string | |
| interval | string | month / quarter / year |
| createdAt | datetime | |
| updatedAt | datetime | |

**`usage_tracking`** — Monthly usage counters
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| month | string | YYYY-MM format |
| sessionsCreated | integer | |
| messagesUsed | integer | |
| pdfsUploaded | integer | |
| audiosUploaded | integer | |
| flashcardsCreated | integer | |
| mcqsAnswered | integer | |
| storageUsedBytes | integer | |
| updatedAt | datetime | |

---

### Admin & Pre-Registration Collections

**`admin_settings`** — Singleton document (ID: `admin_settings_doc`)
| Field | Type | Notes |
|---|---|---|
| preRegActive | boolean | Pre-registration open |
| paymentsActive | boolean | Payments enabled |
| dailyFreeSlotsActive | boolean | Daily free slots enabled |
| dailyFreeSlotCount | integer | Slots per day |
| freePlanActive | boolean | |
| proPlanActive | boolean | |
| plusPlanActive | boolean | |
| proPlusPlanActive | boolean | |
| preRegPriceId | string | Paddle price ID for pre-reg |

**`pre_registrations`**
| Field | Type | Notes |
|---|---|---|
| userId | string | Appwrite user ID (or temp ID for pre-account) |
| email | string | |
| name | string | |
| type | string | paid / free_slot / reviewer |
| promoCode | string | Unique referral code (format: LW + 6 chars + 4 random) |
| promoCodeUses | integer | How many people used this code |
| bonusMonthsEarned | integer | 6 months per 10 referrals |
| plusUntil | datetime | Plus plan expiry |
| status | string | active / pending |
| reviewId | string\|null | Linked review |
| paddlePaymentId | string | |
| createdAt | datetime | |

**`promo_code_usage`** — Tracks who used whose promo code
| Field | Type | Notes |
|---|---|---|
| promoCode | string | |
| referrerId | string | User who owns the code |
| newUserId | string | User who used the code |
| newUserEmail | string | |
| createdAt | datetime | |

**`user_reviews`**
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| userName | string | |
| preRegId | string\|null | |
| rating | integer | 1-5 |
| title | string | |
| content | string | |
| isApproved | boolean | Requires admin approval |
| isPublished | boolean | |
| helpfulCount | integer | |
| createdAt | datetime | |

**`daily_free_slots`** — One document per day
| Field | Type | Notes |
|---|---|---|
| date | string | YYYY-MM-DD (US Eastern) |
| totalSlots | integer | From admin settings |
| usedSlots | integer | |
| slotUserIds | string[] | User IDs who claimed slots |
| createdAt | datetime | |

**`daily_slot_usage`** — One document per user per day
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| email | string | |
| date | string | YYYY-MM-DD |
| hasReviewed | boolean | |
| reviewId | string\|null | |
| addedToPreReg | boolean | |
| createdAt | datetime | |

**`testing_usage`** — One-time limits for testing users
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| email | string | |
| sessions | integer | |
| pdfs | integer | |
| audios | integer | |
| messages | integer | |
| flashcards | integer | |
| mcqs | integer | |
| examPlans | integer | |
| languageLearningSessions | integer | |
| libraryImports | integer | |
| hasReviewed | boolean | |
| reviewId | string\|null | |
| addedToPreReg | boolean | |
| createdAt | datetime | |

### Language Learning Collections

**`lang_users`** — Language learning profile
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| primaryLanguage | string | Language code (en) |
| targetLanguage | string | Language code (en/zh/es/de/fr) |
| learningRatio | integer | % target language (default 70) |
| totalXP | integer | Gamification points |
| currentStage | string | beginner / elementary / intermediate / upper_intermediate / advanced / mastery / native |
| streakDays | integer | Consecutive active days |
| lastActiveDate | datetime | |
| createdAt | datetime | |

**`lang_roadmaps`** — AI-generated learning roadmap
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| primaryLanguage | string | |
| targetLanguage | string | |
| roadmap | string | JSON stringified 7-stage roadmap |
| createdAt | datetime | |
| updatedAt | datetime | |

**`lang_lessons`** — Lesson progress
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| moduleId | string | vocabulary / pronunciation / speaking / etc. |
| stageName | string | beginner / elementary / etc. |
| moduleName | string | Display name |
| status | string | in_progress / completed |
| score | integer | 0-100 |
| attempts | integer | |
| lessonContent | string\|null | JSON stringified lesson data |
| lastSection | string\|null | Resume point |
| completedAt | datetime\|null | |

**`lang_flashcard_reviews`** — Language SRS
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| itemId | string | |
| itemType | string | |
| itemContent | string | JSON |
| nextReview | datetime | |
| successStreak | integer | |
| difficulty | string | easy / hard / forgot |
| lastReviewed | datetime | |

**`lang_practice_sessions`**, **`lang_conversation_sessions`**, **`lang_user_points`**, **`lang_srs_items`** — Supporting language learning data.

### TTS Collections

**`tts_cache_metadata`** — Cached TTS audio metadata
| Field | Type | Notes |
|---|---|---|
| text | string | First 500 chars |
| voice | string | |
| fileId | string | SHA-256 hash of text+voice |
| charCount | integer | |
| createdAt | datetime | |

**`tts_usage`** — Per-user TTS usage log
| Field | Type | Notes |
|---|---|---|
| userId | string | |
| charCount | integer | |
| voice | string | |
| timestamp | datetime | |

---

## 10. Appwrite Functions (Serverless)

### geminiTTS (`appwrite-functions/geminiTTS/index.js`)
- **Trigger**: HTTP POST from `src/tts/ttsApi.js`
- **Input**: `{ text, voice, style }`
- **Process**: Calls Gemini 2.0 Flash with `responseModalities: ['AUDIO']`
- **Output**: `{ success, audio (base64 PCM), voice, textLength }`
- **Env vars needed**: `GEMINI_API_KEY`
- **Default voice**: Kore
- **Available voices**: Puck, Charon, Kore, Fenrir, Aoede

### processYoutube (`appwrite-functions/processYoutube/index.js`)
- **Trigger**: HTTP POST from `src/appwrite/youtubeStudy.js`
- **Input**: `{ youtubeUrl, userId }`
- **Process**:
  1. Extract video ID from URL
  2. Check `youtube_studies` cache (by videoId)
  3. Fetch transcript via `youtube-transcript` npm package (3 retries)
  4. Truncate to first 3000 words
  5. Call DeepSeek to generate: title, 10 summary points, detailed notes, 10 flashcards, 5 quiz questions, 8 key topics
  6. Save to `youtube_studies` collection
- **Output**: `{ success, cached, docId, data: { title, summary, detailedNotes, flashcards, quiz, keyTopics } }`
- **Env vars needed**: `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `DEEPSEEK_API_KEY`

### paddleWebhook (`appwrite-functions/paddleWebhook/index.js`)
- **Trigger**: Paddle webhook POST
- **Events handled**:
  - `subscription.created`, `subscription.activated`, `transaction.completed` → Add plan label to user, save subscription record
  - `subscription.canceled`, `subscription.past_due` → Remove `premium` label, update subscription status
- **Pre-registration detection**: If `priceId` matches `PADDLE_PRE_REG_PRICE_ID`, grants `plus` label for 1 year and creates `pre_registrations` record
- **Env vars needed**: `APPWRITE_FUNCTION_API_ENDPOINT`, `APPWRITE_FUNCTION_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `PADDLE_PRE_REG_PRICE_ID`, `PADDLE_PRO_PRICE_ID`, `PADDLE_PLUS_PRICE_ID`, `PADDLE_PROPLUS_PRICE_ID`
- ⚠️ **No signature verification** — safe for sandbox, must add before production

---

## 11. Feature: Flashcard System

**Files**: `src/appwrite/database.js`, `src/components/Flashcard.jsx`, `src/components/InlineFlashcard.jsx`, `src/components/FlashcardCreateModal.jsx`, `src/pages/FlashcardLibrary.jsx`, `src/utils/spacedRepetition.js`

### How It Works
1. AI generates flashcards in a specific format (see Section 7)
2. `EnhancedMessageFormatter` parses the format and renders `InlineFlashcard` components
3. User rates confidence: 1 (Hard), 2 (Okay), 3 (Easy)
4. Rating triggers `createFlashcard()` or `updateFlashcard()` in Appwrite
5. `nextReviewAt` is calculated: Hard=1 day, Okay=3 days, Easy=7 days
6. `FlashcardLibrary` page shows all cards with "Due Today" badge

### Flashcard Collections (Folders)
- Users can create named collections with color + emoji icon
- Cards can be moved between collections
- `BulkActions` component handles bulk move/delete

### Spaced Repetition (`src/utils/spacedRepetition.js`)
Simple interval mapping (not full SM-2 — that's in `studySchedule.js`):
- Confidence 1 → 1 day
- Confidence 2 → 3 days
- Confidence 3 → 7 days

The full SM-2 algorithm is in `src/appwrite/studySchedule.js` (see Section 24).

---

## 12. Feature: Exam Planner

**Files**: `src/appwrite/examPlanner.js`, `src/pages/ExamPlanner.jsx`, `src/pages/ExamSession.jsx`

### How It Works
1. User creates an exam plan: exam name, date, list of topics
2. `generateSchedule()` distributes topics across available days (last day = revision)
3. Dashboard shows today's topics
4. User clicks a topic → navigates to `/exam-session/:planId/:topicIndex`
5. `ExamSession` page uses `buildExamSessionPrompt()` — a specialized AI prompt that:
   - Knows the exam name, date, days remaining, full syllabus
   - Labels content as ESSENTIAL or SUPPLEMENTARY based on urgency
   - Adjusts depth based on days remaining (1-2 days = critical mode)
   - Cross-references all topics in the syllabus
6. Completing a topic marks it as `done` in the plan

### Schedule Algorithm
- `totalDays = exam_date - today`
- `studyDays = totalDays - 1` (last day reserved for revision)
- Topics distributed evenly: `ceil(pending.length / studyDays)` per day
- Revision day = exam date - 1, covers all topics

### Urgency Levels
| Days Left | Label |
|---|---|
| ≤ 1 | CRITICAL — exam is tomorrow or today |
| ≤ 3 | URGENT — only a few days left |
| ≤ 7 | FOCUSED — about a week left |
| > 7 | STEADY — comfortable timeline |

---

## 13. Feature: Language Learning

**Files**: `src/appwrite/languageLearning.js`, `src/services/languageAI.js`, `src/pages/LanguageLearning.jsx`, `src/pages/LanguageLearningLessons.jsx`, `src/pages/LanguageLearningLesson.jsx`, `src/pages/LanguageLearningPractice.jsx`

### Supported Languages
- **Primary (UI language)**: English
- **Target languages**: English, Chinese (Mandarin), Spanish, German, French

### Learning Stages (7 levels)
beginner → elementary → intermediate → upper_intermediate → advanced → mastery → native

### Modules per Stage (11 modules, fixed IDs)
vocabulary, pronunciation, speaking, listening, reading, writing, grammar, sentence-structure, synonyms-antonyms, idioms-expressions, cultural-context

### How It Works
1. User selects primary + target language
2. `generateRoadmap()` creates a 7-stage × 11-module roadmap (AI-generated, normalized to fixed IDs)
3. Roadmap saved to `lang_roadmaps` collection
4. User picks a lesson → `generateLesson()` creates structured content
5. Lesson content validated against strict JSON schema (prevents hallucinated keys)
6. Lesson saved to `lang_lessons` (duplicate prevention: update if same userId+moduleId+stageName exists)
7. User completes mastery check (3 MCQs) → lesson marked complete
8. XP awarded, streak updated in `lang_users`

### Lesson JSON Schema (strict)
```json
{
  "introduction": "string",
  "coreContent": "string",
  "examples": ["string × 5"],
  "miniPractice": ["string × 2-3"],
  "summary": "string",
  "masteryCheck": [
    { "question": "string", "options": ["string × 4"], "correctAnswer": "string" }
  ]
}
```

### Level-Specific Format Rules
- **Beginner**: Every target language word must have romanization + translation
- **Elementary**: New words get romanization; known words don't
- **Intermediate**: Romanization only for new/complex words
- **Upper-Intermediate**: Minimal romanization; explanations in target language
- **Advanced+**: Full immersion, no translations

### Vocabulary Frequency Buckets (Krashen i+1)
| Stage | Vocabulary Target |
|---|---|
| Beginner | Top 100 most common words |
| Elementary | Top 500 |
| Intermediate | Top 2,000 |
| Upper-Intermediate | Top 3,000 |
| Advanced | Top 5,000 |
| Mastery | Top 8,000 |
| Native | Full 10,000+ |

### Gamification
- XP awarded per lesson completion
- Streak tracking (consecutive active days)
- Points logged to `lang_user_points`

### Access Control
- Language learning requires Pro, Plus, or Pro+ plan
- Free plan users redirected to `/pricing`
- Testing mode users get limited access (1 session)

---

## 14. Feature: PDF Study Tools

**Files**: `src/appwrite/pdfResources.js`, `src/appwrite/pdfNotes.js`, `src/appwrite/pdfHighlights.js`, `src/appwrite/storage.js`, `src/components/PDFViewer.jsx`, `src/components/PDFManager.jsx`, `src/components/PDFLibrary.jsx`, `src/components/PDFNoteEditor.jsx`, `src/components/PDFResourcePanel.jsx`, `src/utils/pdfProcessor.js`

### How It Works
1. User uploads PDF (or image/HTML/SVG) via `FilePromptInput` or `PDFManager`
2. File uploaded to Appwrite Storage bucket
3. Text extracted client-side via `pdfProcessor.js` (pdf.js worker)
4. `createPDFResource()` saves metadata + extracted text to `pdf_resources`
5. `PDFViewer` renders the PDF with react-pdf
6. User can:
   - Add page notes (saved to `pdf_notes`)
   - Highlight text (saved to `pdf_highlights`)
   - Add bookmarks (stored as JSON in `pdf_resources.bookmarks`)
   - Ask AI questions about the PDF content
7. AI uses `smartAnalyzeDocument()` with extracted text as context

### Supported File Types
- PDF (`application/pdf`)
- Word docs (`.doc`, `.docx`)
- Plain text (`.txt`)
- Images (PNG, JPEG, GIF)

### File Size Limits
- Appwrite Storage: 10MB max
- Plan-based limits: Free=5MB, Pro=10MB, Plus=15MB, Pro+=20MB

### PDF Statistics Tracked
- View count, study time (minutes), favorite status, category, tags

---

## 15. Feature: Audio Lectures

**Files**: `src/appwrite/audioLecture.js`, `src/appwrite/r2Storage.js`, `src/components/AudioLectureViewer.jsx`, `src/components/AudioProcessor.jsx`

### Processing Pipeline
1. User uploads audio file (MP3, WAV, M4A, OGG, FLAC, WebM)
2. Audio uploaded to Cloudflare R2 via `uploadAudioToR2()`
3. Transcription: Groq Whisper Large V3 → Gemini multimodal fallback
4. Structured notes generated by DeepSeek:
   - Title (inferred from content)
   - Overview (2-3 sentences)
   - Key Concepts (5-8 items)
   - Detailed Notes (with SVG figures for visual content)
   - Summary
   - Study Questions (5)
5. Metadata + notes saved to `audio_lectures` collection
6. Audio playback via public R2 URL

### SVG Figure Generation in Lecture Notes
DeepSeek is prompted to embed SVG figures inline when the lecture describes:
- Geometric shapes, graphs, process flows, anatomical diagrams, physics diagrams
- Format: `[FIGURE:title]<svg>...</svg>[/FIGURE]`
- Dark background (#1a1b2e), 20% padding zone, labeled elements

### Audio Size Limits
- Free: 10MB, Pro: 25MB, Plus: 50MB, Pro+: 100MB

---

## 16. Feature: YouTube Study

**Files**: `src/appwrite/youtubeStudy.js`, `src/components/YoutubeStudyPanel.jsx`, `appwrite-functions/processYoutube/index.js`

### How It Works
1. User pastes YouTube URL into `YoutubeStudyPanel`
2. Client calls `processYoutubeVideo()` → Appwrite Function `processYoutube`
3. Function checks cache in `youtube_studies` (same videoId = cache hit)
4. If not cached: fetches transcript → DeepSeek analysis → saves to DB
5. Returns: title, 10 summary points, detailed notes, 10 flashcards, 5 quiz questions, 8 key topics
6. UI renders study material with interactive flashcards and quiz

### Supported URL Formats
- `youtube.com/watch?v=ID`
- `youtube.com/embed/ID`
- `youtube.com/v/ID`
- `youtu.be/ID`
- `youtube.com/shorts/ID`

### Limitations
- Requires video to have captions/subtitles enabled
- Transcript truncated to first 3000 words for AI processing
- Cache is shared across all users (same video = same cached result)

---

## 17. Feature: TTS (Text-to-Speech)

**Files**: `src/tts/ttsApi.js`, `src/tts/ttsCache.js`, `src/tts/ttsPlayer.js`, `src/tts/ttsMulti.js`, `src/tts/useTTS.js`, `src/tts/useTTSHook.js`, `src/tts/audioConverter.js`, `appwrite-functions/geminiTTS/index.js`

### Architecture
```
Component → useTTSHook → ttsMulti (chunk splitting) → ttsApi (Appwrite Function call)
                       → ttsCache (SHA-256 keyed Appwrite Storage cache)
                       → ttsPlayer (Web Audio API playback)
```

### How It Works
1. Text split into chunks (long text handled by `ttsMulti.js`)
2. Cache check: SHA-256 hash of `text + voice` → Appwrite Storage lookup
3. Cache miss: call Appwrite Function `geminiTTS` → returns base64 PCM audio
4. Audio cached in Appwrite Storage bucket (key = SHA-256 hash)
5. Usage logged to `tts_usage` collection
6. Audio played via Web Audio API

### Available Voices
| Voice | Character |
|---|---|
| Puck | Energetic, youthful |
| Charon | Deep, authoritative |
| Kore | Warm, friendly (default) |
| Fenrir | Strong, confident |
| Aoede | Melodic, expressive |

### Speaking Styles
cheerfully, seriously, excitedly, calmly, in a friendly way, professionally

---

## 18. Subscription & Billing (Paddle)

**Files**: `src/appwrite/subscription.js`, `appwrite-functions/paddleWebhook/index.js`, `src/pages/Pricing.jsx`

### Plans
| Plan | Price | Key Limits |
|---|---|---|
| Free | $0 | 5 sessions/mo, 500 messages, 3 PDFs, 1 audio, no language learning |
| Pro | $9.99/mo | 30 sessions, 3000 messages, 20 PDFs, 10 audios, language learning |
| Plus | $14.99/mo | 100 sessions, 7000 messages, 60 PDFs, 30 audios |
| Pro+ | $19.99/mo | Unlimited everything |

### Billing Flow
1. User clicks upgrade on Pricing page
2. Paddle.js opens checkout overlay with `appwriteUserId` in `custom_data`
3. Paddle sends webhook to `paddleWebhook` Appwrite Function
4. Function adds plan label to Appwrite user (`pro`, `plus`, `proplus`)
5. Function saves subscription record to `subscriptions` collection
6. Client calls `refreshUser()` to get updated labels
7. `useUsageLimits` hook reads subscription + labels to determine plan

### Plan Detection Priority
1. `subscriptions` collection (most accurate — has expiry date)
2. User labels (`proplus` > `plus` > `pro` > free)

### Subscription Status Values
`active`, `trialing`, `past_due`, `canceled`, `paused`

---

## 19. Usage Limits & Plan Enforcement

**Files**: `src/config/planLimits.js`, `src/config/testingLimits.js`, `src/hooks/useUsageLimits.js`, `src/hooks/useTestingLimits.js`, `src/hooks/useCombinedLimits.js`

### How Limits Work
1. `useCombinedLimits` hook detects if user is in testing mode (has `testing_usage` doc)
2. If testing mode: uses `useTestingLimits` (one-time limits)
3. If normal mode: uses `useUsageLimits` (monthly limits)
4. `canDo(action)` returns `{ allowed, remaining, limit, current }`
5. Components check `canDo()` before performing actions
6. `recordUsage(action)` increments counter after success (optimistic local update + DB write)

### Monthly Limits (Normal Mode)
| Action | Free | Pro | Plus | Pro+ |
|---|---|---|---|---|
| sessions | 5 | 30 | 100 | ∞ |
| messages | 500 | 3000 | 7000 | ∞ |
| pdfs | 3 | 20 | 60 | ∞ |
| audios | 1 | 10 | 30 | ∞ |
| flashcards | 30 | ∞ | ∞ | ∞ |
| mcqs | 20 | ∞ | ∞ | ∞ |
| examPlans | 1 | 3 | 10 | ∞ |
| languageLearning | ✗ | ✓ | ✓ | ✓ |

### Testing Mode Limits (One-Time)
| Action | Limit |
|---|---|
| sessions | 1 |
| pdfs | 1 |
| audios | 1 |
| messages | 100 |
| flashcards | 10 |
| mcqs | 10 |
| examPlans | 1 |
| languageLearningSessions | 1 |
| libraryImports | ∞ |

### Limit Enforcement Components
- `UsageLimitModal` — shown when limit reached (normal mode)
- `TestingLimitModal` — shown when testing limit reached
- `UsageWidget` — shows current usage in navbar/sidebar
- `UpgradeButton` — CTA to upgrade plan

---

## 20. Admin Panel

**Files**: `src/pages/admin/` (AdminLayout, Dashboard, PreRegUsers, DailySlots, Reviews, Settings, TestingUsers)

### Access Control
- Requires `admin` label on Appwrite user account
- `AdminRoute` guard redirects non-admins to `/dashboard`

### Admin Features

**Dashboard** (`/admin`)
- Stats: total pre-registrations, active pre-regs, promo code uses, bonus months earned, estimated owed value, review counts

**Testing Users** (`/admin/testing-users`)
- View all users in `testing_usage` collection
- See per-user usage counts
- Mark users as reviewed / add to pre-reg

**Pre-Reg Users** (`/admin/pre-reg`)
- View all pre-registrations
- Filter by status/type
- See promo code usage per user

**Daily Slots** (`/admin/daily-slots`)
- View today's slot usage (used/total)
- See historical slot data (30 days)
- Cleanup duplicate slot documents

**Reviews** (`/admin/reviews`)
- View all user reviews
- Approve/reject reviews
- Publish/unpublish reviews

**Settings** (`/admin/settings`)
- Toggle pre-registration on/off
- Toggle payments on/off
- Toggle daily free slots on/off
- Set daily slot count
- Toggle individual plans on/off

---

## 21. Pre-Registration System

**Files**: `src/appwrite/admin.js`, `src/pages/PreRegistration.jsx`, `src/components/PreRegStatus.jsx`

### Pre-Registration Types
| Type | How Obtained |
|---|---|
| `paid` | Paid via Paddle pre-reg price |
| `free_slot` | Claimed a daily free slot |
| `reviewer` | Submitted a review after using free slot or testing |

### Referral System
- Each pre-reg user gets a unique promo code (format: `LW` + 6 chars + 4 random)
- When someone uses a promo code: `promoCodeUses` incremented
- Every 10 uses: `plusUntil` extended by 6 months, `bonusMonthsEarned` updated

### Daily Free Slots
- Admin sets daily slot count (e.g., 10 slots/day)
- Date uses US Eastern Time
- Users claim slots → `daily_free_slots.usedSlots` incremented
- Slot usage recorded in `daily_slot_usage`
- After using slot, user can submit review → gets added to `pre_registrations` as `reviewer`

### Completing Pre-Registration
- `completeAllPreRegistrations()` in `admin.js` grants Plus plan to all active pre-reg users
- Calls `grantPlusPlan()` per user → creates/updates `subscriptions` record
- Script also available: `scripts/complete-pre-registrations.js`

---

## 22. Testing Mode

**Files**: `src/appwrite/admin.js` (testing functions), `src/config/testingLimits.js`, `src/hooks/useTestingLimits.js`, `src/components/TestingUserWidget.jsx`, `src/components/TestingLimitModal.jsx`, `src/components/TestingReviewPrompt.jsx`

### What Is Testing Mode
A special mode for invited beta testers. Users in testing mode:
- Have a document in `testing_usage` collection
- Get one-time limits (not monthly) to try all features
- See `TestingUserWidget` in the UI showing their usage
- Are prompted to submit a review after using features
- After submitting review: `addedToPreReg = true` → exits testing mode → gets pre-reg status

### Detection
`useCombinedLimits` calls `getTestingUsageDoc(userId)` on mount. If doc exists and `addedToPreReg !== true` → testing mode active.

### Admin: Adding Testing Users
Admin panel → Testing Users → add user by email/ID → `initializeTestingUsage()` creates the doc.

---

## 23. Cloudflare R2 Storage

**File**: `src/appwrite/r2Storage.js`

### Purpose
Stores audio lecture files. Appwrite Storage is used for PDFs/images; R2 is used for audio because audio files can be large and need public streaming URLs.

### Configuration
- Uses AWS S3 SDK (`@aws-sdk/client-s3`) with R2 endpoint
- Endpoint: `https://{ACCOUNT_ID}.r2.cloudflarestorage.com`
- Region: `auto`
- Bucket: `lastweek-audio`

### File Organization
Files stored as: `{userId}/{timestamp}-{random}.{ext}`

### CORS Policy
`r2-cors-policy.json` in project root — must be applied to R2 bucket for browser uploads to work.

### Functions
| Function | Description |
|---|---|
| `uploadAudioToR2(file, userId)` | Upload audio, returns `{ fileId, url }` |
| `deleteAudioFromR2(fileId)` | Delete audio by file key |

---

## 24. Spaced Repetition (SM-2)

**File**: `src/appwrite/studySchedule.js`, `src/utils/spacedRepetition.js`

### Full SM-2 Algorithm (`studySchedule.js`)
Used for study schedule tracking (topic-level, not flashcard-level).

```
Confidence 1 (Hard):  repetitions=0, interval=1, easeFactor -= 0.2 (min 1.3)
Confidence 2 (Okay):  repetitions++, interval = floor(interval × easeFactor × 0.9)
Confidence 3 (Easy):  repetitions++, interval = floor(interval × easeFactor), easeFactor += 0.1 (max 4.0)
```

- `nextReviewDate` always strictly after today (clamped to tomorrow minimum)
- `upsertStudySchedule(userId, sessionId, subject, topic, confidence)` — creates or updates
- `getDueSchedules(userId)` — returns all topics due today or overdue

### Simple Interval Mapping (`spacedRepetition.js`)
Used for flashcard `nextReviewAt`:
- 1 (Hard) → 1 day
- 2 (Okay) → 3 days
- 3 (Easy) → 7 days

---

## 25. UI Components Reference

### Core Chat & Study
| Component | Purpose |
|---|---|
| `ChatInterface.jsx` | Main chat UI with message list, input, file attachment |
| `StudyInterface.jsx` | Wrapper for study mode pages |
| `EnhancedMessageFormatter.jsx` | Parses and renders AI responses (charts, flashcards, MCQs, math, SVG) |
| `MessageFormatter.jsx` | Simpler markdown renderer |
| `RichTextViewer.jsx` | Rich text display |
| `InlineFlashcard.jsx` | Interactive flashcard in chat |
| `InlineQuiz.jsx` | Interactive MCQ in chat |
| `SessionAssessment.jsx` | 4-question student assessment at session start |
| `SessionActions.jsx` | Session toolbar (save, share, etc.) |
| `SessionSearch.jsx` | Search within session messages |

### PDF & Resources
| Component | Purpose |
|---|---|
| `PDFViewer.jsx` | PDF rendering with react-pdf |
| `PDFManager.jsx` | PDF library management page |
| `PDFLibrary.jsx` | PDF grid/list view |
| `PDFNoteEditor.jsx` | Note editor for PDF pages |
| `PDFResourcePanel.jsx` | Side panel for PDF resources in session |
| `ResourceViewer.jsx` | Generic resource viewer |
| `ResourceSearch.jsx` | Search resources |
| `FileAttachment.jsx` | File attachment display |
| `FilePromptInput.jsx` | Chat input with file upload |

### Audio & Media
| Component | Purpose |
|---|---|
| `AudioLectureViewer.jsx` | Audio lecture player + notes display |
| `AudioProcessor.jsx` | Audio upload and processing UI |
| `SpeakingRecorder.jsx` | Microphone recording for language practice |
| `YoutubeStudyPanel.jsx` | YouTube URL input + study material display |

### Flashcards
| Component | Purpose |
|---|---|
| `Flashcard.jsx` | Standalone flashcard component |
| `FlashcardCreateModal.jsx` | Manual flashcard creation |
| `ConfidenceRater.jsx` | 1/2/3 confidence rating buttons |
| `BulkActions.jsx` | Bulk select/move/delete flashcards |

### Charts & Visuals
| Component | Purpose |
|---|---|
| `ChartRenderer.jsx` | Recharts wrapper (bar/line/pie/area) |
| `MermaidDiagram.jsx` | Mermaid diagram renderer |
| `SVGFigure.jsx` | SVG figure renderer |
| `VisualGenerator.jsx` | Visual content generation UI |

### Navigation & Layout
| Component | Purpose |
|---|---|
| `Navbar.jsx` | Top navigation bar |
| `ProfileDropdown.jsx` | User profile menu |
| `ThemeToggle.jsx` | Dark/light mode toggle |
| `QuickActions.jsx` | Quick action buttons |
| `MigrationHelper.jsx` | Legacy data migration (runs on mount) |

### Modals & Overlays
| Component | Purpose |
|---|---|
| `UsageLimitModal.jsx` | Shown when monthly limit reached |
| `TestingLimitModal.jsx` | Shown when testing limit reached |
| `KeyboardShortcutsModal.jsx` | Keyboard shortcuts reference |
| `TTSHelpModal.jsx` | TTS help/info |
| `OrientationPrompt.jsx` | Mobile landscape orientation prompt |

### Status & Feedback
| Component | Purpose |
|---|---|
| `UsageWidget.jsx` | Current usage display |
| `StorageIndicator.jsx` | Storage usage bar |
| `UpgradeButton.jsx` | Plan upgrade CTA |
| `PreRegStatus.jsx` | Pre-registration status display |
| `TestingUserWidget.jsx` | Testing mode usage display |
| `TestingReviewPrompt.jsx` | Prompt to submit review |
| `SlotRefreshCountdown.jsx` | Countdown to next daily slot refresh |
| `ReviewForm.jsx` | User review submission form |
| `ReviewList.jsx` | Display list of reviews |

### Utility
| Component | Purpose |
|---|---|
| `ErrorBoundary.jsx` | React error boundary |
| `LoadingSpinner.jsx` | Loading indicator |
| `LoadingDots.jsx` | Animated loading dots |
| `DebugInfo.jsx` | Debug information panel |
| `Icons.jsx` | SVG icon library |
| `MathKeyboard.jsx` | Math symbol keyboard |
| `PomodoroTimer.jsx` | Pomodoro timer for Focus Breakdown mode |
| `StudyStatistics.jsx` | Study stats display |

---

## 26. Hooks Reference

| Hook | File | Purpose |
|---|---|---|
| `useSession` | `hooks/useSession.js` | Create/load/save sessions, manage messages |
| `useAuth` | `context/AuthContext.jsx` | Auth state (via context) |
| `useCombinedLimits` | `hooks/useCombinedLimits.js` | Unified limit checking (testing + normal) |
| `useUsageLimits` | `hooks/useUsageLimits.js` | Monthly plan limits |
| `useTestingLimits` | `hooks/useTestingLimits.js` | Testing mode one-time limits |
| `useSessionWithLimits` | `hooks/useSessionWithLimits.js` | Session creation with limit checks |
| `useSessionAssessment` | `hooks/useSessionAssessment.js` | Student assessment flow |
| `useSessionSummary` | `hooks/useSessionSummary.js` | Auto-generate session summary |
| `useDeepSeek` | `hooks/useDeepSeek.js` | DeepSeek streaming hook |
| `useGemini` | `hooks/useGemini.js` | Gemini API hook |
| `useDualAI` | `hooks/useDualAI.js` | Dual AI provider hook |
| `useAdminSettings` | `hooks/useAdminSettings.js` | Admin settings fetch |
| `useKeyboardShortcuts` | `hooks/useKeyboardShortcuts.js` | Global keyboard shortcuts |
| `useMobileViewport` | `hooks/useMobileViewport.js` | Mobile viewport detection |
| `useOrientation` | `hooks/useOrientation.js` | Device orientation detection |
| `usePerformanceTracking` | `hooks/usePerformanceTracking.js` | Performance metrics |
| `useScrollToTop` | `hooks/useScrollToTop.js` | Scroll to top on route change |
| `useVisualGeneration` | `hooks/useVisualGeneration.js` | Visual content generation |

---

## 27. Utilities Reference

| File | Purpose |
|---|---|
| `utils/promptBuilder.js` | All AI system prompts for all 5 modes + shared rules (flashcard format, MCQ format, math rules, SVG rules, Mermaid rules, chart rules) |
| `utils/chartFixer.js` | Auto-detects and repairs malformed AI chart output (only runs on responses < 2000 chars with chart keywords) |
| `utils/spacedRepetition.js` | Simple interval mapping for flashcard `nextReviewAt` |
| `utils/contextManager.js` | Manages conversation context window (truncation) |
| `utils/pdfProcessor.js` | Client-side PDF text extraction via pdf.js |
| `utils/exportImport.js` | Export/import study data |
| `utils/geminiSpeech.js` | Gemini speech utilities |
| `utils/speech.js` | Web Speech API utilities |
| `utils/textToSpeech.js` | TTS utilities |
| `utils/studyUtils.js` | General study helper functions |

---

## 28. Styles Reference

All CSS files in `src/styles/`. Each component/page has a dedicated CSS file.

| File | Covers |
|---|---|
| `global.css` | CSS variables, reset, base styles |
| `ModePage.css` | Shared styles for all 5 study mode pages |
| `mobile-responsive.css` | Mobile breakpoints and responsive overrides |
| `MessageFormatter.css` | Chat message formatting |
| `RichTextViewer.css` | Rich text display |
| `FilePromptInput.css` | File upload input |
| `ErrorBoundary.css` | Error boundary display |
| `Landing.css`, `LandingNew.css`, `LandingPro.css` | Landing page variants |
| `AudioLectureViewer.css`, `AudioLectureViewerMobile.css` | Audio lecture UI |
| `PDFViewer.css`, `PDFViewerMobile.css` | PDF viewer |
| `ExamSession.css` | Exam session page (uses `es-*` CSS classes) |

---

## 29. Known Issues & Notes

### Critical Configuration Gaps
1. **`VITE_APPWRITE_STORAGE_BUCKET_ID`** is set to `your_bucket_id` — PDF uploads will fail
2. **`VITE_APPWRITE_PROCESS_YOUTUBE_FUNCTION_ID`** is set to `your_function_id` — YouTube study will fail
3. **`VITE_GEMINI_TTS_FUNCTION_ID`** is set to `your_function_id` — TTS will fail
4. **Cloudflare R2 credentials** are all set to placeholders — audio lecture uploads will fail
5. **Paddle tokens** are all set to placeholders — billing will fail

### Architecture Notes
- **API keys in browser bundle**: `VITE_DEEPSEEK_API_KEY`, `VITE_GEMINI_API_KEY`, `VITE_GROQ_API_KEY` are exposed client-side. This is intentional for the current architecture but means keys can be extracted from the bundle.
- **R2 credentials in browser**: `VITE_CLOUDFLARE_R2_ACCESS_KEY_ID` and `VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY` are also client-side. This is a security concern for production — consider proxying through an Appwrite Function.
- **Paddle webhook**: No signature verification. Must add `PADDLE_WEBHOOK_SECRET` verification before going live.

### Behavioral Notes
- **Chart fixer** (`chartFixer.js`) only runs on responses shorter than 2000 chars containing chart keywords — won't touch long lecture notes
- **MCQ answers** persist in `localStorage` keyed by `mcq_answer_{messageId}_q{n}` — survive page refresh
- **Flashcards** saved to Appwrite on every confidence rating
- **Audio lectures** at Appwrite column limit — `trackAudioLectureView` and `trackAudioStudyTime` are silent no-ops
- **Language lessons** have duplicate prevention — same userId+moduleId+stageName updates in place instead of creating new doc
- **Daily slots** use US Eastern Time (hardcoded UTC-5, no DST adjustment)
- **Session mode `exam_prep`** is excluded from `getUserSessions()` — exam sessions live at `/exam-session`, not `/session`
- **`MigrationHelper`** runs on every app mount to migrate legacy resource data

### Unused/Legacy Files
- `src/pages/Dashboard.jsx` — replaced by `DashboardEnhanced.jsx`
- `src/pages/Landing.jsx`, `src/pages/LandingNew.jsx` — replaced by `src/pages/landing/LandingPage.jsx`
- `src/pages/Documentation.jsx` — replaced by `src/pages/docs/DocsPage.jsx`
- `src/appwrite/resourceLibrary.js` — resource library feature (partially implemented)
- `src/pages/ResourceLibrary.jsx` — resource library page

### Testing
- Test runner: Vitest
- Test files: `src/appwrite/__tests__/studySchedule.test.js`, `src/hooks/__tests__/useDeepSeek.streaming.test.js`, `src/utils/__tests__/contextManager.test.js`, `src/utils/__tests__/pdfProcessor.test.js`
- Run: `npm test` (single run) or `npm run test:watch`

### Scripts
| Script | Purpose |
|---|---|
| `scripts/clear-all-data.js` | Clear all user data from Appwrite |
| `scripts/clear-lang-data.js` | Clear language learning data |
| `scripts/clear-lessons-only.js` | Clear only lesson data |
| `scripts/complete-pre-registrations.js` | Grant Plus to all pre-reg users |
| `scripts/setup-resource-sharing.js` | Setup resource sharing collections |
| `scripts/setup-tts-collections.js` | Create TTS collections in Appwrite |
| `scripts/gen_design.py` | Design generation script |

### Deployment
- Deployed on Vercel (`.vercel/` config present)
- Build: `npm run build` → `dist/`
- Preview: `npm run preview`

---

*End of audit. Last updated: May 31, 2026.*

---

## 30. Business & Pricing Context (from PRICING_STRATEGY.md & COST_SUMMARY.md)

### Real Unit Economics
- **$0.52 per active user per month** (corrected from earlier $0.22 estimate)
- The higher cost is because each AI exchange sends ~8,100 tokens (3,000 system prompt + 5,000 history + 100 user message + 800 AI response), not the simplified 2,000 token assumption
- AI conversation = 96% of the total bill

### Cost at Scale
| Users | Monthly Cost | Per User |
|---|---|---|
| 500 | $266 | $0.53 |
| 1,000 | $516 | $0.52 |
| 5,000 | $2,521 | $0.50 |
| 10,000 | $5,028 | $0.50 |
| 50,000 | $25,079 | $0.50 |
| 100,000 | $50,143 | $0.50 |

### Revenue Margins (Freemium, 30% conversion at $9.99/mo)
- 1,000 users → $2,481 profit (83% margin)
- 10,000 users → $24,942 profit (83% margin)
- Break-even: ~60 paying users

### Pricing Strategy Notes
- **PRICING_STRATEGY.md** describes a 3-tier model: Free / Pro ($9.99) / Max ($19.99) — note the current code uses `proplus` not `max` as the top tier name
- Free tier: 20 messages/day, 5 sessions, 2 PDFs, 1 audio, 50 flashcards, language learning Module 1 only
- The `planLimits.js` config uses slightly different limits than the strategy doc — the code is the source of truth
- School/B2B plan ($299/month, 50 students) is planned but not yet implemented in code

### Cost Reduction Priorities
1. Cache AI responses (saves 20-30%) — infrastructure partially built
2. Route simple questions to Gemini Flash (3.6× cheaper than DeepSeek)
3. Shorten system prompts in `promptBuilder.js` (saves 10-15%)
4. Self-host AI at 100K+ users (saves ~89% of AI bill)

---

## 31. Appwrite Collection Setup Reference (from docs/ADMIN_PREREG_APPWRITE_SETUP.md)

### Critical Permission Notes
| Collection | Read | Create | Update | Delete |
|---|---|---|---|---|
| `admin_settings` | All Users | `role:admin` | `role:admin` | `role:admin` |
| `pre_registrations` | All Users | **All Users** | **All Users** | `role:admin` |
| `promo_code_usage` | All Users | `role:admin` | `role:admin` | `role:admin` |
| `user_reviews` | All Users | **All Users** | `role:admin` | `role:admin` |
| `daily_free_slots` | **Any** | All Users | All Users | `role:admin` |
| `daily_slot_usage` | **Any** | All Users | All Users | `role:admin` |
| `testing_usage` | All Users | **All Users** | **All Users** | `role:admin` |
| `subscriptions` | All Users | All Users | All Users | `role:admin` |

**Why `daily_free_slots` and `daily_slot_usage` need "Any" (not "All Users") for Read:**
Unauthenticated users on the `/auth` page need to check slot availability before registering. "All Users" only works for authenticated users.

**Why `pre_registrations` and `user_reviews` need "All Users" for Create:**
Testing users create their own records when submitting reviews.

### Required Indexes
- `pre_registrations`: `userId` (unique), `email` (unique), `promoCode` (unique), `status`
- `daily_free_slots`: `date` (unique — prevents duplicate documents for same day)
- `testing_usage`: `userId` (unique), `email`
- `usage_tracking`: `userId + month` (compound, unique)

### Admin Settings Singleton
Document ID must be exactly `admin_settings_doc` in the `admin_settings` collection.

---

## 32. Resource Sharing Schema Updates (from docs/APPWRITE_UPDATES.md)

The resource library feature requires additional attributes on existing collections:

### `pdf_resources` — New Attributes Needed
| Attribute | Type | Default | Purpose |
|---|---|---|---|
| `isImported` | Boolean | `false` | True if copied from shared library |
| `originalResourceId` | String(36) | null | Source resource ID |
| `addCount` | Integer | `0` | How many users added this resource |

### `audio_lectures` — New Attributes Needed
| Attribute | Type | Default | Purpose |
|---|---|---|---|
| `isImported` | Boolean | `false` | True if copied from shared library |
| `originalLectureId` | String(36) | null | Source lecture ID |
| `addCount` | Integer | `0` | How many users added this lecture |

### New Indexes Needed
- `pdf_resources`: `original_resource_idx` (originalResourceId), `user_original_pdf_idx` (userId + originalResourceId)
- `audio_lectures`: `original_lecture_idx` (originalLectureId), `user_original_audio_idx` (userId + originalLectureId)

> ⚠️ These attributes are referenced in `src/appwrite/resourceLibrary.js` but may not be created in Appwrite yet. The app has graceful fallbacks — it won't crash without them, but "Already Added" detection and `addCount` display won't work.

---

## 33. Paddle Live Setup Checklist (from docs/PADDLE_LIVE_SETUP.md)

### To Go Live with Payments
1. Complete Paddle business verification
2. Switch to Live mode in Paddle Dashboard
3. Create 4 products/prices: Pre-Reg ($5 one-time), Pro ($9.99/mo), Plus ($14.99/mo), Pro+ ($19.99/mo)
4. Update `.env`: `VITE_PADDLE_ENV=live`, `VITE_PADDLE_CLIENT_TOKEN=live_clnt_...`
5. Update all `VITE_PADDLE_*_PRICE_ID` vars with live price IDs
6. Add webhook signature verification to `paddleWebhook/index.js` (currently missing — security risk)
7. Configure webhook in Paddle Live Dashboard pointing to Appwrite Function URL

### Webhook Signature Verification (TODO — not yet implemented)
```javascript
import crypto from 'crypto';
const verifyPaddleSignature = (payload, signature, secret) => {
  const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  return signature === expected;
};
```

---

## 34. Developer Notes (from DEVELOPER_CONTEXT.md)

### CSS Architecture
- No CSS framework (no Tailwind, no Bootstrap)
- All styles are plain CSS with CSS custom properties
- Theme variables defined in `src/styles/global.css`
- Key variables: `--color-accent` (#a855f7 purple), `--color-bg-primary`, `--color-text-primary`

### Common Debugging
| Problem | Cause | Fix |
|---|---|---|
| Charts not rendering | AI response missing `[CHART:...]` wrapper | Check `chartFixer.js` logs |
| Flashcards wrong count | AI not using `===` separator | Check `[extractFlashcards]` logs |
| Audio lecture notes disappearing | `chartFixer` triggered on long content | Check 2000-char guard in `chartFixer.js` |
| Appwrite 404 on document | Document deleted but reference remains | Handled gracefully in `PDFLibrary.jsx` |
| MCQ answers not persisting | `messageId` undefined (message not saved yet) | Check localStorage keys |

### Adding New Features
- **New Appwrite collection**: Create in console → add env var → add constant in `database.js` → export CRUD functions
- **New study mode**: Copy `MentalModel.jsx` → add prompt in `promptBuilder.js` → add route in `App.jsx` → add case in `SessionRoute` switch → add to `ModeSelector.jsx`
- **New chart type**: Add case in `ChartRenderer.jsx` → add to `CHART_REGEX` → add example to `VISUAL_EXAMPLES` in `promptBuilder.js`

### Origin Story (from new-prompt.md)
The pre-registration system, admin panel, daily free slots, promo codes, testing mode, and review system were all designed in a single planning session. The original prompt described the full vision: 2 types of pre-reg (paid $5 + daily free slots), review-to-pre-reg conversion, promo code referral system, and a master admin panel. All of this is now fully implemented.

---

*End of audit. Last updated: May 31, 2026.*
