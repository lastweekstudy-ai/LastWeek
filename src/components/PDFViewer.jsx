import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { updatePDFProgress, addPDFBookmark, removePDFBookmark, trackStudyTime } from '../appwrite/pdfResources';
import { getPageNotes } from '../appwrite/pdfNotes';
import { createPDFHighlight, getPageHighlights, deletePDFHighlight } from '../appwrite/pdfHighlights';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '../styles/PDFViewer.css';

// Configure PDF.js worker - use CDN for production, local for development
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

const PDFViewer = ({ pdfResource, onClose, onOpenNotes }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(pdfResource.currentPage || 1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [pageNotes, setPageNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [savedHighlights, setSavedHighlights] = useState([]);

  // Refs for overlay infrastructure (Tasks 1 & 2)
  const pageContainerRef = useRef(null);
  const overlayLayerRef = useRef(null);

  // Study time tracking
  const studyStartTime = useRef(Date.now());
  const lastActivityTime = useRef(Date.now());
  const studyTimeInterval = useRef(null);

  // Task 2: Color map for overlay spans
  const highlightColorMap = {
    yellow: 'rgba(255, 235, 59, 0.45)',
    green:  'rgba(76, 175, 80, 0.45)',
    blue:   'rgba(33, 150, 243, 0.45)',
    pink:   'rgba(233, 30, 99, 0.45)',
    orange: 'rgba(255, 152, 0, 0.45)',
    purple: 'rgba(156, 39, 176, 0.45)',
  };

  // Task 2: Render highlight overlays as absolutely-positioned spans
  const renderHighlightOverlays = useCallback(() => {
    if (!overlayLayerRef.current || !pageContainerRef.current) return;

    // Clear existing overlays
    overlayLayerRef.current.innerHTML = '';

    savedHighlights
      .filter(h => h.page === pageNumber && h.rect)
      .forEach(h => {
        const span = document.createElement('span');
        span.dataset.highlightId = h.id;
        span.style.position = 'absolute';
        span.style.top    = `${h.rect.top}px`;
        span.style.left   = `${h.rect.left}px`;
        span.style.width  = `${h.rect.width}px`;
        span.style.height = `${h.rect.height}px`;
        span.style.backgroundColor = highlightColorMap[h.color] || highlightColorMap.yellow;
        span.style.pointerEvents = 'auto';
        span.style.borderRadius = '2px';
        span.style.mixBlendMode = 'multiply';
        span.style.transition = 'opacity 0.15s ease';
        span.style.cursor = 'pointer';
        span.title = h.text;
        overlayLayerRef.current.appendChild(span);
      });
  }, [savedHighlights, pageNumber]);

  // Task 2: Re-render overlays whenever savedHighlights or pageNumber changes
  useEffect(() => {
    renderHighlightOverlays();
  }, [renderHighlightOverlays]);

  useEffect(() => {
    // Start study time tracking
    studyStartTime.current = Date.now();
    lastActivityTime.current = Date.now();

    // Track study time every minute
    studyTimeInterval.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime.current;

      // Only count as study time if user was active in last 2 minutes
      if (timeSinceLastActivity < 2 * 60 * 1000) {
        const studyMinutes = Math.floor((now - studyStartTime.current) / (60 * 1000));
        if (studyMinutes > 0) {
          trackStudyTime(pdfResource.$id, 1); // Track 1 minute
          studyStartTime.current = now; // Reset start time
        }
      }
    }, 60 * 1000); // Every minute

    // Track user activity
    const handleActivity = () => {
      lastActivityTime.current = Date.now();
    };

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keypress', handleActivity);
    document.addEventListener('scroll', handleActivity);
    document.addEventListener('click', handleActivity);

    return () => {
      // Clean up study time tracking
      if (studyTimeInterval.current) {
        clearInterval(studyTimeInterval.current);
      }

      // Track final study session
      const finalStudyTime = Math.floor((Date.now() - studyStartTime.current) / (60 * 1000));
      if (finalStudyTime > 0) {
        trackStudyTime(pdfResource.$id, finalStudyTime);
      }

      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keypress', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('click', handleActivity);
    };
  }, [pdfResource.$id]);

  useEffect(() => {
    // Parse bookmarks
    try {
      const parsed = JSON.parse(pdfResource.bookmarks || '[]');
      setBookmarks(parsed);
    } catch (e) {
      setBookmarks([]);
    }
  }, [pdfResource]);

  useEffect(() => {
    // Load notes for current page
    loadPageNotes();
    loadPageHighlights();

    // Update activity time when page changes
    lastActivityTime.current = Date.now();
  }, [pageNumber, pdfResource.$id]);

  const loadPageNotes = async () => {
    try {
      const notes = await getPageNotes(pdfResource.$id, pageNumber);
      setPageNotes(notes);
    } catch (error) {
      console.error('Failed to load page notes:', error);
    }
  };

  const loadPageHighlights = async () => {
    try {
      const highlights = await getPageHighlights(pdfResource.$id, pageNumber);
      // Convert database highlights to state format
      const formattedHighlights = highlights.map(h => ({
        id: h.$id,
        page: h.pageNumber,
        text: h.highlightedText,
        color: h.color,
        rect: h.rect || null,
        timestamp: h.createdAt,
        saved: true // Mark as saved to database
      }));
      setSavedHighlights(prev => {
        // Merge with unsaved highlights
        const unsaved = prev.filter(h => !h.saved);
        return [...unsaved, ...formattedHighlights];
      });
      // Task 2: Re-render overlays after loading highlights from DB
      setTimeout(() => renderHighlightOverlays(), 50);
    } catch (error) {
      console.error('Failed to load page highlights:', error);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const changePage = async (offset) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      // Save progress
      await updatePDFProgress(pdfResource.$id, newPage);
    }
  };

  const goToPage = async (page) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
      await updatePDFProgress(pdfResource.$id, page);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  const toggleBookmark = async () => {
    const isBookmarked = bookmarks.some(b => b.page === pageNumber);
    console.log('Toggle bookmark - Current page:', pageNumber, 'Is bookmarked:', isBookmarked);

    try {
      if (isBookmarked) {
        await removePDFBookmark(pdfResource.$id, pageNumber);
        setBookmarks(bookmarks.filter(b => b.page !== pageNumber));
        console.log('Bookmark removed');
      } else {
        const title = `Page ${pageNumber}`;
        await addPDFBookmark(pdfResource.$id, pageNumber, title);
        const newBookmark = { page: pageNumber, title, timestamp: new Date().toISOString() };
        setBookmarks([...bookmarks, newBookmark]);
        console.log('Bookmark added:', newBookmark);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  // Task 3: Fixed saveHighlight — captures rect position and triggers overlay render
  const saveHighlight = () => {
    if (!highlightMode) return;

    requestAnimationFrame(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
        console.log('[saveHighlight] No text selected');
        return;
      }

      const highlightedText = selection.toString().trim();
      const range = selection.getRangeAt(0);

      // Capture position relative to the page container
      let rect = { top: 0, left: 0, width: 0, height: 0 };
      if (pageContainerRef.current) {
        const rangeRect = range.getBoundingClientRect();
        const containerRect = pageContainerRef.current.getBoundingClientRect();
        rect = {
          top:    rangeRect.top    - containerRect.top,
          left:   rangeRect.left   - containerRect.left,
          width:  rangeRect.width,
          height: rangeRect.height,
        };
      }

      // Clear selection immediately
      selection.removeAllRanges();

      const highlight = {
        id:        `highlight-${Date.now()}`,
        page:      pageNumber,
        text:      highlightedText,
        color:     highlightColor,
        rect,
        timestamp: new Date().toISOString(),
        saved:     false,
      };

      setSavedHighlights(prev => {
        const next = [...prev, highlight];
        return next;
      });

      // Persist to database
      createPDFHighlight(
        pdfResource.userId,
        pdfResource.$id,
        pageNumber,
        highlightedText,
        rect,
        highlightColor
      ).then(savedDoc => {
        if (savedDoc) {
          setSavedHighlights(prev =>
            prev.map(h => h.id === highlight.id ? { ...h, id: savedDoc.$id, saved: true } : h)
          );
        }
      }).catch(err => {
        console.warn('[saveHighlight] DB save failed, keeping in memory:', err.message);
      });
    });
  };

  // Task 4: Fixed removeHighlight — removes overlay spans by data-highlight-id
  const removeHighlight = async (highlightId) => {
    // Remove all overlay spans with this ID
    document.querySelectorAll(`[data-highlight-id="${highlightId}"]`)
      .forEach(el => el.remove());

    // Remove from state
    setSavedHighlights(prev => prev.filter(h => h.id !== highlightId));

    // Remove from database (non-blocking)
    try {
      await deletePDFHighlight(highlightId);
    } catch (error) {
      console.error('[removeHighlight] DB delete failed:', error);
    }
  };

  const highlightColors = [
    { name: 'Yellow', value: 'yellow', color: '#ffeb3b' },
    { name: 'Green', value: 'green', color: '#4caf50' },
    { name: 'Blue', value: 'blue', color: '#2196f3' },
    { name: 'Pink', value: 'pink', color: '#e91e63' },
    { name: 'Orange', value: 'orange', color: '#ff9800' },
    { name: 'Purple', value: 'purple', color: '#9c27b0' }
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isBookmarked = bookmarks.some(b => b.page === pageNumber);

  // Get PDF URL from storage
  const pdfUrl = pdfResource.storageFileId
    ? `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID}/files/${pdfResource.storageFileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`
    : null;

  if (!pdfUrl) {
    return (
      <div className="pdf-viewer-container">
        <div className="pdf-viewer-error">
          <h3>PDF Not Available</h3>
          <p>This PDF file is not stored in the system.</p>
          <button onClick={onClose} className="btn-primary">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`pdf-viewer-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <div className="pdf-viewer-header">
        <div className="pdf-viewer-title">
          <span className="pdf-icon">📄</span>
          <h3>{pdfResource.fileName}</h3>
        </div>

        <div className="pdf-viewer-actions">
          <button
            onClick={toggleBookmark}
            className={`btn-icon ${isBookmarked ? 'active' : ''}`}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarked ? '⭐' : '☆'}
          </button>

          <div className="highlight-controls">
            <button
              onClick={() => setHighlightMode(!highlightMode)}
              className={`btn-icon ${highlightMode ? 'active' : ''}`}
              title={highlightMode ? 'Disable highlight mode' : 'Enable highlight mode'}
            >
              🖍️ {highlightMode && 'ON'}
            </button>

            {highlightMode && (
              <>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="btn-icon btn-color-picker"
                  title="Choose highlight color"
                  style={{ backgroundColor: highlightColors.find(c => c.value === highlightColor)?.color }}
                >
                  🎨
                </button>

                <button
                  onClick={saveHighlight}
                  className="btn-icon btn-save-highlight"
                  title="Save selected text as highlight"
                >
                  💾
                </button>

                {showColorPicker && (
                  <div className="color-picker-dropdown">
                    {highlightColors.map((color) => (
                      <button
                        key={color.value}
                        className={`color-option ${highlightColor === color.value ? 'active' : ''}`}
                        style={{ backgroundColor: color.color }}
                        onClick={() => {
                          setHighlightColor(color.value);
                          setShowColorPicker(false);
                        }}
                        title={color.name}
                      >
                        {highlightColor === color.value && '✓'}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => onOpenNotes(pageNumber)}
            className="btn-icon"
            title="Open notes"
          >
            📝 {pageNotes.length > 0 && `(${pageNotes.length})`}
          </button>

          <button
            onClick={toggleFullscreen}
            className="btn-icon"
            title="Toggle fullscreen"
          >
            {isFullscreen ? '⊡' : '⊞'}
          </button>

          <button
            onClick={onClose}
            className="btn-icon btn-close"
            title="Close viewer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="pdf-viewer-toolbar">
        <div className="toolbar-section">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="btn-toolbar"
          >
            ← Prev
          </button>

          <div className="page-indicator">
            <input
              type="number"
              value={pageNumber}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              min={1}
              max={numPages}
              className="page-input"
            />
            <span className="page-total">/ {numPages || '?'}</span>
          </div>

          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="btn-toolbar"
          >
            Next →
          </button>
        </div>

        <div className="toolbar-section">
          <button onClick={handleZoomOut} className="btn-toolbar" title="Zoom out">
            −
          </button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="btn-toolbar" title="Zoom in">
            +
          </button>
          <button onClick={handleResetZoom} className="btn-toolbar" title="Reset zoom">
            Reset
          </button>
        </div>
      </div>

      {/* PDF Content — Task 5: onMouseUp suppresses Ask AI in highlight mode */}
      <div
        className={`pdf-viewer-content ${highlightMode ? 'highlight-mode' : ''}`}
        onMouseUp={(e) => { if (highlightMode) e.stopPropagation(); }}
      >
        {loading && (
          <div className="pdf-loading">
            <div className="spinner"></div>
            <p>Loading PDF...</p>
          </div>
        )}

        {highlightMode && (
          <div className="highlight-instructions">
            🖍️ Highlight Mode Active - Select text, then click 💾 to save
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="pdf-loading"><div className="spinner"></div></div>}
          error={<div className="pdf-error">Failed to load PDF. Please try again.</div>}
        >
          {/* Task 1: position:relative wrapper + overlay layer */}
          {/* Task 5: --highlight-selection-color CSS variable for ::selection color */}
          <div
            ref={pageContainerRef}
            style={{
              position: 'relative',
              display: 'inline-block',
              '--highlight-selection-color': highlightColorMap[highlightColor] || 'rgba(255, 235, 59, 0.5)',
            }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              onRenderSuccess={() => renderHighlightOverlays()}
            />
            {/* Task 1: Overlay layer for highlight spans */}
            <div ref={overlayLayerRef} className="highlight-overlay-layer" />
          </div>
        </Document>

        {/* Page Notes Indicator */}
        {pageNotes.length > 0 && (
          <div className="page-notes-indicator">
            <button
              onClick={() => onOpenNotes(pageNumber)}
              className="notes-badge"
            >
              📝 {pageNotes.length} note{pageNotes.length > 1 ? 's' : ''} on this page
            </button>
          </div>
        )}
      </div>

      {/* Combined Sidebar for Bookmarks & Highlights */}
      {(bookmarks.length > 0 || savedHighlights.length > 0) && (
        <div className="pdf-sidebar">
          {/* Bookmarks Section */}
          {bookmarks.length > 0 && (
            <div className="sidebar-section">
              <h4>📑 Bookmarks ({bookmarks.length})</h4>
              <div className="bookmarks-list">
                {bookmarks.map((bookmark, index) => (
                  <div
                    key={index}
                    className={`bookmark-item ${bookmark.page === pageNumber ? 'active' : ''}`}
                  >
                    <div
                      className="bookmark-content"
                      onClick={() => goToPage(bookmark.page)}
                    >
                      <span className="bookmark-icon">⭐</span>
                      <span className="bookmark-title">{bookmark.title}</span>
                      <span className="bookmark-page">p.{bookmark.page}</span>
                    </div>
                    <button
                      className="bookmark-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePDFBookmark(pdfResource.$id, bookmark.page);
                        setBookmarks(bookmarks.filter(b => b.page !== bookmark.page));
                      }}
                      title="Remove bookmark"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights Section */}
          {savedHighlights.length > 0 && (
            <div className="sidebar-section">
              <h4>🖍️ Highlights ({savedHighlights.filter(h => h.page === pageNumber).length} on this page)</h4>
              <div className="highlights-list">
                {savedHighlights.filter(h => h.page === pageNumber).map((highlight) => (
                  <div
                    key={highlight.id}
                    className="highlight-item"
                  >
                    <div
                      className="highlight-color-indicator"
                      style={{ backgroundColor: highlightColors.find(c => c.value === highlight.color)?.color }}
                    ></div>
                    <div className="highlight-content">
                      <div className="highlight-text">{highlight.text}</div>
                      <div className="highlight-meta">
                        Page {highlight.page} • {new Date(highlight.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      className="highlight-remove-btn"
                      onClick={() => removeHighlight(highlight.id)}
                      title="Remove highlight"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {savedHighlights.filter(h => h.page === pageNumber).length === 0 && (
                  <div className="no-highlights">No highlights on this page</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
