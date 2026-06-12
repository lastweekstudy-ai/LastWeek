import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSession from '../hooks/useSession';
import useCombinedLimits from '../hooks/useCombinedLimits';
import UsageLimitModal from '../components/UsageLimitModal';
import { 
  MentalModelIcon, 
  ActiveRecallIcon, 
  FocusBreakdownIcon, 
  CollaborativeScholarIcon, 
  CreativeSynthesisIcon 
} from '../components/Icons';

const ModeSelector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startSession } = useSession();
  const { canDo, recordUsage, planName, isTestingMode } = useCombinedLimits();
  
  const [selectedMode, setSelectedMode] = useState(null);
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitBlocked, setLimitBlocked] = useState(null);

  const modes = [
    {
      id: 'mental_model',
      name: 'Mental Model',
      icon: MentalModelIcon,
      emoji: '🧠',
      tagline: 'Learn through analogies',
      description: 'Complex concepts, abstract ideas, theoretical subjects',
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.08)',
    },
    {
      id: 'active_recall',
      name: 'Active Recall',
      icon: ActiveRecallIcon,
      emoji: '⚡',
      tagline: 'Test yourself to remember',
      description: 'Memorization, facts, definitions, problem-solving',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
    },
    {
      id: 'focus_breakdown',
      name: 'Focus Breakdown',
      icon: FocusBreakdownIcon,
      emoji: '🎯',
      tagline: 'Break it into chunks',
      description: 'Large textbooks, dense material, time-crunched studying',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.08)',
    },
    {
      id: 'collaborative_scholar',
      name: 'Scholar',
      icon: CollaborativeScholarIcon,
      emoji: '🎓',
      tagline: 'Debate & peer review',
      description: 'Critical thinking, essay writing, different perspectives',
      color: 'var(--color-accent)',
      bg: 'rgba(var(--color-accent-rgb),0.08)',
    },
    {
      id: 'creative_synthesis',
      name: 'Creative Synthesis',
      icon: CreativeSynthesisIcon,
      emoji: '🎨',
      tagline: 'Learn by creating',
      description: 'Mind maps, stories, projects, hands-on learning',
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.08)',
    },
  ];

  React.useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setError('');
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedMode || !subject.trim()) {
      setError('Please select a mode and enter a subject');
      return;
    }

    // Check session limit before creating
    const sessionCheck = canDo('sessions');
    if (!sessionCheck.allowed) {
      setLimitBlocked({ action: 'sessions', current: sessionCheck.current, limit: sessionCheck.limit, planName });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const session = await startSession(
        selectedMode.id,
        subject.trim(),
        `${selectedMode.name} - ${subject.trim()}`
      );
      // Record session creation
      recordUsage('sessions');
      navigate(`/session/${session.$id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mode-selector">
      <div className="container">
        <div className="mode-selector-header">
          <button className="btn btn-ghost back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div className="header-content">
            <h1>How do you want to learn?</h1>
            <p>Pick a mode, then tell us what you're studying.</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modes-selection">
          <div className="modes-grid">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode?.id === mode.id;
              return (
                <button
                  key={mode.id}
                  className={`mode-card${isSelected ? ' selected' : ''}`}
                  onClick={() => handleModeSelect(mode)}
                  style={{
                    '--mode-color': mode.color,
                    '--mode-bg': mode.bg,
                  }}
                >
                  <div className="mode-card-icon">
                    <Icon size={22} />
                  </div>
                  <div className="mode-card-body">
                    <span className="mode-card-name">{mode.name}</span>
                    <span className="mode-card-tagline">{mode.tagline}</span>
                  </div>
                  {isSelected && <span className="mode-card-check">✓</span>}
                </button>
              );
            })}
          </div>

          {selectedMode && (
            <div className="subject-input-section fade-in">
              <div className="subject-card card">
                <div className="subject-card-mode">
                  <span style={{ color: selectedMode.color }}>
                    <selectedMode.icon size={18} />
                  </span>
                  <strong>{selectedMode.name}</strong>
                  <span className="subject-card-desc">{selectedMode.description}</span>
                </div>

                <h3>What are you studying?</h3>

                <form onSubmit={handleStartSession}>
                  <div className="form-group">
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Organic Chemistry, Calculus, World War II…"
                      className="form-input subject-input"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary start-session-btn"
                    disabled={!subject.trim() || loading}
                    style={{ background: selectedMode.color, borderColor: selectedMode.color }}
                  >
                    {loading ? 'Starting…' : `Start ${selectedMode.name} →`}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <UsageLimitModal
        isOpen={!!limitBlocked}
        onClose={() => setLimitBlocked(null)}
        action={limitBlocked?.action}
        current={limitBlocked?.current}
        limit={limitBlocked?.limit}
        remaining={limitBlocked?.remaining}
        requested={limitBlocked?.requested}
        planName={limitBlocked?.planName}
      />
    </div>
  );
};

export default ModeSelector;
