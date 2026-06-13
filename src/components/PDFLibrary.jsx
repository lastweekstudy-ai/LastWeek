import React, { useState, useEffect, useRef } from 'react';
import { getSessionPDFs, getPDFResource, trackStudyTime, makeResourcePublic, makeResourcePrivate } from '../appwrite/pdfResources';
import { getUserAudioLectures, getAudioLecture, makeAudioLecturePublic, makeAudioLecturePrivate } from '../appwrite/audioLecture';
import { getFileURL } from '../appwrite/storage';
import StudyInterface from './StudyInterface';
import ResourceViewer from './ResourceViewer';
import PDFNoteEditor from './PDFNoteEditor';
import AudioProcessor from './AudioProcessor';
import AudioLectureViewer from './AudioLectureViewer';
import ResourceSearch from './ResourceSearch';
import useCombinedLimits from '../hooks/useCombinedLimits';
import { formatLimit } from '../config/planLimits';

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
  const [sortBy, setSortBy] = useState('recent');
  const [showNotes, setShowNotes] = useState(false);
  const [notesPage, setNotesPage] = useState(1);
  const [activeLibTab, setActiveLibTab] = useState('files');
  const [showAudioProcessor, setShowAudioProcessor] = useState(false);
  const [showResourceSearch, setShowResourceSearch] = useState(false);
  
  // Usage limits
  const { planName, limits, usage, loading: limitsLoading, isTestingMode } = useCombinedLimits();

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

  useEffect(() => {
    if (selectedResource && isOpen) {
      studyStartTime.current = Date.now();
      lastActivityTime.current = Date.now();
      currentResourceId.current = selectedResource.$id;
      
      studyTimeInterval.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTime.current;
        
        if (timeSinceLastActivity < 2 * 60 * 1000) {
          const studyMinutes = Math.floor((now - studyStartTime.current) / (60 * 1000));
          if (studyMinutes > 0) {
            trackStudyTime(selectedResource.$id, 1);
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
        
        if (studyStartTime.current && currentResourceId.current) {
          const finalStudyTime = Math.floor((Date.now() - studyStartTime.current) / (60 * 1000));
          if (finalStudyTime > 0) {
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
      
      // Fetch both PDFs and audio lectures in parallel
      const [sessionResources, audioLectures] = await Promise.all([
        getSessionPDFs(sessionId),
        getUserAudioLectures(userId, sessionId) // ← Pass sessionId to filter by session
      ]);
      
      // Transform audio lectures to match resource format
      const audioResources = audioLectures.map(lecture => ({
        $id: lecture.$id,
        fileName: lecture.title,
        fileSize: 0,
        tags: 'audio/lecture',
        pageCount: 0,
        currentPage: 0,
        lastAccessedAt: lecture.updatedAt || lecture.createdAt,
        resourceType: 'audio',
        isPublic: lecture.isPublic || false,
        // ✅ Pass through import-tracking fields so share button is hidden for imported resources
        isImported: lecture.isImported || false,
        originalLectureId: lecture.originalLectureId || null,
        addCount: lecture.addCount || 0,
        audioData: {
          audioUrl: lecture.audioUrl,
          transcript: lecture.transcript || '',
          lectureNotes: lecture.lectureNotes || '',
          duration: lecture.duration,
        },
      }));
      
      // Merge and sort by last accessed
      const allResources = [...sessionResources, ...audioResources].sort(
        (a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)
      );
      
      setResources(allResources);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResource = async (resource) => {
    try {
      if (resource.resourceType === 'audio') {
        const fullLecture = await getAudioLecture(resource.$id);
        setSelectedResource({
          ...resource,
          ...fullLecture,
          fileName: fullLecture.title || resource.fileName,
          resourceType: 'audio',
          audioData: {
            audioUrl: fullLecture.audioUrl,
            transcript: fullLecture.transcript || '',
            lectureNotes: fullLecture.lectureNotes || '',
            duration: fullLecture.duration,
          },
        });
      } else if (resource.tags === 'application/pdf' || resource.fileName?.endsWith('.pdf')) {
        const fullResource = await getPDFResource(resource.$id);
        setSelectedResource({ ...resource, ...fullResource });
      } else {
        setSelectedResource(resource);
      }
    } catch (error) {
      console.error('Failed to load resource details:', error);
      setSelectedResource(resource);
    }

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

  const getFileIcon = (fileName, fileType, resourceType) => {
    if (resourceType === 'audio') return '🎙️';
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) return '📄';
    if (fileType?.startsWith('image/') || /\.(jpg|jpeg|png|svg)$/i.test(fileName)) return '🖼️';
    if (fileType === 'text/html' || fileName.endsWith('.html')) return '🌐';
    return '📄';
  };

  const getFileTypeLabel = (fileName, fileType, resourceType) => {
    if (resourceType === 'audio') return 'Audio Lecture';
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
      {!selectedResource && !showAudioProcessor && !showResourceSearch && (
      <>
      <div className="pdf-library-overlay" onClick={onClose} />
      <div className="pdf-library-panel">
        {/* Header */}
        <div className="pdf-library-header">
          <h3>📚 Study Resources</h3>
          <button className="close-btn" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="pdf-lib-tabs">
          <button
            className={`pdf-lib-tab ${activeLibTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveLibTab('files')}
          >
            📄 Files
          </button>
        </div>

        {/* Files tab */}
        {activeLibTab === 'files' && (
          <>
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
              <button
                className="audio-upload-btn"
                onClick={() => setShowAudioProcessor(true)}
                title="Process Audio Lecture"
              >
                🎙️ Audio
              </button>
              <button
                className="rs-search-lib-btn"
                onClick={() => setShowResourceSearch(true)}
                title="Search shared resources"
              >
                🔍 Library
              </button>
            </div>

            {/* Usage limits notice */}
            {!limitsLoading && usage && limits && (
              <div style={{
                display: 'flex', gap: '0.75rem', padding: '0.5rem 0.75rem',
                fontSize: '0.72rem', color: 'var(--color-text-muted)',
                borderBottom: '1px solid var(--color-border)',
                flexWrap: 'wrap', alignItems: 'center',
              }}>
                <span style={{
                  padding: '0.15rem 0.5rem', borderRadius: '999px',
                  backgroundColor: 'rgba(var(--color-accent-rgb),0.1)', color: 'var(--color-accent)',
                  fontWeight: 700, fontSize: '0.68rem',
                }}>{planName}</span>
                <span>
                  📄 PDFs: <strong style={{ color: (usage.pdfsUploaded || 0) >= limits.pdfs ? '#ef4444' : 'var(--color-text-secondary)' }}>
                    {usage.pdfsUploaded || 0}/{formatLimit(limits.pdfs)}
                  </strong>
                  {limits.pdfs !== Infinity && ` (max ${limits.pdfMaxSizeMB}MB each)`}
                </span>
                <span>
                  🎙️ Audio: <strong style={{ color: (usage.audiosUploaded || 0) >= limits.audios ? '#ef4444' : 'var(--color-text-secondary)' }}>
                    {usage.audiosUploaded || 0}/{formatLimit(limits.audios)}
                  </strong>
                  {limits.audios !== Infinity && ` (max ${limits.audioMaxSizeMB}MB each)`}
                </span>
                <span style={{ color: '#10b981' }}>📥 Library imports: Free</span>
              </div>
            )}

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
                      <div className="pdf-icon">{getFileIcon(resource.fileName, resource.tags, resource.resourceType)}</div>
                      <div className="pdf-info">
                        <div className="pdf-name" title={resource.fileName}>
                          {resource.fileName}
                        </div>
                        <div className="pdf-meta">
                          <span className="file-type-badge">{getFileTypeLabel(resource.fileName, resource.tags, resource.resourceType)}</span>
                          {resource.pageCount && resource.pageCount > 1 && <span>{resource.pageCount} pages</span>}
                          {resource.fileSize > 0 && <span>{formatFileSize(resource.fileSize)}</span>}
                          <span>{formatDate(resource.lastAccessedAt)}</span>
                        </div>
                        {resource.currentPage && resource.currentPage > 1 && (
                          <div className="pdf-progress">
                            Page {resource.currentPage}{resource.pageCount && ` of ${resource.pageCount}`}
                          </div>
                        )}
                        {resource.tags && !resource.tags.startsWith('image/') && !resource.tags.startsWith('application/') && !resource.tags.startsWith('text/') && resource.tags !== 'audio/lecture' && (
                          <div className="pdf-tags">
                            {resource.tags.split(',').map((tag, idx) => (
                              <span key={idx} className="pdf-tag">{tag.trim()}</span>
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
                          {resource.resourceType === 'audio' ? 'Study' : 'View'}
                        </button>
                        {/* Only show share button for original (non-imported) resources */}
                        {!resource.isImported && !resource.originalResourceId && !resource.originalLectureId && (
                          <button
                            className={`pdf-action-btn ${resource.isPublic ? 'share-active' : ''}`}
                            onClick={async () => {
                              try {
                                if (resource.resourceType === 'audio') {
                                  // Handle audio sharing
                                  if (resource.isPublic) {
                                    await makeAudioLecturePrivate(resource.$id);
                                  } else {
                                    await makeAudioLecturePublic(resource.$id);
                                  }
                                } else {
                                  // Handle PDF sharing
                                  if (resource.isPublic) {
                                    await makeResourcePrivate(resource.$id);
                                  } else {
                                    await makeResourcePublic(resource.$id, resource.aiTitle || resource.fileName);
                                  }
                                }
                                loadResources();
                              } catch (e) { console.error(e); }
                            }}
                            title={resource.isPublic ? 'Remove from shared library' : 'Share to library'}
                          >
                            {resource.isPublic ? '🌐 Shared' : '🔒 Share'}
                          </button>
                        )}
                        {/* Show "Imported" badge for imported resources */}
                        {(resource.isImported || resource.originalResourceId || resource.originalLectureId) && (
                          <span className="imported-badge" title="This resource was imported from the shared library">
                            📥 Imported
                          </span>
                        )}
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
          </>
        )}
      </div>
      </>
      )}

      {selectedResource && (
        selectedResource.resourceType === 'audio' ? (
          <AudioLectureViewer
            lecture={selectedResource}
            onClose={handleCloseViewer}
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            mode={mode}
            userId={userId}
            sessionId={sessionId}
            subject={subject}
          />
        ) : selectedResource.tags === 'application/pdf' || selectedResource.fileName?.endsWith('.pdf') ? (
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

      {showAudioProcessor && (
        <AudioProcessor
          userId={userId}
          sessionId={sessionId}
          onClose={() => setShowAudioProcessor(false)}
          onLectureCreated={(lecture) => {
            setShowAudioProcessor(false);
            loadResources();
          }}
        />
      )}

      {showResourceSearch && (
        <ResourceSearch
          userId={userId}
          sessionId={sessionId}
          onImported={() => loadResources()}
          onClose={() => setShowResourceSearch(false)}
        />
      )}
    </>
  );
};

export default PDFLibrary;
