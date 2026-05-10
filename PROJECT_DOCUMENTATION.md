# LastWeek - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Setup Instructions](#setup-instructions)
5. [Key Components](#key-components)
6. [Bug Fixes & Improvements](#bug-fixes--improvements)
7. [Known Issues](#known-issues)
8. [Future Enhancements](#future-enhancements)

---

## Project Overview

**LastWeek** is an AI-powered study application that helps students learn more effectively through multiple study modes, PDF analysis, and intelligent conversation.

### Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Appwrite (BaaS)
- **AI**: Dual-AI system (Gemini + DeepSeek)
- **PDF Processing**: PDF.js
- **Styling**: Custom CSS with CSS variables for theming

---

## Features

### 1. Study Modes
Five specialized learning approaches:

#### Mental Model Mode
- Builds conceptual frameworks
- Uses analogies and real-world examples
- Creates visual mental maps

#### Active Recall Mode
- Question-based learning
- Spaced repetition
- Self-testing focus

#### Focus Breakdown Mode
- Breaks complex topics into digestible chunks
- Step-by-step explanations
- Progressive learning

#### Collaborative Scholar Mode
- Socratic dialogue
- Critical thinking questions
- Discussion-based learning

#### Creative Synthesis Mode
- Connects ideas across domains
- Creative problem-solving
- Interdisciplinary thinking

### 2. PDF Study Features
- **Full-text extraction** with page and line markers
- **Split-screen interface** (PDF + Chat)
- **Accurate page/line queries** ("what is on page 2 line 5")
- **PDF context locking** (only answers about open PDF)
- **Highlights and notes** on PDF pages
- **Bookmarks** for quick navigation
- **Live extraction fallback** for old PDFs

### 3. AI Features
- **Dual-AI system**: Gemini analyzes visuals, DeepSeek provides insights
- **Context-aware responses** with full PDF content
- **Visual data extraction** from charts and tables
- **Automatic fallback** if one AI fails

### 4. User Interface
- **Dark/Light theme** toggle
- **Responsive design** (desktop + mobile)
- **Keyboard shortcuts** (Ctrl+K, Ctrl+D, Ctrl+N, etc.)
- **Profile dropdown** with settings
- **Settings page** with account management
- **Clean, modern design**

### 5. Session Management
- **Persistent sessions** across page reloads
- **Session history** with search
- **Mode switching** within sessions
- **Export/import** sessions

---

## Architecture

### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── ChatInterface.jsx
│   ├── StudyInterface.jsx
│   ├── PDFLibrary.jsx
│   ├── ProfileDropdown.jsx
│   └── ...
├── pages/              # Route pages
│   ├── modes/          # Study mode pages
│   ├── Dashboard.jsx
│   ├── Settings.jsx
│   └── ...
├── context/            # React Context providers
│   ├── AuthContext.jsx
│   ├── SessionContext.jsx
│   └── ThemeContext.jsx
├── hooks/              # Custom React hooks
│   ├── useSession.js
│   ├── useGemini.js
│   ├── useDeepSeek.js
│   ├── useDualAI.js
│   └── useKeyboardShortcuts.js
├── appwrite/           # Appwrite API functions
│   ├── config.js
│   ├── auth.js
│   ├── database.js
│   ├── storage.js
│   └── pdfResources.js
├── utils/              # Utility functions
│   ├── pdfProcessor.js
│   ├── prompts.js
│   └── exportImport.js
└── styles/             # CSS files
```

### Data Flow
```
User Input → ChatInterface → StudyInterface (if PDF open)
                ↓
         handleSendMessage
                ↓
         sendMessageWithAI (useSession)
                ↓
    ┌───────────┴───────────┐
    ↓                       ↓
Gemini Analysis      DeepSeek Response
    └───────────┬───────────┘
                ↓
         Save to Database
                ↓
         Update UI
```

### PDF Processing Flow
```
PDF Upload → extractTextFromPDF
                ↓
    Line-by-line extraction with page markers
                ↓
    Store in pdf_resources.extractedText
                ↓
    Available for accurate queries
```

---

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- Appwrite instance (cloud or self-hosted)
- Gemini API key
- DeepSeek API key

### 2. Installation
```bash
# Clone repository
git clone <repository-url>
cd lastweek

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### 3. Appwrite Setup
See `APPWRITE_COMPLETE_SETUP.md` for detailed instructions.

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
npm run preview  # Test production build
```

---

## Key Components

### ChatInterface
- Handles user input and message display
- Detects PDF queries and shows warnings
- Supports file attachments
- Quick actions for common queries

### StudyInterface
- Split-screen PDF viewer + chat
- PDF text extraction and context building
- Highlights, notes, and bookmarks
- Page navigation and zoom controls

### SessionContext
- Manages active session state
- Handles message sending and AI responses
- Session loading and switching
- Prevents duplicate loads

### useSession Hook
- Dual-AI processing logic
- Context building for AI
- Gemini/DeepSeek fallback handling
- Message formatting

### pdfProcessor
- Extracts text from PDFs page-by-page
- Adds line numbers and page markers
- Format: `=== PAGE X === Line 1: [text]`
- Handles large PDFs efficiently

---

## Bug Fixes & Improvements

### Session Loading (Fixed)
**Problem**: Infinite loop causing repeated session loads
**Solution**: Simplified useEffect dependencies to only trigger on sessionId change

### PDF Text Storage (Fixed)
**Problem**: Storing AI summary instead of raw extracted text
**Solution**: Store raw extracted text with page markers, use AI analysis separately

### Keyboard Shortcuts (Fixed)
**Problem**: Shortcuts only working on specific pages
**Solution**: Moved global shortcuts to Navbar component

### Settings Page (Added)
- Account management
- Password change
- Keyboard shortcuts reference
- Danger zone (account deletion)

### Profile Dropdown (Added)
- User avatar and info
- Quick navigation
- Logout moved from navbar

### PDF Context Locking (Implemented)
- Only answers about currently open PDF
- Ignores mentions of other PDFs
- Shows warning if PDF not open

### Debug Logging (Added)
- Comprehensive logging throughout app
- Helps track message flow
- Identifies where issues occur

---

## Known Issues

### 1. Gemini API Rate Limiting
**Issue**: Gemini returns 503 errors during high demand
**Workaround**: Automatic fallback to DeepSeek only
**Status**: Working as designed

### 2. Large PDF Performance
**Issue**: Very large PDFs (100+ pages) may be slow to extract
**Workaround**: Extraction happens once during upload
**Status**: Acceptable performance

### 3. Message Not Appearing After Send
**Issue**: Message sent successfully but AI response doesn't appear
**Cause**: Under investigation - likely DeepSeek API issue
**Workaround**: Check console logs, refresh page
**Status**: Debugging in progress

---

## Future Enhancements

### High Priority
1. **Fix message display issue** - Ensure AI responses always appear
2. **Add loading indicators** - Show when AI is processing
3. **Implement retry logic** - Auto-retry failed AI requests
4. **Add error boundaries** - Better error handling throughout app

### Medium Priority
1. **Flashcard system** - Spaced repetition learning
2. **Study statistics** - Track progress and streaks
3. **Export features** - Export sessions as PDF/Markdown
4. **Collaborative features** - Share sessions with others
5. **Mobile app** - React Native version

### Low Priority
1. **Voice input** - Speak questions instead of typing
2. **OCR support** - Extract text from scanned PDFs
3. **Video support** - Study from video transcripts
4. **Gamification** - Points, badges, leaderboards

---

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Add PropTypes or TypeScript
- Write meaningful comments
- Use descriptive variable names

### Git Workflow
- Create feature branches
- Write clear commit messages
- Test before committing
- Review code before merging

### Testing
- Test all features after changes
- Check console for errors
- Verify database operations
- Test on different browsers

### Performance
- Minimize re-renders
- Use React.memo for expensive components
- Lazy load routes and components
- Optimize images and assets

---

## Troubleshooting

### App won't start
1. Check Node.js version (18+)
2. Delete node_modules and reinstall
3. Check .env file configuration
4. Verify Appwrite is accessible

### Authentication fails
1. Check Appwrite project ID
2. Verify auth is enabled in Appwrite
3. Check CORS settings
4. Clear browser cache

### PDF upload fails
1. Check file size limit in Appwrite
2. Verify storage bucket permissions
3. Check allowed file extensions
4. Look for console errors

### Messages not saving
1. Verify collection IDs in .env
2. Check collection permissions
3. Ensure content attribute size is 1000000
4. Check network tab for API errors

---

## API Keys

### Gemini API
- Get key from: https://makersuite.google.com/app/apikey
- Free tier: 60 requests/minute
- Used for: Visual analysis, content extraction

### DeepSeek API
- Get key from: https://platform.deepseek.com
- Used for: Educational responses, teaching

---

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## License

[Your License Here]

---

## Support

For issues and questions:
- Check this documentation
- Review console logs
- Check Appwrite documentation
- Create an issue on GitHub

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- 5 study modes
- PDF processing with page/line accuracy
- Dual-AI system
- Settings page
- Keyboard shortcuts
- Profile management

---

## Credits

- **React**: UI framework
- **Appwrite**: Backend as a Service
- **Gemini**: Visual analysis AI
- **DeepSeek**: Educational AI
- **PDF.js**: PDF rendering and extraction
- **Vite**: Build tool

---

Last Updated: May 8, 2026
