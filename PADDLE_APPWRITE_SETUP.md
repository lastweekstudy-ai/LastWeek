# Paddle + Appwrite Payment Setup Guide

Complete step-by-step guide to connect Paddle Billing (sandbox) with Appwrite for subscription payments in LastWeek.

---

## Overview

```
User clicks "Upgrade to Pro"
  → Paddle Checkout overlay opens
  → User pays (sandbox = test cards)
  → Paddle sends webhook to our Appwrite Function
  → Function adds 'premium' label to the user's Appwrite account
  → App checks user.labels.includes('premium') to unlock features
```

---

## Step 1: Paddle Dashboard Setup

### 1.1 Create a Paddle Sandbox Account

1. Go to: https://sandbox-vendors.paddle.com/signup
2. Create an account (use your real email)
3. Complete the onboarding wizard (you can skip business verification for sandbox)

### 1.2 Create a Product

1. In Paddle Dashboard → **Catalog** → **Products**
2. Click **+ New Product**
3. Fill in:
   - Name: `LastWeek Pro`
   - Description: `Unlimited AI tutoring, flashcards, and exam coaching`
   - Tax category: `Standard digital goods`
4. Click **Save**

### 1.3 Create a Price

1. On the product page, click **+ New Price**
2. Fill in:
   - Amount: `9.99`
   - Currency: `USD`
   - Billing period: `Monthly`
   - (Optional) Create additional prices for quarterly ($26.99) and annual ($89.99)
3. Click **Save**
4. **Copy the Price ID** — it looks like `pri_01abc123def456` — you'll need this

### 1.4 Get Your Client-Side Token

1. Go to **Developer Tools** → **Authentication** (or **Paddle.js**)
2. Find your **Client-side token** — it looks like `test_abc123def456...`
3. **Copy this token** — you'll need it for the frontend

### 1.5 Set Up Webhook Notification

1. Go to **Developer Tools** → **Notifications**
2. Click **+ New Destination**
3. Fill in:
   - URL: `https://YOUR_APPWRITE_FUNCTION_DOMAIN/` (you'll get this in Step 2)
   - Events to subscribe:
     - ✅ `subscription.created`
     - ✅ `subscription.activated`
     - ✅ `subscription.canceled`
     - ✅ `subscription.past_due`
     - ✅ `transaction.completed`
4. Click **Save**
5. **Copy the Webhook Secret** (shown after saving) — you'll need this for the backend

---

## Step 2: Appwrite Function Setup

### 2.1 Create the Function

1. Go to your **Appwrite Console** → **Functions**
2. Click **+ Create Function**
3. Settings:
   - Name: `paddleWebhook`
   - Runtime: `Node.js 18.0` (or latest available)
   - Entrypoint: `index.js`
   - Build command: `npm install`
4. Click **Create**

### 2.2 Set Environment Variables

In the function's **Settings** → **Variables**, add:

| Variable | Value | Description |
|---|---|---|
| `APPWRITE_API_KEY` | Your server API key | Must have `users.read` and `users.write` permissions |
| `PADDLE_WEBHOOK_SECRET` | From Paddle Step 1.5 | Used to verify webhook signatures |

> **Note:** `APPWRITE_FUNCTION_API_ENDPOINT` and `APPWRITE_FUNCTION_PROJECT_ID` are automatically provided by the Appwrite runtime — you don't need to set them manually.

### 2.3 Deploy the Code

**Option A — Manual upload:**
1. Navigate to `appwrite-functions/paddleWebhook/`
2. Run `npm install` locally
3. Zip the folder contents (index.js + package.json + node_modules)
4. Upload the zip in Appwrite Console → Function → **Deployments** → **+ Create Deployment**

**Option B — Git deployment:**
1. Connect your Git repo in Appwrite Console → Function → **Settings** → **Git**
2. Set root directory: `appwrite-functions/paddleWebhook`
3. Appwrite will auto-deploy on push

### 2.4 Enable HTTP Access

1. In the function's **Settings** → **Domain**
2. Click **Generate Domain** to get a public URL
3. **Copy the domain URL** — it looks like: `https://6abc123.appwrite.global`
4. Go back to Paddle Dashboard → Notifications → Edit your webhook destination
5. Paste this URL as the webhook endpoint

### 2.5 Set Execute Permission

1. In the function's **Settings** → **Permissions**
2. Add: `Any` (since Paddle needs to call it without authentication)
3. The function itself verifies the webhook signature for security

---

## Step 3: Frontend Configuration

### 3.1 Update `.env`

Open your `.env` file and replace the placeholder values:

```env
# Paddle Billing
VITE_PADDLE_CLIENT_TOKEN=test_YOUR_CLIENT_TOKEN_FROM_STEP_1_4
VITE_PADDLE_PRICE_ID=pri_YOUR_PRICE_ID_FROM_STEP_1_3
VITE_PADDLE_ENVIRONMENT=sandbox
```

### 3.2 Use the UpgradeButton Component

The component is already created at `src/components/UpgradeButton.jsx`. Use it anywhere:

```jsx
import UpgradeButton from '../components/UpgradeButton';

// In any page or component:
<UpgradeButton />

// With custom label:
<UpgradeButton label="Go Pro — $9.99/month" />

// With success callback:
<UpgradeButton onSuccess={(data) => {
  console.log('Payment successful!', data);
  // Refresh user data to pick up the new 'premium' label
  window.location.reload();
}} />
```

### 3.3 Check Premium Status Anywhere

The user's premium status is available via the `useAuth` hook:

```jsx
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();
  const isPremium = user?.labels?.includes('premium');

  if (isPremium) {
    // Show premium features
  } else {
    // Show upgrade prompt
  }
};
```

---

## Step 4: Testing the Full Flow

### 4.1 Test Card Numbers (Sandbox)

Paddle sandbox accepts these test cards:

| Card Number | Result |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 3220` | 3D Secure required |

Use any future expiry date and any 3-digit CVC.

### 4.2 Test the Flow

1. Start your dev server: `npm run dev`
2. Log in to the app
3. Click the "Upgrade to Pro" button
4. Paddle checkout overlay appears
5. Enter test card: `4242 4242 4242 4242`, any expiry, any CVC
6. Complete payment
7. Paddle sends webhook to your Appwrite function
8. Function adds `premium` label to your user
9. Refresh the page — the UpgradeButton should now show "⭐ Pro" badge

### 4.3 Verify in Appwrite Console

1. Go to **Appwrite Console** → **Auth** → **Users**
2. Find your user
3. Check the **Labels** field — it should now include `premium`

### 4.4 Check Function Logs

1. Go to **Appwrite Console** → **Functions** → `paddleWebhook` → **Executions**
2. You should see a successful execution with logs like:
   ```
   [paddleWebhook] Received event: subscription.created
   [paddleWebhook] ✅ User 6abc123 upgraded to premium. Labels: premium
   ```

---

## Step 5: Going to Production

When ready to accept real payments:

### 5.1 Switch Paddle to Live Mode

1. Complete Paddle's business verification process
2. Get your **live** client-side token from Paddle Dashboard (Production)
3. Create the same product and prices in production

### 5.2 Update Environment Variables

```env
VITE_PADDLE_CLIENT_TOKEN=live_YOUR_LIVE_CLIENT_TOKEN
VITE_PADDLE_PRICE_ID=pri_YOUR_LIVE_PRICE_ID
VITE_PADDLE_ENVIRONMENT=production
```

### 5.3 Update Webhook URL

1. In Paddle **Production** Dashboard → Notifications
2. Add the same Appwrite Function URL as the webhook destination
3. Update the `PADDLE_WEBHOOK_SECRET` in the Appwrite Function with the production secret

### 5.4 Enable Signature Verification

The webhook function already includes signature verification. In production, always ensure `PADDLE_WEBHOOK_SECRET` is set so signatures are checked.

---

## File Structure

```
lastweek/
├── .env                                    ← Paddle tokens go here
├── src/
│   └── components/
│       └── UpgradeButton.jsx               ← Frontend checkout button
└── appwrite-functions/
    └── paddleWebhook/
        ├── index.js                        ← Webhook handler
        └── package.json                    ← Dependencies (node-appwrite)
```

---

## Environment Variables Summary

### Frontend (.env)

| Variable | Example | Where to get it |
|---|---|---|
| `VITE_PADDLE_CLIENT_TOKEN` | `test_abc123...` | Paddle Dashboard → Developer Tools → Authentication |
| `VITE_PADDLE_PRICE_ID` | `pri_01abc123...` | Paddle Dashboard → Catalog → Products → Price |
| `VITE_PADDLE_ENVIRONMENT` | `sandbox` or `production` | Set manually |

### Appwrite Function (set in Console → Function → Variables)

| Variable | Example | Where to get it |
|---|---|---|
| `APPWRITE_API_KEY` | `standard_abc123...` | Appwrite Console → Project → API Keys (needs users.read + users.write) |
| `PADDLE_WEBHOOK_SECRET` | `pdl_ntfset_...` | Paddle Dashboard → Notifications → Webhook secret |

---

## Troubleshooting

### "Payment system unavailable" on the button
- Check that `VITE_PADDLE_CLIENT_TOKEN` is set in `.env`
- Check browser console for `[Paddle] Initialization failed` errors
- Make sure you're using the **sandbox** token, not production

### Webhook not firing
- Check Paddle Dashboard → Notifications → Logs for delivery attempts
- Ensure the Appwrite Function has a public domain (Settings → Domain)
- Ensure the function's execute permission is set to `Any`

### User not getting premium label
- Check Appwrite Function → Executions for error logs
- Verify `APPWRITE_API_KEY` has `users.write` permission
- Check that `customData.appwriteUserId` is being passed in the checkout

### Webhook signature verification failing
- Ensure `PADDLE_WEBHOOK_SECRET` matches exactly what Paddle shows
- Check that `req.body` is the raw string (not already parsed)
- In sandbox, you can temporarily remove the secret to debug

---

## Quick Reference

| Action | Where |
|---|---|
| Get client token | Paddle → Developer Tools → Authentication |
| Get price ID | Paddle → Catalog → Products → [Your Product] → Prices |
| Get webhook secret | Paddle → Developer Tools → Notifications → [Your Destination] |
| Set function env vars | Appwrite Console → Functions → paddleWebhook → Settings → Variables |
| Get function URL | Appwrite Console → Functions → paddleWebhook → Settings → Domain |
| Check user labels | Appwrite Console → Auth → Users → [User] → Labels |
| View webhook logs | Appwrite Console → Functions → paddleWebhook → Executions |
