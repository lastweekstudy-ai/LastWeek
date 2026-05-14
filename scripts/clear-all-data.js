/**
 * clear-all-data.js
 * Deletes ALL documents from ALL collections in the Appwrite database.
 * Collections, attributes, and indexes are preserved — only data is removed.
 *
 * Run: node scripts/clear-all-data.js
 */

const ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '69958be2003344c314a1';
const DATABASE_ID = '69f742a2001f393e4b85';
const API_KEY = 'standard_4394307ceb4f8cc92e625ed28b9cd85db624331430b62bf3a3268df0a9aa8117092e3bf31c1bfce8922a96ca3a5e54f37bf2a4ffe7d46e4a042a79b46dc856324d0f328f556121b5992d424ad65a3053714f5630ce14bc75ae0e060d2035ae2ca7309ba179a7f71b852e3de1af253983f9d0f55279c5c7664af3b139d90031e2';

// All collection IDs from .env
const COLLECTIONS = [
  // Core app collections
  { id: 'sessions',              name: 'Sessions' },
  { id: 'messages',              name: 'Messages' },
  { id: 'flashcards',            name: 'Flashcards' },
  { id: 'user_profiles',         name: 'User Profiles' },
  { id: 'file_attachments',      name: 'File Attachments' },
  { id: 'pdf_resources',         name: 'PDF Resources' },
  { id: 'pdf_notes',             name: 'PDF Notes' },
  { id: 'pdf_highlights',        name: 'PDF Highlights' },
  { id: 'study_schedule',        name: 'Study Schedule' },
  { id: 'session_context',       name: 'Session Context' },
  { id: 'exam_plans',            name: 'Exam Plans' },
  { id: 'youtube_studies',       name: 'YouTube Studies' },
  { id: 'audio_lectures',        name: 'Audio Lectures' },
  // Language learning collections
  { id: 'lang_users',            name: 'Lang Users' },
  { id: 'lang_roadmaps',         name: 'Lang Roadmaps' },
  { id: 'lang_lessons',          name: 'Lang Lessons' },
  { id: 'lang_lesson_attempts',  name: 'Lang Lesson Attempts' },
  { id: 'lang_practice_sessions',name: 'Lang Practice Sessions' },
  { id: 'lang_flashcard_reviews',name: 'Lang Flashcard Reviews' },
  { id: 'lang_conversation_sessions', name: 'Lang Conversation Sessions' },
  { id: 'lang_user_points',      name: 'Lang User Points' },
  { id: 'lang_srs_items',        name: 'Lang SRS Items' },
];

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
};

async function clearCollection(collectionId, collectionName) {
  let total = 0;
  let cursor = null;

  while (true) {
    const params = new URLSearchParams({ limit: '100' });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(
      `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents?${params}`,
      { headers }
    );

    if (res.status === 404) {
      console.log(`  ⚠️  ${collectionName}: collection not found — skipping`);
      return 0;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.log(`  ⚠️  ${collectionName}: ${err.message || res.status} — skipping`);
      return 0;
    }

    const data = await res.json();
    const docs = data.documents || [];
    if (docs.length === 0) break;

    // Delete in parallel batches of 10
    for (let i = 0; i < docs.length; i += 10) {
      const batch = docs.slice(i, i + 10);
      await Promise.all(batch.map(doc =>
        fetch(
          `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents/${doc.$id}`,
          { method: 'DELETE', headers }
        ).catch(() => {})
      ));
      total += batch.length;
      process.stdout.write(`\r  ${collectionName}: deleted ${total}...    `);
    }

    if (docs.length < 100) break;
    cursor = docs[docs.length - 1].$id;
  }

  return total;
}

async function main() {
  console.log('🗑️  Clearing ALL documents from ALL collections...\n');
  console.log(`   Database: ${DATABASE_ID}`);
  console.log(`   Collections: ${COLLECTIONS.length}\n`);

  let grandTotal = 0;

  for (const col of COLLECTIONS) {
    const count = await clearCollection(col.id, col.name);
    if (count > 0) {
      console.log(`\r  ✅ ${col.name}: deleted ${count} documents`);
    } else {
      console.log(`  ✅ ${col.name}: already empty`);
    }
    grandTotal += count;
  }

  console.log(`\n✅ Done! Deleted ${grandTotal} documents total.`);
  console.log('   All collections, attributes, and indexes are intact.\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
