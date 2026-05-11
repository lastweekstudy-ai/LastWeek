import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PDF_RESOURCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID;

// Create resource for any supported file type (PDF, images, HTML, SVG)
export const createPDFResource = async (userId, sessionId, fileName, fileSize, storageFileId, extractedText = null, pageCount = null, fileType = 'application/pdf') => {
  try {
    const resource = await databases.createDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        sessionId,
        fileName,
        fileSize,
        storageFileId,
        pageCount: pageCount || 1, // Images/HTML default to 1 page
        thumbnail: null,
        extractedText: extractedText ? extractedText.substring(0, 1000000) : null,
        notes: '',
        currentPage: 1,
        bookmarks: JSON.stringify([]),
        highlights: JSON.stringify([]),
        tags: fileType, // Store file type in tags field for filtering
        lastAccessedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    );
    return resource;
  } catch (error) {
    console.error('Failed to create resource:', error);
    throw new Error(`Failed to create resource: ${error.message}`);
  }
};

// Get all resources (PDFs, images, HTML, SVG) for a session
export const getSessionPDFs = async (sessionId) => {
  try {
    const pdfs = await databases.listDocuments(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      [
        Query.equal('sessionId', sessionId),
        Query.orderDesc('lastAccessedAt'),
        Query.limit(100) // Ensure we get all resources
      ]
    );
    return pdfs.documents;
  } catch (error) {
    console.error('Failed to get session resources:', error);
    return [];
  }
};

// Get all PDFs for a user
export const getUserPDFs = async (userId, limit = 50) => {
  try {
    const pdfs = await databases.listDocuments(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('lastAccessedAt'),
        Query.limit(limit)
      ]
    );
    return pdfs.documents;
  } catch (error) {
    console.error('Failed to get user PDFs:', error);
    return [];
  }
};

// Get single PDF resource
export const getPDFResource = async (pdfId) => {
  try {
    const pdf = await databases.getDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      pdfId
    );
    return pdf;
  } catch (error) {
    console.error('Failed to get PDF resource:', error);
    throw new Error(`Failed to get PDF resource: ${error.message}`);
  }
};

// Update PDF notes
export const updatePDFNotes = async (pdfId, notes) => {
  try {
    const pdf = await databases.updateDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      pdfId,
      {
        notes: notes.substring(0, 1000000), // Limit to 1MB
        lastAccessedAt: new Date().toISOString()
      }
    );
    return pdf;
  } catch (error) {
    console.error('Failed to update PDF notes:', error);
    throw new Error(`Failed to update PDF notes: ${error.message}`);
  }
};

// Update PDF progress (current page) and track view count
export const updatePDFProgress = async (pdfId, currentPage) => {
  try {
    // Get current PDF to increment view count
    const currentPdf = await getPDFResource(pdfId);
    
    const pdf = await databases.updateDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      pdfId,
      {
        currentPage,
        viewCount: (currentPdf.viewCount || 0) + 1,
        lastAccessedAt: new Date().toISOString()
      }
    );
    return pdf;
  } catch (error) {
    console.error('Failed to update PDF progress:', error);
    // Don't throw error for progress updates - not critical
    return null;
  }
};

// Track study time for a PDF
export const trackStudyTime = async (pdfId, minutesStudied) => {
  try {
    const currentPdf = await getPDFResource(pdfId);
    
    const pdf = await databases.updateDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      pdfId,
      {
        studyTimeMinutes: (currentPdf.studyTimeMinutes || 0) + minutesStudied,
        lastAccessedAt: new Date().toISOString()
      }
    );
    return pdf;
  } catch (error) {
    console.error('Failed to track study time:', error);
    return null;
  }
};

// Toggle favorite status
export const togglePDFFavorite = async (pdfId) => {
  try {
    const currentPdf = await getPDFResource(pdfId);
    
    const pdf = await databases.updateDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      pdfId,
      {
        isFavorite: !currentPdf.isFavorite,
        lastAccessedAt: new Date().toISOString()
      }
    );
    return pdf;
  } catch (error) {
    console.error('Failed to toggle PDF favorite:', error);
    throw new Error(`Failed to toggle PDF favorite: ${error.message}`);
  }
};

// Update PDF category
export const updatePDFCategory = async (pdfId, category) => {
  try {
    const pdf = await databases.updateDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      pdfId,
      {
        category: category ? category.substring(0, 100) : null,
        lastAccessedAt: new Date().toISOString()
      }
    );
    return pdf;
  } catch (error) {
    console.error('Failed to update PDF category:', error);
    throw new Error(`Failed to update PDF category: ${error.message}`);
  }
};

// Add bookmark to PDF
export const addPDFBookmark = async (pdfId, page, title) => {
  try {
    const pdf = await getPDFResource(pdfId);
    const bookmarks = JSON.parse(pdf.bookmarks || '[]');
    
    bookmarks.push({
      page,
      title,
      timestamp: new Date().toISOString()
    });
    
    const updated = await databases.updateDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      pdfId,
      {
        bookmarks: JSON.stringify(bookmarks),
        lastAccessedAt: new Date().toISOString()
      }
    );
    
    return updated;
  } catch (error) {
    console.error('[addPDFBookmark] Failed:', error.message);
    throw new Error(`Failed to add PDF bookmark: ${error.message}`);
  }
};

// Remove bookmark from PDF
export const removePDFBookmark = async (pdfId, page) => {
  try {
    // Get current PDF
    const pdf = await getPDFResource(pdfId);
    
    // Parse existing bookmarks
    const bookmarks = JSON.parse(pdf.bookmarks || '[]');
    
    // Remove bookmark for this page
    const filtered = bookmarks.filter(b => b.page !== page);
    
    // Update PDF
    const updated = await databases.updateDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      pdfId,
      {
        bookmarks: JSON.stringify(filtered),
        lastAccessedAt: new Date().toISOString()
      }
    );
    return updated;
  } catch (error) {
    console.error('Failed to remove PDF bookmark:', error);
    throw new Error(`Failed to remove PDF bookmark: ${error.message}`);
  }
};

// Update PDF tags
export const updatePDFTags = async (pdfId, tags) => {
  try {
    const pdf = await databases.updateDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      pdfId,
      {
        tags: tags.substring(0, 1000), // Limit tags length
        lastAccessedAt: new Date().toISOString()
      }
    );
    return pdf;
  } catch (error) {
    console.error('Failed to update PDF tags:', error);
    throw new Error(`Failed to update PDF tags: ${error.message}`);
  }
};

// Search PDFs by tags
export const searchPDFsByTags = async (userId, tags) => {
  try {
    const pdfs = await databases.listDocuments(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.search('tags', tags),
        Query.orderDesc('lastAccessedAt')
      ]
    );
    return pdfs.documents;
  } catch (error) {
    console.error('Failed to search PDFs by tags:', error);
    return [];
  }
};

// Delete PDF resource
export const deletePDFResource = async (pdfId) => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      pdfId
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to delete PDF resource:', error);
    throw new Error(`Failed to delete PDF resource: ${error.message}`);
  }
};

// Get user's favorite PDFs
export const getUserFavoritePDFs = async (userId, limit = 20) => {
  try {
    const pdfs = await databases.listDocuments(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('isFavorite', true),
        Query.orderDesc('lastAccessedAt'),
        Query.limit(limit)
      ]
    );
    return pdfs.documents;
  } catch (error) {
    console.error('Failed to get favorite PDFs:', error);
    return [];
  }
};

// Get PDFs by category
export const getPDFsByCategory = async (userId, category, limit = 50) => {
  try {
    const pdfs = await databases.listDocuments(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('category', category),
        Query.orderDesc('lastAccessedAt'),
        Query.limit(limit)
      ]
    );
    return pdfs.documents;
  } catch (error) {
    console.error('Failed to get PDFs by category:', error);
    return [];
  }
};

// Get user's most studied PDFs (by study time)
export const getMostStudiedPDFs = async (userId, limit = 10) => {
  try {
    const pdfs = await databases.listDocuments(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.greaterThan('studyTimeMinutes', 0),
        Query.orderDesc('studyTimeMinutes'),
        Query.limit(limit)
      ]
    );
    return pdfs.documents;
  } catch (error) {
    console.error('Failed to get most studied PDFs:', error);
    return [];
  }
};

// Get user's most viewed PDFs
export const getMostViewedPDFs = async (userId, limit = 10) => {
  try {
    const pdfs = await databases.listDocuments(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.greaterThan('viewCount', 0),
        Query.orderDesc('viewCount'),
        Query.limit(limit)
      ]
    );
    return pdfs.documents;
  } catch (error) {
    console.error('Failed to get most viewed PDFs:', error);
    return [];
  }
};

// Get PDF statistics for user (enhanced with new attributes)
export const getPDFStatistics = async (userId) => {
  try {
    const pdfs = await databases.listDocuments(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.select(['$id', 'fileSize', 'tags', 'studyTimeMinutes', 'viewCount', 'isFavorite', 'category'])
      ]
    );
    
    const totalPDFs = pdfs.total;
    const totalSize = pdfs.documents.reduce((acc, pdf) => acc + (pdf.fileSize || 0), 0);
    const totalStudyTime = pdfs.documents.reduce((acc, pdf) => acc + (pdf.studyTimeMinutes || 0), 0);
    const totalViews = pdfs.documents.reduce((acc, pdf) => acc + (pdf.viewCount || 0), 0);
    const favoritePDFs = pdfs.documents.filter(pdf => pdf.isFavorite).length;
    
    // Count unique tags
    const allTags = pdfs.documents
      .map(pdf => pdf.tags || '')
      .join(',')
      .split(',')
      .filter(tag => tag.trim())
      .map(tag => tag.trim());
    
    const uniqueTags = [...new Set(allTags)];
    
    // Count unique categories
    const categories = [...new Set(
      pdfs.documents
        .map(pdf => pdf.category)
        .filter(category => category && category.trim())
    )];
    
    return {
      totalPDFs,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalStudyTimeMinutes: totalStudyTime,
      totalStudyTimeHours: (totalStudyTime / 60).toFixed(1),
      totalViews,
      averageViewsPerPDF: totalPDFs > 0 ? (totalViews / totalPDFs).toFixed(1) : 0,
      favoritePDFs,
      favoritePercentage: totalPDFs > 0 ? ((favoritePDFs / totalPDFs) * 100).toFixed(1) : 0,
      uniqueTags: uniqueTags.length,
      tags: uniqueTags,
      uniqueCategories: categories.length,
      categories: categories.sort()
    };
  } catch (error) {
    console.error('Failed to get PDF statistics:', error);
    return {
      totalPDFs: 0,
      totalSizeBytes: 0,
      totalSizeMB: '0.00',
      totalStudyTimeMinutes: 0,
      totalStudyTimeHours: '0.0',
      totalViews: 0,
      averageViewsPerPDF: 0,
      favoritePDFs: 0,
      favoritePercentage: '0.0',
      uniqueTags: 0,
      tags: [],
      uniqueCategories: 0,
      categories: []
    };
  }
};
// Get all categories for a user
export const getUserPDFCategories = async (userId) => {
  try {
    const pdfs = await databases.listDocuments(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.isNotNull('category'),
        Query.select(['category'])
      ]
    );
    
    // Extract unique categories
    const categories = [...new Set(
      pdfs.documents
        .map(pdf => pdf.category)
        .filter(category => category && category.trim())
    )];
    
    return categories.sort();
  } catch (error) {
    console.error('Failed to get user PDF categories:', error);
    return [];
  }
};

// Make a resource publicly searchable
export const makeResourcePublic = async (resourceId, aiTitle = null) => {
  try {
    const data = { isPublic: true };
    if (aiTitle) data.aiTitle = aiTitle.substring(0, 500);
    return await databases.updateDocument(DATABASE_ID, PDF_RESOURCES_COLLECTION_ID, resourceId, data);
  } catch (error) {
    console.error('[makeResourcePublic] Failed:', error.message);
    throw error;
  }
};

// Make a resource private
export const makeResourcePrivate = async (resourceId) => {
  try {
    return await databases.updateDocument(DATABASE_ID, PDF_RESOURCES_COLLECTION_ID, resourceId, { isPublic: false });
  } catch (error) {
    console.error('[makeResourcePrivate] Failed:', error.message);
    throw error;
  }
};

// Update AI-generated title for a resource
export const updateResourceAITitle = async (resourceId, aiTitle) => {
  try {
    return await databases.updateDocument(DATABASE_ID, PDF_RESOURCES_COLLECTION_ID, resourceId, {
      aiTitle: aiTitle.substring(0, 500),
    });
  } catch (error) {
    console.error('[updateResourceAITitle] Failed:', error.message);
  }
};
