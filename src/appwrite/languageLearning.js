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
  ],
  TARGET: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'de', name: 'German',  flag: '🇩🇪' },
    { code: 'fr', name: 'French',  flag: '🇫🇷' },
  ],
};

// Learning stages
export const STAGES = [
  { id: 'beginner', name: 'Beginner', color: '#10B981' },
  { id: 'elementary', name: 'Elementary', color: '#3B82F6' },
  { id: 'intermediate', name: 'Intermediate', color: 'var(--color-accent)' },
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

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

    // ── Streak calculation ──────────────────────────────────────────────────
    const lastActive = user.lastActiveDate
      ? new Date(user.lastActiveDate)
      : null;
    const lastActiveStr = lastActive
      ? lastActive.toISOString().slice(0, 10)
      : null;

    let newStreak = user.streakDays || 0;

    if (!lastActiveStr) {
      // First ever activity
      newStreak = 1;
    } else if (lastActiveStr === todayStr) {
      // Already active today — keep streak as-is
      newStreak = user.streakDays || 1;
    } else {
      // Check if last active was yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      if (lastActiveStr === yesterdayStr) {
        // Consecutive day — increment
        newStreak = (user.streakDays || 0) + 1;
      } else {
        // Gap of 2+ days — reset
        newStreak = 1;
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const newTotalXP = (user.totalXP || 0) + xpAmount;

    await databases.updateDocument(DB_ID, COLLECTIONS.USERS, user.$id, {
      totalXP: newTotalXP,
      lastActiveDate: now.toISOString(),
      streakDays: newStreak,
    });

    // Log points
    await databases.createDocument(DB_ID, COLLECTIONS.USER_POINTS, ID.unique(), {
      userId,
      points: xpAmount,
      reason,
      createdAt: new Date().toISOString(),
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

// Save lesson progress — with duplicate pre-check to prevent DB bloating.
// If a document for this userId + moduleId + stageName already exists,
// update it in-place instead of creating a new one.
export const saveLessonProgress = async (userId, lessonData) => {
  try {
    // ── Duplicate pre-check ──────────────────────────────────────────────────
    // Prevents the cultural-context__beginner-style duplicates that accumulate
    // every time a lesson is re-entered before completion.
    const existing = await databases.listDocuments(DB_ID, COLLECTIONS.LESSONS, [
      Query.equal('userId', userId),
      Query.equal('moduleId', lessonData.moduleId),
      Query.equal('stageName', lessonData.stageName),
      Query.orderDesc('$createdAt'),
      Query.limit(1),
    ]);

    if (existing.documents.length > 0) {
      // Document already exists — update it instead of creating a duplicate
      const docId = existing.documents[0].$id;
      const updateData = {
        status: lessonData.status || existing.documents[0].status || 'in_progress',
        score: lessonData.score ?? existing.documents[0].score ?? 0,
      };
      if (lessonData.lessonContent) updateData.lessonContent = lessonData.lessonContent;
      if (lessonData.lastSection)   updateData.lastSection   = lessonData.lastSection;
      if (lessonData.moduleName)    updateData.moduleName    = lessonData.moduleName;
      if (lessonData.status === 'completed') {
        updateData.completedAt = new Date().toISOString();
      }
      const response = await databases.updateDocument(DB_ID, COLLECTIONS.LESSONS, docId, updateData);
      console.log('[saveLessonProgress] Updated existing lesson:', docId);
      return response;
    }
    // ────────────────────────────────────────────────────────────────────────

    // No existing document — create fresh
    const docData = {
      userId,
      moduleId:   lessonData.moduleId,
      stageName:  lessonData.stageName,
      moduleName: lessonData.moduleName,
      status:     lessonData.status || 'in_progress',
      score:      lessonData.score  || 0,
      attempts:   lessonData.attempts || 1,
      completedAt: lessonData.status === 'completed' ? new Date().toISOString() : null,
    };
    if (lessonData.lessonContent) docData.lessonContent = lessonData.lessonContent;
    if (lessonData.lastSection)   docData.lastSection   = lessonData.lastSection;

    const response = await databases.createDocument(DB_ID, COLLECTIONS.LESSONS, ID.unique(), docData);
    console.log('[saveLessonProgress] Created new lesson:', response.$id);
    return response;
  } catch (error) {
    console.error('[saveLessonProgress] Error:', error);
    throw error;
  }
};

// Get completed lessons
export const getCompletedLessons = async (userId) => {
  try {
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.LESSONS, [
      Query.equal('userId', userId),
      Query.equal('status', 'completed'),
      Query.limit(100),
      Query.select(['$id', '$createdAt', '$updatedAt', 'userId', 'moduleId', 'stageName', 'moduleName', 'status', 'score', 'completedAt']),
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
      Query.limit(100),
      Query.select(['$id', '$createdAt', '$updatedAt', 'userId', 'moduleId', 'stageName', 'moduleName', 'status', 'score', 'completedAt']),
    ]);
    return response.documents;
  } catch (error) {
    console.error('Error getting all lessons:', error);
    return [];
  }
};

// Get a specific lesson by userId, moduleId, and stageName
// Returns the MOST RECENT lesson (in case of duplicates)
export const getLessonByModuleAndStage = async (userId, moduleId, stageName) => {
  try {
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.LESSONS, [
      Query.equal('userId', userId),
      Query.equal('moduleId', moduleId),
      Query.equal('stageName', stageName),
      Query.orderDesc('$createdAt'),
      Query.limit(1),
    ]);
    
    if (response.documents.length === 0) return null;

    return response.documents[0] || null;
  } catch (error) {
    console.error('Error getting lesson:', error);
    return null;
  }
};

// Get any in-progress lesson for a user
export const getInProgressLesson = async (userId) => {
  try {
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.LESSONS, [
      Query.equal('userId', userId),
      Query.equal('status', 'in_progress'),
    ]);
    return response.documents[0] || null;
  } catch (error) {
    console.error('Error getting in-progress lesson:', error);
    return null;
  }
};

// Get any lesson for a user (regardless of status) - for resuming
export const getAnyLessonForUser = async (userId) => {
  try {
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.LESSONS, [
      Query.equal('userId', userId),
      Query.limit(10),
    ]);
    console.log('Found lessons for user:', response.documents.length);
    response.documents.forEach(doc => {
      console.log('Lesson:', doc.$id, 'moduleId:', doc.moduleId, 'hasContent:', !!doc.lessonContent, 'status:', doc.status);
    });
    // Return the first one that has lessonContent, or any lesson if none have content
    const lessonWithContent = response.documents.find(doc => doc.lessonContent);
    return lessonWithContent || response.documents[0] || null;
  } catch (error) {
    console.error('Error getting any lesson:', error);
    return null;
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
