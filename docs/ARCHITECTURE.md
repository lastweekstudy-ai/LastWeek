# LastWeek Architecture

## System Overview

LastWeek is a comprehensive study platform designed to help students prepare for exams through multiple learning modes, resource management, and AI-powered study assistance.

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: CSS3 with CSS Variables for theming
- **State Management**: React Context API
- **PDF Handling**: react-pdf with custom worker configuration
- **Markdown Rendering**: react-markdown with plugins (GFM, Math, KaTeX)
- **Diagrams**: Mermaid.js for flowcharts and diagrams
- **Audio**: Native HTML5 Audio API

### Backend
- **Database**: Appwrite (self-hosted or cloud)
- **Storage**: Cloudflare R2 for audio and file storage
- **Authentication**: Appwrite Auth
- **API**: RESTful via Appwrite SDK

### External Services
- **Audio Transcription**: Gemini API
- **Content Processing**: DeepSeek API
- **Deployment**: Vercel

## Project Structure

```
lastweek/
├── src/
│   ├── appwrite/              # Backend integration layer
│   │   ├── auth.js            # Authentication
│   │   ├── config.js          # Appwrite configuration
│   │   ├── database.js        # Database operations
│   │   ├── storage.js         # File storage
│   │   ├── r2Storage.js       # Cloudflare R2 integration
│   │   ├── pdfResources.js    # PDF resource management
│   │   ├── audioLecture.js    # Audio lecture processing
│   │   ├── resourceLibrary.js # Shared resource library
│   │   ├── examPlanner.js     # Exam planning
│   │   ├── studySchedule.js   # Study scheduling
│   │   ├── youtubeStudy.js    # YouTube integration
│   │   ├── pdfHighlights.js   # PDF highlighting
│   │   ├── pdfNotes.js        # PDF notes
│   │   └── sessionContext.js  # Session management
│   │
│   ├── components/            # React components
│   │   ├── ChatInterface.jsx          # Main chat UI
│   │   ├── StudyInterface.jsx         # Study mode interface
│   │   ├── PDFLibrary.jsx             # Resource library panel
│   │   ├── PDFViewer.jsx              # PDF viewer
│   │   ├── AudioLectureViewer.jsx     # Audio player & notes
│   │   ├── AudioProcessor.jsx         # Audio upload/recording
│   │   ├── ResourceSearch.jsx         # Shared resource search
│   │   ├── Flashcard.jsx              # Flashcard component
│   │   ├── InlineFlashcard.jsx        # Inline flashcard
│   │   ├── InlineQuiz.jsx             # Inline quiz
│   │   ├── PomodoroTimer.jsx          # Pomodoro timer
│   │   ├── EnhancedMessageFormatter.jsx # Message rendering
│   │   ├── MermaidDiagram.jsx         # Diagram rendering
│   │   ├── SVGFigure.jsx              # SVG figure rendering
│   │   ├── ChartRenderer.jsx          # Chart rendering
│   │   ├── VisualGenerator.jsx        # Visual content generation
│   │   ├── ErrorBoundary.jsx          # Error handling
│   │   └── ... (40+ more components)
│   │
│   ├── context/               # React Context
│   │   ├── AuthContext.jsx    # Authentication state
│   │   ├── SessionContext.jsx # Session state
│   │   └── ThemeContext.jsx   # Theme state
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useDeepSeek.js     # DeepSeek API integration
│   │   ├── useDualAI.js       # Dual AI support
│   │   ├── useGemini.js       # Gemini API integration
│   │   ├── useSession.js      # Session management
│   │   ├── useKeyboardShortcuts.js
│   │   └── usePerformanceTracking.js
│   │
│   ├── pages/                 # Page components
│   │   ├── Landing.jsx        # Landing page
│   │   ├── Auth.jsx           # Authentication pages
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   ├── StudySession.jsx   # Study session page
│   │   ├── ExamSession.jsx    # Exam prep session
│   │   └── Profile.jsx        # User profile
│   │
│   ├── styles/                # CSS files
│   │   ├── index.css          # Global styles
│   │   ├── App.css            # App styles
│   │   └── ... (component-specific CSS)
│   │
│   ├── utils/                 # Utility functions
│   │   ├── contextManager.js  # Context building
│   │   ├── pdfProcessor.js    # PDF processing
│   │   └── ... (other utilities)
│   │
│   ├── App.jsx                # Root component
│   └── main.jsx               # Entry point
│
├── public/                    # Static assets
│   ├── pdf.worker.min.js      # PDF.js worker
│   ├── icons.svg              # Icon sprite
│   └── logos/                 # Brand logos
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # This file
│   ├── FEATURES.md            # Feature documentation
│   ├── SETUP.md               # Setup guide
│   ├── TUTORIAL.md            # User tutorial
│   ├── API.md                 # API documentation
│   └── TROUBLESHOOTING.md     # Troubleshooting guide
│
├── appwrite-functions/        # Appwrite cloud functions
│   └── processYoutube/        # YouTube processing function
│
├── index.html                 # HTML entry point
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies
└── README.md                  # Quick start guide
```

## Data Flow

### Authentication Flow
```
User Login → Appwrite Auth → Session Token → Context State → Protected Routes
```

### Study Session Flow
```
User Creates Session → Session Context → Chat Interface → AI Processing → Response → Display
```

### Resource Management Flow
```
Upload File → Storage (R2/Appwrite) → Extract Content → Save Metadata → Display in Library
```

### Audio Processing Flow
```
Upload Audio → R2 Storage → Gemini Transcription → DeepSeek Processing → Save Lecture → Display
```

### Shared Resource Flow
```
Make Public → Indexed in Library → Search → Import → Scoped to User Session → Private Copy
```

## Database Schema

### Collections

#### users
- `$id`: User ID
- `email`: Email address
- `name`: Full name
- `avatar`: Avatar URL
- `createdAt`: Account creation date
- `preferences`: User preferences (JSON)

#### sessions
- `$id`: Session ID
- `userId`: Owner user ID
- `title`: Session title
- `mode`: Study mode (mental_model, active_recall, etc.)
- `subject`: Subject/topic
- `status`: active/completed/archived
- `createdAt`: Session creation date
- `updatedAt`: Last update date

#### pdf_resources
- `$id`: Resource ID
- `userId`: Owner user ID
- `sessionId`: Associated session
- `fileName`: File name
- `fileSize`: File size in bytes
- `storageFileId`: Storage reference
- `pageCount`: Number of pages
- `extractedText`: Full text content
- `notes`: User notes
- `currentPage`: Current reading position
- `bookmarks`: Bookmarked pages (JSON)
- `highlights`: Highlighted text (JSON)
- `tags`: Resource tags
- `aiTitle`: AI-generated title
- `isPublic`: Sharing status
- `lastAccessedAt`: Last access time
- `createdAt`: Creation date

#### audio_lectures
- `$id`: Lecture ID
- `userId`: Owner user ID
- `sessionId`: Associated session
- `title`: Lecture title
- `audioFileId`: R2 file reference
- `audioUrl`: Public audio URL
- `transcript`: Full transcript
- `lectureNotes`: Structured notes
- `duration`: Audio duration
- `isPublic`: Sharing status
- `createdAt`: Creation date
- `updatedAt`: Last update date

#### exam_plans
- `$id`: Plan ID
- `userId`: Owner user ID
- `examName`: Exam name
- `examDate`: Exam date
- `topics`: Topics to study (JSON array)
- `schedule`: Study schedule (JSON)
- `progress`: Progress tracking (JSON)
- `createdAt`: Creation date

#### study_sessions_log
- `$id`: Log ID
- `userId`: User ID
- `sessionId`: Session ID
- `resourceId`: Resource studied
- `minutesStudied`: Study duration
- `mode`: Study mode used
- `createdAt`: Log date

## Key Features Architecture

### 1. Multi-Mode Study System
- **Mental Model**: Build conceptual understanding
- **Active Recall**: Test memory and retrieval
- **Spaced Repetition**: Optimize retention
- **Exam Prep**: Focused exam preparation
- **Focus Breakdown**: Deep dive into topics

### 2. Resource Management
- **PDF Support**: Upload, extract, annotate
- **Audio Lectures**: Record, transcribe, process
- **Images & HTML**: Support for visual content
- **Shared Library**: Community resource sharing
- **Session Scoping**: Resources organized by session

### 3. AI-Powered Features
- **Content Processing**: Automatic note generation
- **Transcription**: Audio to text conversion
- **Quiz Generation**: Automatic quiz creation
- **Flashcard Generation**: Spaced repetition cards
- **Contextual Chat**: Session-aware AI assistance

### 4. Study Tools
- **Pomodoro Timer**: Time management
- **Highlighting & Notes**: Annotation tools
- **Flashcards**: Spaced repetition
- **Quizzes**: Self-assessment
- **Progress Tracking**: Study analytics

## Security Considerations

1. **Authentication**: Appwrite handles user authentication
2. **Authorization**: Session-based access control
3. **Data Privacy**: Resources scoped to users/sessions
4. **File Storage**: Secure R2 storage with signed URLs
5. **API Keys**: Environment variables for sensitive data

## Performance Optimizations

1. **Code Splitting**: Dynamic imports for large components
2. **Lazy Loading**: Components load on demand
3. **Caching**: Browser caching for static assets
4. **Worker Threads**: PDF.js worker for processing
5. **Debouncing**: Search and input debouncing
6. **Pagination**: Large lists paginated

## Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Appwrite (self-hosted or cloud)
- **Storage**: Cloudflare R2
- **CI/CD**: Git-based deployment

## Future Enhancements

1. Offline support with service workers
2. Collaborative study sessions
3. Mobile app (React Native)
4. Advanced analytics dashboard
5. Integration with learning management systems
6. Video lecture support
7. Real-time collaboration features
