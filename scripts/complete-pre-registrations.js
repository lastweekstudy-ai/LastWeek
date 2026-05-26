/**
 * Complete Pre-Registrations Script
 * 
 * This script grants Plus plans to all active pre-registered users.
 * Run this when pre-registration period ends.
 * 
 * Usage:
 *   node scripts/complete-pre-registrations.js
 * 
 * Or call the function from admin panel.
 */

import { Client, Databases, Users, Query } from 'node-appwrite';

// Initialize Appwrite client with server credentials
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Server API key (not client key)

const databases = new Databases(client);
const users = new Users(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const PRE_REGISTRATIONS_COLLECTION_ID = 'pre_registrations';
const USER_SUBSCRIPTIONS_COLLECTION_ID = 'user_subscriptions'; // Adjust if different

/**
 * Get all active pre-registrations
 */
async function getActivePreRegistrations() {
  const allPreRegs = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const result = await databases.listDocuments(
      DATABASE_ID,
      PRE_REGISTRATIONS_COLLECTION_ID,
      [
        Query.equal('status', 'active'),
        Query.limit(limit),
        Query.offset(offset),
      ]
    );

    allPreRegs.push(...result.documents);

    if (result.documents.length < limit) break;
    offset += limit;
  }

  return allPreRegs;
}

/**
 * Grant Plus plan to a user
 */
async function grantPlusPlan(userId, months = 12) {
  const now = new Date();
  const plusUntil = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);

  try {
    // Check if user has existing subscription record
    const existingSubs = await databases.listDocuments(
      DATABASE_ID,
      USER_SUBSCRIPTIONS_COLLECTION_ID,
      [Query.equal('userId', userId), Query.limit(1)]
    );

    if (existingSubs.documents.length > 0) {
      // Update existing subscription
      const sub = existingSubs.documents[0];
      const currentExpiry = sub.plusUntil ? new Date(sub.plusUntil) : now;
      const newExpiry = currentExpiry > now 
        ? new Date(currentExpiry.getTime() + months * 30 * 24 * 60 * 60 * 1000)
        : plusUntil;

      await databases.updateDocument(
        DATABASE_ID,
        USER_SUBSCRIPTIONS_COLLECTION_ID,
        sub.$id,
        {
          plan: 'plus',
          plusUntil: newExpiry.toISOString(),
          preRegConverted: true,
          convertedAt: now.toISOString(),
        }
      );
      
      return { success: true, action: 'updated', plusUntil: newExpiry };
    } else {
      // Create new subscription record
      await databases.createDocument(
        DATABASE_ID,
        USER_SUBSCRIPTIONS_COLLECTION_ID,
        userId, // Use userId as document ID
        {
          userId,
          plan: 'plus',
          plusUntil: plusUntil.toISOString(),
          preRegConverted: true,
          convertedAt: now.toISOString(),
        }
      );
      
      return { success: true, action: 'created', plusUntil };
    }
  } catch (err) {
    console.error(`Failed to grant Plus to ${userId}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Main function - Convert all pre-registrations to Plus plans
 */
async function completePreRegistrations() {
  console.log('=== Starting Pre-Registration Completion ===\n');
  
  // Get all active pre-registrations
  const preRegs = await getActivePreRegistrations();
  console.log(`Found ${preRegs.length} active pre-registrations\n`);

  const results = {
    total: preRegs.length,
    success: 0,
    failed: 0,
    details: [],
  };

  for (const preReg of preRegs) {
    console.log(`Processing: ${preReg.email} (${preReg.type})`);
    
    // Calculate months: 12 months base + bonus months from referrals
    const baseMonths = 12;
    const bonusMonths = preReg.bonusMonthsEarned || 0;
    const totalMonths = baseMonths + bonusMonths;
    
    const result = await grantPlusPlan(preReg.userId, totalMonths);
    
    if (result.success) {
      results.success++;
      console.log(`  ✓ Granted ${totalMonths} months of Plus (${baseMonths} base + ${bonusMonths} bonus)`);
      
      // Update pre-registration status
      await databases.updateDocument(
        DATABASE_ID,
        PRE_REGISTRATIONS_COLLECTION_ID,
        preReg.$id,
        {
          status: 'converted',
          convertedAt: new Date().toISOString(),
          plusGranted: true,
          plusMonthsGranted: totalMonths,
        }
      );
    } else {
      results.failed++;
      console.log(`  ✗ Failed: ${result.error}`);
    }

    results.details.push({
      email: preReg.email,
      userId: preReg.userId,
      type: preReg.type,
      promoCode: preReg.promoCode,
      referralUses: preReg.promoCodeUses || 0,
      bonusMonths,
      totalMonths,
      ...result,
    });
  }

  console.log('\n=== Summary ===');
  console.log(`Total: ${results.total}`);
  console.log(`Success: ${results.success}`);
  console.log(`Failed: ${results.failed}`);

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completePreRegistrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Script failed:', err);
      process.exit(1);
    });
}

export { completePreRegistrations, grantPlusPlan };
