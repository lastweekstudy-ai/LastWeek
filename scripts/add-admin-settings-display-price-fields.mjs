/**
 * Adds admin_settings display-only pre-registration price fields.
 *
 * Safe behavior:
 * - Creates missing optional float attributes only.
 * - Skips attributes that already exist.
 * - Does not update, delete, or read document contents.
 */

import fs from 'node:fs';
import process from 'node:process';
import * as dotenv from 'dotenv';
import { Client, Databases } from 'node-appwrite';

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
      if (!key.startsWith('APPWRITE_') && !key.startsWith('VITE_APPWRITE_')) continue;

      const value = parts.join('=').trim().replace(/^['"]|['"]$/g, '');
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
const ADMIN_SETTINGS_COLLECTION =
  process.env.APPWRITE_ADMIN_SETTINGS_COLLECTION_ID ||
  process.env.VITE_APPWRITE_ADMIN_SETTINGS_COLLECTION_ID ||
  'admin_settings';

const fields = [
  {
    key: 'preRegDisplayPrice',
    label: 'admin_settings.preRegDisplayPrice',
  },
  {
    key: 'preRegDisplayValue',
    label: 'admin_settings.preRegDisplayValue',
  },
];

function assertEnv() {
  const missing = [];
  if (!ENDPOINT) missing.push('APPWRITE_ENDPOINT');
  if (!PROJECT_ID) missing.push('APPWRITE_PROJECT_ID');
  if (!DATABASE_ID) missing.push('APPWRITE_DATABASE_ID');
  if (!API_KEY) missing.push('APPWRITE_API_KEY');

  if (missing.length) {
    throw new Error(`Missing Appwrite env values: ${missing.join(', ')}`);
  }

  for (const [name, value] of Object.entries({
    APPWRITE_ENDPOINT: ENDPOINT,
    APPWRITE_PROJECT_ID: PROJECT_ID,
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_API_KEY: API_KEY,
  })) {
    if (looksPlaceholder(value)) {
      throw new Error(`${name} still looks like a placeholder. Refusing to run.`);
    }
  }
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

async function listAttributes() {
  const result = await databases.listAttributes(DATABASE_ID, ADMIN_SETTINGS_COLLECTION);
  return result.attributes || [];
}

async function waitForAttribute(key) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const attributes = await listAttributes();
    const attribute = attributes.find((item) => item.key === key);
    if (attribute && (!attribute.status || attribute.status === 'available')) {
      return attribute;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return null;
}

async function addFloatAttribute({ key, label }) {
  const existing = (await listAttributes()).find((attribute) => attribute.key === key);
  if (existing) {
    console.log(`exists  ${label} (${existing.status || 'unknown status'})`);
    return;
  }

  try {
    await databases.createFloatAttribute(
      DATABASE_ID,
      ADMIN_SETTINGS_COLLECTION,
      key,
      false,
      0,
      1000000,
      null,
      false
    );
    console.log(`created ${label}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`exists  ${label}`);
      return;
    }
    throw error;
  }

  const ready = await waitForAttribute(key);
  if (ready) {
    console.log(`ready   ${label}`);
  } else {
    console.log(`pending ${label} (Appwrite may still be processing it)`);
  }
}

async function main() {
  assertEnv();

  console.log('Admin settings display price schema setup');
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Database: ${DATABASE_ID}`);
  console.log(`Collection: ${ADMIN_SETTINGS_COLLECTION}`);

  for (const field of fields) {
    await addFloatAttribute(field);
  }

  console.log('Done. No documents, users, files, collections, or indexes were modified.');
}

main().catch((error) => {
  console.error(`Schema setup failed: ${error.message}`);
  process.exit(1);
});
