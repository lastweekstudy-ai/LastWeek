import React, { useState, useCallback, useRef } from 'react';
import { searchPublicResources, importSharedPDFResource, importSharedAudioLecture, expandSearchTerms, hasUserAddedResource } from '../appwrite/resourceLibrary';

/**
 * ResourceSearch — search the shared resource library and import resources.
 * Shows PDFs, images, and audio lectures from all users.
 * Importing only copies the processed output (text, notes, transcript).
 * Imported resources are marked — they cannot be re-shared by the importer.
 */
const ResourceSearch = ({ userId, sessionId, onImported, onClose }) => {
  const [query,         setQuery]         = useState('');
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [importing,     setImporting]     = useState(null); // resource $id being imported
  const [imported,      setImported]      = useState(new Set()); // added this session
  const [alreadyAdded,  setAlreadyAdded]  = useState(new Set()); // added in a previous session
  const [error,         setError]         = useState('');
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

      // Check which ones the user has already added in a previous session
      const alreadyAddedIds = new Set();
      await Promise.all(
        res.map(async (resource) => {
          const resourceType = resource.resourceType || 'pdf';
          const added = await hasUserAddedResource(userId, resource.$id, resourceType);
          if (added) alreadyAddedIds.add(resource.$id);
        })
      );
      setAlreadyAdded(alreadyAddedIds);
      setResults(res);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(q), 400);
  };

  const handleImport = async (resource) => {
    if (!userId || !sessionId) return;
    // Guard: don't import if already added
    if (imported.has(resource.$id) || alreadyAdded.has(resource.$id)) return;

    setImporting(resource.$id);
    try {
      if (resource.resourceType === 'audio') {
        await importSharedAudioLecture(resource.$id, userId, sessionId);
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
                  {/* ✅ addCount badge */}
                  {(resource.addCount || 0) > 0 && (
                    <span className="rs-add-count">📥 {resource.addCount} added</span>
                  )}
                </div>
                {getPreview(resource) && (
                  <p className="rs-result-preview">{getPreview(resource)}…</p>
                )}
              </div>
              <div className="rs-result-action">
                {/* ✅ Three states: added this session / added previously / not added */}
                {imported.has(resource.$id) ? (
                  <span className="rs-imported-badge">✓ Added</span>
                ) : alreadyAdded.has(resource.$id) ? (
                  <span className="rs-imported-badge rs-already-badge" title="Already in your library">✓ In Library</span>
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
