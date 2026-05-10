import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSession from '../hooks/useSession';
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
  
  const [selectedMode, setSelectedMode] = useState(null);
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modes = [
    {
      id: 'mental_model',
      name: 'Mental Model',
      icon: <MentalModelIcon size={32} />,
      description: 'Learn through real-world analogies and comparisons to things you already understand',
      bestFor: 'Complex concepts, abstract ideas, theoretical subjects'
    },
    {
      id: 'active_recall',
      name: 'Active Recall',
      icon: <ActiveRecallIcon size={32} />,
      description: 'Test yourself with quizzes, flashcards, and realistic scenarios',
      bestFor: 'Memorization, facts, definitions, problem-solving practice'
    },
    {
      id: 'focus_breakdown',
      name: 'Focus Breakdown',
      icon: <FocusBreakdownIcon size={32} />,
      description: 'Break overwhelming topics into digestible 5-minute chunks with summaries',
      bestFor: 'Large textbooks, dense material, time-crunched studying'
    },
    {
      id: 'collaborative_scholar',
      name: 'Collaborative Scholar',
      icon: <CollaborativeScholarIcon size={32} />,
      description: 'Learn with historical figures, debate ideas, and get peer review feedback',
      bestFor: 'Critical thinking, essay writing, understanding different perspectives'
    },
    {
      id: 'creative_synthesis',
      name: 'Creative Synthesis',
      icon: <CreativeSynthesisIcon size={32} />,
      description: 'Create mind maps, stories, and projects to learn by building things',
      bestFor: 'Creative subjects, connecting ideas, hands-on learning'
    }
  ];

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
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

    setLoading(true);
    setError('');

    try {
      const session = await startSession(
        selectedMode.id,
        subject.trim(),
        `${selectedMode.name} - ${subject.trim()}`
      );
      
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
          <button 
            className="btn btn-ghost back-btn"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </button>
          
          <div className="header-content">
            <h1>Choose Your Learning Mode</h1>
            <p>Select the AI study mode that best fits your learning style and subject.</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="modes-selection">
          <div className="modes-grid">
            {modes.map((mode) => (
              <div
                key={mode.id}
                className={`mode-card card ${selectedMode?.id === mode.id ? 'selected' : ''}`}
                onClick={() => handleModeSelect(mode)}
              >
                <div className="mode-header">
                  <div className="mode-icon">{mode.icon}</div>
                  <h3 className="mode-name">{mode.name}</h3>
                </div>
                
                <p className="mode-description">{mode.description}</p>
                
                <div className="mode-best-for">
                  <strong>Best for:</strong> {mode.bestFor}
                </div>
                
                {selectedMode?.id === mode.id && (
                  <div className="selected-indicator">
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedMode && (
            <div className="subject-input-section fade-in">
              <div className="subject-card card">
                <h3>What subject are you studying?</h3>
                <p className="text-muted">
                  Be specific to get the best AI assistance. Examples: "Organic Chemistry", 
                  "World War II History", "Calculus Derivatives", "Spanish Grammar"
                </p>
                
                <form onSubmit={handleStartSession}>
                  <div className="form-group">
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter your subject (e.g., Organic Chemistry)"
                      className="form-input subject-input"
                      autoFocus
                    />
                  </div>
                  
                  <div className="session-preview">
                    <div className="preview-header">
                      <span className="preview-icon">{selectedMode.icon}</span>
                      <span className="preview-text">
                        Starting <strong>{selectedMode.name}</strong> session
                        {subject && <span> for <strong>{subject}</strong></span>}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary start-session-btn"
                    disabled={!subject.trim() || loading}
                  >
                    {loading ? 'Starting Session...' : 'Start Learning'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;