/**
 * clear-lang-data.js
 * Deletes all documents from language learning collections.
 * Collections and attributes are preserved — only data is removed.
 *
 * Run: node scripts/clear-lang-data.js
 */

const ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '69958be2003344c314a1';
const DATABASE_ID = '69f742a2001f393e4b85';
const API_KEY = 'standard_4394307ceb4f8cc92e625ed28b9cd85db624331430b62bf3a3268df0a9aa8117092e3bf31c1bfce8922a96ca3a5e54f37bf2a4ffe7d46e4a042a79b46dc856324d0f328f556121b5992d424ad65a3053714f5630ce14bc75ae0e060d2035ae2ca7309ba179a7f71b852e3de1af253983f9d0f55279c5c7664af3b139d90031e2';

const COLLECTIONS = [
  'lang_users',
  'lang_roadmaps',
  'lang_lessons',
  'lang_lesson_attempts',
  'lang_practice_sessions',
  'lang_flashcard_reviews',
  'lang_conversation_sessions',
  'lang_user_points',
  'lang_srs_items',
];

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
};

async function listDocuments(collectionId, cursor = null) {
  const params = new URLSearchParams({ limit: '100' });
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(
    `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents?${params}`,
    { headers }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`List failed for ${collectionId}: ${err.message || res.status}`);
  }

  return res.json();
}

async function deleteDocument(collectionId, documentId) {
  const res = await fetch(
    `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents/${documentId}`,
    { method: 'DELETE', headers }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Delete failed: ${err.message || res.status}`);
  }
}

async function clearCollection(collectionId) {
  let total = 0;
  let cursor = null;

  while (true) {
    let data;
    try {
      data = await listDocuments(collectionId, cursor);
    } catch (err) {
      console.log(`  ⚠️  ${collectionId}: ${err.message} — skipping`);
      return 0;
    }

    const docs = data.documents || [];
    if (docs.length === 0) break;

    for (const doc of docs) {
      await deleteDocument(collectionId, doc.$id);
      total++;
      process.stdout.write(`\r  Deleted ${total} documents from ${collectionId}...`);
    }

    // If fewer than 100 returned, we're done
    if (docs.length < 100) break;

    // Set cursor to last document ID for next page
    cursor = docs[docs.length - 1].$id;
  }

  return total;
}

async function main() {
  console.log('🗑️  Clearing language learning data from Appwrite...\n');

  let grandTotal = 0;

  for (const collectionId of COLLECTIONS) {
    process.stdout.write(`  Processing ${collectionId}...\n`);
    const count = await clearCollection(collectionId);
    if (count > 0) {
      console.log(`\r  ✅ ${collectionId}: deleted ${count} documents`);
    } else {
      console.log(`  ✅ ${collectionId}: already empty`);
    }
    grandTotal += count;
  }

  console.log(`\n✅ Done! Deleted ${grandTotal} documents total.`);
  console.log('   Collections and attributes are intact.\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
