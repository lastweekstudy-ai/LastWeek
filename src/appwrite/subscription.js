import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SUBSCRIPTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || 'subscriptions';

/**
 * Get the user's active subscription (if any)
 */
export const getUserSubscription = async (userId) => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      SUBSCRIPTIONS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('createdAt'),
        Query.limit(1),
      ]
    );
    return result.documents[0] || null;
  } catch (err) {
    console.warn('[subscription] Could not load subscription:', err.message);
    return null;
  }
};

/**
 * Check if user has an active (non-expired) subscription
 */
export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    // Check if not expired
    if (subscription.currentPeriodEnd) {
      return new Date(subscription.currentPeriodEnd) > new Date();
    }
    return true;
  }
  return false;
};

/**
 * Create or update subscription record (called by webhook)
 */
export const upsertSubscription = async (userId, data) => {
  try {
    // Check if subscription already exists for this user
    const existing = await getUserSubscription(userId);

    const payload = {
      userId,
      paddleSubscriptionId: data.subscriptionId || '',
      paddleCustomerId: data.customerId || '',
      plan: data.plan || 'pro',
      status: data.status || 'active', // active | trialing | past_due | canceled | paused
      currentPeriodStart: data.currentPeriodStart || new Date().toISOString(),
      currentPeriodEnd: data.currentPeriodEnd || '',
      canceledAt: data.canceledAt || null,
      priceId: data.priceId || '',
      currency: data.currency || 'USD',
      amount: data.amount || 0,
      interval: data.interval || 'month', // month | quarter | year
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      return await databases.updateDocument(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        existing.$id,
        payload
      );
    } else {
      return await databases.createDocument(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        ID.unique(),
        { ...payload, createdAt: new Date().toISOString() }
      );
    }
  } catch (err) {
    console.error('[subscription] Failed to upsert subscription:', err.message);
    throw err;
  }
};

/**
 * Get subscription display info for UI
 */
export const getSubscriptionDisplayInfo = (subscription) => {
  if (!subscription) {
    return { plan: 'free', label: 'Free', color: '#6b7280', active: false, daysLeft: null };
  }

  const active = isSubscriptionActive(subscription);
  const daysLeft = subscription.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  if (subscription.status === 'canceled') {
    return {
      plan: subscription.plan,
      label: daysLeft > 0 ? `Pro (expires in ${daysLeft}d)` : 'Expired',
      color: daysLeft > 0 ? '#f59e0b' : '#ef4444',
      active: daysLeft > 0,
      daysLeft,
    };
  }

  if (subscription.status === 'past_due') {
    return { plan: subscription.plan, label: 'Payment Failed', color: '#ef4444', active: false, daysLeft };
  }

  if (subscription.status === 'paused') {
    return { plan: subscription.plan, label: 'Paused', color: '#6b7280', active: false, daysLeft };
  }

  if (active) {
    return {
      plan: subscription.plan,
      label: subscription.plan === 'max' ? '🚀 Max' : '⭐ Pro',
      color: 'var(--color-accent)',
      active: true,
      daysLeft,
    };
  }

  return { plan: 'free', label: 'Free', color: '#6b7280', active: false, daysLeft: null };
};
