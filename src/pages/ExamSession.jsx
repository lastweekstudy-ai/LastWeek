import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession as useSessionContext } from '../context/SessionContext';
import useDeepSeek from '../hooks/useDeepSeek';
import useMobileViewport from '../hooks/useMobileViewport';
import useCombinedLimits from '../hooks/useCombinedLimits';
import { buildContextMessages } from '../utils/contextManager';
import {
  getUserExamPlans,
  updateExamPlan,
  buildExamSessionPrompt,
  daysUntilExam,
  generateSchedule,
} from '../appwrite/examPlanner';
import ChatInterface from '../components/ChatInterface';
import PDFLibrary from '../components/PDFLibrary';
import PomodoroTimer from '../components/PomodoroTimer';
import usePerformanceTracking from '../hooks/usePerformanceTracking';
import UsageLimitModal from '../components/UsageLimitModal';

/**
 * ExamSession — a dedicated session page for exam preparation.
 * Completely bypasses the 5-mode system and the session assessment.
 * The AI already knows the exam, deadline, topics, and urgency.
 *
 * URL: /exam-session/:planId/:topicIndex
 */
const ExamSession = () => {
  const { planId, topicIndex } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionCtx = useSessionContext();
  const { askStream } = useDeepSeek();

  const [plan, setPlan] = useState(null);
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesReady, setMessagesReady] = useState(false);
  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalysing] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [limitBlocked, setLimitBlocked] = useState(null);
  const openingFiredRef = useRef(false);
  
  const { canDo, recordUsage, planName, isTestingMode } = useCombinedLimits();
  
  // Mobile viewport handling
  const { isMobile } = useMobileViewport();

  const topicIdx = parseInt(topicIndex, 10);

  const { handleFlashcardRate, handleMCQAnswer } = usePerformanceTracking({
    userId: user?.$id,
    sessionId: sessionCtx.activeSession?.$id,
    subject: plan?.examName,
    activeSession: sessionCtx.activeSession,
  });

  // ── Load plan and resume or create session ────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    init();
  }, [user, planId, topicIndex]);

  const init = async () => {
    try {
      setLoading(true);
      const plans = await getUserExamPlans(user.$id);
      const found = plans.find(p => p.$id === planId);
      if (!found) { navigate('/exam-planner'); return; }

      const t = found.topics[topicIdx];
      if (!t) { navigate('/exam-planner'); return; }

      setPlan(found);
      setTopic(t);

      // Resume existing session for this topic if one exists
      if (t.sessionId) {
        try {
          await sessionCtx.loadSession(t.sessionId);
        } catch {
          // Session was deleted — clear the reference and start fresh
          const updatedTopics = found.topics.map((tp, i) =>
            i === topicIdx ? { ...tp, sessionId: null } : tp
          );
          await updateExamPlan(planId, { topics: updatedTopics });
          found.topics[topicIdx].sessionId = null;
          await startFreshSession(found, t, topicIdx);
        }
      } else {
        await startFreshSession(found, t, topicIdx);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      // Small delay to let SessionContext populate messages before the opening effect runs
      setTimeout(() => setMessagesReady(true), 100);
    }
  };

  const startFreshSession = async (p, t, idx) => {
    const session = await sessionCtx.startSession(
      'exam_prep', // custom mode — bypasses assessment
      p.examName,
      `${p.examName} — ${t.name}`
    );
    // Save session ID back to the topic
    const updatedTopics = p.topics.map((tp, i) =>
      i === idx ? { ...tp, sessionId: session.$id } : tp
    );
    await updateExamPlan(planId, { topics: updatedTopics });
    setPlan(prev => prev ? { ...prev, topics: updatedTopics } : prev);
  };

  // ── Fire opening message once when session is fresh ───────────────────────
  useEffect(() => {
    if (!plan || !topic || !sessionCtx.activeSession || loading || !messagesReady) return;
    if (openingFiredRef.current) return;
    if (sessionCtx.messages.length > 0) {
      // Returning to existing session — messages already loaded, no opening needed
      openingFiredRef.current = true;
      return;
    }
    openingFiredRef.current = true;

    const opening = `[EXAM SESSION START]\nExam: ${plan.examName}\nTopic for today: ${topic.name}\nDays until exam: ${daysUntilExam(plan.examDate)}\n\nPlease begin the session as the exam coach. Start with the roadmap for ${topic.name} and begin teaching immediately.`;
    sendMessage(opening, opening);
  }, [plan, topic, sessionCtx.activeSession, messagesReady, loading]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (userDisplayMessage, aiContextMessage = null) => {
    if (!plan || !topic || !sessionCtx.activeSession) return;

    // Check message limit before sending
    const msgCheck = canDo('messages');
    if (!msgCheck.allowed) {
      setLimitBlocked({ action: 'messages', current: msgCheck.current, limit: msgCheck.limit, remaining: msgCheck.remaining, planName });
      return;
    }

    // Pre-flight: flashcard request
    const isFlashcardReq = /flashcard|flash card|flash me|create.*card|make.*card/i.test(userDisplayMessage || '');
    const isMCQReq = /\bmcq\b|multiple.?choice|quiz me|test me|quiz question/i.test(userDisplayMessage || '');
    const requestedCount = (() => { const m = (userDisplayMessage || '').match(/\b(\d+)\b/); return m ? Math.min(parseInt(m[1], 10), 50) : 1; })();

    if (isFlashcardReq) {
      const fcCheck = canDo('flashcards');
      if (fcCheck.limit !== Infinity && (!fcCheck.allowed || requestedCount > fcCheck.remaining)) {
        setLimitBlocked({ action: 'flashcards', current: fcCheck.current, limit: fcCheck.limit, remaining: fcCheck.remaining, requested: requestedCount, planName });
        return;
      }
    }
    if (isMCQReq) {
      const mcqCheck = canDo('mcqs');
      if (mcqCheck.limit !== Infinity && (!mcqCheck.allowed || requestedCount > mcqCheck.remaining)) {
        setLimitBlocked({ action: 'mcqs', current: mcqCheck.current, limit: mcqCheck.limit, remaining: mcqCheck.remaining, requested: requestedCount, planName });
        return;
      }
    }

    const systemPrompt = buildExamSessionPrompt(plan, topic.name, topicIdx);
    const msgForAI = aiContextMessage || userDisplayMessage;

    const { messages: contextualMessages } = buildContextMessages(
      sessionCtx.messages,
      msgForAI,
      sessionCtx.activeSession,
      28000
    );

    setIsStreaming(true);
    try {
      const result = await sessionCtx.sendMessageStreaming(
        userDisplayMessage,
        async (onChunk) => {
          return await askStream(systemPrompt, contextualMessages, onChunk);
        }
      );
      // Record message usage
      recordUsage('messages');

      // Count flashcards/MCQs generated in the response
      const responseText = result?.content || '';
      if (responseText) {
        const fcCount = (responseText.match(/\*\*FRONT OF CARD\*\*/gi) || []).length;
        if (fcCount > 0) recordUsage('flashcards', fcCount);
        const mcqCount = (responseText.match(/\[MCQ\]/gi) || []).length;
        if (mcqCount > 0) recordUsage('mcqs', mcqCount);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsStreaming(false);
    }
  };

  // ── Mark topic done ───────────────────────────────────────────────────────
  const markDone = async () => {
    if (!plan) return;
    const updatedTopics = plan.topics.map((t, i) =>
      i === topicIdx ? { ...t, done: true } : t
    );
    await updateExamPlan(planId, { topics: updatedTopics });
    setPlan(prev => ({ ...prev, topics: updatedTopics }));

    // Find next undone topic
    const nextIdx = updatedTopics.findIndex((t, i) => i > topicIdx && !t.done);
    if (nextIdx !== -1) {
      navigate(`/exam-session/${planId}/${nextIdx}`);
    } else {
      navigate('/exam-planner');
    }
  };

  if (loading) {
    return (
      <div className="es-loading">
        <div className="es-loading-inner">
          <div className="es-spinner" />
          <p>Preparing your exam session…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="es-loading">
        <div className="es-loading-inner">
          <p style={{ color: 'var(--color-error)' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/exam-planner')}>
            Back to Planner
          </button>
        </div>
      </div>
    );
  }

  if (!plan || !topic) return null;

  const days = daysUntilExam(plan.examDate);
  const done = plan.topics.filter(t => t.done).length;
  const total = plan.topics.length;
  const pct = Math.round((done / total) * 100);
  const schedule = generateSchedule(plan.examDate, plan.topics);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTopics = schedule.find(s => s.date === todayStr)?.topics || [];

  return (
    <div className="es-page">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="es-topbar">
        <button className="es-back-btn" onClick={() => navigate('/exam-planner')}>
          ← Planner
        </button>

        <div className="es-topbar-center">
          <span className="es-exam-name">{plan.examName}</span>
          <span className="es-separator">·</span>
          <span className="es-topic-name">{topic.name}</span>
        </div>

        <div className="es-topbar-right">
          <PomodoroTimer />
          <span className={`es-days-chip ${days <= 3 ? 'urgent' : ''}`}>
            {days === 0 ? 'Exam today!' : `${days}d left`}
          </span>
          <div className="es-progress-mini">
            <div className="es-progress-mini-bar">
              <div className="es-progress-mini-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="es-progress-mini-text">{done}/{total}</span>
          </div>
          <button
            className="btn btn-primary es-done-btn"
            onClick={markDone}
            disabled={topic.done}
          >
            {topic.done ? '✓ Done' : 'Mark Done →'}
          </button>
        </div>
      </div>

      {/* ── Sidebar: topic list ──────────────────────────────────────────── */}
      <div className="es-layout">
        <aside className="es-sidebar">
          <div className="es-sidebar-header">
            <p className="es-sidebar-title">Syllabus</p>
            <p className="es-sidebar-sub">{pct}% complete</p>
          </div>
          <ul className="es-topic-list">
            {plan.topics.map((t, i) => (
              <li
                key={i}
                className={`es-topic-item ${i === topicIdx ? 'active' : ''} ${t.done ? 'done' : ''}`}
                onClick={() => i !== topicIdx && navigate(`/exam-session/${planId}/${i}`)}
              >
                <span className={`es-topic-dot ${t.done ? 'done' : i === topicIdx ? 'active' : ''}`} />
                <span className="es-topic-label">{t.name}</span>
                {t.done && <span className="es-check">✓</span>}
                {todayTopics.includes(t.name) && !t.done && (
                  <span className="es-today-dot" title="Today's topic" />
                )}
              </li>
            ))}
          </ul>

          {/* Today's schedule */}
          {todayTopics.length > 0 && (
            <div className="es-today-box">
              <p className="es-today-label">📅 Today</p>
              <p className="es-today-topics">{todayTopics.join(', ')}</p>
            </div>
          )}
        </aside>

        {/* ── Chat ──────────────────────────────────────────────────────── */}
        <main className="es-chat">
          <ChatInterface
            messages={sessionCtx.messages}
            onSend={sendMessage}
            isLoading={sessionCtx.isLoading}
            isStreaming={isStreaming}
            isAnalysing={isAnalysing}
            mode="exam_prep"
            userId={user?.$id}
            sessionId={sessionCtx.activeSession?.$id}
            subject={plan.examName}
            insideStudyMode={true}
            onFlashcardRate={handleFlashcardRate}
            onMCQAnswer={handleMCQAnswer}
            onResourcesToggle={() => setShowResources(!showResources)}
          />
        </main>

        {/* Resources Panel */}
        {showResources && (
          <PDFLibrary
            sessionId={sessionCtx.activeSession?.$id}
            userId={user?.$id}
            isOpen={showResources}
            onClose={() => setShowResources(false)}
            messages={sessionCtx.messages}
            onSendMessage={sendMessage}
            isLoading={sessionCtx.isLoading}
            mode="exam_prep"
            subject={plan.examName}
          />
        )}
      </div>

      <UsageLimitModal
        isOpen={!!limitBlocked}
        onClose={() => setLimitBlocked(null)}
        action={limitBlocked?.action}
        current={limitBlocked?.current}
        limit={limitBlocked?.limit}
        planName={limitBlocked?.planName}
      />
    </div>
  );
};

export default ExamSession;
