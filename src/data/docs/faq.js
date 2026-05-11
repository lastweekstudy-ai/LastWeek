export const faqContent = {
  id: 'faq',
  title: 'Frequently Asked Questions',
  slug: 'faq',
  category: 'Help',
  description: 'Find answers to common questions about LastWeek',
  estimatedReadingTime: 8,
  lastUpdated: '2026-05-11',
  sections: [
    {
      id: 'account-questions',
      title: 'Account & Setup',
      content: `Q: How do I create an account?
A: Click "Sign Up" on the homepage, enter your email and password, and verify your email address. You'll be ready to start studying in minutes.

Q: Is LastWeek free?
A: LastWeek is free with all core features included. No credit card required.

Q: Can I use LastWeek on mobile?
A: Yes, LastWeek works on any device with a web browser. We recommend using a tablet or computer for the best experience.

Q: How do I reset my password?
A: Click "Forgot Password" on the login page, enter your email, and follow the reset link sent to your email.

Q: Can I change my email address?
A: Yes, go to Settings > Account and update your email address.

Q: How do I delete my account?
A: Go to Settings > Account > Delete Account. This will permanently delete your account and all data.

Q: Can I have multiple accounts?
A: You can create multiple accounts with different email addresses, but we recommend using one account for all your studies.

Q: Is my data private?
A: Yes, your data is private and encrypted. We never share your information with third parties.`,
      keywords: ['account', 'setup', 'password', 'email'],
    },
    {
      id: 'study-questions',
      title: 'Study & Learning',
      content: `Q: How do I create a study session?
A: Click "New Session", enter a subject name, and click "Create". You're ready to upload materials.

Q: What file types can I upload?
A: You can upload PDFs (100MB), audio files (25MB), images (50MB), and HTML content.

Q: How long does it take to process a file?
A: Most files process within 1-2 minutes. Large files may take longer.

Q: Can I upload multiple files to one session?
A: Yes, you can upload as many files as you want to a single session.

Q: How do I choose which study mode to use?
A: See the Study Modes section for detailed guidance. Generally: Mental Model for understanding, Active Recall for memorization, Spaced Repetition for long-term retention, Exam Prep for exams, Focus Breakdown for overwhelming material.

Q: Can I switch study modes mid-session?
A: Yes, you can switch between modes at any time.

Q: How long should I study each day?
A: We recommend 25-50 minute study sessions (Pomodoro intervals) with 5-10 minute breaks. Most students study 1-3 hours per day.

Q: How often should I review material?
A: Use spaced repetition: 1 day, 3 days, 7 days, 14 days, 30 days after initial learning.

Q: Can I study offline?
A: Most features require internet. Offline support is coming soon.

Q: How do I track my progress?
A: Go to Dashboard to see your study statistics, quiz scores, and progress over time.`,
      keywords: ['study', 'sessions', 'modes', 'progress'],
    },
    {
      id: 'feature-questions',
      title: 'Features & Tools',
      content: `Q: How do flashcards work?
A: Flashcards test your knowledge using spaced repetition. You see a question, try to answer, then reveal the answer. Rate difficulty, and the platform schedules reviews automatically.

Q: Can I generate flashcards automatically?
A: Yes, upload material and select "Generate Flashcards". AI creates flashcards from your content.

Q: How do quizzes work?
A: Quizzes test your knowledge with multiple choice, short answer, and other question types. You get instant feedback and detailed explanations.

Q: Can I record audio directly in LastWeek?
A: Yes, click "Record" and allow browser access to your microphone. Audio is automatically transcribed.

Q: How does the AI tutor work?
A: Ask questions about your materials. The AI analyzes your uploaded content and provides contextual answers.

Q: Can I share my study materials?
A: Yes, make resources public and share the link. Classmates can import your materials.

Q: Can I import materials from classmates?
A: Yes, browse the community library and import resources created by other students.

Q: How does the Pomodoro timer work?
A: Study for 25 minutes (1 Pomodoro), take a 5-minute break, repeat. After 4 Pomodoros, take a 15-30 minute break.

Q: Can I customize the Pomodoro duration?
A: Yes, you can set custom durations for study and break periods.

Q: How do I highlight and take notes?
A: Open a PDF, select text to highlight, and click the highlight button. Click "Add Note" to add annotations.`,
      keywords: ['features', 'tools', 'flashcards', 'quizzes'],
    },
    {
      id: 'technical-questions',
      title: 'Technical Issues',
      content: `Q: What browsers does LastWeek support?
A: LastWeek works on Chrome, Firefox, Safari, and Edge. We recommend the latest version of your browser.

Q: Why is my file not uploading?
A: Check that your file is under the size limit (PDFs 100MB, audio 25MB, images 50MB). Try a different browser if the problem persists.

Q: Why is my audio not transcribing?
A: Ensure audio quality is good and background noise is minimal. Very long files may take longer to transcribe.

Q: Why are my flashcards not saving?
A: Check your internet connection. Try refreshing the page and creating the flashcard again.

Q: Why is the AI tutor not responding?
A: Check your internet connection. Try asking a different question. If the problem persists, contact support.

Q: How do I clear my browser cache?
A: Instructions vary by browser. Search "clear cache [your browser]" for specific steps.

Q: Why is LastWeek running slowly?
A: Close unnecessary browser tabs, clear your cache, or try a different browser.

Q: Can I use LastWeek on a tablet?
A: Yes, LastWeek works on tablets. Some features may be optimized for larger screens.

Q: Why can't I access my account?
A: Check your email and password. Try resetting your password if you forgot it.

Q: How do I report a bug?
A: Go to Settings > Help > Report Bug and describe the issue. Our team will investigate.`,
      keywords: ['technical', 'browser', 'troubleshooting', 'support'],
    },
    {
      id: 'data-questions',
      title: 'Data & Privacy',
      content: `Q: Is my data encrypted?
A: Yes, all data is encrypted in transit and at rest using industry-standard encryption.

Q: How long do you keep my data?
A: We keep your data as long as your account is active. Deleted accounts are removed after 30 days.

Q: Can I export my data?
A: Yes, go to Settings > Data > Export to download your data.

Q: Can I delete specific materials?
A: Yes, click the delete button on any material. Deleted materials cannot be recovered.

Q: Who can see my study materials?
A: Only you can see private materials. Public materials can be seen by anyone in the community.

Q: Can I make materials private after sharing?
A: Yes, click "Make Private" to remove materials from the community.

Q: Do you sell my data?
A: No, we never sell or share your data with third parties.

Q: How do you use my data?
A: We use your data to improve LastWeek, personalize your experience, and provide better recommendations.

Q: Can I request my data?
A: Yes, go to Settings > Data > Request Data to download all your information.

Q: How do I delete my data?
A: Delete individual materials or delete your entire account. Account deletion removes all associated data.`,
      keywords: ['data', 'privacy', 'encryption', 'security'],
    },
    {
      id: 'exam-questions',
      title: 'Exam Preparation',
      content: `Q: How do I use Exam Prep mode?
A: Create an Exam Prep session, enter your exam date and topics, and follow the personalized study plan.

Q: How far in advance should I start studying?
A: We recommend starting 8-12 weeks before your exam for best results.

Q: Can I adjust my study plan?
A: Yes, the plan adapts based on your progress. You can also manually adjust daily goals.

Q: How many practice tests should I take?
A: We recommend taking practice tests weekly during your study period, and 2-3 times in the final week.

Q: How do I prepare for the day before the exam?
A: Review key concepts, take a light practice test, and get good sleep. Avoid heavy studying the night before.

Q: What should I do the morning of the exam?
A: Eat a good breakfast, review key formulas or facts, and arrive early. Stay calm and confident.

Q: How do I review after the exam?
A: Review your exam results, identify weak areas, and study those topics for future exams.

Q: Can I use LastWeek during the exam?
A: No, LastWeek is for studying before the exam. During the exam, follow your school's rules.

Q: How do I track my exam preparation progress?
A: Go to Dashboard to see your study statistics, quiz scores, and progress toward your exam.

Q: What if I'm falling behind my study plan?
A: Adjust your plan to focus on most important topics. Study more intensively in your strongest areas.`,
      keywords: ['exam', 'preparation', 'planning', 'practice'],
    },
    {
      id: 'collaboration-questions',
      title: 'Sharing & Collaboration',
      content: `Q: How do I share materials with my study group?
A: Make materials public and share the link with your group. They can import materials into their accounts.

Q: Can I collaborate on notes with classmates?
A: You can share notes and classmates can import them. Real-time collaboration is coming soon.

Q: How do I find study materials from other students?
A: Click "Browse Community" in your library to search and browse shared materials.

Q: Can I rate and review shared materials?
A: Yes, you can rate materials and leave reviews to help other students.

Q: How do I report inappropriate materials?
A: Click the report button on any material to report it to our moderation team.

Q: Can I see who imported my materials?
A: Yes, go to your material details to see import statistics.

Q: How do I give credit to the original creator?
A: When importing materials, the original creator is automatically credited.

Q: Can I modify shared materials?
A: You can modify imported materials in your own account. Original materials are not affected.

Q: How do I organize shared materials?
A: Create folders and move imported materials into them for better organization.

Q: Can I unshare materials I've shared?
A: Yes, click "Make Private" to remove materials from the community.`,
      keywords: ['sharing', 'collaboration', 'community', 'materials'],
    },
  ],
};
