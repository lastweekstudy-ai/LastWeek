/**
 * Plan Limits Configuration
 * 
 * All limits are PER MONTH unless noted otherwise.
 * "Unlimited" is represented as Infinity.
 */

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    sessions: 5,
    messages: 500,
    pdfs: 3,
    pdfMaxSizeMB: 5,
    audios: 1,
    audioMaxSizeMB: 10,
    flashcards: 30,
    mcqs: 20,
    examPlans: 1,
    storageMB: 50,
    languageLearning: false,
    libraryImport: true,
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    sessions: 30,
    messages: 3000,
    pdfs: 20,
    pdfMaxSizeMB: 10,
    audios: 10,
    audioMaxSizeMB: 25,
    flashcards: Infinity,
    mcqs: Infinity,
    examPlans: 3,
    storageMB: 500,
    languageLearning: true,
    libraryImport: true,
  },
  plus: {
    name: 'Plus',
    price: 9,
    sessions: 100,
    messages: 7000,
    pdfs: 60,
    pdfMaxSizeMB: 15,
    audios: 30,
    audioMaxSizeMB: 50,
    flashcards: Infinity,
    mcqs: Infinity,
    examPlans: 10,
    storageMB: 2048,
    languageLearning: true,
    libraryImport: true,
  },
  proplus: {
    name: 'Pro+',
    price: 19.99,
    sessions: Infinity,
    messages: Infinity,
    pdfs: Infinity,
    pdfMaxSizeMB: 20,
    audios: Infinity,
    audioMaxSizeMB: 100,
    flashcards: Infinity,
    mcqs: Infinity,
    examPlans: Infinity,
    storageMB: 10240,
    languageLearning: true,
    libraryImport: true,
  },
};

/**
 * Get the plan config for a given plan ID.
 * Falls back to 'free' if unknown.
 */
export const getPlanLimits = (planId) => {
  return PLANS[planId] || PLANS.free;
};

/**
 * Check if a usage count is within the limit.
 * Returns true if allowed, false if limit reached.
 */
export const isWithinLimit = (current, limit) => {
  if (limit === Infinity) return true;
  return current < limit;
};

/**
 * Get remaining count for a limit.
 */
export const getRemaining = (current, limit) => {
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - current);
};

/**
 * Format a limit for display.
 */
export const formatLimit = (limit) => {
  if (limit === Infinity) return 'Unlimited';
  return limit.toLocaleString();
};

/**
 * Determine user's plan from their labels and subscription data.
 * Priority: subscription.plan > user.labels > 'free'
 */
export const getUserPlan = (user, subscription) => {
  // Check subscription first (most accurate)
  if (subscription && subscription.status === 'active') {
    const plan = subscription.plan;
    if (PLANS[plan]) return plan;
  }

  // Fallback: check user labels
  if (user?.labels?.includes('proplus')) return 'proplus';
  if (user?.labels?.includes('plus')) return 'plus';
  if (user?.labels?.includes('premium') || user?.labels?.includes('pro')) return 'pro';

  return 'free';
};
