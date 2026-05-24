# Usage Limits — Setup Instructions

## What was implemented

### New files created:
| File | Purpose |
|---|---|
| `src/config/planLimits.js` | All tier limits in one config file |
| `src/appwrite/usageTracking.js` | Read/write monthly usage counters |
| `src/hooks/useUsageLimits.js` | Hook to check limits from any component |
| `src/hooks/useSessionWithLimits.js` | Drop-in replacement for useSession with limit checks |
| `src/components/UsageLimitModal.jsx` | Upgrade prompt shown when limit is hit |

### How it works:
1. Each user gets one `usage_tracking` document per month (auto-created on first action)
2. Before any limited action, `canDo('messages')` checks current count vs plan limit
3. If limit reached → `UsageLimitModal` shows with upgrade CTA
4. If allowed → action proceeds, then `recordUsage('messages')` increments the counter
5. Counters reset automatically on the 1st of each month (new document created)

---

## Step 1: Create `usage_tracking` collection in Appwrite

1. Appwrite Console → Databases → your database
2. **+ Create Collection**
3. Name: `usage_tracking`
4. Collection ID: `usage_tracking`

### Attributes:

| # | Type | Key | Size | Required |
|---|---|---|---|---|
| 1 | String | `userId` | 100 | Yes |
| 2 | String | `month` | 10 | Yes |
| 3 | Integer | `sessionsCreated` | — | No (default 0) |
| 4 | Integer | `messagesUsed` | — | No (default 0) |
| 5 | Integer | `pdfsUploaded` | — | No (default 0) |
| 6 | Integer | `audiosUploaded` | — | No (default 0) |
| 7 | Integer | `flashcardsCreated` | — | No (default 0) |
| 8 | Integer | `mcqsAnswered` | — | No (default 0) |
| 9 | Integer | `storageUsedBytes` | — | No (default 0) |
| 10 | String | `updatedAt` | 50 | No |

### Indexes:

| Index Key | Type | Attributes |
|---|---|---|
| `userId_month` | **Unique** | `userId`, `month` |

### Permissions:
- Role: **Users** → Read ✅, Create ✅, Update ✅

---

## Step 2: Create additional Paddle prices (for Plus and Pro+)

You already have Pro ($9.99). Create two more:

1. Paddle Dashboard → **Catalog** → **Products** → your product
2. Click **+ Add Price**:
   - **Plus:** $14.99/month, billing period: Monthly
   - **Pro+:** $19.99/month, billing period: Monthly
3. Copy both new Price IDs (they start with `pri_`)

---

## Step 3: Update the webhook to map prices to plans

The webhook currently sets `plan: 'pro'` for all payments. Update it to check the price ID:

In `appwrite-functions/paddleWebhook/index.js`, find the subscription data section and update the `plan` field:

```javascript
// Map Paddle price IDs to plan names
const PRICE_TO_PLAN = {
  'pri_01ks7zcvs99ceath0325eq3j4x': 'pro',      // $9.99
  'pri_YOUR_PLUS_PRICE_ID': 'plus',              // $14.99
  'pri_YOUR_PRO_PLUS_PRICE_ID': 'pro_plus',      // $19.99
};

const priceId = payload.data?.items?.[0]?.price?.id || '';
const plan = PRICE_TO_PLAN[priceId] || 'pro';
```

Also update the user label to match:
```javascript
// Add the correct label based on plan
const labelToAdd = plan === 'pro_plus' ? 'pro_plus' : plan === 'plus' ? 'plus' : 'premium';
```

After updating, rebuild and redeploy the webhook tar.gz.

---

## Step 4: Add env var for usage tracking collection

Already done — the code uses hardcoded `'usage_tracking'` as the collection ID. No env var needed.

---

## Step 5: Wire limits into mode pages

The `useSessionWithLimits` hook is a drop-in replacement for `useSession`. To enforce limits in any mode page:

### Before (no limits):
```jsx
import useSession from '../../hooks/useSession';

const MentalModel = () => {
  const { sendMessageWithAI, ... } = useSession();
```

### After (with limits):
```jsx
import useSessionWithLimits from '../../hooks/useSessionWithLimits';
import UsageLimitModal from '../../components/UsageLimitModal';

const MentalModel = () => {
  const { sendMessageWithAI, limitBlocked, clearLimitBlock, usageLimits, ... } = useSessionWithLimits();

  // Add this at the bottom of the JSX:
  <UsageLimitModal
    isOpen={!!limitBlocked}
    onClose={clearLimitBlock}
    action={limitBlocked?.action}
    current={limitBlocked?.current}
    limit={limitBlocked?.limit}
    planName={limitBlocked?.planName}
  />
```

Apply this pattern to:
- `src/pages/modes/MentalModel.jsx`
- `src/pages/modes/ActiveRecall.jsx`
- `src/pages/modes/FocusBreakdown.jsx`
- `src/pages/modes/CollaborativeScholar.jsx`
- `src/pages/modes/CreativeSynthesis.jsx`
- `src/pages/ExamSession.jsx`

### For session creation limits:
Check before creating a session in `ModeSelector.jsx` or wherever sessions are started:
```jsx
const { canDo } = useUsageLimits();
const sessionCheck = canDo('sessions');
if (!sessionCheck.allowed) {
  // Show limit modal
}
```

### For language learning route guard:
In `App.jsx`, wrap the language learning routes:
```jsx
const LanguageLearningGuard = ({ children }) => {
  const { canDo } = useUsageLimits();
  const check = canDo('languageLearning');
  if (!check.allowed) return <Navigate to="/pricing" replace />;
  return children;
};
```

---

## Step 6: Create a /pricing page (optional but recommended)

Create `src/pages/Pricing.jsx` with the plan comparison table and upgrade buttons for each tier. The `UsageLimitModal` links to `/pricing` when users hit limits.

---

## Summary of what's ready vs what needs wiring

| Component | Status |
|---|---|
| Plan limits config | ✅ Done |
| Usage tracking DB layer | ✅ Done |
| useUsageLimits hook | ✅ Done |
| useSessionWithLimits hook | ✅ Done |
| UsageLimitModal component | ✅ Done |
| Mode pages integration | 🔲 Apply pattern above to each page |
| Session creation check | 🔲 Add to ModeSelector |
| PDF upload check | 🔲 Add to PDFLibrary/FilePromptInput |
| Audio upload check | 🔲 Add to AudioProcessor |
| Language learning guard | 🔲 Add to App.jsx routes |
| Exam plan limit check | 🔲 Add to ExamPlanner |
| Pricing page | 🔲 Create new page |
| Webhook price→plan mapping | 🔲 Update and redeploy |

The infrastructure is complete. The remaining work is mechanical — applying the same pattern to each enforcement point.
