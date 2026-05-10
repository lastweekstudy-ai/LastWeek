import React, { useState, useEffect, useRef } from 'react';
import { getSessionPDFs, trackStudyTime } from '../appwrite/pdfResources';
import { getFileURL } from '../appwrite/storage';
import StudyInterface from './StudyInterface';
import ResourceViewer from './ResourceViewer';
import PDFNoteEditor from './PDFNoteEditor';
import '../styles/PDFLibrary.css';

const PDFLibrary = ({ 
  sessionId, 
  userId, 
  isOpen, 
  onClose,
  messages = [],
  onSendMessage = () => {},
  isLoading = false,
  mode = 'mental_model',
  subject = 'General'
}) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, name, size
  const [showNotes, setShowNotes] = useState(false);
  const [notesPage, setNotesPage] = useState(1);
  
  // Study time tracking
  const studyStartTime = useRef(null);
  const lastActivityTime = useRef(null);
  const studyTimeInterval = useRef(null);
  const currentResourceId = useRef(null);

  useEffect(() => {
    if (sessionId && isOpen) {
      loadResources();
    }
  }, [sessionId, isOpen]);

  // Study time tracking effect
  useEffect(() => {
    if (selectedResource && isOpen) {
      // Start tracking study time for this resource
      studyStartTime.current = Date.now();
      lastActivityTime.current = Date.now();
      currentResourceId.current = selectedResource.$id;
      
      console.log('[PDFLibrary] Starting study time tracking for:', selectedResource.fileName);
      
      // Track study time every minute
      studyTimeInterval.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTime.current;
        
        // Only count as study time if user was active in last 2 minutes
        if (timeSinceLastActivity < 2 * 60 * 1000) {
          const studyMinutes = Math.floor((now - studyStartTime.current) / (60 * 1000));
          if (studyMinutes > 0) {
            console.log('[PDFLibrary] Tracking 1 minute of study time for:', selectedResource.fileName);
            trackStudyTime(selectedResource.$id, 1); // Track 1 minute
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
        if (studyStartTime.current && currentResourceId.current) {
          const finalStudyTime = Math.floor((Date.now() - studyStartTime.current) / (60 * 1000));
          if (finalStudyTime > 0) {
            console.log('[PDFLibrary] Final study time tracking:', finalStudyTime, 'minutes for:', selectedResource?.fileName);
            trackStudyTime(currentResourceId.current, finalStudyTime);
          }
        }

        document.removeEventListener('mousemove', handleActivity);
        document.removeEventListener('keypress', handleActivity);
        document.removeEventListener('scroll', handleActivity);
        document.removeEventListener('click', handleActivity);
      };
    }
  }, [selectedResource, isOpen]);

  const loadResources = async () => {
    try {
      setLoading(true);
      console.log('Loading resources for session:', sessionId);
      const sessionResources = await getSessionPDFs(sessionId);
      console.log('Loaded resources count:', sessionResources.length);
      console.log('Resource details:', sessionResources.map(r => ({ id: r.$id, name: r.fileName, session: r.sessionId, type: r.tags })));
      setResources(sessionResources);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResource = (resource) => {
    setSelectedResource(resource);
    // Update activity time when user selects a resource
    if (lastActivityTime.current) {
      lastActivityTime.current = Date.now();
    }
  };

  const handleCloseViewer = () => {
    setSelectedResource(null);
    // Reload resources to get updated progress
    loadResources();
  };

  const getFileIcon = (fileName, fileType) => {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) return '📄';
    if (fileType?.startsWith('image/') || /\.(jpg|jpeg|png|svg)$/i.test(fileName)) return '🖼️';
    if (fileType === 'text/html' || fileName.endsWith('.html')) return '🌐';
    return '📄';
  };

  const getFileTypeLabel = (fileName, fileType) => {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) return 'PDF';
    if (fileType === 'image/jpeg' || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'JPG';
    if (fileType === 'image/png' || fileName.endsWith('.png')) return 'PNG';
    if (fileType === 'image/svg+xml' || fileName.endsWith('.svg')) return 'SVG';
    if (fileType === 'text/html' || fileName.endsWith('.html')) return 'HTML';
    return 'File';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredResources = resources.filter(resource =>
    resource.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resource.tags && resource.tags.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.fileName.localeCompare(b.fileName);
      case 'size':
        return b.fileSize - a.fileSize;
      case 'recent':
      default:
        return new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt);
    }
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="pdf-library-overlay" onClick={onClose} />
      <div className="pdf-library-panel">
        <div className="pdf-library-header">
          <h3>📚 Study Resources</h3>
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="pdf-library-controls">
          <input
            type="text"
            className="pdf-search"
            placeholder="Search files or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="pdf-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
        </div>

        <div className="pdf-library-content">
          {loading ? (
            <div className="pdf-loading">
              <div className="spinner"></div>
              <p>Loading resources...</p>
            </div>
          ) : sortedResources.length === 0 ? (
            <div className="pdf-empty">
              <div className="empty-icon">📄</div>
              <p>No resources in this session yet</p>
              <span>Upload a PDF, image, or HTML file to get started</span>
            </div>
          ) : (
            <div className="pdf-list">
              {sortedResources.map((resource) => (
                <div key={resource.$id} className="pdf-item">
                  <div className="pdf-icon">{getFileIcon(resource.fileName, resource.tags)}</div>
                  <div className="pdf-info">
                    <div className="pdf-name" title={resource.fileName}>
                      {resource.fileName}
                    </div>
                    <div className="pdf-meta">
                      <span className="file-type-badge">{getFileTypeLabel(resource.fileName, resource.tags)}</span>
                      {resource.pageCount && resource.pageCount > 1 && <span>{resource.pageCount} pages</span>}
                      <span>{formatFileSize(resource.fileSize)}</span>
                      <span>{formatDate(resource.lastAccessedAt)}</span>
                    </div>
                    {resource.currentPage && resource.currentPage > 1 && (
                      <div className="pdf-progress">
                        Page {resource.currentPage}{resource.pageCount && ` of ${resource.pageCount}`}
                      </div>
                    )}
                    {resource.tags && !resource.tags.startsWith('image/') && !resource.tags.startsWith('application/') && !resource.tags.startsWith('text/') && (
                      <div className="pdf-tags">
                        {resource.tags.split(',').map((tag, idx) => (
                          <span key={idx} className="pdf-tag">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="pdf-actions">
                    <button
                      className="pdf-action-btn primary"
                      onClick={() => handleViewResource(resource)}
                      title="View resource"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pdf-library-footer">
          <div className="pdf-stats">
            {resources.length} resource{resources.length !== 1 ? 's' : ''} in this session
          </div>
        </div>
      </div>

      {selectedResource && (
        selectedResource.tags === 'application/pdf' || selectedResource.fileName.endsWith('.pdf') ? (
          <StudyInterface
            resource={selectedResource}
            onClose={handleCloseViewer}
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            mode={mode}
            userId={userId}
            sessionId={sessionId}
            subject={subject}
          />
        ) : (
          <ResourceViewer
            resource={selectedResource}
            onClose={handleCloseViewer}
            onOpenNotes={(page) => {
              setNotesPage(page);
              setShowNotes(true);
            }}
          />
        )
      )}

      {showNotes && selectedResource && (
        <PDFNoteEditor
          pdfResource={selectedResource}
          pageNumber={notesPage}
          userId={userId}
          onClose={() => setShowNotes(false)}
        />
      )}
    </>
  );
};

export default PDFLibrary;
