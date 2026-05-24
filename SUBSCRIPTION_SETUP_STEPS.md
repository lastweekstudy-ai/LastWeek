# Subscription System — Step-by-Step Setup

Follow these steps in order. Each step takes 1–3 minutes.

---

## Step 1: Create the `subscriptions` collection in Appwrite

1. Open **Appwrite Console** → https://cloud.appwrite.io
2. Go to your project → **Databases** → your database (`69f742a2001f393e4b85`)
3. Click **+ Create Collection**
4. Name: `subscriptions`
5. Collection ID: `subscriptions` (type it manually, don't use auto-generated)
6. Click **Create**

---

## Step 2: Add attributes to the `subscriptions` collection

Click on the new `subscriptions` collection → **Attributes** → add each one:

| # | Click "+ Create Attribute" | Type | Key | Size | Required | Default |
|---|---|---|---|---|---|---|
| 1 | String | string | `userId` | 100 | Yes | — |
| 2 | String | string | `paddleSubscriptionId` | 100 | No | — |
| 3 | String | string | `paddleCustomerId` | 100 | No | — |
| 4 | String | string | `plan` | 20 | No | `pro` |
| 5 | String | string | `status` | 20 | Yes | — |
| 6 | String | string | `currentPeriodStart` | 50 | No | — |
| 7 | String | string | `currentPeriodEnd` | 50 | No | — |
| 8 | String | string | `canceledAt` | 50 | No | — |
| 9 | String | string | `priceId` | 100 | No | — |
| 10 | String | string | `currency` | 10 | No | — |
| 11 | String | string | `amount` | 20 | No | — |
| 12 | String | string | `interval` | 20 | No | — |
| 13 | String | string | `createdAt` | 50 | No | — |
| 14 | String | string | `updatedAt` | 50 | No | — |

**Wait for each attribute to finish creating before adding the next one.**

---

## Step 3: Add index to the `subscriptions` collection

1. Still in the `subscriptions` collection → click **Indexes**
2. Click **+ Create Index**
3. Fill in:
   - Index Key: `userId_index`
   - Type: **Key**
   - Attributes: select `userId`
   - Order: ASC
4. Click **Create**

---

## Step 4: Set collection permissions

1. Still in `subscriptions` → click **Settings** (gear icon)
2. Under **Permissions**, add:
   - Role: **Any** → check **Read** ✅ and **Create** ✅ and **Update** ✅
   - (Or more restrictive: Role **Users** with Read + Create + Update)
3. Click **Update**

> This allows the webhook function (which uses an API key) and the frontend (which reads subscription status) to both access the collection.

---

## Step 5: Update the webhook function environment variables

1. Go to **Functions** → click your `paddleWebhook` function
2. Go to **Settings** → **Variables**
3. Add this new variable (if not already there):

| Variable | Value |
|---|---|
| `APPWRITE_DATABASE_ID` | `69f742a2001f393e4b85` |

Your function should now have these variables:
- `APPWRITE_API_KEY` — your server API key
- `PADDLE_WEBHOOK_SECRET` — from Paddle notifications (if you have it)
- `APPWRITE_DATABASE_ID` — `69f742a2001f393e4b85`

---

## Step 6: Re-deploy the webhook function

The webhook code was updated to save subscription data to the database. You need to re-deploy it.

1. Go to **Functions** → `paddleWebhook` → **Deployments**
2. Click **+ Create Deployment** → **Manual**
3. Upload the file: `appwrite-functions/paddleWebhook/paddleWebhook.tar.gz`
4. Entrypoint: `index.js`
5. Build command: *(leave empty)*
6. Click **Create**
7. Wait for deployment to show **Active** ✅

---

## Step 7: Test the full flow

1. Run your app: `npm run dev`
2. **Sign up with a new account** (to test the new signup form)
   - Enter name, email, password, confirm password
   - Enter date of birth (must be 13+)
   - Check all 3 agreement boxes
   - Click "Create Account"
3. On the dashboard, click **"Upgrade to Pro"**
4. In the Paddle checkout, use test card: `4242 4242 4242 4242`
5. Complete the payment

---

## Step 8: Verify everything worked

### Check 1 — User labels
1. Appwrite Console → **Auth** → **Users** → find your user
2. Look at **Labels** — should include `premium`

### Check 2 — Subscription document
1. Appwrite Console → **Databases** → your database → `subscriptions`
2. You should see a new document with:
   - `userId` = your user ID
   - `status` = `active`
   - `plan` = `pro`
   - `paddleSubscriptionId` = a Paddle ID
   - `currentPeriodStart` and `currentPeriodEnd` filled in

### Check 3 — User preferences (signup data)
1. Appwrite Console → **Auth** → **Users** → click your user
2. Look at **Preferences** — should include:
   - `dateOfBirth`
   - `agreedTermsAt`
   - `agreedPrivacyAt`
   - `agreedDataCollectionAt`
   - `signupCompletedAt`

### Check 4 — UI shows Pro badge
1. Refresh your app (or log out and back in)
2. The "Upgrade to Pro" button should now show **"⭐ Pro"** badge instead

### Check 5 — Webhook logs
1. Appwrite Console → **Functions** → `paddleWebhook` → **Executions**
2. Click the latest execution
3. Logs should show:
   ```
   [paddleWebhook] Received event: transaction.completed
   [paddleWebhook] ✅ User abc123 — premium label added
   [paddleWebhook] Created subscription doc for user abc123
   ```

---

## Step 9: Test cancellation (optional)

1. Go to Paddle Sandbox Dashboard → **Subscriptions**
2. Find the test subscription you just created
3. Click **Cancel**
4. Paddle will send a `subscription.canceled` webhook
5. Check:
   - User's `premium` label should be removed
   - Subscription document `status` should change to `canceled`
   - `canceledAt` should be filled in
   - UI should show "Upgrade to Pro" button again

---

## Summary — What was set up

| Component | What it does |
|---|---|
| **Signup form** | Collects name, DOB, email, password + 3 legal consents |
| **Age gate** | Blocks users under 13 (COPPA compliance) |
| **User preferences** | Stores DOB + consent timestamps on Appwrite user |
| **`subscriptions` collection** | Stores full subscription details (status, dates, plan, price) |
| **Webhook (updated)** | Saves subscription to DB + adds/removes premium label |
| **`subscription.js` helper** | Frontend utility to check subscription status |
| **UpgradeButton** | Shows "Upgrade to Pro" or "⭐ Pro" based on label |

---

## Files that were changed/created

| File | What changed |
|---|---|
| `src/pages/Auth.jsx` | New signup form with DOB, confirm password, 3 consent checkboxes |
| `src/appwrite/auth.js` | `registerUser` now accepts and saves profile data to prefs |
| `src/context/AuthContext.jsx` | `register` passes profileData through |
| `src/appwrite/subscription.js` | **NEW** — subscription CRUD + status helpers |
| `src/components/UpgradeButton.jsx` | Already existed — shows Pro badge if premium |
| `appwrite-functions/paddleWebhook/index.js` | Updated — now saves to `subscriptions` collection |
| `.env` | Added `VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=subscriptions` |

---

## Troubleshooting

### Signup says "You must be at least 13 years old"
- The date of birth you entered makes you under 13. Use a valid date.

### Webhook execution shows "Collection not found"
- You haven't created the `subscriptions` collection yet (Step 1–2)
- Or the collection ID doesn't match — make sure it's exactly `subscriptions`

### Webhook shows "Missing appwriteUserId"
- The checkout didn't pass the user ID. Check that `UpgradeButton.jsx` includes `customData: { appwriteUserId: user.$id }`

### User doesn't get premium label after payment
- Check webhook function has `APPWRITE_API_KEY` set
- Check the API key has `users.read` and `users.write` scopes
- Check webhook execution logs for errors

### UI still shows "Upgrade to Pro" after payment
- The user object is cached. Log out and log back in, or refresh the page.
- The `premium` label is read from `user.labels` which is fetched on login.
