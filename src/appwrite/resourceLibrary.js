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
const PUBLIC_PDF_LIST_FIELDS = [
  '$id',
  '$createdAt',
  '$updatedAt',
  'fileName',
  'fileSize',
  'pageCount',
  'tags',
  'aiTitle',
  'category',
  'isPublic',
  'isImported',
  'originalResourceId',
  'addCount',
  'createdAt',
  'lastAccessedAt',
];
const PUBLIC_AUDIO_LIST_FIELDS = [
  '$id',
  '$createdAt',
  '$updatedAt',
  'title',
  'duration',
  'isPublic',
  'isImported',
  'originalLectureId',
  'addCount',
  'createdAt',
  'updatedAt',
];

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
 * If query is empty, returns all public resources (for the library browse page)
 * 
 * Uses client-side filtering since Appwrite Query.search() requires full-text indexes
 */
export const searchPublicResources = async (query, limit = 30) => {
  const isEmptyQuery = !query?.trim();
  const terms = isEmptyQuery ? [] : expandSearchTerms(query);
  const results = [];
  const seen = new Set();

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
            Query.select(PUBLIC_PDF_LIST_FIELDS),
          ]
        );

        if (res.documents.length === 0) {
          hasMore = false;
          break;
        }

        res.documents.forEach(doc => {
          if (!seen.has(doc.$id)) {
            // If empty query, include all public resources
            if (isEmptyQuery) {
              seen.add(doc.$id);
              results.push({ ...doc, resourceType: 'pdf' });
            } else {
              const fileName = doc.fileName || '';
              const aiTitle = doc.aiTitle || '';

              if (
                matchesAnyTerm(fileName) ||
                matchesAnyTerm(aiTitle)
              ) {
                seen.add(doc.$id);
                results.push({ ...doc, resourceType: 'pdf' });
              }
            }
          }
        });

        offset += 100;
        // Stop paginating if we have enough results
        if (results.length >= limit) hasMore = false;
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
            Query.equal('isPublic', true),
            Query.limit(100),
            Query.offset(offset),
            Query.select(PUBLIC_AUDIO_LIST_FIELDS),
          ]
        );

        if (res.documents.length === 0) {
          hasMore = false;
          break;
        }

        res.documents.forEach(doc => {
          if (!seen.has(doc.$id)) {
            // If empty query, include all public resources
            if (isEmptyQuery) {
              seen.add(doc.$id);
              results.push({ ...doc, resourceType: 'audio' });
            } else {
              const title = doc.title || '';

              if (
                matchesAnyTerm(title)
              ) {
                seen.add(doc.$id);
                results.push({ ...doc, resourceType: 'audio' });
              }
            }
          }
        });

        offset += 100;
        if (results.length >= limit) hasMore = false;
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

export const getUserImportedResourceIds = async (userId) => {
  try {
    const [pdfs, audios] = await Promise.all([
      databases.listDocuments(
        DATABASE_ID,
        PDF_RESOURCES_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.select(['$id', 'originalResourceId']),
          Query.limit(100),
        ]
      ),
      databases.listDocuments(
        DATABASE_ID,
        AUDIO_LECTURES_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.select(['$id', 'originalLectureId']),
          Query.limit(100),
        ]
      ),
    ]);

    return {
      pdf: new Set(pdfs.documents.map((doc) => doc.originalResourceId).filter(Boolean)),
      audio: new Set(audios.documents.map((doc) => doc.originalLectureId).filter(Boolean)),
    };
  } catch (err) {
    console.warn('[getUserImportedResourceIds] Failed:', err.message);
    return { pdf: new Set(), audio: new Set() };
  }
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
 * 
 * NEW: Tracks the original resource ID and increments addCount
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
        sessionId:     targetSessionId || '',   // empty string if no session context
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
        originalResourceId: sourceResourceId, // ✅ NEW: Track the original shared resource
        isImported:    true,  // ✅ NEW: Mark as imported (can't be shared again)
        lastAccessedAt: new Date().toISOString(),
        createdAt:     new Date().toISOString(),
      }
    );

    // ✅ NEW: Increment the addCount on the original resource
    try {
      const currentAddCount = source.addCount || 0;
      await databases.updateDocument(
        DATABASE_ID,
        PDF_RESOURCES_COLLECTION_ID,
        sourceResourceId,
        { addCount: currentAddCount + 1 }
      );
      console.log('[importSharedPDFResource] Incremented addCount:', currentAddCount + 1);
    } catch (countErr) {
      console.warn('[importSharedPDFResource] Failed to increment addCount:', countErr.message);
      // Don't fail the import if count update fails
    }

    console.log('[importSharedPDFResource] Imported resource created:', {
      $id: imported.$id,
      fileName: imported.fileName,
      storageFileId: imported.storageFileId,
      originalResourceId: sourceResourceId,
      isImported: true,
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
 * 
 * NEW: Tracks the original lecture ID and increments addCount
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
        sessionId:    targetSessionId || '',   // empty string if no session context
        title:        source.title,
        audioFileId:  source.audioFileId,  // same R2 file
        audioUrl:     source.audioUrl,     // ✅ share audio
        transcript:   source.transcript,   // ✅ share transcript
        lectureNotes: source.lectureNotes, // ✅ share notes
        duration:     source.duration || 0,
        isPublic:     false, // imported copy is private by default
        originalLectureId: sourceLectureId, // ✅ NEW: Track the original shared lecture
        isImported:   true,  // ✅ NEW: Mark as imported (can't be shared again)
        createdAt:    new Date().toISOString(),
        updatedAt:    new Date().toISOString(),
      }
    );

    // ✅ NEW: Increment the addCount on the original lecture
    try {
      const currentAddCount = source.addCount || 0;
      await databases.updateDocument(
        DATABASE_ID,
        AUDIO_LECTURES_COLLECTION_ID,
        sourceLectureId,
        { addCount: currentAddCount + 1 }
      );
      console.log('[importSharedAudioLecture] Incremented addCount:', currentAddCount + 1);
    } catch (countErr) {
      console.warn('[importSharedAudioLecture] Failed to increment addCount:', countErr.message);
      // Don't fail the import if count update fails
    }

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

/**
 * ✅ NEW: Check if a resource can be shared
 * Only original resources (not imported) can be shared
 */
export const canShareResource = (resource) => {
  // If resource has isImported flag, it can't be shared
  if (resource.isImported === true) return false;
  
  // If resource has originalResourceId, it's imported and can't be shared
  if (resource.originalResourceId) return false;
  
  // Otherwise, it's an original resource and can be shared
  return true;
};

/**
 * ✅ NEW: Get the add count for a resource
 * Returns the number of users who have added this resource
 */
export const getResourceAddCount = (resource) => {
  return resource.addCount || 0;
};

/**
 * ✅ NEW: Check if user has already added a shared resource
 * Prevents duplicate imports.
 * Gracefully returns false if the attribute doesn't exist yet in Appwrite.
 */
export const hasUserAddedResource = async (userId, originalResourceId, resourceType = 'pdf') => {
  try {
    const collectionId = resourceType === 'pdf'
      ? PDF_RESOURCES_COLLECTION_ID
      : AUDIO_LECTURES_COLLECTION_ID;

    const fieldName = resourceType === 'pdf' ? 'originalResourceId' : 'originalLectureId';

    const result = await databases.listDocuments(
      DATABASE_ID,
      collectionId,
      [
        Query.equal('userId', userId),
        Query.equal(fieldName, originalResourceId),
        Query.limit(1),
      ]
    );

    return result.documents.length > 0;
  } catch (err) {
    // Attribute may not exist yet in Appwrite — treat as "not added"
    // This is safe: worst case the user can add again, which is harmless
    console.warn('[hasUserAddedResource] Query failed (attribute may not exist yet):', err.message);
    return false;
  }
};
