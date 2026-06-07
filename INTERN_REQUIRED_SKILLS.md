# Intern Required Skills - LastWeek Project

## Overview
This document outlines the technical skills and knowledge required for an intern to effectively work on the LastWeek AI-powered study platform project.

---

## 🎯 Core Technologies & Skills

### 1. **JavaScript / ECMAScript 2025+**
**Required Level:** Intermediate to Advanced

**Key Concepts to Know:**
- Modern ES6+ syntax (arrow functions, destructuring, spread/rest operators)
- Async/await and Promises
- Array methods (map, filter, reduce, forEach)
- Template literals
- Optional chaining (`?.`) and nullish coalescing (`??`)
- Modules (import/export)
- Error handling (try/catch)

**Why it matters:** The entire frontend is built with modern JavaScript. You'll need to read and write ES2025-compliant code daily.

---

### 2. **React 19.x**
**Required Level:** Intermediate

**Key Concepts to Know:**
- **Functional Components** (no class components used)
- **React Hooks:**
  - `useState` - state management
  - `useEffect` - side effects and lifecycle
  - `useRef` - DOM references and mutable values
  - `useCallback` - memoized callbacks
  - `useContext` - context API for global state
  - Custom hooks (we have many!)
- **React Router v7** - routing and navigation
- **Component composition** and props
- **Conditional rendering**
- **Lists and keys**
- **Event handling**

**Why it matters:** React is the foundation of our UI. Every page and component uses React patterns.

---

### 3. **Appwrite (BaaS)**
**Required Level:** Beginner to Intermediate

**Key Concepts to Know:**
- **Authentication:** User signup, login, sessions, anonymous sessions
- **Databases:** Creating, reading, updating documents
- **Storage:** File uploads, retrieval, signed URLs
- **Functions:** Serverless cloud functions (Node.js)
- **Realtime:** Subscribing to database changes
- **Webhooks:** Event-driven triggers

**Why it matters:** Appwrite is our entire backend. All data, auth, storage, and serverless logic runs on Appwrite.

**Resources:**
- Appwrite v25 docs: https://appwrite.io/docs
- Our Appwrite setup is in `src/appwrite/` folder

---

### 4. **CSS3 & Modern Styling**
**Required Level:** Intermediate

**Key Concepts to Know:**
- **CSS Custom Properties** (CSS variables) - used extensively
- **Flexbox** and **CSS Grid**
- **Media queries** for responsive design
- **CSS animations** and transitions
- **Pseudo-classes** (`:hover`, `:focus`, `:active`)
- **CSS architecture** (we use component-scoped CSS files)

**Why it matters:** The UI has custom styling with theme support (light/dark + 5 color themes). You'll modify CSS frequently.

---

### 5. **Git & GitHub**
**Required Level:** Intermediate

**Key Concepts to Know:**
- Branching and merging
- Commit messages (conventional commits preferred)
- Pull requests and code reviews
- Resolving merge conflicts
- `.gitignore` usage

**Why it matters:** Version control is essential for collaboration.

---

### 6. **Node.js & npm**
**Required Level:** Beginner

**Key Concepts to Know:**
- Installing dependencies (`npm install`)
- Running scripts (`npm run dev`, `npm run build`)
- Understanding `package.json`
- Basic module system (CommonJS vs ESM)

**Why it matters:** Development environment setup and dependency management.

---

### 7. **Vite Build Tool**
**Required Level:** Beginner

**Key Concepts to Know:**
- Development server (`npm run dev`)
- Hot Module Replacement (HMR)
- Build command (`npm run build`)
- Environment variables (`.env` files)

**Why it matters:** Vite is our build tool and dev server.

---

## 🧠 AI & Machine Learning Integration

### 8. **Working with AI APIs**
**Required Level:** Beginner to Intermediate

**Key Concepts to Know:**
- REST API calls with `fetch()`
- Handling streaming responses (Server-Sent Events)
- JSON structure and parsing
- Rate limiting and error handling
- Prompt engineering basics

**Why it matters:** Our app heavily integrates multiple AI providers. You'll work with AI responses, streaming, and error handling.

**AI Providers Used:**
- Groq (Llama models)
- Google Gemini (vision and text)
- DeepSeek (reasoning)
- Whisper (audio transcription)

See `AI_MODELS_REFERENCE.md` for detailed info.

---

## 📚 Additional Skills (Nice to Have)

### 9. **Markdown**
- Understanding Markdown syntax
- Rendering Markdown in React (`react-markdown`)
- Math notation with KaTeX
- Code syntax highlighting

**Why it matters:** AI responses are rendered as Markdown with math support.

---

### 10. **SVG & Canvas**
- Basic SVG structure and manipulation
- Canvas API for rendering PDFs
- Image encoding (Base64)

**Why it matters:** PDF rendering, visual generation, and image processing.

---

### 11. **Testing**
- Vitest (our testing framework)
- React Testing Library
- Unit tests and integration tests

**Why it matters:** Code quality and preventing regressions.

---

### 12. **Accessibility (a11y)**
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Screen reader compatibility

**Why it matters:** Inclusive design for all users.

---

## 🛠️ Development Environment Setup

### Required Software:
1. **Node.js 20+** - JavaScript runtime
2. **npm 10+** - Package manager
3. **Git** - Version control
4. **VS Code** (recommended) - Code editor
5. **Modern browser** (Chrome/Edge/Firefox) with DevTools

### Recommended VS Code Extensions:
- ESLint
- Prettier
- React Developer Tools
- Tailwind CSS IntelliSense (if we add it)
- GitLens

---

## 📖 Project-Specific Knowledge

### Understanding Our Architecture:
1. **Frontend:** React SPA (Single Page Application)
2. **Backend:** Appwrite Cloud
3. **AI Layer:** Secure proxy function routes all AI calls
4. **Storage:** Appwrite Storage for PDFs, audio files
5. **Payment:** Paddle for subscriptions

### Key Folders to Know:
```
src/
├── components/      # Reusable UI components
├── pages/           # Route pages (Dashboard, Study, etc.)
├── hooks/           # Custom React hooks
├── context/         # React Context providers (Auth, Theme)
├── services/        # AI providers, external services
├── appwrite/        # Appwrite SDK wrappers
├── utils/           # Helper functions
└── styles/          # CSS files
```

---

## 🎓 Learning Resources

### React:
- Official docs: https://react.dev
- React tutorial: https://react.dev/learn

### Appwrite:
- Official docs: https://appwrite.io/docs
- Tutorials: https://appwrite.io/docs/tutorials

### Modern JavaScript:
- MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- JavaScript.info: https://javascript.info

### CSS:
- MDN CSS: https://developer.mozilla.org/en-US/docs/Web/CSS
- CSS Tricks: https://css-tricks.com

---

## 📝 Evaluation Checklist

Before starting, you should be able to:

- [ ] Write a React functional component with hooks
- [ ] Handle async data fetching with `useEffect`
- [ ] Manage form state with `useState`
- [ ] Navigate between routes with React Router
- [ ] Make API calls with `fetch()` and handle errors
- [ ] Read and modify CSS with variables
- [ ] Commit changes with Git
- [ ] Debug JavaScript in browser DevTools
- [ ] Understand JSON structure
- [ ] Read and understand existing code

---

## 🚀 Getting Started

1. **Clone the repository**
2. **Install dependencies:** `npm install`
3. **Set up environment variables** (`.env` file)
4. **Run dev server:** `npm run dev`
5. **Read the codebase** - start with `src/App.jsx`
6. **Pick a small task** - ask your mentor for a good first issue

---

## 💡 Tips for Success

1. **Read before you code** - understand existing patterns first
2. **Ask questions** - no question is too small
3. **Use console.log()** - debug by logging values
4. **Check the browser console** - errors show up there
5. **Test your changes** - click around, try edge cases
6. **Write clean code** - follow the existing style
7. **Document as you go** - add comments for complex logic

---

## 📞 Getting Help

- **Code questions:** Ask your mentor or team lead
- **Technical docs:** Check `docs/` folder and `.md` files
- **Bugs:** Check existing issues on GitHub
- **Best practices:** Review recent pull requests

---

**Last Updated:** June 2026  
**Maintainer:** Development Team
