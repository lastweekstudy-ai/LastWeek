import React, { useState, useEffect } from 'react';
import { getSessionPDFs, updatePDFProgress } from '../appwrite/pdfResources';
import { getPDFNoteCount } from '../appwrite/pdfNotes';
import { formatDistanceToNow } from 'date-fns';

const PDFResourcePanel = ({ sessionId, userId, onSelectPDF, currentPDFId = null }) => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteCounts, setNoteCounts] = useState({});

  useEffect(() => {
    if (sessionId) {
      loadPDFs();
    }
  }, [sessionId]);

  const loadPDFs = async () => {
    try {
      setLoading(true);
      const sessionPDFs = await getSessionPDFs(sessionId);
      setPdfs(sessionPDFs);
      
      // Load note counts for each PDF
      const counts = {};
      for (const pdf of sessionPDFs) {
        counts[pdf.$id] = await getPDFNoteCount(pdf.$id);
      }
      setNoteCounts(counts);
    } catch (error) {
      console.error('Failed to load PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPDF = async (pdf) => {
    // Update last accessed time
    await updatePDFProgress(pdf.$id, pdf.currentPage || 1);
    onSelectPDF(pdf);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="pdf-resource-panel">
        <div className="panel-header">
          <h3>📚 Resources</h3>
        </div>
        <div className="panel-loading">
          <div className="spinner-small"></div>
          <span>Loading PDFs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-resource-panel">
      <div className="panel-header">
        <h3>📚 Resources</h3>
        <span className="pdf-count">{pdfs.length}</span>
      </div>

      {pdfs.length === 0 ? (
        <div className="panel-empty">
          <div className="empty-icon">📄</div>
          <p>No PDFs in this session</p>
          <span className="empty-hint">Upload a PDF to get started</span>
        </div>
      ) : (
        <div className="pdf-list">
          {pdfs.map((pdf) => (
            <div
              key={pdf.$id}
              className={`pdf-item ${currentPDFId === pdf.$id ? 'active' : ''}`}
              onClick={() => handleSelectPDF(pdf)}
            >
              <div className="pdf-item-icon">
                {pdf.isFavorite ? '⭐' : '📄'}
              </div>
              
              <div className="pdf-item-content">
                <div className="pdf-item-name" title={pdf.fileName}>
                  {pdf.fileName}
                </div>
                
                <div className="pdf-item-meta">
                  <span className="pdf-size">{formatFileSize(pdf.fileSize)}</span>
                  {pdf.pageCount && (
                    <span className="pdf-pages">{pdf.pageCount} pages</span>
                  )}
                  {noteCounts[pdf.$id] > 0 && (
                    <span className="pdf-notes">📝 {noteCounts[pdf.$id]}</span>
                  )}
                </div>
                
                {pdf.currentPage && pdf.pageCount && (
                  <div className="pdf-progress-bar">
                    <div 
                      className="pdf-progress-fill"
                      style={{ width: `${(pdf.currentPage / pdf.pageCount) * 100}%` }}
                    ></div>
                  </div>
                )}
                
                <div className="pdf-item-time">
                  {formatDistanceToNow(new Date(pdf.lastAccessedAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PDFResourcePanel;
