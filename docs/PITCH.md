# What I'm Building

---

So I'm building a study platform called **LastWeek**.

The name comes from that feeling everyone knows — it's the last week before your exam and you're trying to cram everything at once. That's the problem I'm solving, but not just for last-minute cramming. For the whole learning process.

---

## The Core Idea

Most students have the same problem: they have the tools — notes, PDFs, YouTube lectures, textbooks — but no system. They read passively, forget quickly, and don't know what to study next. Existing apps either give you a chatbot (ChatGPT), a flashcard tool (Anki), or a fixed course (Duolingo). None of them connect.

LastWeek connects all of it into one place, powered by AI that actually knows you.

---

## What It Does

When you open LastWeek, you pick a subject and a **study mode**. There are five:

- **Mental Model** — the AI teaches you from scratch using analogies and visual aids
- **Active Recall** — the AI quizzes you Socratically, forces you to retrieve before it explains
- **Focus Breakdown** — breaks any topic into chunks, labels what's essential vs supplementary, works with a built-in Pomodoro timer
- **Collaborative Scholar** — the AI takes on a historical persona (Einstein, Socrates, Darwin) and debates or peer-reviews your work
- **Creative Synthesis** — you demonstrate mastery by building something: a mind map, a story, a project

Before the first message in any session, the AI asks you four quick questions — your level, your goal, your time available, your preferred style. Every single response after that is calibrated to your answers. It's not a generic chatbot. It knows you're a beginner with 2 days before an exam who learns through analogies.

---

## The Features That Make It Different

**Flashcards that actually work.** The AI generates flashcards automatically from your conversation — short, memory-style cards (1–5 word answers, not paragraphs). They're saved to a full library with collections, search, filters, and spaced repetition scheduling. Hard cards come back tomorrow. Easy cards come back in a week. You never have to think about what to review.

**MCQs integrated everywhere.** Ask the AI to quiz you in any session — study mode, exam prep, language learning, PDF Q&A, audio lecture chat. Every question you answer automatically creates a flashcard. Questions you got wrong come back sooner.

**Exam Planner.** You enter your exam name, date, and topics. The system distributes topics across your available days and tells you exactly what to study each day. Each topic gets its own AI coaching session. The AI knows your deadline and urgency — it starts immediately with a roadmap and coaches you through it.

**PDF and Audio Study.** Upload a PDF and ask the AI questions about it. Highlight passages, add notes, track your reading progress. Upload an audio lecture and the AI generates full structured notes and a transcript. You can click any sentence in the transcript and ask the AI to explain it.

**Language Learning.** Not a fixed curriculum like Duolingo. You pick the language, level, and goal. The AI generates a personalised roadmap. You get all practice types in one place: reading, writing, listening, speaking (with pronunciation scoring), conversation with scenario-based roleplay, grammar drills, vocabulary quizzes. Flashcards are generated automatically from every new word you encounter.

**Community Resource Library.** Users can share their processed PDFs and audio lectures with the community. When you share something, others can add it to their library — but they can't re-share it, and if you stop sharing it, it becomes inaccessible to everyone who added it. Each resource shows how many students have added it.

---

## The Tech

It's a React web app. The backend is Appwrite — handles auth, database, file storage, and serverless functions. Audio files go to Cloudflare R2 (no egress fees). The AI layer uses multiple providers with automatic fallback — if one is rate-limited or slow, it silently switches to the next. The whole thing costs roughly **$0.22 per active user per month** to run.

---

## Where It's At

The core is built and working. I'm currently polishing the details — fixing edge cases, tightening the UI, making sure nothing leaks implementation details to users. The flashcard system, exam planner, language learning, resource library, PDF study, audio processing — all functional.

The next step is getting real users on it and seeing where the friction is.

---

## The One-Line Version

> An AI study platform that teaches, quizzes, plans, and adapts — so students stop studying harder and start studying smarter.
