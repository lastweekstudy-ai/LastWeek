import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PDF_HIGHLIGHTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PDF_HIGHLIGHTS_COLLECTION_ID;

// Create a highlight
export const createPDFHighlight = async (userId, pdfResourceId, pageNumber, highlightedText, position, color = 'yellow') => {
  try {
    console.log('[createPDFHighlight] Starting - userId:', userId, 'pdfResourceId:', pdfResourceId, 'page:', pageNumber);
    console.log('[createPDFHighlight] Collection ID:', PDF_HIGHLIGHTS_COLLECTION_ID);
    
    if (!PDF_HIGHLIGHTS_COLLECTION_ID) {
      console.warn('[createPDFHighlight] Collection ID not set in .env file');
      return null;
    }

    const highlight = await databases.createDocument(
      DATABASE_ID,
      PDF_HIGHLIGHTS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        pdfResourceId,
        pageNumber,
        highlightedText: highlightedText.substring(0, 5000),
        position: position ? JSON.stringify(position) : '{}', // Required field - send empty object
        color,
        createdAt: new Date().toISOString()
      }
    );
    
    console.log('[createPDFHighlight] Successfully created highlight:', highlight.$id);
    return highlight;
  } catch (error) {
    console.error('[createPDFHighlight] Failed:', error);
    console.error('[createPDFHighlight] Error details:', error.message, error.code, error.response);
    return null; // Don't throw error, just return null
  }
};

// Get all highlights for a PDF
export const getPDFHighlights = async (pdfResourceId) => {
  try {
    if (!PDF_HIGHLIGHTS_COLLECTION_ID) {
      console.warn('[getPDFHighlights] Collection ID not set');
      return [];
    }

    const highlights = await databases.listDocuments(
      DATABASE_ID,
      PDF_HIGHLIGHTS_COLLECTION_ID,
      [
        Query.equal('pdfResourceId', pdfResourceId),
        Query.orderAsc('pageNumber'),
        Query.orderDesc('createdAt')
      ]
    );
    return highlights.documents;
  } catch (error) {
    console.error('[getPDFHighlights] Failed:', error);
    return [];
  }
};

// Get highlights for a specific page
export const getPageHighlights = async (pdfResourceId, pageNumber) => {
  try {
    if (!PDF_HIGHLIGHTS_COLLECTION_ID) {
      return [];
    }

    const highlights = await databases.listDocuments(
      DATABASE_ID,
      PDF_HIGHLIGHTS_COLLECTION_ID,
      [
        Query.equal('pdfResourceId', pdfResourceId),
        Query.equal('pageNumber', pageNumber),
        Query.orderDesc('createdAt')
      ]
    );
    return highlights.documents;
  } catch (error) {
    console.error('Failed to get page highlights:', error);
    return [];
  }
};

// Delete a highlight
export const deletePDFHighlight = async (highlightId) => {
  try {
    if (!PDF_HIGHLIGHTS_COLLECTION_ID) {
      return { success: false };
    }

    await databases.deleteDocument(
      DATABASE_ID,
      PDF_HIGHLIGHTS_COLLECTION_ID,
      highlightId
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to delete PDF highlight:', error);
    return { success: false };
  }
};

// Get highlight count for a PDF
export const getPDFHighlightCount = async (pdfResourceId) => {
  try {
    if (!PDF_HIGHLIGHTS_COLLECTION_ID) {
      return 0;
    }

    const highlights = await databases.listDocuments(
      DATABASE_ID,
      PDF_HIGHLIGHTS_COLLECTION_ID,
      [
        Query.equal('pdfResourceId', pdfResourceId),
        Query.limit(1)
      ]
    );
    return highlights.total;
  } catch (error) {
    console.error('Failed to get PDF highlight count:', error);
    return 0;
  }
};
