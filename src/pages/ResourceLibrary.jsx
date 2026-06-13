import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  searchPublicResources,
  getUserImportedResourceIds,
  importSharedPDFResource,
  importSharedAudioLecture,
} from '../appwrite/resourceLibrary';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  SearchIcon,
  DownloadIcon,
  BookIcon,
  ClockIcon,
  UserIcon,
  CheckIcon,
} from '../components/Icons';

const ResourceLibrary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFileType, setSelectedFileType] = useState('all');
  // Per-card import state: { [resourceId]: 'importing' | 'done' | 'error' }
  const [importState, setImportState] = useState({});

  const categories = [
    'all',
    'Mathematics',
    'Science',
    'History',
    'Literature',
    'Computer Science',
    'Languages',
    'Business',
    'Arts',
    'Other'
  ];

  const fileTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'pdf', label: 'PDF' },
    { value: 'audio', label: 'Audio Lectures' },
    { value: 'image', label: 'Images' },
    { value: 'text', label: 'Text Files' },
    { value: 'word', label: 'Word Docs' },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadResources();
  }, [user, navigate]);

  useEffect(() => {
    filterResources();
  }, [searchQuery, selectedCategory, selectedFileType, resources]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const [sharedResources, importedIds] = await Promise.all([
        searchPublicResources('', 100),
        getUserImportedResourceIds(user.$id),
      ]);

      const resourcesWithStatus = sharedResources.map((resource) => {
        const resourceType = resource.resourceType || 'pdf';
        return {
          ...resource,
          alreadyAdded: importedIds[resourceType]?.has(resource.$id) || false,
          addCount: resource.addCount || 0,
        };
      });

      setResources(resourcesWithStatus);
      setFilteredResources(resourcesWithStatus);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };
  const filterResources = () => {
    let filtered = [...resources];

    // Search filter — check fileName, title (audio), aiTitle, description
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(resource => {
        const name = (resource.fileName || resource.title || '').toLowerCase();
        const aiTitle = (resource.aiTitle || '').toLowerCase();
        const subject = (resource.subject || '').toLowerCase();
        const description = (resource.description || '').toLowerCase();
        return name.includes(q) || aiTitle.includes(q) || subject.includes(q) || description.includes(q);
      });
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    // File type filter — audio resources have no fileType, handle gracefully
    if (selectedFileType !== 'all') {
      filtered = filtered.filter(resource => {
        if (selectedFileType === 'audio') return resource.resourceType === 'audio';
        if (resource.resourceType === 'audio') return false; // audio doesn't match pdf/image/text/word
        const type = (resource.fileType || resource.tags || '').toLowerCase();
        if (selectedFileType === 'pdf') return type.includes('pdf');
        if (selectedFileType === 'image') return type.includes('image');
        if (selectedFileType === 'text') return type.includes('text');
        if (selectedFileType === 'word') return type.includes('word') || type.includes('document');
        return true;
      });
    }

    setFilteredResources(filtered);
  };

  const handleUseResource = async (resource) => {
    if (importState[resource.$id]) return; // already importing or done

    setImportState(prev => ({ ...prev, [resource.$id]: 'importing' }));
    try {
      if (resource.resourceType === 'audio') {
        // Audio: import without a session — user picks session later
        // Pass null sessionId; the import function handles it gracefully
        await importSharedAudioLecture(resource.$id, user.$id, null);
      } else {
        await importSharedPDFResource(resource.$id, user.$id, null);
      }
      setImportState(prev => ({ ...prev, [resource.$id]: 'done' }));
      // Update the local resource list so the button flips to "Already Added"
      setResources(prev =>
        prev.map(r => r.$id === resource.$id ? { ...r, alreadyAdded: true, addCount: (r.addCount || 0) + 1 } : r)
      );
    } catch (err) {
      console.error('Failed to import resource:', err);
      setImportState(prev => ({ ...prev, [resource.$id]: 'error' }));
      // Reset error state after 3 s so user can retry
      setTimeout(() => setImportState(prev => {
        const next = { ...prev };
        delete next[resource.$id];
        return next;
      }), 3000);
    }
  };

  const getFileIcon = (typeOrTags) => {
    const t = (typeOrTags || '').toLowerCase();
    if (t.includes('pdf')) return '📄';
    if (t.includes('image')) return '🖼️';
    if (t.includes('word') || t.includes('document')) return '📝';
    if (t.includes('text')) return '📃';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="resource-library">
        <div className="container">
          <LoadingSpinner size={32} />
          <p>Loading shared resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resource-library">
      <div className="container">
        {/* Header */}
        <div className="library-header">
          <div className="header-content">
            <h1>
              <BookIcon size={32} className="header-icon" />
              Resource Library
            </h1>
            <p className="header-subtitle">
              Discover and use study materials shared by the community
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            My Resources
          </button>
        </div>

        {/* Search and Filters */}
        <div className="library-filters">
          <div className="search-box">
            <SearchIcon size={20} />
            <input
              type="text"
              placeholder="Search resources by name, subject, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <div className="filter-item">
              <label>Category</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>File Type</label>
              <select 
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="filter-select"
              >
                {fileTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <span className="results-count">
            {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <div className="empty-state">
            <BookIcon size={64} />
            <h3>No resources found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="resources-grid">
            {filteredResources.map((resource) => (
              <div key={resource.$id} className="resource-card">
                <div className="resource-header">
                  <span className="file-icon-large">
                    {resource.resourceType === 'audio' ? '🎙️' : getFileIcon(resource.tags || resource.fileType || '')}
                  </span>
                  {resource.category && (
                    <span className="category-badge">{resource.category}</span>
                  )}
                  {resource.resourceType === 'audio' && (
                    <span className="category-badge audio-badge">Audio</span>
                  )}
                </div>

                <div className="resource-body">
                  <h3 className="resource-title">
                    {resource.aiTitle || resource.fileName || resource.title || 'Untitled'}
                  </h3>

                  {resource.description && (
                    <p className="resource-description">{resource.description}</p>
                  )}

                  <div className="resource-meta">
                    <div className="meta-item">
                      <UserIcon size={14} />
                      <span>{resource.uploaderName || 'Anonymous'}</span>
                    </div>
                    <div className="meta-item">
                      <ClockIcon size={14} />
                      <span>{formatDate(resource.uploadedAt || resource.createdAt)}</span>
                    </div>
                    {resource.fileSize > 0 && (
                      <div className="meta-item">
                        <span className="file-size">{formatFileSize(resource.fileSize)}</span>
                      </div>
                    )}
                    {resource.resourceType === 'audio' && resource.duration > 0 && (
                      <div className="meta-item">
                        <span>🕐 {Math.floor(resource.duration / 60)}:{String(resource.duration % 60).padStart(2, '0')} min</span>
                      </div>
                    )}
                  </div>

                  {/* ✅ Add count — how many students added this resource */}
                  {resource.addCount > 0 && (
                    <div className="usage-stats add-count">
                      <DownloadIcon size={14} />
                      <span>Added by {resource.addCount} student{resource.addCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                <div className="resource-footer">
                  {resource.alreadyAdded || importState[resource.$id] === 'done' ? (
                    <button className="btn btn-success btn-block" disabled>
                      <CheckIcon size={16} />
                      Added to Library
                    </button>
                  ) : importState[resource.$id] === 'error' ? (
                    <button
                      className="btn btn-error btn-block"
                      onClick={() => handleUseResource(resource)}
                    >
                      Failed — Retry
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => handleUseResource(resource)}
                      disabled={importState[resource.$id] === 'importing'}
                    >
                      {importState[resource.$id] === 'importing' ? (
                        <>
                          <span className="btn-spinner" /> Adding…
                        </>
                      ) : (
                        <>
                          <DownloadIcon size={16} />
                          Add to My Library
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceLibrary;
