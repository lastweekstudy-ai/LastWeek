# Paddle Payment Architecture - LastWeek AI

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                 │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  React Application (lastweekai.study)                       │   │
│  │                                                              │   │
│  │  Components:                                                 │   │
│  │  • UpgradeButton.jsx                                        │   │
│  │  • PreRegistration.jsx                                      │   │
│  │  • Pricing.jsx                                              │   │
│  │                                                              │   │
│  │  Environment Variables (VITE_*):                            │   │
│  │  • VITE_PADDLE_ENVIRONMENT=production ⚠️ FIX               │   │
│  │  • VITE_PADDLE_CLIENT_TOKEN=pdl_live_... ⚠️ FIX            │   │
│  │  • VITE_PADDLE_PRE_REG_PRICE_ID=pri_01... ⚠️ FIX          │   │
│  │  • VITE_PADDLE_PRO_PRICE_ID=pri_01... ⚠️ FIX              │   │
│  │  • VITE_PADDLE_PLUS_PRICE_ID=pri_01... ⚠️ FIX             │   │
│  │  • VITE_PADDLE_PROPLUS_PRICE_ID=pri_01... ⚠️ FIX          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ 1. User clicks "Upgrade"
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    PADDLE.JS SDK (Frontend)                          │
│                                                                      │
│  initializePaddle({                                                 │
│    environment: 'production',                                       │
│    token: 'pdl_live_...',                                          │
│    eventCallback: (event) => { ... }                               │
│  })                                                                 │
│                                                                      │
│  paddle.Checkout.open({                                            │
│    items: [{ priceId: 'pri_01...', quantity: 1 }],               │
│    customer: { email: user.email },                               │
│    customData: { appwriteUserId: user.$id }                       │
│  })                                                                 │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ 2. Opens checkout overlay
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    PADDLE CHECKOUT SERVICE                           │
│                    (buy.paddle.com)                                  │
│                                                                      │
│  • Validates client token                                           │
│  • Validates price IDs                                              │
│  • Displays payment form                                            │
│  • Processes payment                                                │
│  • Returns success/failure                                          │
│                                                                      │
│  ⚠️ CURRENTLY RETURNS 403 FORBIDDEN                                │
│  ⚠️ REASON: Invalid credentials (sandbox mode)                     │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ 3. Payment completed
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    PADDLE WEBHOOK SERVICE                            │
│                                                                      │
│  Sends POST request to:                                             │
│  https://sgp.cloud.appwrite.io/v1/functions/[ID]/executions       │
│                                                                      │
│  Payload:                                                           │
│  {                                                                  │
│    event_type: "subscription.created",                             │
│    data: {                                                         │
│      id: "sub_01...",                                             │
│      customer_id: "ctm_01...",                                    │
│      items: [{ price: { id: "pri_01..." } }],                    │
│      custom_data: { appwriteUserId: "..." }                       │
│    }                                                               │
│  }                                                                 │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ 4. Webhook delivery
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│              APPWRITE FUNCTION: paddleWebhook                        │
│              (appwrite-functions/paddleWebhook/index.js)            │
│                                                                      │
│  1. Receives webhook POST request                                   │
│  2. Parses event_type and data                                      │
│  3. Extracts appwriteUserId from custom_data                        │
│  4. Maps priceId to plan name (pro/plus/proplus)                    │
│  5. Updates Appwrite user labels                                    │
│  6. Creates/updates subscription record in database                 │
│                                                                      │
│  Environment Variables:                                             │
│  • APPWRITE_API_KEY                                                 │
│  • APPWRITE_DATABASE_ID                                             │
│  • PADDLE_PRE_REG_PRICE_ID ⚠️ FIX                                  │
│  • PADDLE_PRO_PRICE_ID ⚠️ FIX                                      │
│  • PADDLE_PLUS_PRICE_ID ⚠️ FIX                                     │
│  • PADDLE_PROPLUS_PRICE_ID ⚠️ FIX                                  │
│                                                                      │
│  Supported Events:                                                  │
│  • subscription.created                                             │
│  • subscription.activated                                           │
│  • transaction.completed                                            │
│  • subscription.canceled                                            │
│  • subscription.past_due                                            │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ 5. Update user permissions
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    APPWRITE DATABASE                                 │
│                    (sgp.cloud.appwrite.io)                          │
│                                                                      │
│  Users Collection:                                                  │
│  • Add label: "premium", "pro", "plus", or "proplus"              │
│                                                                      │
│  Subscriptions Collection:                                          │
│  • userId                                                           │
│  • paddleSubscriptionId                                             │
│  • paddleCustomerId                                                 │
│  • plan (pro/plus/proplus)                                         │
│  • status (active/canceled/past_due)                               │
│  • currentPeriodStart                                               │
│  • currentPeriodEnd                                                 │
│  • priceId                                                          │
│  • amount                                                           │
│  • currency                                                         │
│                                                                      │
│  Pre-Registrations Collection:                                      │
│  • userId                                                           │
│  • email                                                            │
│  • type (paid/free)                                                │
│  • promoCode                                                        │
│  • plusUntil                                                        │
│  • status (active/pending)                                         │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ 6. User refreshes session
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    USER BROWSER (UPDATED)                            │
│                                                                      │
│  • User labels updated (premium, plus, etc.)                        │
│  • UpgradeButton shows "✨ Plus" badge                              │
│  • Usage limits updated (100 sessions, 7000 messages)              │
│  • Access to premium features granted                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Payment Success

### Step-by-Step

1. **User Action**
   - Clicks "Upgrade to Plus" button
   - UpgradeButton.jsx calls `paddle.Checkout.open()`

2. **Paddle.js SDK**
   - Makes internal API call to checkout-service.paddle.com
   - **CURRENT PROBLEM**: Returns 403 (invalid credentials)
   - **AFTER FIX**: Opens checkout overlay successfully

3. **Payment Processing**
   - User enters payment information
   - Paddle processes payment
   - Returns success/failure

4. **Webhook Notification**
   - Paddle sends POST to Appwrite Function
   - Event: `subscription.created` or `transaction.completed`
   - Includes custom_data with appwriteUserId

5. **Database Update**
   - Webhook function adds "premium" + plan label to user
   - Creates subscription record
   - Logs event for audit

6. **Frontend Update**
   - UpgradeButton eventCallback fires
   - Calls `refreshUser()` to fetch updated labels
   - Shows "✨ Plus" badge
   - Updates usage limits

---

## Environment Variables Mapping

### Frontend (Client-Side)
**Location**: Vercel Environment Variables  
**Prefix**: `VITE_*` (required for Vite)  
**Access**: Public (embedded in build)

| Variable | Purpose | Sensitive? |
|----------|---------|------------|
| `VITE_PADDLE_ENVIRONMENT` | Sandbox or production | No |
| `VITE_PADDLE_CLIENT_TOKEN` | Public client token | No (public credential) |
| `VITE_PADDLE_PRE_REG_PRICE_ID` | Pre-registration price | No |
| `VITE_PADDLE_PRO_PRICE_ID` | Pro plan price | No |
| `VITE_PADDLE_PLUS_PRICE_ID` | Plus plan price | No |
| `VITE_PADDLE_PROPLUS_PRICE_ID` | Pro+ plan price | No |

### Backend (Server-Side)
**Location**: Appwrite Function Settings  
**Prefix**: None (server-only)  
**Access**: Private (never exposed to client)

| Variable | Purpose | Sensitive? |
|----------|---------|------------|
| `APPWRITE_API_KEY` | Server API access | Yes |
| `PADDLE_PRE_REG_PRICE_ID` | Price validation | No |
| `PADDLE_PRO_PRICE_ID` | Price validation | No |
| `PADDLE_PLUS_PRICE_ID` | Price validation | No |
| `PADDLE_PROPLUS_PRICE_ID` | Price validation | No |

---

## Security Model

### ✅ Secure
- Payment processing happens on Paddle servers (PCI compliant)
- Webhook validates all payments before granting access
- Client token is public credential (safe to expose)
- Price IDs are public (safe to expose)
- Server API keys stored in Appwrite (never exposed to client)

### ⚠️ Needs Improvement
- Add webhook signature verification
- Add rate limiting on webhook endpoint
- Add retry logic for failed webhook deliveries
- Add logging for all payment events

---

## Price ID to Plan Mapping

```javascript
// In paddleWebhook/index.js
const PRICE_TO_PLAN = {
  [process.env.PADDLE_PRE_REG_PRICE_ID]: 'plus', // $5 one-time
  [process.env.PADDLE_PRO_PRICE_ID]: 'pro',      // $15/month
  [process.env.PADDLE_PLUS_PRICE_ID]: 'plus',    // $15/month
  [process.env.PADDLE_PROPLUS_PRICE_ID]: 'proplus' // $30/month
};
```

### User Labels
- `premium` - Generic premium flag (all paid plans)
- `pro` - Pro plan specific
- `plus` - Plus plan specific
- `proplus` - Pro+ plan specific

### Database Records
- Stored in `subscriptions` collection
- Includes: plan name, status, dates, price ID, amount
- Used for billing history and analytics

---

## Webhook Events Handled

| Event | Action | Database Update |
|-------|--------|-----------------|
| `subscription.created` | Add premium label + plan label | Create subscription record |
| `subscription.activated` | Add premium label + plan label | Update status to active |
| `transaction.completed` | Add premium label + plan label | Create/update subscription |
| `subscription.canceled` | Remove premium label | Update status to canceled |
| `subscription.past_due` | Remove premium label | Update status to past_due |

---

## Pre-Registration Flow

### Special Case: No Appwrite Account Yet

```
User fills form (name, email) → Pays $5 → Webhook receives event
→ No appwriteUserId in custom_data
→ Creates pre_registrations record with email only
→ Status: "pending"

Later: User creates account with that email
→ Auth.jsx checks for pending pre-registration
→ Activates record, adds "plus" label
→ Status: "active"
```

### Special Case: Existing User Pre-Registers

```
Logged-in user → Pays $5 → Webhook receives event
→ appwriteUserId present in custom_data
→ Adds "plus" label immediately
→ Creates pre_registrations record
→ Status: "active"
```

---

## Testing Strategy

### Sandbox Testing (Already Working) ✅
1. Use sandbox client token
2. Use sandbox price IDs
3. Test with Paddle test cards
4. Verify webhook receives events
5. Verify database updates

### Production Testing (After Fix)
1. Use live client token
2. Use live price IDs
3. Test with real payment (or Paddle test mode)
4. Verify no 403 errors
5. Verify webhook receives events
6. Verify labels updated
7. Verify subscription records created

---

## Troubleshooting Guide

### 403 Forbidden Error
**Symptoms**: Checkout overlay doesn't open, 403 in console  
**Cause**: Invalid credentials (wrong environment, wrong token)  
**Fix**: Update VITE_PADDLE_ENVIRONMENT and VITE_PADDLE_CLIENT_TOKEN

### Checkout Opens But Payment Fails
**Symptoms**: Overlay opens, payment fails with error  
**Cause**: Invalid price IDs  
**Fix**: Update VITE_PADDLE_*_PRICE_ID variables

### Payment Success But No Label Updated
**Symptoms**: Payment goes through, user still shows as free  
**Cause**: Webhook not receiving events or failing  
**Fix**: Check Appwrite function logs, verify webhook URL in Paddle

### Wrong Plan Assigned
**Symptoms**: User pays for Plus but gets Pro label  
**Cause**: Price ID mapping incorrect in webhook  
**Fix**: Update PADDLE_*_PRICE_ID in Appwrite function settings

---

## Deployment Checklist

### Before Switching to Live Mode

- [ ] Get live client token from Paddle Dashboard
- [ ] Get all live price IDs from Paddle Dashboard
- [ ] Update `.env` file
- [ ] Update Vercel environment variables
- [ ] Update Appwrite function environment variables
- [ ] Configure webhook URL in Paddle Dashboard
- [ ] Test with small amount first ($1 test)
- [ ] Verify webhook receives event
- [ ] Verify user label updated
- [ ] Verify subscription record created
- [ ] Test checkout on mobile
- [ ] Test checkout on different browsers

### After Going Live

- [ ] Monitor Appwrite function logs for errors
- [ ] Monitor Paddle Dashboard for failed payments
- [ ] Set up email notifications for new subscriptions
- [ ] Set up alerts for webhook failures
- [ ] Document customer support process
- [ ] Create refund process documentation

---

*Architecture document generated by Kiro AI - June 2, 2026*
