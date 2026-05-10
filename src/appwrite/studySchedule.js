import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const STUDY_SCHEDULE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_STUDY_SCHEDULE_COLLECTION_ID;

/**
 * Adds N days to a UTC date string (YYYY-MM-DD) and returns the result as a YYYY-MM-DD string.
 * @param {string} dateString - ISO date string YYYY-MM-DD
 * @param {number} days - Number of days to add
 * @returns {string} - Resulting date as YYYY-MM-DD
 */
function addDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  // month is 0-indexed in Date.UTC
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().split('T')[0];
}

/**
 * Pure SM-2 spaced repetition algorithm.
 *
 * @param {{ interval: number, easeFactor: number, repetitions: number }} record
 * @param {1|2|3} confidence - 1 = hard, 2 = okay, 3 = easy
 * @returns {{ interval: number, easeFactor: number, repetitions: number, nextReviewDate: string }}
 */
export function applySM2(record, confidence) {
  const todayString = new Date().toISOString().split('T')[0];

  let { interval, easeFactor, repetitions } = record;

  if (confidence === 1) {
    // Hard: reset
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (confidence === 2) {
    // Okay: grow slowly
    repetitions += 1;
    interval = Math.max(1, Math.floor(interval * easeFactor * 0.9));
    // easeFactor unchanged
  } else if (confidence === 3) {
    // Easy: grow faster
    repetitions += 1;
    interval = Math.max(1, Math.floor(interval * easeFactor));
    easeFactor = Math.min(4.0, easeFactor + 0.1);
  }

  let nextReviewDate = addDays(todayString, interval);

  // Clamp: nextReviewDate must be strictly after today
  if (nextReviewDate <= todayString) {
    nextReviewDate = addDays(todayString, 1);
  }

  return { interval, easeFactor, repetitions, nextReviewDate };
}

/**
 * Creates or updates a study schedule record for a given user/session/topic.
 * On Appwrite write failure, logs the error and returns null instead of throwing.
 *
 * @param {string} userId
 * @param {string} sessionId
 * @param {string} subject
 * @param {string} topic
 * @param {1|2|3} confidence
 * @returns {Promise<object|null>} The created/updated document, or null on write failure.
 */
export async function upsertStudySchedule(userId, sessionId, subject, topic, confidence) {
  // Query for an existing record matching userId + sessionId + topic
  const result = await databases.listDocuments(
    DATABASE_ID,
    STUDY_SCHEDULE_COLLECTION_ID,
    [
      Query.equal('userId', userId),
      Query.equal('sessionId', sessionId),
      Query.equal('topic', topic),
    ]
  );

  if (result.documents.length === 0) {
    // No existing record — create with initial defaults
    const todayString = new Date().toISOString().split('T')[0];
    const tomorrow = addDays(todayString, 1);

    const payload = {
      userId,
      sessionId,
      subject,
      topic,
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
      nextReviewDate: tomorrow,
    };

    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        STUDY_SCHEDULE_COLLECTION_ID,
        ID.unique(),
        payload
      );
      return doc;
    } catch (error) {
      console.error('[studySchedule] Failed to create document:', error);
      return null;
    }
  } else {
    // Existing record found — apply SM-2 and update
    const existingRecord = result.documents[0];
    const updatedFields = applySM2(existingRecord, confidence);

    try {
      const doc = await databases.updateDocument(
        DATABASE_ID,
        STUDY_SCHEDULE_COLLECTION_ID,
        existingRecord.$id,
        updatedFields
      );
      return doc;
    } catch (error) {
      console.error('[studySchedule] Failed to update document:', error);
      return null;
    }
  }
}

/**
 * Returns all study schedule records for a user that are due today or overdue.
 * Throws on failure so the caller can display an isolated error.
 *
 * @param {string} userId
 * @returns {Promise<object[]>} Array of due schedule documents.
 */
export async function getDueSchedules(userId) {
  const todayString = new Date().toISOString().split('T')[0];

  const result = await databases.listDocuments(
    DATABASE_ID,
    STUDY_SCHEDULE_COLLECTION_ID,
    [
      Query.equal('userId', userId),
      Query.lessThanEqual('nextReviewDate', todayString),
    ]
  );

  return result.documents;
}
