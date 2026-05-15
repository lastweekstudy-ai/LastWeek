/**
 * Automated Appwrite TTS Collections Setup Script
 * 
 * This script creates the required collections and attributes for the TTS system.
 * 
 * Usage:
 *   node scripts/setup-tts-collections.js
 * 
 * Requirements:
 *   - Appwrite API key with database permissions
 *   - Environment variables configured in .env
 */

import { Client, Databases, ID } from 'appwrite';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

// Collection IDs
const TTS_CACHE_COLLECTION_ID = 'tts_cache_metadata';
const TTS_USAGE_COLLECTION_ID = 'tts_usage';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

/**
 * Create TTS Cache Metadata collection
 */
async function createCacheCollection() {
  console.log('\n📦 Creating TTS Cache Metadata collection...');

  try {
    // Create collection with document-level permissions
    await databases.createCollection(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID,
      'TTS Cache Metadata',
      [], // Empty = document-level permissions
      true // Document security enabled
    );
    console.log('✅ Collection created (document-level permissions)');

    // Add attributes
    console.log('  Adding attributes...');

    await databases.createStringAttribute(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID,
      'text',
      500,
      true
    );
    console.log('    ✅ text (string, 500)');

    await databases.createStringAttribute(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID,
      'voice',
      50,
      true
    );
    console.log('    ✅ voice (string, 50)');

    await databases.createStringAttribute(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID,
      'fileId',
      100,
      true
    );
    console.log('    ✅ fileId (string, 100)');

    await databases.createDatetimeAttribute(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID,
      'createdAt',
      true
    );
    console.log('    ✅ createdAt (datetime)');

    await databases.createIntegerAttribute(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID,
      'charCount',
      true,
      0,
      1000000
    );
    console.log('    ✅ charCount (integer)');

    // Wait for attributes to be available
    console.log('  Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create indexes
    console.log('  Creating indexes...');

    await databases.createIndex(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID,
      'voice_idx',
      'key',
      ['voice'],
      ['ASC']
    );
    console.log('    ✅ voice_idx');

    await databases.createIndex(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID,
      'created_idx',
      'key',
      ['createdAt'],
      ['DESC']
    );
    console.log('    ✅ created_idx');

    await databases.createIndex(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID,
      'file_idx',
      'key',
      ['fileId'],
      ['ASC']
    );
    console.log('    ✅ file_idx');

    console.log('✅ TTS Cache Metadata collection setup complete!\n');
  } catch (error) {
    if (error.code === 409) {
      console.log('⚠️  Collection already exists, skipping...\n');
    } else {
      console.error('❌ Error creating cache collection:', error.message);
      throw error;
    }
  }
}

/**
 * Create TTS Usage collection
 */
async function createUsageCollection() {
  console.log('📊 Creating TTS Usage collection...');

  try {
    // Create collection with document-level permissions
    await databases.createCollection(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      'TTS Usage',
      [], // Empty = document-level permissions
      true // Document security enabled
    );
    console.log('✅ Collection created (document-level permissions)');

    // Add attributes
    console.log('  Adding attributes...');

    await databases.createStringAttribute(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      'userId',
      100,
      true
    );
    console.log('    ✅ userId (string, 100)');

    await databases.createIntegerAttribute(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      'charCount',
      true,
      0,
      1000000
    );
    console.log('    ✅ charCount (integer)');

    await databases.createStringAttribute(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      'voice',
      50,
      true
    );
    console.log('    ✅ voice (string, 50)');

    await databases.createDatetimeAttribute(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      'timestamp',
      true
    );
    console.log('    ✅ timestamp (datetime)');

    // Wait for attributes to be available
    console.log('  Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create indexes
    console.log('  Creating indexes...');

    await databases.createIndex(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      'user_idx',
      'key',
      ['userId'],
      ['ASC']
    );
    console.log('    ✅ user_idx');

    await databases.createIndex(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      'timestamp_idx',
      'key',
      ['timestamp'],
      ['DESC']
    );
    console.log('    ✅ timestamp_idx');

    await databases.createIndex(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      'user_timestamp_idx',
      'key',
      ['userId', 'timestamp'],
      ['ASC', 'DESC']
    );
    console.log('    ✅ user_timestamp_idx');

    await databases.createIndex(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID,
      'voice_idx',
      'key',
      ['voice'],
      ['ASC']
    );
    console.log('    ✅ voice_idx');

    console.log('✅ TTS Usage collection setup complete!\n');
  } catch (error) {
    if (error.code === 409) {
      console.log('⚠️  Collection already exists, skipping...\n');
    } else {
      console.error('❌ Error creating usage collection:', error.message);
      throw error;
    }
  }
}

/**
 * Verify setup
 */
async function verifySetup() {
  console.log('🔍 Verifying setup...\n');

  try {
    // Check cache collection
    const cacheCollection = await databases.getCollection(
      DATABASE_ID,
      TTS_CACHE_COLLECTION_ID
    );
    console.log(`✅ ${cacheCollection.name} (${cacheCollection.$id})`);
    console.log(`   Attributes: ${cacheCollection.attributes.length}`);
    console.log(`   Indexes: ${cacheCollection.indexes.length}`);

    // Check usage collection
    const usageCollection = await databases.getCollection(
      DATABASE_ID,
      TTS_USAGE_COLLECTION_ID
    );
    console.log(`✅ ${usageCollection.name} (${usageCollection.$id})`);
    console.log(`   Attributes: ${usageCollection.attributes.length}`);
    console.log(`   Indexes: ${usageCollection.indexes.length}`);

    console.log('\n✅ All collections verified!\n');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  }
}

/**
 * Update .env file
 */
function updateEnvFile() {
  console.log('📝 Environment variables to add to .env:\n');
  console.log('# TTS Collections');
  console.log(`VITE_TTS_CACHE_COLLECTION_ID=${TTS_CACHE_COLLECTION_ID}`);
  console.log(`VITE_TTS_USAGE_COLLECTION_ID=${TTS_USAGE_COLLECTION_ID}`);
  console.log('\n');
}

/**
 * Main setup function
 */
async function setup() {
  console.log('🚀 Appwrite TTS Collections Setup\n');
  console.log('Configuration:');
  console.log(`  Endpoint: ${ENDPOINT}`);
  console.log(`  Project: ${PROJECT_ID}`);
  console.log(`  Database: ${DATABASE_ID}`);
  console.log('');

  // Validate configuration
  if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !API_KEY) {
    console.error('❌ Missing required environment variables!');
    console.error('   Please ensure .env contains:');
    console.error('   - VITE_APPWRITE_ENDPOINT (or APPWRITE_ENDPOINT)');
    console.error('   - VITE_APPWRITE_PROJECT_ID (or APPWRITE_PROJECT_ID)');
    console.error('   - VITE_APPWRITE_DATABASE_ID (or APPWRITE_DATABASE_ID)');
    console.error('   - APPWRITE_API_KEY');
    process.exit(1);
  }

  try {
    // Create collections
    await createCacheCollection();
    await createUsageCollection();

    // Verify setup
    await verifySetup();

    // Show env variables
    updateEnvFile();

    console.log('🎉 Setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Add the environment variables above to your .env file');
    console.log('  2. Restart your development server');
    console.log('  3. Test TTS: await speak("Hello!", { userId: "test" })');
    console.log('\n');
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nPlease check:');
    console.error('  - API key has database permissions');
    console.error('  - Database ID is correct');
    console.error('  - Network connection is stable');
    process.exit(1);
  }
}

// Run setup
setup();
