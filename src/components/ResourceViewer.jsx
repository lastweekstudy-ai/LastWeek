import React, { useState, useEffect, useRef } from 'react';
import { updatePDFProgress, addPDFBookmark, removePDFBookmark, trackStudyTime } from '../appwrite/pdfResources';
import useOrientation from '../hooks/useOrientation';
import OrientationPrompt from './OrientationPrompt';

const ResourceViewer = ({ resource, onClose, onOpenNotes }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  
  // Study time tracking
  const studyStartTime = useRef(Date.now());
  const lastActivityTime = useRef(Date.now());
  const studyTimeInterval = useRef(null);

  // Orientation handling for mobile/tablet
  const { 
    isLandscape, 
    isMobileOrTablet, 
    showOrientationPrompt, 
    setShowOrientationPrompt 
  } = useOrientation();

  useEffect(() => {
    // Load bookmarks
    try {
      const savedBookmarks = JSON.parse(resource.bookmarks || '[]');
      setBookmarks(savedBookmarks);
    } catch (error) {
      console.error('Failed to parse bookmarks:', error);
      setBookmarks([]);
    }
  }, [resource]);

  useEffect(() => {
    studyStartTime.current = Date.now();
    lastActivityTime.current = Date.now();
    
    studyTimeInterval.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime.current;
      
      if (timeSinceLastActivity < 2 * 60 * 1000) {
        const studyMinutes = Math.floor((now - studyStartTime.current) / (60 * 1000));
        if (studyMinutes > 0) {
          trackStudyTime(resource.$id, 1);
          studyStartTime.current = now;
        }
      }
    }, 60 * 1000);

    const handleActivity = () => {
      lastActivityTime.current = Date.now();
    };

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keypress', handleActivity);
    document.addEventListener('scroll', handleActivity);
    document.addEventListener('click', handleActivity);

    return () => {
      if (studyTimeInterval.current) {
        clearInterval(studyTimeInterval.current);
      }
      
      const finalStudyTime = Math.floor((Date.now() - studyStartTime.current) / (60 * 1000));
      if (finalStudyTime > 0) {
        trackStudyTime(resource.$id, finalStudyTime);
      }

      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keypress', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('click', handleActivity);
    };
  }, [resource.$id, resource.fileName]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
    lastActivityTime.current = Date.now();
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
    lastActivityTime.current = Date.now();
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleAddBookmark = async () => {
    if (!bookmarkTitle.trim()) return;

    try {
      await addPDFBookmark(resource.$id, 1, bookmarkTitle);
      const newBookmark = {
        page: 1,
        title: bookmarkTitle,
        timestamp: new Date().toISOString()
      };
      setBookmarks([...bookmarks, newBookmark]);
      setBookmarkTitle('');
    } catch (error) {
      console.error('Failed to add bookmark:', error);
    }
  };

  const handleRemoveBookmark = async (page) => {
    try {
      await removePDFBookmark(resource.$id, page);
      setBookmarks(bookmarks.filter(b => b.page !== page));
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  };

  const isBookmarked = bookmarks.some(b => b.page === 1);

  // Get resource URL from storage
  const resourceUrl = resource.storageFileId 
    ? `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID}/files/${resource.storageFileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`
    : null;

  if (!resourceUrl) {
    return (
      <div className="pdf-viewer-container">
        <div className="pdf-viewer-error">
          <h3>Resource Not Available</h3>
          <p>This file is not stored in the system.</p>
          <button onClick={onClose} className="btn-primary">Close</button>
        </div>
      </div>
    );
  }

  const fileType = resource.tags || '';
  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|svg)$/i.test(resource.fileName);
  const isHTML = fileType === 'text/html' || resource.fileName.endsWith('.html');

  return (
    <>
      {/* Orientation Prompt for Mobile/Tablet */}
      {showOrientationPrompt && (
        <OrientationPrompt onDismiss={() => setShowOrientationPrompt(false)} />
      )}
      
      <div className={`pdf-viewer-container ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Header */}
        <div className="pdf-viewer-header">
          <div className="pdf-viewer-title">
            <span className="pdf-icon">{isImage ? '🖼️' : '🌐'}</span>
            <h3>{resource.fileName}</h3>
          </div>
          
          <div className="pdf-viewer-actions">
            <button
              className="viewer-btn"
              onClick={handleZoomOut}
              title="Zoom out"
              disabled={zoom <= 50}
            >
              🔍-
          </button>
          
          <span className="zoom-level">{zoom}%</span>
          
          <button
            className="viewer-btn"
            onClick={handleZoomIn}
            title="Zoom in"
            disabled={zoom >= 200}
          >
            🔍+
          </button>
          
          <button
            className="viewer-btn"
            onClick={handleResetZoom}
            title="Reset zoom"
          >
            ↺
          </button>
          
          <button
            className={`viewer-btn ${isBookmarked ? 'active' : ''}`}
            onClick={() => isBookmarked ? handleRemoveBookmark(1) : setShowBookmarks(!showBookmarks)}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
          
          <button
            className="viewer-btn"
            onClick={() => onOpenNotes(1)}
            title="Add notes"
          >
            📝
          </button>
          
          <button
            className="viewer-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '⊡' : '⊞'}
          </button>
          
          <button
            className="viewer-btn close-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Bookmark Input */}
      {showBookmarks && !isBookmarked && (
        <div className="bookmark-input-panel">
          <input
            type="text"
            placeholder="Bookmark title..."
            value={bookmarkTitle}
            onChange={(e) => setBookmarkTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddBookmark()}
          />
          <button onClick={handleAddBookmark} disabled={!bookmarkTitle.trim()}>
            Add
          </button>
          <button onClick={() => setShowBookmarks(false)}>Cancel</button>
        </div>
      )}

      {/* Main Content */}
      <div className="pdf-viewer-main">
        {/* Bookmarks Sidebar */}
        {bookmarks.length > 0 && (
          <div className="pdf-viewer-sidebar">
            <h4>📑 Bookmarks</h4>
            <div className="bookmarks-list">
              {bookmarks.map((bookmark, idx) => (
                <div key={idx} className="bookmark-item">
                  <span className="bookmark-title">{bookmark.title}</span>
                  <button
                    className="bookmark-remove"
                    onClick={() => handleRemoveBookmark(bookmark.page)}
                    title="Remove bookmark"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resource Display */}
        <div className="pdf-viewer-content">
          {isImage ? (
            <div className="image-viewer" style={{ transform: `scale(${zoom / 100})` }}>
              <img 
                src={resourceUrl} 
                alt={resource.fileName}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          ) : isHTML ? (
            <div className="html-viewer" style={{ transform: `scale(${zoom / 100})` }}>
              <iframe
                src={resourceUrl}
                title={resource.fileName}
                style={{ width: '100%', height: '100%', border: 'none' }}
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="resource-preview">
              <p>Preview not available for this file type.</p>
              <a href={resourceUrl} target="_blank" rel="noopener noreferrer">
                Open in new tab
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pdf-viewer-footer">
        <div className="footer-info">
          <span>{resource.fileName}</span>
          <span>•</span>
          <span>{(resource.fileSize / 1024).toFixed(1)} KB</span>
        </div>
      </div>
    </div>
    </>
  );
};

export default ResourceViewer;
