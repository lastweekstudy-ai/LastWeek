# LastWeek — Complete Feature List

> Every feature, section, service, and capability in the app. From the biggest AI systems down to the smallest UI detail.

---

## 1. Authentication & Accounts

### Sign Up / Sign In
- Email + password registration
- Email + password login
- Guest mode — use the app without creating an account (limited features)
- Persistent login — stay logged in across browser sessions
- Automatic redirect to dashboard after login

### Account Management (Settings page)
- Update display name
- View email address (read-only)
- Change password (requires current password)
- Double-confirmation account deletion (type "DELETE" to confirm)
- Guest account warning banner

### Security
- Appwrite-managed authentication
- Session tokens stored securely
- All data scoped to user ID — no cross-user data access

**Advantage:** No third-party login required. Simple email/password. Guest mode lets users try before committing.

---

## 2. Dashboard

### Overview Panel
- Personalised greeting with user's name
- "Ready to continue your learning journey?" subtitle
- Loading spinner while data fetches

### Flashcard Alert Widget
- Shows count of flashcards due for review today
- Shows total flashcard library count
- "Review Now" button → goes directly to flashcard review mode
- "Open Library" button → goes to full flashcard library

### Exam Countdown Widget
- Shows all active exam plans with days remaining
- Colour-coded urgency: purple (normal) → amber (≤3 days)
- Progress bar: topics done / total topics
- "Today's topics" section — clickable buttons to start/resume each topic's AI session
- "View Plan →" link to full exam planner

### Study Sessions Grid
- All past sessions displayed as cards
- Each card shows: mode icon, mode name, session title, subject, last updated time, session summary (if generated)
- Click any card to resume the session
- Checkbox on each card for multi-select

### Session Search
- Real-time search across session titles and subjects
- Filters sessions as you type
- Keyboard shortcut: `Ctrl + F` to focus search

### Bulk Actions
- Select multiple sessions with checkboxes
- Bulk delete (with confirmation)
- Bulk export to JSON
- Clear selection with `Escape`

### Study Statistics Panel (toggle)
- Toggle with "Show Stats" / "Hide Stats" button
- Total sessions count
- Total messages sent
- Total flashcards created
- Due flashcards count
- Visual breakdown by study mode

### Storage Indicator
- Shows how much Appwrite storage the user has used
- Compact display in the header
- Lazy-loaded (doesn't block dashboard render)

### Keyboard Shortcuts (Dashboard)
- `Ctrl + D` — go to dashboard
- `Ctrl + N` — new session
- `Ctrl + F` — focus search
- `Escape` — clear selection

**Advantage:** Everything visible at a glance. No hunting through menus. Exam countdown and due flashcards surface the most urgent actions automatically.

---

## 3. Study Modes — The Core AI Tutor

Every mode shares the same foundation: a full AI chat interface with a personalised teaching system. The AI knows the student's level, goal, time available, and preferred style — and adapts every response accordingly.

### Student Assessment (runs before first message in any session)
- 4-question personalised profile:
  1. Knowledge level: Complete Beginner / Beginner / Intermediate / Advanced
  2. Learning goal: Exam Prep / Deep Understanding / Real-World Application / Quick Overview
  3. Time available: 1–2 Days / 3–5 Days / 1–2 Weeks / Flexible
  4. Preferred style: Analogies / Step-by-Step / Visual / Stories
- Profile stored in Appwrite and injected into every AI prompt
- AI calibrates vocabulary, depth, examples, and pacing to match

### Shared Features Across All 5 Modes
- Full AI chat interface
- Streaming responses (text appears word by word, not all at once)
- Message history — full conversation preserved across sessions
- PDF upload and AI Q&A (see Section 8)
- Flashcard generation from conversation
- MCQ quiz generation
- Charts, diagrams, SVG figures in responses
- LaTeX math rendering
- Mermaid diagram rendering
- Text-to-speech on any message
- Pomodoro timer (see Section 11)
- Sidebar with quick-action buttons
- Session summary auto-generated after conversation
- Copy any message to clipboard
- File attachment support (PDF, images, text files)

---

### Mode 1 — Mental Model

**What it does:** Teaches concepts from the ground up using analogies, visual aids, and structured explanations. Best for understanding new topics.

**AI behaviour:**
- Always starts with a one-sentence definition
- Follows with "Why it matters" explanation
- Lists all subtopics it will cover before starting
- Uses the student's preferred style (analogies, stories, step-by-step, visual)
- Ends every concept with "Quick check: want a question on this?"
- Proactively surfaces connections to related topics
- Never skips subtopics silently

**Sidebar quick actions:**
- "Quiz me" — generates an MCQ on what was covered
- "Create a flashcard for the last concept"
- "Summarise what we've covered"
- "Give me an analogy for this"
- "Show me a visual diagram"

**Advantage:** The AI behaves like a real tutor — it doesn't just answer questions, it teaches complete curricula. It won't let you leave a topic half-understood.

---

### Mode 2 — Active Recall

**What it does:** Tests what you know through Socratic questioning. Best for exam preparation and memory consolidation.

**AI behaviour:**
- Asks questions before explaining
- Waits for the student's answer before revealing the correct one
- Gives specific feedback: "Correct — you've got the key idea about X" or "Not quite — the key point is X"
- Generates MCQs and open-ended questions
- Tracks what's been tested and what hasn't
- Celebrates milestones: "You've covered all of [topic]. That's real progress."

**Sidebar quick actions:**
- "Test me on everything we've covered"
- "Give me a harder question"
- "Give me an easier question"
- "What topics haven't I been tested on yet?"

**Advantage:** Forces active retrieval, which is proven to be 2–3× more effective for memory than passive reading.

---

### Mode 3 — Focus Breakdown

**What it does:** Breaks complex topics into focused, manageable chunks. Integrated with the Pomodoro timer for structured study sessions.

**AI behaviour:**
- Breaks any topic into a numbered list of focused subtopics
- Labels each as ESSENTIAL or SUPPLEMENTARY (especially useful for 1–2 day cramming)
- Covers one chunk at a time, signals when moving to the next
- Keeps responses concise and scannable
- Designed to work with 25-minute Pomodoro focus blocks

**Sidebar quick actions:**
- "Break this topic into chunks"
- "What's the most important thing to know?"
- "Give me a summary of this chunk"
- "What's next?"

**Advantage:** Prevents overwhelm. Students with 1–2 days before an exam get a clear priority order — ESSENTIAL topics first.

---

### Mode 4 — Collaborative Scholar

**What it does:** Debates and peer-reviews with a historical persona. Best for humanities, philosophy, history, and essay writing.

**AI behaviour:**
- Takes on the role of a famous historical figure (Einstein, Darwin, Socrates, etc.)
- Speaks in first person as that figure
- References their actual historical work and opinions
- Three sub-modes:
  - **Debate mode:** Takes a strong opposing stance, forces the student to defend their position
  - **Peer review mode:** Gives structured feedback: Strengths → Weaknesses → Suggestions → Grade
  - **Teaching mode:** Explains concepts as the historical figure would

**Sidebar quick actions:**
- "Debate me on this"
- "Review my essay"
- "What would you say about [topic]?"
- "Change persona"

**Advantage:** Makes abstract subjects tangible. Debating Einstein about relativity is more memorable than reading a textbook.

---

### Mode 5 — Creative Synthesis

**What it does:** Helps students demonstrate mastery by creating things — mind maps, stories, projects. Best for consolidating knowledge.

**AI behaviour:**
- Ensures creative output covers ALL core concepts, not just the ones the student mentioned
- Three sub-modes:
  - **Mind Map mode:** Generates a hierarchical mind map of all concepts
  - **Storyteller mode:** Embeds all facts into a narrative
  - **Project Creator mode:** Suggests 3 real-world projects that together cover all core concepts
- After creating, confirms: "This covers: [list all core concepts included]"

**Sidebar quick actions:**
- "Create a mind map"
- "Turn this into a story"
- "Suggest a project"
- "What concepts am I missing?"

**Advantage:** Forces synthesis, not just recall. Students who can explain a concept through a story or project truly understand it.

---

## 4. Exam Planner

### Creating an Exam Plan
- Enter exam name (e.g. "CSCA Final")
- Set exam date with date picker
- Add topics one by one (e.g. "Algebra", "Geometry", "Calculus")
- Reorder topics by drag or up/down buttons
- Delete topics before saving

### Auto-Scheduling
- System automatically distributes topics across available days
- Calculates days until exam
- Assigns topics to specific calendar dates
- Shows "Today's topics" on the dashboard

### Exam Session (AI coaching per topic)
- Dedicated page per topic: `/exam-session/:planId/:topicIndex`
- Top bar: exam name, current topic, days left chip (turns red ≤3 days), progress bar (done/total), "Mark Done" button
- Left sidebar: full topic list with status dots (grey = not started, purple = active, green = done)
- "Today" badge on today's scheduled topics
- Pomodoro timer in top bar
- Full AI chat — AI knows the exam, deadline, topic, and urgency
- AI starts immediately with a roadmap for the topic
- "Mark Done →" advances to next undone topic automatically
- Resume existing session or start fresh per topic
- Session persists — come back to the same conversation

### Progress Tracking
- Per-topic done/not-done status
- Overall percentage complete
- Visual progress bar
- Exam countdown chip

**Advantage:** Students don't have to figure out what to study each day. The system tells them exactly what to do and coaches them through it.

---

## 5. Flashcard System — Fully Managed, Fully Integrated

**Unlike any other flashcard app:** Flashcards are generated automatically from your actual study conversations, saved with spaced-repetition scheduling, organized into collections, and available for review across all study modes. They're not a separate tool — they're woven into every part of the learning experience.

---

### Inline Flashcard Generation (in ANY chat)

**Works in:**
- All 5 study modes
- Exam sessions
- Language learning lessons
- Language practice mode
- PDF Q&A sessions
- Audio lecture chat

**How it works:**
- AI generates flashcards during conversation in `**FRONT OF CARD** / **BACK OF CARD**` format
- Multiple cards in one response, separated by `===`
- Progress indicator: "Card 1 of 3" with progress bar
- Click card to flip (front → back)
- Confidence rating buttons: Hard (1) / Okay (2) / Easy (3)
- Auto-advances to next card after rating
- Completion screen: "🎉 All 3 flashcards done! Cards saved to your library."
- Each rating automatically saves the card to Appwrite with spaced-repetition scheduling

**Trigger flashcard generation:**
- Ask the AI: "Create flashcards for what we just covered"
- Use sidebar quick action: "Create a flashcard for the last concept"
- AI proactively offers: "Want me to create flashcards for this?"

---

### Flashcard Library — Complete Management System (`/flashcards`)

**Overview panel:**
- Total flashcard count
- Due today count with purple badge
- Last review date
- Streak counter (days reviewed in a row)

**Collections Sidebar:**
- "All Cards" view (shows everything)
- "Due Today" view (filtered to overdue cards only)
- User-created collections (unlimited folders)
- Create new collection: custom name, optional color, optional icon
- Rename collections
- Delete collections (cards stay, just become unassigned)
- Card count per collection
- Drag-and-drop cards between collections

**Card Grid:**
- Each card shows:
  - Front text (2-line preview with ellipsis)
  - Back text (2-line preview)
  - Confidence badge: New (grey) / Hard (red) / Okay (amber) / Easy (green)
  - Collection name
  - Source icon: 🤖 AI-generated / ✍️ Manual / 🌐 Language / 📚 Exam
  - "DUE" badge on overdue cards (purple highlight)
  - Last reviewed timestamp
- Hover actions: Edit / Move to collection / Delete
- Bulk select with checkboxes
- Bulk actions: Move to collection / Delete / Export

**Search & Filter:**
- Real-time search across front and back of all cards
- Filter by confidence level
- Filter by collection
- Filter by source (AI / manual / language)
- Filter by due status (due / not due / all)
- Sort by: Date created / Date reviewed / Confidence / Alphabetical

**Card Details View:**
- Click any card to see full details
- Full front and back text (no truncation)
- Review history: dates and confidence ratings
- Edit front or back text
- Change collection
- Delete card
- "Review Now" button (even if not due)

---

### Review Mode — Spaced Repetition in Action

**Triggered by:**
- "Review X Due" button (shows count of due cards)
- "Review These (X)" button (review selected cards)
- "Review All in [Collection]" button
- Automatic prompt on dashboard if >10 cards are due

**Review experience:**
- Cards shuffled randomly (prevents memorizing order)
- Shows one card at a time with progress bar: "Card 3 of 12"
- Full flip animation (click or spacebar to flip)
- Confidence rating: Hard (1) / Okay (2) / Easy (3)
- Keyboard shortcuts: 1/2/3 to rate, Space to flip
- Updates `nextReviewAt` in Appwrite after each rating
- Shows next review date after rating: "See this again in 3 days"
- Completion screen with stats: "12 cards reviewed. 8 Easy, 3 Okay, 1 Hard. Next review: 3 cards tomorrow."
- Returns to library after all cards reviewed

**Spaced Repetition Algorithm:**
- Hard (1) → review again in **1 day**
- Okay (2) → review again in **3 days**
- Easy (3) → review again in **7 days**
- `nextReviewAt` stored per card in Appwrite
- "Due Today" query: `nextReviewAt <= now`
- Cards you consistently rate Easy gradually space out to 14 days, then 30 days

---

### Create Manual Flashcard

**From the library:**
- "+ New Card" button opens modal
- Enter front text (supports markdown)
- Enter back text (supports markdown)
- Assign to collection (optional)
- Add tags (optional)
- Saved immediately to Appwrite

**From any chat:**
- Sidebar quick action: "Create a flashcard"
- AI asks: "What should the front say?" → "What should the back say?"
- Card created and added to library

---

### Flashcard Analytics

**Per-card stats:**
- Times reviewed
- Current confidence level
- Review history (dates and ratings)
- Next review date

**Library-wide stats:**
- Total cards
- Cards due today
- Cards mastered (consistently rated Easy)
- Cards struggling (consistently rated Hard)
- Review streak (days in a row)
- Total reviews this week/month

---

### Import/Export Flashcards

**Export:**
- Export all cards as JSON
- Export selected cards as JSON
- Export as CSV (opens in Excel)
- Export as Anki deck (.apkg format)

**Import:**
- Import from JSON
- Import from CSV (front, back, collection columns)
- Import from Anki deck
- Bulk create from text file (one card per line, front|back format)

---

**Advantage:** Flashcards aren't just created — they're managed, scheduled, organized, and integrated into every part of the app. You never have to think "should I review today?" — the system tells you exactly what to review and when.

---

## 6. MCQ (Multiple Choice Questions) — Integrated Everywhere

**Unlike traditional quiz apps:** MCQs are generated on-demand during any conversation, persist across sessions, and automatically update your spaced-repetition schedule based on what you got right or wrong.

---

### Inline MCQ Generation (in ANY chat)

**Works in:**
- All 5 study modes
- Exam sessions
- Language learning lessons
- Language practice mode
- PDF Q&A sessions
- Audio lecture chat

**How it works:**
- AI generates MCQs in `[MCQ]...[/MCQ]` format
- Multiple questions in one response (typically 3–5)
- Each question shows:
  - Question text
  - 4 options (A/B/C/D)
  - Question counter: "Question 2 of 5"
  - Progress bar
- Click an option to answer
- Immediate feedback:
  - Correct option turns green ✅
  - Wrong option turns red ❌
  - Explanation shown after answering
- Cannot change answer after selecting
- Final score shown after last question: "3/5 — 👍 Good job! You got 60%."

**Trigger MCQ generation:**
- Ask the AI: "Quiz me on what we just covered"
- Use sidebar quick action: "Test me"
- AI proactively offers: "Want a quick quiz on this?"
- In Active Recall mode, AI generates MCQs automatically

---

### Answer Persistence — Never Lose Your Progress

**How it works:**
- Answers saved to `localStorage` with key `mcq_answer_{messageId}_q{n}`
- On page refresh, answers are restored — questions show as already answered
- Score recalculated from restored answers
- Works across browser sessions (until localStorage is cleared)
- If you close the browser and come back tomorrow, your quiz answers are still there

**Visual indicators:**
- Answered questions show the selected option highlighted
- Correct answers show green checkmark
- Wrong answers show red X
- Score displayed at the top: "You scored 3/5 (60%)"

---

### MCQ → Spaced Repetition Integration

**Automatic flashcard creation:**
- Every MCQ you answer creates a flashcard automatically
- Front: The question
- Back: The correct answer + explanation
- Confidence set based on your answer:
  - Correct answer → confidence 3 (Easy) → review in 7 days
  - Wrong answer → confidence 1 (Hard) → review in 1 day

**Why this matters:**
- Questions you got wrong come back quickly for review
- Questions you got right are spaced out
- You don't have to manually create flashcards from quiz questions — it happens automatically

---

### MCQ Analytics

**Per-quiz stats:**
- Score (X/Y correct)
- Percentage
- Time taken (if timed)
- Questions you got wrong highlighted

**Across all quizzes:**
- Total MCQs answered
- Overall accuracy percentage
- Topics you struggle with (based on wrong answers)
- Topics you've mastered (based on consistent correct answers)

---

### MCQ in Language Learning

**Special features for language MCQs:**
- Vocabulary quizzes: "What does 'bonjour' mean?"
- Grammar quizzes: "Which sentence is correct?"
- Listening quizzes: Audio plays, choose the correct transcription
- Translation quizzes: "How do you say 'hello' in Spanish?"

**Pronunciation MCQs:**
- AI speaks a word
- You choose the correct spelling
- Or: AI shows a word, you choose the correct pronunciation

---

**Advantage:** MCQs aren't just quizzes — they're integrated into your spaced-repetition system. Every question you answer teaches the system what you know and what you need to review.

---

## 7. Language Learning — All Practice Types in One Place

**Unlike Duolingo or Babbel:** Not a fixed curriculum. You choose the language, level, and goal — the AI generates a personalized roadmap and adapts every lesson to your progress. All practice types (reading, writing, listening, speaking, conversation) are integrated into one seamless experience.

---

### Language Selection & Setup

**Initial setup:**
- Choose target language: English, Spanish, French, German, Italian, Portuguese, Chinese (Mandarin), Japanese, Korean, Arabic, Hindi, Bengali, Russian, and more
- Choose native language (for explanations)
- Set proficiency level: Beginner / Elementary / Intermediate / Upper-Intermediate / Advanced
- Set learning goal: Conversation / Travel / Business / Academic / Cultural
- AI generates a personalized roadmap with modules tailored to your goal

---

### Structured Lessons (`/language-learning/lessons`)

**Roadmap view:**
- All modules listed with progress bars
- Each module has 5 stages:
  1. **Introduction** — overview of what you'll learn
  2. **Vocabulary** — key words and phrases
  3. **Grammar** — rules and patterns
  4. **Practice** — exercises and drills
  5. **Assessment** — quiz to test mastery
- Click any stage to open the lesson
- Progress tracked per stage: Not Started (grey) / In Progress (amber) / Completed (green)
- Lesson attempt history stored in Appwrite

**Lesson page (`/language-learning/lessons/:moduleId/:stageId`):**
- AI-generated lesson content for the specific stage
- Interactive exercises embedded in the lesson
- Vocabulary lists with:
  - Word in target language
  - Pronunciation guide (IPA or phonetic)
  - Translation in native language
  - Example sentence
  - Audio pronunciation (TTS)
- Grammar explanations with:
  - Rule stated clearly
  - Examples in target language
  - Translation in native language
  - Common mistakes to avoid
- Progress saved on completion
- "Mark Complete" button advances to next stage

---

### Practice Mode — All Types Integrated

**Free Conversation Practice (`/language-learning/practice`):**
- Chat with AI entirely in the target language
- AI responds in the target language
- Corrections and explanations in native language (when you make a mistake)
- Vocabulary and grammar tips inline
- Topics: Daily life, travel, work, hobbies, culture, current events
- AI adjusts complexity to your level

**Reading Practice:**
- AI generates short stories, articles, or dialogues in the target language
- Comprehension questions after reading
- Vocabulary highlights (click any word for translation)
- Audio narration (TTS) to hear correct pronunciation

**Writing Practice:**
- AI gives you a prompt: "Write 3 sentences about your day"
- You write in the target language
- AI evaluates: grammar, vocabulary, sentence structure
- Corrections with explanations
- Rewrite suggestions

**Listening Practice:**
- AI speaks a sentence in the target language (TTS)
- You type what you heard
- AI checks your transcription
- Shows correct transcription if wrong
- Repeat button to hear again

**Speaking Practice (with AI evaluation):**
- AI gives you a prompt: "Say 'I would like a coffee, please' in Spanish"
- You record your pronunciation with microphone
- Audio sent to Groq Whisper for transcription
- AI evaluates:
  - **Pronunciation score** (0–100)
  - **Specific mistakes**: "You said 'café' but it should be 'un café'"
  - **Improvement tip**: "Try emphasizing the 'é' sound"
- Browser SpeechRecognition as fallback if Whisper fails
- "Try Again" button for multiple attempts
- Progress tracked: attempts, best score, improvement over time

**Translation Practice:**
- AI gives you a sentence in your native language
- You translate it to the target language
- AI checks your translation
- Shows correct translation if wrong
- Explains differences

**Grammar Drills:**
- Fill-in-the-blank exercises
- Sentence reordering
- Conjugation practice
- Tense conversion (present → past → future)

**Vocabulary Quizzes:**
- Flashcard-style vocabulary review
- Multiple choice: "What does 'bonjour' mean?"
- Matching: Match words to definitions
- Spelling: Hear a word, spell it correctly

---

### Language Flashcards (SRS)

**Automatic flashcard generation:**
- Every new word you encounter in lessons or practice becomes a flashcard
- Front: Word in target language
- Back: Translation + example sentence
- Pronunciation audio on front

**Separate from main flashcard library:**
- Language flashcards have their own section
- Organized by module and lesson
- Spaced repetition scheduling
- Review due flashcards daily

**Review modes:**
- Target → Native (see Spanish word, recall English meaning)
- Native → Target (see English word, recall Spanish translation)
- Audio → Text (hear word, type it)
- Text → Audio (see word, pronounce it)

---

### Conversation Sessions (advanced feature)

**Scenario-based conversations:**
- AI plays a role: waiter, hotel receptionist, taxi driver, friend, colleague
- You have a conversation in the target language
- AI stays in character
- Corrections given after the conversation ends (not during)
- Saved to `lang_conversation_sessions` collection

**Example scenarios:**
- Ordering food at a restaurant
- Checking into a hotel
- Asking for directions
- Job interview
- Making small talk at a party

---

### Gamification & Progress Tracking

**Points system:**
- Complete a lesson: +50 points
- Complete a practice session: +20 points
- Review flashcards: +10 points
- Speak a sentence correctly: +5 points
- Points stored in `lang_user_points` collection
- Leaderboard (optional, can be disabled)

**Streaks:**
- Days in a row you practiced
- Streak counter on language learning home page
- Streak freeze (1 free day off per week)

**Progress dashboard:**
- Modules completed
- Lessons completed
- Vocabulary learned (word count)
- Speaking practice time
- Conversation sessions completed
- Overall proficiency estimate (Beginner → Advanced)

---

### Language AI — Adaptive Teaching

**Separate AI service (`languageAI.js`):**
- Knows your target language, native language, level, and goal
- Adapts explanations to your native language when needed
- Adjusts complexity based on your progress
- Remembers words you struggle with and reinforces them

**Contextual corrections:**
- Doesn't interrupt during conversation
- Gives corrections after you finish speaking/writing
- Explains why something is wrong, not just what is wrong
- Suggests better ways to say the same thing

---

**Advantage:** All practice types in one place. You don't need Duolingo for lessons, HelloTalk for conversation, Anki for flashcards, and a separate pronunciation app. Everything is integrated, adaptive, and powered by AI that knows your exact level and goal.

---

## 8. PDF Study System

### PDF Upload
- Upload PDF files (up to 20MB)
- Files stored in Appwrite Storage
- Metadata stored in `pdf_resources` collection
- Accessible from any session via the Resources panel

### PDF Viewer
- Full in-app PDF viewer (react-pdf)
- Page navigation (previous/next, jump to page)
- Zoom in/out
- Mobile-optimised viewer with touch support
- Landscape orientation prompt on mobile

### PDF Highlights
- Select any text in the PDF to highlight
- Choose highlight colour
- Highlights saved to Appwrite `pdf_highlights` collection
- Highlights persist across sessions
- View all highlights in a list

### PDF Notes
- Add notes to specific pages
- Notes editor with rich text
- Notes saved to Appwrite `pdf_notes` collection
- Notes visible alongside the PDF

### AI Q&A on PDF
- Ask the AI questions about the PDF content
- PDF text extracted and included in AI context
- AI answers based on the actual document content
- "Ask about this PDF" button in the resources panel

### Resource Library (`/pdf-manager`)
- View all uploaded PDFs
- Search across PDFs by name
- Delete PDFs
- See file size and upload date

### Study Time Tracking
- Time spent reading each PDF tracked automatically
- Stored in `pdf_resources` collection
- Visible in resource details

**Advantage:** PDFs aren't just stored — they're interactive. Highlight, annotate, and ask the AI questions about specific passages without leaving the app.

---

## 9. Audio Lecture System

### Audio Upload
- Upload audio files (MP3, WAV, M4A, WebM)
- Files stored in Cloudflare R2
- Metadata stored in Appwrite `audio_lectures` collection

### AI Processing
- AI generates full lecture notes from the audio
- AI generates a complete transcript
- Notes formatted with headings, bullet points, key concepts
- Processing happens via Appwrite function

### Audio Lecture Viewer (in Resources panel)
Three tabs:

**Notes tab:**
- Full AI-generated lecture notes
- Rendered with full markdown, charts, diagrams, math
- Highlight any text → save highlight to Appwrite
- Highlights persist across sessions

**Transcript tab:**
- Full word-by-word transcript
- Highlights applied to transcript text
- Select text → "Ask about this" button appears
- Click → sends selected text to AI chat for explanation

**Chat tab:**
- Ask questions about the lecture
- AI has full context of the lecture notes and transcript
- "Explain this from the lecture: [selected text]" auto-populated

### Audio Player
- Play/pause
- Seek bar
- Playback speed control
- Volume control
- Time display (current / total)

### Text Selection → AI Question
- Select any text in notes or transcript
- Tooltip appears: "Ask AI about this"
- Click → sends to chat: "Explain this from the lecture: [text]"
- On mobile: tap to select, tooltip appears

**Advantage:** Audio lectures become fully searchable, annotatable study materials. Students can highlight key moments and ask the AI to explain anything they didn't understand.

---

## 10. YouTube Study

### YouTube Video Processing
- Paste a YouTube URL
- Appwrite function extracts the transcript via YouTube API
- AI generates study notes from the transcript
- Notes stored in `youtube_studies` collection

### YouTube Study Panel
- Shows generated notes
- Ask AI questions about the video content
- Notes formatted with headings and key points

**Advantage:** Turn any YouTube lecture or tutorial into structured study notes without watching the whole video.

---

## 11. Pomodoro Timer

### Timer Modes
- **Focus:** 25 minutes (purple)
- **Short Break:** 5 minutes (green)
- **Long Break:** 15 minutes (blue)

### Controls
- Play/Pause button
- Reset button
- Skip to next mode button
- Mode tabs to switch manually

### Auto-Progression
- After 4 focus sessions → long break automatically
- After short/long break → returns to focus mode
- Auto-starts break after focus session completes
- After break ends → navigates back to the study session automatically

### Visual Feedback
- Circular progress ring (SVG, animated)
- Countdown timer in the ring
- Mode label below timer
- Session dots (4 dots, fills as focus sessions complete)
- Colour changes per mode

### Navbar Integration
- Tomato 🍅 button in the navbar
- Shows live countdown when running
- Coloured dot indicator when active
- Dropdown panel opens on click, closes on outside click

### Focus Guard
- "🔒 Focus mode — stay in your session" notice when running
- Browser `beforeunload` warning if you try to leave during focus
- Saves the session path — returns you to the exact session after break

### Audio Alert
- Plays a beep sound when timer completes (Web Audio API)
- Works without any external audio files

**Advantage:** The timer is integrated with the study session — it knows where you are and brings you back after breaks. No separate app needed.

---

## 12. Text-to-Speech (TTS)

### How It Works
1. Click the speaker icon on any AI message
2. System checks cache for existing audio
3. Cache miss → calls Gemini 2.5 Flash TTS via Appwrite function
4. Audio generated and stored in Cloudflare R2
5. Audio plays in browser
6. URL cached in `tts_cache_metadata` for future plays

### TTS Player
- Play/pause
- Seek bar
- Playback speed (0.5× to 2×)
- Volume control
- Auto-plays on generation

### Caching
- Same text → same audio URL (no re-generation)
- Cache stored in Appwrite with expiry
- Reduces cost and latency for repeated plays

### TTS Help Modal
- "?" button explains how TTS works
- Shows which voices are available
- Explains caching behaviour

### Multi-segment TTS (`ttsMulti.js`)
- Long messages split into segments
- Each segment generated and played sequentially
- Seamless playback across segments

**Advantage:** Any AI response can be listened to. Useful for students who learn better by hearing, or who want to review content while doing something else.

---

## 13. Charts, Diagrams & Visual Learning

### Bar Charts
- Vertical bars with labels
- Hover tooltips
- Legend
- Responsive width

### Line Charts
- Connected data points
- Smooth curves
- Hover tooltips

### Pie Charts
- Percentage labels
- Colour-coded segments
- Hover tooltips

### Area Charts
- Filled area under line
- Shows cumulative data

### Mermaid Diagrams
- Flowcharts (processes, decision trees, algorithms)
- Sequence diagrams (step-by-step interactions)
- Class diagrams (taxonomies, hierarchies)
- State diagrams (cycles, phases — cell cycle, water cycle)
- Graph diagrams (concept maps, molecular pathways)

### SVG Figures
- Force diagrams with labelled arrows
- Vector diagrams with angle arcs
- Geometric figures with measurements
- Circuit diagrams
- Molecular geometry
- Projectile motion paths
- Any diagram requiring exact angles and measurements

### LaTeX Math Rendering
- Inline math: `$E = mc^2$`
- Display math: `$$F = ma$$`
- Greek letters, fractions, integrals, summations
- Chemical formulas with subscripts
- Units in roman text

### Auto-Fix for Malformed Charts
- `chartFixer.js` detects when AI generates chart data in wrong format
- Automatically converts to correct format
- Only runs on short responses with chart keywords
- Never touches lecture notes or long documents

**Advantage:** The AI doesn't just explain — it shows. Every concept that can be visualised, is visualised. Students learn faster with visual aids.

---

## 14. File Attachments in Chat

### Supported File Types
- PDF documents
- Images (JPG, PNG, GIF, WebP)
- Text files (.txt, .md, .csv)
- Code files

### Upload Flow
- Click attachment icon in chat input
- Select file from device
- File uploaded to Appwrite Storage
- File content extracted and included in AI context
- AI can answer questions about the file content

### File Display in Chat
- File attachment shown as a card in the message
- File name, type, and size displayed
- Click to view/download

### PDF Processing
- PDF text extracted automatically
- Included in AI context for Q&A
- "PDF processed: [filename]" marker in message

### Image Analysis
- Images sent to AI for visual analysis
- AI can describe, explain, or answer questions about images

**Advantage:** Students can upload their textbook pages, lecture slides, or handwritten notes and ask the AI questions about them directly in the chat.

---

## 15. Theme System

### Dark / Light Mode
- Toggle with `Ctrl + Shift + T` or the theme toggle button in navbar
- Preference saved to localStorage
- Applies instantly across all pages
- All components respect the theme via CSS variables

### CSS Variables
- `--color-bg-primary/secondary/tertiary` — background layers
- `--color-text-primary/secondary/muted` — text hierarchy
- `--color-accent` — purple (#a855f7) — consistent brand colour
- `--color-border` — borders and dividers
- `--shadow-sm/md/lg` — elevation system

**Advantage:** Dark mode is the default for late-night study sessions. Light mode for daytime. One click to switch.

---

## 16. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + D` | Go to Dashboard |
| `Ctrl + N` | New Session |
| `Ctrl + F` | Focus Search |
| `Ctrl + Enter` | Send Message |
| `Ctrl + U` | Upload File |
| `Ctrl + K` | Show Keyboard Shortcuts |
| `Ctrl + Shift + T` | Toggle Theme |
| `Ctrl + S` | Save/Update Session |
| `Ctrl + E` | Export Session |
| `Escape` | Close Modal / Clear Selection |

**Advantage:** Power users never need to touch the mouse. Full keyboard navigation throughout the app.

---

## 17. Export & Import

### Export Single Session (JSON)
- Downloads full session with all messages as `.json`
- Includes session metadata (title, subject, mode, dates)

### Export Single Session (Markdown)
- Downloads session as a readable `.md` file
- Each message formatted with role labels (👤 You / 🤖 AI)
- Human-readable, can be opened in any text editor

### Bulk Export (JSON)
- Select multiple sessions on dashboard
- Export all selected as a single `.json` file
- Includes all messages for all selected sessions

### Export Statistics (CSV)
- Export session statistics as `.csv`
- Columns: Title, Subject, Mode, Created, Updated, Message Count
- Opens in Excel or Google Sheets

### Import Sessions (JSON)
- Import previously exported `.json` files
- Validates file format before importing
- Restores sessions to the dashboard

**Advantage:** Your study data is yours. Export everything, import it back, or open it in any tool. No lock-in.

---

## 18. Navigation & UI

### Navbar
- LastWeek logo (links to dashboard)
- Pomodoro timer button (live countdown when running)
- Theme toggle
- Profile dropdown (name, email, settings link, logout)
- "New Session" button
- Responsive — collapses on mobile

### Profile Dropdown
- Shows user name and email
- Link to Settings
- Logout button

### Mode Selector (`/mode-select`)
- 5 mode cards with icons and descriptions
- Click to create a new session in that mode
- Subject input field before starting

### Landing Page
- Marketing page for non-logged-in users
- Feature highlights
- Call-to-action buttons
- Responsive design

### Error Boundary
- Catches React rendering errors
- Shows friendly error message instead of blank screen
- "Try Again" button to recover

### Loading States
- Spinner component for async operations
- Loading dots for streaming AI responses
- Skeleton states where appropriate

### Mobile Responsive
- Full mobile support across all pages
- Touch-optimised interactions
- Orientation prompt for landscape-only views
- Mobile-specific CSS overrides
- iOS safe area support (`viewport-fit=cover`)

### Orientation Handling
- Detects landscape/portrait orientation
- Shows prompt for pages that work better in landscape
- Adjusts layout automatically

---

## 19. Resource Library — Three Layers

The app has three distinct but connected library systems. This is one of the most powerful and least obvious features.

---

### Layer 1 — Session Resources Panel (in every study mode)

Opened by clicking the 📚 Resources button in the chat toolbar. A slide-in panel that shows all files attached to the current session.

**What's in it:**
- All PDFs uploaded to this session
- All audio lectures processed in this session
- Sorted by: Recent / Name / Size (dropdown)
- Search by filename or tags
- File type badges: PDF, JPG, PNG, SVG, HTML, Audio Lecture
- Page progress: "Page 4 of 12" for PDFs you've partially read
- Last accessed timestamp (relative: "2h ago", "3d ago")
- Resource count in footer: "5 resources in this session"

**Actions per resource:**
- **View / Study** — opens the full viewer (PDF viewer or Audio Lecture Viewer)
- **🔒 Share / 🌐 Shared** — toggle to make the resource public in the community library

**Upload buttons in the panel:**
- **🎙️ Audio** — opens the Audio Processor to upload and process a new audio lecture
- **🔍 Library** — opens the community Resource Library to browse shared resources

**Study time tracking:**
- Automatically tracks how many minutes you spend on each resource
- Tracks activity via mouse movement, keypresses, scrolling, clicks
- Pauses tracking if inactive for 2+ minutes
- Saves study time to Appwrite on close

---

### Layer 2 — Community Resource Library (`/resource-library`)

A public library of study materials shared by all users. Browse, filter, and use resources uploaded by the community.

**Discovery features:**
- Search by filename, subject, or description
- Filter by category: Mathematics, Science, History, Literature, Computer Science, Languages, Business, Arts, Other
- Filter by file type: PDF, Images, Text Files, Word Docs
- Results count: "23 resources found"

**Each resource card shows:**
- File type icon (📄 PDF, 🖼️ Image, 📝 Word, 📃 Text)
- Category badge
- Resource title
- Description (if provided by uploader)
- Uploader name (or "Anonymous")
- Upload date
- File size
- Usage count: "Used by 14 students"

**Using a shared resource:**
- Click "Use This Resource" → redirected to Mode Selector with the resource pre-loaded
- Resource is imported into your new session automatically

---

### Layer 3 — Resource Sharing (make your own resources public)

Any PDF or audio lecture you upload can be shared with the community.

**How to share:**
- In the Session Resources Panel, click "🔒 Share" on any resource
- Button changes to "🌐 Shared" — resource is now visible in the community library
- Click again to make it private ("🔒 Share" returns)

**What gets shared:**
- The file itself (stored in Appwrite Storage)
- The filename and subject
- For audio lectures: the AI-generated notes and transcript are also shared

**Privacy:**
- Resources are private by default
- Only explicitly shared resources appear in the community library
- You can un-share at any time

---

**Advantage:** Students don't have to find their own study materials. Someone else in the community may have already uploaded and processed the exact textbook chapter or lecture you need. One click to use it in your own session.

---

## 20. Documentation System

### In-App Docs (`/docs`)
- Full documentation accessible from within the app
- Sections: Getting Started, Study Modes, Study Tools, Exam Planning, Resource Management, Collaboration, FAQ
- Searchable
- Sidebar navigation
- Deep-linking to specific sections (`/docs/:slug/:sectionId`)

---

## 21. Data & Privacy

### What's Stored
- User account (Appwrite Auth)
- Study sessions and messages
- Flashcards with SRS data
- PDF files and metadata
- Audio lecture files (Cloudflare R2) and metadata
- Highlights and notes
- Exam plans
- Language learning progress
- TTS audio cache

### What's NOT Stored
- Payment information (not yet implemented)
- Browsing history outside the app
- Device information beyond what Appwrite collects

### Data Portability
- Full export of all sessions (JSON or Markdown)
- Statistics export (CSV)
- Account deletion available (with double confirmation)

---

## 22. Pro-Bono / Free Capabilities Summary

Everything a free user gets without paying anything:

| Feature | Free access |
|---|---|
| All 5 study modes | ✅ (within message limits) |
| Student assessment | ✅ Unlimited |
| Flashcard generation | ✅ (within message limits) |
| MCQ generation | ✅ (within message limits) |
| Spaced repetition reviews | ✅ Unlimited (for existing cards) |
| Charts, diagrams, math | ✅ Always included in AI responses |
| Dark/light mode | ✅ |
| Keyboard shortcuts | ✅ |
| Session history (7 days) | ✅ |
| Export sessions | ✅ |
| Mobile app | ✅ Same experience |
| Guest mode | ✅ No account needed |
| In-app documentation | ✅ |
| Pomodoro timer | ✅ |
| Theme toggle | ✅ |

---

## 23. Competitive Advantages

### vs. ChatGPT / Claude
- **Structured teaching** — not just Q&A. The AI follows a curriculum, covers all subtopics, never skips.
- **Spaced repetition** — flashcards are scheduled, not just created.
- **Exam planner** — knows your deadline and coaches you topic by topic.
- **Persistent sessions** — come back to the same conversation days later.
- **Visual learning** — charts, diagrams, SVG figures, LaTeX math built in.
- **Audio lectures** — upload a recording, get structured notes.

### vs. Anki / Quizlet
- **AI generates the cards** — no manual creation needed.
- **Cards come from your actual study conversation** — perfectly matched to what you're learning.
- **Integrated with the tutor** — ask the AI to explain a card you got wrong, right there.

### vs. Notion / Obsidian
- **Active, not passive** — the AI teaches, quizzes, and coaches. Not just a note-taking tool.
- **No setup required** — start studying in 30 seconds.

### vs. Duolingo (for language learning)
- **Any language, any level** — not limited to a fixed curriculum.
- **Speaking evaluation** — real pronunciation scoring with AI feedback.
- **Integrated with general study** — language learning alongside all other subjects.

### Unique Capabilities
- **5 distinct teaching philosophies** in one app — students can switch modes per subject
- **Historical persona debates** — no other study app offers this
- **Audio lecture → structured notes** — unique feature
- **Chart auto-fix** — AI-generated charts always render correctly even if the AI makes formatting mistakes
- **Context-aware AI** — the AI knows your level, goal, time, and style for every single message
- **Pomodoro + session integration** — timer knows your session and returns you to it after breaks
