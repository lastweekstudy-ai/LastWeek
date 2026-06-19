/**
 * Adds the flexible fields needed for curriculum-aware guided tutor sessions.
 *
 * Safe behavior:
 * - Creates missing optional string attributes only.
 * - Skips attributes that already exist.
 * - Does not update, delete, or read document contents.
 */

import { Client, Databases } from 'node-appwrite';
import fs from 'node:fs';
import * as dotenv from 'dotenv';

dotenv.config();

const placeholderPatterns = [/^your_/i, /^replace_/i, /^changeme$/i, /^todo$/i];
const looksPlaceholder = (value) =>
  !value || placeholderPatterns.some((pattern) => pattern.test(String(value).trim()));

function loadLastRealServerEnv() {
  try {
    const contents = fs.readFileSync('.env', 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

      const [key, ...parts] = trimmed.split('=');
      if (!key.startsWith('APPWRITE_')) continue;

      const value = parts.join('=').trim();
      if (!looksPlaceholder(value)) {
        process.env[key] = value;
      }
    }
  } catch {
    // dotenv fallback above is enough when .env is unavailable.
  }
}

loadLastRealServerEnv();

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

const SESSIONS_COLLECTION = process.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID || 'sessions';
const PROFILES_COLLECTION = process.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || 'user_profiles';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

const fields = [
  {
    collectionId: SESSIONS_COLLECTION,
    key: 'curriculumContext',
    size: 6000,
    label: 'sessions.curriculumContext',
  },
  {
    collectionId: SESSIONS_COLLECTION,
    key: 'sessionPlan',
    size: 10000,
    label: 'sessions.sessionPlan',
  },
  {
    collectionId: SESSIONS_COLLECTION,
    key: 'guidedPlan',
    size: 6000,
    label: 'sessions.guidedPlan',
  },
  {
    collectionId: SESSIONS_COLLECTION,
    key: 'sessionState',
    size: 6000,
    label: 'sessions.sessionState',
  },
  {
    collectionId: PROFILES_COLLECTION,
    key: 'academicProfile',
    size: 6000,
    label: 'user_profiles.academicProfile',
  },
  {
    collectionId: PROFILES_COLLECTION,
    key: 'languageProfile',
    size: 3000,
    label: 'user_profiles.languageProfile',
  },
];

async function addStringAttribute({ collectionId, key, size, label }) {
  try {
    await databases.createStringAttribute(
      DATABASE_ID,
      collectionId,
      key,
      size,
      false,
      null,
      false
    );
    console.log(`created ${label}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`exists  ${label}`);
      return;
    }
    if (/maximum number or size of attributes/i.test(error.message || '')) {
      console.log(`skipped ${label} (${error.message})`);
      return;
    }
    throw error;
  }
}

async function main() {
  if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !API_KEY) {
    throw new Error('Missing Appwrite env values. Required: endpoint, project, database, APPWRITE_API_KEY.');
  }

  console.log('Guided tutor schema setup');
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Database: ${DATABASE_ID}`);

  for (const field of fields) {
    await addStringAttribute(field);
  }

  console.log('Done. No documents, users, files, or indexes were modified.');
}

main().catch((error) => {
  console.error(`Schema setup failed: ${error.message}`);
  process.exit(1);
});
