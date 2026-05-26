import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createExamPlan,
  getUserExamPlans,
  updateExamPlan,
  deleteExamPlan,
  generateSchedule,
  daysUntilExam,
} from '../appwrite/examPlanner';
import useCombinedLimits from '../hooks/useCombinedLimits';
import UsageLimitModal from '../components/UsageLimitModal';
import '../styles/ExamPlanner.css';

// ─── Icons ────────────────────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ─── New Plan Form ─────────────────────────────────────────────────────────────
const NewPlanForm = ({ onCreated, onCancel }) => {
  const { user } = useAuth();
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const addTopic = () => {
    const val = topicInput.trim();
    if (!val) return;
    setTopics(prev => [...prev, { name: val, done: false, sessionId: null }]);
    setTopicInput('');
  };

  const removeTopic = (i) => setTopics(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examName.trim() || !examDate || topics.length === 0) {
      setError('Please fill in all fields and add at least one topic.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const plan = await createExamPlan(user.$id, examName.trim(), examDate, topics);
      onCreated({ ...plan, topics });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ep-form-card card">
      <h3 className="ep-form-title">New Exam Plan</h3>

      {error && <div className="ep-error">{error}</div>}

      <form onSubmit={handleSubmit} className="ep-form">
        <div className="ep-form-row">
          <div className="form-group">
            <label className="ep-label">Exam / Subject name</label>
            <input
              className="form-input"
              placeholder="e.g. HSC Physics, SAT Math, Final Exam"
              value={examName}
              onChange={e => setExamName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="ep-label">Exam date</label>
            <input
              type="date"
              className="form-input"
              min={minDateStr}
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="ep-label">Topics / Chapters to cover</label>
          <div className="ep-topic-input-row">
            <input
              className="form-input"
              placeholder="e.g. Newton's Laws of Motion"
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } }}
            />
            <button type="button" className="btn btn-secondary" onClick={addTopic}>
              <PlusIcon /> Add
            </button>
          </div>
          {topics.length > 0 && (
            <ul className="ep-topic-list">
              {topics.map((t, i) => (
                <li key={i} className="ep-topic-chip">
                  <span>{t.name}</span>
                  <button type="button" className="ep-chip-remove" onClick={() => removeTopic(i)}>✕</button>
                </li>
              ))}
            </ul>
          )}
          {topics.length === 0 && (
            <p className="ep-hint">Add each topic or chapter you need to study before the exam.</p>
          )}
        </div>

        <div className="ep-form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Plan Card ─────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, onTopicToggle, onDelete, onStartSession }) => {
  const days = daysUntilExam(plan.examDate);
  const total = plan.topics.length;
  const done = plan.topics.filter(t => t.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const schedule = generateSchedule(plan.examDate, plan.topics);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = schedule.find(s => s.date === todayStr);
  const isOverdue = days === 0;
  const isUrgent = days <= 3 && days > 0;

  return (
    <div className={`ep-plan-card card ${isOverdue ? 'ep-overdue' : isUrgent ? 'ep-urgent' : ''}`}>
      {/* Header */}
      <div className="ep-plan-header">
        <div className="ep-plan-title-row">
          <h3 className="ep-plan-name">{plan.examName}</h3>
          <button className="ep-delete-btn" onClick={() => onDelete(plan.$id)} title="Delete plan">
            <TrashIcon />
          </button>
        </div>
        <div className="ep-plan-meta">
          <span className={`ep-days-badge ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}`}>
            <CalendarIcon />
            {isOverdue ? 'Exam day!' : `${days} day${days !== 1 ? 's' : ''} left`}
          </span>
          <span className="ep-date-text">
            {new Date(plan.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="ep-progress-section">
        <div className="ep-progress-label">
          <span>{done}/{total} topics covered</span>
          <span className="ep-pct">{pct}%</span>
        </div>
        <div className="ep-progress-bar">
          <div
            className="ep-progress-fill"
            style={{ width: `${pct}%`, background: pct === 100 ? 'var(--color-success)' : 'var(--color-accent)' }}
          />
        </div>
      </div>

      {/* Today's task */}
      {todayEntry && todayEntry.topics.length > 0 && (
        <div className="ep-today-section">
          <p className="ep-today-label">📅 Today's topics</p>
          <div className="ep-today-topics">
            {todayEntry.topics.map((topicName) => {
              const idx = plan.topics.findIndex(t => t.name === topicName);
              const t = plan.topics[idx];
              return (
                <button
                  key={topicName}
                  className="btn btn-primary ep-start-btn"
                  onClick={() => onStartSession(plan, idx)}
                  disabled={t?.done}
                >
                  {t?.sessionId ? '▶ Resume' : '▶ Start'}: {topicName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All topics */}
      <div className="ep-topics-section">
        <p className="ep-topics-label">All topics</p>
        <ul className="ep-topics-checklist">
          {plan.topics.map((topic, i) => (
            <li
              key={i}
              className={`ep-topic-item ${topic.done ? 'done' : ''}`}
            >
              <span
                className={`ep-checkbox ${topic.done ? 'checked' : ''}`}
                onClick={() => onTopicToggle(plan, i)}
              >
                {topic.done && <CheckIcon />}
              </span>
              <span
                className="ep-topic-name"
                onClick={() => !topic.done && onStartSession(plan, i)}
                style={{ cursor: topic.done ? 'default' : 'pointer' }}
              >
                {topic.name}
              </span>
              {topic.done
                ? <span className="ep-done-badge">Done</span>
                : topic.sessionId
                  ? <span className="ep-resume-badge" onClick={() => onStartSession(plan, i)}>Resume →</span>
                  : <span className="ep-start-badge" onClick={() => onStartSession(plan, i)}>Start →</span>
              }
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const ExamPlanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [limitBlocked, setLimitBlocked] = useState(null);
  const { canDo, planName, isTestingMode } = useCombinedLimits();

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadPlans();
  }, [user]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await getUserExamPlans(user.$id);
      setPlans(data);
    } catch (err) {
      setError('Failed to load exam plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (plan) => {
    setPlans(prev => [...prev, plan]);
    setShowForm(false);
  };

  const handleNewPlan = () => {
    // Count only active (not past) plans
    const activePlans = plans.filter(p => daysUntilExam(p.examDate) >= 0);
    const check = canDo('examPlans');
    // Use active plan count vs limit
    if (activePlans.length >= (check.limit === Infinity ? Infinity : check.limit)) {
      setLimitBlocked({ action: 'examPlans', current: activePlans.length, limit: check.limit, planName });
      return;
    }
    setShowForm(true);
  };

  const handleTopicToggle = async (plan, topicIndex) => {
    const updatedTopics = plan.topics.map((t, i) =>
      i === topicIndex ? { ...t, done: !t.done } : t
    );
    // Optimistic update
    setPlans(prev => prev.map(p => p.$id === plan.$id ? { ...p, topics: updatedTopics } : p));
    try {
      await updateExamPlan(plan.$id, { topics: updatedTopics });
    } catch {
      // Revert on failure
      setPlans(prev => prev.map(p => p.$id === plan.$id ? plan : p));
    }
  };

  const handleDelete = async (planId) => {
    if (!confirm('Delete this exam plan? This cannot be undone.')) return;
    setPlans(prev => prev.filter(p => p.$id !== planId));
    try {
      await deleteExamPlan(planId);
    } catch (err) {
      setError('Failed to delete plan.');
      loadPlans();
    }
  };

  const handleStartSession = async (plan, topicIndex) => {
    navigate(`/exam-session/${plan.$id}/${topicIndex}`);
  };

  const activePlans = plans.filter(p => daysUntilExam(p.examDate) >= 0);
  const pastPlans   = plans.filter(p => daysUntilExam(p.examDate) < 0);

  return (
    <div className="ep-page">
      <div className="container">
        {/* Header */}
        <div className="ep-header">
          <div>
            <h1 className="ep-title">Exam Planner</h1>
            <p className="ep-subtitle">Set your exam date, list your topics, and get a day-by-day study plan.</p>
          </div>
          <button className="btn btn-primary" onClick={handleNewPlan}>
            <PlusIcon /> New Exam Plan
          </button>
        </div>

        {error && <div className="ep-error">{error}</div>}

        {/* New plan form */}
        {showForm && (
          <NewPlanForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
        )}

        {/* Loading */}
        {loading && (
          <div className="ep-empty">
            <p>Loading your plans…</p>
          </div>
        )}

        {/* Active plans */}
        {!loading && activePlans.length === 0 && !showForm && (
          <div className="ep-empty card">
            <div className="ep-empty-icon">📅</div>
            <h3>No exam plans yet</h3>
            <p>Create your first plan to get a personalized study schedule.</p>
            <button className="btn btn-primary" onClick={handleNewPlan}>
              <PlusIcon /> Create Exam Plan
            </button>
          </div>
        )}

        {activePlans.length > 0 && (
          <div className="ep-plans-grid">
            {activePlans.map(plan => (
              <PlanCard
                key={plan.$id}
                plan={plan}
                onTopicToggle={handleTopicToggle}
                onDelete={handleDelete}
                onStartSession={handleStartSession}
              />
            ))}
          </div>
        )}

        {/* Past exams */}
        {pastPlans.length > 0 && (
          <div className="ep-past-section">
            <h2 className="ep-section-title">Past Exams</h2>
            <div className="ep-plans-grid">
              {pastPlans.map(plan => (
                <PlanCard
                  key={plan.$id}
                  plan={plan}
                  onTopicToggle={handleTopicToggle}
                  onDelete={handleDelete}
                  onStartSession={handleStartSession}
                />
              ))}
            </div>
          </div>
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

export default ExamPlanner;
