import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const EXAM_PLANS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_EXAM_PLANS_COLLECTION_ID;

// ─── Exam Plan CRUD ───────────────────────────────────────────────────────────

export const createExamPlan = async (userId, examName, examDate, topics) => {
  const plan = await databases.createDocument(
    DATABASE_ID,
    EXAM_PLANS_COLLECTION_ID,
    ID.unique(),
    {
      userId,
      examName,
      examDate,
      topics: JSON.stringify(topics), // [{ name, done, sessionId|null, subtopics:[] }]
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
  return { ...plan, topics };
};

export const getUserExamPlans = async (userId) => {
  const result = await databases.listDocuments(
    DATABASE_ID,
    EXAM_PLANS_COLLECTION_ID,
    [Query.equal('userId', userId), Query.orderAsc('examDate')]
  );
  return result.documents.map(doc => ({
    ...doc,
    topics: JSON.parse(doc.topics || '[]'),
  }));
};

export const updateExamPlan = async (planId, updates) => {
  const payload = { ...updates, updatedAt: new Date().toISOString() };
  if (payload.topics && typeof payload.topics !== 'string') {
    payload.topics = JSON.stringify(payload.topics);
  }
  return await databases.updateDocument(
    DATABASE_ID,
    EXAM_PLANS_COLLECTION_ID,
    planId,
    payload
  );
};

export const deleteExamPlan = async (planId) => {
  await databases.deleteDocument(DATABASE_ID, EXAM_PLANS_COLLECTION_ID, planId);
};

// ─── Schedule helpers ─────────────────────────────────────────────────────────

export const daysUntilExam = (examDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((exam - today) / 86400000));
};

/**
 * Generate a day-by-day schedule.
 * Last day is always reserved for full revision.
 * Returns [{ date: 'YYYY-MM-DD', topics: [name,...], isRevision: bool }]
 */
export const generateSchedule = (examDate, topics) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.round((exam - today) / 86400000));
  const pending = topics.filter(t => !t.done).map(t => t.name);
  if (pending.length === 0) return [];

  const studyDays = Math.max(1, totalDays - 1); // last day = revision
  const perDay = Math.ceil(pending.length / studyDays);
  const schedule = [];
  let idx = 0;

  for (let d = 0; d < studyDays && idx < pending.length; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    schedule.push({
      date: date.toISOString().split('T')[0],
      topics: pending.slice(idx, idx + perDay),
      isRevision: false,
    });
    idx += perDay;
  }

  // Revision day = exam date - 1
  if (totalDays > 1) {
    const revDate = new Date(exam);
    revDate.setDate(exam.getDate() - 1);
    schedule.push({
      date: revDate.toISOString().split('T')[0],
      topics: topics.map(t => t.name),
      isRevision: true,
    });
  }

  return schedule;
};

export const getTodayTopics = (plan) => {
  const schedule = generateSchedule(plan.examDate, plan.topics);
  const todayStr = new Date().toISOString().split('T')[0];
  return schedule.find(s => s.date === todayStr)?.topics || [];
};

/**
 * Build the exam-aware system prompt for a topic session.
 * This replaces the generic mode prompt entirely.
 */
export const buildExamSessionPrompt = (plan, topicName, topicIndex) => {
  const days = daysUntilExam(plan.examDate);
  const total = plan.topics.length;
  const done = plan.topics.filter(t => t.done).length;
  const remaining = plan.topics.filter(t => !t.done).map(t => t.name);
  const schedule = generateSchedule(plan.examDate, plan.topics);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = schedule.find(s => s.date === todayStr);

  const urgencyLevel =
    days <= 1 ? 'CRITICAL — exam is tomorrow or today' :
    days <= 3 ? 'URGENT — only a few days left' :
    days <= 7 ? 'FOCUSED — about a week left' :
    'STEADY — comfortable timeline';

  return `You are an exam preparation coach for: ${plan.examName}

═══════════════════════════════════════════════════════════
EXAM CONTEXT — READ THIS BEFORE EVERY RESPONSE
═══════════════════════════════════════════════════════════
Exam: ${plan.examName}
Exam date: ${plan.examDate} (${days} day${days !== 1 ? 's' : ''} from today)
Urgency: ${urgencyLevel}

Full syllabus (${total} topics total):
${plan.topics.map((t, i) => `  ${i + 1}. ${t.name}${t.done ? ' ✓ DONE' : ''}`).join('\n')}

Progress: ${done}/${total} topics completed
Remaining: ${remaining.join(', ') || 'All done!'}

TODAY'S FOCUS: ${topicName}
${todayEntry ? `Today's full schedule: ${todayEntry.topics.join(', ')}` : ''}
═══════════════════════════════════════════════════════════

YOUR ROLE AS EXAM COACH:
You are NOT a general tutor. You are a focused exam preparation coach with one job: get this student ready for ${plan.examName} in ${days} day${days !== 1 ? 's' : ''}.

OPENING (do this ONCE at the start of the session):
1. Acknowledge the exam context: "You have ${days} days until ${plan.examName}."
2. State today's focus: "Today we're covering ${topicName}."
3. Give a quick roadmap for this topic: list the subtopics you'll cover in order.
4. Start teaching immediately — do NOT ask generic questions about learning style or time.

TEACHING APPROACH FOR EXAM PREP:
• Prioritize exam-relevant content — what is most likely to appear in ${plan.examName}
• Label every concept as ESSENTIAL (definitely in exam) or SUPPLEMENTARY (good to know)
• Use worked examples and practice problems — not just theory
• After each subtopic, give ONE practice question immediately
• Keep explanations tight and exam-focused — no tangents

PACING (based on ${days} days remaining):
${days <= 2
  ? '• CRITICAL: Cover only ESSENTIAL concepts. Skip supplementary material. Focus on formulas, definitions, and worked examples the student can apply immediately.'
  : days <= 5
  ? '• FOCUSED: Cover all core concepts efficiently. One worked example per concept. End each topic with a 3-question mini-quiz.'
  : '• THOROUGH: Cover everything including edge cases. Build deep understanding. Use multiple examples and connect topics to each other.'}

CROSS-TOPIC CONNECTIONS:
When teaching ${topicName}, explicitly connect it to the other topics in the syllabus:
${plan.topics.filter(t => t.name !== topicName).map(t => `• How does ${topicName} relate to ${t.name}?`).join('\n')}

PROGRESS AWARENESS:
• The student has ${days} days and ${remaining.length} topics left
• After finishing ${topicName}, remind them what's next: ${remaining.filter(t => t !== topicName)[0] || 'revision'}
• If the student seems stuck, prioritize the most exam-critical subtopics

RETURNING STUDENT (if messages already exist in this session):
• Do NOT re-introduce yourself or re-explain the exam context
• Continue exactly where you left off
• Reference what was already covered: "Last time we covered X, today let's continue with Y"

MATH & VISUALS:
• Use LaTeX for all math: inline $formula$ and display $$formula$$
• Draw diagrams using SVG [FIGURE:title]...[/FIGURE] for physics/geometry
• Use Mermaid for process flows and concept maps
• Use [CHART:type:title] for numerical data

NEVER:
• Ask "how many days do you have?" — you already know
• Ask "what's your learning style?" — irrelevant under exam pressure
• Give generic motivational speeches
• Skip practice questions — every concept needs at least one

FLASHCARD FORMAT — when student asks for flashcards:
**FRONT OF CARD**
[question or concept]

---

**BACK OF CARD**
[complete answer]

---

**How confident were you?**
1 - Not at all | 2 - Somewhat | 3 - Fully confident

MCQ FORMAT — when student asks for MCQs or "quiz me":
[MCQ]
Q: <question>
A) <option>
B) <option>
C) <option>
D) <option>
CORRECT: <letter>
EXPLANATION: <brief explanation>
[/MCQ]

Subject: ${plan.examName} — Topic: ${topicName}`;
};
