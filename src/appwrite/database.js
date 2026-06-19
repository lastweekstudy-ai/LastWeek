import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SESSIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID;
const MESSAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID;
const FLASHCARDS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FLASHCARDS_COLLECTION_ID;
const PROFILES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID;
const ATTACHMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ATTACHMENTS_COLLECTION_ID;
const FLASHCARD_COLLECTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FLASHCARD_COLLECTIONS_COLLECTION_ID;

const safeJsonString = (value, maxLength = 5000) => {
  if (value === undefined || value === null || value === '') return null;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > maxLength ? text.slice(0, maxLength) : text;
};

const isMissingAttributeError = (error) =>
  /unknown attribute|invalid document structure|attribute.*not found/i.test(error?.message || '');

// Sessions CRUD
export const createSession = async (userId, mode, subject, title, options = {}) => {
  try {
    const basePayload = {
      userId,
      mode,
      subject,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const extendedPayload = {
      ...basePayload,
      ...(options.curriculumContext && {
        curriculumContext: safeJsonString(options.curriculumContext, 6000),
      }),
      ...(options.sessionPlan && {
        sessionPlan: safeJsonString(options.sessionPlan, 10000),
      }),
      ...(options.guidedPlan && {
        guidedPlan: safeJsonString(options.guidedPlan, 6000),
      }),
      ...(options.sessionState && {
        sessionState: safeJsonString(options.sessionState, 6000),
      }),
    };

    const session = await databases.createDocument(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      ID.unique(),
      extendedPayload
    );
    return session;
  } catch (error) {
    if (isMissingAttributeError(error) && (options.curriculumContext || options.sessionPlan || options.guidedPlan || options.sessionState)) {
      const compactPayload = {
        userId,
        mode,
        subject,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(options.curriculumContext && {
          curriculumContext: safeJsonString(options.curriculumContext, 6000),
        }),
        ...(options.sessionState && {
          sessionState: safeJsonString(options.sessionState, 6000),
        }),
        ...(options.guidedPlan && {
          guidedPlan: safeJsonString(options.guidedPlan, 6000),
        }),
      };

      try {
        return await databases.createDocument(
          DATABASE_ID,
          SESSIONS_COLLECTION_ID,
          ID.unique(),
          compactPayload
        );
      } catch (compactError) {
        if (!isMissingAttributeError(compactError)) {
          throw new Error(compactError.message);
        }
        const session = await databases.createDocument(
          DATABASE_ID,
          SESSIONS_COLLECTION_ID,
          ID.unique(),
          {
            userId,
            mode,
            subject,
            title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );
        return session;
      }
    }
    throw new Error(error.message);
  }
};

export const getSession = async (sessionId) => {
  try {
    // Debug logging
    if (!DATABASE_ID) {
      throw new Error('DATABASE_ID environment variable is not set. Please check your .env file.');
    }
    if (!SESSIONS_COLLECTION_ID) {
      throw new Error('SESSIONS_COLLECTION_ID environment variable is not set. Please check your .env file.');
    }
    if (!sessionId) {
      throw new Error('sessionId parameter is required');
    }

    // Check if collection ID looks like a placeholder (but allow custom names)
    if (SESSIONS_COLLECTION_ID.includes('REPLACE') || SESSIONS_COLLECTION_ID.includes('<')) {
      throw new Error('Collection IDs are not configured. Please update .env with actual Appwrite collection IDs.');
    }

    const session = await databases.getDocument(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      sessionId
    );
    return session;
  } catch (error) {
    console.error('getSession error:', error);
    
    // Provide helpful error messages
    if (error.message.includes('Collection with the requested ID could not be found')) {
      throw new Error('Sessions collection not found. Please create the collections in Appwrite first.');
    }
    if (error.message.includes('Database with the requested ID could not be found')) {
      throw new Error('Database not found. Please create the database in Appwrite first.');
    }
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to Appwrite. Please check your internet connection and Appwrite configuration.');
    }
    
    throw new Error(`Failed to get session: ${error.message}`);
  }
};

export const getUserSessions = async (userId, limit = 50) => {
  try {
    // Debug logging to help identify the issue
    if (!DATABASE_ID) {
      throw new Error('DATABASE_ID environment variable is not set. Please check your .env file.');
    }
    if (!SESSIONS_COLLECTION_ID) {
      throw new Error('SESSIONS_COLLECTION_ID environment variable is not set. Please check your .env file.');
    }
    if (!userId) {
      throw new Error('userId parameter is required');
    }

    const sessions = await databases.listDocuments(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.notEqual('mode', 'exam_prep'), // exam sessions live at /exam-session, not /session
        Query.orderDesc('updatedAt'),
        Query.limit(limit),
        Query.select(['$id', '$createdAt', '$updatedAt', 'userId', 'mode', 'subject', 'title', 'summary', 'createdAt', 'updatedAt', 'curriculumContext', 'guidedPlan', 'sessionState'])
      ]
    );
    return sessions.documents;
  } catch (error) {
    if (isMissingAttributeError(error)) {
      const sessions = await databases.listDocuments(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.notEqual('mode', 'exam_prep'),
          Query.orderDesc('updatedAt'),
          Query.limit(limit),
          Query.select(['$id', '$createdAt', '$updatedAt', 'userId', 'mode', 'subject', 'title', 'summary', 'createdAt', 'updatedAt'])
        ]
      );
      return sessions.documents;
    }
    console.error('getUserSessions error:', error);
    // Provide more helpful error messages
    if (error.message.includes('Collection with the requested ID could not be found')) {
      throw new Error('Sessions collection not found. Please create the collections in Appwrite first.');
    }
    if (error.message.includes('Database with the requested ID could not be found')) {
      throw new Error('Database not found. Please create the database in Appwrite first.');
    }
    throw new Error(`Failed to get user sessions: ${error.message}`);
  }
};

export const updateSession = async (sessionId, data) => {
  try {
    const session = await databases.updateDocument(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      sessionId,
      {
        ...data,
        updatedAt: new Date().toISOString()
      }
    );
    return session;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const saveSessionSummary = async (sessionId, summary) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      sessionId,
      { summary, updatedAt: new Date().toISOString() }
    );
  } catch (error) {
    // Non-fatal — summary is a nice-to-have
    console.error('Failed to save session summary:', error.message);
    return null;
  }
};

export const deleteSession = async (sessionId) => {
  try {
    // First delete all messages associated with this session
    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [Query.equal('sessionId', sessionId)]
    );
    
    // Delete messages in batches to avoid overwhelming the API
    for (const message of messages.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        message.$id
      );
    }

    // Delete all flashcards associated with this session
    const flashcards = await databases.listDocuments(
      DATABASE_ID,
      FLASHCARDS_COLLECTION_ID,
      [Query.equal('sessionId', sessionId)]
    );
    
    for (const flashcard of flashcards.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        flashcard.$id
      );
    }

    // Finally delete the session itself
    await databases.deleteDocument(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      sessionId
    );
    
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }
};

export const getUserStorageUsage = async (userId) => {
  try {
    // Use Promise.all to run queries in parallel for better performance
    const [sessions, messages, flashcards] = await Promise.all([
      databases.listDocuments(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.limit(1),
          Query.select(['$id'])
        ]
      ),
      databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.limit(1),
          Query.select(['$id'])
        ]
      ),
      databases.listDocuments(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.limit(1),
          Query.select(['$id'])
        ]
      )
    ]);

    // Calculate approximate storage usage more efficiently
    let totalSize = 0;
    
    // Sessions (approximate 1KB each)
    totalSize += sessions.total * 1024;
    
    // Messages (rough count-based estimate; avoids scanning huge content on dashboard load)
    totalSize += messages.total * 2048;
    
    // Flashcards (approximate 500 bytes each)
    totalSize += flashcards.total * 512;

    return {
      totalSessions: sessions.total,
      totalMessages: messages.total,
      totalFlashcards: flashcards.total,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('Failed to calculate storage usage:', error);
    // Return cached or default values on error
    return {
      totalSessions: 0,
      totalMessages: 0,
      totalFlashcards: 0,
      totalSizeBytes: 0,
      totalSizeMB: '0.00'
    };
  }
};

// Messages CRUD
import { 
  needsChunking, 
  createChunkedMessage, 
  getSessionMessagesWithChunks,
  getSessionMessagesPage
} from './messageChunking';

export const createMessage = async (sessionId, userId, role, content) => {
  try {
    // Check if content needs chunking (>800KB)
    if (needsChunking(content)) {
      console.log('[database.js] Large message detected, using chunked storage');
      return await createChunkedMessage(sessionId, userId, role, content);
    }
    
    // Regular message (< 800KB)
    const message = await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      ID.unique(),
      {
        sessionId,
        userId,
        role,
        content,
        isChunked: false,
        totalChunks: 1,
        createdAt: new Date().toISOString()
      }
    );
    return message;
  } catch (error) {
    console.error('Create message error:', error);
    
    // Handle SSL/Network errors
    if (error.message.includes('SSL') || error.message.includes('fetch')) {
      throw new Error('Network connection error. Please check your internet connection and try again.');
    }
    
    // If regular save fails due to size, force chunking as fallback
    if (error.message.includes('length') || error.message.includes('size') || error.message.includes('413')) {
      console.warn('[database.js] Message save failed, forcing chunked storage');
      try {
        return await createChunkedMessage(sessionId, userId, role, content);
      } catch (chunkError) {
        // Last resort: aggressive truncation
        console.error('[database.js] Chunking also failed, truncating aggressively');
        const shortContent = content.substring(0, 15000) + "\n\n[Response truncated - content too long for database]";
        const message = await databases.createDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          ID.unique(),
          {
            sessionId,
            userId,
            role,
            content: shortContent,
            createdAt: new Date().toISOString()
          }
        );
        return message;
      }
    }
    throw new Error(error.message);
  }
};

export const getSessionMessages = async (sessionId) => {
  try {
    // Use chunked message retrieval (automatically handles both chunked and non-chunked messages)
    return await getSessionMessagesWithChunks(sessionId);
  } catch (error) {
    console.error('getSessionMessages error:', error);
    throw new Error(error.message);
  }
};

export const getSessionMessagesPaginated = async (sessionId, options = {}) => {
  try {
    return await getSessionMessagesPage(sessionId, options);
  } catch (error) {
    console.error('getSessionMessagesPaginated error:', error);
    throw new Error(error.message);
  }
};

// Flashcards CRUD
const flashcardCreateLocks = new Set();

const normalizeFlashcardText = (value) =>
  (value || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();

const getFlashcardDedupeKey = (userId, sessionId, front, back) =>
  [
    userId || '',
    sessionId || '',
    normalizeFlashcardText(front),
    normalizeFlashcardText(back),
  ].join('|');

export const createFlashcard = async (userId, sessionId, front, back, options = {}) => {
  const dedupeKey = getFlashcardDedupeKey(userId, sessionId, front, back);
  if (flashcardCreateLocks.has(dedupeKey)) {
    throw new Error('This flashcard is already being saved.');
  }

  try {
    flashcardCreateLocks.add(dedupeKey);
    const { collectionId = null, source = 'ai', subject = null } = options;

    try {
      const existing = await databases.listDocuments(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('sessionId', sessionId),
          Query.limit(25),
          Query.select(['$id', 'userId', 'sessionId', 'front', 'back', 'confidence', 'nextReviewAt', 'createdAt', 'collectionId', 'subject', 'source'])
        ]
      );

      const match = existing.documents.find(card =>
        normalizeFlashcardText(card.front) === normalizeFlashcardText(front) &&
        normalizeFlashcardText(card.back) === normalizeFlashcardText(back)
      );
      if (match) return match;
    } catch (lookupError) {
      console.warn('[createFlashcard] Duplicate lookup skipped:', lookupError.message);
    }

    const flashcard = await databases.createDocument(
      DATABASE_ID,
      FLASHCARDS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        sessionId,
        front,
        back,
        confidence: 0,
        nextReviewAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        ...(collectionId && { collectionId }),
        ...(source && { source }),
        ...(subject && { subject }),
      }
    );
    return flashcard;
  } catch (error) {
    throw new Error(error.message);
  } finally {
    flashcardCreateLocks.delete(dedupeKey);
  }
};

export const updateFlashcard = async (flashcardId, confidence, nextReviewAt) => {
  try {
    const flashcard = await databases.updateDocument(
      DATABASE_ID,
      FLASHCARDS_COLLECTION_ID,
      flashcardId,
      {
        confidence,
        nextReviewAt: nextReviewAt.toISOString()
      }
    );
    return flashcard;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getUserFlashcards = async (userId, limit = 100) => {
  try {
    const flashcards = await databases.listDocuments(
      DATABASE_ID,
      FLASHCARDS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('createdAt'),
        Query.limit(limit),
        Query.select(['$id', 'userId', 'sessionId', 'front', 'back', 'confidence', 'nextReviewAt', 'createdAt', 'collectionId', 'subject', 'source'])
      ]
    );
    return flashcards.documents;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getDueFlashcards = async (userId, limit = 50) => {
  try {
    const now = new Date().toISOString();
    const flashcards = await databases.listDocuments(
      DATABASE_ID,
      FLASHCARDS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.lessThanEqual('nextReviewAt', now),
        Query.limit(limit),
        Query.select(['$id', 'userId', 'sessionId', 'front', 'back', 'confidence', 'nextReviewAt', 'createdAt', 'collectionId', 'subject', 'source'])
      ]
    );
    return flashcards.documents;
  } catch (error) {
    throw new Error(error.message);
  }
};

// User Profiles CRUD
export const createUserProfile = async (userId, displayName, profileData = {}) => {
  const profilePayload = {
    ...(profileData.academicProfile && {
      academicProfile: safeJsonString(profileData.academicProfile, 6000),
    }),
    ...(profileData.languageProfile && {
      languageProfile: safeJsonString(profileData.languageProfile, 3000),
    }),
  };

  try {
    const profile = await databases.createDocument(
      DATABASE_ID,
      PROFILES_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        displayName,
        currentMode: null,
        totalSessions: 0,
        createdAt: new Date().toISOString(),
        ...profilePayload,
      }
    );
    return profile;
  } catch (error) {
    if (isMissingAttributeError(error) && Object.keys(profilePayload).length) {
      return await databases.createDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          displayName,
          currentMode: null,
          totalSessions: 0,
          createdAt: new Date().toISOString()
        }
      );
    }
    throw new Error(error.message);
  }
};

export const getUserProfile = async (userId) => {
  try {
    const profiles = await databases.listDocuments(
      DATABASE_ID,
      PROFILES_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
    return profiles.documents[0] || null;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateUserProfile = async (profileId, data) => {
  try {
    const profile = await databases.updateDocument(
      DATABASE_ID,
      PROFILES_COLLECTION_ID,
      profileId,
      data
    );
    return profile;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const saveUserLearningProfile = async (userId, profileData) => {
  const payload = {
    ...(profileData.academicProfile && {
      academicProfile: safeJsonString(profileData.academicProfile, 6000),
    }),
    ...(profileData.languageProfile && {
      languageProfile: safeJsonString(profileData.languageProfile, 3000),
    }),
  };

  if (!Object.keys(payload).length) return null;

  try {
    const profile = await getUserProfile(userId);
    if (profile?.$id) {
      return await databases.updateDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        profile.$id,
        payload
      );
    }

    return await databases.createDocument(
      DATABASE_ID,
      PROFILES_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        displayName: '',
        currentMode: null,
        totalSessions: 0,
        createdAt: new Date().toISOString(),
        ...payload,
      }
    );
  } catch (error) {
    if (isMissingAttributeError(error)) {
      console.warn('[saveUserLearningProfile] Profile fields are not available yet; using local profile only.');
      return null;
    }
    throw new Error(error.message);
  }
};

// File attachments CRUD
export const createFileAttachment = async (userId, sessionId, fileName, fileType, fileSize, fileId = null, content = null) => {
  try {
    const attachment = await databases.createDocument(
      DATABASE_ID,
      ATTACHMENTS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        sessionId,
        fileName,
        fileType,
        fileSize,
        fileId, // Appwrite Storage file ID (if using storage)
        content: content ? content.substring(0, 50000) : null, // Database content (if not using storage)
        createdAt: new Date().toISOString()
      }
    );
    return attachment;
  } catch (error) {
    console.error('Failed to create file attachment:', error);
    // Return a simplified version if database save fails
    return {
      $id: ID.unique(),
      fileName,
      fileType,
      fileId,
      content
    };
  }
};

export const getSessionAttachments = async (sessionId) => {
  try {
    const attachments = await databases.listDocuments(
      DATABASE_ID,
      ATTACHMENTS_COLLECTION_ID,
      [
        Query.equal('sessionId', sessionId),
        Query.orderDesc('createdAt')
      ]
    );
    return attachments.documents;
  } catch (error) {
    console.error('Failed to get session attachments:', error);
    return [];
  }
};

// ─── Flashcard Collections CRUD ───────────────────────────────────────────────

/**
 * Get all flashcard collections for a user.
 * Returns [] if the collection doesn't exist yet (graceful degradation).
 */
export const getUserFlashcardCollections = async (userId) => {
  if (!FLASHCARD_COLLECTIONS_COLLECTION_ID) return [];
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      FLASHCARD_COLLECTIONS_COLLECTION_ID,
      [Query.equal('userId', userId), Query.orderAsc('name')]
    );
    return result.documents;
  } catch (err) {
    console.warn('[flashcardCollections] Could not load collections:', err.message);
    return [];
  }
};

/**
 * Create a new flashcard collection.
 */
export const createFlashcardCollection = async (userId, name, color = 'var(--color-accent)', icon = '📚') => {
  try {
    return await databases.createDocument(
      DATABASE_ID,
      FLASHCARD_COLLECTIONS_COLLECTION_ID,
      ID.unique(),
      { userId, name, color, icon, createdAt: new Date().toISOString() }
    );
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Rename a flashcard collection.
 */
export const updateFlashcardCollection = async (collectionId, data) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      FLASHCARD_COLLECTIONS_COLLECTION_ID,
      collectionId,
      data
    );
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Delete a flashcard collection (does NOT delete the cards inside it).
 */
export const deleteFlashcardCollection = async (collectionId) => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      FLASHCARD_COLLECTIONS_COLLECTION_ID,
      collectionId
    );
    return { success: true };
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Move a flashcard to a different collection.
 */
export const moveFlashcardToCollection = async (flashcardId, collectionId) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      FLASHCARDS_COLLECTION_ID,
      flashcardId,
      { collectionId: collectionId || null }
    );
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Get all flashcards in a specific collection.
 */
export const getFlashcardsByCollection = async (userId, collectionId) => {
  try {
    const queries = [Query.equal('userId', userId), Query.orderDesc('createdAt')];
    if (collectionId) queries.push(Query.equal('collectionId', collectionId));
    const result = await databases.listDocuments(DATABASE_ID, FLASHCARDS_COLLECTION_ID, queries);
    return result.documents;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Delete a single flashcard.
 */
export const deleteFlashcard = async (flashcardId) => {
  try {
    await databases.deleteDocument(DATABASE_ID, FLASHCARDS_COLLECTION_ID, flashcardId);
    return { success: true };
  } catch (err) {
    throw new Error(err.message);
  }
};
