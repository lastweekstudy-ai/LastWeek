/**
 * migrateLegacyResources.js
 * 
 * One-time migration script to update existing resources
 * that were created before the isPublic attribute was added.
 * 
 * Sets isPublic: false for all existing resources (private by default)
 */

import { databases } from './config';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PDF_RESOURCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID;
const AUDIO_LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID || 'audio_lectures';

/**
 * Migrate PDF resources — set isPublic: false for all existing resources
 */
export const migratePDFResources = async () => {
  console.log('[Migration] Starting PDF resources migration...');
  
  try {
    let offset = 0;
    let totalUpdated = 0;
    const batchSize = 25;

    while (true) {
      // Fetch batch of resources
      const res = await databases.listDocuments(
        DATABASE_ID,
        PDF_RESOURCES_COLLECTION_ID,
        [Query.limit(batchSize), Query.offset(offset)]
      );

      if (res.documents.length === 0) break;

      // Update each resource that doesn't have isPublic set
      for (const doc of res.documents) {
        if (doc.isPublic === undefined || doc.isPublic === null) {
          try {
            await databases.updateDocument(
              DATABASE_ID,
              PDF_RESOURCES_COLLECTION_ID,
              doc.$id,
              { isPublic: false }
            );
            totalUpdated++;
            console.log(`[Migration] Updated PDF: ${doc.fileName} (${totalUpdated})`);
          } catch (err) {
            console.error(`[Migration] Failed to update PDF ${doc.$id}:`, err.message);
          }
        }
      }

      offset += batchSize;
    }

    console.log(`[Migration] PDF migration complete. Updated ${totalUpdated} resources.`);
    return totalUpdated;
  } catch (err) {
    console.error('[Migration] PDF migration failed:', err.message);
    throw err;
  }
};

/**
 * Migrate audio lectures — ensure all have proper structure
 * (Audio lectures are always public by nature, but we verify structure)
 */
export const migrateAudioLectures = async () => {
  console.log('[Migration] Starting audio lectures migration...');
  
  try {
    let offset = 0;
    let totalUpdated = 0;
    const batchSize = 25;

    while (true) {
      const res = await databases.listDocuments(
        DATABASE_ID,
        AUDIO_LECTURES_COLLECTION_ID,
        [Query.limit(batchSize), Query.offset(offset)]
      );

      if (res.documents.length === 0) break;

      // Verify audio lectures have required fields
      for (const doc of res.documents) {
        const needsUpdate = !doc.title || !doc.transcript || !doc.lectureNotes;
        
        if (needsUpdate) {
          try {
            const updateData = {};
            if (!doc.title) updateData.title = `Audio Lecture ${doc.$id.substring(0, 8)}`;
            if (!doc.transcript) updateData.transcript = '';
            if (!doc.lectureNotes) updateData.lectureNotes = '';

            await databases.updateDocument(
              DATABASE_ID,
              AUDIO_LECTURES_COLLECTION_ID,
              doc.$id,
              updateData
            );
            totalUpdated++;
            console.log(`[Migration] Updated audio: ${doc.title || doc.$id} (${totalUpdated})`);
          } catch (err) {
            console.error(`[Migration] Failed to update audio ${doc.$id}:`, err.message);
          }
        }
      }

      offset += batchSize;
    }

    console.log(`[Migration] Audio migration complete. Updated ${totalUpdated} lectures.`);
    return totalUpdated;
  } catch (err) {
    console.error('[Migration] Audio migration failed:', err.message);
    throw err;
  }
};

/**
 * Run full migration
 */
export const runFullMigration = async () => {
  console.log('[Migration] ========================================');
  console.log('[Migration] Starting full resource migration');
  console.log('[Migration] ========================================');

  try {
    const pdfCount = await migratePDFResources();
    const audioCount = await migrateAudioLectures();

    console.log('[Migration] ========================================');
    console.log(`[Migration] Migration complete!`);
    console.log(`[Migration] - PDF resources updated: ${pdfCount}`);
    console.log(`[Migration] - Audio lectures updated: ${audioCount}`);
    console.log('[Migration] ========================================');

    return { pdfCount, audioCount };
  } catch (err) {
    console.error('[Migration] Full migration failed:', err);
    throw err;
  }
};
