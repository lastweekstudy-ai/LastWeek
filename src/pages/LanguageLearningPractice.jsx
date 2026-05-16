import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Flashcard from '../components/Flashcard';
import SpeakingRecorder from '../components/SpeakingRecorder';
import { speak } from '../utils/geminiSpeech';
import { 
  getLanguageUser, 
  LANGUAGES, 
  PRACTICE_TYPES,
  addUserPoints,
  savePracticeSession,
  getItemsDueForReview,
  saveFlashcardReview
} from '../appwrite/languageLearning';
import { 
  generateMCQ, 
  generateFlashcards, 
  generateReadingPassage,
  evaluateWriting
} from '../services/languageAI';
import './LanguageLearningPractice.css';

const PRACTICE_TYPE_INFO = {
  mcq: { name: 'Multiple Choice', icon: '📝', description: 'Test your knowledge' },
  flashcards: { name: 'Flashcards', icon: '🃏', description: 'Spaced repetition review' },
  typing: { name: 'Typing', icon: '⌨️', description: 'Type in target language' },
  fill_blank: { name: 'Fill in the Blank', icon: '✏️', description: 'Complete the sentence' },
  speaking: { name: 'Speaking', icon: '🎤', description: 'Practice pronunciation' },
  conversation: { name: 'AI Conversation', icon: '💬', description: 'Chat with AI' },
  reading_comprehension: { name: 'Reading', icon: '📖', description: 'Understand passages' },
  writing: { name: 'Writing', icon: '📝', description: 'Write and get feedback' },
  listening: { name: 'Listening', icon: '🎧', description: 'Listen and answer' },
};

// Module-specific practice recommendations
// Each module type has recommended practice types
const MODULE_PRACTICE_MAP = {
  vocabulary: ['mcq', 'flashcards', 'typing', 'fill_blank'],
  pronunciation: ['speaking', 'listening', 'flashcards'],
  speaking: ['speaking', 'conversation', 'listening'],
  listening: ['listening', 'reading_comprehension'],
  reading: ['reading_comprehension', 'mcq', 'fill_blank'],
  writing: ['writing', 'typing'],
  grammar: ['mcq', 'fill_blank', 'typing'],
  sentence_structure: ['fill_blank', 'typing', 'mcq'],
  synonyms_antonyms: ['mcq', 'flashcards', 'typing'],
  idioms_expressions: ['flashcards', 'mcq', 'conversation'],
  cultural_context: ['reading_comprehension', 'conversation', 'mcq'],
};

// Get available practice types for a module
const getAvailablePractices = (moduleId) => {
  const practices = MODULE_PRACTICE_MAP[moduleId] || ['mcq', 'flashcards'];
  return practices.filter(p => PRACTICE_TYPES.includes(p));
};

// ─── Standalone FlashcardPractice component ───────────────────────────────────
// Uses the existing Flashcard component (same as chat mode) — has its own state.
const FlashcardPractice = ({ cards, userData, onRating, onFinish }) => {
  const [index, setIndex] = useState(0);

  if (!cards || cards.length === 0) return null;

  const card = cards[index];
  const targetLangName = LANGUAGES.TARGET.find(l => l.code === userData?.targetLanguage)?.name || 'Target';

  const handleRate = async (confidence) => {
    // Map numeric confidence (1/2/3) to rating string
    const ratingMap = { 1: 'forgot', 2: 'hard', 3: 'easy' };
    await onRating(ratingMap[confidence] || 'hard', index, card);

    if (index < cards.length - 1) {
      setIndex(i => i + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="practice-content flashcard-content">
      <div className="practice-header">
        <h3>🃏 Flashcards — {targetLangName}</h3>
      </div>

      <div className="practice-progress">
        <span>Card {index + 1} of {cards.length}</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
        </div>
      </div>

      {/* Reuse the same Flashcard component as chat mode */}
      <Flashcard
        key={index}
        front={`How do you say "${card.front}" in ${targetLangName}?`}
        back={`${card.back}${card.pronunciation ? `  (${card.pronunciation})` : ''}`}
        onRate={handleRate}
      />

      {card.example && (
        <div className="example-sentence" style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem' }}>
          <em style={{ color: 'var(--color-text-muted)' }}>{card.example}</em>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{card.exampleTranslation}</p>
        </div>
      )}
    </div>
  );
};

const LanguageLearningPractice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [practiceContent, setPracticeContent] = useState(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [dueReviews, setDueReviews] = useState([]);
  // Flashcard state — must be at top level (Rules of Hooks)
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const profile = await getLanguageUser(user.$id);
      setUserData(profile);
      
      // Get items due for review
      const dueItems = await getItemsDueForReview(user.$id);
      setDueReviews(dueItems);
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const startPractice = async (practiceType) => {
    if (!userData) return;
    
    setSelectedPractice(practiceType);
    setPracticeLoading(true);
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
    
    try {
      const primaryLang = LANGUAGES.PRIMARY.find(l => l.code === userData.primaryLanguage);
      const targetLang = LANGUAGES.TARGET.find(l => l.code === userData.targetLanguage);
      
      let content = null;
      
      switch (practiceType) {
        case 'mcq':
          content = await generateMCQ(
            primaryLang?.name || 'English',
            targetLang?.name || 'Spanish',
            'General vocabulary',
            5,
            userData.currentStage || 'beginner'
          );
          break;
          
        case 'flashcards':
          if (dueReviews.length > 0) {
            content = dueReviews.map(r => ({
              ...JSON.parse(r.itemContent),
              reviewId: r.$id,
              successStreak: r.successStreak,
            }));
          } else {
            content = await generateFlashcards(
              primaryLang?.name || 'English',
              targetLang?.name || 'Spanish',
              'Basic vocabulary',
              10,
              userData.currentStage || 'beginner'
            );
          }
          console.log('[Flashcards] Generated content sample:', content?.[0]);
          console.log('[Flashcards] All cards:', content?.map(c => `${c.front} → ${c.back}`));
          break;
          
        case 'reading_comprehension':
          content = await generateReadingPassage(
            primaryLang?.name || 'English',
            targetLang?.name || 'Spanish',
            userData.currentStage || 'beginner',
            'Daily life'
          );
          break;
          
        case 'conversation':
          content = { messages: [] };
          break;

        case 'typing':
          content = await generateFlashcards(
            primaryLang?.name || 'English',
            targetLang?.name || 'Spanish',
            'Basic vocabulary',
            8,
            userData.currentStage || 'beginner'
          );
          break;

        case 'fill_blank':
          content = await generateMCQ(
            primaryLang?.name || 'English',
            targetLang?.name || 'Spanish',
            'Fill in the blank sentences',
            6,
            userData.currentStage || 'beginner'
          );
          break;

        case 'speaking':
          content = await generateFlashcards(
            primaryLang?.name || 'English',
            targetLang?.name || 'Spanish',
            'Common phrases and pronunciation',
            8,
            userData.currentStage || 'beginner'
          );
          break;

        case 'writing':
          content = {
            prompts: [
              `Write 3 sentences in ${targetLang?.name || 'the target language'} about yourself.`,
              `Describe your daily routine in ${targetLang?.name || 'the target language'}.`,
              `Write about your favorite food in ${targetLang?.name || 'the target language'}.`,
            ],
            currentPromptIndex: 0,
          };
          break;

        case 'listening':
          const { generateListeningContent } = await import('../services/languageAI');
          content = await generateListeningContent(
            primaryLang?.name || 'English',
            targetLang?.name || 'Spanish',
            userData.currentStage || 'beginner',
            'Daily life'
          );
          break;
          
        default:
          content = { message: `${practiceType} practice - Under development` };
      }
      
      setPracticeContent(content);
    } catch (err) {
      console.error('Error loading practice:', err);
    } finally {
      setPracticeLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: answer,
    }));
  };

  const handleFlashcardRating = async (rating, cardIndex, card) => {
    if (!card) return;
    try {
      await saveFlashcardReview(user.$id, {
        itemId: card.reviewId || `card_${cardIndex}`,
        itemType: 'flashcard',
        itemContent: {
          front: card.front,
          back: card.back,
          pronunciation: card.pronunciation,
        },
        rating,
        successStreak: card.successStreak || 0,
      });
    } catch (err) {
      console.error('Error saving flashcard review:', err);
    }
  };

  const checkAnswers = () => {
    if (!practiceContent) return;
    
    let correct = 0;
    const total = practiceContent.length || 1;
    
    practiceContent.forEach((item, i) => {
      if (item.correctAnswer && answers[i] === item.correctAnswer) {
        correct++;
      }
    });
    
    const finalScore = Math.round((correct / total) * 100);
    setScore(finalScore);
    setShowResults(true);
    
    // Save practice session
    savePractice();
    
    // Add XP points
    const xpEarned = finalScore >= 80 ? 20 : 10;
    addUserPoints(user.$id, xpEarned, `Completed ${selectedPractice} practice`);
  };

  const savePractice = async () => {
    if (!user || !selectedPractice) return;
    
    try {
      await savePracticeSession(user.$id, {
        practiceType: selectedPractice,
        modulesCovered: ['general'],
        score,
        xpEarned: score >= 80 ? 20 : 10,
        duration: 300, // 5 minutes typical
      });
    } catch (err) {
      console.error('Error saving practice session:', err);
    }
  };

  const nextItem = () => {
    if (currentIndex < (practiceContent?.length || 1) - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      checkAnswers();
    }
  };

  const renderPracticeCard = () => (
    <div className="practice-selection">
      <div className="practice-header">
        <button className="btn-back" onClick={() => navigate('/language-learning')}>
          ← Back
        </button>
        <h2>Choose Practice Type</h2>
      </div>
      
      <div className="practice-grid">
        {PRACTICE_TYPES.map(type => (
          <button
            key={type}
            className="practice-card"
            onClick={() => startPractice(type)}
          >
            <span className="practice-icon">{PRACTICE_TYPE_INFO[type].icon}</span>
            <span className="practice-name">{PRACTICE_TYPE_INFO[type].name}</span>
            <span className="practice-desc">{PRACTICE_TYPE_INFO[type].description}</span>
            {type === 'flashcards' && dueReviews.length > 0 && (
              <span className="due-badge">{dueReviews.length} due</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMCQPractice = () => {
    if (!practiceContent || !practiceContent[currentIndex]) return null;
    
    const question = practiceContent[currentIndex];
    
    return (
      <div className="practice-content">
        <div className="practice-progress">
          <span>Question {currentIndex + 1} of {practiceContent.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIndex + 1) / practiceContent.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="question-section">
          <h3>{question.question}</h3>
          
          <div className="options-grid">
            {question.options?.map((option, i) => (
              <button
                key={i}
                className={`option-button ${answers[currentIndex] === option ? 'selected' : ''} ${
                  showResults 
                    ? (option === question.correctAnswer 
                        ? 'correct' 
                        : (answers[currentIndex] === option ? 'incorrect' : ''))
                    : ''
                }`}
                onClick={() => !showResults && handleAnswer(option)}
                disabled={showResults}
              >
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
          
          {showResults && question.explanation && (
            <div className="explanation">
              <strong>Explanation:</strong> {question.explanation}
            </div>
          )}
        </div>
        
        <div className="practice-actions">
          {!showResults ? (
            <button 
              className="btn-next"
              onClick={nextItem}
              disabled={!answers[currentIndex]}
            >
              {currentIndex < practiceContent.length - 1 ? 'Next →' : 'Finish'}
            </button>
          ) : currentIndex < practiceContent.length - 1 ? (
            <button className="btn-next" onClick={() => setCurrentIndex(prev => prev + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn-finish" onClick={() => navigate('/language-learning')}>
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  };

  const nextFlashcard = () => {
    if (currentIndex < practiceContent.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowFlashcardAnswer(false);
    } else {
      navigate('/language-learning');
    }
  };

  const renderFlashcardPractice = () => {
    if (!practiceContent || !practiceContent[currentIndex]) return null;
    
    const card = practiceContent[currentIndex];
    console.log('[Flashcard render] index:', currentIndex, 'front:', card.front, 'back:', card.back);
    // showFlashcardAnswer is declared at the top of the component (Rules of Hooks)
    
    return (
      <div className="practice-content flashcard-content">
        <div className="practice-progress">
          <span>Card {currentIndex + 1} of {practiceContent.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIndex + 1) / practiceContent.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flashcard">
          <div className="flashcard-front">
            <span className="flashcard-label">Translate to {LANGUAGES.TARGET.find(l => l.code === userData?.targetLanguage)?.name}:</span>
            <h3>{card.front}</h3>
          </div>
          
          {showFlashcardAnswer && (
            <div className="flashcard-back">
              <span className="flashcard-label">{LANGUAGES.TARGET.find(l => l.code === userData?.targetLanguage)?.name} translation:</span>
              {/* Fallback: if back is empty, AI may have put translation in pronunciation */}
              <h3>{card.back || card.pronunciation || '—'}</h3>
              {card.pronunciation && card.back && (
                <p className="pronunciation">{card.pronunciation}</p>
              )}
              {card.example && (
                <div className="example-sentence">
                  <em>{card.example}</em>
                  <p className="translation">{card.exampleTranslation}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flashcard-actions">
          {!showFlashcardAnswer ? (
            <button className="btn-show-answer" onClick={() => setShowFlashcardAnswer(true)}>
              Show Answer
            </button>
          ) : (
            <div className="rating-buttons">
              <p>How well did you know this?</p>
              <div className="rating-options">
                <button 
                  className="rating-btn forgot"
                  onClick={() => {
                    handleFlashcardRating('forgot');
                    nextFlashcard();
                  }}
                >
                  😔 Forgot
                </button>
                <button 
                  className="rating-btn hard"
                  onClick={() => {
                    handleFlashcardRating('hard');
                    nextFlashcard();
                  }}
                >
                  🤔 Hard
                </button>
                <button 
                  className="rating-btn easy"
                  onClick={() => {
                    handleFlashcardRating('easy');
                    nextFlashcard();
                  }}
                >
                  😊 Easy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReadingPractice = () => {
    if (!practiceContent) return null;
    
    return (
      <div className="practice-content reading-content">
        <div className="reading-passage">
          <h3>{practiceContent.title}</h3>
          <p className="passage-text">{practiceContent.content}</p>
        </div>
        
        <div className="reading-questions">
          <h4>Comprehension Questions:</h4>
          {practiceContent.questions?.map((q, i) => (
            <div key={i} className="reading-question">
              <p>{i + 1}. {q.question}</p>
              <input
                type="text"
                placeholder="Your answer..."
                value={answers[i] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                disabled={showResults}
              />
              {showResults && (
                <span className="correct-answer">Correct: {q.answer}</span>
              )}
            </div>
          ))}
        </div>
        
        <div className="practice-actions">
          {!showResults ? (
            <button className="btn-finish" onClick={checkAnswers}>
              Submit Answers
            </button>
          ) : (
            <button className="btn-finish" onClick={() => navigate('/language-learning')}>
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Listening Practice: AI reads script, user answers questions ──────────────
  const renderListeningPractice = () => {
    if (!practiceContent) return null;
    
    const targetLangCode = userData?.targetLanguage || 'en';
    const targetLangName = LANGUAGES.TARGET.find(l => l.code === targetLangCode)?.name || 'Target';

    const doSpeak = (text) => {
      console.log('[Practice] 🔊 Listen button clicked, text:', text.substring(0, 50));
      speak(text, targetLangCode, { rate: 0.85 });
    };

    return (
      <div className="practice-content listening-content">
        <div className="practice-header">
          <h3>🎧 Listening Comprehension</h3>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Listen to the audio and answer the questions
          </p>
        </div>

        {/* Audio Script Section */}
        <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <button
              onClick={() => doSpeak(practiceContent.script)}
              style={{
                background: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Play audio"
            >
              🔊
            </button>
            <div>
              <p style={{ margin: 0, fontWeight: '500' }}>Listen to the passage</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Click the speaker icon to hear the audio
              </p>
            </div>
          </div>

          {/* Difficult Words */}
          {practiceContent.difficultWords && practiceContent.difficultWords.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>📚 Difficult Words:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {practiceContent.difficultWords.map((w, i) => (
                  <div key={i} style={{ padding: '0.5rem', background: 'var(--color-bg-tertiary)', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '500' }}>{w.word}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{w.pronunciation}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{w.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div className="questions-section">
          <h4>Answer the questions:</h4>
          {practiceContent.questions?.map((q, i) => (
            <div key={i} className="question-item" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem' }}>
              <p style={{ fontWeight: '500', marginBottom: '0.75rem' }}>{i + 1}. {q.question}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                {q.options?.map((option, j) => (
                  <button
                    key={j}
                    onClick={() => !showResults && handleAnswer(option)}
                    disabled={showResults}
                    style={{
                      padding: '0.75rem',
                      background: answers[i] === option
                        ? 'var(--color-accent)'
                        : showResults && option === q.correctAnswer
                        ? '#10b981'
                        : showResults && answers[i] === option
                        ? '#ef4444'
                        : 'var(--color-bg-tertiary)',
                      color: answers[i] === option || (showResults && (option === q.correctAnswer || answers[i] === option))
                        ? 'white'
                        : 'var(--color-text-primary)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: showResults ? 'default' : 'pointer',
                      fontWeight: answers[i] === option ? '600' : '400',
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="practice-actions" style={{ marginTop: '1.5rem' }}>
          {!showResults ? (
            <button
              className="btn-submit"
              onClick={checkAnswers}
              disabled={Object.keys(answers).length < (practiceContent.questions?.length || 0)}
              style={{
                padding: '0.75rem 2rem',
                background: Object.keys(answers).length < (practiceContent.questions?.length || 0) ? 'var(--color-text-muted)' : 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: Object.keys(answers).length < (practiceContent.questions?.length || 0) ? 'not-allowed' : 'pointer',
              }}
            >
              Submit Answers
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                {score >= 80 ? '🎉' : '📚'}
              </div>
              <p style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
                Score: {score}%
              </p>
              <button
                className="btn-finish"
                onClick={() => navigate('/language-learning')}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConversationPractice = () => (
    <div className="practice-content conversation-content">
      <div className="conversation-header">
        <button className="btn-back" onClick={() => setSelectedPractice(null)}>
          ← Change Practice
        </button>
        <h3>AI Conversation Partner</h3>
        <p>Chat in {LANGUAGES.TARGET.find(l => l.code === userData?.targetLanguage)?.name}</p>
      </div>
      
      <div className="conversation-messages">
        <p className="conversation-tip">
          💡 Tip: Say "end session" when you want to finish and get feedback
        </p>
      </div>
      
      <div className="conversation-input">
        <input
          type="text"
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e.target.value)}
        />
        <button onClick={() => {
          const input = document.querySelector('.conversation-input input');
          handleSendMessage(input.value);
          input.value = '';
        }}>
          Send
        </button>
      </div>
    </div>
  );

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    // Add user message to conversation
    const newMessages = [
      ...(practiceContent?.messages || []),
      { role: 'user', content: message }
    ];
    
    setPracticeContent(prev => ({
      ...prev,
      messages: newMessages,
    }));
    
    // TODO: Call AI for response
  };

  // ── Typing Practice: type the target language word ──────────────────────────
  const renderTypingPractice = () => {
    if (!practiceContent || !practiceContent[currentIndex]) return null;
    const card = practiceContent[currentIndex];
    const targetLangName = LANGUAGES.TARGET.find(l => l.code === userData?.targetLanguage)?.name || 'Target';
    const isCorrect = answers[currentIndex]?.trim().toLowerCase() === card.back?.trim().toLowerCase();

    return (
      <div className="practice-content">
        <div className="practice-progress">
          <span>Card {currentIndex + 1} of {practiceContent.length}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((currentIndex + 1) / practiceContent.length) * 100}%` }} />
          </div>
        </div>
        <div className="question-section">
          <h3>Type in {targetLangName}:</h3>
          <p className="typing-prompt" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem 0' }}>{card.front}</p>
          {card.pronunciation && <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Hint: {card.pronunciation}</p>}
          <input
            type="text"
            className="typing-input"
            placeholder={`Type the ${targetLangName} word...`}
            value={answers[currentIndex] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            disabled={showResults}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem', borderRadius: '0.5rem', border: '2px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            autoFocus
          />
          {showResults && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', background: isCorrect ? '#10b98120' : '#ef444420' }}>
              {isCorrect ? '✅ Correct!' : `❌ Correct answer: ${card.back}`}
            </div>
          )}
        </div>
        <div className="practice-actions" style={{ marginTop: '1rem' }}>
          {!showResults ? (
            <button className="btn-next" onClick={() => setShowResults(true)} disabled={!answers[currentIndex]}>
              Check Answer
            </button>
          ) : (
            <button className="btn-next" onClick={() => {
              setShowResults(false);
              if (currentIndex < practiceContent.length - 1) setCurrentIndex(i => i + 1);
              else navigate('/language-learning');
            }}>
              {currentIndex < practiceContent.length - 1 ? 'Next →' : 'Finish'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Speaking Practice: record → Groq Whisper → AI pronunciation feedback ──────
  const renderSpeakingPractice = () => {
    if (!practiceContent || !practiceContent[currentIndex]) return null;
    const card = practiceContent[currentIndex];
    const targetLangName = LANGUAGES.TARGET.find(l => l.code === userData?.targetLanguage)?.name || 'Target';
    const targetLangCode = userData?.targetLanguage || 'en';

    const speakWord = () => {
      console.log('[Practice] 🔊 Flashcard speak button clicked');
      speak(card.back, targetLangCode, { rate: 0.85 });
    };

    const result = answers[currentIndex];

    const goNext = () => {
      setAnswers(prev => { const n = {...prev}; delete n[currentIndex]; return n; });
      if (currentIndex < practiceContent.length - 1) setCurrentIndex(i => i + 1);
      else navigate('/language-learning');
    };

    return (
      <div className="practice-content">
        <div className="practice-progress">
          <span>Phrase {currentIndex + 1} of {practiceContent.length}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((currentIndex + 1) / practiceContent.length) * 100}%` }} />
          </div>
        </div>

        <div className="question-section" style={{ textAlign: 'center' }}>
          <h3>🎤 Speaking Practice</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Say this in {targetLangName}:</p>
          <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{card.front}</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.25rem', background: 'var(--color-bg-secondary)', borderRadius: '1rem', margin: '1rem 0' }}>
            <div>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{card.back}</p>
              {card.pronunciation && <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>{card.pronunciation}</p>}
            </div>
            <button onClick={speakWord} title="Listen to pronunciation"
              style={{ background: 'var(--color-accent)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', fontSize: '1.2rem', cursor: 'pointer', flexShrink: 0 }}>
              🔊
            </button>
          </div>

          {/* AI-powered record button */}
          <SpeakingRecorder
            expectedWord={card.back}
            expectedPhrase={`${card.front} = ${card.back}`}
            targetLanguage={targetLangName}
            targetLangCode={targetLangCode}
            onResult={(res) => setAnswers(prev => ({ ...prev, [currentIndex]: res }))}
          />

      {result && (
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--color-bg-secondary)', marginTop: '0.75rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{result.score >= 80 ? '🌟' : result.score >= 60 ? '👍' : '📚'}</span>
                <strong>Score: {result.score}/100</strong>
              </div>
              <p style={{ margin: '0 0 0.5rem' }}>{result.feedback}</p>
              {result.mistakes?.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                  {result.mistakes.map((m, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: 'var(--color-text-muted)' }}>
                      <span>{m}</span>
                      <button
                        onClick={() => {
                          // Extract the quoted word/phrase from the mistake text if present
                          const quoted = m.match(/[''"'""]([^''"'""\n]+)[''"'""]/) || m.match(/[「」『』]([^「」『』\n]+)[「」『』]/);
                          const toSpeak = quoted ? quoted[1] : card.back;
                          console.log('[Practice] 🔊 Mistake correction speak button clicked');
                          speak(toSpeak, targetLangCode, { rate: 0.7 });
                        }}
                        title="Hear correct pronunciation"
                        style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '50%', width: '26px', height: '26px', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        🔊
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {result.tip && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#a78bfa' }}>💡 {result.tip}</p>}
              {result.transcript && <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>🎙️ I heard: "{result.transcript}"</p>}
            </div>
          )}

          {card.example && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
              <em>{card.example}</em> — {card.exampleTranslation}
            </p>
          )}
        </div>

        <div className="practice-actions" style={{ marginTop: '1rem' }}>
          <button className="btn-next" onClick={goNext}>
            {currentIndex < practiceContent.length - 1 ? 'Next →' : 'Finish'}
          </button>
        </div>
      </div>
    );
  };

  // ── Writing Practice: upload photo of handwriting → AI feedback ─────────────
  const renderWritingPractice = () => {
    if (!practiceContent?.prompts) return null;
    const idx = practiceContent.currentPromptIndex || 0;
    const prompt = practiceContent.prompts[idx];
    const targetLangName = LANGUAGES.TARGET.find(l => l.code === userData?.targetLanguage)?.name || 'Target';
    const feedback = answers[`writing_${idx}`];
    const imagePreview = answers[`img_${idx}`];
    const isProcessing = answers[`processing_${idx}`];

    const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Show preview
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        setAnswers(prev => ({ ...prev, [`img_${idx}`]: base64, [`processing_${idx}`]: true }));

        try {
          const { smartAnalyzeImage } = await import('../services/aiProvider');
          const primaryLangName = LANGUAGES.PRIMARY.find(l => l.code === userData?.primaryLanguage)?.name || 'English';
          const aiResponse = await smartAnalyzeImage(
            base64,
            `This is a handwriting practice image. The student's native language is ${primaryLangName}. They were asked to write in ${targetLangName}: "${prompt}"

Please:
1. Read and transcribe exactly what is written
2. Check grammar and vocabulary
3. Rate the writing (0-100)
4. List specific mistakes (write each mistake in BOTH ${targetLangName} AND ${primaryLangName})
5. Give corrections (write each correction in BOTH ${targetLangName} AND ${primaryLangName})
6. Give overall feedback in BOTH ${targetLangName} AND ${primaryLangName} (format: "${targetLangName} feedback | ${primaryLangName} translation")
7. Give a tip in BOTH languages

Return JSON:
{
  "transcribed": "what you can read from the image",
  "score": 0-100,
  "feedback": "${targetLangName} feedback | ${primaryLangName} translation",
  "mistakes": ["mistake in ${targetLangName} (${primaryLangName} explanation)"],
  "corrections": ["correction in ${targetLangName} (${primaryLangName} meaning)"],
  "tip": "${targetLangName} tip | ${primaryLangName} translation"
}`,
            file.type || 'image/jpeg'
          );

          // Parse response
          let result = { score: 70, feedback: 'Good effort!', mistakes: [], corrections: [], tip: 'Keep practicing!' };
          try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) result = JSON.parse(jsonMatch[0]);
          } catch {
            result.feedback = aiResponse;
          }

          setAnswers(prev => ({ ...prev, [`writing_${idx}`]: result, [`processing_${idx}`]: false }));
        } catch (err) {
          setAnswers(prev => ({
            ...prev,
            [`writing_${idx}`]: { 
              score: 0, 
              feedback: err.message.includes('quota') || err.message.includes('limit: 0')
                ? 'Gemini API quota exhausted. Go to https://aistudio.google.com/app/apikey and create a new key in a new Google Cloud project, then update VITE_GEMINI_API_KEY in your .env file.'
                : `Error: ${err.message}`,
              mistakes: [], 
              corrections: [], 
              tip: 'Please fix the API key and try again.' 
            },
            [`processing_${idx}`]: false,
          }));
        }
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="practice-content">
        <div className="practice-progress">
          <span>Prompt {idx + 1} of {practiceContent.prompts.length}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((idx + 1) / practiceContent.prompts.length) * 100}%` }} />
          </div>
        </div>

        <div className="question-section">
          <h3>✍️ Writing Practice</h3>

          {/* Prompt */}
          <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem', margin: '1rem 0' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Write in {targetLangName}:</p>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>{prompt}</p>
          </div>

          {/* Instructions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', background: '#a78bfa15', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            <span>📝</span>
            <span>Write your answer on paper, take a photo, then upload it below. AI will read your handwriting and give feedback.</span>
          </div>

          {/* Upload area */}
          {!imagePreview && !isProcessing && (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem', border: '2px dashed var(--color-border)', borderRadius: '1rem', cursor: 'pointer', background: 'var(--color-bg-secondary)' }}>
              <span style={{ fontSize: '2.5rem' }}>📷</span>
              <span style={{ fontWeight: '500' }}>Upload photo of your handwriting</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>JPG, PNG — tap to open camera on mobile</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          )}

          {/* Processing */}
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span>AI is reading your handwriting...</span>
            </div>
          )}

          {/* Image preview */}
          {imagePreview && !isProcessing && (
            <div style={{ marginBottom: '1rem' }}>
              <img src={imagePreview} alt="Your writing" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '0.75rem', objectFit: 'contain' }} />
              <button
                onClick={() => setAnswers(prev => { const n = {...prev}; delete n[`img_${idx}`]; delete n[`writing_${idx}`]; return n; })}
                style={{ marginTop: '0.5rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}
              >
                🔄 Retake photo
              </button>
            </div>
          )}

          {/* AI Feedback */}
          {feedback && (
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--color-bg-secondary)', marginTop: '0.5rem' }}>
              {feedback.transcribed && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  📖 I read: <em>"{feedback.transcribed}"</em>
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{feedback.score >= 80 ? '🌟' : feedback.score >= 60 ? '👍' : '📚'}</span>
                <strong>Score: {feedback.score}/100</strong>
              </div>
              {/* Bilingual feedback — split on | */}
              {feedback.feedback && (() => {
                const parts = feedback.feedback.split('|');
                return (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ margin: '0 0 0.25rem', fontWeight: '500' }}>{parts[0]?.trim()}</p>
                    {parts[1] && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{parts[1]?.trim()}</p>}
                  </div>
                );
              })()}
              {feedback.mistakes?.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Mistakes:</p>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                    {feedback.mistakes.map((m, i) => (
                      <li key={i} style={{ marginBottom: '0.35rem' }}>
                        <span style={{ color: '#ef4444' }}>{m}</span>
                        {feedback.corrections?.[i] && (
                          <div style={{ color: '#10b981', marginTop: '0.15rem', fontSize: '0.85rem' }}>
                            ✓ {feedback.corrections[i]}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Bilingual tip */}
              {feedback.tip && (() => {
                const parts = feedback.tip.split('|');
                return (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#a78bfa15', borderRadius: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.2rem', fontSize: '0.9rem', color: '#a78bfa' }}>💡 {parts[0]?.trim()}</p>
                    {parts[1] && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{parts[1]?.trim()}</p>}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div className="practice-actions" style={{ marginTop: '1rem' }}>
          <button
            className="btn-next"
            disabled={!feedback}
            onClick={() => {
              if (idx < practiceContent.prompts.length - 1) {
                setPracticeContent(prev => ({ ...prev, currentPromptIndex: idx + 1 }));
              } else {
                navigate('/language-learning');
              }
            }}
          >
            {idx < practiceContent.prompts.length - 1 ? 'Next Prompt →' : 'Finish'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="practice-loading">
        <div className="loading-spinner"></div>
        <p>Loading practice...</p>
      </div>
    );
  }

  return (
    <div className="practice-container">
      {practiceLoading && (
        <div className="practice-loading">
          <div className="loading-spinner"></div>
          <p>Loading practice...</p>
        </div>
      )}

      {!practiceLoading && !selectedPractice && renderPracticeCard()}
      
      {!practiceLoading && selectedPractice === 'mcq' && renderMCQPractice()}
      
      {!practiceLoading && selectedPractice === 'flashcards' && (
        <FlashcardPractice
          cards={practiceContent}
          userData={userData}
          onRating={handleFlashcardRating}
          onFinish={() => navigate('/language-learning')}
        />
      )}
      
      {!practiceLoading && selectedPractice === 'reading_comprehension' && renderReadingPractice()}
      
      {!practiceLoading && selectedPractice === 'conversation' && renderConversationPractice()}

      {!practiceLoading && selectedPractice === 'typing' && renderTypingPractice()}

      {!practiceLoading && selectedPractice === 'speaking' && renderSpeakingPractice()}

      {!practiceLoading && selectedPractice === 'writing' && renderWritingPractice()}

      {!practiceLoading && selectedPractice === 'listening' && renderListeningPractice()}

      {!practiceLoading && selectedPractice === 'fill_blank' && renderMCQPractice()}

      {!practiceLoading && selectedPractice && !['mcq','flashcards','reading_comprehension','conversation','typing','speaking','writing','fill_blank','listening'].includes(selectedPractice) && (
        <div className="practice-content" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>🚧 {PRACTICE_TYPE_INFO[selectedPractice]?.name} — coming soon</p>
          <button className="btn-back" onClick={() => setSelectedPractice(null)}>← Back</button>
        </div>
      )}
    </div>
  );
};

export default LanguageLearningPractice;