# Paddle Payment Audit

Generated: 2026-06-20

## What Is Already In Place

- Frontend Paddle checkout exists through `src/components/UpgradeButton.jsx`.
- Pricing plans already use `VITE_PADDLE_PRO_PRICE_ID`, `VITE_PADDLE_PLUS_PRICE_ID`, and `VITE_PADDLE_PROPLUS_PRICE_ID`.
- Appwrite stores subscription records in the `subscriptions` collection.
- Appwrite labels are used as the runtime access gate: `premium`, `pro`, `plus`, and `proplus`.
- The Paddle webhook function lives in `appwrite-functions/paddleWebhook`.

## Safe Fixes Completed

- Fixed `UpgradeButton` so its default price ID uses `VITE_PADDLE_PRO_PRICE_ID` instead of the stale `VITE_PADDLE_PRO_PLAN_PRICE_ID`.
- Removed corrupted UI badge text from active plan labels.
- Updated subscription display labels for `pro`, `plus`, and `proplus`.
- Added a read-only Admin Billing page at `/admin/billing`.
- Added paginated subscription loading for Admin Billing using `Query.select()` to avoid pulling unnecessary fields.
- Rebuilt the Paddle webhook handler with clearer event parsing and safer label synchronization.
- Regenerated the Appwrite function bundle:
  - `appwrite-functions/paddleWebhook/paddleWebhook.tar.gz`

## Webhook Improvements

- Handles more subscription lifecycle events:
  - `subscription.created`
  - `subscription.activated`
  - `subscription.updated`
  - `subscription.trialing`
  - `subscription.resumed`
  - `subscription.paused`
  - `subscription.canceled`
  - `subscription.past_due`
  - `transaction.completed`
  - `transaction.payment_failed`
- Uses env-based collection IDs:
  - `APPWRITE_SUBSCRIPTIONS_COLLECTION_ID`
  - `APPWRITE_PRE_REGISTRATIONS_COLLECTION_ID`
- Stops leaving stale plan labels behind when a user is downgraded or paused.
- Avoids treating an unknown `transaction.completed` event as a subscription upgrade.
- Keeps pre-registration payment handling.

## Remaining Approval Items

- Add Paddle webhook signature verification before using live production webhooks. This needs the real webhook secret and should be tested with Paddle sandbox payloads.
- Add subscription indexes before enabling server-side filtering in Admin Billing:
  - `subscriptions.status`
  - `subscriptions.plan`
  - `subscriptions.paddleSubscriptionId`
  - `subscriptions.paddleCustomerId`
- Consider a dedicated webhook event log collection for auditability and replay/debugging.
- Move dangerous browser-admin writes such as bulk Plus grants behind server-side admin functions.

## Manual Deployment Checklist

1. Upload `appwrite-functions/paddleWebhook/paddleWebhook.tar.gz` to the Appwrite Paddle webhook function.
2. Confirm function env vars are set in Appwrite:
   - `APPWRITE_API_KEY`
   - `APPWRITE_DATABASE_ID`
   - `APPWRITE_SUBSCRIPTIONS_COLLECTION_ID`
   - `APPWRITE_PRE_REGISTRATIONS_COLLECTION_ID`
   - `PADDLE_PRE_REG_PRICE_ID`
   - `PADDLE_PRO_PRICE_ID`
   - `PADDLE_PLUS_PRICE_ID`
   - `PADDLE_PROPLUS_PRICE_ID`
3. Confirm frontend env vars are set in Vercel:
   - `VITE_PADDLE_CLIENT_TOKEN`
   - `VITE_PADDLE_ENVIRONMENT`
   - `VITE_PADDLE_PRE_REG_PRICE_ID`
   - `VITE_PADDLE_PRO_PRICE_ID`
   - `VITE_PADDLE_PLUS_PRICE_ID`
   - `VITE_PADDLE_PROPLUS_PRICE_ID`
4. Run one sandbox checkout per plan and verify:
   - user labels update correctly
   - `subscriptions` document updates correctly
   - Admin Billing displays the record
   - cancel/past-due test events remove paid access labels

## Verification

- `node --check appwrite-functions/paddleWebhook/index.js` passed.
- Scoped ESLint for changed frontend/admin payment files passed.
- `npm.cmd run build` passed.
