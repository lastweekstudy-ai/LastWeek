import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import useSession from './hooks/useSession';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import MigrationHelper from './components/MigrationHelper';
import LandingPage from './pages/landing/LandingPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Auth from './pages/Auth';
import Dashboard from './pages/DashboardEnhanced';
import ModeSelector from './pages/ModeSelector';
import Settings from './pages/Settings';
import DocsPage from './pages/docs/DocsPage';
import PDFManager from './components/PDFManager';
import MentalModel from './pages/modes/MentalModel';
import ActiveRecall from './pages/modes/ActiveRecall';
import FocusBreakdown from './pages/modes/FocusBreakdown';
import CollaborativeScholar from './pages/modes/CollaborativeScholar';
import CreativeSynthesis from './pages/modes/CreativeSynthesis';
import ExamPlanner from './pages/ExamPlanner';
import ExamSession from './pages/ExamSession';
import LanguageLearning from './pages/LanguageLearning';
import LanguageLearningLesson from './pages/LanguageLearningLesson';
import LanguageLearningLessons from './pages/LanguageLearningLessons';
import LanguageLearningPractice from './pages/LanguageLearningPractice';
import TTSDemo from './pages/TTSDemo';
import './styles/global.css';
import './styles/ModePage.css';
import './styles/ErrorBoundary.css';
import './styles/MessageFormatter.css';
import './styles/RichTextViewer.css';
import './styles/FilePromptInput.css';
import './styles/mobile-responsive.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-state">
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/auth" replace />;
};

// Session Route Component - determines which mode page to render
const SessionRoute = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { activeSession, loadSession, messages } = useSession();
  const { toggleTheme } = useTheme();
  const [sessionLoaded, setSessionLoaded] = useState(false);
  
  // Global keyboard shortcuts
  useKeyboardShortcuts([
    { key: 't', ctrl: true, shift: true, callback: toggleTheme },
  ]);
  
  React.useEffect(() => {
    if (sessionId && sessionId !== 'new') {
      // Check if this is a different session than what's currently loaded
      if (!activeSession || activeSession.$id !== sessionId) {
        setSessionLoaded(false);
        loadSession(sessionId)
          .then(() => {
            setSessionLoaded(true);
          })
          .catch(error => {
            console.error('Failed to load session:', error);
            navigate('/dashboard');
          });
      } else {
        // Session is already loaded
        setSessionLoaded(true);
      }
    }
    // Only depend on sessionId - don't re-run when activeSession or messages change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
  
  if (!sessionLoaded || !activeSession) {
    return (
      <div className="loading-state">
        <p>Loading session...</p>
      </div>
    );
  }
  
  // Route to appropriate mode component based on session mode
  switch (activeSession.mode) {
    case 'mental_model':
      return <MentalModel />;
    case 'active_recall':
      return <ActiveRecall />;
    case 'focus_breakdown':
      return <FocusBreakdown />;
    case 'collaborative_scholar':
      return <CollaborativeScholar />;
    case 'creative_synthesis':
      return <CreativeSynthesis />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SessionProvider>
            <MigrationHelper />
            <Router>
              <div className="app">
                <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/docs/:slug" element={<DocsPage />} />
              <Route path="/docs/:slug/:sectionId" element={<DocsPage />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/mode-select" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <ModeSelector />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/pdf-manager" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <PDFManager />
                  </ProtectedRoute>
                } 
              />

              <Route
                path="/exam-planner"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <ExamPlanner />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/exam-session/:planId/:topicIndex"
                element={
                  <ProtectedRoute>
                    <ExamSession />
                  </ProtectedRoute>
                }
              />

              {/* Language Learning Routes */}
              <Route 
                path="/language-learning" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <LanguageLearning />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/language-learning/lessons" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <LanguageLearningLessons />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/language-learning/lessons/:moduleId/:stageId" 
                element={
                  <ProtectedRoute>
                    <LanguageLearningLesson />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/language-learning/practice" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <LanguageLearningPractice />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/language-learning/continue" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <LanguageLearning />
                  </ProtectedRoute>
                } 
              />
              
              {/* TTS Demo Route */}
              <Route 
                path="/tts-demo" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <TTSDemo />
                  </ProtectedRoute>
                } 
              />
              
              {/* Session routes */}
              <Route 
                path="/session/:sessionId" 
                element={
                  <ProtectedRoute>
                    <Navbar isSessionPage={true} />
                    <SessionRoute />
                  </ProtectedRoute>
                } 
              />
              
              {/* Direct mode routes for new sessions */}
              <Route 
                path="/session/new/mental-model" 
                element={
                  <ProtectedRoute>
                    <Navbar isSessionPage={true} />
                    <MentalModel />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/session/new/active-recall" 
                element={
                  <ProtectedRoute>
                    <Navbar isSessionPage={true} />
                    <ActiveRecall />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/session/new/focus-breakdown" 
                element={
                  <ProtectedRoute>
                    <Navbar isSessionPage={true} />
                    <FocusBreakdown />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/session/new/collaborative-scholar" 
                element={
                  <ProtectedRoute>
                    <Navbar isSessionPage={true} />
                    <CollaborativeScholar />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/session/new/creative-synthesis" 
                element={
                  <ProtectedRoute>
                    <Navbar isSessionPage={true} />
                    <CreativeSynthesis />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </SessionProvider>
    </AuthProvider>
  </ThemeProvider>
</ErrorBoundary>
  );
}

export default App;