# LastWeek - Your Ultimate Study Companion

> Transform the way you study. Master any subject with intelligent, adaptive learning modes.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.0+-blue.svg)](https://react.dev/)

## 🎯 What is LastWeek?

LastWeek is a comprehensive study platform designed to help students prepare for exams through multiple intelligent learning modes, advanced resource management, and AI-powered study assistance. Whether you're preparing for a final exam or mastering a new subject, LastWeek adapts to your learning style.

## ✨ Key Features

### 📚 Multiple Study Modes
- **Mental Model**: Build deep conceptual understanding
- **Active Recall**: Test memory and strengthen retrieval
- **Spaced Repetition**: Optimize long-term retention
- **Exam Prep**: Focused exam preparation with scheduling
- **Focus Breakdown**: Deep dive into specific topics

### 📄 Resource Management
- **PDF Support**: Upload, extract, highlight, and annotate
- **Audio Lectures**: Record, transcribe, and process lectures
- **Shared Library**: Discover and import resources from other students
- **Session Organization**: Keep resources organized by topic

### 🎙️ Audio Processing
- **Live Recording**: Record lectures directly in browser
- **Automatic Transcription**: Convert audio to text
- **Smart Notes**: AI-generated structured notes
- **Playback Controls**: Speed control, seeking, bookmarks

### 🧠 AI-Powered Features
- **Contextual Chat**: Ask questions about your study material
- **Quiz Generation**: Auto-generated quizzes from content
- **Flashcard Creation**: Spaced repetition cards
- **Content Analysis**: Automatic concept extraction

### 📊 Study Tools
- **Pomodoro Timer**: Time management
- **Flashcards**: Spaced repetition system
- **Quizzes**: Self-assessment
- **Highlighting & Notes**: Annotation tools
- **Progress Tracking**: Analytics and insights

### 🤝 Collaboration
- **Share Resources**: Help other students
- **Import Resources**: Learn from shared materials
- **Privacy Control**: Your notes stay private
- **Community Learning**: Build together

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Appwrite account
- Cloudflare R2 account

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/lastweek.git
cd lastweek

# Install dependencies
npm install

# Create .env file (see docs/SETUP.md for details)
cp .env.example .env

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## 📖 Documentation

- **[docs/SETUP.md](./docs/SETUP.md)** - Installation and configuration guide
- **[docs/TUTORIAL.md](./docs/TUTORIAL.md)** - Complete user tutorial
- **[docs/FEATURES.md](./docs/FEATURES.md)** - Detailed feature documentation
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical architecture
- **[docs/API.md](./docs/API.md)** - API reference
- **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Appwrite Backend (Database + Auth)
    ↓
Cloudflare R2 (File Storage)
    ↓
External APIs (Transcription, Processing)
```

### Tech Stack
- **Frontend**: React 18, Vite, CSS3
- **Backend**: Appwrite
- **Storage**: Cloudflare R2
- **APIs**: Gemini, DeepSeek
- **Deployment**: Vercel

## 📁 Project Structure

```
lastweek/
├── src/
│   ├── appwrite/          # Backend integration
│   ├── components/        # React components
│   ├── context/           # State management
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Page components
│   ├── styles/            # CSS files
│   └── utils/             # Utility functions
├── docs/                  # Documentation
├── public/                # Static assets
└── package.json           # Dependencies
```

## 🎓 Study Modes Explained

### Mental Model Mode
Build deep understanding of concepts through structured breakdowns and visual diagrams.

### Active Recall Mode
Test your memory with auto-generated quizzes and flashcards.

### Spaced Repetition Mode
Optimize retention through intelligent scheduling of reviews.

### Exam Prep Mode
Focused preparation with AI-generated study schedules and mock exams.

### Focus Breakdown Mode
Deep dive into specific topics with comprehensive analysis.

## 🔐 Security

- Secure authentication via Appwrite
- Session-based access control
- Private resource scoping
- Encrypted file storage
- Environment variable protection

## 📊 Performance

- Code splitting for faster loads
- Lazy loading of components
- Optimized PDF processing
- Efficient database queries
- Browser caching

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Read the docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/lastweek/issues)
- **Email**: support@lastweek.com

## 🙏 Acknowledgments

- Built with React and Vite
- Powered by Appwrite
- Storage by Cloudflare R2
- Special thanks to all contributors

## 📈 Roadmap

- [ ] Mobile app (React Native)
- [ ] Offline support
- [ ] Collaborative study sessions
- [ ] Video lecture support
- [ ] Advanced analytics
- [ ] LMS integration
- [ ] Real-time collaboration

## 💡 Tips for Success

1. **Organize by Session**: Create separate sessions for different subjects
2. **Use All Modes**: Combine modes for better learning
3. **Regular Review**: Study consistently using spaced repetition
4. **Share Resources**: Help others by sharing useful materials
5. **Track Progress**: Monitor your improvement regularly

## 🎯 Getting Started

1. **[Setup](./docs/SETUP.md)** - Install and configure
2. **[Tutorial](./docs/TUTORIAL.md)** - Learn how to use
3. **[Features](./docs/FEATURES.md)** - Explore all features
4. **[Architecture](./docs/ARCHITECTURE.md)** - Understand the system

---

**Ready to transform your studying?** Start with the [Setup Guide](./docs/SETUP.md) today!

Made with ❤️ for students everywhere.
