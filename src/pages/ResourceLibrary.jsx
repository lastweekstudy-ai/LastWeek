import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSharedResources, toggleResourceSharing, downloadResource } from '../appwrite/database';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  SearchIcon, 
  FilterIcon, 
  DownloadIcon,
  BookIcon,
  ClockIcon,
  UserIcon,
  ShareIcon
} from '../components/Icons';
import '../styles/ResourceLibrary.css';

const ResourceLibrary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFileType, setSelectedFileType] = useState('all');

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
    { value: 'image', label: 'Images' },
    { value: 'text', label: 'Text Files' },
    { value: 'word', label: 'Word Docs' }
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
      const sharedResources = await getSharedResources();
      setResources(sharedResources);
      setFilteredResources(sharedResources);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = [...resources];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(resource =>
        resource.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => 
        resource.category === selectedCategory
      );
    }

    // File type filter
    if (selectedFileType !== 'all') {
      filtered = filtered.filter(resource => {
        const type = resource.fileType.toLowerCase();
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
    try {
      // Navigate to mode selector with resource data
      navigate('/mode-select', { 
        state: { 
          sharedResource: resource 
        } 
      });
    } catch (error) {
      console.error('Failed to use resource:', error);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('text')) return '📃';
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
                  <span className="file-icon-large">{getFileIcon(resource.fileType)}</span>
                  {resource.category && (
                    <span className="category-badge">{resource.category}</span>
                  )}
                </div>

                <div className="resource-body">
                  <h3 className="resource-title">{resource.fileName}</h3>
                  
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
                      <span>{formatDate(resource.uploadedAt)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="file-size">{formatFileSize(resource.fileSize)}</span>
                    </div>
                  </div>

                  {resource.usageCount > 0 && (
                    <div className="usage-stats">
                      <ShareIcon size={14} />
                      <span>Used by {resource.usageCount} student{resource.usageCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                <div className="resource-footer">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => handleUseResource(resource)}
                  >
                    <DownloadIcon size={16} />
                    Use This Resource
                  </button>
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