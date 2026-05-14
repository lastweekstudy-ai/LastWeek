# Technical Architecture & Implementation Guide

**Complete Technical Documentation for LastWeek Language Learning System**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [AI Models & APIs](#ai-models--apis)
4. [Appwrite Backend](#appwrite-backend)
5. [Frontend Architecture](#frontend-architecture)
6. [Data Flow](#data-flow)
7. [Key Packages & Dependencies](#key-packages--dependencies)
8. [Module Structure](#module-structure)
9. [API Integration](#api-integration)
10. [Database Schema](#database-schema)

---

## System Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages: LanguageLearning, Lesson, Practice, etc.    │   │
│  │  Components: ChatInterface, Flashcard, etc.         │   │
│  │  Services: languageAI, aiProvider, storage          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              API Layer (Services & Providers)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  aiProvider.js: Groq, DeepSeek, Gemini, OpenRouter  │   │
│  │  languageAI.js: Lesson generation, evaluation       │   │
│  │  appwrite/: Database, storage, auth operations      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Services                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AI Models:                                          │   │
│  │  - Groq (Llama 70B, 8B, Gemma, Whisper)            │   │
│  │  - Google Gemini 2.0 Flash                          │   │
│  │  - DeepSeek Chat                                    │   │
│  │  - OpenRouter (free vision models)                  │   │
│  │                                                      │   │
│  │  Backend:                                            │   │
│  │  - Appwrite (Database, Auth, Storage)              │   │
│  │  - AWS S3 / Cloudflare R2 (File Storage)           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.5 | UI framework |
| **Vite** | 8.0.10 | Build tool & dev server |
| **React Router** | 7.14.2 | Client-side routing |
| **React Markdown** | 10.1.0 | Markdown rendering |
| **React PDF** | 9.1.1 | PDF viewing |
| **Recharts** | 3.8.1 | Data visualization |
| **Mermaid** | 11.14.0 | Diagram rendering |
| **KaTeX** | 0.16.22 | Math equation rendering |
| **Monaco Editor** | 4.7.0 | Code editor |

### Backend & Services

| Service | Purpose |
|---------|---------|
| **Appwrite** | Database, authentication, file storage |
| **AWS S3** | File storage (images, PDFs, audio) |
| **Cloudflare R2** | Alternative file storage |

### AI & LLM APIs

| Provider | Models | Purpose |
|----------|--------|---------|
| **Groq** | Llama 70B, 8B, Gemma, Whisper | Fast inference, transcription |
| **Google Gemini** | Gemini 2.0 Flash | Vision, large context |
| **DeepSeek** | DeepSeek Chat | Reliable fallback |
| **OpenRouter** | Free vision models | Vision fallback |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | 10.2.1 | Code linting |
| **Vitest** | 4.1.5 | Unit testing |
| **JSDOM** | 29.1.1 | DOM testing |
| **Testing Library** | 16.3.2 | React component testing |

---

## AI Models & APIs

### 1. Groq API

**Endpoint**: `https://api.groq.com/openai/v1/chat/completions`

**Models Available**:
- `llama-3.3-70b-versatile` - Best reasoning (12k TPM)
- `llama-3.1-8b-instant` - Fast fallback (6k TPM)
- `gemma2-9b-it` - Google Gemma fallback
- `whisper-large-v3` - Audio transcription

**Rate Limits**:
- Llama 70B: 1000 RPD, 12k TPM
- Llama 8B: 14400 RPD, 6k TPM
- **Daily Limit**: 100k tokens per day (free tier)

### 2. Google Gemini API

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

**Features**:
- 2M context window
- Native PDF/image/video support
- Vision capabilities
- Rate Limit: 1500 RPD, 15 RPM (free tier)

### 3. DeepSeek API

**Endpoint**: `https://api.deepseek.com/chat/completions`

**Features**:
- No strict TPM limits (paid)
- Reliable fallback
- Cost: $0.14–$0.28 per 1M tokens

### 4. OpenRouter API

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`

**Free Vision Models**:
- `baidu/qianfan-ocr-fast:free` - OCR-optimized
- `google/gemma-4-26b-a4b-it:free` - Google Gemma 4

### AI Provider Failover Chain

```
For JSON Generation (Lessons):
Groq 70B → DeepSeek → Gemini → Groq 8B → Groq Gemma

For Chat/Streaming:
Groq 70B → DeepSeek → Gemini → Groq 8B

For Large Context (>8k tokens):
DeepSeek → Gemini → Groq 8B

For Vision/Image Analysis:
Gemini Vision → Gemini 1.5 Flash → OpenRouter Vision
```

---

## Appwrite Backend

### Configuration

**Version**: 25.0.0  
**Endpoint**: `https://sgp.cloud.appwrite.io/v1`  
**Database ID**: `69f742a2001f393e4b85`

### Collections

```javascript
const COLLECTIONS = {
  USERS: 'users',
  LANGUAGE_USERS: 'lang_users',
  LESSONS: 'lang_lessons',
  PRACTICE: 'lang_practice',
  PROGRESS: 'lang_progress',
  FLASHCARDS: 'flashcards',
  STUDY_SCHEDULE: 'study_schedule',
  EXAM_PLANNER: 'exam_planner',
  PDF_RESOURCES: 'pdf_resources',
  PDF_NOTES: 'pdf_notes',
  PDF_HIGHLIGHTS: 'pdf_highlights',
  AUDIO_LECTURES: 'audio_lectures',
  YOUTUBE_STUDY: 'youtube_study',
  RESOURCE_LIBRARY: 'resource_library'
};
```

### Key Services

**File**: `src/appwrite/languageLearning.js`

- `getLanguageUser()` - Get user profile
- `saveLessonProgress()` - Save lesson data
- `getAllLessons()` - Get all lessons
- `addUserPoints()` - Award XP points
- `updateLesson()` - Update lesson status

---

## Frontend Architecture

### Directory Structure

```
src/
├── pages/
│   ├── LanguageLearning.jsx
│   ├── LanguageLearningLesson.jsx
│   ├── LanguageLearningPractice.jsx
│   └── ...
├── components/
│   ├── ChatInterface.jsx
│   ├── SpeakingRecorder.jsx
│   ├── Flashcard.jsx
│   └── ...
├── services/
│   ├── aiProvider.js
│   ├── languageAI.js
│   └── ...
├── appwrite/
│   ├── config.js
│   ├── languageLearning.js
│   ├── auth.js
│   └── ...
├── context/
│   ├── AuthContext.jsx
│   └── SessionContext.jsx
└── App.jsx
```

### Key Components

- **LanguageLearningLesson.jsx** - Lesson rendering and practice
- **SpeakingRecorder.jsx** - Voice recording and feedback
- **ChatInterface.jsx** - AI conversation
- **Flashcard.jsx** - Flashcard display

---

## Data Flow

### Lesson Generation

```
User clicks "Start Lesson"
    ↓
generateLesson() called
    ↓
Build prompt with student profile
    ↓
smartGenerateJSON() tries providers
    ↓
AI returns JSON lesson
    ↓
saveLessonProgress() stores in Appwrite
    ↓
Lesson renders
```

### Speaking Practice

```
User records voice
    ↓
Audio sent to Groq Whisper
    ↓
Whisper returns transcription
    ↓
Compare with expected phrase
    ↓
Calculate pronunciation score
    ↓
Show feedback
```

---

## Key Packages & Dependencies

### Core

```json
{
  "react": "^19.2.5",
  "react-dom": "^19.2.5",
  "react-router-dom": "^7.14.2",
  "appwrite": "^25.0.0",
  "@aws-sdk/client-s3": "^3.1045.0",
  "date-fns": "^4.1.0",
  "uuid": "^14.0.0"
}
```

### Content Rendering

```json
{
  "react-markdown": "^10.1.0",
  "remark-gfm": "^4.0.1",
  "remark-math": "^6.0.0",
  "rehype-katex": "^7.0.1",
  "rehype-raw": "^7.0.0",
  "katex": "^0.16.22"
}
```

### Visualization

```json
{
  "recharts": "^3.8.1",
  "mermaid": "^11.14.0"
}
```

### Other

```json
{
  "react-pdf": "^9.1.1",
  "@monaco-editor/react": "^4.7.0"
}
```

### Development

```json
{
  "vite": "^8.0.10",
  "eslint": "^10.2.1",
  "vitest": "^4.1.5",
  "@testing-library/react": "^16.3.2",
  "jsdom": "^29.1.1"
}
```

---

## Module Structure

### 11 Modules Per Stage

1. **Vocabulary** - Word learning
2. **Pronunciation** - Sound production
3. **Speaking** - Fluent speech
4. **Listening** - Comprehension
5. **Reading** - Text comprehension
6. **Writing** - Written expression
7. **Grammar** - Language structure
8. **Sentence Structure** - Complex sentences
9. **Synonyms & Antonyms** - Word relationships
10. **Idioms & Expressions** - Figurative language
11. **Cultural Context** - Cultural knowledge

---

## API Integration

### Groq Integration

```javascript
export async function callGroq(systemPrompt, messages, model) {
  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    if (response.status === 429) {
      const error = new Error(err.error?.message);
      error.code = 'GROQ_RATE_LIMIT';
      throw error;
    }
    throw new Error(err.error?.message);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Gemini Integration

```javascript
export async function callGeminiText(prompt, systemInstruction) {
  const response = await fetch(
    `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction 
          ? { parts: [{ text: systemInstruction }] } 
          : undefined,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

### Smart Failover

```javascript
export async function smartGenerateJSON(prompt) {
  const providers = [
    { name: 'Groq 70B', fn: () => callGroq(...) },
    { name: 'DeepSeek', fn: () => callDeepSeek(...) },
    { name: 'Gemini', fn: () => callGeminiText(...) },
    { name: 'Groq 8B', fn: () => callGroq(...) },
  ];

  let groqRateLimited = false;

  for (const provider of providers) {
    try {
      if (provider.name.includes('Groq') && groqRateLimited) {
        continue;
      }
      
      const result = await provider.fn();
      return result;
    } catch (err) {
      if (err.code === 'GROQ_RATE_LIMIT') {
        groqRateLimited = true;
      }
      console.warn(`${provider.name} failed:`, err.message);
    }
  }

  throw new Error('All providers failed');
}
```

---

## Database Schema

### Language User Profile

```javascript
{
  $id: "user123",
  userId: "auth_user_id",
  primaryLanguage: "English",
  targetLanguage: "Spanish",
  currentStage: "beginner",
  completedModules: ["vocabulary__beginner"],
  totalPoints: 1250,
  lessonsCompleted: 15,
  masteryScores: {
    "vocabulary__beginner": 92
  }
}
```

### Lesson Document

```javascript
{
  $id: "lesson123",
  userId: "user123",
  moduleId: "vocabulary",
  stageName: "beginner",
  moduleName: "Vocabulary",
  status: "completed",
  score: 92,
  lessonContent: {
    introduction: "...",
    coreContent: "...",
    examples: [...],
    miniPractice: [...],
    summary: "...",
    masteryCheck: [...]
  },
  lastSection: "masteryCheck"
}
```

### Practice Session

```javascript
{
  $id: "practice_id",
  userId: "user_id",
  practiceType: "vocabulary",
  moduleId: "vocabulary",
  stageName: "beginner",
  score: 85,
  duration: 600,
  questionsAnswered: 10,
  correctAnswers: 8
}
```

---

## Environment Variables

```bash
# Appwrite
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=69f742a2001f393e4b85

# AI APIs
VITE_GROQ_API_KEY=your_groq_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_DEEPSEEK_API_KEY=your_deepseek_key
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Storage
VITE_AWS_ACCESS_KEY_ID=your_aws_key
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret
VITE_AWS_REGION=us-east-1
VITE_AWS_BUCKET=your_bucket

# Cloudflare R2
VITE_R2_ACCESS_KEY_ID=your_r2_key
VITE_R2_SECRET_ACCESS_KEY=your_r2_secret
VITE_R2_BUCKET=your_bucket
VITE_R2_ENDPOINT=your_r2_endpoint
```

---

## Build & Deployment

### Build Process

```bash
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
```

### Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── [other files]
```

---

## Performance Optimization

### Code Splitting
- Dynamic imports for pages
- Lazy loading of components
- Separate chunks for large libraries

### Caching
- Browser caching for static assets
- Service worker for offline support
- Appwrite query caching

### API Optimization
- Request batching
- Response compression
- Token limit management

---

## Security

### Authentication
- Appwrite authentication
- JWT tokens
- Session management

### Data Protection
- HTTPS encryption
- Secure API keys (environment variables)
- CORS configuration

### Rate Limiting
- Groq: 100k TPD limit
- Gemini: 1500 RPD, 15 RPM
- DeepSeek: No strict limits (paid)

---

## Monitoring & Logging

### Console Logging

```
[AI JSON] Trying Groq Llama 70B...
[AI JSON] ✅ Success with Groq Llama 70B
[AI JSON] ⚠️ Groq rate-limited (429)
[AI JSON] ❌ Provider failed: error message

[Dashboard] Found 2 duplicates for cultural-context__beginner
[Dashboard] Deleted duplicate lesson: lesson_id
[Dashboard] Cleanup complete: Removed 2 duplicate lessons
```

---

## Conclusion

The LastWeek language learning system combines:

- **Frontend**: React + Vite for fast, responsive UI
- **Backend**: Appwrite for database and authentication
- **AI**: Multiple LLM providers with intelligent failover
- **Storage**: AWS S3 / Cloudflare R2 for files
- **Packages**: Carefully selected dependencies for specific features

This architecture ensures reliability, scalability, and excellent user experience.

---

**Last Updated**: May 13, 2026  
**Status**: ✅ Complete and Current
