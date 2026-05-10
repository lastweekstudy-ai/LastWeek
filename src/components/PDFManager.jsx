import React, { useState, useEffect } from 'react';
import { 
  getUserFavoritePDFs, 
  getPDFsByCategory, 
  getMostStudiedPDFs, 
  getMostViewedPDFs,
  getUserPDFCategories,
  getUserPDFs,
  togglePDFFavorite,
  updatePDFCategory,
  trackStudyTime,
  getPDFStatistics
} from '../appwrite/pdfResources';
import { useAuth } from '../context/AuthContext';
import { HeartIcon, ClockIcon, EyeIcon, TagIcon, ChartBarIcon } from './Icons';
import '../styles/PDFManager.css';

const PDFManager = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [pdfs, setPdfs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    if (user) {
      loadCategories();
      loadStatistics();
      loadPDFs();
    }
  }, [user, activeTab, selectedCategory]);

  const loadCategories = async () => {
    try {
      const userCategories = await getUserPDFCategories(user.$id);
      setCategories(userCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getPDFStatistics(user.$id);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadPDFs = async () => {
    setLoading(true);
    try {
      let loadedPdfs = [];
      
      switch (activeTab) {
        case 'favorites':
          loadedPdfs = await getUserFavoritePDFs(user.$id);
          break;
        case 'category':
          if (selectedCategory) {
            loadedPdfs = await getPDFsByCategory(user.$id, selectedCategory);
          }
          break;
        case 'most-studied':
          loadedPdfs = await getMostStudiedPDFs(user.$id);
          break;
        case 'most-viewed':
          loadedPdfs = await getMostViewedPDFs(user.$id);
          break;
        default:
          // Load all PDFs
          loadedPdfs = await getUserPDFs(user.$id);
          break;
      }
      
      setPdfs(loadedPdfs);
    } catch (error) {
      console.error('Failed to load PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (pdfId) => {
    try {
      await togglePDFFavorite(pdfId);
      loadPDFs(); // Reload to reflect changes
      loadStatistics(); // Update stats
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleUpdateCategory = async (pdfId, category) => {
    try {
      await updatePDFCategory(pdfId, category);
      setEditingCategory(null);
      setNewCategory('');
      loadPDFs();
      loadCategories();
      loadStatistics();
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleTrackStudyTime = async (pdfId, minutes) => {
    try {
      await trackStudyTime(pdfId, minutes);
      loadPDFs();
      loadStatistics();
    } catch (error) {
      console.error('Failed to track study time:', error);
    }
  };

  const formatStudyTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="pdf-manager">
      <div className="pdf-manager-header">
        <h2>PDF Library Manager</h2>
        
        {/* Statistics Overview */}
        {statistics && (
          <div className="statistics-overview">
            <div className="stat-card">
              <ChartBarIcon className="stat-icon" />
              <div className="stat-content">
                <div className="stat-value">{statistics.totalPDFs}</div>
                <div className="stat-label">Total PDFs</div>
              </div>
            </div>
            <div className="stat-card">
              <ClockIcon className="stat-icon" />
              <div className="stat-content">
                <div className="stat-value">{statistics.totalStudyTimeHours}h</div>
                <div className="stat-label">Study Time</div>
              </div>
            </div>
            <div className="stat-card">
              <EyeIcon className="stat-icon" />
              <div className="stat-content">
                <div className="stat-value">{statistics.totalViews}</div>
                <div className="stat-label">Total Views</div>
              </div>
            </div>
            <div className="stat-card">
              <HeartIcon className="stat-icon" />
              <div className="stat-content">
                <div className="stat-value">{statistics.favoritePDFs}</div>
                <div className="stat-label">Favorites</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="pdf-manager-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All PDFs
        </button>
        <button 
          className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Favorites ({statistics?.favoritePDFs || 0})
        </button>
        <button 
          className={`tab ${activeTab === 'most-studied' ? 'active' : ''}`}
          onClick={() => setActiveTab('most-studied')}
        >
          Most Studied
        </button>
        <button 
          className={`tab ${activeTab === 'most-viewed' ? 'active' : ''}`}
          onClick={() => setActiveTab('most-viewed')}
        >
          Most Viewed
        </button>
        <button 
          className={`tab ${activeTab === 'category' ? 'active' : ''}`}
          onClick={() => setActiveTab('category')}
        >
          By Category
        </button>
      </div>

      {/* Category Filter */}
      {activeTab === 'category' && (
        <div className="category-filter">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      )}

      {/* PDF List */}
      <div className="pdf-list">
        {loading ? (
          <div className="loading">Loading PDFs...</div>
        ) : pdfs.length === 0 ? (
          <div className="empty-state">
            {activeTab === 'category' && !selectedCategory 
              ? 'Select a category to view PDFs'
              : 'No PDFs found'
            }
          </div>
        ) : (
          pdfs.map(pdf => (
            <div key={pdf.$id} className="pdf-item">
              <div className="pdf-info">
                <div className="pdf-name">{pdf.fileName}</div>
                <div className="pdf-meta">
                  <span className="file-size">{formatFileSize(pdf.fileSize)}</span>
                  <span className="page-count">{pdf.pageCount} pages</span>
                  {pdf.studyTimeMinutes > 0 && (
                    <span className="study-time">
                      <ClockIcon className="meta-icon" />
                      {formatStudyTime(pdf.studyTimeMinutes)}
                    </span>
                  )}
                  {pdf.viewCount > 0 && (
                    <span className="view-count">
                      <EyeIcon className="meta-icon" />
                      {pdf.viewCount} views
                    </span>
                  )}
                </div>
                {pdf.category && (
                  <div className="pdf-category">
                    <TagIcon className="category-icon" />
                    {pdf.category}
                  </div>
                )}
              </div>

              <div className="pdf-actions">
                {/* Favorite Toggle */}
                <button
                  className={`favorite-btn ${pdf.isFavorite ? 'favorited' : ''}`}
                  onClick={() => handleToggleFavorite(pdf.$id)}
                  title={pdf.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <HeartIcon className="heart-icon" />
                </button>

                {/* Category Editor */}
                {editingCategory === pdf.$id ? (
                  <div className="category-editor">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter category"
                      className="category-input"
                    />
                    <button 
                      onClick={() => handleUpdateCategory(pdf.$id, newCategory)}
                      className="save-category-btn"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setEditingCategory(null);
                        setNewCategory('');
                      }}
                      className="cancel-category-btn"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="edit-category-btn"
                    onClick={() => {
                      setEditingCategory(pdf.$id);
                      setNewCategory(pdf.category || '');
                    }}
                    title="Edit category"
                  >
                    <TagIcon className="tag-icon" />
                  </button>
                )}

                {/* Study Time Tracker */}
                <div className="study-time-tracker">
                  <button 
                    onClick={() => handleTrackStudyTime(pdf.$id, 15)}
                    className="track-time-btn"
                    title="Add 15 minutes study time"
                  >
                    +15m
                  </button>
                  <button 
                    onClick={() => handleTrackStudyTime(pdf.$id, 30)}
                    className="track-time-btn"
                    title="Add 30 minutes study time"
                  >
                    +30m
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PDFManager;