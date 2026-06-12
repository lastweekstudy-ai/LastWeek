import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import useSession from './hooks/useSession';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useCombinedLimits from './hooks/useCombinedLimits';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import MigrationHelper from './components/MigrationHelper';
import LandingPage from './pages/landing/LandingPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Pricing from './pages/Pricing';
import RefundPolicy from './pages/RefundPolicy';
import CookiePolicy from './pages/CookiePolicy';
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
import FlashcardLibrary from './pages/FlashcardLibrary';
import PreRegistration from './pages/PreRegistration';
import SecureAITest from './components/SecureAITest';

// Admin Panel
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminPreReg from './pages/admin/PreRegUsers';
import AdminDailySlots from './pages/admin/DailySlots';
import AdminReviews from './pages/admin/Reviews';
import AdminSettings from './pages/admin/Settings';
import AdminTestingUsers from './pages/admin/TestingUsers';

const LoadingScreen = ({ label = 'Loading...' }) => (
  <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 text-surface-600 dark:bg-surface-950 dark:text-surface-300">
    <div className="glass-card w-full max-w-sm p-6 text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600 dark:border-surface-800 dark:border-t-brand-300" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  </div>
);

const AppShell = ({ children, isSessionPage = false }) => (
  <>
    <Navbar isSessionPage={isSessionPage} />
    <main className="min-h-screen bg-brand-50 pt-20 text-surface-900 dark:bg-surface-950 dark:text-surface-100 lg:pl-64 lg:pt-0">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  </>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return user ? children : <Navigate to="/auth" replace />;
};

// Language Learning Guard — blocks free-tier users (but allows testing users)
const LanguageLearningGuard = ({ children }) => {
  const { canDo, loading, isTestingMode } = useCombinedLimits();
  if (loading) return <LoadingScreen />;
  
  // Testing users get limited access
  if (isTestingMode) {
    return children;
  }
  
  const check = canDo('languageLearning');
  if (!check.allowed) {
    return <Navigate to="/pricing" replace />;
  }
  return children;
};

// Admin Route Guard — only allows users with 'admin' label
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  const isAdmin = user?.labels?.includes('admin');
  
  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Session Route Component - determines which mode page to render
const SessionRoute = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { activeSession, loadSession, messages } = useSession();
  const { color, changeColor, availableColors } = useTheme();
  const [sessionLoaded, setSessionLoaded] = useState(false);
  
  // Cycle through color themes
  const cycleColorTheme = () => {
    const currentIndex = availableColors.indexOf(color);
    const nextIndex = (currentIndex + 1) % availableColors.length;
    changeColor(availableColors[nextIndex]);
  };
  
  // Global keyboard shortcuts
  useKeyboardShortcuts([
    { key: 't', ctrl: true, shift: true, callback: cycleColorTheme },
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
    return <LoadingScreen label="Loading session..." />;
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
              <div className="min-h-screen bg-brand-50 text-surface-900 antialiased dark:bg-surface-950 dark:text-surface-100">
                <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/docs/:slug" element={<DocsPage />} />
              <Route path="/docs/:slug/:sectionId" element={<DocsPage />} />
              <Route path="/test-ai" element={<SecureAITest />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Dashboard />
                    </AppShell>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/mode-select" 
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ModeSelector />
                    </AppShell>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Settings />
                    </AppShell>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/pdf-manager" 
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <PDFManager />
                    </AppShell>
                  </ProtectedRoute>
                } 
              />

              <Route
                path="/exam-planner"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ExamPlanner />
                    </AppShell>
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
                    <LanguageLearningGuard>
                      <AppShell>
                        <LanguageLearning />
                      </AppShell>
                    </LanguageLearningGuard>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/language-learning/lessons" 
                element={
                  <ProtectedRoute>
                    <LanguageLearningGuard>
                      <AppShell>
                        <LanguageLearningLessons />
                      </AppShell>
                    </LanguageLearningGuard>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/language-learning/lessons/:moduleId/:stageId" 
                element={
                  <ProtectedRoute>
                    <LanguageLearningGuard>
                      <LanguageLearningLesson />
                    </LanguageLearningGuard>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/language-learning/practice" 
                element={
                  <ProtectedRoute>
                    <LanguageLearningGuard>
                      <AppShell>
                        <LanguageLearningPractice />
                      </AppShell>
                    </LanguageLearningGuard>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/language-learning/continue" 
                element={
                  <ProtectedRoute>
                    <LanguageLearningGuard>
                      <AppShell>
                        <LanguageLearning />
                      </AppShell>
                    </LanguageLearningGuard>
                  </ProtectedRoute>
                } 
              />
              
              {/* Flashcard Library */}
              <Route
                path="/flashcards"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <FlashcardLibrary />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              {/* Pricing page */}
              <Route
                path="/pricing"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Pricing />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              {/* Pre-Registration page - PUBLIC (no login required) */}
              <Route
                path="/pre-register"
                element={<PreRegistration />}
              />
              
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="testing-users" element={<AdminTestingUsers />} />
                <Route path="pre-reg" element={<AdminPreReg />} />
                <Route path="daily-slots" element={<AdminDailySlots />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              
              {/* Session routes */}
              <Route 
                path="/session/:sessionId" 
                element={
                  <ProtectedRoute>
                    <AppShell isSessionPage={true}>
                      <SessionRoute />
                    </AppShell>
                  </ProtectedRoute>
                } 
              />
              
              {/* Direct mode routes for new sessions */}
              <Route 
                path="/session/new/mental-model" 
                element={
                  <ProtectedRoute>
                    <AppShell isSessionPage={true}>
                      <MentalModel />
                    </AppShell>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/session/new/active-recall" 
                element={
                  <ProtectedRoute>
                    <AppShell isSessionPage={true}>
                      <ActiveRecall />
                    </AppShell>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/session/new/focus-breakdown" 
                element={
                  <ProtectedRoute>
                    <AppShell isSessionPage={true}>
                      <FocusBreakdown />
                    </AppShell>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/session/new/collaborative-scholar" 
                element={
                  <ProtectedRoute>
                    <AppShell isSessionPage={true}>
                      <CollaborativeScholar />
                    </AppShell>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/session/new/creative-synthesis" 
                element={
                  <ProtectedRoute>
                    <AppShell isSessionPage={true}>
                      <CreativeSynthesis />
                    </AppShell>
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
