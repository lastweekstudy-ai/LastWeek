# LastWeek — AI Study Platform: Advisor Overview

> This document explains the architecture, AI usage, learning modes, strengths, and current limitations of the LastWeek study platform. Written to give a clear technical and pedagogical picture to an advisor or reviewer.

---

## What Is LastWeek?

LastWeek is a web-based AI-powered study assistant built with React. Students bring their own study material — typed questions, uploaded PDFs, or images — and the platform responds through one of five distinct learning modes, each with a different pedagogical strategy. The platform is not a generic chatbot; every response is shaped by the active learning mode and the subject the student declared at session start.

---

## APIs Used and Why

### 1. DeepSeek (`deepseek-chat` model)
**Role: Primary reasoning and teaching engine**

DeepSeek handles all text-based reasoning, explanation, and response generation. It is the voice the student hears in every mode. It was chosen because:
- Strong instruction-following — it reliably respects complex system prompts (formatting rules, persona constraints, LaTeX math rules)
- Cost-effective for high-volume educational Q&A
- Handles long conversation histories well

**Used for:**
- Answering all student questions in every mode
- Applying the mode-specific teaching strategy (analogies, quizzes, breakdowns, personas, creative tasks)
- Rendering LaTeX math notation in responses
- Generating interactive charts (via a custom `[CHART:type:title]...[/CHART]` syntax it is instructed to use)
- Processing conversation history to maintain context across a session

**Configuration:** `VITE_DEEPSEEK_API_KEY` in `.env`

---

### 2. Gemini (`gemini-flash-latest` model)
**Role: Visual pre-processor and document analyst**

Gemini is used as a pre-processing layer, not as the student-facing voice. It was chosen because of its multimodal capability — it can read images and extract structured information from visual content that DeepSeek cannot see.

**Used for:**
- Analysing uploaded images (diagrams, charts, photos of notes, whiteboards)
- Pre-processing uploaded PDF files that contain charts, tables, or graphs — extracting data points and converting visuals into structured text that DeepSeek can then reason about
- In study mode (PDF open in split-screen), Gemini is intentionally **bypassed** — the PDF text is already structured with page markers, so DeepSeek handles it directly for speed

**Configuration:** `VITE_GEMINI_API_KEY` in `.env`

---

### 3. Appwrite (Backend-as-a-Service)
**Role: Authentication, database, and file storage**

Appwrite handles everything that is not AI:
- **Auth** — email/password login and session management
- **Database** — stores sessions, messages, PDF resources, highlights, bookmarks, and notes
- **Storage** — stores uploaded PDF files; the platform streams them directly from Appwrite's storage URL into the PDF viewer

**Configuration:** `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_APPWRITE_DATABASE_ID`, `VITE_APPWRITE_STORAGE_BUCKET_ID`

---

## The Dual-AI Pipeline

When a student uploads a file (PDF or image) through the chat attachment button, the following pipeline runs:

```
Student uploads file
        │
        ▼
  Is it an image?
  ┌─────┴──────┐
 YES           NO (PDF)
  │             │
  ▼             ▼
Gemini        Gemini extracts
analyses      visual elements
image         (charts, tables,
              diagrams) from
              PDF text
        │
        ▼
  Gemini converts visuals
  into structured text
  (data points, labels,
  patterns, relationships)
        │
        ▼
  DeepSeek receives:
  • Gemini's visual breakdown
  • Original PDF/image text
  • Student's question
  • Mode-specific system prompt
        │
        ▼
  DeepSeek generates
  educational response
  in the active mode's style
```

When a student types a question with a PDF already open in split-screen (Study Mode), Gemini is skipped entirely. The PDF text is already extracted and structured with page markers (`=== PAGE X ===`). Only the relevant pages (requested page ± 1) are sent to DeepSeek to stay within context limits.

---

## The Five Learning Modes

Each mode is a distinct pedagogical strategy. The student selects a mode when starting a session. The mode shapes the system prompt sent to DeepSeek, which changes how it responds — not just what it says, but how it teaches.

---

### Mode 1: Mental Model
**Pedagogical strategy:** Analogy-based learning

The AI explains every concept by connecting it to something the student already understands. It builds a "bridge" from the familiar to the unfamiliar.

**What DeepSeek does in this mode:**
- Identifies what the student likely already knows before explaining
- Constructs a concrete real-world analogy for every new concept
- Tracks which analogies it has already used to avoid repetition
- Automatically generates visual aids: comparison tables, relationship diagrams, flowcharts, and Recharts charts for numerical data
- Asks after each explanation: "Does this analogy make sense? Want me to try a different one?"

**What Gemini does in this mode:**
- Pre-processes any uploaded PDF or image to extract visual data before DeepSeek explains it
- Not involved in split-screen PDF study queries

**Best for:** Students who struggle with abstract concepts and need concrete mental hooks.

---

### Mode 2: Active Recall
**Pedagogical strategy:** Testing over telling

The AI never explains unprompted. It tests the student first, then fills gaps based on what the student gets wrong.

**What DeepSeek does in this mode:**
- Operates in three sub-modes the student can switch between:
  - **Reverse Quiz** — asks the student to explain a concept; grades the explanation out of 10 and lists specific knowledge gaps
  - **Flashcard** — generates question-answer pairs; asks the student to rate confidence (1 = hard, 2 = okay, 3 = easy) after each answer
  - **Scenario** — creates realistic fictional case studies where the student must apply knowledge to solve a problem
- Ends every response with a prompt to continue testing
- Generates performance charts (e.g. bar chart of quiz scores) using Recharts

**What Gemini does in this mode:**
- Same as Mental Model — pre-processes uploaded files before DeepSeek generates quiz questions from them

**Best for:** Exam preparation, spaced repetition practice, identifying weak areas.

---

### Mode 3: Focus Breakdown
**Pedagogical strategy:** Chunking and prerequisite mapping

The AI breaks overwhelming topics into small, manageable pieces and makes dependencies explicit.

**What DeepSeek does in this mode:**
- Breaks any large topic or uploaded document into 5-minute reading segments
- Adds a 3-bullet summary after each segment
- Before introducing any new concept, lists the prerequisite knowledge the student needs
- Responds to "TL;DR" with only core definitions in the simplest possible format
- Uses hierarchical ASCII diagrams to show topic structure and timelines for progression
- Never gives walls of text — responses are deliberately short and chunked

**What Gemini does in this mode:**
- Pre-processes uploaded PDFs to identify structure (chapters, sections, visual elements) before DeepSeek breaks them down

**Best for:** Students who feel overwhelmed, studying dense textbooks, or approaching a new subject from scratch.

---

### Mode 4: Collaborative Scholar
**Pedagogical strategy:** Socratic dialogue through historical persona

The AI adopts the persona of a famous historical figure relevant to the subject (default: Einstein for physics, but configurable). It speaks in first person as that figure, referencing their actual work and communication style.

**What DeepSeek does in this mode:**
- Maintains the chosen persona consistently throughout the session
- Answers questions as that figure would, referencing their real discoveries and opinions
- Operates in two additional sub-modes:
  - **Debate Mode** — takes a strong opposing stance and forces the student to defend their position with evidence
  - **Peer Review Mode** — acts as a teaching assistant reviewing the student's essay or argument, giving structured feedback: Strengths, Weaknesses, Suggestions, Grade
- Generates historical timelines (ASCII) and data charts (Recharts) in the persona's voice

**What Gemini does in this mode:**
- Pre-processes uploaded documents before DeepSeek analyses them from the persona's perspective

**Best for:** History, philosophy, science history, essay writing, critical thinking practice.

---

### Mode 5: Creative Synthesis
**Pedagogical strategy:** Learning by creating

The AI helps the student demonstrate mastery by producing something — a mind map, a story, or a real project.

**What DeepSeek does in this mode:**
- Operates in three sub-modes:
  - **Mind Map** — takes the student's notes or a topic and structures them as a hierarchical ASCII mind map
  - **Storyteller** — turns facts and concepts into a dramatic narrative with characters, conflict, and plot twists to make content memorable
  - **Project Creator** — after the student learns something, suggests 3 small real-world projects they can build to prove mastery
- Detects which sub-mode the student wants from their message, or asks if unclear
- Generates project progress charts and brainstorming diagrams

**What Gemini does in this mode:**
- Pre-processes uploaded files so DeepSeek can build mind maps or stories from the actual document content

**Best for:** Creative learners, project-based learning, consolidating knowledge after studying.

---

## AI Responsibility Summary by Mode

| Feature | DeepSeek | Gemini |
|---|---|---|
| All text responses in every mode | ✅ | ❌ |
| Applying mode-specific teaching strategy | ✅ | ❌ |
| LaTeX math rendering in responses | ✅ | ❌ |
| Generating Recharts charts | ✅ | ❌ |
| Analysing uploaded images | ❌ | ✅ |
| Extracting visuals from uploaded PDFs | ❌ | ✅ |
| Converting charts/tables to structured text | ❌ | ✅ |
| Split-screen PDF study queries | ✅ (direct) | ❌ (bypassed) |
| Conversation history and context | ✅ | ❌ |
| Persona maintenance (Collaborative Scholar) | ✅ | ❌ |

---

## PDF Study Mode (Split-Screen)

This is a distinct feature separate from the five modes. In any mode, the student can open a PDF from their resource library. The interface splits into:
- **Left panel** — the PDF viewer with page navigation, zoom, bookmarks, text highlighting, and notes
- **Right panel** — the chat interface for the active mode

When the student asks a question in the chat while a PDF is open:
- The platform extracts only the relevant pages (requested page ± 1 surrounding page) from the pre-extracted text
- This focused context (~2,000–4,000 characters) is sent to DeepSeek along with the mode's system prompt
- Gemini is not involved — the text is already structured
- The AI navigates to the requested page automatically in the viewer

This design keeps context sizes manageable and response times fast (3–5 seconds vs. the previous 60-second timeout that occurred when the full 43,000-character PDF was sent).

---

## Math and Scientific Notation

All AI responses render proper typeset mathematics using KaTeX (the same engine used by Khan Academy and Wikipedia). DeepSeek is instructed to always write math in LaTeX:
- Inline: `$F = ma$` renders as typeset inline math
- Display: `$$v^2 = v_0^2 + 2a\Delta x$$` renders as a centred equation block

The chat input includes a **math keyboard** (∑ button in the toolbar) with 5 tabs — Common, Greek, Calculus, Physics, Sets/Logic — that inserts LaTeX symbols at the cursor position. User messages are also rendered through KaTeX, so sent equations display as proper math in the chat bubble.

---

## Strengths

**1. Mode-specific pedagogy, not generic chat**
Each mode has a distinct teaching philosophy enforced at the system prompt level. The AI does not just answer questions — it teaches in a specific way that matches how the student learns best.

**2. PDF integration with page-level precision**
Students can ask "explain page 7" and the AI responds with content specifically from that page, while the viewer navigates there automatically. Highlights, bookmarks, and notes are saved per page.

**3. Proper scientific and mathematical rendering**
LaTeX math, Greek letters, vectors, integrals, chemical formulas — all render as typeset notation in both AI responses and student messages. The math keyboard removes the need to know LaTeX syntax.

**4. Interactive data visualisation**
The AI automatically generates interactive Recharts charts (bar, line, pie, area) when explaining numerical data. Students do not need to ask — the AI decides when a chart communicates better than text.

**5. Dual-AI pipeline for visual content**
Uploaded PDFs with charts and tables are not reduced to raw text. Gemini extracts the visual data first, then DeepSeek explains it. A student uploading a physics textbook page with a velocity graph gets the data points extracted and explained, not ignored.

**6. Session persistence**
All sessions, messages, highlights, bookmarks, and notes are saved to Appwrite. Students can close the browser and resume exactly where they left off.

---

## Weaknesses and Current Limitations

**1. No streaming responses**
DeepSeek responses arrive all at once after the full generation completes. For long responses this means a visible wait with a loading indicator. Streaming would make the experience feel significantly faster.

**2. Context window management is manual**
The platform manually trims conversation history and PDF context to stay within DeepSeek's token limits. This works but is a heuristic — very long sessions with many messages could still approach limits.

**3. Gemini timeout on large documents**
Gemini has a 30-second timeout. Very large PDFs (100+ pages) sent for visual analysis can hit this limit. The platform falls back to DeepSeek-only in that case, but the fallback loses visual data extraction.

**4. No OCR for scanned PDFs**
If a student uploads a scanned PDF (images of pages rather than text), text extraction returns nothing. The platform detects this and warns the student, but cannot process the content. An OCR integration would fix this.

**5. No real-time collaboration**
Sessions are single-user. There is no shared session, live tutoring, or peer study feature.

**6. No spaced repetition scheduling**
Active Recall mode tests the student but does not schedule future reviews based on confidence ratings. The confidence data (1/2/3) is collected but not yet used to resurface weak topics automatically.

**7. Persona depth in Collaborative Scholar is model-dependent**
The persona quality depends entirely on DeepSeek's training data about the chosen historical figure. Obscure figures may produce shallow or inaccurate personas.

**8. No offline support**
The platform requires an active internet connection for all AI calls, PDF streaming from Appwrite storage, and authentication.

---

## Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite |
| Routing | React Router v7 |
| Backend / Auth / DB / Storage | Appwrite (self-hosted or cloud) |
| Primary AI | DeepSeek (`deepseek-chat`) |
| Visual pre-processor AI | Google Gemini (`gemini-flash-latest`) |
| PDF rendering | react-pdf (PDF.js) |
| Math rendering | KaTeX via remark-math + rehype-katex |
| Charts | Recharts |
| Markdown | react-markdown + remark-gfm |
| Styling | Custom CSS with CSS variables (dark/light theme) |

---

*Document generated May 2026. Reflects the current state of the codebase.*
