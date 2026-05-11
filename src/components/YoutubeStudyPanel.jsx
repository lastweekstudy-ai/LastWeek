import React, { useState, useEffect } from 'react';
import { processYoutubeVideo, extractVideoId, getYoutubeThumbnail, getUserYoutubeStudies } from '../appwrite/youtubeStudy';
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
  const [view, setView]         = useState('process'); // 'process' or 'library'
  const [library, setLibrary]   = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const videoId = result ? extractVideoId(result.youtubeUrl || url) : null;

  // Load user's video library
  useEffect(() => {
    if (view === 'library' && userId) {
      loadLibrary();
    }
  }, [view, userId]);

  const loadLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const videos = await getUserYoutubeStudies(userId);
      setLibrary(videos);
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

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
      setResult({ ...data, youtubeUrl: trimmed });
      setActiveTab('summary');
    } catch (err) {
      setError(err.message || 'Failed to process video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVideo = (video) => {
    setResult({
      ...video,
      youtubeUrl: video.youtubeUrl,
    });
    setView('process');
    setUrl(video.youtubeUrl);
    setActiveTab('summary');
    setQuizAnswers({});
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
      explanation: q.explanation || '',
    }));

  // Send a topic to the active chat session
  const handleStudyTopic = (topic) => {
    if (onSendMessage) {
      onSendMessage(`Let's study this topic from the YouTube video: "${topic}". Please explain it thoroughly.`);
    }
  };

  const tabs = [
    { key: 'summary',    label: '📋 Summary' },
    { key: 'notes',      label: '📝 Notes' },
    { key: 'flashcards', label: '🃏 Flashcards' },
    { key: 'quiz',       label: '✅ Quiz' },
    { key: 'topics',     label: '🏷️ Topics' },
  ];

  return (
    <div className="yt-panel">
      {/* View toggle */}
      <div className="yt-view-toggle">
        <button
          className={`yt-view-btn ${view === 'process' ? 'active' : ''}`}
          onClick={() => setView('process')}
        >
          ➕ Process New Video
        </button>
        <button
          className={`yt-view-btn ${view === 'library' ? 'active' : ''}`}
          onClick={() => setView('library')}
        >
          📚 My Videos ({library.length})
        </button>
      </div>

      {/* Library View */}
      {view === 'library' && (
        <div className="yt-library">
          {loadingLibrary && <p className="yt-loading-text">Loading your videos...</p>}
          {!loadingLibrary && library.length === 0 && (
            <div className="yt-empty">
              <div className="yt-empty-icon">📹</div>
              <p>No videos processed yet</p>
              <span>Process your first video to build your library</span>
            </div>
          )}
          {!loadingLibrary && library.length > 0 && (
            <div className="yt-library-grid">
              {library.map(video => (
                <div key={video.$id} className="yt-library-card" onClick={() => handleLoadVideo(video)}>
                  <img
                    src={getYoutubeThumbnail(video.videoId)}
                    alt={video.title}
                    className="yt-library-thumb"
                  />
                  <div className="yt-library-info">
                    <h4 className="yt-library-title">{video.title}</h4>
                    <div className="yt-library-meta">
                      <span>{video.flashcards?.length || 0} flashcards</span>
                      <span>•</span>
                      <span>{video.quiz?.length || 0} quiz</span>
                      <span>•</span>
                      <span>{video.keyTopics?.length || 0} topics</span>
                    </div>
                    <p className="yt-library-date">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Process View */}
      {view === 'process' && (
        <>
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
                Fetching transcript and generating study materials… (15–30s)
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
                    <h3 className="yt-video-title">{result.title}</h3>
                    <a
                      href={result.youtubeUrl || url}
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

              {/* Detailed Notes */}
              {activeTab === 'notes' && (
                <div className="yt-notes">
                  <p className="yt-notes-text">{result.detailedNotes}</p>
                </div>
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
        </>
      )}
    </div>
  );
};

export default YoutubeStudyPanel;
