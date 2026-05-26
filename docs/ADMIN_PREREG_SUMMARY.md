# Admin Panel & Pre-Registration System - Implementation Summary

## What Was Built

### 1. Architecture Documentation
- **`docs/ADMIN_PREREG_ARCHITECTURE.md`** - Complete system architecture
- **`docs/ADMIN_PREREG_APPWRITE_SETUP.md`** - Step-by-step Appwrite collection setup

### 2. Core Admin Service
- **`src/appwrite/admin.js`** - All admin-related database operations:
  - Admin settings management
  - Pre-registration CRUD
  - Promo code generation and tracking
  - Daily free slots management
  - User reviews management
  - Statistics and analytics

### 3. Admin Panel UI Components
- **`src/pages/admin/AdminLayout.jsx`** - Admin panel layout with sidebar navigation
- **`src/pages/admin/Dashboard.jsx`** - Main dashboard with stats and quick toggles
- **`src/pages/admin/PreRegUsers.jsx`** - Pre-registration management
- **`src/pages/admin/DailySlots.jsx`** - Daily free slots management
- **`src/pages/admin/Reviews.jsx`** - Review moderation
- **`src/pages/admin/Settings.jsx`** - All settings in one place

### 4. User-Facing Components
- **`src/components/ReviewForm.jsx`** - Review submission form
- **`src/components/ReviewList.jsx`** - Display published reviews

### 5. Updated Pages
- **`src/pages/Pricing.jsx`** - Now respects admin toggles and shows pre-reg banners
- **`src/pages/Auth.jsx`** - Handles pre-reg and free slot flows
- **`src/App.jsx`** - Added admin routes with proper authentication

### 6. Updated Webhook
- **`appwrite-functions/paddleWebhook/index.js`** - Now handles pre-registration payments

### 7. Hooks
- **`src/hooks/useAdminSettings.js`** - React hook for admin settings

### 8. Environment Variables
Added to **`.env`**:
```
VITE_APPWRITE_ADMIN_SETTINGS_COLLECTION_ID=admin_settings
VITE_APPWRITE_PRE_REGISTRATIONS_COLLECTION_ID=pre_registrations
VITE_APPWRITE_PROMO_CODE_USAGE_COLLECTION_ID=promo_code_usage
VITE_APPWRITE_USER_REVIEWS_COLLECTION_ID=user_reviews
VITE_APPWRITE_DAILY_FREE_SLOTS_COLLECTION_ID=daily_free_slots
VITE_APPWRITE_DAILY_SLOT_USAGE_COLLECTION_ID=daily_slot_usage
VITE_PADDLE_PRE_REG_PRICE_ID=
```

---

## Setup Instructions

### Step 1: Create Appwrite Collections
Follow the instructions in `docs/ADMIN_PREREG_APPWRITE_SETUP.md` to create:
1. `admin_settings` collection
2. `pre_registrations` collection
3. `promo_code_usage` collection
4. `user_reviews` collection
5. `daily_free_slots` collection
6. `daily_slot_usage` collection

### Step 2: Create Initial Admin Settings Document
Create a document in `admin_settings` collection with ID `admin_settings_doc`:
```json
{
  "preRegActive": false,
  "paymentsActive": true,
  "dailyFreeSlotsActive": false,
  "dailyFreeSlotCount": 10,
  "freePlanActive": true,
  "proPlanActive": true,
  "plusPlanActive": true,
  "proPlusPlanActive": true,
  "preRegPriceId": "",
  "updatedAt": "2025-01-15T00:00:00.000Z"
}
```

### Step 3: Add Admin Label to Your User
1. Go to Appwrite Console → Auth → Users
2. Find your user
3. Add label: `admin`

### Step 4: Create Pre-Registration Price in Paddle
1. Go to Paddle Dashboard → Catalog → Prices
2. Create a $5 one-time price
3. Copy the Price ID to `.env` as `VITE_PADDLE_PRE_REG_PRICE_ID`

### Step 5: Access Admin Panel
Navigate to `/admin` in your app (must be logged in with admin label)

---

## Features

### Admin Dashboard
- View stats (pre-regs, promo codes, reviews, owed value)
- Quick toggles for all major features
- Plan availability controls

### Pre-Registration System
- Paid pre-reg ($5 for 1 year Plus)
- Daily free slots (configurable count)
- Promo code generation
- Promo code usage tracking
- Automatic bonus months (6 months per 10 uses)

### Daily Free Slots
- Configurable daily slot count
- US Eastern Time based
- One use per email
- Review requirement for pre-reg addition

### Reviews
- User submission form
- Admin moderation (approve/reject/publish)
- Public display on website

### Mode Switching
- Toggle between commercial and pre-reg modes
- All data syncs properly when switching
- Zero compromise on website functionality

---

## How It Works

### Commercial Mode (Default)
- `paymentsActive: true`
- `preRegActive: false`
- All payment plans available
- Normal subscription flow

### Pre-Registration Mode
- `preRegActive: true`
- `paymentsActive: false` (or true for hybrid)
- Only pre-reg payment option shown
- Free slots available if enabled

### Daily Free Slots Flow
1. User visits `/auth?freeSlot=true`
2. Checks slot availability
3. User signs up
4. User tries features once
5. User leaves review → added to pre-reg list

### Promo Code Flow
1. Pre-reg user gets unique code
2. New user signs up with code
3. Referrer gets +1 use count
4. Every 10 uses → +6 months bonus

---

## Security Notes

1. Admin routes protected by both frontend route guard AND backend label check
2. Only users with `admin` label can access admin panel
3. Pre-reg records created via webhook (server-side)
4. Daily slot usage tracked per email to prevent abuse

---

## Files Created/Modified

### Created:
- `docs/ADMIN_PREREG_ARCHITECTURE.md`
- `docs/ADMIN_PREREG_APPWRITE_SETUP.md`
- `src/appwrite/admin.js`
- `src/hooks/useAdminSettings.js`
- `src/pages/admin/AdminLayout.jsx`
- `src/pages/admin/Dashboard.jsx`
- `src/pages/admin/PreRegUsers.jsx`
- `src/pages/admin/DailySlots.jsx`
- `src/pages/admin/Reviews.jsx`
- `src/pages/admin/Settings.jsx`
- `src/components/ReviewForm.jsx`
- `src/components/ReviewList.jsx`

### Modified:
- `src/App.jsx` - Added admin routes
- `src/pages/Pricing.jsx` - Added admin toggle logic
- `src/pages/Auth.jsx` - Added pre-reg and free slot flows
- `appwrite-functions/paddleWebhook/index.js` - Added pre-reg handling
- `.env` - Added collection IDs

---

## Next Steps

1. Create the Appwrite collections (follow `ADMIN_PREREG_APPWRITE_SETUP.md`)
2. Add the `admin` label to your user
3. Create the $5 pre-reg price in Paddle
4. Test the admin panel at `/admin`
5. Test the pre-reg flow
6. Test daily free slots
7. Add reviews display to landing page

---

## Testing Checklist

- [ ] Can access `/admin` with admin user
- [ ] Can toggle pre-reg mode
- [ ] Can toggle payments
- [ ] Can toggle daily free slots
- [ ] Can set daily slot count
- [ ] Can toggle individual plans
- [ ] Pricing page shows correct buttons based on toggles
- [ ] Pre-reg flow works (signup → payment → Plus label)
- [ ] Daily free slot flow works (signup → use → review → pre-reg)
- [ ] Promo codes are generated
- [ ] Promo code usage is tracked
- [ ] Reviews can be submitted and moderated
