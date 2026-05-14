import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLanguageUser, createLanguageUser, getRoadmap, saveRoadmap, LANGUAGES } from '../appwrite/languageLearning';
import { generateRoadmap, generateLesson } from '../services/languageAI';
import useSession from '../hooks/useSession';
import './LanguageLearning.css';

// Fallback roadmap when AI is rate limited
const createFallbackRoadmap = (targetLanguage) => {
  const stages = ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'mastery', 'native'];
  const modules = [
    { moduleId: 'vocabulary', moduleName: 'Vocabulary', type: 'learning' },
    { moduleId: 'pronunciation', moduleName: 'Pronunciation', type: 'learning' },
    { moduleId: 'speaking', moduleName: 'Speaking', type: 'practice' },
    { moduleId: 'listening', moduleName: 'Listening', type: 'practice' },
    { moduleId: 'reading', moduleName: 'Reading', type: 'practice' },
    { moduleId: 'writing', moduleName: 'Writing', type: 'practice' },
    { moduleId: 'grammar', moduleName: 'Grammar', type: 'learning' },
    { moduleId: 'sentence_structure', moduleName: 'Sentence Structure', type: 'learning' },
    { moduleId: 'synonyms', moduleName: 'Synonyms & Antonyms', type: 'learning' },
    { moduleId: 'idioms', moduleName: 'Idioms & Expressions', type: 'learning' },
    { moduleId: 'culture', moduleName: 'Cultural Context', type: 'learning' },
  ];
  
  return stages.map((stage, stageIndex) => ({
    stageId: stage,
    stageName: stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' '),
    description: `Learn ${targetLanguage} at ${stage} level`,
    modules: modules.map(m => ({
      ...m,
      moduleId: `${stage}_${m.moduleId}`,
      estimatedMinutes: 15 + Math.floor(Math.random() * 10),
      pointsReward: 50 + stageIndex * 10,
      unlockCondition: stageIndex === 0 ? 'start' : `complete_${stages[stageIndex - 1]}_vocabulary`,
    })),
  }));
};

// Onboarding Component
const Onboarding = ({ onComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(2); // Skip step 1 — English is the only primary language
  const [primaryLanguage, setPrimaryLanguage] = useState('en'); // Auto-select English
  const [targetLanguage, setTargetLanguage] = useState('');
  const [learningRatio, setLearningRatio] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Primary Language Selection
  const renderPrimaryLanguage = () => (
    <div className="onboarding-step">
      <h2>What is your native language?</h2>
      <p className="step-subtitle">Select the language you're most comfortable with</p>
      
      <div className="language-grid">
        {LANGUAGES.PRIMARY.map(lang => (
          <button
            key={lang.code}
            className={`language-card ${primaryLanguage === lang.code ? 'selected' : ''}`}
            onClick={() => setPrimaryLanguage(lang.code)}
          >
            <span className="language-flag">{lang.flag}</span>
            <span className="language-name">{lang.name}</span>
          </button>
        ))}
      </div>
      
      <button
        className="btn-primary"
        disabled={!primaryLanguage}
        onClick={() => setStep(2)}
      >
        Continue
      </button>
    </div>
  );

  // Step 2: Target Language Selection
  const renderTargetLanguage = () => (
    <div className="onboarding-step">
      <h2>What do you want to learn?</h2>
      <p className="step-subtitle">Choose a language to learn</p>
      
      <div className="language-grid target-grid">
        {LANGUAGES.TARGET.filter(lang => lang.code !== primaryLanguage).map(lang => (
          <button
            key={lang.code}
            className={`language-card ${targetLanguage === lang.code ? 'selected' : ''}`}
            onClick={() => setTargetLanguage(lang.code)}
          >
            <span className="language-flag">{lang.flag}</span>
            <span className="language-name">{lang.name}</span>
          </button>
        ))}
      </div>
      
      <div className="step-buttons">
        <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
        <button
          className="btn-primary"
          disabled={!targetLanguage}
          onClick={() => setStep(3)}
        >
          Continue
        </button>
      </div>
    </div>
  );

  // Step 3: Learning Ratio Slider
  const renderLearningRatio = () => (
    <div className="onboarding-step">
      <h2>How do you want to learn?</h2>
      <p className="step-subtitle">Adjust your learning to practice ratio</p>
      
      <div className="ratio-slider-container">
        <div className="ratio-labels">
          <span>Learning</span>
          <span>Practice</span>
        </div>
        
        <input
          type="range"
          min="10"
          max="90"
          value={learningRatio}
          onChange={(e) => setLearningRatio(Number(e.target.value))}
          className="ratio-slider"
        />
        
        <div className="ratio-display">
          <div className="ratio-value">
            <span className="ratio-number">{learningRatio}%</span>
            <span className="ratio-type">Learning</span>
          </div>
          <div className="ratio-divider">:</div>
          <div className="ratio-value">
            <span className="ratio-number">{100 - learningRatio}%</span>
            <span className="ratio-type">Practice</span>
          </div>
        </div>
        
        {learningRatio === 70 && (
          <div className="ratio-tooltip">
            <span className="tooltip-icon">💡</span>
            <span>Best for beginners - focuses on building foundation</span>
          </div>
        )}
      </div>
      
      <div className="step-buttons">
        <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
        <button
          className="btn-primary"
          disabled={loading}
          onClick={handleComplete}
        >
          {loading ? 'Creating your roadmap...' : 'Start Learning'}
        </button>
      </div>
    </div>
  );

  const handleComplete = async () => {
    if (!user) {
      setError('Please log in first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create user profile
      await createLanguageUser(user.$id, {
        primaryLanguage,
        targetLanguage,
        learningRatio,
      });

      // Generate AI roadmap (with fallback for rate limiting)
      const primaryLang = LANGUAGES.PRIMARY.find(l => l.code === primaryLanguage);
      const targetLang = LANGUAGES.TARGET.find(l => l.code === targetLanguage);
      
      let roadmap;
      try {
        roadmap = await generateRoadmap(primaryLang.name, targetLang.name);
      } catch (aiError) {
        console.warn('AI generation failed, using fallback roadmap:', aiError);
        // Create a basic fallback roadmap
        roadmap = createFallbackRoadmap(targetLang.name);
      }
      
      // Save roadmap to Appwrite
      await saveRoadmap(user.$id, primaryLanguage, targetLanguage, roadmap);
      
      onComplete({
        primaryLanguage,
        targetLanguage,
        learningRatio,
        roadmap,
      });
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Failed to create your learning path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-progress">
        <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}>1</div>
        <div className="progress-line"></div>
        <div className={`progress-dot ${step >= 3 ? 'active' : ''}`}>2</div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {step === 1 && renderPrimaryLanguage()}
      {step === 2 && renderTargetLanguage()}
      {step === 3 && renderLearningRatio()}
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ userData, onStartLesson, onStartPractice, onContinue }) => {
  const primaryLang = LANGUAGES.PRIMARY.find(l => l.code === userData.primaryLanguage);
  const targetLang = LANGUAGES.TARGET.find(l => l.code === userData.targetLanguage);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [recentPoints, setRecentPoints] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      try {
        const { getAllLessons } = await import('../appwrite/languageLearning');
        const { databases } = await import('../appwrite/config');
        const { Query } = await import('appwrite');
        const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const POINTS_ID = import.meta.env.VITE_LANG_USER_POINTS_COLLECTION_ID;

        const lessons = await getAllLessons(user.$id);
        setCompletedLessons(lessons || []);

        try {
          const pts = await databases.listDocuments(DB_ID, POINTS_ID, [
            Query.equal('userId', user.$id),
            Query.orderDesc('createdAt'),
            Query.limit(10),
          ]);
          setRecentPoints(pts.documents || []);
        } catch {
          // points collection may not exist yet
        }
      } catch (err) {
        console.error('Error loading history:', err);
      }
    };
    loadHistory();
  }, [user]);

  // Calculate stage progress
  const stageNames = ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'mastery', 'native'];
  const currentStageIndex = stageNames.indexOf(userData.currentStage || 'beginner');
  const progressPercent = ((currentStageIndex + 1) / stageNames.length) * 100;

  const completed = completedLessons.filter(l => l.status === 'completed');
  const inProgress = completedLessons.filter(l => l.status === 'in_progress');
  
  // Remove duplicates: keep only the most recent lesson for each module+stage combination
  const deduplicateByKey = (lessons) => {
    const seen = {};
    return lessons.filter(lesson => {
      const key = `${lesson.moduleId}__${lesson.stageName}`;
      if (seen[key]) return false; // Skip duplicate
      seen[key] = true;
      return true;
    }).sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt)); // Most recent first
  };
  
  const uniqueCompleted = deduplicateByKey(completed);
  const uniqueInProgress = deduplicateByKey(inProgress);

  return (
    <div className="language-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="language-pair">
          <span className="flag">{primaryLang?.flag}</span>
          <span className="arrow">→</span>
          <span className="flag">{targetLang?.flag}</span>
        </div>
        <h1>Language Learning</h1>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card xp-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{userData.totalXP || 0}</div>
          <div className="stat-label">Total XP</div>
        </div>
        
        <div className="stat-card streak-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{userData.streakDays || 0}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        
        <div className="stat-card stage-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{userData.currentStage || 'Beginner'}</div>
          <div className="stat-label">Current Level</div>
        </div>

        <div className="stat-card lessons-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{completed.length}</div>
          <div className="stat-label">Lessons Done</div>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-section">
        <h3>Overall Progress</h3>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="progress-label">{Math.round(progressPercent)}% to fluency</div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn-learn" onClick={onStartLesson}>
          <span className="btn-icon">📚</span>
          <span className="btn-text">
            <span className="btn-title">Learn</span>
            <span className="btn-subtitle">New lessons & concepts</span>
          </span>
        </button>
        
        <button className="btn-practice" onClick={onStartPractice}>
          <span className="btn-icon">🎯</span>
          <span className="btn-text">
            <span className="btn-title">Practice</span>
            <span className="btn-subtitle">Review & strengthen</span>
          </span>
        </button>
        
        {onContinue && (
          <button className="btn-continue" onClick={onContinue}>
            <span className="btn-icon">▶️</span>
            <span className="btn-text">
              <span className="btn-title">Continue</span>
              <span className="btn-subtitle">Resume where you left off</span>
            </span>
          </button>
        )}
      </div>

      {/* In Progress Lessons */}
      {uniqueInProgress.length > 0 && (
        <div className="history-section">
          <h3>⏳ In Progress</h3>
          <div className="lesson-history-list">
            {uniqueInProgress.map(lesson => (
              <div key={lesson.$id} className="lesson-history-item in-progress">
                <div className="lesson-history-info">
                  <span className="lesson-history-name">{lesson.moduleName || lesson.moduleId}</span>
                  <span className="lesson-history-stage">{lesson.stageName}</span>
                </div>
                <div className="lesson-history-meta">
                  <span className="lesson-history-section">📍 {lesson.lastSection || 'introduction'}</span>
                  <span className="lesson-history-status in-progress-badge">In Progress</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Lessons */}
      {uniqueCompleted.length > 0 && (
        <div className="history-section">
          <h3>✅ Completed Lessons ({uniqueCompleted.length})</h3>
          <div className="lesson-history-list">
            {uniqueCompleted.slice().reverse().map(lesson => (
              <div key={lesson.$id} className="lesson-history-item completed">
                <div className="lesson-history-info">
                  <span className="lesson-history-name">{lesson.moduleName || lesson.moduleId}</span>
                  <span className="lesson-history-stage">{lesson.stageName}</span>
                </div>
                <div className="lesson-history-meta">
                  {lesson.score > 0 && (
                    <span className="lesson-history-score">
                      {lesson.score >= 100 ? '🌟' : lesson.score >= 80 ? '✅' : '📚'} {lesson.score}%
                    </span>
                  )}
                  <span className="lesson-history-status completed-badge">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent XP */}
      {recentPoints.length > 0 && (
        <div className="history-section">
          <h3>⭐ Recent XP</h3>
          <div className="xp-history-list">
            {recentPoints.map(pt => (
              <div key={pt.$id} className="xp-history-item">
                <span className="xp-amount">+{pt.points} XP</span>
                <span className="xp-reason">{pt.reason}</span>
                <span className="xp-date">{new Date(pt.createdAt || pt.$createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Tip */}
      <div className="daily-tip">
        <span className="tip-icon">💡</span>
        <p>Tip: Review your flashcards before bed for better retention!</p>
      </div>
    </div>
  );
};

// Main Language Learning Component
const LanguageLearning = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkUserStatus();
  }, [user]);

  const checkUserStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      // Check if user has language learning profile
      const { getLanguageUser, getAllLessons } = await import('../appwrite/languageLearning');
      const profile = await getLanguageUser(user.$id);
      
      if (profile) {
        setUserData(profile);
        setShowOnboarding(false);
      } else {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setShowOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = (data) => {
    setUserData({
      primaryLanguage: data.primaryLanguage,
      targetLanguage: data.targetLanguage,
      learningRatio: data.learningRatio,
      totalXP: 0,
      currentStage: 'beginner',
      streakDays: 0,
    });
    setShowOnboarding(false);
  };

  const handleStartLesson = () => {
    // Navigate to lesson selection
    navigate('/language-learning/lessons');
  };

  const handleStartPractice = () => {
    // Navigate to practice selection
    navigate('/language-learning/practice');
  };

  const handleContinue = async () => {
    try {
      const { getAllLessons, getRoadmap } = await import('../appwrite/languageLearning');
      
      const [allLessons, roadmapData] = await Promise.all([
        getAllLessons(user.$id),
        getRoadmap(user.$id),
      ]);

      // Priority 1: Resume the MOST RECENT in-progress lesson
      // Sort by lastSection update time (most recent first)
      const inProgressLessons = allLessons?.filter(l => l.status === 'in_progress') || [];
      if (inProgressLessons.length > 0) {
        // Get the most recently updated lesson
        const mostRecent = inProgressLessons.sort((a, b) => 
          new Date(b.$updatedAt || b.$createdAt) - new Date(a.$updatedAt || a.$createdAt)
        )[0];
        
        console.log('[Continue] Resuming in-progress lesson:', mostRecent.moduleId, mostRecent.stageName);
        navigate(`/language-learning/lessons/${encodeURIComponent(mostRecent.moduleId)}/${encodeURIComponent(mostRecent.stageName)}`);
        return;
      }

      // Priority 2: Find next module in roadmap that hasn't been started
      // Start from the user's current stage, not from the beginning
      if (roadmapData?.roadmap) {
        const roadmap = typeof roadmapData.roadmap === 'string'
          ? JSON.parse(roadmapData.roadmap)
          : roadmapData.roadmap;

        const completedIds = new Set(
          allLessons?.filter(l => l.status === 'completed').map(l => `${l.moduleId}__${l.stageName}`) || []
        );

        // Find the current stage index
        const currentStage = userData?.currentStage || 'beginner';
        let startStageIndex = roadmap.findIndex(s => s.stageId === currentStage);
        if (startStageIndex === -1) startStageIndex = 0; // Fallback to first stage

        // Search from current stage onwards
        for (let stageIdx = startStageIndex; stageIdx < roadmap.length; stageIdx++) {
          const stage = roadmap[stageIdx];
          for (const module of (stage.modules || [])) {
            const key = `${module.moduleId}__${stage.stageId}`;
            if (!completedIds.has(key)) {
              console.log('[Continue] Next uncompleted module:', module.moduleId, stage.stageId);
              navigate(`/language-learning/lessons/${encodeURIComponent(module.moduleId)}/${encodeURIComponent(stage.stageId)}`);
              return;
            }
          }
        }
      }

      // Fallback: go to lesson selection
      console.log('[Continue] No in-progress or uncompleted lessons, going to lesson selection');
      navigate('/language-learning/lessons');
    } catch (error) {
      console.error('Error resuming lesson:', error);
      navigate('/language-learning/lessons');
    }
  };


  if (loading) {
    return (
      <div className="language-loading">
        <div className="loading-spinner"></div>
        <p>Loading your learning path...</p>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="language-learning-container">
      <Dashboard
        userData={userData}
        onStartLesson={handleStartLesson}
        onStartPractice={handleStartPractice}
        onContinue={handleContinue}
      />
    </div>
  );
};

export default LanguageLearning;