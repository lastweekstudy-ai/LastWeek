import { databases, ID } from './config';
import { client } from './config';
import { Query } from 'appwrite';

// Language Learning Appwrite Configuration
const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;

// Collection IDs - use environment variables
export const COLLECTIONS = {
  USERS: import.meta.env.VITE_LANG_USERS_COLLECTION_ID,
  ROADMAPS: import.meta.env.VITE_LANG_ROADMAPS_COLLECTION_ID,
  LESSONS: import.meta.env.VITE_LANG_LESSONS_COLLECTION_ID,
  LESSON_ATTEMPTS: import.meta.env.VITE_LANG_LESSON_ATTEMPTS_COLLECTION_ID,
  PRACTICE_SESSIONS: import.meta.env.VITE_LANG_PRACTICE_SESSIONS_COLLECTION_ID,
  FLASHCARD_REVIEWS: import.meta.env.VITE_LANG_FLASHCARD_REVIEWS_COLLECTION_ID,
  CONVERSATION_SESSIONS: import.meta.env.VITE_LANG_CONVERSATION_SESSIONS_COLLECTION_ID,
  USER_POINTS: import.meta.env.VITE_LANG_USER_POINTS_COLLECTION_ID,
  SRS_ITEMS: import.meta.env.VITE_LANG_SRS_ITEMS_COLLECTION_ID,
};

// Language options
export const LANGUAGES = {
  PRIMARY: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh', name: 'Mandarin Chinese', flag: '🇨🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'fa', name: 'Persian', flag: '🇮🇷' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
    { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
    { code: 'el', name: 'Greek', flag: '🇬🇷' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  ],
  TARGET: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'bn', name: 'Bangla', flag: '🇧🇩' },
  ],
};

// Learning stages
export const STAGES = [
  { id: 'beginner', name: 'Beginner', color: '#10B981' },
  { id: 'elementary', name: 'Elementary', color: '#3B82F6' },
  { id: 'intermediate', name: 'Intermediate', color: '#8B5CF6' },
  { id: 'upper_intermediate', name: 'Upper-Intermediate', color: '#F59E0B' },
  { id: 'advanced', name: 'Advanced', color: '#EF4444' },
  { id: 'mastery', name: 'Mastery', color: '#EC4899' },
  { id: 'native', name: 'Native-like', color: '#6B7280' },
];

// Module types
export const MODULE_TYPES = [
  'vocabulary',
  'pronunciation',
  'speaking',
  'listening',
  'reading',
  'writing',
  'grammar',
  'sentence_structure',
  'synonyms_antonyms',
  'idioms_expressions',
  'cultural_context',
];

// Practice types
export const PRACTICE_TYPES = [
  'mcq',
  'flashcards',
  'typing',
  'fill_blank',
  'speaking',
  'conversation',
  'reading_comprehension',
  'writing',
];

// ===== USER FUNCTIONS =====

// Get or create language user profile
export const getLanguageUser = async (userId) => {
  try {
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.USERS, [
      Query.equal('userId', userId),
    ]);
    
    if (response.documents.length > 0) {
      return response.documents[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting language user:', error);
    return null;
  }
};

// Create language user profile
export const createLanguageUser = async (userId, data) => {
  try {
    const response = await databases.createDocument(DB_ID, COLLECTIONS.USERS, ID.unique(), {
      userId,
      primaryLanguage: data.primaryLanguage,
      targetLanguage: data.targetLanguage,
      learningRatio: data.learningRatio || 70,
      totalXP: 0,
      currentStage: 'beginner',
      streakDays: 0,
      lastActiveDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    console.error('Error creating language user:', error);
    throw error;
  }
};

// Update language user
export const updateLanguageUser = async (userId, data) => {
  try {
    const user = await getLanguageUser(userId);
    if (!user) throw new Error('User not found');
    
    const response = await databases.updateDocument(DB_ID, COLLECTIONS.USERS, user.$id, data);
    return response;
  } catch (error) {
    console.error('Error updating language user:', error);
    throw error;
  }
};

// Update XP and streak
export const addUserPoints = async (userId, xpAmount, reason) => {
  try {
    const user = await getLanguageUser(userId);
    if (!user) throw new Error('User not found');
    
    // Update user points
    const newTotalXP = user.totalXP + xpAmount;
    await databases.updateDocument(DB_ID, COLLECTIONS.USERS, user.$id, {
      totalXP: newTotalXP,
      lastActiveDate: new Date().toISOString(),
    });
    
    // Log points
    await databases.createDocument(DB_ID, COLLECTIONS.USER_POINTS, ID.unique(), {
      userId,
      xpAmount,
      reason,
      timestamp: new Date().toISOString(),
    });
    
    return newTotalXP;
  } catch (error) {
    console.error('Error adding user points:', error);
    throw error;
  }
};

// ===== ROADMAP FUNCTIONS =====

// Save roadmap
export const saveRoadmap = async (userId, primaryLanguage, targetLanguage, roadmap) => {
  try {
    // Check if roadmap exists
    const existing = await databases.listDocuments(DB_ID, COLLECTIONS.ROADMAPS, [
      Query.equal('userId', userId),
    ]);
    
    if (existing.documents.length > 0) {
      // Update existing
      const response = await databases.updateDocument(
        DB_ID, 
        COLLECTIONS.ROADMAPS, 
        existing.documents[0].$id, 
        {
          roadmap: JSON.stringify(roadmap),
          updatedAt: new Date().toISOString(),
        }
      );
      return response;
    }
    
    // Create new
    const response = await databases.createDocument(DB_ID, COLLECTIONS.ROADMAPS, ID.unique(), {
      userId,
      primaryLanguage,
      targetLanguage,
      roadmap: JSON.stringify(roadmap),
      createdAt: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    console.error('Error saving roadmap:', error);
    throw error;
  }
};

// Get roadmap
export const getRoadmap = async (userId) => {
  try {
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.ROADMAPS, [
      Query.equal('userId', userId),
    ]);
    
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        ...doc,
        roadmap: JSON.parse(doc.roadmap),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting roadmap:', error);
    return null;
  }
};

// ===== LESSON FUNCTIONS =====

// Save lesson progress
export const saveLessonProgress = async (userId, lessonData) => {
  try {
    const response = await databases.createDocument(DB_ID, COLLECTIONS.LESSONS, ID.unique(), {
      userId,
      moduleId: lessonData.moduleId,
      stageName: lessonData.stageName,
      moduleName: lessonData.moduleName,
      status: lessonData.status || 'completed',
      score: lessonData.score || 0,
      attempts: lessonData.attempts || 1,
      completedAt: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    console.error('Error saving lesson progress:', error);
    throw error;
  }
};

// Get completed lessons
export const getCompletedLessons = async (userId) => {
  try {
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.LESSONS, [
      Query.equal('userId', userId),
      Query.equal('status', 'completed'),
    ]);
    return response.documents;
  } catch (error) {
    console.error('Error getting completed lessons:', error);
    return [];
  }
};

// Get all lessons (not just completed)
export const getAllLessons = async (userId) => {
  try {
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.LESSONS, [
      Query.equal('userId', userId),
    ]);
    return response.documents;
  } catch (error) {
    console.error('Error getting all lessons:', error);
    return [];
  }
};

// Delete a lesson
export const deleteLesson = async (lessonId) => {
  try {
    await databases.deleteDocument(DB_ID, COLLECTIONS.LESSONS, lessonId);
    return true;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
};

// Update lesson progress
export const updateLesson = async (lessonId, lessonData) => {
  try {
    const response = await databases.updateDocument(
      DB_ID,
      COLLECTIONS.LESSONS,
      lessonId,
      lessonData
    );
    return response;
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

// Delete language user profile (to start fresh with new language)
export const deleteLanguageUser = async (userId) => {
  try {
    const user = await getLanguageUser(userId);
    if (!user) {
      console.log('No language user profile found, nothing to delete');
      return true; // Already doesn't exist, consider it success
    }
    
    await databases.deleteDocument(DB_ID, COLLECTIONS.USERS, user.$id);
    return true;
  } catch (error) {
    console.error('Error deleting language user:', error);
    throw error;
  }
};

// ===== PRACTICE SESSION FUNCTIONS =====

// Save practice session
export const savePracticeSession = async (userId, sessionData) => {
  try {
    const response = await databases.createDocument(
      DB_ID, 
      COLLECTIONS.PRACTICE_SESSIONS, 
      ID.unique(), 
      {
        userId,
        practiceType: sessionData.practiceType,
        modulesCovered: JSON.stringify(sessionData.modulesCovered || []),
        score: sessionData.score || 0,
        xpEarned: sessionData.xpEarned || 0,
        duration: sessionData.duration || 0,
        timestamp: new Date().toISOString(),
      }
    );
    return response;
  } catch (error) {
    console.error('Error saving practice session:', error);
    throw error;
  }
};

// ===== FLASHCARD SRS FUNCTIONS =====

// Get items due for review
export const getItemsDueForReview = async (userId) => {
  try {
    const now = new Date().toISOString();
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.FLASHCARD_REVIEWS, [
      Query.equal('userId', userId),
      Query.lessThanEqual('nextReview', now),
    ]);
    return response.documents;
  } catch (error) {
    console.error('Error getting items due for review:', error);
    return [];
  }
};

// Save flashcard review
export const saveFlashcardReview = async (userId, itemData) => {
  try {
    // Calculate next review date based on rating
    const now = new Date();
    let nextReview;
    let successStreak = itemData.successStreak || 0;
    
    if (itemData.rating === 'easy') {
      successStreak += 1;
      const days = Math.min(60, Math.pow(2, Math.min(successStreak, 5)) * 7);
      nextReview = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    } else if (itemData.rating === 'hard') {
      successStreak = Math.max(0, successStreak - 1);
      nextReview = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      // Forgot - reset
      successStreak = 0;
      nextReview = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    // Check if item exists
    const existing = await databases.listDocuments(DB_ID, COLLECTIONS.FLASHCARD_REVIEWS, [
      Query.equal('userId', userId),
      Query.equal('itemId', itemData.itemId),
    ]);
    
    if (existing.documents.length > 0) {
      // Update existing
      const response = await databases.updateDocument(
        DB_ID,
        COLLECTIONS.FLASHCARD_REVIEWS,
        existing.documents[0].$id,
        {
          nextReview,
          successStreak,
          difficulty: itemData.rating,
          lastReviewed: now.toISOString(),
        }
      );
      return response;
    }
    
    // Create new
    const response = await databases.createDocument(
      DB_ID,
      COLLECTIONS.FLASHCARD_REVIEWS,
      ID.unique(),
      {
        userId,
        itemId: itemData.itemId,
        itemType: itemData.itemType,
        itemContent: JSON.stringify(itemData.itemContent),
        nextReview,
        successStreak,
        difficulty: itemData.rating,
        lastReviewed: now.toISOString(),
      }
    );
    return response;
  } catch (error) {
    console.error('Error saving flashcard review:', error);
    throw error;
  }
};

// ===== CONVERSATION SESSION FUNCTIONS =====

// Save conversation session
export const saveConversationSession = async (userId, sessionData) => {
  try {
    const response = await databases.createDocument(
      DB_ID,
      COLLECTIONS.CONVERSATION_SESSIONS,
      ID.unique(),
      {
        userId,
        messages: JSON.stringify(sessionData.messages || []),
        errorSummary: sessionData.errorSummary || '',
        fluencyScore: sessionData.fluencyScore || 0,
        duration: sessionData.duration || 0,
        timestamp: new Date().toISOString(),
      }
    );
    return response;
  } catch (error) {
    console.error('Error saving conversation session:', error);
    throw error;
  }
};

export default {
  COLLECTIONS,
  LANGUAGES,
  STAGES,
  MODULE_TYPES,
  PRACTICE_TYPES,
  getLanguageUser,
  createLanguageUser,
  updateLanguageUser,
  addUserPoints,
  saveRoadmap,
  getRoadmap,
  saveLessonProgress,
  getCompletedLessons,
  getAllLessons,
  deleteLesson,
  updateLesson,
  deleteLanguageUser,
  savePracticeSession,
  getItemsDueForReview,
  saveFlashcardReview,
  saveConversationSession,
};