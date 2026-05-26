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

    // Pre-registration price ID (set this in env)
    const PRE_REG_PRICE_ID = process.env.PADDLE_PRE_REG_PRICE_ID || '';
    const detectedPriceId = payload.data?.items?.[0]?.price?.id || '';
    const isPreRegPayment = detectedPriceId === PRE_REG_PRICE_ID;

    log(`[paddleWebhook] custom_data: ${JSON.stringify(customData)}`);
    log(`[paddleWebhook] appwriteUserId: ${appwriteUserId}`);
    log(`[paddleWebhook] isPreRegPayment: ${isPreRegPayment}`);

    // Handle pre-registration payment without account (from landing page form)
    if (isPreRegPayment && !appwriteUserId) {
      const userEmail = customData.userEmail || payload.data?.customer?.email || payload.data?.email_address;
      const userName = customData.userName || customData.name || '';
      
      if (!userEmail) {
        error(`[paddleWebhook] Pre-reg payment but no email found`);
        return res.json({ success: false, message: 'No email for pre-registration' });
      }
      
      log(`[paddleWebhook] 🎉 Pre-registration payment for ${userEmail}`);
      
      // Check if user already exists
      let existingUser = null;
      try {
        const userList = await users.list();
        existingUser = userList.users.find(u => u.email === userEmail);
      } catch (e) {
        // Ignore
      }
      
      if (existingUser) {
        // User exists - add plus label
        const labels = existingUser.labels || [];
        const cleanLabels = labels.filter(l => /^[a-zA-Z0-9]+$/.test(l));
        if (!cleanLabels.includes('plus')) {
          cleanLabels.push('plus');
        }
        await users.updateLabels(existingUser.$id, cleanLabels);
        log(`[paddleWebhook] ✅ Existing user ${existingUser.$id} got Plus from pre-reg`);
        
        // Create pre-registration record
        if (databaseId) {
          const plusUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          
          try {
            const generatePromoCode = (id) => {
              const prefix = 'LW';
              const hash = id.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
              const random = Math.random().toString(36).slice(2, 6).toUpperCase();
              return `${prefix}${hash}${random}`;
            };
            
            await databases.createDocument(databaseId, 'pre_registrations', ID.unique(), {
              userId: existingUser.$id,
              email: userEmail,
              name: userName || existingUser.name || '',
              type: 'paid',
              promoCode: generatePromoCode(existingUser.$id),
              promoCodeUses: 0,
              bonusMonthsEarned: 0,
              plusUntil,
              status: 'active',
              reviewId: null,
              paddlePaymentId: payload.data?.id || payload.data?.transaction?.id || '',
              createdAt: new Date().toISOString(),
            });
            log(`[paddleWebhook] Created pre-registration record for existing user`);
          } catch (dbErr) {
            error(`[paddleWebhook] Pre-reg DB error: ${dbErr.message}`);
          }
        }
        
        return res.json({ success: true, message: `Existing user ${existingUser.$id} pre-registered` });
      }
      
      // User doesn't exist - just create pre-registration record with email
      if (databaseId) {
        const plusUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        const tempId = userEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) + Date.now().toString(36);
        
        try {
          const generatePromoCode = (id) => {
            const prefix = 'LW';
            const hash = id.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
            const random = Math.random().toString(36).slice(2, 6).toUpperCase();
            return `${prefix}${hash}${random}`;
          };
          
          await databases.createDocument(databaseId, 'pre_registrations', ID.unique(), {
            userId: tempId, // Temporary ID until they create account
            email: userEmail,
            name: userName || '',
            type: 'paid',
            promoCode: generatePromoCode(tempId),
            promoCodeUses: 0,
            bonusMonthsEarned: 0,
            plusUntil,
            status: 'pending', // Will be activated when they create account
            reviewId: null,
            paddlePaymentId: payload.data?.id || payload.data?.transaction?.id || '',
            createdAt: new Date().toISOString(),
          });
          log(`[paddleWebhook] Created pre-registration record for ${userEmail}`);
        } catch (dbErr) {
          error(`[paddleWebhook] Pre-reg DB error: ${dbErr.message}`);
        }
      }
      
      return res.json({ success: true, message: `Pre-registration recorded for ${userEmail}` });
    }

    if (!appwriteUserId) {
      error(`[paddleWebhook] No appwriteUserId found. Event: ${eventType}`);
      return res.json({ success: false, message: 'No appwriteUserId in custom_data' });
    }

    // Upgrade events
    if (['subscription.created', 'subscription.activated', 'transaction.completed'].includes(eventType)) {
      
      // Map Paddle price IDs to plan names (from environment variables)
      const PRICE_TO_PLAN = {
        [process.env.PADDLE_PRO_PRICE_ID || '']: 'pro',
        [process.env.PADDLE_PLUS_PRICE_ID || '']: 'plus',
        [process.env.PADDLE_PROPLUS_PRICE_ID || '']: 'proplus',
      };
      
      if (isPreRegPayment) {
        log(`[paddleWebhook] 🎉 Pre-registration payment detected`);
        
        // Add plus label for pre-reg users (1 year free)
        const user = await users.get(appwriteUserId);
        const labels = user.labels || [];
        const cleanLabels = labels.filter(l => /^[a-zA-Z0-9]+$/.test(l));
        
        if (!cleanLabels.includes('plus')) {
          cleanLabels.push('plus');
        }
        await users.updateLabels(appwriteUserId, cleanLabels);
        log(`[paddleWebhook] ✅ User ${appwriteUserId} got Plus from pre-reg. Labels: ${cleanLabels.join(', ')}`);
        
        // Create pre-registration record
        if (databaseId) {
          try {
            // Generate promo code
            const generatePromoCode = (userId) => {
              const prefix = 'LW';
              const hash = userId.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
              const random = Math.random().toString(36).slice(2, 6).toUpperCase();
              return `${prefix}${hash}${random}`;
            };
            
            const plusUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
            
            const existingPreReg = await databases.listDocuments(databaseId, 'pre_registrations', [
              Query.equal('userId', appwriteUserId),
              Query.limit(1),
            ]);
            
            if (existingPreReg.documents.length === 0) {
              await databases.createDocument(databaseId, 'pre_registrations', ID.unique(), {
                userId: appwriteUserId,
                email: user.email || '',
                name: user.name || '',
                type: 'paid',
                promoCode: generatePromoCode(appwriteUserId),
                promoCodeUses: 0,
                bonusMonthsEarned: 0,
                plusUntil,
                status: 'active',
                reviewId: null,
                paddlePaymentId: payload.data?.id || payload.data?.transaction?.id || '',
                createdAt: new Date().toISOString(),
              });
              log(`[paddleWebhook] Created pre-registration record`);
            }
            
            // Also save subscription record
            const subData = {
              userId: appwriteUserId,
              paddleSubscriptionId: '',
              paddleCustomerId: payload.data?.customer_id || '',
              plan: 'plus',
              status: 'active',
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: plusUntil,
              canceledAt: '',
              priceId: detectedPriceId,
              currency: payload.data?.currency_code || 'USD',
              amount: '5.00',
              interval: 'year',
              updatedAt: new Date().toISOString(),
            };
            
            const existing = await databases.listDocuments(databaseId, 'subscriptions', [
              Query.equal('userId', appwriteUserId),
              Query.limit(1),
            ]);
            
            if (existing.documents.length > 0) {
              await databases.updateDocument(databaseId, 'subscriptions', existing.documents[0].$id, subData);
            } else {
              await databases.createDocument(databaseId, 'subscriptions', ID.unique(), {
                ...subData,
                createdAt: new Date().toISOString(),
              });
            }
          } catch (dbErr) {
            error(`[paddleWebhook] Pre-reg DB error: ${dbErr.message}`);
          }
        }
        
        return res.json({ success: true, message: `User ${appwriteUserId} pre-registered` });
      }
      
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
