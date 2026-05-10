import React, { useState } from 'react';
import { processYoutubeVideo, extractVideoId, getYoutubeThumbnail } from '../appwrite/youtubeStudy';
import InlineFlashcard from './InlineFlashcard';
import InlineQuiz from './InlineQuiz';
import '../styles/YoutubeStudyPanel.css';

/**
 * YoutubeStudyPanel — paste a YouTube URL, get summary, flashcards, quiz, key topics.
 * Integrates into the PDFLibrary panel as a tab.
 */
const YoutubeStudyPanel = ({ userId, onSendMessage }) => {
  const [url, setUrl]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [result, setResult]     = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [quizAnswers, setQuizAnswers] = useState({});

  const videoId = result ? extractVideoId(url) : null;

  const handleProcess = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!extractVideoId(trimmed)) {
      setError('That doesn\'t look like a valid YouTube URL. Try: https://youtube.com/watch?v=...');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setQuizAnswers({});

    try {
      const data = await processYoutubeVideo(trimmed, userId);
      setResult(data);
      setActiveTab('summary');
    } catch (err) {
      setError(err.message || 'Failed to process video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert quiz format from { question, options, correct:index } → InlineQuiz format
  const convertQuizForInlineQuiz = (quizItems) =>
    quizItems.map(q => ({
      questionText: q.question,
      options: q.options.map((opt, i) => ({
        label: String.fromCharCode(65 + i), // A, B, C, D
        text: opt,
        isCorrect: i === q.correct,
      })),
      explanation: '',
    }));

  // Send a topic to the active chat session
  const handleStudyTopic = (topic) => {
    if (onSendMessage) {
      onSendMessage(`Let's study this topic from the YouTube video: "${topic}". Please explain it thoroughly.`);
    }
  };

  const tabs = [
    { key: 'summary',    label: '📋 Summary' },
    { key: 'flashcards', label: '🃏 Flashcards' },
    { key: 'quiz',       label: '✅ Quiz' },
    { key: 'topics',     label: '🏷️ Topics' },
  ];

  return (
    <div className="yt-panel">
      {/* URL input */}
      <div className="yt-input-section">
        <div className="yt-input-row">
          <input
            type="text"
            className="form-input yt-input"
            placeholder="Paste YouTube URL…"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleProcess()}
            disabled={loading}
          />
          <button
            className="btn btn-primary yt-btn"
            onClick={handleProcess}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <span className="yt-spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>
        </div>
        {loading && (
          <p className="yt-loading-text">
            Fetching transcript and generating study materials… (10–20s)
          </p>
        )}
        {error && <p className="yt-error">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="yt-results">
          {/* Video preview */}
          {videoId && (
            <div className="yt-video-preview">
              <img
                src={getYoutubeThumbnail(videoId)}
                alt="Video thumbnail"
                className="yt-thumbnail"
              />
              <div className="yt-video-meta">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-video-link"
                >
                  ▶ Open on YouTube
                </a>
                {result.cached && (
                  <span className="yt-cached-badge">Cached</span>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="yt-tabs">
            {tabs.map(t => (
              <button
                key={t.key}
                className={`yt-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Summary */}
          {activeTab === 'summary' && (
            <ul className="yt-summary-list">
              {result.summary.map((point, i) => (
                <li key={i} className="yt-summary-item">
                  <span className="yt-summary-num">{i + 1}</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Flashcards — reuse InlineFlashcard */}
          {activeTab === 'flashcards' && (
            <div className="yt-flashcards">
              {result.flashcards.map((card, i) => (
                <InlineFlashcard
                  key={i}
                  front={card.question}
                  back={card.answer}
                />
              ))}
            </div>
          )}

          {/* Quiz — reuse InlineQuiz */}
          {activeTab === 'quiz' && (
            <div className="yt-quiz">
              {convertQuizForInlineQuiz(result.quiz).map((q, i) => (
                <InlineQuiz
                  key={i}
                  questionNumber={i + 1}
                  totalQuestions={result.quiz.length}
                  questionText={q.questionText}
                  options={q.options}
                  explanation={q.explanation}
                  onAnswer={(ans) => setQuizAnswers(prev => ({ ...prev, [i]: ans }))}
                  isLast={i === result.quiz.length - 1 &&
                    Object.keys(quizAnswers).length === result.quiz.length - 1}
                  sessionScore={
                    Object.keys(quizAnswers).length === result.quiz.length
                      ? {
                          correct: Object.values(quizAnswers).filter(a => a.isCorrect).length,
                          total: result.quiz.length,
                        }
                      : null
                  }
                />
              ))}
            </div>
          )}

          {/* Key Topics */}
          {activeTab === 'topics' && (
            <div className="yt-topics">
              {result.keyTopics.map((topic, i) => (
                <button
                  key={i}
                  className="yt-topic-chip"
                  onClick={() => handleStudyTopic(topic)}
                  title="Click to study this topic in chat"
                >
                  {topic}
                  {onSendMessage && <span className="yt-topic-arrow">→ Study</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="yt-empty">
          <div className="yt-empty-icon">▶</div>
          <p>Paste any YouTube video URL above</p>
          <span>Works best with educational videos, lectures, and tutorials that have captions</span>
        </div>
      )}
    </div>
  );
};

export default YoutubeStudyPanel;
