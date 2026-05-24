import { Client, Users, Databases, ID, Query } from 'node-appwrite';

/**
 * Paddle Webhook Handler — Appwrite Function
 * 
 * NO signature verification — safe for sandbox testing.
 * Add signature verification before going to production.
 */
export default async ({ req, res, log, error }) => {
  if (req.method !== 'POST') {
    return res.json({ success: false, message: 'Method not allowed' }, 405);
  }

  try {
    // Appwrite auto-parses JSON bodies — handle both cases
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventType = payload.event_type;
    
    log(`[paddleWebhook] Event: ${eventType}`);
    log(`[paddleWebhook] Payload keys: ${Object.keys(payload.data || {}).join(', ')}`);

    // Initialize Appwrite
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID;

    // Find appwriteUserId from custom_data (Paddle puts it in different places)
    const customData = payload.data?.custom_data
      || payload.data?.subscription?.custom_data
      || payload.data?.transaction?.custom_data
      || {};

    const appwriteUserId = customData.appwriteUserId
      || customData.appwrite_user_id
      || null;

    log(`[paddleWebhook] custom_data: ${JSON.stringify(customData)}`);
    log(`[paddleWebhook] appwriteUserId: ${appwriteUserId}`);

    if (!appwriteUserId) {
      error(`[paddleWebhook] No appwriteUserId found. Event: ${eventType}`);
      return res.json({ success: false, message: 'No appwriteUserId in custom_data' });
    }

    // Upgrade events
    if (['subscription.created', 'subscription.activated', 'transaction.completed'].includes(eventType)) {
      
      // Map Paddle price IDs to plan names
      const PRICE_TO_PLAN = {
        'pri_01ks7zcvs99ceath0325eq3j4x': 'pro',
        'pri_01ksctenpamf1qsf620wm3c7xh': 'plus',
        'pri_01ksctt023k7t8f57pq7wv6yd4': 'proplus',
      };
      const detectedPriceId = payload.data?.items?.[0]?.price?.id || '';
      const plan = PRICE_TO_PLAN[detectedPriceId] || 'pro';

      // Add correct label based on plan
      const user = await users.get(appwriteUserId);
      const labels = user.labels || [];
      // Remove old plan labels AND filter out any invalid labels (only alphanumeric allowed)
      const cleanLabels = labels
        .filter(l => !['premium', 'pro', 'plus', 'proplus'].includes(l))
        .filter(l => /^[a-zA-Z0-9]+$/.test(l)); // Only keep valid labels
      const newLabels = [...cleanLabels, 'premium', plan];
      await users.updateLabels(appwriteUserId, newLabels);
      log(`[paddleWebhook] ✅ User ${appwriteUserId} upgraded to ${plan}. Labels: ${newLabels.join(', ')}`);

      // Save subscription to database
      if (databaseId) {
        try {
          const subData = {
            userId: appwriteUserId,
            paddleSubscriptionId: payload.data?.id || '',
            paddleCustomerId: payload.data?.customer_id || '',
            plan: plan,
            status: 'active',
            currentPeriodStart: payload.data?.current_billing_period?.starts_at || new Date().toISOString(),
            currentPeriodEnd: payload.data?.current_billing_period?.ends_at || '',
            canceledAt: '',
            priceId: detectedPriceId,
            currency: payload.data?.currency_code || 'USD',
            amount: String(payload.data?.details?.totals?.total || payload.data?.items?.[0]?.price?.unit_price?.amount || '0'),
            interval: payload.data?.items?.[0]?.price?.billing_cycle?.interval || 'month',
            updatedAt: new Date().toISOString(),
          };

          const existing = await databases.listDocuments(databaseId, 'subscriptions', [
            Query.equal('userId', appwriteUserId),
            Query.limit(1),
          ]);

          if (existing.documents.length > 0) {
            await databases.updateDocument(databaseId, 'subscriptions', existing.documents[0].$id, subData);
            log(`[paddleWebhook] Updated subscription doc`);
          } else {
            await databases.createDocument(databaseId, 'subscriptions', ID.unique(), {
              ...subData,
              createdAt: new Date().toISOString(),
            });
            log(`[paddleWebhook] Created subscription doc`);
          }
        } catch (dbErr) {
          error(`[paddleWebhook] DB error (non-fatal): ${dbErr.message}`);
        }
      }

      return res.json({ success: true, message: `User ${appwriteUserId} upgraded` });
    }

    // Downgrade events
    if (['subscription.canceled', 'subscription.past_due'].includes(eventType)) {
      
      // Remove premium label
      const user = await users.get(appwriteUserId);
      const newLabels = (user.labels || []).filter(l => l !== 'premium');
      await users.updateLabels(appwriteUserId, newLabels);
      log(`[paddleWebhook] ⚠️ premium label REMOVED from ${appwriteUserId}`);

      // Update subscription status
      if (databaseId) {
        try {
          const existing = await databases.listDocuments(databaseId, 'subscriptions', [
            Query.equal('userId', appwriteUserId),
            Query.limit(1),
          ]);
          if (existing.documents.length > 0) {
            await databases.updateDocument(databaseId, 'subscriptions', existing.documents[0].$id, {
              status: eventType === 'subscription.canceled' ? 'canceled' : 'past_due',
              canceledAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (dbErr) {
          error(`[paddleWebhook] DB error (non-fatal): ${dbErr.message}`);
        }
      }

      return res.json({ success: true, message: `User ${appwriteUserId} downgraded` });
    }

    // Unknown event — just acknowledge
    log(`[paddleWebhook] Unhandled event: ${eventType}`);
    return res.json({ success: true, message: `Event ${eventType} acknowledged` });

  } catch (err) {
    error(`[paddleWebhook] FATAL: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
