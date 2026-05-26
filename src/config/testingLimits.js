/**
 * Testing Limits Configuration
 * 
 * One-time limits for users in "testing" mode during pre-registration.
 * These are NOT monthly limits - they're single-use limits for testing all features.
 */

export const TESTING_LIMITS = {
  // Session limits
  sessions: 1,
  
  // Upload limits
  pdfs: 1,
  pdfMaxSizeMB: 5,
  audios: 1,
  audioMaxSizeMB: 5,
  
  // Chat limits
  messages: 100,
  
  // Study tools
  flashcards: 10,
  mcqs: 10,
  examPlans: 1,
  
  // Language learning
  languageLearningSessions: 1,
  
  // Library import (always free)
  libraryImport: true,
  libraryImports: Infinity,
};

/**
 * Check if a usage count is within the testing limit.
 */
export const isWithinTestingLimit = (current, limit) => {
  if (limit === Infinity) return true;
  return current < limit;
};

/**
 * Get remaining count for a testing limit.
 */
export const getTestingRemaining = (current, limit) => {
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - current);
};

/**
 * Format a testing limit for display.
 */
export const formatTestingLimit = (limit) => {
  if (limit === Infinity) return 'Unlimited';
  if (limit === 1) return '1 time';
  return `${limit} times`;
};

/**
 * Get human-readable feature name
 */
export const getFeatureName = (feature) => {
  const names = {
    sessions: 'Study Session',
    pdfs: 'PDF Upload',
    audios: 'Audio Upload',
    messages: 'Chat Message',
    flashcards: 'Flashcard',
    mcqs: 'MCQ Quiz',
    examPlans: 'Exam Plan',
    languageLearningSessions: 'Language Learning Session',
    libraryImports: 'Library Import',
  };
  return names[feature] || feature;
};

/**
 * Get feature description for limit modal
 */
export const getFeatureDescription = (feature) => {
  const descriptions = {
    sessions: 'Create AI study sessions to learn any topic',
    pdfs: 'Upload PDFs for AI-powered Q&A',
    audios: 'Upload audio lectures for AI-generated notes',
    messages: 'Chat with your AI tutor',
    flashcards: 'Generate flashcards from your study sessions',
    mcqs: 'Take AI-generated quizzes to test your knowledge',
    examPlans: 'Create exam study schedules with AI coaching',
    languageLearningSessions: 'Practice languages with AI conversation',
    libraryImports: 'Import resources from the community library',
  };
  return descriptions[feature] || '';
};
