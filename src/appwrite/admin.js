import { databases, functions, ID } from './config';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const ADMIN_SETTINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ADMIN_SETTINGS_COLLECTION_ID || 'admin_settings';
const PRE_REGISTRATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRE_REGISTRATIONS_COLLECTION_ID || 'pre_registrations';
const PROMO_CODE_USAGE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROMO_CODE_USAGE_COLLECTION_ID || 'promo_code_usage';
const USER_REVIEWS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USER_REVIEWS_COLLECTION_ID || 'user_reviews';
const DAILY_FREE_SLOTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_DAILY_FREE_SLOTS_COLLECTION_ID || 'daily_free_slots';
const DAILY_SLOT_USAGE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_DAILY_SLOT_USAGE_COLLECTION_ID || 'daily_slot_usage';
const SUBSCRIPTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || 'subscriptions';
const TESTING_USAGE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TESTING_USAGE_COLLECTION_ID || 'testing_usage';
const PADDLE_WEBHOOK_FUNCTION_ID = import.meta.env.VITE_PADDLE_WEBHOOK_FUNCTION_ID || 'paddleWebhook';

// Singleton document ID for admin settings
const ADMIN_SETTINGS_DOC_ID = 'admin_settings_doc';
const DEFAULT_ADMIN_PAGE_SIZE = 25;

const getListTotal = async (collectionId, queries = []) => {
  const result = await databases.listDocuments(DATABASE_ID, collectionId, [
    ...queries,
    Query.limit(1),
  ]);
  return result.total || 0;
};

/**
 * Generate a unique promo code for a user
 */
export const generatePromoCode = (userId) => {
  const prefix = 'LW';
  const hash = String(userId || 'pending').slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${hash}${random}`;
};

/**
 * Get US Eastern date string (YYYY-MM-DD)
 */
export const getUSEasternDate = () => {
  const now = new Date();
  // US Eastern Time is UTC-5 (EST) or UTC-4 (EDT)
  // For simplicity, we use UTC-5
  const easternOffset = -5 * 60; // minutes
  const easternTime = new Date(now.getTime() + easternOffset * 60 * 1000);
  return easternTime.toISOString().split('T')[0];
};

// ============================================
// ADMIN SETTINGS
// ============================================

/**
 * Get admin settings (singleton)
 */
export const getAdminSettings = async () => {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      ADMIN_SETTINGS_COLLECTION_ID,
      ADMIN_SETTINGS_DOC_ID
    );
    return doc;
  } catch (err) {
    // 401 is expected on the public landing page (no session) — don't log it as an error.
    // Fix: set Read permission on admin_settings collection to "Any" in Appwrite Console
    // to allow unauthenticated access from the landing page.
    if (err.code !== 401 && !err.message?.includes('not accessible in this region')) {
      console.error('[admin] Failed to get admin settings:', err.message);
    }
    // Return defaults so the landing page renders normally
    return {
      preRegActive: false,
      paymentsActive: true,
      dailyFreeSlotsActive: false,
      dailyFreeSlotCount: 10,
      freePlanActive: true,
      proPlanActive: true,
      plusPlanActive: true,
      proPlusPlanActive: true,
      preRegPriceId: '',
      preRegDisplayPrice: 4,
      preRegDisplayValue: 108,
    };
  }
};

/**
 * Update admin settings (admin only)
 */
export const updateAdminSettings = async (updates) => {
  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      ADMIN_SETTINGS_COLLECTION_ID,
      ADMIN_SETTINGS_DOC_ID,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    );
    return doc;
  } catch (err) {
    console.error('[admin] Failed to update admin settings:', err.message);
    throw err;
  }
};

// ============================================
// PRE-REGISTRATIONS
// ============================================

/**
 * Get all pre-registrations with optional filters
 */
export const getPreRegistrations = async (filters = {}) => {
  try {
    const queries = [Query.orderDesc('createdAt'), Query.limit(100)];
    
    if (filters.status) {
      queries.push(Query.equal('status', filters.status));
    }
    if (filters.type) {
      queries.push(Query.equal('type', filters.type));
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      PRE_REGISTRATIONS_COLLECTION_ID,
      queries
    );
    return result.documents;
  } catch (err) {
    console.error('[admin] Failed to get pre-registrations:', err.message);
    return [];
  }
};

export const getPreRegistrationsPage = async ({ filters = {}, page = 0, limit = DEFAULT_ADMIN_PAGE_SIZE } = {}) => {
  try {
    const queries = [
      Query.orderDesc('createdAt'),
      Query.limit(limit),
      Query.offset(Math.max(0, page) * limit),
      Query.select([
        '$id',
        'userId',
        'email',
        'name',
        'type',
        'promoCode',
        'promoCodeUses',
        'bonusMonthsEarned',
        'status',
        'plusUntil',
        'createdAt',
      ]),
    ];

    if (filters.status) queries.push(Query.equal('status', filters.status));
    if (filters.type) queries.push(Query.equal('type', filters.type));

    return await databases.listDocuments(DATABASE_ID, PRE_REGISTRATIONS_COLLECTION_ID, queries);
  } catch (err) {
    console.error('[admin] Failed to get paged pre-registrations:', err.message);
    return { documents: [], total: 0 };
  }
};

/**
 * Get pre-registration by user ID
 */
export const getPreRegistrationByUserId = async (userId) => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      PRE_REGISTRATIONS_COLLECTION_ID,
      [Query.equal('userId', userId), Query.limit(1)]
    );
    return result.documents[0] || null;
  } catch (err) {
    console.error('[admin] Failed to get pre-registration:', err.message);
    return null;
  }
};

export const getPreRegistrationByEmail = async (email) => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      PRE_REGISTRATIONS_COLLECTION_ID,
      [Query.equal('email', email), Query.limit(1)]
    );
    return result.documents[0] || null;
  } catch (err) {
    console.error('[admin] Failed to get pre-registration by email:', err.message);
    return null;
  }
};

/**
 * Get pre-registration by promo code
 */
export const getPreRegistrationByPromoCode = async (promoCode) => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      PRE_REGISTRATIONS_COLLECTION_ID,
      [Query.equal('promoCode', promoCode.toUpperCase()), Query.limit(1)]
    );
    return result.documents[0] || null;
  } catch (err) {
    console.error('[admin] Failed to get pre-registration by promo code:', err.message);
    return null;
  }
};

/**
 * Create a pre-registration record
 */
export const createPreRegistration = async (data) => {
  try {
    const existingQueries = data.email
      ? [Query.equal('email', data.email), Query.limit(1)]
      : [Query.equal('userId', data.userId), Query.limit(1)];
    const existing = await databases.listDocuments(
      DATABASE_ID,
      PRE_REGISTRATIONS_COLLECTION_ID,
      existingQueries
    );

    if (existing.documents.length > 0) {
      const doc = existing.documents[0];
      const updates = {};

      if (data.type === 'paid' && doc.type !== 'paid') {
        updates.type = 'paid';
      }
      if (data.name && !doc.name) updates.name = data.name;
      if (data.reviewId && !doc.reviewId) updates.reviewId = data.reviewId;
      if (data.paddlePaymentId && !doc.paddlePaymentId) updates.paddlePaymentId = data.paddlePaymentId;
      if (data.userId && doc.userId !== data.userId) updates.userId = data.userId;
      if (data.status && doc.status !== 'converted' && doc.status !== data.status) updates.status = data.status;

      if (Object.keys(updates).length === 0) return doc;
      return databases.updateDocument(DATABASE_ID, PRE_REGISTRATIONS_COLLECTION_ID, doc.$id, updates);
    }

    const doc = await databases.createDocument(
      DATABASE_ID,
      PRE_REGISTRATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId: data.userId,
        email: data.email,
        name: data.name || '',
        type: data.type, // 'paid' | 'free_slot' | 'reviewer'
        promoCode: data.promoCode || generatePromoCode(data.userId || data.email),
        promoCodeUses: 0,
        bonusMonthsEarned: 0,
        plusUntil: data.plusUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: data.status || 'active',
        reviewId: data.reviewId || null,
        paddlePaymentId: data.paddlePaymentId || '',
        createdAt: new Date().toISOString(),
      }
    );
    return doc;
  } catch (err) {
    console.error('[admin] Failed to create pre-registration:', err.message);
    throw err;
  }
};

/**
 * Update pre-registration
 */
export const updatePreRegistration = async (docId, updates) => {
  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      PRE_REGISTRATIONS_COLLECTION_ID,
      docId,
      updates
    );
    return doc;
  } catch (err) {
    console.error('[admin] Failed to update pre-registration:', err.message);
    throw err;
  }
};

/**
 * Increment promo code usage and calculate bonus
 */
export const incrementPromoCodeUsage = async (referrerId) => {
  try {
    const preReg = await getPreRegistrationByUserId(referrerId);
    if (!preReg) return null;

    const newUses = preReg.promoCodeUses + 1;
    const newBonusMonths = Math.floor(newUses / 10) * 6;
    
    // Extend plusUntil by 6 months for every 10 uses
    let newPlusUntil = preReg.plusUntil;
    if (newUses % 10 === 0) {
      const currentExpiry = new Date(preReg.plusUntil);
      currentExpiry.setMonth(currentExpiry.getMonth() + 6);
      newPlusUntil = currentExpiry.toISOString();
    }

    const updated = await databases.updateDocument(
      DATABASE_ID,
      PRE_REGISTRATIONS_COLLECTION_ID,
      preReg.$id,
      {
        promoCodeUses: newUses,
        bonusMonthsEarned: newBonusMonths,
        plusUntil: newPlusUntil,
      }
    );
    return updated;
  } catch (err) {
    console.error('[admin] Failed to increment promo code usage:', err.message);
    throw err;
  }
};

// ============================================
// PROMO CODE USAGE
// ============================================

/**
 * Record a promo code usage
 */
export const recordPromoCodeUsage = async (data) => {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      PROMO_CODE_USAGE_COLLECTION_ID,
      ID.unique(),
      {
        promoCode: data.promoCode.toUpperCase(),
        referrerId: data.referrerId,
        newUserId: data.newUserId,
        newUserEmail: data.newUserEmail,
        createdAt: new Date().toISOString(),
      }
    );
    return doc;
  } catch (err) {
    console.error('[admin] Failed to record promo code usage:', err.message);
    throw err;
  }
};

/**
 * Check if user has already used a promo code
 */
export const hasUsedPromoCode = async (userId) => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      PROMO_CODE_USAGE_COLLECTION_ID,
      [Query.equal('newUserId', userId), Query.limit(1)]
    );
    return result.documents.length > 0;
  } catch (err) {
    console.error('[admin] Failed to check promo code usage:', err.message);
    return false;
  }
};

/**
 * Get promo code usage stats
 */
export const getPromoCodeUsageStats = async () => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      PROMO_CODE_USAGE_COLLECTION_ID,
      [Query.limit(1000)]
    );
    return {
      total: result.total,
      usages: result.documents,
    };
  } catch (err) {
    console.error('[admin] Failed to get promo code stats:', err.message);
    return { total: 0, usages: [] };
  }
};

export const getPromoCodeUsagePage = async ({ page = 0, limit = 20 } = {}) => {
  try {
    return await databases.listDocuments(
      DATABASE_ID,
      PROMO_CODE_USAGE_COLLECTION_ID,
      [
        Query.limit(limit),
        Query.offset(Math.max(0, page) * limit),
        Query.select(['$id', 'promoCode', 'referrerId', 'newUserEmail', 'createdAt']),
      ]
    );
  } catch (err) {
    console.error('[admin] Failed to get promo code usage page:', err.message);
    return { documents: [], total: 0 };
  }
};

// ============================================
// USER REVIEWS
// ============================================

/**
 * Get all reviews with optional filters
 */
export const getReviews = async (filters = {}) => {
  try {
    const queries = [Query.orderDesc('createdAt'), Query.limit(100)];
    
    if (filters.isApproved !== undefined) {
      queries.push(Query.equal('isApproved', filters.isApproved));
    }
    if (filters.isPublished !== undefined) {
      queries.push(Query.equal('isPublished', filters.isPublished));
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      USER_REVIEWS_COLLECTION_ID,
      queries
    );
    return result.documents;
  } catch (err) {
    console.error('[admin] Failed to get reviews:', err.message);
    return [];
  }
};

export const getReviewsPage = async ({ filters = {}, page = 0, limit = DEFAULT_ADMIN_PAGE_SIZE } = {}) => {
  try {
    const queries = [
      Query.orderDesc('createdAt'),
      Query.limit(limit),
      Query.offset(Math.max(0, page) * limit),
      Query.select([
        '$id',
        'userId',
        'userName',
        'rating',
        'title',
        'content',
        'isApproved',
        'isPublished',
        'helpfulCount',
        'createdAt',
      ]),
    ];

    if (filters.isApproved !== undefined) queries.push(Query.equal('isApproved', filters.isApproved));
    if (filters.isPublished !== undefined) queries.push(Query.equal('isPublished', filters.isPublished));

    return await databases.listDocuments(DATABASE_ID, USER_REVIEWS_COLLECTION_ID, queries);
  } catch (err) {
    console.error('[admin] Failed to get paged reviews:', err.message);
    return { documents: [], total: 0 };
  }
};

/**
 * Get published reviews for public display
 */
export const getPublishedReviews = async (limit = 10) => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      USER_REVIEWS_COLLECTION_ID,
      [
        Query.equal('isApproved', true),
        Query.equal('isPublished', true),
        Query.orderDesc('createdAt'),
        Query.limit(limit),
      ]
    );
    return result.documents;
  } catch (err) {
    // 401 is expected on the public landing page (no session) — don't log it as an error.
    // Fix: set Read permission on user_reviews collection to "Any" in Appwrite Console.
    if (err.code !== 401 && !err.message?.includes('not accessible in this region')) {
      console.error('[admin] Failed to get published reviews:', err.message);
    }
    return [];
  }
};

/**
 * Create a review
 */
export const createReview = async (data) => {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      USER_REVIEWS_COLLECTION_ID,
      ID.unique(),
      {
        userId: data.userId,
        userName: data.userName || 'Anonymous',
        preRegId: data.preRegId || null,
        rating: data.rating,
        title: data.title,
        content: data.content,
        isApproved: false, // Requires admin approval
        isPublished: true,
        helpfulCount: 0,
        createdAt: new Date().toISOString(),
      }
    );
    return doc;
  } catch (err) {
    console.error('[admin] Failed to create review:', err.message);
    throw err;
  }
};

/**
 * Update a review (admin)
 */
export const updateReview = async (reviewId, updates) => {
  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      USER_REVIEWS_COLLECTION_ID,
      reviewId,
      updates
    );
    return doc;
  } catch (err) {
    console.error('[admin] Failed to update review:', err.message);
    throw err;
  }
};

/**
 * Delete a review (admin)
 */
export const deleteReview = async (reviewId) => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      USER_REVIEWS_COLLECTION_ID,
      reviewId
    );
    return true;
  } catch (err) {
    console.error('[admin] Failed to delete review:', err.message);
    throw err;
  }
};

// ============================================
// DAILY FREE SLOTS
// ============================================

/**
 * Get or create daily slots for today
 */
export const getTodailySlots = async () => {
  try {
    const today = getUSEasternDate();
    
    // Get current settings to use the latest dailyFreeSlotCount
    const settings = await getAdminSettings();
    const currentTotalSlots = settings.dailyFreeSlotCount || 10;
    
    console.log('[admin] getTodailySlots - today:', today, 'currentTotalSlots:', currentTotalSlots);
    console.log('[admin] getTodailySlots - DATABASE_ID:', DATABASE_ID, 'COLLECTION_ID:', DAILY_FREE_SLOTS_COLLECTION_ID);
    
    // Try to get today's slots
    const result = await databases.listDocuments(
      DATABASE_ID,
      DAILY_FREE_SLOTS_COLLECTION_ID,
      [Query.equal('date', today), Query.limit(1)]
    );
    
    console.log('[admin] getTodailySlots - found documents:', result.documents.length);
    console.log('[admin] getTodailySlots - total in collection:', result.total);

    if (result.documents.length > 0) {
      const existingDoc = result.documents[0];
      console.log('[admin] getTodailySlots - existing doc:', existingDoc.$id, 'usedSlots:', existingDoc.usedSlots, 'totalSlots:', existingDoc.totalSlots);
      
      // Update totalSlots if it changed in settings (sync the value)
      if (existingDoc.totalSlots !== currentTotalSlots) {
        const updated = await databases.updateDocument(
          DATABASE_ID,
          DAILY_FREE_SLOTS_COLLECTION_ID,
          existingDoc.$id,
          { totalSlots: currentTotalSlots }
        );
        return updated;
      }
      
      return existingDoc;
    }

    // Create today's slots if not exists
    console.log('[admin] getTodailySlots - creating new document for today');
    const newSlots = await databases.createDocument(
      DATABASE_ID,
      DAILY_FREE_SLOTS_COLLECTION_ID,
      ID.unique(),
      {
        date: today,
        totalSlots: currentTotalSlots,
        usedSlots: 0,
        slotUserIds: [],
        createdAt: new Date().toISOString(),
      }
    );
    console.log('[admin] getTodailySlots - created new doc:', newSlots.$id, 'usedSlots:', newSlots.usedSlots);
    return newSlots;
  } catch (err) {
    console.error('[admin] Failed to get daily slots:', err.message);
    console.error('[admin] Full error:', err);
    throw err;
  }
};

/**
 * Check if slots are available today
 */
export const checkDailySlotAvailability = async () => {
  try {
    const slots = await getTodailySlots();
    return slots.usedSlots < slots.totalSlots;
  } catch (err) {
    console.error('[admin] Failed to check slot availability:', err.message);
    return false;
  }
};

/**
 * Get remaining slots for today
 */
export const getRemainingSlotsToday = async () => {
  try {
    const slots = await getTodailySlots();
    return Math.max(0, slots.totalSlots - slots.usedSlots);
  } catch (err) {
    console.error('[admin] Failed to get remaining slots:', err.message);
    return 0;
  }
};

/**
 * Clean up duplicate daily slots for today (admin utility)
 * Keeps only the first document found for today's date
 */
export const cleanupDuplicateDailySlots = async () => {
  try {
    const today = getUSEasternDate();
    
    const result = await databases.listDocuments(
      DATABASE_ID,
      DAILY_FREE_SLOTS_COLLECTION_ID,
      [Query.equal('date', today), Query.limit(100)]
    );
    
    if (result.documents.length <= 1) {
      console.log('[admin] No duplicates found');
      return { cleaned: 0, kept: result.documents[0] || null };
    }
    
    // Keep the first one, delete the rest
    const toKeep = result.documents[0];
    const toDelete = result.documents.slice(1);
    
    for (const doc of toDelete) {
      await databases.deleteDocument(
        DATABASE_ID,
        DAILY_FREE_SLOTS_COLLECTION_ID,
        doc.$id
      );
    }
    
    console.log('[admin] Cleaned up', toDelete.length, 'duplicate documents');
    return { cleaned: toDelete.length, kept: toKeep };
  } catch (err) {
    console.error('[admin] Failed to cleanup duplicates:', err.message);
    throw err;
  }
};

/**
 * Claim a daily free slot
 */
export const claimDailySlot = async (userId, email = '') => {
  try {
    const slots = await getTodailySlots();
    
    if (slots.usedSlots >= slots.totalSlots) {
      throw new Error('No slots available today');
    }

    // Update slots atomically
    const updated = await databases.updateDocument(
      DATABASE_ID,
      DAILY_FREE_SLOTS_COLLECTION_ID,
      slots.$id,
      {
        usedSlots: slots.usedSlots + 1,
        slotUserIds: [...slots.slotUserIds, userId],
      }
    );

    // Record usage with email
    await recordDailySlotUsage(userId, email);

    return updated;
  } catch (err) {
    console.error('[admin] Failed to claim daily slot:', err.message);
    throw err;
  }
};

/**
 * Record daily slot usage
 */
export const recordDailySlotUsage = async (userId, email = '') => {
  try {
    const today = getUSEasternDate();
    
    const doc = await databases.createDocument(
      DATABASE_ID,
      DAILY_SLOT_USAGE_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        email,
        date: today,
        hasReviewed: false,
        reviewId: null,
        addedToPreReg: false,
        createdAt: new Date().toISOString(),
      }
    );
    return doc;
  } catch (err) {
    console.error('[admin] Failed to record slot usage:', err.message);
    throw err;
  }
};

/**
 * Get user's daily slot usage
 */
export const getUserDailySlotUsage = async (email) => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      DAILY_SLOT_USAGE_COLLECTION_ID,
      [Query.equal('email', email), Query.limit(1)]
    );
    return result.documents[0] || null;
  } catch (err) {
    console.error('[admin] Failed to get user slot usage:', err.message);
    return null;
  }
};

/**
 * Mark slot usage as reviewed and add to pre-reg
 */
export const markSlotReviewedAndAddToPreReg = async (slotUsageId, userId, email, name, reviewId) => {
  try {
    // Update slot usage
    await databases.updateDocument(
      DATABASE_ID,
      DAILY_SLOT_USAGE_COLLECTION_ID,
      slotUsageId,
      {
        hasReviewed: true,
        reviewId,
        addedToPreReg: true,
      }
    );

    // Create pre-registration
    const preReg = await createPreRegistration({
      userId,
      email,
      name,
      type: 'reviewer',
      reviewId,
    });

    return preReg;
  } catch (err) {
    console.error('[admin] Failed to mark slot reviewed:', err.message);
    throw err;
  }
};

/**
 * Get historical daily slots data
 */
export const getDailySlotsHistory = async (days = 30) => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      DAILY_FREE_SLOTS_COLLECTION_ID,
      [Query.orderDesc('date'), Query.limit(days)]
    );
    return result.documents;
  } catch (err) {
    console.error('[admin] Failed to get slots history:', err.message);
    return [];
  }
};

export const getDailySlotsHistoryPage = async ({ page = 0, limit = DEFAULT_ADMIN_PAGE_SIZE } = {}) => {
  try {
    return await databases.listDocuments(
      DATABASE_ID,
      DAILY_FREE_SLOTS_COLLECTION_ID,
      [
        Query.orderDesc('date'),
        Query.limit(limit),
        Query.offset(Math.max(0, page) * limit),
        Query.select(['$id', 'date', 'totalSlots', 'usedSlots', 'createdAt']),
      ]
    );
  } catch (err) {
    console.error('[admin] Failed to get paged slots history:', err.message);
    return { documents: [], total: 0 };
  }
};

// ============================================
// STATS & ANALYTICS
// ============================================

/**
 * Get admin dashboard stats
 */
export const getAdminStats = async () => {
  try {
    const [
      totalPreRegistrations,
      activePreRegistrations,
      reviewsTotal,
      approvedReviews,
      promoUsageTotal,
      preRegSample,
    ] = await Promise.all([
      getListTotal(PRE_REGISTRATIONS_COLLECTION_ID),
      getListTotal(PRE_REGISTRATIONS_COLLECTION_ID, [Query.equal('status', 'active')]),
      getListTotal(USER_REVIEWS_COLLECTION_ID),
      getListTotal(USER_REVIEWS_COLLECTION_ID, [Query.equal('isApproved', true)]),
      getListTotal(PROMO_CODE_USAGE_COLLECTION_ID),
      getPreRegistrations({}),
    ]);

    const totalBonusMonths = preRegSample.reduce((sum, p) => sum + (p.bonusMonthsEarned || 0), 0);

    // Calculate "owed" value (each month of Plus = $9 value)
    const owedValue = totalBonusMonths * 9;

    return {
      totalPreRegistrations,
      activePreRegistrations,
      totalPromoCodesIssued: totalPreRegistrations,
      totalPromoCodeUses: promoUsageTotal,
      totalBonusMonthsEarned: totalBonusMonths,
      estimatedOwedValue: owedValue.toFixed(2),
      totalReviews: reviewsTotal,
      approvedReviews,
      pendingReviews: reviewsTotal - approvedReviews,
    };
  } catch (err) {
    console.error('[admin] Failed to get stats:', err.message);
    return {
      totalPreRegistrations: 0,
      activePreRegistrations: 0,
      totalPromoCodesIssued: 0,
      totalPromoCodeUses: 0,
      totalBonusMonthsEarned: 0,
      estimatedOwedValue: '0.00',
      totalReviews: 0,
      approvedReviews: 0,
      pendingReviews: 0,
    };
  }
};


// ============================================
// TESTING USAGE TRACKING
// ============================================

/**
 * Get or create testing usage document for a user
 */
export const getTestingUsageDoc = async (userId) => {
  try {
    console.log('[admin] getTestingUsageDoc called for userId:', userId);
    
    const result = await databases.listDocuments(
      DATABASE_ID,
      TESTING_USAGE_COLLECTION_ID,
      [Query.equal('userId', userId), Query.limit(1)]
    );
    
    console.log('[admin] getTestingUsageDoc result:', result.documents.length, 'documents found');
    
    return result.documents[0] || null;
  } catch (err) {
    console.error('[admin] Failed to get testing usage:', err.message);
    console.error('[admin] Full error:', err);
    return null;
  }
};

/**
 * Initialize testing usage for a new testing user
 */
export const initializeTestingUsage = async (userId, email) => {
  try {
    console.log('[admin] initializeTestingUsage called with:', { userId, email, collectionId: TESTING_USAGE_COLLECTION_ID, databaseId: DATABASE_ID });
    
    // Check if already exists
    const existing = await getTestingUsageDoc(userId);
    if (existing) {
      console.log('[admin] Testing usage already exists:', existing.$id);
      return existing;
    }

    const docData = {
      userId,
      email,
      sessions: 0,
      pdfs: 0,
      audios: 0,
      messages: 0,
      flashcards: 0,
      mcqs: 0,
      examPlans: 0,
      languageLearningSessions: 0,
      libraryImports: 0,
      hasReviewed: false,
      reviewId: null,
      addedToPreReg: false,
      createdAt: new Date().toISOString(),
    };
    
    console.log('[admin] Creating testing usage document with data:', docData);
    
    const doc = await databases.createDocument(
      DATABASE_ID,
      TESTING_USAGE_COLLECTION_ID,
      ID.unique(),
      docData
    );
    
    console.log('[admin] Testing usage document created successfully:', doc.$id);
    return doc;
  } catch (err) {
    console.error('[admin] Failed to initialize testing usage:', err.message);
    console.error('[admin] Full error:', err);
    throw err;
  }
};

/**
 * Get testing usage counts for a user
 */
export const getTestingUsage = async (userId) => {
  try {
    const doc = await getTestingUsageDoc(userId);
    if (!doc) return null;

    return {
      sessions: doc.sessions || 0,
      pdfs: doc.pdfs || 0,
      audios: doc.audios || 0,
      messages: doc.messages || 0,
      flashcards: doc.flashcards || 0,
      mcqs: doc.mcqs || 0,
      examPlans: doc.examPlans || 0,
      languageLearningSessions: doc.languageLearningSessions || 0,
      libraryImports: doc.libraryImports || 0,
      hasReviewed: doc.hasReviewed || false,
      reviewId: doc.reviewId || null,
      addedToPreReg: doc.addedToPreReg || false,
    };
  } catch (err) {
    console.error('[admin] Failed to get testing usage:', err.message);
    return null;
  }
};

/**
 * Increment testing usage counter
 */
export const incrementTestingUsage = async (userId, field, amount = 1) => {
  try {
    const doc = await getTestingUsageDoc(userId);
    if (!doc) {
      throw new Error('Testing usage document not found');
    }

    const currentValue = doc[field] || 0;
    const updated = await databases.updateDocument(
      DATABASE_ID,
      TESTING_USAGE_COLLECTION_ID,
      doc.$id,
      {
        [field]: currentValue + amount,
      }
    );
    return updated;
  } catch (err) {
    console.error('[admin] Failed to increment testing usage:', err.message);
    throw err;
  }
};

/**
 * Check if testing user has submitted review
 */
export const hasTestingUserReviewed = async (userId) => {
  try {
    const doc = await getTestingUsageDoc(userId);
    return doc?.hasReviewed || false;
  } catch (err) {
    console.error('[admin] Failed to check review status:', err.message);
    return false;
  }
};

/**
 * Mark testing user as reviewed and add to pre-reg
 */
export const markTestingUserReviewed = async (userId, reviewId) => {
  try {
    const doc = await getTestingUsageDoc(userId);
    if (!doc) {
      throw new Error('Testing usage document not found');
    }

    // Update testing usage
    await databases.updateDocument(
      DATABASE_ID,
      TESTING_USAGE_COLLECTION_ID,
      doc.$id,
      {
        hasReviewed: true,
        reviewId,
        addedToPreReg: true,
      }
    );

    // Create pre-registration record
    const preReg = await createPreRegistration({
      userId,
      email: doc.email,
      type: 'reviewer',
      reviewId,
    });

    return preReg;
  } catch (err) {
    console.error('[admin] Failed to mark testing user reviewed:', err.message);
    throw err;
  }
};

/**
 * Check if user is an existing user (has usage_tracking or sessions)
 * Used to prevent existing users from joining pre-reg
 * 
 * NOTE: This function makes requests without authentication.
 * The collections must have "Any" read access enabled in Appwrite.
 * If permissions are restricted, the check will silently fail and return false.
 */
export const isExistingUser = async (email) => {
  try {
    // Check if already in pre_registrations (this collection should be publicly readable)
    const preReg = await databases.listDocuments(
      DATABASE_ID,
      PRE_REGISTRATIONS_COLLECTION_ID,
      [Query.equal('email', email), Query.limit(1)]
    );
    
    if (preReg.documents.length > 0) {
      return true;
    }

    // Note: daily_slot_usage check skipped - requires auth
    // Pre-reg users who already used a free slot will be caught by the 
    // pre_registrations check above since they should be added there first
    
    return false;
  } catch (err) {
    console.error('[admin] Failed to check existing user:', err.message);
    // Return false to allow the user to proceed
    // The webhook will validate on the backend
    return false;
  }
};

/**
 * Check if user has testing privileges (in testing_usage collection)
 */
export const isTestingUser = async (userId) => {
  try {
    const doc = await getTestingUsageDoc(userId);
    return doc !== null && !doc.addedToPreReg;
  } catch (err) {
    console.error('[admin] Failed to check testing user:', err.message);
    return false;
  }
};

export const getTestingUsersPage = async ({ page = 0, limit = DEFAULT_ADMIN_PAGE_SIZE } = {}) => {
  try {
    return await databases.listDocuments(
      DATABASE_ID,
      TESTING_USAGE_COLLECTION_ID,
      [
        Query.orderDesc('createdAt'),
        Query.limit(limit),
        Query.offset(Math.max(0, page) * limit),
        Query.select([
          '$id',
          'userId',
          'email',
          'sessions',
          'pdfs',
          'audios',
          'messages',
          'flashcards',
          'mcqs',
          'examPlans',
          'languageLearningSessions',
          'libraryImports',
          'hasReviewed',
          'addedToPreReg',
          'createdAt',
        ]),
      ]
    );
  } catch (err) {
    console.error('[admin] Failed to get testing users page:', err.message);
    return { documents: [], total: 0 };
  }
};

export const getSubscriptionsPage = async ({ page = 0, limit = DEFAULT_ADMIN_PAGE_SIZE } = {}) => {
  try {
    const result = await databases.listDocuments(DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, [
      Query.select([
        '$id',
        '$createdAt',
        '$updatedAt',
        'userId',
        'paddleSubscriptionId',
        'paddleCustomerId',
        'plan',
        'status',
        'currentPeriodStart',
        'currentPeriodEnd',
        'canceledAt',
        'priceId',
        'currency',
        'amount',
        'interval',
        'createdAt',
        'updatedAt',
      ]),
      Query.limit(limit),
      Query.offset(page * limit),
    ]);

    return {
      documents: result.documents || [],
      total: result.total || 0,
      page,
      limit,
    };
  } catch (err) {
    console.error('[admin] Failed to get subscriptions page:', err.message);
    throw err;
  }
};

// ============================================
// COMPLETE PRE-REGISTRATIONS (GRANT PLUS)
// ============================================

/**
 * Grant Plus plan to a single user
 */
export const grantPlusPlan = async (userId, months = 12) => {
  const now = new Date();
  const plusUntil = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);

  try {
    // Check if user has existing subscription record
    const existingSubs = await databases.listDocuments(
      DATABASE_ID,
      SUBSCRIPTIONS_COLLECTION_ID,
      [Query.equal('userId', userId), Query.limit(1)]
    );

    if (existingSubs.documents.length > 0) {
      // Update existing subscription
      const sub = existingSubs.documents[0];
      const currentExpiry = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : now;
      const newExpiry = currentExpiry > now 
        ? new Date(currentExpiry.getTime() + months * 30 * 24 * 60 * 60 * 1000)
        : plusUntil;

      await databases.updateDocument(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        sub.$id,
        {
          plan: 'plus',
          status: 'active',
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: newExpiry.toISOString(),
          updatedAt: now.toISOString(),
        }
      );
      
      return { success: true, action: 'updated', plusUntil: newExpiry };
    } else {
      // Create new subscription record
      await databases.createDocument(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          plan: 'plus',
          status: 'active',
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: plusUntil.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        }
      );
      
      return { success: true, action: 'created', plusUntil };
    }
  } catch (err) {
    console.error(`[admin] Failed to grant Plus to ${userId}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Complete all pre-registrations - Grant Plus plans to all active pre-registered users
 * Call this when pre-registration period ends
 */
export const completeAllPreRegistrationsClientSide = async () => {
  console.log('[admin] Starting pre-registration completion...');
  
  try {
    // Get all active pre-registrations
    const allPreRegs = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const result = await databases.listDocuments(
        DATABASE_ID,
        PRE_REGISTRATIONS_COLLECTION_ID,
        [
          Query.equal('status', 'active'),
          Query.limit(limit),
          Query.offset(offset),
        ]
      );

      allPreRegs.push(...result.documents);

      if (result.documents.length < limit) break;
      offset += limit;
    }

    console.log(`[admin] Found ${allPreRegs.length} active pre-registrations`);

    const results = {
      total: allPreRegs.length,
      success: 0,
      failed: 0,
      details: [],
    };

    for (const preReg of allPreRegs) {
      console.log(`[admin] Processing: ${preReg.email} (${preReg.type})`);
      
      // Calculate months: 12 months base + bonus months from referrals
      const baseMonths = 12;
      const bonusMonths = preReg.bonusMonthsEarned || 0;
      const totalMonths = baseMonths + bonusMonths;
      
      const result = await grantPlusPlan(preReg.userId, totalMonths);
      
      if (result.success) {
        results.success++;
        console.log(`[admin] ✓ Granted ${totalMonths} months of Plus to ${preReg.email}`);
        
        // Update pre-registration status
        await databases.updateDocument(
          DATABASE_ID,
          PRE_REGISTRATIONS_COLLECTION_ID,
          preReg.$id,
          {
            status: 'converted',
            plusUntil: new Date(Date.now() + totalMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        );
      } else {
        results.failed++;
        console.log(`[admin] ✗ Failed for ${preReg.email}: ${result.error}`);
      }

      results.details.push({
        email: preReg.email,
        userId: preReg.userId,
        type: preReg.type,
        promoCode: preReg.promoCode,
        totalMonths,
        ...result,
      });
    }

    console.log(`[admin] Completion finished: ${results.success}/${results.total} successful`);
    return results;
  } catch (err) {
    console.error('[admin] Failed to complete pre-registrations:', err.message);
    throw err;
  }
};

/**
 * Complete all pre-registrations through the server-side Paddle webhook function.
 * This keeps user-label updates and reward grants off the browser client.
 */
export const completeAllPreRegistrations = async () => {
  try {
    const execution = await functions.createExecution(
      PADDLE_WEBHOOK_FUNCTION_ID,
      JSON.stringify({ action: 'complete_pre_registrations' }),
      false
    );

    if (execution.status === 'failed') {
      throw new Error(execution.errors || 'Reward function execution failed.');
    }

    const response = JSON.parse(execution.responseBody || '{}');
    if (response.ok === false || response.error) {
      throw new Error(response.error || response.message || 'Reward function rejected the request.');
    }

    return response;
  } catch (err) {
    console.error('[admin] Failed to complete pre-registrations:', err.message);
    throw err;
  }
};

export const grantSinglePreRegistrationReward = async (preRegistrationId) => {
  try {
    const execution = await functions.createExecution(
      PADDLE_WEBHOOK_FUNCTION_ID,
      JSON.stringify({
        action: 'grant_single_pre_registration',
        preRegistrationId,
      }),
      false
    );

    if (execution.status === 'failed') {
      throw new Error(execution.errors || 'Single reward function execution failed.');
    }

    const response = JSON.parse(execution.responseBody || '{}');
    if (response.ok === false || response.error) {
      const detail = response.details?.[0]?.error || response.details?.[0]?.reason;
      throw new Error(response.error || detail || 'Reward function rejected the request.');
    }

    return response;
  } catch (err) {
    console.error('[admin] Failed to grant single pre-registration reward:', err.message);
    throw err;
  }
};

