import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SESSIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID;
const MESSAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID;
const FLASHCARDS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FLASHCARDS_COLLECTION_ID;
const PROFILES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID;
const ATTACHMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ATTACHMENTS_COLLECTION_ID;

// Sessions CRUD
export const createSession = async (userId, mode, subject, title) => {
  try {
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
  } catch (error) {
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

export const getUserSessions = async (userId) => {
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
        Query.orderDesc('updatedAt')
      ]
    );
    return sessions.documents;
  } catch (error) {
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
          Query.select(['$id']) // Only select ID to minimize data transfer
        ]
      ),
      databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.select(['$id', 'content']) // Only select necessary fields
        ]
      ),
      databases.listDocuments(
        DATABASE_ID,
        FLASHCARDS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.select(['$id']) // Only select ID to minimize data transfer
        ]
      )
    ]);

    // Calculate approximate storage usage more efficiently
    let totalSize = 0;
    
    // Sessions (approximate 1KB each)
    totalSize += sessions.total * 1024;
    
    // Messages (calculate actual content size, but limit processing)
    const messageSize = messages.documents.reduce((acc, message) => {
      return acc + ((message.content || '').length * 2); // UTF-8 encoding approximation
    }, 0);
    totalSize += messageSize;
    
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
export const createMessage = async (sessionId, userId, role, content) => {
  try {
    // Truncate content if it's too long (fallback safety)
    const maxLength = 1000000; // 1MB in characters (approximate)
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength - 100) + "\n\n[Content truncated due to length limit]"
      : content;

    const message = await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      ID.unique(),
      {
        sessionId,
        userId,
        role,
        content: truncatedContent,
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
    
    // If it's a content length error, try with truncated content
    if (error.message.includes('length') || error.message.includes('size')) {
      const shortContent = content.substring(0, 15000) + "\n\n[Response truncated - content too long for database]";
      try {
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
      } catch (retryError) {
        throw new Error(`Failed to save message: ${retryError.message}`);
      }
    }
    throw new Error(error.message);
  }
};

export const getSessionMessages = async (sessionId) => {
  try {
    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal('sessionId', sessionId),
        Query.orderAsc('createdAt'),
        Query.limit(1000) // Load up to 1000 messages (Appwrite max is 5000)
      ]
    );
    console.log(`Loaded ${messages.documents.length} messages for session ${sessionId}`);
    return messages.documents;
  } catch (error) {
    console.error('getSessionMessages error:', error);
    throw new Error(error.message);
  }
};

// Flashcards CRUD
export const createFlashcard = async (userId, sessionId, front, back) => {
  try {
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
        createdAt: new Date().toISOString()
      }
    );
    return flashcard;
  } catch (error) {
    throw new Error(error.message);
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

export const getUserFlashcards = async (userId) => {
  try {
    const flashcards = await databases.listDocuments(
      DATABASE_ID,
      FLASHCARDS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('createdAt')
      ]
    );
    return flashcards.documents;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getDueFlashcards = async (userId) => {
  try {
    const now = new Date().toISOString();
    const flashcards = await databases.listDocuments(
      DATABASE_ID,
      FLASHCARDS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.lessThanEqual('nextReviewAt', now)
      ]
    );
    return flashcards.documents;
  } catch (error) {
    throw new Error(error.message);
  }
};

// User Profiles CRUD
export const createUserProfile = async (userId, displayName) => {
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
        createdAt: new Date().toISOString()
      }
    );
    return profile;
  } catch (error) {
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