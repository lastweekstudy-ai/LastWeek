/**
 * resourceLibrary.js
 *
 * Shared resource library — search and import other users' processed resources.
 * Resources are shared as processed output only (extracted text, lecture notes,
 * transcript) — never the original user's highlights, notes, or chat history.
 *
 * Uses existing collections:
 *   - pdf_resources  (PDFs, images, HTML) — needs isPublic + aiTitle attributes
 *   - audio_lectures (audio)              — uses existing title field
 */

import { databases, ID } from './config';
import { Query } from 'appwrite';

const DATABASE_ID                  = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PDF_RESOURCES_COLLECTION_ID  = import.meta.env.VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID;
const AUDIO_LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID || 'audio_lectures';

// ── Topic expansion map for semantic search ──────────────────────────────────
// When user searches a keyword, also search these related terms
const TOPIC_EXPANSIONS = {
  physics:    ['force', 'motion', 'energy', 'velocity', 'acceleration', 'momentum', 'gravity', 'wave', 'optics', 'thermodynamics', 'quantum', 'electricity', 'magnetism'],
  math:       ['algebra', 'calculus', 'geometry', 'trigonometry', 'statistics', 'probability', 'matrix', 'vector', 'derivative', 'integral', 'equation'],
  chemistry:  ['reaction', 'molecule', 'atom', 'bond', 'acid', 'base', 'organic', 'periodic', 'element', 'compound', 'solution', 'oxidation'],
  biology:    ['cell', 'dna', 'protein', 'evolution', 'genetics', 'photosynthesis', 'respiration', 'ecosystem', 'organism', 'anatomy', 'physiology'],
  history:    ['war', 'revolution', 'empire', 'civilization', 'politics', 'economy', 'culture', 'society', 'colonialism', 'independence'],
  economics:  ['market', 'supply', 'demand', 'inflation', 'gdp', 'trade', 'fiscal', 'monetary', 'microeconomics', 'macroeconomics'],
  force:      ['newton', 'motion', 'acceleration', 'mass', 'friction', 'gravity', 'momentum', 'impulse', 'free body', 'diagram'],
  motion:     ['velocity', 'acceleration', 'displacement', 'kinematics', 'dynamics', 'force', 'speed', 'trajectory'],
  calculus:   ['derivative', 'integral', 'limit', 'differential', 'function', 'continuity', 'series', 'convergence'],
  algebra:    ['equation', 'polynomial', 'matrix', 'linear', 'quadratic', 'variable', 'expression', 'inequality'],
  trigonometry: ['sine', 'cosine', 'tangent', 'angle', 'triangle', 'unit circle', 'radian', 'degree', 'pythagorean'],
  programming: ['algorithm', 'data structure', 'function', 'loop', 'array', 'object', 'class', 'recursion', 'sorting'],
};

/**
 * Expand a search query with related terms
 */
export const expandSearchTerms = (query) => {
  const lower = query.toLowerCase().trim();
  const terms = new Set([lower]);

  // Direct expansion
  if (TOPIC_EXPANSIONS[lower]) {
    TOPIC_EXPANSIONS[lower].forEach(t => terms.add(t));
  }

  // Reverse expansion — if query matches a value, add the key
  Object.entries(TOPIC_EXPANSIONS).forEach(([key, values]) => {
    if (values.some(v => v.includes(lower) || lower.includes(v))) {
      terms.add(key);
      values.forEach(v => terms.add(v));
    }
  });

  return Array.from(terms).slice(0, 10); // cap at 10 terms
};

/**
 * Search public resources across all users
 * Returns PDFs + audio lectures matching the query
 * 
 * Uses client-side filtering since Appwrite Query.search() requires full-text indexes
 */
export const searchPublicResources = async (query, limit = 30) => {
  if (!query?.trim()) return [];

  const terms = expandSearchTerms(query);
  const results = [];
  const seen = new Set();
  const queryLower = query.toLowerCase();

  // Helper function to check if text matches any term
  const matchesAnyTerm = (text) => {
    if (!text) return false;
    const textLower = text.toLowerCase();
    return terms.some(term => textLower.includes(term));
  };

  // Fetch all public PDF resources
  try {
    let offset = 0;
    let hasMore = true;

    while (hasMore && results.length < limit * 2) {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          PDF_RESOURCES_COLLECTION_ID,
          [
            Query.equal('isPublic', true),
            Query.limit(100),
            Query.offset(offset),
          ]
        );

        if (res.documents.length === 0) {
          hasMore = false;
          break;
        }

        // Filter client-side
        res.documents.forEach(doc => {
          if (!seen.has(doc.$id)) {
            const fileName = doc.fileName || '';
            const aiTitle = doc.aiTitle || '';
            const extractedText = doc.extractedText || '';

            // Check if any term matches fileName, aiTitle, or extracted text
            if (
              matchesAnyTerm(fileName) ||
              matchesAnyTerm(aiTitle) ||
              matchesAnyTerm(extractedText.substring(0, 500)) // Check first 500 chars
            ) {
              seen.add(doc.$id);
              results.push({ ...doc, resourceType: 'pdf' });
            }
          }
        });

        offset += 100;
      } catch (err) {
        console.error('[searchPublicResources] PDF batch fetch failed:', err.message);
        hasMore = false;
      }
    }
  } catch (err) {
    console.error('[searchPublicResources] PDF search failed:', err.message);
  }

  // Fetch all public audio lectures
  try {
    let offset = 0;
    let hasMore = true;

    while (hasMore && results.length < limit * 2) {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          AUDIO_LECTURES_COLLECTION_ID,
          [
            Query.equal('isPublic', true), // Only fetch public lectures
            Query.limit(100),
            Query.offset(offset),
          ]
        );

        if (res.documents.length === 0) {
          hasMore = false;
          break;
        }

        // Filter client-side
        res.documents.forEach(doc => {
          if (!seen.has(doc.$id)) {
            const title = doc.title || '';
            const transcript = doc.transcript || '';
            const lectureNotes = doc.lectureNotes || '';

            // Check if any term matches title, transcript, or notes
            if (
              matchesAnyTerm(title) ||
              matchesAnyTerm(transcript.substring(0, 500)) ||
              matchesAnyTerm(lectureNotes.substring(0, 500))
            ) {
              seen.add(doc.$id);
              results.push({ ...doc, resourceType: 'audio' });
            }
          }
        });

        offset += 100;
      } catch (err) {
        console.error('[searchPublicResources] Audio batch fetch failed:', err.message);
        hasMore = false;
      }
    }
  } catch (err) {
    console.error('[searchPublicResources] Audio search failed:', err.message);
  }

  return results.slice(0, limit);
};

/**
 * Make a PDF resource public (opt-in sharing)
 */
export const makeResourcePublic = async (resourceId, aiTitle = null) => {
  try {
    const data = { isPublic: true };
    if (aiTitle) data.aiTitle = aiTitle.substring(0, 500);
    return await databases.updateDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      resourceId,
      data
    );
  } catch (err) {
    console.error('[makeResourcePublic] Failed:', err.message);
    throw err;
  }
};

/**
 * Make a PDF resource private
 */
export const makeResourcePrivate = async (resourceId) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      resourceId,
      { isPublic: false }
    );
  } catch (err) {
    console.error('[makeResourcePrivate] Failed:', err.message);
    throw err;
  }
};

/**
 * Import a shared PDF resource into the current user's session.
 * Only copies the processed output — NOT highlights, notes, bookmarks, or chat.
 */
export const importSharedPDFResource = async (sourceResourceId, targetUserId, targetSessionId) => {
  try {
    const source = await databases.getDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      sourceResourceId
    );

    console.log('[importSharedPDFResource] Source resource:', {
      fileName: source.fileName,
      storageFileId: source.storageFileId,
      hasExtractedText: !!source.extractedText,
      pageCount: source.pageCount,
    });

    // Create a new resource for the importing user with only the processed data
    const imported = await databases.createDocument(
      DATABASE_ID,
      PDF_RESOURCES_COLLECTION_ID,
      ID.unique(),
      {
        userId:        targetUserId,
        sessionId:     targetSessionId,
        fileName:      source.aiTitle || source.fileName,
        fileSize:      source.fileSize || 0,
        storageFileId: source.storageFileId || null, // same file in storage (or null if not available)
        pageCount:     source.pageCount || 1,
        thumbnail:     null,
        extractedText: source.extractedText || null, // ✅ share processed text
        notes:         '',                            // ❌ don't share notes
        currentPage:   1,
        bookmarks:     JSON.stringify([]),            // ❌ don't share bookmarks
        highlights:    JSON.stringify([]),            // ❌ don't share highlights
        tags:          source.tags || 'application/pdf',
        aiTitle:       source.aiTitle || null,
        isPublic:      false, // imported copy is private by default
        lastAccessedAt: new Date().toISOString(),
        createdAt:     new Date().toISOString(),
      }
    );

    console.log('[importSharedPDFResource] Imported resource created:', {
      $id: imported.$id,
      fileName: imported.fileName,
      storageFileId: imported.storageFileId,
    });

    return imported;
  } catch (err) {
    console.error('[importSharedPDFResource] Failed:', err.message);
    throw err;
  }
};

/**
 * Import a shared audio lecture into the current user's library.
 * Only copies title, lectureNotes, transcript, audioUrl — NOT highlights/notes.
 */
export const importSharedAudioLecture = async (sourceLectureId, targetUserId, targetSessionId) => {
  try {
    const source = await databases.getDocument(
      DATABASE_ID,
      AUDIO_LECTURES_COLLECTION_ID,
      sourceLectureId
    );

    const imported = await databases.createDocument(
      DATABASE_ID,
      AUDIO_LECTURES_COLLECTION_ID,
      ID.unique(),
      {
        userId:       targetUserId,
        sessionId:    targetSessionId, // ← Scope to target session
        title:        source.title,
        audioFileId:  source.audioFileId,  // same R2 file
        audioUrl:     source.audioUrl,     // ✅ share audio
        transcript:   source.transcript,   // ✅ share transcript
        lectureNotes: source.lectureNotes, // ✅ share notes
        duration:     source.duration || 0,
        isPublic:     false, // imported copy is private by default
        createdAt:    new Date().toISOString(),
        updatedAt:    new Date().toISOString(),
      }
    );

    return imported;
  } catch (err) {
    console.error('[importSharedAudioLecture] Failed:', err.message);
    throw err;
  }
};

/**
 * Make an audio lecture public (opt-in sharing)
 */
export const makeAudioLecturePublic = async (lectureId) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      AUDIO_LECTURES_COLLECTION_ID,
      lectureId,
      { isPublic: true }
    );
  } catch (err) {
    console.error('[makeAudioLecturePublic] Failed:', err.message);
    throw err;
  }
};

/**
 * Make an audio lecture private
 */
export const makeAudioLecturePrivate = async (lectureId) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      AUDIO_LECTURES_COLLECTION_ID,
      lectureId,
      { isPublic: false }
    );
  } catch (err) {
    console.error('[makeAudioLecturePrivate] Failed:', err.message);
    throw err;
  }
};

/**
 * Generate an AI title for a resource based on its content.
 * Uses DeepSeek to infer a concise topic title.
 */
export const generateAITitle = async (content, fileName) => {
  const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!DEEPSEEK_API_KEY || !content) return fileName;

  try {
    const preview = content.substring(0, 2000);
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `Based on this content, generate a concise topic title (max 8 words, no quotes, no punctuation at end). Just the title, nothing else.\n\nContent preview:\n${preview}`
        }],
        max_tokens: 30,
        temperature: 0.3,
      })
    });
    if (!res.ok) return fileName;
    const data = await res.json();
    const title = data.choices?.[0]?.message?.content?.trim();
    return title || fileName;
  } catch {
    return fileName;
  }
};
