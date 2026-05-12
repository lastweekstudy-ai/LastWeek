import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatInterface from './ChatInterface';
import EnhancedMessageFormatter from './EnhancedMessageFormatter';
import { createPDFHighlight, getPDFHighlights, deletePDFHighlight } from '../appwrite/pdfHighlights';
import { createPDFNote, getPDFNotes, deletePDFNote } from '../appwrite/pdfNotes';
import { trackAudioLectureView, trackAudioStudyTime } from '../appwrite/audioLecture';
import useOrientation from '../hooks/useOrientation';
import OrientationPrompt from './OrientationPrompt';
import '../styles/AudioLectureViewer.css';
import '../styles/AudioLectureViewerMobile.css';

const PRESETS = [35, 50, 65];
const SNAP_THRESHOLD = 3;
function snapRatio(raw) {
  for (const p of PRESETS) if (Math.abs(raw - p) <= SNAP_THRESHOLD) return p;
  return raw;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'yellow', hex: '#fef08a' },
  { name: 'Green',  value: 'green',  hex: '#86efac' },
  { name: 'Blue',   value: 'blue',   hex: '#93c5fd' },
  { name: 'Pink',   value: 'pink',   hex: '#f9a8d4' },
  { name: 'Orange', value: 'orange', hex: '#fdba74' },
];

const AudioLectureViewer = ({
  lecture,
  onClose,
  messages      = [],
  onSendMessage = () => {},
  isLoading     = false,
  mode          = 'mental_model',
  userId,
  sessionId,
  subject       = 'General',
}) => {
  // Orientation handling for mobile/tablet
  const { 
    isLandscape, 
    isMobileOrTablet, 
    showOrientationPrompt, 
    setShowOrientationPrompt 
  } = useOrientation();

  // ── Player ──────────────────────────────────────────────────────────────────
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [speed,       setSpeed]       = useState(1);

  // ── Left pane ───────────────────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState('notes');
  const [zoom,           setZoom]           = useState(100);
  const [highlightMode,  setHighlightMode]  = useState(false);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [showColorPicker,setShowColorPicker]= useState(false);
  const [highlights,     setHighlights]     = useState([]);
  const [selectionTip,   setSelectionTip]   = useState(null);
  const [selectedText,   setSelectedText]   = useState('');
  const [notes,          setNotes]          = useState([]);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteText,       setNoteText]       = useState('');
  const [editingNoteId,  setEditingNoteId]  = useState(null);

  // ── Layout ──────────────────────────────────────────────────────────────────
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768);
  const [mobileTab,  setMobileTab]  = useState('content');
  const [leftWidth,  setLeftWidth]  = useState(() => {
    const s = localStorage.getItem('audio-split-ratio');
    const p = s ? parseFloat(s) : NaN;
    return Number.isFinite(p) && p >= 20 && p <= 80 ? p : 50;
  });
  const [isResizing, setIsResizing] = useState(false);

  const audioRef     = useRef(null);
  const containerRef = useRef(null);
  const contentRef   = useRef(null);
  const studyStartRef = useRef(null);
  const studyTimerRef = useRef(null);

  // ── Audio events ────────────────────────────────────────────────────────────
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onDur  = () => setDuration(a.duration);
    const onEnd  = () => setIsPlaying(false);
    a.addEventListener('timeupdate',     onTime);
    a.addEventListener('durationchange', onDur);
    a.addEventListener('loadedmetadata', onDur);
    a.addEventListener('ended',          onEnd);
    return () => {
      a.removeEventListener('timeupdate',     onTime);
      a.removeEventListener('durationchange', onDur);
      a.removeEventListener('loadedmetadata', onDur);
      a.removeEventListener('ended',          onEnd);
    };
  }, []);

  // ── Resize ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setLeftWidth(Math.min(80, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100)));
    };
    const onUp = () => {
      setIsResizing(false);
      setLeftWidth(prev => {
        const s = snapRatio(prev);
        localStorage.setItem('audio-split-ratio', String(s));
        return s;
      });
    };
    if (isResizing) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
  }, [isResizing]);

  // ── Mobile ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ── Load data + study time on mount ─────────────────────────────────────────
  useEffect(() => {
    const lectureId = lecture.$id;
    if (!lectureId) return;

    trackAudioLectureView(lectureId);

    // Reuse pdf_highlights — pdfResourceId = lectureId, pageNumber = 0
    getPDFHighlights(lectureId).then(docs => {
      setHighlights(docs.map(d => ({
        id: d.$id,
        text: d.highlightedText,
        color: d.color,
        hex: HIGHLIGHT_COLORS.find(c => c.value === d.color)?.hex || '#fef08a',
        saved: true,
      })));
    });

    // Reuse pdf_notes — pdfResourceId = lectureId, pageNumber = 0
    getPDFNotes(lectureId).then(docs => setNotes(docs));

    // Study time tracking
    studyStartRef.current = Date.now();
    studyTimerRef.current = setInterval(() => {
      trackAudioStudyTime(lectureId, 1);
    }, 60 * 1000);

    return () => {
      clearInterval(studyTimerRef.current);
      if (studyStartRef.current) {
        const mins = Math.floor((Date.now() - studyStartRef.current) / 60000);
        if (mins > 0) trackAudioStudyTime(lectureId, mins);
      }
    };
  }, [lecture.$id]);

  // ── Text selection tip ──────────────────────────────────────────────────────
  useEffect(() => {
    const onMouseUp = () => {
      const sel  = window.getSelection();
      const text = sel?.toString().trim();
      if (!text || text.length < 3) { setSelectionTip(null); return; }
      if (!contentRef.current) return;
      try {
        const range = sel.getRangeAt(0);
        if (!contentRef.current.contains(range.commonAncestorContainer)) { setSelectionTip(null); return; }
        const rect  = range.getBoundingClientRect();
        const cRect = containerRef.current?.getBoundingClientRect();
        if (cRect) {
          setSelectionTip({ x: rect.left - cRect.left + rect.width / 2, y: rect.top - cRect.top - 44, text });
          setSelectedText(text);
        }
      } catch (_) {}
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  // ── Player helpers ──────────────────────────────────────────────────────────
  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) { a.pause(); setIsPlaying(false); }
    else           { a.play();  setIsPlaying(true);  }
  };

  const handleSeek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const skip = (secs) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(duration, a.currentTime + secs));
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ── Highlight helpers ───────────────────────────────────────────────────────
  const applyHighlight = useCallback(async () => {
    const sel  = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) return;
    const colorObj = HIGHLIGHT_COLORS.find(c => c.value === highlightColor);
    const tempId = `temp-${Date.now()}`;
    setHighlights(prev => [...prev, { id: tempId, text, color: highlightColor, hex: colorObj?.hex || '#fef08a', saved: false }]);
    setSelectionTip(null);
    sel.removeAllRanges();
    const saved = await createPDFHighlight(userId, lecture.$id, 0, text, {}, highlightColor);
    if (saved) setHighlights(prev => prev.map(h => h.id === tempId ? { ...h, id: saved.$id, saved: true } : h));
  }, [highlightColor, userId, lecture.$id]);

  const removeHighlight = useCallback(async (id) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    await deletePDFHighlight(id);
  }, []);

  // ── Note helpers ────────────────────────────────────────────────────────────
  const saveNote = useCallback(async () => {
    if (!noteText.trim()) return;
    if (editingNoteId) {
      await deletePDFNote(editingNoteId);
      setNotes(prev => prev.filter(n => n.$id !== editingNoteId));
    }
    const ts = Math.floor(currentTime);
    const saved = await createPDFNote(userId, lecture.$id, 0, noteText, { timestamp: ts }, 'yellow');
    if (saved) setNotes(prev => [...prev, saved]);
    setNoteText('');
    setEditingNoteId(null);
    setShowNoteEditor(false);
  }, [noteText, editingNoteId, userId, lecture.$id, currentTime]);

  const removeNote = useCallback(async (noteId) => {
    setNotes(prev => prev.filter(n => n.$id !== noteId));
    await deletePDFNote(noteId);
  }, []);

  // ── Apply visual highlights to text content ─────────────────────────────────
  const applyHighlightsToText = useCallback((text) => {
    if (!text || highlights.length === 0) return text;
    const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);
    let result = text;
    sorted.forEach(h => {
      if (!h.text) return;
      const escaped = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'g');
      result = result.replace(regex, `<mark style="background:${h.hex};border-radius:3px;padding:0 2px;">${h.text}</mark>`);
    });
    return result;
  }, [highlights]);

  // Render transcript with highlights applied
  const renderTranscript = useCallback(() => {
    const raw = lecture.audioData?.transcript || '';
    if (highlights.length === 0) return <p className="alv-transcript-text">{raw}</p>;
    const html = applyHighlightsToText(raw);
    return <p className="alv-transcript-text" dangerouslySetInnerHTML={{ __html: html }} />;
  }, [lecture.audioData?.transcript, highlights, applyHighlightsToText]);

  // Render lecture notes with highlights applied (plain HTML, not React components)
  const renderNotesWithHighlights = useCallback(() => {
    const raw = lecture.audioData?.lectureNotes || '';
    // Always use EnhancedMessageFormatter to properly render markdown, SVG figures, etc.
    return <EnhancedMessageFormatter content={raw} />;
  }, [lecture.audioData?.lectureNotes]);
  const askAboutSelection = useCallback((text) => {
    setSelectionTip(null);
    window.getSelection()?.removeAllRanges();
    handleSendWithContext(`Explain this from the lecture: "${text}"`);
    if (isMobile) setMobileTab('chat');
  }, [isMobile]); // eslint-disable-line

  // ── Chat with full lecture context ──────────────────────────────────────────
  const handleSendWithContext = useCallback(async (userMessage, aiContextMessage = null, fileAttachment = null) => {
    if (isMobile) setMobileTab('chat');

    const lectureNotes = lecture.audioData?.lectureNotes || '';
    const transcript   = lecture.audioData?.transcript   || '';
    const title        = lecture.fileName || 'Audio Lecture';
    const highlightsSummary = highlights.length > 0
      ? `\nSTUDENT HIGHLIGHTS:\n${highlights.map((h, i) => `${i + 1}. "${h.text}"`).join('\n')}`
      : '';
    const selectionCtx = selectedText ? `\nSTUDENT SELECTED TEXT: "${selectedText}"\n` : '';

    const context = `[AUDIO LECTURE STUDY MODE — LOCKED CONTEXT]
Lecture Title: "${title}"
Current Playback: ${fmt(currentTime)} / ${fmt(duration)}
${selectionCtx}${highlightsSummary}

CRITICAL INSTRUCTIONS:
- You are ONLY helping the student study "${title}".
- ALL answers must be based on the lecture notes and transcript below.
- Do NOT reference any other resource unless the lecture content is insufficient.
- Reference specific parts of the lecture when answering.
- If asked for flashcards, use EXACTLY this format:

**FRONT OF CARD**
[question or concept]

---

**BACK OF CARD**
[complete answer]

---

**How confident were you?**
1 - Not at all | 2 - Somewhat | 3 - Fully confident

- If asked for MCQs, use EXACTLY this format:

[MCQ]
Q: <question>
A) <option>
B) <option>
C) <option>
D) <option>
CORRECT: <letter>
EXPLANATION: <brief explanation>
[/MCQ]

FULL LECTURE NOTES:
${lectureNotes}

FULL TRANSCRIPT:
${transcript}

User Question: ${aiContextMessage || userMessage}`;

    try {
      await onSendMessage(userMessage, context, fileAttachment);
    } catch (err) {
      console.error('[AudioLectureViewer] send error:', err);
    }
  }, [lecture, currentTime, duration, isMobile, onSendMessage, highlights, selectedText]);

  const audioUrl = lecture.audioData?.audioUrl;

  return (
    <>
      {/* Orientation Prompt for Mobile/Tablet */}
      {showOrientationPrompt && (
        <OrientationPrompt onDismiss={() => setShowOrientationPrompt(false)} />
      )}
      
      <div className="alv-overlay" onClick={onClose}>
        <div className="alv-container" ref={containerRef} onClick={e => e.stopPropagation()}>

          {/* Floating selection tip */}
          {selectionTip && (
            <div
              className="alv-selection-tip"
              style={{ left: selectionTip.x, top: Math.max(8, selectionTip.y) }}
              onMouseDown={e => e.preventDefault()}
            >
              <button className="alv-tip-btn alv-tip-ask" onClick={() => askAboutSelection(selectionTip.text)}>✨ Ask AI</button>
              {highlightMode && (
                <button className="alv-tip-btn alv-tip-highlight" onClick={applyHighlight}>🖍️ Highlight</button>
              )}
              <button className="alv-tip-btn alv-tip-dismiss" onClick={() => { setSelectionTip(null); window.getSelection()?.removeAllRanges(); }}>✕</button>
            </div>
          )}

          {/* Header */}
        <div className="alv-header">
          <div className="alv-header-left">
            <span className="alv-header-icon">🎙️</span>
            <h3 className="alv-header-title">{lecture.fileName}</h3>
          </div>
          {isMobile && (
            <div className="alv-mobile-tabs">
              <button className={`alv-mobile-tab ${mobileTab === 'content' ? 'active' : ''}`} onClick={() => setMobileTab('content')}>📝 Notes</button>
              <button className={`alv-mobile-tab ${mobileTab === 'chat'    ? 'active' : ''}`} onClick={() => setMobileTab('chat')}>💬 Chat</button>
            </div>
          )}
          <button className="alv-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="alv-player">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
            <button className="alv-skip-btn" onClick={() => skip(-10)} title="Back 10s">⏮ 10s</button>
            <button className="alv-play-btn" onClick={togglePlay}>{isPlaying ? '⏸' : '▶'}</button>
            <button className="alv-skip-btn" onClick={() => skip(10)} title="Forward 10s">10s ⏭</button>
            <span className="alv-time">{fmt(currentTime)}</span>
            <div className="alv-progress-bar" onClick={handleSeek}>
              <div className="alv-progress-fill"   style={{ width: `${progress}%` }} />
              <div className="alv-progress-handle" style={{ left:  `${progress}%` }} />
            </div>
            <span className="alv-time">{fmt(duration)}</span>
            <button className="alv-speed-btn" onClick={cycleSpeed} title="Playback speed">{speed}×</button>
          </div>
        )}

        {/* Body */}
        <div className="alv-body">

          {/* Left pane */}
          <div
            className={`alv-left ${isMobile && mobileTab !== 'content' ? 'alv-pane-hidden' : ''}`}
            style={{ width: isMobile ? '100%' : `${leftWidth}%` }}
          >
            {/* Tabs + toolbar */}
            <div className="alv-tabs-row">
              <div className="alv-tabs">
                <button className={`alv-tab ${activeTab === 'notes'      ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>📝 Lecture Notes</button>
                <button className={`alv-tab ${activeTab === 'transcript' ? 'active' : ''}`} onClick={() => setActiveTab('transcript')}>📄 Transcript</button>
                <button className={`alv-tab ${activeTab === 'highlights' ? 'active' : ''}`} onClick={() => setActiveTab('highlights')}>
                  🖍️ Highlights{highlights.length > 0 ? ` (${highlights.length})` : ''}
                </button>
                <button className={`alv-tab ${activeTab === 'mynotes' ? 'active' : ''}`} onClick={() => setActiveTab('mynotes')}>
                  ✏️ Notes{notes.length > 0 ? ` (${notes.length})` : ''}
                </button>
              </div>

              {/* Toolbar */}
              <div className="alv-toolbar">
                <button className="alv-tool-btn" onClick={() => setZoom(z => Math.max(70, z - 10))} title="Zoom out">A−</button>
                <span className="alv-zoom-label">{zoom}%</span>
                <button className="alv-tool-btn" onClick={() => setZoom(z => Math.min(160, z + 10))} title="Zoom in">A+</button>
                <button className="alv-tool-btn" onClick={() => setZoom(100)} title="Reset zoom">↺</button>
                <span className="alv-toolbar-divider" />
                <button
                  className={`alv-tool-btn ${showNoteEditor ? 'active' : ''}`}
                  onClick={() => { setShowNoteEditor(v => !v); setNoteText(''); setEditingNoteId(null); }}
                  title="Add note"
                >✏️</button>
                <span className="alv-toolbar-divider" />
                <button
                  className={`alv-tool-btn ${highlightMode ? 'active' : ''}`}
                  onClick={() => { setHighlightMode(v => !v); setShowColorPicker(false); }}
                  title="Highlight mode"
                >🖍️</button>
                {highlightMode && (
                  <div className="alv-color-wrap">
                    <button
                      className="alv-color-swatch"
                      style={{ background: HIGHLIGHT_COLORS.find(c => c.value === highlightColor)?.hex }}
                      onClick={() => setShowColorPicker(v => !v)}
                      title="Pick color"
                    />
                    {showColorPicker && (
                      <div className="alv-color-picker">
                        {HIGHLIGHT_COLORS.map(c => (
                          <button
                            key={c.value}
                            className={`alv-color-option ${highlightColor === c.value ? 'active' : ''}`}
                            style={{ background: c.hex }}
                            onClick={() => { setHighlightColor(c.value); setShowColorPicker(false); }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="alv-quick-actions">
              <button className="alv-qa-btn" onClick={() => handleSendWithContext('Summarise the key points of this lecture')}>Summarise</button>
              <button className="alv-qa-btn" onClick={() => handleSendWithContext('Quiz me on this lecture')}>Quiz me</button>
              <button className="alv-qa-btn" onClick={() => handleSendWithContext('What are the most important concepts in this lecture?')}>Key concepts</button>
              <button className="alv-qa-btn" onClick={() => handleSendWithContext('Create flashcards for this lecture')}>Flashcards</button>
              {selectedText && (
                <button className="alv-qa-btn alv-qa-selection" onClick={() => handleSendWithContext(`Explain this from the lecture: "${selectedText}"`)}>
                  ✨ Explain selection
                </button>
              )}
            </div>

            {/* Highlight hint */}
            {highlightMode && (
              <div className="alv-highlight-hint">🖍️ Select any text to highlight it or ask AI about it</div>
            )}

            {/* Note editor */}
            {showNoteEditor && (
              <div className="alv-note-editor">
                <textarea
                  className="alv-note-textarea"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder={`Add a note${currentTime > 0 ? ` at ${fmt(currentTime)}` : ''}...`}
                  rows={3}
                  autoFocus
                />
                <div className="alv-note-editor-actions">
                  <button className="alv-note-save-btn" onClick={saveNote} disabled={!noteText.trim()}>Save Note</button>
                  <button className="alv-note-cancel-btn" onClick={() => { setShowNoteEditor(false); setNoteText(''); setEditingNoteId(null); }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="alv-content" ref={contentRef} style={{ fontSize: `${zoom}%` }}>
              {activeTab === 'notes' && (
                <div className="alv-notes">
                  {renderNotesWithHighlights()}
                </div>
              )}
              {activeTab === 'transcript' && (
                <div className="alv-transcript">
                  {renderTranscript()}
                </div>
              )}
              {activeTab === 'highlights' && (
                <div className="alv-highlights-list">
                  <h4 style={{ margin: '0 0 1rem', color: 'var(--color-text-primary)' }}>Your Highlights</h4>
                  {highlights.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>No highlights yet. Enable 🖍️ mode and select text.</p>
                  ) : highlights.map(h => (
                    <div key={h.id} className="alv-highlight-item" style={{ borderLeftColor: h.hex }}>
                      <p className="alv-highlight-text">"{h.text}"</p>
                      <div className="alv-highlight-actions">
                        <button className="alv-highlight-ask" onClick={() => handleSendWithContext(`Explain this from the lecture: "${h.text}"`)}>✨ Ask AI</button>
                        <button className="alv-highlight-remove" onClick={() => removeHighlight(h.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'mynotes' && (
                <div className="alv-notes-list">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Your Notes</h4>
                    <button className="alv-qa-btn" onClick={() => { setShowNoteEditor(true); setNoteText(''); setEditingNoteId(null); }}>+ Add Note</button>
                  </div>
                  {notes.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>No notes yet. Click ✏️ in the toolbar to add a note.</p>
                  ) : notes.map(n => {
                    let ts = 0;
                    try { ts = JSON.parse(n.position || '{}').timestamp || 0; } catch {}
                    return (
                      <div key={n.$id} className="alv-note-item">
                        {ts > 0 && (
                          <button
                            className="alv-note-timestamp"
                            onClick={() => { if (audioRef.current) audioRef.current.currentTime = ts; }}
                            title="Jump to this position"
                          >⏱ {fmt(ts)}</button>
                        )}
                        <p className="alv-note-text">{n.noteText}</p>
                        <div className="alv-note-actions">
                          <button className="alv-highlight-ask" onClick={() => handleSendWithContext(`Regarding my note: "${n.noteText}" — can you elaborate?`)}>✨ Ask AI</button>
                          <button className="alv-highlight-remove" onClick={() => removeNote(n.$id)}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Resize handle */}
          {!isMobile && (
            <div
              className={`alv-resize-handle ${isResizing ? 'is-resizing' : ''}`}
              onMouseDown={e => { setIsResizing(true); e.preventDefault(); }}
            >
              <div className="alv-resize-grip"><span /><span /><span /></div>
            </div>
          )}

          {/* Right pane: chat */}
          <div
            className={`alv-right ${isMobile && mobileTab !== 'chat' ? 'alv-pane-hidden' : ''}`}
            style={{ width: isMobile ? '100%' : `${100 - leftWidth}%` }}
          >
            <div className="alv-chat-banner">
              <span>💬 Studying: <strong>{lecture.fileName}</strong></span>
              {highlights.length > 0 && <span className="alv-chat-badge">🖍️ {highlights.length} highlight{highlights.length > 1 ? 's' : ''}</span>}
              {notes.length > 0 && <span className="alv-chat-badge">✏️ {notes.length} note{notes.length > 1 ? 's' : ''}</span>}
            </div>
            <ChatInterface
              messages={messages}
              onSend={handleSendWithContext}
              isLoading={isLoading}
              mode={mode}
              userId={userId}
              sessionId={sessionId}
              subject={subject}
              insideStudyMode={true}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AudioLectureViewer;
