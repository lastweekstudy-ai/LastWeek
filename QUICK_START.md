# LastWeek - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
- Node.js 16+ installed
- Appwrite account and project set up
- Gemini API key
- DeepSeek API key
- Cloudflare R2 bucket (for audio storage)

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lastweek

# Install dependencies
npm install

# Create .env file with your credentials
cp .env.example .env
# Edit .env with your API keys and Appwrite details
```

### 3. Appwrite Setup (Important!)

**Add these attributes to your `audio_lectures` collection:**

1. Open Appwrite Console
2. Go to Databases → Your Database → audio_lectures
3. Click "+" to add attribute:
   - **ID**: `sessionId`
   - **Type**: String
   - **Required**: No
4. Click "+" again:
   - **ID**: `isPublic`
   - **Type**: Boolean
   - **Required**: No
   - **Default**: false

See `AUDIO_SETUP_INSTRUCTIONS.md` for detailed steps.

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
npm run preview
```

## 📚 Key Features

### Study Modes
- 🧠 **Mental Model** - Build conceptual understanding
- 🎯 **Active Recall** - Test your knowledge
- 🔄 **Spaced Repetition** - Optimize retention
- 📝 **Exam Prep** - Prepare for tests
- 🎨 **Focus Breakdown** - Master specific topics

### PDF Features
- 📄 **Smart Upload** - Drag-and-drop up to 100MB
- 🖍️ **Touch Highlighting** - Works on mobile and tablet
- 🎨 **6 Colors** - Yellow, green, blue, pink, orange, purple
- 📱 **Mobile Sidebar** - Bottom sheet with all highlights
- 🔖 **Bookmarks** - Star important pages
- 📝 **Notes** - Add annotations to pages
- 🔍 **Search** - Find text across documents

### Audio Features
- 🎤 **Live Recording** - Record lectures in-browser
- 📝 **Auto Transcription** - Convert speech to text
- 🎧 **Playback Controls** - Speed, seek, bookmarks
- 📊 **Smart Notes** - AI-generated structured notes

### Tools
- ⏱️ **Pomodoro Timer** - Time management
- 📇 **Flashcards** - Spaced repetition
- 📝 **Quizzes** - Self-assessment
- 📊 **Progress Analytics** - Track improvement
- 🤝 **Resource Sharing** - Help other students

## 🎯 First Steps

1. **Create Account**
   - Go to `/auth`
   - Sign up or continue as guest

2. **Create Study Session**
   - Click "New Session"
   - Choose study mode
   - Select subject

3. **Upload Resources**
   - Click "📚 Resources"
   - Upload PDF or record audio
   - App processes automatically

4. **Start Studying**
   - Use your chosen study mode
   - Take notes and highlights
   - Track progress

5. **Share Resources** (Optional)
   - Click "🔒 Share" on resources
   - Other students can import them
   - Click "🌐 Shared" to make private again

## 📖 Documentation

- **Setup**: `docs/SETUP.md`
- **Features**: `docs/FEATURES.md`
- **Tutorial**: `docs/TUTORIAL.md`
- **API**: `docs/API.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`
- **Architecture**: `docs/ARCHITECTURE.md`

## 🔧 Configuration

### Environment Variables

```env
# Appwrite
VITE_APPWRITE_ENDPOINT=https://your-appwrite-domain/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id

# Collections
VITE_APPWRITE_SESSIONS_COLLECTION_ID=sessions
VITE_APPWRITE_MESSAGES_COLLECTION_ID=messages
VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID=pdf_resources
VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID=audio_lectures
VITE_APPWRITE_FLASHCARDS_COLLECTION_ID=flashcards
VITE_APPWRITE_PROFILES_COLLECTION_ID=profiles
VITE_APPWRITE_ATTACHMENTS_COLLECTION_ID=attachments

# APIs
VITE_GEMINI_API_KEY=your-gemini-key
VITE_DEEPSEEK_API_KEY=your-deepseek-key

# Cloudflare R2
VITE_R2_ACCOUNT_ID=your-account-id
VITE_R2_ACCESS_KEY_ID=your-access-key
VITE_R2_SECRET_ACCESS_KEY=your-secret-key
VITE_R2_BUCKET_NAME=your-bucket-name
VITE_R2_PUBLIC_URL=https://your-public-url
```

## 🎨 Customization

### Colors
Edit `src/styles/global.css` to change the color scheme

### Fonts
Update font imports in `src/styles/global.css`

### Animations
Modify animation durations in component CSS files

### Study Modes
Add new modes in `src/pages/modes/`

## 🐛 Troubleshooting

### Audio Upload Fails
- Check Gemini API key is valid
- Check DeepSeek API key is valid
- Verify R2 credentials
- Check audio file size (<25MB)

### Resources Not Appearing
- Verify `sessionId` attribute exists in Appwrite
- Check browser console for errors
- Ensure session is created first

### Build Errors
- Delete `node_modules` and `dist`
- Run `npm install` again
- Check Node.js version (16+)

### Appwrite Connection Issues
- Verify endpoint URL
- Check project ID
- Ensure database exists
- Verify collections are created

See `docs/TROUBLESHOOTING.md` for more solutions.

## 📊 Project Structure

```
lastweek/
├── src/
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   ├── appwrite/        # Database & API modules
│   ├── context/         # React context
│   ├── hooks/           # Custom hooks
│   ├── styles/          # CSS files
│   └── utils/           # Utility functions
├── docs/                # Documentation
├── public/              # Static assets
└── dist/                # Build output
```

## 🚀 Deployment

### Vercel
```bash
npm run build
vercel deploy
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker
```bash
docker build -t lastweek .
docker run -p 3000:3000 lastweek
```

## 📱 Mobile Support

- ✅ Fully responsive
- ✅ Touch-friendly interface
- ✅ Mobile-optimized navigation
- ✅ Works on iOS and Android

## 🔐 Security

- ✅ Appwrite authentication
- ✅ Session-scoped resources
- ✅ Private by default
- ✅ Encrypted API keys
- ✅ HTTPS only

## 📈 Performance

- ✅ Fast build (2s)
- ✅ Optimized bundle size
- ✅ Lazy loading
- ✅ Code splitting
- ✅ Caching strategies

## 🎓 Learning Resources

- **React**: https://react.dev
- **Appwrite**: https://appwrite.io/docs
- **Vite**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com

## 💡 Tips

1. **Use Keyboard Shortcuts**
   - `Ctrl+Shift+T` - Toggle theme

2. **Organize Sessions**
   - Create one session per topic
   - Use descriptive names
   - Archive old sessions

3. **Maximize Learning**
   - Use multiple study modes
   - Take regular breaks (Pomodoro)
   - Review progress regularly

4. **Share Knowledge**
   - Share high-quality resources
   - Help other students
   - Build community

## 🤝 Contributing

Found a bug? Have a feature idea?
1. Check existing issues
2. Create a new issue with details
3. Submit a pull request

## 📞 Support

- 📖 Read the documentation
- 🐛 Check troubleshooting guide
- 💬 Open an issue
- 📧 Contact support

## 📄 License

MIT License - See LICENSE file for details

## 🎉 Ready to Go!

You're all set! Start studying smarter with LastWeek.

**Next Steps:**
1. ✅ Install dependencies
2. ✅ Set up Appwrite
3. ✅ Configure environment variables
4. ✅ Run development server
5. ✅ Create your first session
6. ✅ Upload resources
7. ✅ Start learning!

Happy studying! 🚀
