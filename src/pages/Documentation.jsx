import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Documentation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [navDropdown, setNavDropdown] = useState(null);

  const sections = {
    'getting-started': {
      title: 'Getting Started',
      icon: '🚀',
      content: (
        <div className="doc-content">
          <h1>Getting Started with LastWeek</h1>
          <p>
            Welcome to LastWeek, your ultimate study companion designed to transform the way you learn and prepare for exams. 
            Whether you're a high school student preparing for finals, a college student tackling challenging courses, or a professional 
            seeking to master new skills, LastWeek provides intelligent, adaptive learning modes tailored to your unique learning style.
          </p>
          
          <h2>What is LastWeek?</h2>
          <p>
            LastWeek is a comprehensive study platform that combines multiple learning methodologies into one powerful application. 
            It leverages advanced technology to help you understand concepts deeply, retain information longer, and perform better on exams. 
            The platform supports various resource types including PDFs, audio lectures, images, and HTML content, all organized within 
            personalized study sessions.
          </p>

          <h2>Creating Your First Account</h2>
          <p>
            Getting started with LastWeek is simple and straightforward. Click the "Get Started" button on the landing page and follow 
            the registration process. You'll need to provide your email address and create a secure password. Once you've verified your 
            email, you'll have immediate access to all features. There's no credit card required, and you can start studying right away 
            with our free plan that includes all core features.
          </p>

          <h2>Setting Up Your Profile</h2>
          <p>
            After creating your account, take a moment to complete your profile. This helps LastWeek personalize your experience. 
            You can add your name, upload a profile picture, set your timezone, and choose your preferred study mode. These settings 
            can be updated anytime from your account settings, so don't worry about getting everything perfect on your first try.
          </p>

          <h2>Your First Study Session</h2>
          <p>
            A study session is your workspace for focused learning on a specific topic. To create your first session, click the 
            "New Session" button on your dashboard. Give it a descriptive name like "Biology Chapter 5" or "Calculus Derivatives", 
            select a study mode that matches your learning goal, and choose the subject area. Once created, you can start uploading 
            resources and begin your learning journey.
          </p>

          <h2>Next Steps</h2>
          <p>
            After creating your first session, explore the different study modes to find what works best for you. Try uploading a PDF 
            or recording an audio lecture to see how LastWeek processes and organizes your materials. Don't hesitate to experiment with 
            different features—the best way to learn the platform is by using it actively.
          </p>
        </div>
      )
    },
    'study-modes': {
      title: 'Study Modes',
      icon: '🧠',
      content: (
        <div className="doc-content">
          <h1>Understanding LastWeek's Study Modes</h1>
          <p>
            LastWeek offers five distinct study modes, each designed to address different learning objectives and leverage proven 
            educational methodologies. Understanding which mode to use for your current learning goal is key to maximizing your 
            effectiveness and retention.
          </p>

          <h2>Mental Model Mode</h2>
          <p>
            The Mental Model mode is perfect when you're encountering a new subject or topic for the first time. This mode focuses 
            on building deep conceptual understanding by breaking down complex topics into their fundamental components. When you 
            upload study material in this mode, our AI analyzes the content and creates visual concept maps showing how different 
            ideas relate to each other.
          </p>
          <p>
            In Mental Model mode, you'll see structured breakdowns of concepts, visual diagrams illustrating relationships, and 
            interactive explanations. You can ask clarifying questions through the chat interface, and the AI will provide detailed 
            explanations grounded in your study material. This mode is ideal for building the foundational understanding you need 
            before moving to more advanced learning techniques.
          </p>

          <h2>Active Recall Mode</h2>
          <p>
            Active Recall mode is based on the scientifically-proven principle that retrieving information from memory strengthens 
            that memory. Rather than passively reading material, this mode generates questions from your study content and challenges 
            you to answer them without looking at the source material. This forces your brain to actively retrieve information, 
            which significantly improves retention and understanding.
          </p>
          <p>
            When using Active Recall mode, you'll encounter auto-generated quizzes, flashcards, and practice problems derived from 
            your uploaded materials. The system tracks which questions you answer correctly and which ones challenge you, allowing 
            it to focus your practice on areas where you need the most improvement. This targeted approach makes your study time 
            more efficient and effective.
          </p>

          <h2>Spaced Repetition Mode</h2>
          <p>
            Spaced Repetition is a learning technique that optimizes long-term retention by reviewing material at strategically 
            timed intervals. Rather than cramming all at once, this mode schedules reviews of flashcards and study materials based 
            on how well you know each item. Items you find easy are reviewed less frequently, while challenging items are reviewed 
            more often, ensuring you spend your study time where it matters most.
          </p>
          <p>
            The Spaced Repetition algorithm learns from your performance and adjusts review schedules accordingly. As you rate your 
            confidence on each flashcard (easy, medium, or hard), the system calculates optimal review intervals. Over time, you'll 
            notice that material you once found difficult becomes easier, and your overall retention improves dramatically. This mode 
            is particularly effective for vocabulary, facts, formulas, and any information you need to remember long-term.
          </p>

          <h2>Exam Prep Mode</h2>
          <p>
            Exam Prep mode is specifically designed for focused, time-bound exam preparation. When you create an exam plan, you 
            specify the exam date and the topics you need to cover. LastWeek's AI then generates a personalized study schedule that 
            breaks down your preparation into manageable daily goals, prioritizing topics based on difficulty and importance.
          </p>
          <p>
            This mode includes mock exams that simulate real testing conditions, helping you build confidence and identify areas 
            needing more practice. The system tracks your progress toward exam readiness and provides daily recommendations on what 
            to study. As your exam date approaches, the schedule intensifies, ensuring you're fully prepared when test day arrives.
          </p>

          <h2>Focus Breakdown Mode</h2>
          <p>
            Focus Breakdown mode is for when you want to deeply master a specific, challenging topic. Rather than surveying broad 
            material, this mode lets you zoom in on a particular concept and explore it comprehensively. The AI extracts all related 
            content from your materials, provides detailed explanations, shows worked examples, and generates practice problems 
            specifically focused on that topic.
          </p>
          <p>
            Use this mode when you encounter a concept that doesn't quite click, or when you want to achieve mastery-level 
            understanding of a particular subject. The focused approach ensures you develop deep expertise rather than surface-level 
            knowledge.
          </p>
        </div>
      )
    },
    'features': {
      title: 'Features',
      icon: '✨',
      content: (
        <div className="doc-content">
          <h1>Comprehensive Features Overview</h1>
          <p>
            LastWeek is packed with powerful features designed to support every aspect of your learning journey. From resource 
            management to progress tracking, each feature is carefully crafted to enhance your study experience and help you achieve 
            your academic goals.
          </p>

          <h2>Resource Management</h2>
          <p>
            LastWeek supports multiple resource types, allowing you to bring all your study materials into one organized platform. 
            You can upload PDF documents, record or upload audio lectures, add images, and even include HTML files. Each resource 
            is automatically processed and organized within your study sessions, making it easy to find exactly what you need when 
            you need it.
          </p>
          <p>
            When you upload a PDF, LastWeek automatically extracts the text, making it searchable and analyzable. Audio files are 
            transcribed automatically, and the transcription is synchronized with the audio playback. This means you can listen to 
            a lecture while reading along with the transcript, or search for specific topics within the audio content.
          </p>

          <h2>Highlighting and Notes</h2>
          <p>
            Traditional studying often involves highlighting important passages and writing notes in the margins. LastWeek brings 
            this familiar study technique into the digital age. You can highlight text in five different colors, each representing 
            different types of information. For example, you might use yellow for key concepts, green for definitions, and blue 
            for examples.
          </p>
          <p>
            Beyond highlighting, you can add detailed notes to any page or timestamp in your materials. These notes are saved 
            automatically and can be reviewed later. The system even lets you search across all your highlights and notes, making 
            it easy to find that important concept you highlighted weeks ago.
          </p>

          <h2>Flashcards and Spaced Repetition</h2>
          <p>
            Flashcards are one of the most effective study tools available, and LastWeek makes creating and using them effortless. 
            You can create flashcards manually, or let the AI auto-generate them from your study materials. Each flashcard has a 
            front (question or prompt) and a back (answer or explanation), and you can include images and formatting on both sides.
          </p>
          <p>
            When studying flashcards, you rate your confidence on each card. The system uses this feedback to schedule reviews at 
            optimal intervals. Cards you find easy might not appear again for weeks, while challenging cards appear more frequently. 
            This intelligent scheduling ensures you spend your study time efficiently, focusing on material you actually need to 
            practice.
          </p>

          <h2>Quizzes and Self-Assessment</h2>
          <p>
            LastWeek automatically generates quizzes from your study materials, providing immediate feedback on your understanding. 
            Quizzes can include multiple choice questions, short answer questions, fill-in-the-blank, true/false, and matching 
            questions. Each quiz is customizable—you can choose the difficulty level, number of questions, and specific topics to 
            focus on.
          </p>
          <p>
            After completing a quiz, you receive detailed feedback showing which questions you answered correctly and which ones 
            need more study. For each incorrect answer, you can see the explanation and review the relevant material. This immediate 
            feedback loop helps you identify knowledge gaps quickly and address them before they become problems.
          </p>

          <h2>Pomodoro Timer</h2>
          <p>
            The Pomodoro Technique is a time management method that breaks study sessions into focused intervals separated by short 
            breaks. LastWeek includes a built-in Pomodoro timer that helps you maintain focus and avoid burnout. The default settings 
            are 25 minutes of focused study followed by a 5-minute break, with a longer 15-minute break after four cycles.
          </p>
          <p>
            You can customize these intervals to match your preferences and attention span. The timer provides audio notifications 
            when intervals end, and it tracks your study sessions over time, giving you insights into your study patterns and 
            productivity.
          </p>
        </div>
      )
    },
    'resources': {
      title: 'Managing Resources',
      icon: '📚',
      content: (
        <div className="doc-content">
          <h1>Working with Study Resources</h1>
          <p>
            Resources are the foundation of your study sessions. Whether it's a textbook chapter, a recorded lecture, or a set of 
            notes, LastWeek helps you organize, process, and learn from all your study materials in one unified platform.
          </p>

          <h2>Uploading PDFs</h2>
          <p>
            PDF documents are one of the most common study resources. To upload a PDF, open your study session and click the upload 
            button. Select your PDF file from your computer, and LastWeek will automatically process it. The system extracts all 
            text from the PDF, making it searchable and analyzable. You can then highlight important passages, add notes, and use 
            all of LastWeek's study tools with your PDF content.
          </p>
          <p>
            PDFs are limited to 100MB in size, which accommodates most textbooks and study materials. If your PDF is larger, you 
            might consider splitting it into multiple files. The PDF viewer includes zoom controls, page navigation, and a search 
            function to help you find specific content quickly.
          </p>

          <h2>Recording and Uploading Audio</h2>
          <p>
            Audio lectures are incredibly valuable study resources, and LastWeek makes it easy to capture and process them. You can 
            either record a lecture directly in your browser using your computer's microphone, or upload an audio file you've 
            already recorded. Supported formats include MP3, WAV, M4A, OGG, and WebM, with a maximum file size of 25MB.
          </p>
          <p>
            Once you upload or record audio, LastWeek automatically transcribes it using advanced speech recognition technology. 
            The transcription is then processed to generate structured study notes with key concepts, summaries, and even visual 
            diagrams where appropriate. You can listen to the audio while reading the transcript, and both are synchronized so you 
            can jump to any part of the lecture instantly.
          </p>

          <h2>Images and Visual Content</h2>
          <p>
            Images, diagrams, and visual content are often crucial for understanding complex topics. LastWeek supports JPG, PNG, and 
            SVG image formats, with a maximum file size of 50MB. You can upload images individually or as part of a collection, and 
            they're automatically organized within your study session.
          </p>
          <p>
            The image viewer includes zoom and pan controls, allowing you to examine details closely. You can add notes and 
            annotations to images, and they're fully integrated with LastWeek's study tools, so you can create flashcards or quizzes 
            based on image content.
          </p>

          <h2>Organizing Resources by Session</h2>
          <p>
            Each study session is a separate workspace for a specific topic or subject. By organizing your resources into sessions, 
            you keep related materials together and maintain a clear structure for your studies. For example, you might have one 
            session for "Biology - Photosynthesis" and another for "Biology - Cellular Respiration", even though both are biology 
            topics.
          </p>
          <p>
            Within each session, resources are displayed in a list showing the file name, type, size, and when it was last accessed. 
            You can sort resources by name, size, or date, and search for specific resources using keywords or tags. This organization 
            system ensures you can always find the materials you need quickly.
          </p>
        </div>
      )
    },
    'sharing': {
      title: 'Sharing & Collaboration',
      icon: '🤝',
      content: (
        <div className="doc-content">
          <h1>Sharing Resources and Collaborating</h1>
          <p>
            One of LastWeek's most powerful features is the ability to share your study resources with other students. By sharing 
            high-quality materials, you help others learn while building a community of collaborative learners. At the same time, 
            you can discover and import resources shared by other students, giving you access to diverse perspectives and materials.
          </p>

          <h2>Making Resources Public</h2>
          <p>
            When you've created a high-quality study resource—whether it's a well-annotated PDF, a recorded lecture with excellent 
            notes, or a comprehensive set of flashcards—you can choose to make it public. This allows other students to discover and 
            import your resource into their own study sessions. To make a resource public, simply click the "Share" button next to 
            the resource in your library. The button will change to show "Shared", indicating that your resource is now available to 
            the community.
          </p>
          <p>
            When you share a resource, only the processed content is shared—your personal highlights, notes, and bookmarks remain 
            private. This means other students get access to the core material and any AI-generated content, but your personal study 
            annotations stay with you. You can unshare a resource at any time by clicking the "Shared" button again, returning it to 
            private status.
          </p>

          <h2>Discovering Shared Resources</h2>
          <p>
            The Shared Resource Library is a searchable collection of materials shared by students across the platform. To access it, 
            click the "🔍 Library" button in your study session. You'll see a search interface where you can enter topics, subjects, or 
            keywords you're interested in. LastWeek uses intelligent search that understands related concepts, so searching for "force" 
            might also show results for "motion", "acceleration", and "Newton's laws".
          </p>
          <p>
            Search results show the resource title, type (PDF, audio, image), a preview of the content, and who shared it. You can 
            click on any result to see more details before deciding whether to import it. This preview helps you ensure the resource 
            is relevant to your needs before adding it to your session.
          </p>

          <h2>Importing Resources</h2>
          <p>
            When you find a resource in the Shared Library that you want to use, click the "+ Add" button. LastWeek will create an 
            independent copy of that resource in your current study session. This copy is completely separate from the original—any 
            notes you add, highlights you make, or changes you make to your copy don't affect the original resource or other students' 
            copies.
          </p>
          <p>
            Imported resources are private by default, meaning only you can see them. If you later decide to share your imported 
            resource (perhaps after adding your own notes and annotations), you can do so by clicking the Share button. This allows 
            you to build on others' work and contribute your own improvements back to the community.
          </p>

          <h2>Privacy and Control</h2>
          <p>
            LastWeek takes privacy seriously. When you share a resource, you're only sharing the processed content—the extracted text, 
            AI-generated notes, and transcripts. Your personal study materials remain completely private. This means you can confidently 
            share resources knowing that your personal learning journey and study habits are protected.
          </p>
          <p>
            You maintain full control over your shared resources. You can unshare any resource at any time, and you can see statistics 
            about how many students have imported your resources. This transparency helps you understand which materials are most 
            valuable to the community.
          </p>
        </div>
      )
    },
    'progress': {
      title: 'Progress Tracking',
      icon: '📊',
      content: (
        <div className="doc-content">
          <h1>Tracking Your Learning Progress</h1>
          <p>
            Understanding your progress is crucial for effective learning. LastWeek provides comprehensive analytics and progress 
            tracking tools that help you monitor your improvement, identify areas needing more work, and stay motivated throughout 
            your learning journey.
          </p>

          <h2>Study Statistics</h2>
          <p>
            LastWeek automatically tracks various metrics about your studying. These include total study time, number of sessions 
            completed, resources studied, quiz performance, flashcard mastery levels, and topics covered. All this data is compiled 
            into easy-to-understand visualizations that show your learning patterns and progress over time.
          </p>
          <p>
            You can view your statistics by clicking the "📊 Analytics" button on your dashboard. The analytics page shows charts and 
            graphs displaying your study time trends, quiz score improvements, flashcard retention rates, and more. These visualizations 
            help you see at a glance how your learning is progressing and where you might need to adjust your study strategy.
          </p>

          <h2>Performance Metrics</h2>
          <p>
            Beyond simple time tracking, LastWeek measures your actual learning performance. Quiz scores show how well you understand 
            the material, flashcard accuracy indicates your retention rate, and the system calculates a retention curve showing how 
            well you're remembering information over time. These metrics give you concrete evidence of your learning progress.
          </p>
          <p>
            The system also identifies your weak areas—topics where your quiz scores are lower or flashcard accuracy is struggling. 
            These insights help you focus your study efforts where they're needed most. Rather than studying everything equally, you 
            can prioritize the topics that challenge you most.
          </p>

          <h2>Session Tracking</h2>
          <p>
            Each study session is logged with details about what you studied, how long you studied, which study mode you used, and 
            your performance metrics for that session. This detailed logging allows you to see patterns in your studying—perhaps you 
            study more effectively at certain times of day, or certain study modes work better for you than others.
          </p>
          <p>
            You can review your session history to see what you've covered and identify gaps in your preparation. This is particularly 
            useful when preparing for exams, as you can ensure you've covered all necessary topics and spent appropriate time on each 
            area.
          </p>

          <h2>Personalized Recommendations</h2>
          <p>
            Based on your performance data, LastWeek provides personalized recommendations for improving your learning. These might 
            include suggestions to focus on specific topics, recommendations to use different study modes, or alerts when your study 
            consistency drops. These recommendations are designed to help you optimize your learning strategy and achieve better results.
          </p>
          <p>
            The system also provides predictions about your exam performance based on your current progress and study patterns. While 
            these predictions aren't guaranteed, they give you a realistic sense of how prepared you are and help you identify areas 
            where you need more work before exam day.
          </p>
        </div>
      )
    },
    'faq': {
      title: 'Frequently Asked Questions',
      icon: '❓',
      content: (
        <div className="doc-content">
          <h1>Frequently Asked Questions</h1>

          <h2>Can I use LastWeek offline?</h2>
          <p>
            LastWeek requires an internet connection for most features, including uploading resources, using AI features, and syncing 
            your data. However, once you've downloaded study materials, you can view cached content offline. We're working on enhanced 
            offline support for future releases.
          </p>

          <h2>What's the maximum file size for uploads?</h2>
          <p>
            PDFs can be up to 100MB, audio files up to 25MB, and images up to 50MB. These limits ensure fast processing and reliable 
            performance. If you have larger files, consider splitting them into multiple uploads.
          </p>

          <h2>How long does audio transcription take?</h2>
          <p>
            Transcription typically takes 1-5 minutes depending on the audio length and current system load. You'll receive a 
            notification when transcription is complete, and your lecture notes will be ready to study.
          </p>

          <h2>Can I share resources with specific people?</h2>
          <p>
            Currently, resources are either public (shared with everyone) or private (only you can see them). We're planning to add 
            the ability to share with specific users in a future update.
          </p>

          <h2>How do I delete my account?</h2>
          <p>
            You can delete your account from your account settings. Go to Settings → Account → Delete Account. Please note that this 
            action is permanent and cannot be undone. All your data will be deleted.
          </p>

          <h2>Is my data backed up?</h2>
          <p>
            Yes, Appwrite handles automatic backups of your data. Your study materials, notes, and progress are securely backed up 
            and protected.
          </p>

          <h2>Can I export my data?</h2>
          <p>
            Yes, you can request a data export from your account settings. We'll compile all your study materials, notes, and progress 
            data into a downloadable file. Contact support@lastweek.com for assistance.
          </p>

          <h2>What browsers are supported?</h2>
          <p>
            LastWeek works best on Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+. We recommend keeping your browser updated for 
            the best experience.
          </p>
        </div>
      )
    }
  };

  const navItems = [
    { label: 'Getting Started', key: 'getting-started', icon: '🚀' },
    { label: 'Study Modes', key: 'study-modes', icon: '🧠' },
    { label: 'Features', key: 'features', icon: '✨' },
    { label: 'Resources', key: 'resources', icon: '📚' },
    { label: 'Sharing', key: 'sharing', icon: '🤝' },
    { label: 'Progress', key: 'progress', icon: '📊' },
    { label: 'FAQ', key: 'faq', icon: '❓' }
  ];

  const currentSection = sections[activeSection];

  return (
    <div className="documentation-page">
      {/* Navigation Bar */}
      <nav className="doc-navbar">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate('/')}>
            <span className="logo-emoji">📚</span>
            <img src="/logos/lastweek_main_logo.png" alt="LastWeek" style={{ height: "36px", objectFit: "contain" }} />
          </div>
          
          <div className="nav-menu">
            <div className="nav-item dropdown">
              <button className="nav-link" onClick={() => setNavDropdown(navDropdown === 'docs' ? null : 'docs')}>
                Documentation ▼
              </button>
              {navDropdown === 'docs' && (
                <div className="dropdown-menu">
                  {navItems.map(item => (
                    <a
                      key={item.key}
                      href={`#${item.key}`}
                      className="dropdown-item"
                      onClick={() => {
                        setActiveSection(item.key);
                        setNavDropdown(null);
                      }}
                    >
                      {item.icon} {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <button className="nav-link" onClick={() => navigate('/')}>Home</button>
            <button className="nav-link" onClick={() => navigate('/auth')}>Login</button>
          </div>

          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
        </div>
      </nav>

      <div className="doc-container">
        {/* Sidebar */}
        <aside className={`doc-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>Documentation</h3>
            <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <div className="sidebar-search">
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <nav className="sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.key}
                className={`sidebar-link ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(item.key);
                  setSidebarOpen(false);
                }}
              >
                <span className="link-icon">{item.icon}</span>
                <span className="link-text">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="doc-main">
          <div className="breadcrumb">
            <a href="#" onClick={() => navigate('/')}>Home</a>
            <span>/</span>
            <span>Documentation</span>
            <span>/</span>
            <span>{currentSection.title}</span>
          </div>

          <div className="doc-header">
            <div className="header-icon">{currentSection.icon}</div>
            <h1>{currentSection.title}</h1>
          </div>

          {currentSection.content}

          <div className="doc-footer">
            <div className="footer-nav">
              {activeSection !== 'getting-started' && (
                <button
                  className="nav-button prev"
                  onClick={() => {
                    const currentIndex = navItems.findIndex(item => item.key === activeSection);
                    if (currentIndex > 0) {
                      setActiveSection(navItems[currentIndex - 1].key);
                    }
                  }}
                >
                  ← Previous
                </button>
              )}
              {activeSection !== 'faq' && (
                <button
                  className="nav-button next"
                  onClick={() => {
                    const currentIndex = navItems.findIndex(item => item.key === activeSection);
                    if (currentIndex < navItems.length - 1) {
                      setActiveSection(navItems[currentIndex + 1].key);
                    }
                  }}
                >
                  Next →
                </button>
              )}
            </div>
            <p className="footer-text">
              Need help? Email us at <a href="mailto:support@lastweek.com">support@lastweek.com</a>
            </p>
          </div>
        </main>
      </div>

      {/* Back to Top Button */}
      <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        ↑
      </button>
    </div>
  );
};

export default Documentation;
