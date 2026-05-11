import React, { useState, useCallback, useRef } from 'react';
import { searchPublicResources, importSharedPDFResource, importSharedAudioLecture, expandSearchTerms } from '../appwrite/resourceLibrary';
import '../styles/ResourceSearch.css';

/**
 * ResourceSearch — search the shared resource library and import resources.
 * Shows PDFs, images, and audio lectures from all users.
 * Importing only copies the processed output (text, notes, transcript).
 */
const ResourceSearch = ({ userId, sessionId, onImported, onClose }) => {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [importing,  setImporting]  = useState(null); // resource $id being imported
  const [imported,   setImported]   = useState(new Set());
  const [error,      setError]      = useState('');
  const [expandedTerms, setExpandedTerms] = useState([]);
  const debounceRef = useRef(null);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setExpandedTerms([]); return; }
    setLoading(true);
    setError('');
    try {
      const terms = expandSearchTerms(q);
      setExpandedTerms(terms.filter(t => t !== q.toLowerCase()));
      const res = await searchPublicResources(q, 30);
      setResults(res);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(q), 400);
  };

  const handleImport = async (resource) => {
    if (!userId || !sessionId) return;
    setImporting(resource.$id);
    try {
      if (resource.resourceType === 'audio') {
        await importSharedAudioLecture(resource.$id, userId, sessionId); // ← Pass sessionId
      } else {
        await importSharedPDFResource(resource.$id, userId, sessionId);
      }
      setImported(prev => new Set([...prev, resource.$id]));
      onImported?.();
    } catch (err) {
      setError(`Failed to import: ${err.message}`);
    } finally {
      setImporting(null);
    }
  };

  const getIcon = (resource) => {
    if (resource.resourceType === 'audio') return '🎙️';
    const tags = resource.tags || '';
    if (tags.startsWith('image/')) return '🖼️';
    if (tags === 'application/pdf') return '📄';
    return '📄';
  };

  const getTypeLabel = (resource) => {
    if (resource.resourceType === 'audio') return 'Audio Lecture';
    const tags = resource.tags || '';
    if (tags.startsWith('image/')) return 'Image';
    if (tags === 'application/pdf') return 'PDF';
    return 'File';
  };

  const getTitle = (resource) => {
    if (resource.resourceType === 'audio') return resource.title || 'Audio Lecture';
    return resource.aiTitle || resource.fileName || 'Untitled';
  };

  const getPreview = (resource) => {
    if (resource.resourceType === 'audio') {
      return resource.lectureNotes?.substring(0, 120) || resource.transcript?.substring(0, 120) || '';
    }
    return resource.extractedText?.substring(0, 120) || '';
  };

  return (
    <div className="rs-overlay" onClick={onClose}>
      <div className="rs-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="rs-header">
          <div className="rs-header-left">
            <span className="rs-header-icon">🔍</span>
            <h3>Search Shared Resources</h3>
          </div>
          <button className="rs-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Search input */}
        <div className="rs-search-bar">
          <input
            type="text"
            className="rs-input"
            placeholder="Search by topic, subject, or keyword... (e.g. 'force', 'calculus', 'physics')"
            value={query}
            onChange={handleQueryChange}
            autoFocus
          />
          {loading && <div className="rs-spinner" />}
        </div>

        {/* Expanded terms hint */}
        {expandedTerms.length > 0 && (
          <div className="rs-expanded-terms">
            Also searching: {expandedTerms.slice(0, 6).map(t => (
              <span key={t} className="rs-term-chip">{t}</span>
            ))}
          </div>
        )}

        {/* Error */}
        {error && <div className="rs-error">{error}</div>}

        {/* Results */}
        <div className="rs-results">
          {!query.trim() && (
            <div className="rs-empty">
              <div className="rs-empty-icon">📚</div>
              <p>Search for resources shared by other students</p>
              <span>PDFs, images, and audio lectures — already processed, ready to use</span>
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="rs-empty">
              <div className="rs-empty-icon">🔍</div>
              <p>No shared resources found for "{query}"</p>
              <span>Be the first to share resources on this topic!</span>
            </div>
          )}

          {results.map(resource => (
            <div key={resource.$id} className="rs-result-item">
              <div className="rs-result-icon">{getIcon(resource)}</div>
              <div className="rs-result-info">
                <div className="rs-result-title">{getTitle(resource)}</div>
                <div className="rs-result-meta">
                  <span className="rs-type-badge">{getTypeLabel(resource)}</span>
                  {resource.pageCount > 1 && <span>{resource.pageCount} pages</span>}
                  {resource.resourceType === 'audio' && resource.duration > 0 && (
                    <span>{Math.floor(resource.duration / 60)}:{String(resource.duration % 60).padStart(2, '0')} min</span>
                  )}
                </div>
                {getPreview(resource) && (
                  <p className="rs-result-preview">{getPreview(resource)}…</p>
                )}
              </div>
              <div className="rs-result-action">
                {imported.has(resource.$id) ? (
                  <span className="rs-imported-badge">✓ Added</span>
                ) : (
                  <button
                    className="rs-import-btn"
                    onClick={() => handleImport(resource)}
                    disabled={importing === resource.$id}
                  >
                    {importing === resource.$id ? '...' : '+ Add'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="rs-footer">
          <span>Resources are shared as processed content only — no personal notes or highlights</span>
        </div>
      </div>
    </div>
  );
};

export default ResourceSearch;
