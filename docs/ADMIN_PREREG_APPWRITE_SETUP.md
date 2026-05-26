# Appwrite Collection Setup for Admin & Pre-Registration System

Follow these steps to create all required collections in Appwrite.

---

## Appwrite Permissions Reference

Appwrite has 4 permission types for each collection:
- **Read** - Who can read documents
- **Create** - Who can create new documents
- **Update** - Who can update existing documents
- **Delete** - Who can delete documents

Available permission options:
- **Any** - Anyone (including unauthenticated users)
- **All Users** - All authenticated users (`role:all`)
- **All Guests** - Only unauthenticated users (`role:guests`)
- **Custom** - Enter custom role (e.g., `role:admin` for users with "admin" label)
- **Select Users** - Choose specific users by ID

For admin collections, we'll use:
- Read: **All Users** (`role:all`)
- Create: **Custom** → `role:admin`
- Update: **Custom** → `role:admin`
- Delete: **Custom** → `role:admin`

---

## Step 1: Create Collections

Go to Appwrite Console → Your Database → Create Collection

### Collection 1: `admin_settings`
**Collection ID:** `admin_settings`

| Field Name | Type | Required | Array | Size |
|------------|------|----------|-------|------|
| preRegActive | Boolean | Yes | No | - |
| paymentsActive | Boolean | Yes | No | - |
| dailyFreeSlotsActive | Boolean | Yes | No | - |
| dailyFreeSlotCount | Integer | Yes | No | - |
| freePlanActive | Boolean | Yes | No | - |
| proPlanActive | Boolean | Yes | No | - |
| plusPlanActive | Boolean | Yes | No | - |
| proPlusPlanActive | Boolean | Yes | No | - |
| preRegPriceId | String | No | No | 255 |
| updatedAt | String | Yes | No | 255 |

**Permissions:**
| Permission | Value |
|------------|-------|
| Read | All Users |
| Create | Custom → `role:admin` |
| Update | Custom → `role:admin` |
| Delete | Custom → `role:admin` |

---

### Collection 2: `pre_registrations`
**Collection ID:** `pre_registrations`

| Field Name | Type | Required | Array | Size |
|------------|------|----------|-------|------|
| userId | String | Yes | No | 255 |
| email | String | Yes | No | 255 |
| name | String | No | No | 255 |
| type | String | Yes | No | 50 |
| promoCode | String | Yes | No | 50 |
| promoCodeUses | Integer | Yes | No | - |
| bonusMonthsEarned | Integer | Yes | No | - |
| plusUntil | String | Yes | No | 255 |
| status | String | Yes | No | 50 |
| reviewId | String | No | No | 255 |
| paddlePaymentId | String | No | No | 255 |
| createdAt | String | Yes | No | 255 |

**Permissions:**
| Permission | Value |
|------------|-------|
| Read | All Users |
| Create | **All Users** |
| Update | **All Users** |
| Delete | Custom → `role:admin` |

**IMPORTANT:** `pre_registrations` needs **All Users** for Create and Update because testing users create their own pre-registration record when they submit a review.

**Indexes:**

**Index Types in Appwrite:**
- **Key** - Most common, used for equality searches (`Query.equal()`)
- **Fulltext** - For text search queries (`Query.search()`)
- **Unique** - Ensures no duplicate values (automatically creates Key index)

| Index Name | Type | Fields | Unique | Orders |
|------------|------|--------|--------|--------|
| idx_userId | Key | userId | Yes | ASC |
| idx_email | Key | email | Yes | ASC |
| idx_promoCode | Key | promoCode | Yes | ASC |
| idx_status | Key | status | No | ASC |

---

### Collection 3: `promo_code_usage`
**Collection ID:** `promo_code_usage`

| Field Name | Type | Required | Array | Size |
|------------|------|----------|-------|------|
| promoCode | String | Yes | No | 50 |
| referrerId | String | Yes | No | 255 |
| newUserId | String | Yes | No | 255 |
| newUserEmail | String | Yes | No | 255 |
| createdAt | String | Yes | No | 255 |

**Permissions:**
| Permission | Value |
|------------|-------|
| Read | All Users |
| Create | Custom → `role:admin` |
| Update | Custom → `role:admin` |
| Delete | Custom → `role:admin` |

**Indexes:**

| Index Name | Type | Fields | Unique | Orders |
|------------|------|--------|--------|--------|
| idx_promoCode | Key | promoCode | No | ASC |
| idx_referrerId | Key | referrerId | No | ASC |
| idx_newUserId | Key | newUserId | No | ASC |

---

### Collection 4: `user_reviews`
**Collection ID:** `user_reviews`

| Field Name | Type | Required | Array | Size |
|------------|------|----------|-------|------|
| userId | String | Yes | No | 255 |
| preRegId | String | No | No | 255 |
| rating | Integer | Yes | No | - |
| title | String | Yes | No | 255 |
| content | String | Yes | No | 2000 |
| isApproved | Boolean | Yes | No | - |
| isPublished | Boolean | Yes | No | - |
| helpfulCount | Integer | Yes | No | - |
| createdAt | String | Yes | No | 255 |

**Permissions:**
| Permission | Value |
|------------|-------|
| Read | All Users |
| Create | **All Users** |
| Update | Custom → `role:admin` |
| Delete | Custom → `role:admin` |

**IMPORTANT:** `user_reviews` needs **All Users** for Create because testing users create their own review when submitting feedback.

**Indexes:**

| Index Name | Type | Fields | Unique | Orders |
|------------|------|--------|--------|--------|
| idx_userId | Key | userId | No | ASC |
| idx_isApproved | Key | isApproved | No | ASC |
| idx_isPublished | Key | isPublished | No | ASC |

---

### Collection 5: `daily_free_slots`
**Collection ID:** `daily_free_slots`

| Field Name | Type | Required | Array | Size |
|------------|------|----------|-------|------|
| date | String | Yes | No | 20 |
| totalSlots | Integer | Yes | No | - |
| usedSlots | Integer | Yes | No | - |
| slotUserIds | String | No | Yes | 255 |
| createdAt | String | Yes | No | 255 |

**Note:** Array fields cannot be required in Appwrite. The `slotUserIds` field is optional and will be empty by default.

**Permissions:**
| Permission | Value |
|------------|-------|
| Read | **Any** |
| Create | All Users |
| Update | All Users |
| Delete | Custom → `role:admin` |

**CRITICAL:** The `daily_free_slots` collection needs **"Any"** for Read (not "All Users") because **unauthenticated users** on the `/auth` page need to check slot availability before they register. "All Users" only works for authenticated users, while "Any" allows both authenticated and unauthenticated access.

**IMPORTANT:** The `daily_free_slots` collection needs **All Users** for Create and Update because new testing users need to create the daily slots document (if it doesn't exist) and update the `usedSlots` counter when they claim a slot.

**Indexes:**

| Index Name | Type | Fields | Unique | Orders |
|------------|------|--------|--------|--------|
| idx_date | Key | date | **Yes** | ASC |

**CRITICAL:** The `idx_date` index MUST be **Unique** to prevent duplicate documents for the same date. Without a unique index, multiple documents can be created for the same date, causing incorrect slot counts.

---

### Collection 6: `daily_slot_usage`
**Collection ID:** `daily_slot_usage`

| Field Name | Type | Required | Array | Size |
|------------|------|----------|-------|------|
| userId | String | Yes | No | 255 |
| email | String | Yes | No | 255 |
| date | String | Yes | No | 20 |
| hasReviewed | Boolean | Yes | No | - |
| reviewId | String | **No** | No | 255 |
| addedToPreReg | Boolean | Yes | No | - |
| createdAt | String | Yes | No | 255 |

**Note:** The `reviewId` field must be **optional** (not required) because users submit reviews later after testing. Appwrite will reject `null` values for required fields.

**Permissions:**
| Permission | Value |
|------------|-------|
| Read | **Any** |
| Create | All Users |
| Update | All Users |
| Delete | Custom → `role:admin` |

**CRITICAL:** The `daily_slot_usage` collection needs **"Any"** for Read (not "All Users") because **unauthenticated users** on the `/auth` page need to check if their email has already used a free slot. "All Users" only works for authenticated users.

**Indexes:**

| Index Name | Type | Fields | Unique | Orders |
|------------|------|--------|--------|--------|
| idx_userId | Key | userId | No | ASC |
| idx_email | Key | email | No | ASC |
| idx_date | Key | date | No | ASC |

---

## Step 2: Create Initial Admin Settings Document

Go to the `admin_settings` collection and create a new document with these values:

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

**Document ID:** Use `admin_settings_doc` (or any memorable ID)

---

## Step 3: Add Admin Label to Your User

1. Go to **Auth** → **Users** in Appwrite Console
2. Find your user account
3. Click on **Labels**
4. Add the label: `admin`
5. Save

This gives your user the `role:admin` role, allowing access to admin-only operations.

---

## Step 4: Update Environment Variables

Add these to your `.env` file:

```env
# Admin & Pre-Registration Collections
VITE_APPWRITE_ADMIN_SETTINGS_COLLECTION_ID=admin_settings
VITE_APPWRITE_PRE_REGISTRATIONS_COLLECTION_ID=pre_registrations
VITE_APPWRITE_PROMO_CODE_USAGE_COLLECTION_ID=promo_code_usage
VITE_APPWRITE_USER_REVIEWS_COLLECTION_ID=user_reviews
VITE_APPWRITE_DAILY_FREE_SLOTS_COLLECTION_ID=daily_free_slots
VITE_APPWRITE_DAILY_SLOT_USAGE_COLLECTION_ID=daily_slot_usage

# Pre-Registration Paddle Price (create this in Paddle dashboard)
VITE_PADDLE_PRE_REG_PRICE_ID=your_pre_reg_price_id_here
```

---

## Step 5: Create Pre-Registration Price in Paddle

1. Go to Paddle Dashboard → **Catalog** → **Prices**
2. Create a new price:
   - **Name:** Pre-Registration
   - **Amount:** $5.00
   - **Billing Cycle:** One-time (non-recurring)
   - **Description:** Pre-registration for LastWeek Plus (1 year free)
3. Copy the Price ID and add it to `.env` as `VITE_PADDLE_PRE_REG_PRICE_ID`

---

## Step 6: Verify Permissions

Make sure the collections have proper permissions:

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| admin_settings | All Users | `role:admin` | `role:admin` | `role:admin` |
| pre_registrations | All Users | **All Users** | **All Users** | `role:admin` |
| promo_code_usage | All Users | `role:admin` | `role:admin` | `role:admin` |
| user_reviews | All Users | **All Users** | `role:admin` | `role:admin` |
| daily_free_slots | **Any** | All Users | All Users | `role:admin` |
| daily_slot_usage | **Any** | All Users | All Users | `role:admin` |
| testing_usage | All Users | **All Users** | **All Users** | `role:admin` |

**Important Notes:**

1. **Read = All Users**: Any authenticated user can read these documents (needed for checking admin settings, promo codes, etc.)

2. **daily_free_slots Read = Any**: This collection needs "Any" (not "All Users") because unauthenticated users on the `/auth` page need to check slot availability before registering. "Any" allows both authenticated and unauthenticated access.

3. **Create/Update/Delete = `role:admin`**: Only users with the `admin` label can modify these collections

4. **For user-created records** (like pre-registration from webhook): The serverless function uses an API key which bypasses these permissions, so the webhook can create records even with `role:admin` restriction.

---

---

## Step 6: Create `testing_usage` Collection

**Collection ID:** `testing_usage`

This collection tracks one-time feature usage for users in testing mode (free slot testers).

| Field Name | Type | Required | Array | Size |
|------------|------|----------|-------|------|
| userId | String | Yes | No | 255 |
| email | String | Yes | No | 255 |
| sessions | Integer | Yes | No | - |
| pdfs | Integer | Yes | No | - |
| audios | Integer | Yes | No | - |
| messages | Integer | Yes | No | - |
| flashcards | Integer | Yes | No | - |
| mcqs | Integer | Yes | No | - |
| examPlans | Integer | Yes | No | - |
| languageLearningSessions | Integer | Yes | No | - |
| libraryImports | Integer | Yes | No | - |
| hasReviewed | Boolean | Yes | No | - |
| reviewId | String | No | No | 255 |
| addedToPreReg | Boolean | Yes | No | - |
| createdAt | String | Yes | No | 255 |

**Permissions:**
| Permission | Value |
|------------|-------|
| Read | All Users |
| Create | All Users |
| Update | All Users |
| Delete | Custom → `role:admin` |

**IMPORTANT:** Unlike other admin collections, `testing_usage` needs **All Users** for Create and Update because new testing users need to create their own testing usage document when they register, and they need to update it as they use features.

**Indexes:**

| Index Name | Type | Fields | Unique | Orders |
|------------|------|--------|--------|--------|
| idx_userId | Key | userId | Yes | ASC |
| idx_email | Key | email | No | ASC |

Add to `.env`:
```env
VITE_APPWRITE_TESTING_USAGE_COLLECTION_ID=testing_usage
```

---

## Step 7: Subscriptions Collection Permissions

The `subscriptions` collection needs proper permissions for the pre-registration completion to work:

| Permission | Value |
|------------|-------|
| Read | All Users |
| Create | All Users |
| Update | All Users |
| Delete | role:admin |

**Why:** The `completeAllPreRegistrations` function creates subscription records for pre-registered users. Since this runs from the client-side admin panel, the admin user needs to be able to create/update subscription documents.

---

## Quick Checklist

- [ ] Created `admin_settings` collection
- [ ] Created `pre_registrations` collection
- [ ] Created `promo_code_usage` collection
- [ ] Created `user_reviews` collection
- [ ] Created `daily_free_slots` collection
- [ ] Created `daily_slot_usage` collection
- [ ] Created `testing_usage` collection ⬅️ NEW
- [ ] Set correct permissions (Read=All Users, Create/Update/Delete=role:admin)
- [ ] Added initial admin_settings document
- [ ] Added `admin` label to your user
- [ ] Updated `.env` with collection IDs
- [ ] Created Pre-Reg price in Paddle

---

## Next Steps

After completing this setup:
1. Access admin panel at `/admin`
2. Test toggling features on/off
3. Test pre-registration flow
4. Test daily free slots

The webhook will handle creating pre-registration records automatically when users pay $5.
