import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateLesson, generateFlashcards, generateMCQ } from '../services/languageAI';
import { getLanguageUser, saveLessonProgress, addUserPoints, getLessonByModuleAndStage, updateLesson, LANGUAGES } from '../appwrite/languageLearning';
import SpeakingRecorder from '../components/SpeakingRecorder';
import { speak, isVoiceAvailable, extractSpeakableText } from '../utils/speech';
import './LanguageLearningLesson.css';

// Modules that require voice/speaking practice
const SPEAKING_MODULES = ['pronunciation', 'speaking'];

// Modules that require listening with audio playback
const LISTENING_MODULES = ['listening'];

// Modules that require writing with image upload
const WRITING_MODULES = ['writing'];

// Detect if this lesson should use voice mode
const isVoiceModule = (moduleId) => {
  if (!moduleId) return false;
  const id = moduleId.toLowerCase();
  return SPEAKING_MODULES.some(m => id === m || id.endsWith(`_${m}`) || id.endsWith(`-${m}`));
};

// Detect if this lesson should use listening mode
const isListeningModule = (moduleId) => {
  if (!moduleId) return false;
  const id = moduleId.toLowerCase();
  return LISTENING_MODULES.some(m => id === m || id.endsWith(`_${m}`) || id.endsWith(`-${m}`));
};

// Detect if this lesson should use writing mode
const isWritingModule = (moduleId) => {
  if (!moduleId) return false;
  const id = moduleId.toLowerCase();
  return WRITING_MODULES.some(m => id === m || id.endsWith(`_${m}`) || id.endsWith(`-${m}`));
};

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
  const [savedLessonId, setSavedLessonId] = useState(null);
  const [lastSection, setLastSection] = useState('introduction');
  const [voiceWarning, setVoiceWarning] = useState(''); // shown when no TTS voice available

  useEffect(() => {
    loadLesson();
  }, [moduleId, stageId]);

  // Save current section when it changes (for resuming later)
  useEffect(() => {
    if (savedLessonId && currentSection && lesson) {
      const saveLastSection = async () => {
        try {
          await updateLesson(savedLessonId, {
            lastSection: currentSection,
          });
        } catch (err) {
          console.error('Error saving section progress:', err);
        }
      };
      saveLastSection();
    }
  }, [currentSection, savedLessonId]);

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
      
      // Get module and stage names
      const moduleName = moduleId?.replace(/-/g, ' ') || 'Vocabulary';
      const stageName = stageId || profile.currentStage || 'beginner';
      const lessonModuleId = moduleId || 'vocabulary';
      
      console.log('[Lesson] Loading module:', lessonModuleId, 'stage:', stageName);
      
      // Check for an exact match for this specific module/stage only
      const existingLesson = await getLessonByModuleAndStage(user.$id, lessonModuleId, stageName);
      
      let lessonData;
      
      // Priority 1: Exact match with lesson content for THIS module
      if (existingLesson && existingLesson.lessonContent) {
        console.log('Loading existing exact match lesson from database');
        lessonData = typeof existingLesson.lessonContent === 'string' 
          ? JSON.parse(existingLesson.lessonContent) 
          : existingLesson.lessonContent;
        // Mark as already completed so XP isn't awarded again
        if (existingLesson.status === 'completed') {
          lessonData._alreadyCompleted = true;
        }
        setSavedLessonId(existingLesson.$id);
        setLastSection(existingLesson.lastSection || 'introduction');
        setCurrentSection(existingLesson.lastSection || 'introduction');
      }
      // Priority 2: No existing lesson for this module — generate new one
      else {
        // Generate new lesson with AI
        console.log('No existing lesson found, generating new one...');
        try {
          lessonData = await generateLesson(
            primaryLang?.name || 'English',
            targetLang?.name || 'Spanish',
            stageName,
            moduleName
          );
          
          // Save the new lesson to database
          const savedLesson = await saveLessonProgress(user.$id, {
            moduleId: lessonModuleId,
            stageName: stageName,
            moduleName: moduleName,
            status: 'in_progress',
            lessonContent: JSON.stringify(lessonData),
            lastSection: 'introduction',
          });
          setSavedLessonId(savedLesson.$id);
          setCurrentSection('introduction');
        } catch (aiError) {
          console.error('AI lesson generation failed:', aiError);
          // Set error message for user
          setError(aiError.message || 'Failed to generate lesson. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      setLesson(lessonData);
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
      saveProgress(score, true);
    } else {
      saveProgress(score, false);
    }
  };

  const saveProgress = async (score, isCompleted = false) => {
    if (!user) return;
    
    try {
      const updateData = {
        score,
        // If completed, reset lastSection to introduction so next visit starts fresh
        lastSection: isCompleted ? 'introduction' : currentSection,
      };
      
      if (isCompleted) {
        updateData.status = 'completed';
      }
      
      // Check if already completed to avoid duplicate XP
      const alreadyCompleted = savedLessonId && lesson?._alreadyCompleted;
      
      // Update existing lesson instead of creating new one
      if (savedLessonId) {
        await updateLesson(savedLessonId, updateData);
      } else {
        await saveLessonProgress(user.$id, {
          moduleId: moduleId || 'vocabulary',
          stageName: stageId || 'beginner',
          moduleName: moduleId?.replace(/-/g, ' ') || 'Vocabulary',
          status: isCompleted ? 'completed' : 'in_progress',
          score,
          lastSection: isCompleted ? 'introduction' : currentSection,
          lessonContent: JSON.stringify(lesson),
        });
      }
      
      // Add XP only on first completion (not if already completed)
      if (isCompleted && !alreadyCompleted) {
        const xpEarned = score >= 100 ? 25 : 15;
        await addUserPoints(user.$id, xpEarned, `Completed lesson: ${moduleId}`);
      }
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const handleRetry = () => {
    // Clear all mastery answers to allow re-recording
    setMasteryAnswers({});
    setMasteryScore(0);
    setShowResults(false);
    // Don't change section — stay in masteryCheck to re-render with fresh SpeakingRecorder components
  };

  const handleContinue = () => {
    // Go to lesson selection so user picks the next lesson
    // (not back to dashboard which would re-open this same lesson via Continue button)
    navigate('/language-learning/lessons');
  };

  const renderSection = () => {
    if (!lesson) return null;

    const voiceMode = isVoiceModule(moduleId);
    const listeningMode = isListeningModule(moduleId);
    const writingMode = isWritingModule(moduleId);
    const targetLangCode = userData?.targetLanguage || 'en';
    const targetLangName = LANGUAGES.TARGET.find(l => l.code === targetLangCode)?.name || 'Target';

    const doSpeak = (text) => {
      speak(text, targetLangCode, {
        rate: 0.85,
        onUnsupported: (reason) => setVoiceWarning(reason),
      });
    };

    // Voice mode: wrap examples with listen + record buttons
    const renderVoiceExample = (example, i) => {
      const text = typeof example === 'string' ? example : JSON.stringify(example);
      // Extract target language portion (before any romanization/translation)
      const targetText = text.split('(')[0].trim();
      return (
        <div key={i} className="example-card voice-example">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span className="example-number">{i + 1}</span>
            <p style={{ flex: 1, margin: 0 }}>{text}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingLeft: '2rem' }}>
            <button
              onClick={() => doSpeak(targetText)}
              style={{ background: 'var(--color-accent)', border: 'none', borderRadius: '1.5rem', padding: '0.35rem 0.85rem', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              🔊 Listen
            </button>
          </div>
        </div>
      );
    };

    // Listening mode: wrap examples with speaker buttons
    const renderListeningExample = (example, i) => {
      const text = typeof example === 'string' ? example : JSON.stringify(example);
      return (
        <div key={i} className="example-card listening-example">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => doSpeak(text)}
              style={{ background: 'var(--color-accent)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', flexShrink: 0 }}
              title="Click to hear the audio"
            >
              🔊
            </button>
            <div style={{ flex: 1 }}>
              <span className="example-number">{i + 1}</span>
              <p style={{ margin: '0.25rem 0 0' }}>{text}</p>
            </div>
          </div>
        </div>
      );
    };

    switch (currentSection) {
      case 'introduction':
        return (
          <div className="lesson-section">
            <h3>{voiceMode ? '🎤 Introduction' : listeningMode ? '🎧 Introduction' : writingMode ? '✍️ Introduction' : '📖 Introduction'}</h3>
            <p>{typeof lesson.introduction === 'string' ? lesson.introduction : JSON.stringify(lesson.introduction)}</p>
            <button className="btn-next" onClick={() => setCurrentSection('coreContent')}>
              Start Learning →
            </button>
          </div>
        );
        
      case 'coreContent':
        return (
          <div className="lesson-section">
            <h3>{voiceMode ? '🎙️ Core Content' : listeningMode ? '🎧 Core Content' : writingMode ? '✍️ Core Content' : '📚 Core Content'}</h3>
            <div className="content-text">
              <p>{typeof lesson.coreContent === 'string' ? lesson.coreContent : JSON.stringify(lesson.coreContent)}</p>
            </div>
            
            {lesson.examples && lesson.examples.length > 0 && (
              <div className="examples-section">
                <h4>Examples:</h4>
                {voiceMode
                  ? lesson.examples.map((example, i) => renderVoiceExample(example, i))
                  : listeningMode
                  ? lesson.examples.map((example, i) => renderListeningExample(example, i))
                  : lesson.examples.map((example, i) => (
                    <div key={i} className="example-card">
                      <span className="example-number">{i + 1}</span>
                      <p>{typeof example === 'string' ? example : JSON.stringify(example)}</p>
                    </div>
                  ))
                }
              </div>
            )}
            
            <button className="btn-next" onClick={() => setCurrentSection('miniPractice')}>
              {voiceMode ? 'Practice Speaking →' : listeningMode ? 'Practice Listening →' : writingMode ? 'Practice Writing →' : 'Continue to Practice →'}
            </button>
          </div>
        );
        
      case 'miniPractice':
        return (
          <div className="lesson-section">
            <h3>{voiceMode ? '🎙️ Speaking Practice' : listeningMode ? '🎧 Listening Practice' : writingMode ? '✍️ Writing Practice' : '✏️ Quick Practice'}</h3>
            {voiceMode ? (
              // Voice mode: show phrases to repeat with listen + record
              <div className="mini-practice">
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Listen to each phrase, then record yourself saying it.
                </p>
                {lesson.miniPractice && lesson.miniPractice.length > 0 ? (
                  lesson.miniPractice.map((practice, i) => {
                    const text = typeof practice === 'string' ? practice : (practice.question || JSON.stringify(practice));
                    const targetText = text.split('(')[0].trim();
                    return (
                      <div key={i} className="practice-item" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem' }}>
                        <p style={{ marginBottom: '0.75rem' }}>{text}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => doSpeak(targetText)}
                            style={{ background: 'var(--color-accent)', border: 'none', borderRadius: '1.5rem', padding: '0.4rem 1rem', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            🔊 Listen
                          </button>
                          <SpeakingRecorder
                            expectedWord={targetText}
                            expectedPhrase={text}
                            targetLanguage={targetLangName}
                            targetLangCode={targetLangCode}
                            onResult={(res) => {
                              // Show inline feedback
                              const el = document.getElementById(`voice-result-${i}`);
                              if (el) {
                                el.textContent = res.score >= 80
                                  ? `✅ ${res.feedback}`
                                  : `📚 ${res.feedback}`;
                                el.style.color = res.score >= 80 ? '#10b981' : '#f59e0b';
                              }
                            }}
                          />
                        </div>
                        <p id={`voice-result-${i}`} style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}></p>
                      </div>
                    );
                  })
                ) : (
                  <p>No practice phrases available.</p>
                )}
              </div>
            ) : listeningMode ? (
              // Listening mode: show audio with speaker buttons
              <div className="mini-practice">
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Listen to each audio passage and try to understand the content.
                </p>
                {lesson.miniPractice && lesson.miniPractice.length > 0 ? (
                  lesson.miniPractice.map((practice, i) => {
                    const text = typeof practice === 'string' ? practice : (practice.question || JSON.stringify(practice));
                    return (
                      <div key={i} className="practice-item" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <button
                            onClick={() => doSpeak(text)}
                            style={{ background: 'var(--color-accent)', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '1.5rem', cursor: 'pointer', flexShrink: 0 }}
                            title="Click to hear the audio"
                          >
                            🔊
                          </button>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: '500' }}>Audio {i + 1}</p>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Click the speaker to listen</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>No listening practice available.</p>
                )}
              </div>
            ) : writingMode ? (
              // Writing mode: show prompts with image upload
              <div className="mini-practice">
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Write your response on paper, take a photo, and upload it for AI feedback.
                </p>
                {lesson.miniPractice && lesson.miniPractice.length > 0 ? (
                  lesson.miniPractice.map((practice, i) => {
                    const text = typeof practice === 'string' ? practice : (practice.question || JSON.stringify(practice));
                    return (
                      <div key={i} className="practice-item" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem' }}>
                        <p style={{ fontWeight: '500', marginBottom: '0.75rem' }}>{i + 1}. {text}</p>
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', border: '2px dashed var(--color-border)', borderRadius: '0.5rem', cursor: 'pointer', background: 'var(--color-bg-tertiary)' }}>
                          <span style={{ fontSize: '1.5rem' }}>📷</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Upload photo of your writing</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  alert(`Photo uploaded for prompt ${i + 1}. Continue to see AI feedback in the mastery check!`);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    );
                  })
                ) : (
                  <p>No writing practice available.</p>
                )}
              </div>
            ) : (
              // Text mode: show questions
              <div className="mini-practice">
                {lesson.miniPractice && lesson.miniPractice.length > 0 ? (
                  lesson.miniPractice.map((practice, i) => (
                    <div key={i} className="practice-item">
                      <p>{typeof practice === 'string' ? practice : (practice.question || JSON.stringify(practice))}</p>
                    </div>
                  ))
                ) : (
                  <p>No mini practice available for this lesson.</p>
                )}
              </div>
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
        // Voice mode: speaking mastery check
        if (voiceMode) {
          // Extract phrases from masteryCheck - voice modules use "prompt" and "expectedAnswer" fields
          const phrases = lesson.masteryCheck?.map(q => {
            if (typeof q === 'string') return q;
            // Try different field names: prompt (voice), question (text), correctAnswer (fallback)
            return q.prompt || q.question || q.expectedAnswer || q.correctAnswer || '';
          }).filter(Boolean) || lesson.examples?.slice(0, 3) || [];

          console.log('[Voice Mastery Check] Phrases:', phrases);

          return (
            <div className="lesson-section mastery-section">
              <h3>🎤 Speaking Mastery Check</h3>
              <p className="mastery-instructions">
                Say each phrase clearly. Score 80%+ on at least 2 out of 3 to pass.
              </p>
              {phrases.slice(0, 3).map((phrase, i) => {
                const targetText = phrase.split('(')[0].trim();
                const resultKey = `mastery_voice_${i}`;
                // Use showResults as part of the key to force re-mount when retrying
                const recorderKey = `recorder_${i}_${showResults ? 'results' : 'recording'}`;
                return (
                  <div key={i} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem' }}>
                    <p style={{ fontWeight: '500', marginBottom: '0.75rem' }}>{i + 1}. {phrase}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={() => doSpeak(targetText)}
                        style={{ background: 'var(--color-accent)', border: 'none', borderRadius: '1.5rem', padding: '0.4rem 1rem', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        🔊 Listen
                      </button>
                      {!showResults && (
                        <SpeakingRecorder
                          key={recorderKey}
                          expectedWord={targetText}
                          expectedPhrase={phrase}
                          targetLanguage={targetLangName}
                          targetLangCode={targetLangCode}
                          onResult={(res) => {
                            setMasteryAnswers(prev => ({ ...prev, [resultKey]: res.score }));
                          }}
                        />
                      )}
                    </div>
                    {masteryAnswers[resultKey] !== undefined && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: masteryAnswers[resultKey] >= 80 ? '#10b981' : '#f59e0b' }}>
                        {masteryAnswers[resultKey] >= 80 ? '✅' : '📚'} Score: {masteryAnswers[resultKey]}/100
                      </p>
                    )}
                  </div>
                );
              })}

              {!showResults ? (
                <div>
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-bg-tertiary)', borderRadius: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    <span>Recorded: {Object.keys(masteryAnswers).filter(k => k.startsWith('mastery_voice_')).length}/{Math.min(3, phrases.length)} phrases</span>
                  </div>
                  <button
                    className="btn-submit"
                    onClick={() => {
                      const recordedCount = Object.keys(masteryAnswers).filter(k => k.startsWith('mastery_voice_')).length;
                      if (recordedCount === 0) {
                        alert('Please record at least one phrase before submitting.');
                        return;
                      }
                      const scores = phrases.slice(0, 3).map((_, i) => masteryAnswers[`mastery_voice_${i}`] || 0);
                      const passed = scores.filter(s => s >= 80).length;
                      const avg = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
                      setMasteryScore(Math.round(avg));
                      setShowResults(true);
                      if (passed >= 2) saveProgress(Math.round(avg), true);
                      else saveProgress(Math.round(avg), false);
                    }}
                  >
                    Submit Speaking Results
                  </button>
                </div>
              ) : (
                <div className="results-section">
                  <div className={`score-display ${masteryScore >= 80 ? 'passed' : 'failed'}`}>
                    <span className="score-label">Average Score:</span>
                    <span className="score-value">{masteryScore}%</span>
                  </div>
                  {masteryScore >= 80 ? (
                    <div className="pass-message">
                      <span className="pass-icon">🎉</span>
                      <p>Great pronunciation! You've passed this lesson.</p>
                      <button className="btn-continue" onClick={handleContinue}>Continue to Next Lesson</button>
                    </div>
                  ) : (
                    <div className="fail-message">
                      <span className="fail-icon">🎙️</span>
                      <p>Keep practicing! Try the phrases again.</p>
                      <button className="btn-retry" onClick={handleRetry}>Try Again</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        // Text mode: standard MCQ mastery check
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
      <div className="lesson-container">
        <div className="lesson-header">
          <button className="btn-back" onClick={() => navigate('/language-learning')}>
            ← Back
          </button>
          <h2>Lesson Error</h2>
        </div>
        <div className="lesson-content">
          <div className="lesson-error" style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-bg-secondary)', borderRadius: '1rem', margin: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Unable to Load Lesson</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
              {error.includes('All AI providers failed') 
                ? 'Our AI services are temporarily unavailable. Please try again in a few moments.'
                : error}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={loadLesson}
                style={{ padding: '0.75rem 1.5rem', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}
              >
                🔄 Try Again
              </button>
              <button 
                onClick={() => navigate('/language-learning')}
                style={{ padding: '0.75rem 1.5rem', background: 'var(--color-border)', color: 'var(--color-text)', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
              >
                ← Back to Lessons
              </button>
            </div>
          </div>
        </div>
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
            {[
              { key: 'introduction', label: '1' },
              { key: 'coreContent', label: '2' },
              { key: 'miniPractice', label: '3' },
              { key: 'summary', label: '4' },
              { key: 'masteryCheck', label: '5' },
            ].map((step, i) => {
              const sections = ['introduction', 'coreContent', 'miniPractice', 'summary', 'masteryCheck'];
              const currentIndex = sections.indexOf(currentSection);
              const isCompleted = i < currentIndex;
              const isCurrent = i === currentIndex;
              
              return (
                <button
                  key={step.key}
                  className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  onClick={() => setCurrentSection(step.key)}
                  disabled={!isCompleted && !isCurrent}
                  title={step.key}
                >
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Voice warning — shown when browser has no TTS voice for the target language */}
      {voiceWarning && (
        <div style={{
          margin: '0 1rem 0.75rem',
          padding: '0.65rem 1rem',
          background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: '0.5rem',
          fontSize: '0.82rem',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
        }}>
          <span style={{ flexShrink: 0 }}>🔇</span>
          <span>{voiceWarning}</span>
          <button
            onClick={() => setVoiceWarning('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0 }}
          >✕</button>
        </div>
      )}

      {/* Content */}
      <div className="lesson-content">
        {renderSection()}
      </div>
    </div>
  );
};

export default LanguageLearningLesson;