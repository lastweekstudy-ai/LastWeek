import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_SESSION_CONTEXT_COLLECTION_ID || 'session_context';

/**
 * Create or update session context with user responses
 */
export const saveSessionContext = async (sessionId, userId, mode, responses) => {
  try {
    // Check if context already exists
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('sessionId', sessionId),
        Query.equal('userId', userId)
      ]
    );

    const contextData = {
      sessionId,
      userId,
      mode,
      responses: JSON.stringify(responses),
      currentLevel: responses.currentLevel || 'beginner',
      learningGoal: responses.learningGoal || '',
      timeAvailable: responses.timeAvailable || '',
      preferredStyle: responses.preferredStyle || '',
      priorKnowledge: responses.priorKnowledge || '',
      specificChallenges: responses.specificChallenges || '',
      assessmentCompleted: true,
      updatedAt: new Date().toISOString()
    };

    if (existing.documents.length > 0) {
      // Update existing
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        existing.documents[0].$id,
        contextData
      );
    } else {
      // Create new
      return await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          ...contextData,
          createdAt: new Date().toISOString()
        }
      );
    }
  } catch (error) {
    console.error('Failed to save session context:', error);
    throw error;
  }
};

/**
 * Get session context
 */
export const getSessionContext = async (sessionId, userId) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('sessionId', sessionId),
        Query.equal('userId', userId)
      ]
    );

    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        ...doc,
        responses: JSON.parse(doc.responses || '{}')
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to get session context:', error);
    return null;
  }
};

/**
 * Check if assessment is completed for a session
 */
export const isAssessmentCompleted = async (sessionId, userId) => {
  try {
    const context = await getSessionContext(sessionId, userId);
    return context?.assessmentCompleted || false;
  } catch (error) {
    console.error('Failed to check assessment status:', error);
    return false;
  }
};

/**
 * Get all session contexts for a user
 */
export const getUserSessionContexts = async (userId) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('updatedAt')
      ]
    );

    return response.documents.map(doc => ({
      ...doc,
      responses: JSON.parse(doc.responses || '{}')
    }));
  } catch (error) {
    console.error('Failed to get user session contexts:', error);
    return [];
  }
};

/**
 * Delete session context
 */
export const deleteSessionContext = async (sessionId, userId) => {
  try {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('sessionId', sessionId),
        Query.equal('userId', userId)
      ]
    );

    if (existing.documents.length > 0) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        existing.documents[0].$id
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to delete session context:', error);
    throw error;
  }
};
