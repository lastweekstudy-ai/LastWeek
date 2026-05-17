# LastWeek — Infrastructure & Cost Analysis

All external services, API keys, environment variables, and cost projections for 1,000 and 10,000 active users.

---

## Environment Variables Reference

```env
# ── Appwrite ──────────────────────────────────────────────────────────────────
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<your_project_id>
VITE_APPWRITE_DATABASE_ID=<your_database_id>
VITE_APPWRITE_STORAGE_BUCKET_ID=<your_bucket_id>

# Collections (IDs must match what you created in Appwrite console)
VITE_APPWRITE_SESSIONS_COLLECTION_ID=sessions
VITE_APPWRITE_MESSAGES_COLLECTION_ID=messages
VITE_APPWRITE_FLASHCARDS_COLLECTION_ID=flashcards
VITE_APPWRITE_FLASHCARD_COLLECTIONS_COLLECTION_ID=flashcard_collections
VITE_APPWRITE_PROFILES_COLLECTION_ID=user_profiles
VITE_APPWRITE_ATTACHMENTS_COLLECTION_ID=file_attachments
VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID=pdf_resources
VITE_APPWRITE_PDF_NOTES_COLLECTION_ID=pdf_notes
VITE_APPWRITE_PDF_HIGHLIGHTS_COLLECTION_ID=pdf_highlights
VITE_APPWRITE_STUDY_SCHEDULE_COLLECTION_ID=study_schedule
VITE_APPWRITE_SESSION_CONTEXT_COLLECTION_ID=session_context
VITE_APPWRITE_EXAM_PLANS_COLLECTION_ID=exam_plans
VITE_APPWRITE_YOUTUBE_STUDIES_COLLECTION_ID=youtube_studies
VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID=audio_lectures
VITE_TTS_CACHE_COLLECTION_ID=tts_cache_metadata
VITE_TTS_USAGE_COLLECTION_ID=tts_usage

# Appwrite Functions
VITE_GEMINI_TTS_FUNCTION_ID=<gemini_tts_function_id>
VITE_APPWRITE_PROCESS_YOUTUBE_FUNCTION_ID=<process_youtube_function_id>

# Appwrite server-side (used in Appwrite functions, not exposed to browser)
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<your_project_id>
APPWRITE_DATABASE_ID=<your_database_id>
APPWRITE_API_KEY=<your_server_api_key>

# ── Language Learning Collections ─────────────────────────────────────────────
VITE_LANG_USERS_COLLECTION_ID=lang_users
VITE_LANG_ROADMAPS_COLLECTION_ID=lang_roadmaps
VITE_LANG_LESSONS_COLLECTION_ID=lang_lessons
VITE_LANG_LESSON_ATTEMPTS_COLLECTION_ID=lang_lesson_attempts
VITE_LANG_PRACTICE_SESSIONS_COLLECTION_ID=lang_practice_sessions
VITE_LANG_FLASHCARD_REVIEWS_COLLECTION_ID=lang_flashcard_reviews
VITE_LANG_CONVERSATION_SESSIONS_COLLECTION_ID=lang_conversation_sessions
VITE_LANG_USER_POINTS_COLLECTION_ID=lang_user_points
VITE_LANG_SRS_ITEMS_COLLECTION_ID=lang_srs_items

# ── AI Providers ──────────────────────────────────────────────────────────────
VITE_DEEPSEEK_API_KEY=sk-<your_deepseek_key>       # from platform.deepseek.com
VITE_GROQ_API_KEY=gsk_<your_groq_key>              # from console.groq.com
VITE_GEMINI_API_KEY=AIzaSy<your_gemini_key>        # from aistudio.google.com

# ── Cloudflare R2 (Audio Storage) ─────────────────────────────────────────────
VITE_CLOUDFLARE_ACCOUNT_ID=<your_account_id>
VITE_CLOUDFLARE_R2_ACCESS_KEY_ID=<your_r2_access_key>
VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY=<your_r2_secret>
VITE_CLOUDFLARE_R2_BUCKET_NAME=lastweek-audio
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://<your_r2_public_url>.r2.dev
```

---

## Services Overview

### 1. Appwrite Cloud (Database + Auth + Storage + Functions)
- **URL:** https://cloud.appwrite.io
- **Plan:** Pro ($15/month base)
- **Used for:** User auth, all database collections, file storage (PDFs), serverless functions (TTS, YouTube)
- **Pricing model:** Per-project flat fee + usage overages
  - Free tier: 75K requests/month, 2GB storage, 1GB bandwidth
  - Pro: $15/month + $0.00035/request over 3.5M, $0.03/GB storage over 150GB

### 2. DeepSeek API (Primary AI)
- **URL:** https://platform.deepseek.com
- **Model:** `deepseek-chat` (DeepSeek-V3)
- **Pricing:** $0.27/M input tokens, $1.10/M output tokens (cache miss)
- **Used for:** All chat completions, exam sessions, language learning

### 3. Groq API (Fallback AI)
- **URL:** https://console.groq.com
- **Model:** `llama-3.3-70b-versatile`
- **Pricing:** $0.59/M input tokens, $0.79/M output tokens
- **Free tier:** 14,400 requests/day, 500K tokens/minute
- **Used for:** Fallback when DeepSeek fails or rate-limits

### 4. Google Gemini API (Final Fallback + TTS)
- **URL:** https://aistudio.google.com
- **Models:** `gemini-2.0-flash` (chat), `gemini-2.5-flash` (TTS)
- **Pricing (chat):** $0.075/M input tokens, $0.30/M output tokens (flash)
- **Pricing (TTS):** $0.50/M characters
- **Free tier:** 15 RPM, 1M tokens/day (flash)
- **Used for:** Final AI fallback + text-to-speech audio generation

### 5. Cloudflare R2 (Audio Storage)
- **URL:** https://dash.cloudflare.com → R2
- **Pricing:**
  - Storage: $0.015/GB/month
  - Class A operations (write): $4.50/M requests
  - Class B operations (read): $0.36/M requests
  - Egress: **FREE** (no egress fees — major advantage over S3)
- **Used for:** Storing generated TTS audio files

---

## Usage Assumptions (per active user per month)

| Activity | Estimate |
|---|---|
| Chat messages sent | 150 |
| Avg tokens per exchange (in+out) | 2,000 |
| Flashcards created | 30 |
| MCQs answered | 50 |
| TTS requests | 20 |
| Avg TTS chars per request | 500 |
| PDFs uploaded | 2 (avg 2MB each) |
| Audio lectures | 1 (avg 5MB) |
| Appwrite DB reads | 2,000 |
| Appwrite DB writes | 500 |

---

## Cost Projection — 1,000 Active Users/Month

### AI Costs
| Provider | Tokens/month | Cost |
|---|---|---|
| DeepSeek (primary, ~80% traffic) | 240M tokens | $0.27×120M + $1.10×120M = **$164** |
| Groq (fallback, ~15% traffic) | 45M tokens | $0.59×22.5M + $0.79×22.5M = **$31** |
| Gemini (fallback, ~5% traffic) | 15M tokens | $0.075×7.5M + $0.30×7.5M = **$3** |
| **AI Subtotal** | | **~$198/month** |

### TTS Costs (Gemini)
- 1,000 users × 20 requests × 500 chars = 10M chars/month
- 10M chars × $0.50/M = **$5/month**

### Storage Costs (Cloudflare R2)
- Audio: 1,000 users × 1 lecture × 5MB = 5GB → $0.075
- PDFs: 1,000 users × 2 × 2MB = 4GB → $0.06
- R2 writes: ~21,000 → $0.09
- R2 reads: ~200,000 → $0.07
- **R2 Subtotal: ~$0.30/month**

### Appwrite Costs
- DB requests: 1,000 × 2,500 = 2.5M/month (within Pro plan)
- Storage: ~10GB (within Pro plan)
- Functions: ~21,000 invocations (within Pro plan)
- **Appwrite: $15/month (Pro plan, no overages)**

### Total — 1,000 Users
| Service | Monthly Cost |
|---|---|
| DeepSeek | $164 |
| Groq | $31 |
| Gemini (chat fallback) | $3 |
| Gemini TTS | $5 |
| Cloudflare R2 | $0.30 |
| Appwrite Pro | $15 |
| **TOTAL** | **~$218/month** |
| **Per user** | **~$0.22/user/month** |

---

## Cost Projection — 10,000 Active Users/Month

### AI Costs
| Provider | Tokens/month | Cost |
|---|---|---|
| DeepSeek (80%) | 2.4B tokens | $0.27×1.2B + $1.10×1.2B = **$1,644** |
| Groq (15%) | 450M tokens | $0.59×225M + $0.79×225M = **$310** |
| Gemini (5%) | 150M tokens | $0.075×75M + $0.30×75M = **$28** |
| **AI Subtotal** | | **~$1,982/month** |

### TTS Costs
- 10,000 × 20 × 500 chars = 100M chars
- 100M × $0.50/M = **$50/month**

### Storage Costs (Cloudflare R2)
- Audio: 50GB → $0.75
- PDFs: 40GB → $0.60
- R2 operations: ~$1.50
- **R2 Subtotal: ~$3/month**

### Appwrite Costs
- DB requests: 10,000 × 2,500 = 25M/month
- Over Pro plan (3.5M included): 21.5M × $0.00035 = **$7.50 overage**
- Storage: ~100GB (within Pro 150GB)
- Functions: ~210,000 invocations (within Pro)
- **Appwrite: $15 + $7.50 = ~$23/month**

### Total — 10,000 Users
| Service | Monthly Cost |
|---|---|
| DeepSeek | $1,644 |
| Groq | $310 |
| Gemini (chat fallback) | $28 |
| Gemini TTS | $50 |
| Cloudflare R2 | $3 |
| Appwrite Pro | $23 |
| **TOTAL** | **~$2,058/month** |
| **Per user** | **~$0.21/user/month** |

---

## Cost Optimization Strategies

### Reduce AI costs (biggest lever)
1. **Cache common responses** — store AI responses for identical prompts in Appwrite, serve cached version for 24h
2. **Trim context window** — `contextManager.js` already limits to 28K tokens; reduce to 16K for simple queries
3. **Use Gemini Flash more** — at $0.075/M input it's 3.6× cheaper than DeepSeek for simple tasks
4. **Prompt compression** — the system prompts in `promptBuilder.js` are ~3,000 tokens each; reducing by 30% saves ~$60/month at 10K users

### Reduce TTS costs
1. **Cache TTS audio** — already implemented via `tts_cache_metadata` collection; ensure cache hit rate > 60%
2. **Limit TTS length** — cap at 300 chars per request instead of 500

### Reduce Appwrite costs
1. **Batch writes** — combine multiple small writes into one document update
2. **Paginate reads** — avoid loading all messages; load last 50 only

### Reduce R2 costs
- R2 has no egress fees so costs stay minimal even at scale

---

## Scaling Thresholds

| Users | Monthly Cost | Action Needed |
|---|---|---|
| < 500 | < $110 | Free tiers cover most usage |
| 500–2,000 | $110–$440 | Appwrite Pro sufficient |
| 2,000–10,000 | $440–$2,100 | Monitor DeepSeek spend closely |
| 10,000–50,000 | $2,100–$10,500 | Negotiate DeepSeek volume pricing; consider self-hosted Llama |
| 50,000+ | $10,500+ | Self-host AI (Ollama/vLLM on GPU), switch to Appwrite self-hosted |

---

## API Key Sources

| Service | Where to Get Key | Key Format |
|---|---|---|
| DeepSeek | https://platform.deepseek.com/api_keys | `sk-...` (48+ chars) |
| Groq | https://console.groq.com/keys | `gsk_...` |
| Gemini | https://aistudio.google.com/app/apikey | `AIzaSy...` |
| Appwrite | Appwrite Console → Project → API Keys | Long hex string |
| Cloudflare R2 | Cloudflare Dashboard → R2 → Manage API Tokens | Access key + secret |

---

## Appwrite Setup Checklist

### Collections to create (all in one database)
- [ ] `sessions` — userId, mode, subject, title, summary, createdAt, updatedAt
- [ ] `messages` — sessionId, userId, role, content, createdAt
- [ ] `flashcards` — userId, sessionId, front, back, confidence, nextReviewAt, collectionId, source, subject
- [ ] `flashcard_collections` — userId, name, color, icon, createdAt
- [ ] `user_profiles` — userId, displayName, currentMode, totalSessions, createdAt
- [ ] `file_attachments` — userId, sessionId, fileName, fileType, fileSize, fileId, content, createdAt
- [ ] `pdf_resources` — userId, sessionId, fileName, fileId, content, createdAt, studyTime
- [ ] `pdf_notes` — userId, resourceId, content, position, createdAt
- [ ] `pdf_highlights` — userId, resourceId, text, color, position, createdAt
- [ ] `study_schedule` — userId, sessionId, subject, topic, confidence, nextReviewAt, createdAt
- [ ] `session_context` — sessionId, userId, currentLevel, learningGoal, timeAvailable, preferredStyle
- [ ] `exam_plans` — userId, examName, examDate, topics (JSON string), createdAt
- [ ] `youtube_studies` — userId, sessionId, videoUrl, transcript, summary, createdAt
- [ ] `audio_lectures` — userId, sessionId, fileName, audioUrl, lectureNotes, transcript, createdAt
- [ ] `tts_cache_metadata` — text, audioUrl, createdAt, expiresAt
- [ ] `tts_usage` — userId, chars, createdAt
- [ ] Language collections (lang_users, lang_roadmaps, lang_lessons, lang_lesson_attempts, lang_practice_sessions, lang_flashcard_reviews, lang_conversation_sessions, lang_user_points, lang_srs_items)

### Indexes required on `flashcards`
- `userId` (key)
- `sessionId` (key)
- `userId + nextReviewAt` (compound) — for "Due Today" queries
- `userId + confidence` (compound)
- `userId + createdAt` (compound)
- `sessionId + nextReviewAt` (compound)

### Appwrite Functions
1. **geminiTTS** — Node.js, env vars: `GEMINI_API_KEY`, `APPWRITE_*`
2. **processYoutube** — Node.js, env vars: `DEEPSEEK_API_KEY`, `APPWRITE_*`

### Storage Bucket
- Create one bucket for PDF/file uploads
- Set max file size: 20MB
- Allowed MIME types: `application/pdf`, `image/*`, `text/*`, `audio/*`
