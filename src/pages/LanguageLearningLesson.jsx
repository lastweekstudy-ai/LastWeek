import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateLesson, generateFlashcards, generateMCQ } from '../services/languageAI';
import { getLanguageUser, saveLessonProgress, addUserPoints, LANGUAGES } from '../appwrite/languageLearning';
import './LanguageLearningLesson.css';

const LanguageLearningLesson = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { moduleId, stageId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [currentSection, setCurrentSection] = useState('introduction');
  const [masteryScore, setMasteryScore] = useState(0);
  const [masteryAnswers, setMasteryAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadLesson();
  }, [moduleId, stageId]);

  const loadLesson = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get user data
      const profile = await getLanguageUser(user.$id);
      setUserData(profile);
      
      if (!profile) {
        navigate('/language-learning');
        return;
      }
      
      // Get language names
      const primaryLang = LANGUAGES.PRIMARY.find(l => l.code === profile.primaryLanguage);
      const targetLang = LANGUAGES.TARGET.find(l => l.code === profile.targetLanguage);
      
      // Generate lesson using AI
      const moduleName = moduleId?.replace(/-/g, ' ') || 'Vocabulary';
      const stageName = stageId || profile.currentStage || 'beginner';
      
      const lessonData = await generateLesson(
        primaryLang?.name || 'English',
        targetLang?.name || 'Spanish',
        stageName,
        moduleName
      );
      
      setLesson(lessonData);
      setCurrentSection('introduction');
    } catch (err) {
      console.error('Error loading lesson:', err);
      setError('Failed to load lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex, answer) => {
    setMasteryAnswers(prev => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const checkAnswers = () => {
    if (!lesson?.masteryCheck) return;
    
    let correct = 0;
    lesson.masteryCheck.forEach((q, i) => {
      if (masteryAnswers[i] === q.correctAnswer) {
        correct++;
      }
    });
    
    const score = Math.round((correct / lesson.masteryCheck.length) * 100);
    setMasteryScore(score);
    setShowResults(true);
    
    // Save progress if passed
    if (score >= 80) {
      saveProgress(score);
    }
  };

  const saveProgress = async (score) => {
    if (!user) return;
    
    try {
      // Save lesson progress
      await saveLessonProgress(user.$id, {
        moduleId: moduleId || 'vocabulary',
        stageName: stageId || 'beginner',
        moduleName: moduleId?.replace(/-/g, ' ') || 'Vocabulary',
        status: 'completed',
        score,
      });
      
      // Add XP points
      const xpEarned = score >= 100 ? 25 : 15; // 25 for perfect, 15 for passing
      await addUserPoints(user.$id, xpEarned, `Completed lesson: ${moduleId}`);
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const handleRetry = () => {
    setMasteryAnswers({});
    setMasteryScore(0);
    setShowResults(false);
    setCurrentSection('masteryCheck');
  };

  const handleContinue = () => {
    navigate('/language-learning');
  };

  const renderSection = () => {
    if (!lesson) return null;
    
    switch (currentSection) {
      case 'introduction':
        return (
          <div className="lesson-section">
            <h3>📖 Introduction</h3>
            <p>{typeof lesson.introduction === 'string' ? lesson.introduction : JSON.stringify(lesson.introduction)}</p>
            <button className="btn-next" onClick={() => setCurrentSection('coreContent')}>
              Start Learning →
            </button>
          </div>
        );
        
      case 'coreContent':
        return (
          <div className="lesson-section">
            <h3>📚 Core Content</h3>
            <div className="content-text">
              <p>{typeof lesson.coreContent === 'string' ? lesson.coreContent : JSON.stringify(lesson.coreContent)}</p>
            </div>
            
            {lesson.examples && lesson.examples.length > 0 && (
              <div className="examples-section">
                <h4>Examples:</h4>
                {lesson.examples.map((example, i) => (
                  <div key={i} className="example-card">
                    <span className="example-number">{i + 1}</span>
                    <p>{typeof example === 'string' ? example : JSON.stringify(example)}</p>
                  </div>
                ))}
              </div>
            )}
            
            <button className="btn-next" onClick={() => setCurrentSection('miniPractice')}>
              Continue to Practice →
            </button>
          </div>
        );
        
      case 'miniPractice':
        return (
          <div className="lesson-section">
            <h3>✏️ Quick Practice</h3>
            {lesson.miniPractice && lesson.miniPractice.length > 0 ? (
              <div className="mini-practice">
                {lesson.miniPractice.map((practice, i) => (
                  <div key={i} className="practice-item">
                    <p>{typeof practice === 'string' ? practice : (practice.question || JSON.stringify(practice))}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No mini practice available for this lesson.</p>
            )}
            
            <button className="btn-next" onClick={() => setCurrentSection('summary')}>
              See Summary →
            </button>
          </div>
        );
        
      case 'summary':
        return (
          <div className="lesson-section">
            <h3>📝 Summary</h3>
            <p>{typeof lesson.summary === 'string' ? lesson.summary : JSON.stringify(lesson.summary)}</p>
            
            <button className="btn-next" onClick={() => setCurrentSection('masteryCheck')}>
              Take Mastery Check →
            </button>
          </div>
        );
        
      case 'masteryCheck':
        return (
          <div className="lesson-section mastery-section">
            <h3>🎯 Mastery Check</h3>
            <p className="mastery-instructions">
              Answer at least 2 out of 3 questions correctly to pass (80%)
            </p>
            
            {lesson.masteryCheck && lesson.masteryCheck.map((q, i) => {
                const questionText = typeof q === 'string' ? q : (q.question || JSON.stringify(q));
                const options = typeof q === 'string' ? [] : (q.options || []);
                const correctAnswer = typeof q === 'string' ? '' : (q.correctAnswer || '');
                
                return (
                  <div key={i} className="mastery-question">
                    <p className="question-text">{i + 1}. {questionText}</p>
                    <div className="options">
                      {options.map((option, j) => (
                        <button
                          key={j}
                          className={`option-btn ${masteryAnswers[i] === option ? 'selected' : ''} ${
                            showResults 
                              ? (option === q.correctAnswer 
                                  ? 'correct' 
                                  : (masteryAnswers[i] === option ? 'incorrect' : ''))
                              : ''
                          }`}
                          onClick={() => !showResults && handleAnswer(i, option)}
                          disabled={showResults}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            
            {!showResults ? (
              <button 
                className="btn-submit" 
                onClick={checkAnswers}
                disabled={Object.keys(masteryAnswers).length < 3}
              >
                Submit Answers
              </button>
            ) : (
              <div className="results-section">
                <div className={`score-display ${masteryScore >= 80 ? 'passed' : 'failed'}`}>
                  <span className="score-label">Score:</span>
                  <span className="score-value">{masteryScore}%</span>
                </div>
                
                {masteryScore >= 80 ? (
                  <div className="pass-message">
                    <span className="pass-icon">🎉</span>
                    <p>Congratulations! You've passed this lesson.</p>
                    <button className="btn-continue" onClick={handleContinue}>
                      Continue to Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="fail-message">
                    <span className="fail-icon">📚</span>
                    <p>Keep practicing! Review the lesson and try again.</p>
                    <button className="btn-retry" onClick={handleRetry}>
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="lesson-loading">
        <div className="loading-spinner"></div>
        <p>Preparing your lesson...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lesson-error">
        <p>{error}</p>
        <button onClick={loadLesson}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="lesson-container">
      {/* Header */}
      <div className="lesson-header">
        <button className="btn-back" onClick={() => navigate('/language-learning')}>
          ← Back
        </button>
        <h2>{moduleId?.replace(/-/g, ' ') || 'Vocabulary'} - {stageId || 'Beginner'}</h2>
        <div className="lesson-progress">
          <div className="progress-steps">
            {['intro', 'content', 'practice', 'summary', 'check'].map((step, i) => (
              <div 
                key={step}
                className={`progress-step ${
                  ['introduction', 'coreContent', 'miniPractice', 'summary', 'masteryCheck'].includes(currentSection)
                    ? (i <= ['introduction', 'coreContent', 'miniPractice', 'summary', 'masteryCheck'].indexOf(currentSection) ? 'completed' : '')
                    : ''
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="lesson-content">
        {renderSection()}
      </div>
    </div>
  );
};

export default LanguageLearningLesson;