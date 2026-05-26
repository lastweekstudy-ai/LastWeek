# Paddle Live Payment Setup Guide

Complete guide to set up Paddle for real payments: Pre-Registration, Pro, Plus, and Pro+ plans.

---

## Overview

| Plan | Price | Billing | Purpose |
|------|-------|---------|---------|
| Pre-Registration | $5.00 | One-time | Early supporters get 1 year Plus |
| Pro | $9.99/month | Monthly | Mid-tier subscription |
| Plus | $14.99/month | Monthly | Higher-tier subscription |
| Pro+ | $19.99/month | Monthly | Premium unlimited subscription |

---

## Step 1: Switch to Live Mode

### 1.1 Get Live API Credentials

1. Go to [Paddle Dashboard](https://vendors.paddle.com/authentication)
2. Switch to **Live** mode (toggle in top right)
3. Go to **Developer Tools → Authentication**
4. Copy:
   - **Client Token** (for frontend)
   - **API Key** (for backend/webhook)

### 1.2 Update Environment Variables

Update your `.env` file:

```env
# Paddle Live Mode
VITE_PADDLE_ENV=live
VITE_PADDLE_CLIENT_TOKEN=your_live_client_token_here
PADDLE_API_KEY=your_live_api_key_here

# Paddle Live Price IDs (create these in Step 2)
VITE_PADDLE_PRE_REG_PRICE_ID=pri_xxxxx
VITE_PADDLE_PRO_PRICE_ID=pri_xxxxx
VITE_PADDLE_PLUS_PRICE_ID=pri_xxxxx
VITE_PADDLE_PROPLUS_PRICE_ID=pri_xxxxx
```

---

## Step 2: Create Products and Prices

Go to **Catalog → Products** in Paddle Dashboard (Live mode).

### 2.1 Pre-Registration ($5 One-Time)

**Create Product:**
1. Click **New Product**
2. Name: `Pre-Registration`
3. Description: `Early supporter pre-registration - Get Plus free for 1 year`
4. Tax category: `Digital goods` or appropriate category

**Create Price:**
1. Click **Add Price**
2. Type: **Standard** (not subscription)
3. Amount: `5.00`
4. Currency: `USD`
5. Billing cycle: **One-time**
6. Copy the **Price ID** (starts with `pri_`)

### 2.2 Pro Plan ($9.99/month)

**Create Product:**
1. Click **New Product**
2. Name: `Pro Plan`
3. Description: `Mid-tier subscription with enhanced features`

**Create Price:**
1. Click **Add Price**
2. Type: **Standard**
3. Amount: `9.99`
4. Currency: `USD`
5. Billing cycle: **Monthly**
6. Copy the **Price ID**

### 2.3 Plus Plan ($14.99/month)

**Create Product:**
1. Click **New Product**
2. Name: `Plus Plan`
3. Description: `Higher-tier subscription with premium features`

**Create Price:**
1. Click **Add Price**
2. Type: **Standard**
3. Amount: `14.99`
4. Currency: `USD`
5. Billing cycle: **Monthly**
6. Copy the **Price ID**

### 2.4 Pro+ Plan ($19.99/month)

**Create Product:**
1. Click **New Product**
2. Name: `Pro+ Plan`
3. Description: `Premium unlimited subscription`

**Create Price:**
1. Click **Add Price**
2. Type: **Standard**
3. Amount: `19.99`
4. Currency: `USD`
5. Billing cycle: **Monthly**
6. Copy the **Price ID**

---

## Step 3: Set Up Webhook

### 3.1 Deploy Webhook Function

Your webhook function is already at:
```
appwrite-functions/paddleWebhook/index.js
```

Make sure it's deployed to Appwrite Functions.

### 3.2 Configure Webhook in Paddle

1. Go to **Developer Tools → Notifications**
2. Click **New Notification**
3. Select these events:
   - `subscription.created`
   - `subscription.activated`
   - `transaction.completed`
   - `subscription.canceled`
   - `subscription.past_due`
4. Enter your webhook URL:
   ```
   https://sgp.cloud.appwrite.io/v1/functions/YOUR_FUNCTION_ID/executions
   ```
   Or your custom domain if configured.

### 3.3 Add Webhook Secret (Optional but Recommended)

For production, verify webhook signatures:

```javascript
// In paddleWebhook/index.js
import crypto from 'crypto';

const verifyPaddleSignature = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return signature === expectedSignature;
};
```

---

## Step 4: Update Frontend Code

### 4.1 Update Price IDs in Code

Update `src/appwrite/admin.js` webhook handler with your new Live Price IDs:

```javascript
// Map Paddle price IDs to plan names
const PRICE_TO_PLAN = {
  'pri_YOUR_PRO_LIVE_ID': 'pro',
  'pri_YOUR_PLUS_LIVE_ID': 'plus',
  'pri_YOUR_PROPLUS_LIVE_ID': 'proplus',
};
```

### 4.2 Update Checkout Integration

Make sure your checkout uses the correct Price IDs:

```javascript
// Example checkout call
import { Paddle } from '@paddle/paddle-js';

Paddle.Checkout.open({
  items: [
    {
      priceId: import.meta.env.VITE_PADDLE_PRO_PRICE_ID,
      quantity: 1,
    },
  ],
  customData: {
    appwriteUserId: user.$id,
  },
});
```

---

## Step 5: Test Live Payments

### 5.1 Small Test Transaction

1. Use a real credit card for a small test
2. Verify webhook receives the event
3. Check user gets correct plan in Appwrite

### 5.2 Check Logs

Monitor your webhook logs in Appwrite Console:
- Go to **Functions → paddleWebhook → Logs**

### 5.3 Verify User Plan

After payment, check:
1. User labels updated (`plus`, `premium`, etc.)
2. Subscription document created in `subscriptions` collection
3. Pre-registration record created (for $5 payment)

---

## Step 6: Security Checklist

Before going live, ensure:

- [ ] **HTTPS everywhere** - All pages using Paddle must be HTTPS
- [ ] **Webhook signature verification** - Verify requests are from Paddle
- [ ] **Error handling** - Handle payment failures gracefully
- [ ] **Refund policy** - Have a clear refund policy in your Terms
- [ ] **Tax compliance** - Paddle handles taxes, but verify your obligations
- [ ] **Terms & Privacy** - Links to Terms and Privacy Policy in checkout

---

## Environment Variables Summary

```env
# ===========================================
# PADDLE LIVE CONFIGURATION
# ===========================================

# Environment: 'sandbox' or 'live'
VITE_PADDLE_ENV=live

# Live Client Token (from Developer Tools → Authentication)
VITE_PADDLE_CLIENT_TOKEN=live_client_token_here

# Live API Key (from Developer Tools → Authentication)
PADDLE_API_KEY=live_api_key_here

# Pre-Registration Price ID ($5 one-time)
VITE_PADDLE_PRE_REG_PRICE_ID=pri_xxxxxxxxxx

# Pro Plan Price ID ($9.99/month)
VITE_PADDLE_PRO_PRICE_ID=pri_xxxxxxxxxx

# Plus Plan Price ID ($14.99/month)
VITE_PADDLE_PLUS_PRICE_ID=pri_xxxxxxxxxx

# Pro+ Plan Price ID ($19.99/month)
VITE_PADDLE_PROPLUS_PRICE_ID=pri_xxxxxxxxxx
```

---

## Webhook Events Reference

| Event | When it fires | What we do |
|-------|---------------|------------|
| `subscription.created` | New subscription starts | Grant user plan |
| `subscription.activated` | Trial converts to paid | Update user plan |
| `transaction.completed` | One-time payment done | Handle pre-reg, grant access |
| `subscription.canceled` | User cancels | Remove premium label |
| `subscription.past_due` | Payment fails | Remove premium label |

---

## Troubleshooting

### Payment not showing in Appwrite

1. Check webhook logs in Paddle Dashboard → Notifications
2. Check function logs in Appwrite Console
3. Verify Price IDs match between Paddle and your code
4. Ensure `appwriteUserId` is passed in `customData`

### User not getting correct plan

1. Check user labels in Appwrite Auth
2. Check `subscriptions` collection for the record
3. Verify webhook handler maps Price ID to correct plan

### Test payments in Live mode

You cannot use test cards in Live mode. For testing:
1. Use a real card with small amount
2. Process a refund through Paddle Dashboard if needed
3. Or keep Sandbox mode active for testing

---

## Pricing Comparison Table

| Feature | Free | Pro ($9.99) | Plus ($14.99) | Pro+ ($19.99) |
|---------|------|-------------|---------------|---------------|
| Sessions/month | 5 | 30 | 100 | Unlimited |
| Messages/month | 500 | 3,000 | 7,000 | Unlimited |
| PDFs/month | 3 | 20 | 60 | Unlimited |
| Audios/month | 1 | 10 | 30 | Unlimited |
| Flashcards | 30 | Unlimited | Unlimited | Unlimited |
| MCQs | 20 | Unlimited | Unlimited | Unlimited |
| Exam Plans | 1 | 3 | 10 | Unlimited |
| Storage | 50MB | 500MB | 2GB | 10GB |
| Language Learning | ❌ | ✅ | ✅ | ✅ |
| Library Import | ✅ | ✅ | ✅ | ✅ |

---

## Support

- [Paddle Documentation](https://developer.paddle.com/)
- [Paddle Support](https://paddle.com/support/)
- [Appwrite Functions](https://appwrite.io/docs/functions)

---

**Created:** May 2026  
**Last Updated:** May 2026
