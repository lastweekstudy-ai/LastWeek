/**
 * TTS Cache Management with Appwrite
 * Caches generated audio and tracks usage
 */

import { Client, Storage, Databases, ID, Query } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const storage = new Storage(client);
const databases = new Databases(client);

const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

// Collection IDs (you'll need to create these in Appwrite)
const TTS_CACHE_COLLECTION_ID = 'tts_cache_metadata'; // Stores cache metadata
const TTS_USAGE_COLLECTION_ID = 'tts_usage'; // Tracks usage per user

/**
 * Generate consistent cache key for text+voice combination
 * @param {string} text - Text to speak
 * @param {string} voice - Voice name
 * @returns {Promise<string>} SHA-256 hash
 */
export const generateCacheKey = async (text, voice) => {
  const raw = `${text.trim()}_${voice}`;
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Check if audio is cached in Appwrite Storage
 * @param {string} text - Text to speak
 * @param {string} voice - Voice name
 * @returns {Promise<string|null>} Download URL or null
 */
export const getCachedAudio = async (text, voice) => {
  try {
    const key = await generateCacheKey(text, voice);
    
    // Try to get file from storage
    const fileUrl = storage.getFileView(BUCKET_ID, key);
    
    // Verify file exists by attempting to fetch metadata
    await storage.getFile(BUCKET_ID, key);
    
    console.log('[TTS Cache] Cache hit:', key);
    return fileUrl.href;
  } catch (error) {
    // File doesn't exist - cache miss
    console.log('[TTS Cache] Cache miss');
    return null;
  }
};

/**
 * Save audio to Appwrite Storage cache
 * @param {string} text - Text that was spoken
 * @param {string} voice - Voice used
 * @param {string} base64Data - Base64 audio data
 * @returns {Promise<string>} Download URL
 */
export const cacheAudio = async (text, voice, base64Data) => {
  try {
    const key = await generateCacheKey(text, voice);
    
    // Convert base64 to blob
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const file = new File([blob], `${key}.wav`, { type: 'audio/wav' });

    // Upload to Appwrite Storage
    await storage.createFile(BUCKET_ID, key, file);
    
    // Save metadata with proper permissions
    try {
      await databases.createDocument(
        DATABASE_ID,
        TTS_CACHE_COLLECTION_ID,
        key,
        {
          text: text.substring(0, 500), // Store first 500 chars for reference
          voice,
          fileId: key,
          createdAt: new Date().toISOString(),
          charCount: text.length,
        },
        [
          // Anyone can read cached audio (shared cache)
          'read("any")',
          // Only authenticated users can update/delete
          'update("users")',
          'delete("users")',
        ]
      );
    } catch (metaError) {
      // Metadata save failed, but file is cached - not critical
      console.warn('[TTS Cache] Metadata save failed:', metaError);
    }

    const fileUrl = storage.getFileView(BUCKET_ID, key);
    console.log('[TTS Cache] Cached audio:', key);
    return fileUrl.href;
  } catch (error) {
    console.error('[TTS Cache] Error caching audio:', error);
    throw error;
  }
};

/**
 * Log TTS usage for a user
 * @param {string} userId - User ID
 * @param {number} charCount - Number of characters spoken
 * @param {string} voice - Voice used
 */
export const logUsage = async (userId, charCount, voice) => {
  try {
    await databases.createDocument(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        charCount,
        voice,
        timestamp: new Date().toISOString(),
      },
      [
        // Only the user can read their own usage
        `read("user:${userId}")`,
        // Only the user can update/delete their own usage
        `update("user:${userId}")`,
        `delete("user:${userId}")`,
      ]
    );
    console.log('[TTS Usage] Logged:', { userId, charCount, voice });
  } catch (error) {
    console.error('[TTS Usage] Error logging usage:', error);
    // Don't throw - usage logging failure shouldn't break TTS
  }
};

/**
 * Get total characters used this month by a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total characters used
 */
export const getMonthlyUsage = async (userId) => {
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const response = await databases.listDocuments(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.greaterThanEqual('timestamp', start.toISOString()),
      ]
    );

    const total = response.documents.reduce((sum, doc) => sum + (doc.charCount || 0), 0);
    console.log('[TTS Usage] Monthly usage for', userId, ':', total);
    return total;
  } catch (error) {
    console.error('[TTS Usage] Error getting monthly usage:', error);
    return 0; // Return 0 on error to allow TTS to continue
  }
};

/**
 * Get usage statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Usage statistics
 */
export const getUserStats = async (userId) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('timestamp'),
        Query.limit(100),
      ]
    );

    const totalChars = response.documents.reduce((sum, doc) => sum + (doc.charCount || 0), 0);
    const voiceUsage = {};
    
    response.documents.forEach(doc => {
      const voice = doc.voice || 'unknown';
      voiceUsage[voice] = (voiceUsage[voice] || 0) + (doc.charCount || 0);
    });

    return {
      totalChars,
      totalRequests: response.documents.length,
      voiceUsage,
      lastUsed: response.documents[0]?.timestamp || null,
    };
  } catch (error) {
    console.error('[TTS Usage] Error getting user stats:', error);
    return {
      totalChars: 0,
      totalRequests: 0,
      voiceUsage: {},
      lastUsed: null,
    };
  }
};

/**
 * Clear old cache entries (older than 30 days)
 * @returns {Promise<number>} Number of entries deleted
 */
export const clearOldCache = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const response = await databases.listDocuments(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID,
      [
        Query.lessThan('createdAt', thirtyDaysAgo.toISOString()),
        Query.limit(100),
      ]
    );

    let deleted = 0;
    for (const doc of response.documents) {
      try {
        await storage.deleteFile(BUCKET_ID, doc.fileId);
        await databases.deleteDocument(DATABASE_ID, TTS_CACHE_COLLECTION_ID, doc.$id);
        deleted++;
      } catch (error) {
        console.warn('[TTS Cache] Error deleting old cache:', error);
      }
    }

    console.log('[TTS Cache] Cleared', deleted, 'old cache entries');
    return deleted;
  } catch (error) {
    console.error('[TTS Cache] Error clearing old cache:', error);
    return 0;
  }
};
