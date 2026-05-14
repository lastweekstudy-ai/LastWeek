/**
 * clear-lessons-only.js
 * Deletes ONLY the lang_lessons collection documents.
 * All other data (user profile, XP, roadmap, flashcards) is preserved.
 *
 * SETUP (one-time):
 *   1. Go to https://cloud.appwrite.io → your project → Overview → API Keys
 *   2. Edit the existing key (or create a new one)
 *   3. Add these scopes:  documents.read   documents.write
 *   4. Copy the key value into APPWRITE_API_KEY below (or set it as env var)
 *
 * Run: node scripts/clear-lessons-only.js
 *  or: APPWRITE_API_KEY=your_key node scripts/clear-lessons-only.js
 */

const ENDPOINT    = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID  = '69958be2003344c314a1';
const DATABASE_ID = '69f742a2001f393e4b85';
const COLLECTION  = 'lang_lessons';

// Use env var if set, otherwise fall back to the key in .env
const API_KEY = process.env.APPWRITE_API_KEY ||
  'standard_4394307ceb4f8cc92e625ed28b9cd85db624331430b62bf3a3268df0a9aa8117092e3bf31c1bfce8922a96ca3a5e54f37bf2a4ffe7d46e4a042a79b46dc856324d0f328f556121b5992d424ad65a3053714f5630ce14bc75ae0e060d2035ae2ca7309ba179a7f71b852e3de1af253983f9d0f55279c5c7664af3b139d90031e2';

const headers = {
  'Content-Type':       'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key':     API_KEY,
};

async function listPage(cursor) {
  const url = new URL(`${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION}/documents`);
  url.searchParams.set('limit', '100');
  if (cursor) url.searchParams.set('cursor', cursor);

  const res  = await fetch(url.toString(), { headers });
  const body = await res.json();
  if (!res.ok) throw new Error(`List failed (${res.status}): ${body.message}`);
  return body;
}

async function deleteDoc(id) {
  const res = await fetch(
    `${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION}/documents/${id}`,
    { method: 'DELETE', headers }
  );
  if (!res.ok && res.status !== 404) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Delete ${id} failed (${res.status}): ${body.message}`);
  }
}

async function main() {
  // ── Scope check ────────────────────────────────────────────────────────────
  console.log('🔍 Checking API key scopes...');
  const check = await fetch(
    `${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION}/documents?limit=1`,
    { headers }
  );
  const checkBody = await check.json();

  if (!check.ok) {
    if (checkBody.type === 'general_unauthorized_scope') {
      console.error('\n❌ API key is missing required scopes.\n');
      console.error('   Fix it in 30 seconds:');
      console.error('   1. Open https://cloud.appwrite.io');
      console.error('   2. Go to your project → Overview → API Keys');
      console.error('   3. Edit the key → add scopes:  documents.read   documents.write');
      console.error('   4. Re-run this script\n');
    } else {
      console.error('\n❌ Unexpected error:', checkBody.message);
    }
    process.exit(1);
  }
  // ───────────────────────────────────────────────────────────────────────────

  console.log(`✅ API key OK — found ${checkBody.total} lesson documents\n`);

  if (checkBody.total === 0) {
    console.log('   Nothing to delete. Collection is already empty.');
    return;
  }

  const confirm = await new Promise(resolve => {
    process.stdout.write(`   Delete all ${checkBody.total} lessons? (y/N) `);
    process.stdin.once('data', d => resolve(d.toString().trim().toLowerCase()));
  });

  if (confirm !== 'y') {
    console.log('\n   Aborted.');
    process.exit(0);
  }

  console.log('');
  let deleted = 0;
  let cursor  = null;

  while (true) {
    const page = await listPage(cursor);
    const docs = page.documents ?? [];
    if (docs.length === 0) break;

    for (const doc of docs) {
      await deleteDoc(doc.$id);
      deleted++;
      process.stdout.write(
        `\r   Deleted ${deleted} / ${page.total}  (${doc.moduleId ?? ''}__${doc.stageName ?? ''})`
      );
    }

    if (docs.length < 100) break;
    cursor = docs[docs.length - 1].$id;
  }

  console.log(`\n\n✅ Done — deleted ${deleted} lesson documents.`);
  console.log('   User profile, XP, roadmap and flashcards are untouched.\n');
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
