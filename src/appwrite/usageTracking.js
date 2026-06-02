import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USAGE_COLLECTION_ID = 'usage_tracking';

/**
 * Get the current month string (e.g. "2026-05")
 */
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Get or create the usage document for the current month.
 */
export const getMonthlyUsage = async (userId) => {
  const month = getCurrentMonth();

  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      USAGE_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('month', month),
        Query.limit(1),
      ]
    );

    if (result.documents.length > 0) {
      return result.documents[0];
    }

    // Create a fresh document for this month
    const newDoc = await databases.createDocument(
      DATABASE_ID,
      USAGE_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        month,
        sessionsCreated: 0,
        messagesUsed: 0,
        pdfsUploaded: 0,
        audiosUploaded: 0,
        flashcardsCreated: 0,
        mcqsAnswered: 0,
        storageUsedBytes: 0,
        updatedAt: new Date().toISOString(),
      }
    );
    return newDoc;
  } catch (err) {
    // Handle race condition — if another request already created the doc, fetch it
    if (err.message?.includes('already exists') || err.code === 409) {
      try {
        const retry = await databases.listDocuments(
          DATABASE_ID,
          USAGE_COLLECTION_ID,
          [Query.equal('userId', userId), Query.equal('month', month), Query.limit(1)]
        );
        if (retry.documents.length > 0) return retry.documents[0];
      } catch { /* fall through to default */ }
    }
    console.error('[usageTracking] Failed to get/create usage doc:', err.message);
    return {
      $id: null,
      userId,
      month,
      sessionsCreated: 0,
      messagesUsed: 0,
      pdfsUploaded: 0,
      audiosUploaded: 0,
      flashcardsCreated: 0,
      mcqsAnswered: 0,
      storageUsedBytes: 0,
    };
  }
};

/**
 * Increment a specific usage counter.
 * @param {string} userId
 * @param {string} field - one of: sessionsCreated, messagesUsed, pdfsUploaded, audiosUploaded, flashcardsCreated, mcqsAnswered, ttsUsed
 * @param {number} amount - how much to increment (default 1)
 */
export const incrementUsage = async (userId, field, amount = 1) => {
  try {
    const usage = await getMonthlyUsage(userId);
    if (!usage.$id) return usage; // couldn't create doc — fail silently

    const currentValue = usage[field] || 0;
    const updatePayload = { [field]: currentValue + amount };

    // Only include updatedAt if the field already exists on the document
    // (avoids 500 errors if the attribute wasn't added to the Appwrite schema)
    if ('updatedAt' in usage) {
      updatePayload.updatedAt = new Date().toISOString();
    }

    const updated = await databases.updateDocument(
      DATABASE_ID,
      USAGE_COLLECTION_ID,
      usage.$id,
      updatePayload
    );
    return updated;
  } catch (err) {
    console.error(`[usageTracking] Failed to increment ${field}:`, err.message);
    return null;
  }
};

/**
 * Update storage usage (absolute value, not increment).
 */
export const updateStorageUsage = async (userId, totalBytes) => {
  try {
    const usage = await getMonthlyUsage(userId);
    if (!usage.$id) return;

    const updatePayload = { storageUsedBytes: totalBytes };
    if ('updatedAt' in usage) {
      updatePayload.updatedAt = new Date().toISOString();
    }

    await databases.updateDocument(
      DATABASE_ID,
      USAGE_COLLECTION_ID,
      usage.$id,
      updatePayload
    );
  } catch (err) {
    console.error('[usageTracking] Failed to update storage:', err.message);
  }
};
