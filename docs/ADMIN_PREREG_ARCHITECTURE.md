# Admin Panel & Pre-Registration System Architecture

## Overview

This document outlines the architecture for a complete admin control panel and pre-registration system that allows switching between commercial and promotional modes without compromising any website functionality.

---

## 1. System Modes

### Commercial Mode (Default)
- All payment plans active (Free, Pro, Plus, Pro+)
- Normal subscription flow via Paddle
- Standard usage limits per plan

### Pre-Registration Mode
- **Paid Pre-Reg:** Users pay $5 to join pre-reg → get Plus free for 1 year
- **Free Daily Slots:** Admin-defined slots (default 10) per 24h (US time)
  - Free testers can use all features once
  - Must leave a review → auto-added to pre-reg list
  - One use per email (can't reuse same email)
- **Promo Code System:** Each pre-reg user gets a unique promo code
  - Every 10 users who use their code → +6 months of Plus

---

## 2. Appwrite Collections Required

### 2.1 `admin_settings` (Singleton)
```javascript
{
  $id: "admin_settings_doc",
  preRegActive: false,           // Master toggle for pre-reg mode
  paymentsActive: true,          // Master toggle for ALL payments
  dailyFreeSlotsActive: false,   // Toggle for daily free testing
  dailyFreeSlotCount: 10,        // Number of daily free slots
  freePlanActive: true,          // Toggle for free plan
  proPlanActive: true,           // Toggle for Pro plan ($9.99)
  plusPlanActive: true,          // Toggle for Plus plan ($14.99)
  proPlusPlanActive: true,       // Toggle for Pro+ plan ($19.99)
  preRegPriceId: "",             // Paddle price ID for $5 pre-reg
  updatedAt: "ISO timestamp"
}
```

### 2.2 `pre_registrations`
```javascript
{
  $id: "unique_id",
  userId: "appwrite_user_id",
  email: "user@email.com",
  name: "User Name",
  type: "paid" | "free_slot" | "reviewer",  // How they joined
  promoCode: "UNIQUE_CODE_123",              // Auto-generated
  promoCodeUses: 0,                          // Count of successful uses
  bonusMonthsEarned: 0,                      // From promo code usage
  plusUntil: "ISO timestamp",                // Plus expiry (1 year from join)
  status: "active" | "expired" | "converted",
  reviewId: "review_doc_id" | null,          // If they left a review
  paddlePaymentId: "" | "transaction_id",    // If paid
  createdAt: "ISO timestamp"
}
```

### 2.3 `promo_code_usage`
```javascript
{
  $id: "unique_id",
  promoCode: "CODE_USED",
  referrerId: "pre_reg_user_id",
  newUserId: "appwrite_user_id",
  newUserEmail: "newuser@email.com",
  createdAt: "ISO timestamp"
}
```

### 2.4 `user_reviews`
```javascript
{
  $id: "unique_id",
  userId: "appwrite_user_id",
  preRegId: "pre_reg_doc_id" | null,
  rating: 1-5,
  title: "Review title",
  content: "Review text",
  isApproved: true,
  isPublished: true,
  helpfulCount: 0,
  createdAt: "ISO timestamp"
}
```

### 2.5 `daily_free_slots`
```javascript
{
  $id: "unique_id",
  date: "2025-01-15",              // US date (YYYY-MM-DD)
  totalSlots: 10,
  usedSlots: 0,
  slotUserIds: ["user_id_1", ...],
  createdAt: "ISO timestamp"
}
```

### 2.6 `daily_slot_usage`
```javascript
{
  $id: "unique_id",
  userId: "appwrite_user_id",
  email: "user@email.com",
  date: "2025-01-15",
  hasReviewed: false,
  reviewId: null,
  addedToPreReg: false,
  createdAt: "ISO timestamp"
}
```

---

## 3. Admin Panel Features

### 3.1 Dashboard
- **Stats Overview:** Total users, active pre-reg users, promo codes issued, reviews count
- **Quick Toggles:** One-click switches for all major features
- **Revenue Tracking:** How much "owed" in benefits (free Plus time)

### 3.2 Pre-Registration Management
- List all pre-reg users with filters (type, status)
- View promo codes and usage counts
- Calculate owed benefits (months of Plus)
- Export data (CSV)

### 3.3 Daily Free Slots
- Set daily slot count
- View today's usage
- View historical usage
- Manual add/remove users

### 3.4 Reviews Management
- Approve/reject reviews
- Feature reviews
- Delete inappropriate reviews

### 3.5 Payment Controls
- Toggle individual plans on/off
- Toggle pre-reg payment
- View payment history

---

## 4. User Flow Changes

### 4.1 Pricing Page Changes
```javascript
// Check admin_settings before showing plans
const adminSettings = await getAdminSettings();

if (!adminSettings.paymentsActive) {
  // Show "Coming Soon" or "Pre-Registration" message
}

if (!adminSettings.freePlanActive) {
  // Hide/disable free plan
}

if (adminSettings.preRegActive) {
  // Show pre-reg option ($5)
}
```

### 4.2 Auth Page Changes
```javascript
// Daily free slot logic
const adminSettings = await getAdminSettings();

if (adminSettings.dailyFreeSlotsActive && isGuestLogin) {
  // Check if slot available
  const slotAvailable = await checkDailySlotAvailability();
  
  if (!slotAvailable) {
    // Show "All slots taken today, try tomorrow"
  }
  
  // Track usage
  await recordSlotUsage(userId);
}
```

### 4.3 Review Submission
```javascript
// After user submits review
if (userFromDailySlot && !user.hasReviewed) {
  // Auto-add to pre-reg list
  await addToPreReg(user, { type: 'reviewer' });
}
```

---

## 5. Promo Code System

### 5.1 Code Generation
```javascript
const generatePromoCode = (userId) => {
  const prefix = 'LW';
  const hash = userId.slice(-6).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${hash}${random}`; // e.g., "LW3A7B2XC9"
};
```

### 5.2 Code Usage Tracking
- When a new user signs up with a promo code
- Increment `promoCodeUses` on referrer's pre-reg record
- Every 10 uses → add 6 months to `bonusMonthsEarned`
- Extend `plusUntil` accordingly

---

## 6. Synchronization Logic

### 6.1 Pre-Reg → Commercial Transition
```javascript
// When admin ends pre-reg
1. Set preRegActive = false
2. Set paymentsActive = true
3. All pre-reg users keep their plusUntil date
4. Promo codes stop working for new signups
5. Daily free slots disabled
```

### 6.2 Commercial → Pre-Reg Transition
```javascript
// When admin starts pre-reg
1. Set preRegActive = true
2. Set paymentsActive = false
3. Enable pre-reg price in Paddle
4. Reset daily free slots
5. Generate new promo codes for existing pre-reg users
```

---

## 7. Admin Authentication

### 7.1 Admin User Detection
```javascript
// Check if user has 'admin' label
const isAdmin = user.labels?.includes('admin');
```

### 7.2 Admin Route Protection
```javascript
// In App.jsx
<Route 
  path="/admin/*" 
  element={
    user?.labels?.includes('admin') 
      ? <AdminPanel /> 
      : <Navigate to="/dashboard" />
  } 
/>
```

---

## 8. Environment Variables to Add

```env
# Pre-Registration
VITE_APPWRITE_ADMIN_SETTINGS_COLLECTION_ID=admin_settings
VITE_APPWRITE_PRE_REGISTRATIONS_COLLECTION_ID=pre_registrations
VITE_APPWRITE_PROMO_CODE_USAGE_COLLECTION_ID=promo_code_usage
VITE_APPWRITE_USER_REVIEWS_COLLECTION_ID=user_reviews
VITE_APPWRITE_DAILY_FREE_SLOTS_COLLECTION_ID=daily_free_slots
VITE_APPWRITE_DAILY_SLOT_USAGE_COLLECTION_ID=daily_slot_usage
VITE_PADDLE_PRE_REG_PRICE_ID=your_paddle_price_id
```

---

## 9. Implementation Phases

### Phase 1: Infrastructure (Day 1)
- Create all Appwrite collections
- Add environment variables
- Create admin_settings singleton document

### Phase 2: Admin Auth & Panel Structure (Day 2)
- Create admin panel routes
- Add admin label to your user
- Build admin navigation and layout

### Phase 3: Admin Dashboard & Toggles (Day 3)
- Implement admin_settings read/write
- Build toggle controls
- Test mode switching

### Phase 4: Pre-Registration System (Day 4-5)
- Build pre-reg signup flow
- Implement promo code generation
- Build promo code tracking

### Phase 5: Daily Free Slots (Day 6)
- Implement slot allocation
- Track usage per email
- Build review → pre-reg flow

### Phase 6: Review System (Day 7)
- Build review submission component
- Create review display on landing
- Admin review moderation

### Phase 7: Integration Testing (Day 8)
- Test all transitions
- Verify sync between modes
- End-to-end testing

---

## 10. Security Considerations

1. **Admin Routes:** Protected by both frontend route guards AND backend label checks
2. **Admin Settings:** Only users with 'admin' label can write
3. **Promo Codes:** Unique per user, can't be reused by same referrer
4. **Daily Slots:** One use per email, tracked in database
5. **Review Spam Protection:** Rate limiting, admin moderation

---

## 11. File Structure

```
src/
├── pages/
│   └── admin/
│       ├── AdminLayout.jsx
│       ├── Dashboard.jsx
│       ├── PreRegUsers.jsx
│       ├── DailySlots.jsx
│       ├── Reviews.jsx
│       └── Settings.jsx
├── components/
│   ├── admin/
│   │   ├── AdminToggle.jsx
│   │   ├── StatsCard.jsx
│   │   ├── PreRegTable.jsx
│   │   └── ReviewCard.jsx
│   └── reviews/
│       ├── ReviewForm.jsx
│       └── ReviewList.jsx
├── hooks/
│   └── useAdminSettings.js
├── appwrite/
│   └── admin.js
└── config/
    └── adminConfig.js
```
