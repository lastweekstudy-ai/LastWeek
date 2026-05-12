import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
            5
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
              10
            );
          }
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

  const handleFlashcardRating = async (rating) => {
    if (!practiceContent || !practiceContent[currentIndex]) return;
    
    const card = practiceContent[currentIndex];
    
    try {
      await saveFlashcardReview(user.$id, {
        itemId: card.reviewId || `card_${currentIndex}`,
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

  const renderFlashcardPractice = () => {
    if (!practiceContent || !practiceContent[currentIndex]) return null;
    
    const card = practiceContent[currentIndex];
    const [showAnswer, setShowAnswer] = useState(false);
    
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
            <span className="flashcard-label">Translate this:</span>
            <h3>{card.front}</h3>
          </div>
          
          {showAnswer && (
            <div className="flashcard-back">
              <span className="flashcard-label">Answer:</span>
              <h3>{card.back}</h3>
              {card.pronunciation && (
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
          {!showAnswer ? (
            <button className="btn-show-answer" onClick={() => setShowAnswer(true)}>
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

  const nextFlashcard = () => {
    if (currentIndex < practiceContent.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      navigate('/language-learning');
    }
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
      {!selectedPractice && renderPracticeCard()}
      
      {selectedPractice === 'mcq' && renderMCQPractice()}
      
      {selectedPractice === 'flashcards' && renderFlashcardPractice()}
      
      {selectedPractice === 'reading_comprehension' && renderReadingPractice()}
      
      {selectedPractice === 'conversation' && renderConversationPractice()}
    </div>
  );
};

export default LanguageLearningPractice;