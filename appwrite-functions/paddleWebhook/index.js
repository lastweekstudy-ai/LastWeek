import { Client, Users, Databases, ID, Query } from 'node-appwrite';

const PLAN_LABELS = ['premium', 'pro', 'plus', 'proplus'];
const ACTIVE_STATUSES = ['active', 'trialing'];
const ADMIN_LABEL = process.env.ADMIN_LABEL || 'admin';

const isValidLabel = (label) => /^[a-zA-Z0-9]+$/.test(label);

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const safeJson = (body) => {
  if (!body) return {};
  return typeof body === 'string' ? JSON.parse(body) : body;
};

const getCustomData = (data = {}) => (
  data.custom_data
  || data.customData
  || data.subscription?.custom_data
  || data.transaction?.custom_data
  || {}
);

const getHeader = (headers = {}, names = []) => {
  const entries = Object.entries(headers || {});
  for (const name of names) {
    const direct = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
    if (direct) return Array.isArray(direct) ? direct[0] : direct;
    const found = entries.find(([key]) => key.toLowerCase() === name.toLowerCase());
    if (found?.[1]) return Array.isArray(found[1]) ? found[1][0] : found[1];
  }
  return '';
};

const getRequesterUserId = (req) => firstValue(
  process.env.APPWRITE_FUNCTION_USER_ID,
  getHeader(req.headers, ['x-appwrite-user-id', 'x-appwrite-userid', 'x-appwrite-user'])
);

const getUserIdFromCustomData = (customData = {}) => (
  customData.appwriteUserId
  || customData.appwrite_user_id
  || customData.userId
  || null
);

const getPriceId = (data = {}) => firstValue(
  data.items?.[0]?.price?.id,
  data.items?.[0]?.price_id,
  data.items?.[0]?.priceId,
  data.price?.id,
  data.price_id,
  data.priceId,
  data.transaction?.items?.[0]?.price?.id,
  data.subscription?.items?.[0]?.price?.id
);

const getSubscriptionId = (eventType, data = {}) => {
  if (eventType?.startsWith('subscription.')) return data.id || '';
  return firstValue(
    data.subscription_id,
    data.subscriptionId,
    data.subscription?.id,
    data.items?.[0]?.subscription_id
  ) || '';
};

const getCustomerId = (data = {}) => firstValue(
  data.customer_id,
  data.customerId,
  data.customer?.id,
  data.subscription?.customer_id,
  data.transaction?.customer_id
) || '';

const getCustomerEmail = (customData = {}, data = {}) => firstValue(
  customData.userEmail,
  customData.email,
  data.customer?.email,
  data.email,
  data.email_address,
  data.customer_email
) || '';

const getBillingPeriod = (data = {}) => ({
  startsAt: firstValue(
    data.current_billing_period?.starts_at,
    data.billing_period?.starts_at,
    data.subscription?.current_billing_period?.starts_at
  ) || '',
  endsAt: firstValue(
    data.current_billing_period?.ends_at,
    data.billing_period?.ends_at,
    data.subscription?.current_billing_period?.ends_at
  ) || '',
});

const getAmount = (data = {}) => String(firstValue(
  data.details?.totals?.total,
  data.items?.[0]?.price?.unit_price?.amount,
  data.transaction?.details?.totals?.total,
  '0'
));

const getInterval = (data = {}) => firstValue(
  data.items?.[0]?.price?.billing_cycle?.interval,
  data.subscription?.items?.[0]?.price?.billing_cycle?.interval,
  'month'
);

const getCurrency = (data = {}) => firstValue(
  data.currency_code,
  data.currency,
  data.details?.currency_code,
  'USD'
);

const getStatusForEvent = (eventType, data = {}) => {
  const payloadStatus = data.status || data.subscription?.status || '';

  if (eventType === 'subscription.canceled') return 'canceled';
  if (eventType === 'subscription.paused') return 'paused';
  if (eventType === 'subscription.past_due' || eventType === 'transaction.payment_failed') return 'past_due';
  if (eventType === 'subscription.trialing') return 'trialing';
  if (payloadStatus) return payloadStatus;
  return ACTIVE_STATUSES.includes(payloadStatus) ? payloadStatus : 'active';
};

const buildPriceMap = () => ({
  [process.env.PADDLE_PRO_PRICE_ID || '']: 'pro',
  [process.env.PADDLE_PLUS_PRICE_ID || '']: 'plus',
  [process.env.PADDLE_PROPLUS_PRICE_ID || '']: 'proplus',
});

const getPlanForPrice = (priceId) => {
  const map = buildPriceMap();
  return map[priceId] || '';
};

const findUserByEmail = async (users, email) => {
  if (!email) return null;

  try {
    const result = await users.list([
      Query.equal('email', email),
      Query.limit(1),
    ]);
    return result.users?.[0] || null;
  } catch {
    const result = await users.list([Query.limit(100)]);
    return result.users?.find((user) => user.email === email) || null;
  }
};

const updatePlanLabels = async (users, userId, plan, status, log) => {
  const user = await users.get(userId);
  const baseLabels = (user.labels || [])
    .filter((label) => !PLAN_LABELS.includes(label))
    .filter(isValidLabel);

  const shouldAddPaidLabels = ACTIVE_STATUSES.includes(status) && ['pro', 'plus', 'proplus'].includes(plan);
  const nextLabels = shouldAddPaidLabels ? [...baseLabels, 'premium', plan] : baseLabels;

  await users.updateLabels(userId, nextLabels);
  log(`[paddleWebhook] Synced labels for ${userId}: ${nextLabels.join(', ') || 'none'}`);
  return user;
};

const upsertSubscription = async ({ databases, databaseId, collectionId, userId, data }) => {
  const existing = await databases.listDocuments(databaseId, collectionId, [
    Query.equal('userId', userId),
    Query.limit(1),
  ]);

  if (existing.documents.length > 0) {
    return databases.updateDocument(databaseId, collectionId, existing.documents[0].$id, data);
  }

  return databases.createDocument(databaseId, collectionId, ID.unique(), {
    ...data,
    createdAt: new Date().toISOString(),
  });
};

const generatePromoCode = (id) => {
  const prefix = 'LW';
  const hash = String(id).slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${hash}${random}`;
};

const createPreRegistrationIfNeeded = async ({ databases, databaseId, collectionId, userId, email, name, status, paymentId }) => {
  const existing = await databases.listDocuments(databaseId, collectionId, [
    Query.equal('email', email),
    Query.limit(1),
  ]);

  if (existing.documents.length > 0) {
    const doc = existing.documents[0];
    const updates = {
      type: 'paid',
      userId: userId || doc.userId,
      name: name || doc.name || '',
      paddlePaymentId: paymentId || doc.paddlePaymentId || '',
    };

    if (doc.status !== 'converted') {
      updates.status = status || doc.status || 'active';
    }

    return databases.updateDocument(databaseId, collectionId, doc.$id, updates);
  }

  const plusUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  return databases.createDocument(databaseId, collectionId, ID.unique(), {
    userId,
    email,
    name,
    type: 'paid',
    promoCode: generatePromoCode(userId || email),
    promoCodeUses: 0,
    bonusMonthsEarned: 0,
    plusUntil,
    status,
    reviewId: null,
    paddlePaymentId: paymentId,
    createdAt: new Date().toISOString(),
  });
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const assertAdminRequester = async ({ req, users }) => {
  const requesterUserId = getRequesterUserId(req);
  if (!requesterUserId) {
    const authError = new Error('Admin user context was not provided by Appwrite.');
    authError.statusCode = 401;
    throw authError;
  }

  const requester = await users.get(requesterUserId);
  if (!(requester.labels || []).includes(ADMIN_LABEL)) {
    const authError = new Error('Only admin users can run this action.');
    authError.statusCode = 403;
    throw authError;
  }

  return requester;
};

const findUserForPreRegistration = async ({ users, preReg }) => {
  if (preReg.userId) {
    try {
      return await users.get(preReg.userId);
    } catch {
      // Continue to email lookup. Paid pre-regs without accounts may have a temporary userId.
    }
  }

  return findUserByEmail(users, preReg.email);
};

const grantPlusReward = async ({ users, databases, databaseId, subscriptionsCollectionId, user, months, log }) => {
  const now = new Date();
  const existing = await databases.listDocuments(databaseId, subscriptionsCollectionId, [
    Query.equal('userId', user.$id),
    Query.limit(1),
  ]);
  const currentSubscription = existing.documents[0] || null;
  const currentPlan = currentSubscription?.plan || '';
  const nextPlan = currentPlan === 'proplus' ? 'proplus' : 'plus';
  const currentEnd = currentSubscription?.currentPeriodEnd ? new Date(currentSubscription.currentPeriodEnd) : now;
  const extensionBase = currentEnd > now ? currentEnd : now;
  const plusUntil = addMonths(extensionBase, months);
  const existingLabels = (user.labels || []).filter(isValidLabel);
  const cleanLabels = existingLabels.filter((label) => !PLAN_LABELS.includes(label));
  const nextLabels = Array.from(new Set([...cleanLabels, 'premium', nextPlan]));

  await users.updateLabels(user.$id, nextLabels);
  log(`[paddleWebhook] Reward labels for ${user.$id}: ${nextLabels.join(', ')}`);

  const subscriptionData = {
    userId: user.$id,
    paddleSubscriptionId: currentSubscription?.paddleSubscriptionId || 'manual-pre-reg-reward',
    paddleCustomerId: currentSubscription?.paddleCustomerId || '',
    plan: nextPlan,
    status: 'active',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: plusUntil.toISOString(),
    canceledAt: '',
    priceId: process.env.PADDLE_PLUS_YEARLY_PRICE_ID || process.env.PADDLE_PLUS_PRICE_ID || 'manual-pre-reg-reward',
    currency: currentSubscription?.currency || 'USD',
    amount: currentSubscription?.amount || '0',
    interval: 'year',
    updatedAt: now.toISOString(),
  };

  if (currentSubscription) {
    await databases.updateDocument(databaseId, subscriptionsCollectionId, currentSubscription.$id, subscriptionData);
  } else {
    await databases.createDocument(databaseId, subscriptionsCollectionId, ID.unique(), {
      ...subscriptionData,
      createdAt: now.toISOString(),
    });
  }

  return plusUntil;
};

const markTestingUserAddedToPreReg = async ({ databases, databaseId, testingUsageCollectionId, userId, log }) => {
  if (!testingUsageCollectionId || !userId) return;

  try {
    const existing = await databases.listDocuments(databaseId, testingUsageCollectionId, [
      Query.equal('userId', userId),
      Query.limit(1),
    ]);

    const doc = existing.documents[0];
    if (!doc || doc.addedToPreReg) return;

    await databases.updateDocument(databaseId, testingUsageCollectionId, doc.$id, {
      addedToPreReg: true,
    });
    log(`[paddleWebhook] Closed testing mode for paid pre-reg user ${userId}`);
  } catch (err) {
    log(`[paddleWebhook] Could not update testing usage for ${userId}: ${err.message}`);
  }
};


const grantPreRegistrationRecords = async ({ records, users, databases, databaseId, preRegistrationsCollectionId, subscriptionsCollectionId, log }) => {
  const baseMonths = Number(process.env.PRE_REG_REWARD_BASE_MONTHS || 12);
  const results = {
    ok: true,
    total: records.length,
    success: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  for (const preReg of records) {
    const bonusMonths = Number(preReg.bonusMonthsEarned || 0);
    const totalMonths = baseMonths + bonusMonths;

    try {
      const user = await findUserForPreRegistration({ users, preReg });
      if (!user) {
        results.skipped += 1;
        results.details.push({
          email: preReg.email,
          userId: preReg.userId || '',
          status: 'skipped',
          reason: 'No matching Appwrite account found yet.',
        });
        continue;
      }

      const plusUntil = await grantPlusReward({
        users,
        databases,
        databaseId,
        subscriptionsCollectionId,
        user,
        months: totalMonths,
        log,
      });

      await databases.updateDocument(databaseId, preRegistrationsCollectionId, preReg.$id, {
        userId: user.$id,
        status: 'converted',
        plusUntil: plusUntil.toISOString(),
      });

      results.success += 1;
      results.details.push({
        email: preReg.email,
        userId: user.$id,
        status: 'converted',
        totalMonths,
        plusUntil: plusUntil.toISOString(),
      });
    } catch (err) {
      results.failed += 1;
      results.details.push({
        email: preReg.email,
        userId: preReg.userId || '',
        status: 'failed',
        error: err.message,
      });
    }
  }

  results.ok = results.failed === 0;
  return results;
};

const completePreRegistrations = async ({ req, users, databases, databaseId, preRegistrationsCollectionId, subscriptionsCollectionId, log }) => {
  await assertAdminRequester({ req, users });

  const records = [];
  let cursor = null;

  while (true) {
    const queries = [
      Query.equal('status', 'active'),
      Query.limit(100),
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await databases.listDocuments(databaseId, preRegistrationsCollectionId, queries);
    records.push(...page.documents);

    if (page.documents.length < 100) break;
    cursor = page.documents[page.documents.length - 1].$id;
  }

  return grantPreRegistrationRecords({
    records,
    users,
    databases,
    databaseId,
    preRegistrationsCollectionId,
    subscriptionsCollectionId,
    log,
  });
};

const grantSinglePreRegistration = async ({ req, payload, users, databases, databaseId, preRegistrationsCollectionId, subscriptionsCollectionId, log }) => {
  await assertAdminRequester({ req, users });

  const preRegistrationId = payload.preRegistrationId || payload.preRegId || '';
  if (!preRegistrationId) {
    return {
      ok: false,
      total: 0,
      success: 0,
      failed: 1,
      skipped: 0,
      details: [{ status: 'failed', error: 'preRegistrationId is required.' }],
    };
  }

  const preReg = await databases.getDocument(databaseId, preRegistrationsCollectionId, preRegistrationId);
  if (preReg.status !== 'active') {
    return {
      ok: false,
      total: 1,
      success: 0,
      failed: 0,
      skipped: 1,
      details: [{
        email: preReg.email,
        userId: preReg.userId || '',
        status: 'skipped',
        reason: `Pre-registration status is ${preReg.status || 'unknown'}, not active.`,
      }],
    };
  }

  return grantPreRegistrationRecords({
    records: [preReg],
    users,
    databases,
    databaseId,
    preRegistrationsCollectionId,
    subscriptionsCollectionId,
    log,
  });
};

export default async ({ req, res, log, error }) => {
  if (req.method !== 'POST') {
    return res.json({ success: false, message: 'Method not allowed' }, 405);
  }

  try {
    const payload = safeJson(req.body);
    const eventType = payload.event_type || payload.eventType || '';
    const action = payload.action || '';
    const data = payload.data || {};
    const customData = getCustomData(data);
    const appwriteUserId = getUserIdFromCustomData(customData);
    const priceId = getPriceId(data) || '';
    const plan = getPlanForPrice(priceId);

    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const subscriptionsCollectionId = process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || 'subscriptions';
    const preRegistrationsCollectionId = process.env.APPWRITE_PRE_REGISTRATIONS_COLLECTION_ID || 'pre_registrations';
    const testingUsageCollectionId = process.env.APPWRITE_TESTING_USAGE_COLLECTION_ID || 'testing_usage';
    const preRegPriceId = process.env.PADDLE_PRE_REG_PRICE_ID || '';
    const isPreRegPayment = Boolean(preRegPriceId && priceId === preRegPriceId);

    log(`[paddleWebhook] Event: ${eventType || 'unknown'}`);
    log(`[paddleWebhook] Price: ${priceId || 'none'} Plan: ${plan || 'none'} User: ${appwriteUserId || 'none'}`);

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);

    if (action === 'complete_pre_registrations') {
      if (!databaseId) {
        return res.json({ success: false, error: 'APPWRITE_DATABASE_ID is not configured.' }, 500);
      }

      const result = await completePreRegistrations({
        req,
        users,
        databases,
        databaseId,
        preRegistrationsCollectionId,
        subscriptionsCollectionId,
        log,
      });

      return res.json(result);
    }

    if (action === 'grant_single_pre_registration') {
      if (!databaseId) {
        return res.json({ success: false, error: 'APPWRITE_DATABASE_ID is not configured.' }, 500);
      }

      const result = await grantSinglePreRegistration({
        req,
        payload,
        users,
        databases,
        databaseId,
        preRegistrationsCollectionId,
        subscriptionsCollectionId,
        log,
      });

      return res.json(result);
    }

    if (isPreRegPayment) {
      const email = getCustomerEmail(customData, data);
      const name = customData.userName || customData.name || '';
      const paymentId = data.id || data.transaction?.id || '';

      if (!email) {
        error('[paddleWebhook] Pre-registration payment had no email');
        return res.json({ success: false, message: 'No email for pre-registration' });
      }

      const existingUser = appwriteUserId ? await users.get(appwriteUserId) : await findUserByEmail(users, email);
      const targetUserId = existingUser?.$id || appwriteUserId || `${email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}${Date.now().toString(36)}`;
      const preRegStatus = existingUser ? 'active' : 'pending';
      const plusUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      if (existingUser) {
        await updatePlanLabels(users, existingUser.$id, 'plus', 'active', log);
        await markTestingUserAddedToPreReg({
          databases,
          databaseId,
          testingUsageCollectionId,
          userId: existingUser.$id,
          log,
        });
      }

      if (databaseId) {
        await createPreRegistrationIfNeeded({
          databases,
          databaseId,
          collectionId: preRegistrationsCollectionId,
          userId: targetUserId,
          email,
          name: name || existingUser?.name || '',
          status: preRegStatus,
          paymentId,
        });

        if (existingUser) {
          await upsertSubscription({
            databases,
            databaseId,
            collectionId: subscriptionsCollectionId,
            userId: existingUser.$id,
            data: {
              userId: existingUser.$id,
              paddleSubscriptionId: getSubscriptionId(eventType, data),
              paddleCustomerId: getCustomerId(data),
              plan: 'plus',
              status: 'active',
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: plusUntil,
              canceledAt: '',
              priceId,
              currency: getCurrency(data),
              amount: getAmount(data),
              interval: 'year',
              updatedAt: new Date().toISOString(),
            },
          });
        }
      }

      return res.json({ success: true, message: `Pre-registration recorded for ${email}` });
    }

    if (!appwriteUserId) {
      error(`[paddleWebhook] No appwriteUserId found for ${eventType}`);
      return res.json({ success: false, message: 'No appwriteUserId in custom_data' });
    }

    const subscriptionEvents = [
      'subscription.created',
      'subscription.activated',
      'subscription.updated',
      'subscription.trialing',
      'subscription.resumed',
      'subscription.paused',
      'subscription.canceled',
      'subscription.past_due',
      'transaction.completed',
      'transaction.payment_failed',
    ];

    if (!subscriptionEvents.includes(eventType)) {
      log(`[paddleWebhook] Unhandled event acknowledged: ${eventType}`);
      return res.json({ success: true, message: `Event ${eventType} acknowledged` });
    }

    if (eventType === 'transaction.completed' && !plan) {
      log('[paddleWebhook] Transaction completed without known subscription price; acknowledged only');
      return res.json({ success: true, message: 'Non-subscription transaction acknowledged' });
    }

    const status = getStatusForEvent(eventType, data);
    const resolvedPlan = plan || customData.plan || data.plan || 'pro';
    const billingPeriod = getBillingPeriod(data);

    await updatePlanLabels(users, appwriteUserId, resolvedPlan, status, log);

    if (databaseId) {
      await upsertSubscription({
        databases,
        databaseId,
        collectionId: subscriptionsCollectionId,
        userId: appwriteUserId,
        data: {
          userId: appwriteUserId,
          paddleSubscriptionId: getSubscriptionId(eventType, data),
          paddleCustomerId: getCustomerId(data),
          plan: resolvedPlan,
          status,
          currentPeriodStart: billingPeriod.startsAt || new Date().toISOString(),
          currentPeriodEnd: billingPeriod.endsAt || '',
          canceledAt: status === 'canceled' ? new Date().toISOString() : '',
          priceId,
          currency: getCurrency(data),
          amount: getAmount(data),
          interval: getInterval(data),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return res.json({ success: true, message: `Subscription ${status} for ${appwriteUserId}` });
  } catch (err) {
    error(`[paddleWebhook] FATAL: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
