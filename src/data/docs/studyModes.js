export const studyModesContent = {
  id: 'study-modes',
  title: 'Study Modes',
  slug: 'study-modes',
  category: 'Features',
  description: 'Learn about the five evidence-based study modes and when to use each one',
  estimatedReadingTime: 12,
  lastUpdated: '2026-05-11',
  sections: [
    {
      id: 'overview',
      title: 'Study Modes Overview',
      content: `LastWeek offers five specialized study modes, each based on cognitive science research and designed for different learning goals and subject types. You can switch between modes within the same session or use different modes for different subjects.

Each mode uses proven teaching strategies to maximize understanding, retention, and exam performance. The key is choosing the right mode for your specific learning goal.`,
      keywords: ['modes', 'overview', 'learning', 'strategies'],
    },
    {
      id: 'mental-model',
      title: 'Mental Model Mode',
      content: `Mental Model Mode helps you build deep conceptual understanding by connecting new ideas to things you already know.

Purpose: Build intuitive understanding through analogies and frameworks

Best For:
• Abstract concepts (quantum physics, relativity)
• Theoretical subjects (philosophy, economics)
• Complex systems (neural networks, blockchain)
• Subjects requiring "why" understanding

How It Works:
The AI creates relatable analogies and mental frameworks that connect new concepts to familiar ideas. Instead of memorizing definitions, you build bridges between abstract ideas and concrete examples you already understand.

Example Workflow:
1. Upload a physics textbook chapter on quantum superposition
2. Select Mental Model Mode
3. Ask: "Explain quantum superposition using everyday objects"
4. AI provides analogies like coin flips, light switches, or spinning tops
5. Build a mental framework connecting quantum concepts to familiar ideas

Best Practices:
• Start with the big picture before diving into details
• Ask for multiple analogies if the first one doesn't click
• Request comparisons to subjects you already know well
• Draw diagrams to visualize the mental models
• Test your understanding by explaining concepts to others

Common Mistakes:
• Trying to memorize instead of understanding
• Skipping the analogy step and jumping to formulas
• Not asking follow-up questions when confused
• Assuming one analogy explains everything`,
      keywords: ['mental model', 'understanding', 'analogies', 'concepts'],
    },
    {
      id: 'active-recall',
      title: 'Active Recall Mode',
      content: `Active Recall Mode maximizes retention through testing and spaced repetition, scientifically proven to be the most effective study method for long-term memory.

Purpose: Maximize retention through testing and spaced repetition

Best For:
• Exam preparation (SAT, ACT, medical boards)
• Memorization (vocabulary, formulas, dates)
• Certification exams
• Any subject requiring long-term retention

How It Works:
The AI generates personalized quizzes, flashcards, and practice questions based on your materials. It uses spaced repetition to show you content right before you're about to forget it, dramatically increasing retention.

Spaced Repetition Schedule:
• First review: 1 day after learning
• Second review: 3 days after first review
• Third review: 7 days after second review
• Fourth review: 14 days after third review
• Fifth review: 30 days after fourth review

Example Workflow:
1. Upload medical terminology notes
2. Select Active Recall Mode
3. AI generates flashcards and quizzes
4. Study for 20 minutes daily
5. Review wrong answers immediately
6. Track accuracy and progress

Best Practices:
• Review daily for 15-20 minutes rather than cramming
• Don't skip reviews even if you feel confident
• Review wrong answers immediately while fresh
• Aim for 80-90% accuracy before moving on
• Use 2-3 days before exams for final review

Common Mistakes:
• Cramming instead of spacing reviews
• Skipping reviews you feel confident about
• Moving on before reaching 80% accuracy
• Not reviewing wrong answers
• Studying too long in one session (causes fatigue)`,
      keywords: ['active recall', 'retention', 'spaced repetition', 'memorization'],
    },
    {
      id: 'spaced-repetition',
      title: 'Spaced Repetition Mode',
      content: `Spaced Repetition Mode optimizes long-term retention by reviewing material at strategically timed intervals based on cognitive science research.

Purpose: Review material at optimal intervals for maximum retention

Best For:
• Long-term memory building
• Language learning
• Vocabulary mastery
• Building knowledge over time

How It Works:
The platform tracks your learning and automatically schedules reviews at optimal intervals. Material you struggle with appears more frequently, while material you know well appears less often.

Algorithm:
• Easy items: Reviewed every 30 days
• Medium items: Reviewed every 7-14 days
• Difficult items: Reviewed every 1-3 days

Example Workflow:
1. Upload Spanish vocabulary list
2. Select Spaced Repetition Mode
3. Study new vocabulary (20 items)
4. Rate difficulty of each item
5. Platform schedules reviews automatically
6. Review scheduled items daily
7. Watch your retention improve over weeks

Best Practices:
• Study new material consistently (daily if possible)
• Rate difficulty honestly for better scheduling
• Review scheduled items without skipping
• Track your progress over weeks and months
• Combine with other modes for deeper learning

Common Mistakes:
• Skipping scheduled reviews
• Rating everything as "easy" to reduce reviews
• Not studying new material regularly
• Expecting immediate results (spaced repetition takes time)
• Mixing spaced repetition with cramming`,
      keywords: ['spaced repetition', 'long-term', 'retention', 'scheduling'],
    },
    {
      id: 'exam-prep',
      title: 'Exam Prep Mode',
      content: `Exam Prep Mode creates personalized study schedules based on your exam date and helps you prepare strategically for maximum performance.

Purpose: Get personalized study schedule based on your exam date

Best For:
• Major exams (SAT, ACT, GRE, GMAT)
• Medical and law board exams
• Certification exams
• Any high-stakes test

How It Works:
You provide your exam date and topics to cover. The AI creates a personalized daily study plan that:
• Distributes material across available time
• Prioritizes difficult topics
• Includes practice tests and mock exams
• Adapts based on your progress

Example Workflow:
1. Create Exam Prep session
2. Enter exam date (e.g., 60 days away)
3. List topics to cover (e.g., calculus, physics, chemistry)
4. Upload study materials
5. Follow daily study plan
6. Take practice tests weekly
7. Adjust plan based on performance

Study Plan Features:
• Daily goals and time estimates
• Topic prioritization
• Practice test scheduling
• Progress tracking
• Confidence indicators

Best Practices:
• Start with 8-12 weeks before exam
• Follow the daily plan consistently
• Take practice tests seriously (simulate real exam)
• Review wrong answers thoroughly
• Adjust plan if falling behind
• Get adequate sleep during prep period

Common Mistakes:
• Starting too close to exam date
• Not following the daily plan
• Skipping practice tests
• Not reviewing wrong answers
• Cramming the night before
• Neglecting sleep and exercise`,
      keywords: ['exam prep', 'planning', 'schedule', 'exams'],
    },
    {
      id: 'focus-breakdown',
      title: 'Focus Breakdown Mode',
      content: `Focus Breakdown Mode transforms overwhelming material into small, manageable pieces you can master one at a time.

Purpose: Deconstruct overwhelming material into manageable pieces

Best For:
• Dense textbooks (50+ page chapters)
• Complex subjects (advanced mathematics, physics)
• Research papers and academic articles
• Material that feels impossible to understand

How It Works:
The AI analyzes your material and breaks it into a logical learning sequence. Each piece is small enough to master in one study session, with clear connections showing how pieces fit together.

Process:
1. AI identifies main concepts and dependencies
2. Material broken into logical learning order
3. Each piece sized for one study session
4. Clear connections show how pieces relate
5. You master one piece at a time

Example Workflow:
1. Upload 60-page biology chapter
2. Select Focus Breakdown Mode
3. AI breaks into 8 digestible concepts
4. Study concept 1 (photosynthesis basics)
5. Master concept 1 completely
6. Move to concept 2 (light reactions)
7. Continue until chapter mastered

Learning Sequence:
• Concept 1: Foundational ideas
• Concept 2: Builds on concept 1
• Concept 3: Integrates concepts 1-2
• And so on...

Best Practices:
• Master one piece completely before moving on
• Don't skip pieces even if they seem simple
• Use Mental Model mode for each piece
• Ask for visual diagrams
• Test yourself on each piece before moving on

Common Mistakes:
• Trying to learn multiple pieces at once
• Skipping foundational concepts
• Moving on before mastering current piece
• Not asking for clarification
• Trying to memorize instead of understand`,
      keywords: ['focus breakdown', 'chunking', 'overwhelming', 'complex'],
    },
    {
      id: 'choosing-mode',
      title: 'Choosing the Right Mode',
      content: `Selecting the right study mode is crucial for effective learning. Here's a quick guide:

Choose Mental Model Mode When:
• You need to understand "why" something works
• Studying abstract or theoretical concepts
• Building intuition about complex systems
• You want to explain concepts to others

Choose Active Recall Mode When:
• Preparing for exams
• Need to memorize information
• Building short-term retention
• 2-3 days before an exam

Choose Spaced Repetition Mode When:
• Building long-term memory
• Learning languages or vocabulary
• Studying over weeks or months
• Want to retain information permanently

Choose Exam Prep Mode When:
• Preparing for major exams
• Have 8-12 weeks before exam
• Need a structured study plan
• Want to track progress toward exam

Choose Focus Breakdown Mode When:
• Material feels overwhelming
• Studying dense or complex topics
• Need to break material into pieces
• Want to master one concept at a time

Combining Modes:
Most effective learning combines multiple modes:

Week 1: Focus Breakdown + Mental Model
• Break material into pieces
• Build understanding of each piece

Week 2: Active Recall + Spaced Repetition
• Test yourself on material
• Schedule reviews for retention

Before Exam: Active Recall + Exam Prep
• Take practice tests
• Follow exam prep schedule

Example: Preparing for Biology Exam
• Week 1-2: Focus Breakdown (break chapter into concepts)
• Week 2-3: Mental Model (understand each concept)
• Week 3-4: Active Recall (quiz yourself)
• Week 4-5: Spaced Repetition (review material)
• Week 5-6: Exam Prep (practice tests, final review)`,
      keywords: ['choosing', 'mode selection', 'strategy', 'combining'],
    },
  ],
};
