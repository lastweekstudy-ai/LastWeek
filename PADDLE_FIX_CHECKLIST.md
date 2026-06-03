# Paddle 403 Error - Quick Fix Checklist

## Problem Summary
**Error**: 403 Forbidden when opening Paddle Checkout in live mode  
**Root Cause**: Application is still in sandbox mode with placeholder credentials  
**Solution**: Update environment variables with live Paddle credentials

---

## ⚠️ What Paddle Support Got Wrong

**They said**: "You are attempting to open the Paddle checkout via an API call"  
**Reality**: Your frontend implementation is **100% CORRECT**. You're using the official Paddle.js SDK exactly as documented.

The issue is simply that you're using sandbox credentials in production. The 403 error is authentication failure, not architectural problem.

---

## Prerequisites: Get These from Paddle Dashboard

Before starting, you need to collect these values:

### 1. Live Client Token
- **Where**: Paddle Dashboard → Developer Tools → Authentication
- **Format**: Starts with `pdl_live_...`
- **Example**: `pdl_live_1234567890abcdefghijklmnop`

### 2. Live Price IDs (4 total)
- **Where**: Paddle Dashboard → Catalog → Prices
- **Format**: Starts with `pri_01...`
- **You already have one**: `pri_01ksjw6bd6b33atzenvvz8f2qw` (pre-reg)

| Plan | Environment Variable | Current Value | Live Value |
|------|---------------------|---------------|------------|
| Pre-Registration | `VITE_PADDLE_PRE_REG_PRICE_ID` | `your_pre_reg_price_id` | `pri_01ksjw6bd6b33atzenvvz8f2qw` |
| Pro | `VITE_PADDLE_PRO_PRICE_ID` | `your_pro_price_id` | `pri_01...` (find in dashboard) |
| Plus | `VITE_PADDLE_PLUS_PRICE_ID` | `your_plus_price_id` | `pri_01...` (find in dashboard) |
| Pro+ | `VITE_PADDLE_PROPLUS_PRICE_ID` | `your_proplus_price_id` | `pri_01...` (find in dashboard) |

---

## Step 1: Update Local `.env` File

Open `d:\LastWeek\LastWeek\.env` and update these lines:

### Find these lines:
```env
VITE_PADDLE_ENV=sandbox
VITE_PADDLE_ENVIRONMENT=sandbox
VITE_PADDLE_CLIENT_TOKEN=your_client_token

VITE_PADDLE_PRE_REG_PRICE_ID=your_pre_reg_price_id
VITE_PADDLE_PRO_PRICE_ID=your_pro_price_id
VITE_PADDLE_PLUS_PRICE_ID=your_plus_price_id
VITE_PADDLE_PROPLUS_PRICE_ID=your_proplus_price_id
```

### Replace with:
```env
VITE_PADDLE_ENV=production
VITE_PADDLE_ENVIRONMENT=production
VITE_PADDLE_CLIENT_TOKEN=pdl_live_YOUR_ACTUAL_TOKEN_HERE

VITE_PADDLE_PRE_REG_PRICE_ID=pri_01ksjw6bd6b33atzenvvz8f2qw
VITE_PADDLE_PRO_PRICE_ID=pri_01YOUR_PRO_PRICE_ID
VITE_PADDLE_PLUS_PRICE_ID=pri_01YOUR_PLUS_PRICE_ID
VITE_PADDLE_PROPLUS_PRICE_ID=pri_01YOUR_PROPLUS_PRICE_ID
```

**Status**: ☐ Complete

---

## Step 2: Update Vercel Environment Variables

### Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Select your project
3. Go to: Settings → Environment Variables

### Add/Update These Variables for Production

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_PADDLE_ENVIRONMENT` | `production` | Production |
| `VITE_PADDLE_CLIENT_TOKEN` | `pdl_live_...` | Production |
| `VITE_PADDLE_PRE_REG_PRICE_ID` | `pri_01ksjw6bd6b33atzenvvz8f2qw` | Production |
| `VITE_PADDLE_PRO_PRICE_ID` | `pri_01...` | Production |
| `VITE_PADDLE_PLUS_PRICE_ID` | `pri_01...` | Production |
| `VITE_PADDLE_PROPLUS_PRICE_ID` | `pri_01...` | Production |

### After updating:
- [ ] Click "Save"
- [ ] Trigger new deployment (or redeploy from Deployments tab)

**Status**: ☐ Complete

---

## Step 3: Update Appwrite Function Environment Variables

### Go to Appwrite Console
1. Open: https://cloud.appwrite.io/console
2. Go to: Functions → paddleWebhook → Settings → Environment Variables

### Add/Update These Variables

| Variable Name | Value |
|---------------|-------|
| `PADDLE_PRE_REG_PRICE_ID` | `pri_01ksjw6bd6b33atzenvvz8f2qw` |
| `PADDLE_PRO_PRICE_ID` | `pri_01...` |
| `PADDLE_PLUS_PRICE_ID` | `pri_01...` |
| `PADDLE_PROPLUS_PRICE_ID` | `pri_01...` |

**Note**: The webhook function uses these to map price IDs to plan names when a payment comes in.

**Status**: ☐ Complete

---

## Step 4: Configure Paddle Webhook (If Not Already Done)

### Check Current Configuration
1. Go to: Paddle Dashboard → Developer Tools → Notifications
2. Look for a notification destination pointing to your Appwrite function

### If Not Configured, Create New:
1. Click "Create notification destination"
2. **URL**: `https://sgp.cloud.appwrite.io/v1/functions/[YOUR_FUNCTION_ID]/executions`
   - Find function ID in Appwrite Console → Functions → paddleWebhook → Settings
3. **Events to subscribe** (select these):
   - ☐ `subscription.created`
   - ☐ `subscription.activated`
   - ☐ `transaction.completed`
   - ☐ `subscription.canceled`
   - ☐ `subscription.past_due`
4. **Environment**: Production
5. Click "Save"

**Status**: ☐ Complete

---

## Step 5: Test in Live Mode

### Local Testing (Optional)
```bash
# Build and preview locally
npm run build
npm run preview
```

- [ ] Open http://localhost:4173
- [ ] Go to /pricing
- [ ] Click "Upgrade to Pro"
- [ ] Verify checkout overlay opens (no 403 error)

### Production Testing (After Vercel Deploy)
- [ ] Go to https://www.lastweekai.study/pricing
- [ ] Click "Upgrade to Plus"
- [ ] Verify checkout overlay opens successfully
- [ ] **DO NOT complete payment yet** - just verify overlay opens

### Test Transaction (Small Amount)
- [ ] Use Paddle test mode if available
- [ ] Or make a real $5 pre-registration payment
- [ ] Verify payment goes through
- [ ] Check Appwrite function logs for webhook event
- [ ] Verify user label updated in Appwrite Console
- [ ] Verify subscription record created in database

**Status**: ☐ Complete

---

## Step 6: Verify Everything Works

### Frontend Checks
- [ ] Checkout overlay opens without 403 error
- [ ] Payment form displays correctly
- [ ] After payment, success message shows
- [ ] User badge updates to show plan (e.g., "✨ Plus")

### Backend Checks
- [ ] Go to Appwrite Console → Functions → paddleWebhook → Executions
- [ ] Verify webhook received event (status: completed)
- [ ] Check logs for successful processing

### Database Checks
- [ ] Go to Appwrite Console → Databases → subscriptions collection
- [ ] Verify new subscription record exists
- [ ] Verify user ID matches
- [ ] Verify plan name is correct (pro/plus/proplus)

### User Account Checks
- [ ] Go to Appwrite Console → Auth → Users
- [ ] Find the test user
- [ ] Verify labels include: "premium" and plan name (e.g., "plus")

**Status**: ☐ Complete

---

## Rollback Plan (If Something Goes Wrong)

### Rollback Vercel Deployment
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment (sandbox mode)
3. Click "..." → "Promote to Production"

### Rollback Appwrite Function Variables
1. Go to Appwrite Console → Functions → paddleWebhook → Settings
2. Remove live price IDs
3. Keep sandbox for testing

### Keep Local `.env` Updated
- Don't commit live credentials to git
- Keep sandbox version backed up

---

## Common Issues and Solutions

### Issue 1: Checkout Opens But Price Not Found
**Error**: "Price ID not found" or similar  
**Cause**: Wrong price ID or sandbox price ID used in production  
**Fix**: Double-check all price IDs are live (start with `pri_01...`)

### Issue 2: Payment Success But No Label Update
**Error**: User pays but still shows as free plan  
**Cause**: Webhook not configured or failing  
**Fix**: 
- Check Paddle Dashboard → Developer Tools → Notifications
- Verify webhook URL is correct
- Check Appwrite function logs for errors

### Issue 3: Wrong Plan Assigned
**Error**: User pays for Plus but gets Pro  
**Cause**: Price ID mapping incorrect in webhook  
**Fix**: Verify PADDLE_*_PRICE_ID variables in Appwrite function

### Issue 4: Still Getting 403 Error
**Error**: 403 after updating credentials  
**Cause**: Vercel deployment didn't pick up new variables  
**Fix**: 
- Verify environment variables saved in Vercel
- Trigger new deployment manually
- Check build logs to confirm variables loaded

---

## Security Checklist

- [ ] `.env` file is in `.gitignore` ✅ (already done)
- [ ] Live credentials NOT committed to git
- [ ] Only VITE_* variables in Vercel (client-side)
- [ ] Only non-VITE variables in Appwrite (server-side)
- [ ] Webhook signature verification (optional but recommended)

---

## After Going Live

### Monitor These
- [ ] Paddle Dashboard → Transactions (check for successful payments)
- [ ] Appwrite Console → Functions → paddleWebhook → Executions
- [ ] Appwrite Console → Databases → subscriptions (verify records)
- [ ] User reports (ask test users for feedback)

### Next Steps
- [ ] Add webhook signature verification (security improvement)
- [ ] Set up email notifications for new subscriptions
- [ ] Create customer support documentation
- [ ] Test refund process
- [ ] Document cancellation process

---

## Quick Reference: Where to Find Things

| Item | Location |
|------|----------|
| Live Client Token | Paddle Dashboard → Developer Tools → Authentication |
| Live Price IDs | Paddle Dashboard → Catalog → Prices |
| Webhook URL | `https://sgp.cloud.appwrite.io/v1/functions/[FUNCTION_ID]/executions` |
| Function ID | Appwrite Console → Functions → paddleWebhook → Settings |
| Vercel Env Vars | Vercel Dashboard → Project → Settings → Environment Variables |
| Appwrite Function Vars | Appwrite Console → Functions → paddleWebhook → Settings → Env Vars |
| Function Logs | Appwrite Console → Functions → paddleWebhook → Executions |
| Subscription Records | Appwrite Console → Databases → subscriptions collection |
| User Labels | Appwrite Console → Auth → Users → (select user) |

---

## Estimated Time

- **Getting credentials**: 10-15 minutes
- **Updating local .env**: 2 minutes
- **Updating Vercel vars**: 5 minutes
- **Updating Appwrite vars**: 5 minutes
- **Testing**: 10-15 minutes
- **Total**: ~30-45 minutes

---

## Questions? Need Help?

If you need help with any step:
1. Check Paddle Dashboard first (credentials)
2. Check Appwrite function logs (webhook errors)
3. Check browser console (frontend errors)
4. Reply with specific error message and I'll help debug

---

## Completion Status

- [ ] Step 1: Local .env updated
- [ ] Step 2: Vercel environment variables updated
- [ ] Step 3: Appwrite function variables updated
- [ ] Step 4: Paddle webhook configured
- [ ] Step 5: Local testing passed
- [ ] Step 6: Production testing passed
- [ ] All verification checks passed

**Date Started**: ___________  
**Date Completed**: ___________

---

*Fix checklist generated by Kiro AI - June 2, 2026*
