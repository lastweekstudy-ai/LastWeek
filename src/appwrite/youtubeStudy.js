import { functions, databases } from './config';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const YOUTUBE_STUDIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_YOUTUBE_STUDIES_COLLECTION_ID;
const PROCESS_YOUTUBE_FUNCTION_ID = import.meta.env.VITE_APPWRITE_PROCESS_YOUTUBE_FUNCTION_ID;

/**
 * Call the Appwrite Function to process a YouTube video.
 * Returns { success, cached, data: { summary, flashcards, quiz, keyTopics } }
 */
export const processYoutubeVideo = async (youtubeUrl, userId) => {
  if (!PROCESS_YOUTUBE_FUNCTION_ID) {
    throw new Error('Function ID not configured. Check VITE_APPWRITE_PROCESS_YOUTUBE_FUNCTION_ID in .env');
  }

  let execution;
  try {
    execution = await functions.createExecution(
      PROCESS_YOUTUBE_FUNCTION_ID,
      JSON.stringify({ youtubeUrl, userId }),
      false,        // async = false (synchronous, wait for result)
      '/',          // path
      'POST',       // method
      {}            // headers
    );
  } catch (err) {
    throw new Error(`Could not reach Appwrite Function: ${err.message}`);
  }

  if (execution.status === 'failed') {
    throw new Error(`Function failed: ${execution.responseBody || 'No response body'}`);
  }

  let response;
  try {
    response = JSON.parse(execution.responseBody);
  } catch {
    throw new Error(`Invalid response from function: ${execution.responseBody}`);
  }

  if (!response.success) {
    throw new Error(response.error || 'Failed to process video.');
  }

  const data = response.data;
  return {
    success: true,
    cached: response.cached || false,
    docId: response.docId || null,
    summary: data.summary,
    flashcards: typeof data.flashcards === 'string' ? JSON.parse(data.flashcards) : data.flashcards,
    quiz: typeof data.quiz === 'string' ? JSON.parse(data.quiz) : data.quiz,
    keyTopics: data.keyTopics,
  };
};

/**
 * Get all YouTube studies for a user (history).
 */
export const getUserYoutubeStudies = async (userId) => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      YOUTUBE_STUDIES_COLLECTION_ID,
      [Query.equal('userId', userId), Query.orderDesc('createdAt'), Query.limit(20)]
    );
    return result.documents.map(doc => ({
      ...doc,
      flashcards: typeof doc.flashcards === 'string' ? JSON.parse(doc.flashcards) : doc.flashcards,
      quiz: typeof doc.quiz === 'string' ? JSON.parse(doc.quiz) : doc.quiz,
    }));
  } catch {
    return [];
  }
};

/**
 * Extract video ID from any YouTube URL format.
 */
export const extractVideoId = (url) => {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

/**
 * Get YouTube thumbnail URL from video ID.
 */
export const getYoutubeThumbnail = (videoId) =>
  `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
