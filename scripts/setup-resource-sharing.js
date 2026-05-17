/**
 * setup-resource-sharing.js
 *
 * Adds the new attributes required for the secure resource sharing system:
 *
 *   pdf_resources collection:
 *     - isImported        (boolean) — true if this is an imported copy
 *     - originalResourceId (string) — ID of the original shared resource
 *     - addCount          (integer) — how many users have added this resource
 *
 *   audio_lectures collection:
 *     - isImported        (boolean) — true if this is an imported copy
 *     - originalLectureId (string)  — ID of the original shared lecture
 *     - addCount          (integer) — how many users have added this lecture
 *
 * Usage:
 *   node scripts/setup-resource-sharing.js
 *
 * Requirements:
 *   - APPWRITE_API_KEY in .env with database read/write permissions
 */

import { Client, Databases } from 'appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

const ENDPOINT    = process.env.VITE_APPWRITE_ENDPOINT  || process.env.APPWRITE_ENDPOINT;
const PROJECT_ID  = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
const API_KEY     = process.env.APPWRITE_API_KEY;

const PDF_COLLECTION   = process.env.VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID  || 'pdf_resources';
const AUDIO_COLLECTION = process.env.VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID || 'audio_lectures';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

/** Add a single attribute, skip gracefully if it already exists (409) */
async function addAttr(fn, label) {
  try {
    await fn();
    console.log(`    ✅ ${label}`);
  } catch (err) {
    if (err.code === 409) {
      console.log(`    ⚠️  ${label} — already exists, skipping`);
    } else {
      console.error(`    ❌ ${label} — ${err.message}`);
      throw err;
    }
  }
}

async function setupPDFCollection() {
  console.log(`\n📄 Adding attributes to: ${PDF_COLLECTION}`);

  await addAttr(
    () => databases.createBooleanAttribute(DATABASE_ID, PDF_COLLECTION, 'isImported', false),
    'isImported (boolean, optional)'
  );

  await addAttr(
    () => databases.createStringAttribute(DATABASE_ID, PDF_COLLECTION, 'originalResourceId', 36, false),
    'originalResourceId (string 36, optional)'
  );

  await addAttr(
    () => databases.createIntegerAttribute(DATABASE_ID, PDF_COLLECTION, 'addCount', false, 0, 9999999, 0),
    'addCount (integer, default 0)'
  );

  // Wait for Appwrite to process attributes before creating indexes
  console.log('  ⏳ Waiting 4s for attributes to be ready...');
  await new Promise(r => setTimeout(r, 4000));

  // Index on originalResourceId so hasUserAddedResource() is fast
  try {
    await databases.createIndex(
      DATABASE_ID, PDF_COLLECTION,
      'original_resource_idx', 'key',
      ['originalResourceId'], ['ASC']
    );
    console.log('    ✅ index: originalResourceId');
  } catch (err) {
    if (err.code === 409) console.log('    ⚠️  index: originalResourceId — already exists');
    else console.warn('    ⚠️  index: originalResourceId —', err.message);
  }

  // Compound index: userId + originalResourceId (used in hasUserAddedResource)
  try {
    await databases.createIndex(
      DATABASE_ID, PDF_COLLECTION,
      'user_original_pdf_idx', 'key',
      ['userId', 'originalResourceId'], ['ASC', 'ASC']
    );
    console.log('    ✅ index: userId + originalResourceId');
  } catch (err) {
    if (err.code === 409) console.log('    ⚠️  index: userId + originalResourceId — already exists');
    else console.warn('    ⚠️  index: userId + originalResourceId —', err.message);
  }
}

async function setupAudioCollection() {
  console.log(`\n🎙️  Adding attributes to: ${AUDIO_COLLECTION}`);

  await addAttr(
    () => databases.createBooleanAttribute(DATABASE_ID, AUDIO_COLLECTION, 'isImported', false),
    'isImported (boolean, optional)'
  );

  await addAttr(
    () => databases.createStringAttribute(DATABASE_ID, AUDIO_COLLECTION, 'originalLectureId', 36, false),
    'originalLectureId (string 36, optional)'
  );

  await addAttr(
    () => databases.createIntegerAttribute(DATABASE_ID, AUDIO_COLLECTION, 'addCount', false, 0, 9999999, 0),
    'addCount (integer, default 0)'
  );

  console.log('  ⏳ Waiting 4s for attributes to be ready...');
  await new Promise(r => setTimeout(r, 4000));

  try {
    await databases.createIndex(
      DATABASE_ID, AUDIO_COLLECTION,
      'original_lecture_idx', 'key',
      ['originalLectureId'], ['ASC']
    );
    console.log('    ✅ index: originalLectureId');
  } catch (err) {
    if (err.code === 409) console.log('    ⚠️  index: originalLectureId — already exists');
    else console.warn('    ⚠️  index: originalLectureId —', err.message);
  }

  try {
    await databases.createIndex(
      DATABASE_ID, AUDIO_COLLECTION,
      'user_original_audio_idx', 'key',
      ['userId', 'originalLectureId'], ['ASC', 'ASC']
    );
    console.log('    ✅ index: userId + originalLectureId');
  } catch (err) {
    if (err.code === 409) console.log('    ⚠️  index: userId + originalLectureId — already exists');
    else console.warn('    ⚠️  index: userId + originalLectureId —', err.message);
  }
}

async function main() {
  console.log('🔒 Resource Sharing — Appwrite Attribute Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Endpoint:   ${ENDPOINT}`);
  console.log(`  Project:    ${PROJECT_ID}`);
  console.log(`  Database:   ${DATABASE_ID}`);

  if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !API_KEY) {
    console.error('\n❌ Missing environment variables. Check .env for:');
    console.error('   VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID,');
    console.error('   VITE_APPWRITE_DATABASE_ID, APPWRITE_API_KEY');
    process.exit(1);
  }

  try {
    await setupPDFCollection();
    await setupAudioCollection();

    console.log('\n✅ All attributes and indexes added successfully.');
    console.log('\nWhat was added:');
    console.log('  pdf_resources:   isImported, originalResourceId, addCount');
    console.log('  audio_lectures:  isImported, originalLectureId,  addCount');
    console.log('\nNo existing data was changed. New attributes default to null/0.');
    console.log('Existing resources are treated as original (not imported) by default.\n');
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  }
}

main();
