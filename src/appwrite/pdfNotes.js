import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PDF_NOTES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PDF_NOTES_COLLECTION_ID;

// Create a note for a PDF page
export const createPDFNote = async (userId, pdfResourceId, pageNumber, noteText, position = null, color = 'yellow') => {
  try {
    const note = await databases.createDocument(
      DATABASE_ID,
      PDF_NOTES_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        pdfResourceId,
        pageNumber,
        noteText: noteText.substring(0, 10000),
        position: position ? JSON.stringify(position) : '{}',
        color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );
    
    return note;
  } catch (error) {
    console.error('[createPDFNote] Failed:', error.message);
    throw new Error(`Failed to create PDF note: ${error.message}`);
  }
};

// Get all notes for a PDF
export const getPDFNotes = async (pdfResourceId) => {
  try {
    const notes = await databases.listDocuments(
      DATABASE_ID,
      PDF_NOTES_COLLECTION_ID,
      [
        Query.equal('pdfResourceId', pdfResourceId),
        Query.orderAsc('pageNumber'),
        Query.orderDesc('createdAt')
      ]
    );
    return notes.documents;
  } catch (error) {
    console.error('Failed to get PDF notes:', error);
    return [];
  }
};

// Get notes for a specific page
export const getPageNotes = async (pdfResourceId, pageNumber) => {
  try {
    const notes = await databases.listDocuments(
      DATABASE_ID,
      PDF_NOTES_COLLECTION_ID,
      [
        Query.equal('pdfResourceId', pdfResourceId),
        Query.equal('pageNumber', pageNumber),
        Query.orderDesc('createdAt')
      ]
    );
    return notes.documents;
  } catch (error) {
    console.error('Failed to get page notes:', error);
    return [];
  }
};

// Update a note
export const updatePDFNote = async (noteId, noteText, color = null) => {
  try {
    const updateData = {
      noteText: noteText.substring(0, 10000),
      updatedAt: new Date().toISOString()
    };
    
    if (color) {
      updateData.color = color;
    }
    
    const note = await databases.updateDocument(
      DATABASE_ID,
      PDF_NOTES_COLLECTION_ID,
      noteId,
      updateData
    );
    return note;
  } catch (error) {
    console.error('Failed to update PDF note:', error);
    throw new Error(`Failed to update PDF note: ${error.message}`);
  }
};

// Delete a note
export const deletePDFNote = async (noteId) => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      PDF_NOTES_COLLECTION_ID,
      noteId
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to delete PDF note:', error);
    throw new Error(`Failed to delete PDF note: ${error.message}`);
  }
};

// Get note count for a PDF
export const getPDFNoteCount = async (pdfResourceId) => {
  try {
    const notes = await databases.listDocuments(
      DATABASE_ID,
      PDF_NOTES_COLLECTION_ID,
      [
        Query.equal('pdfResourceId', pdfResourceId),
        Query.limit(1)
      ]
    );
    return notes.total;
  } catch (error) {
    console.error('Failed to get PDF note count:', error);
    return 0;
  }
};

// Search notes by text
export const searchPDFNotes = async (userId, searchText) => {
  try {
    const notes = await databases.listDocuments(
      DATABASE_ID,
      PDF_NOTES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.search('noteText', searchText),
        Query.orderDesc('updatedAt'),
        Query.limit(50)
      ]
    );
    return notes.documents;
  } catch (error) {
    console.error('Failed to search PDF notes:', error);
    return [];
  }
};

// Export all notes for a PDF as markdown
export const exportPDFNotesAsMarkdown = async (pdfResourceId, pdfFileName) => {
  try {
    const notes = await getPDFNotes(pdfResourceId);
    
    if (notes.length === 0) {
      return `# Notes for ${pdfFileName}\n\nNo notes available.`;
    }
    
    let markdown = `# Notes for ${pdfFileName}\n\n`;
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    markdown += `Total Notes: ${notes.length}\n\n---\n\n`;
    
    // Group notes by page
    const notesByPage = {};
    notes.forEach(note => {
      if (!notesByPage[note.pageNumber]) {
        notesByPage[note.pageNumber] = [];
      }
      notesByPage[note.pageNumber].push(note);
    });
    
    // Generate markdown for each page
    Object.keys(notesByPage).sort((a, b) => parseInt(a) - parseInt(b)).forEach(pageNum => {
      markdown += `## Page ${pageNum}\n\n`;
      notesByPage[pageNum].forEach((note, index) => {
        markdown += `### Note ${index + 1}\n`;
        markdown += `${note.noteText}\n\n`;
        markdown += `*Created: ${new Date(note.createdAt).toLocaleString()}*\n\n`;
      });
      markdown += `---\n\n`;
    });
    
    return markdown;
  } catch (error) {
    console.error('Failed to export PDF notes:', error);
    throw new Error(`Failed to export PDF notes: ${error.message}`);
  }
};
