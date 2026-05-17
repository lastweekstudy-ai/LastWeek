# Appwrite Schema Updates — Secure Resource Sharing

These changes are required for the secure resource sharing feature:
- Imported resources cannot be re-shared
- Owner unsharing removes access for everyone
- `addCount` tracks how many students added each resource
- Duplicate imports are prevented per user

---

## Option A — Automatic (run the script)

```bash
node scripts/setup-resource-sharing.js
```

Requires `APPWRITE_API_KEY` in `.env` with database read/write permissions.
Safe to run multiple times — skips anything already existing.

---

## Option B — Manual (Appwrite Console)

Go to: **Appwrite Console → Your Database → Collection → Attributes tab**

---

## Collection: `pdf_resources`

### New Attributes

| Attribute | Type | Size | Required | Default | Notes |
|---|---|---|---|---|---|
| `isImported` | Boolean | — | No | `false` | True if this is a copy imported from the shared library |
| `originalResourceId` | String | 36 | No | *(empty)* | The `$id` of the original shared resource this was copied from |
| `addCount` | Integer | — | No | `0` | How many users have added this resource to their library |

### How to add in Console

1. Open `pdf_resources` → **Attributes** tab → **Add Attribute**

**isImported**
- Type: `Boolean`
- Attribute Key: `isImported`
- Required: ❌ No
- Default value: `false`

**originalResourceId**
- Type: `String`
- Attribute Key: `originalResourceId`
- Size: `36`
- Required: ❌ No
- Default value: *(leave empty)*

**addCount**
- Type: `Integer`
- Attribute Key: `addCount`
- Required: ❌ No
- Min: `0`
- Max: `9999999`
- Default value: `0`

### New Indexes

Go to `pdf_resources` → **Indexes** tab → **Add Index**

**Index 1 — single field**
- Index Key: `original_resource_idx`
- Type: `Key`
- Attributes: `originalResourceId` → `ASC`

**Index 2 — compound (used by duplicate-check query)**
- Index Key: `user_original_pdf_idx`
- Type: `Key`
- Attributes: `userId` → `ASC`, `originalResourceId` → `ASC`

---

## Collection: `audio_lectures`

### New Attributes

| Attribute | Type | Size | Required | Default | Notes |
|---|---|---|---|---|---|
| `isImported` | Boolean | — | No | `false` | True if this is a copy imported from the shared library |
| `originalLectureId` | String | 36 | No | *(empty)* | The `$id` of the original shared lecture this was copied from |
| `addCount` | Integer | — | No | `0` | How many users have added this lecture to their library |

### How to add in Console

1. Open `audio_lectures` → **Attributes** tab → **Add Attribute**

**isImported**
- Type: `Boolean`
- Attribute Key: `isImported`
- Required: ❌ No
- Default value: `false`

**originalLectureId**
- Type: `String`
- Attribute Key: `originalLectureId`
- Size: `36`
- Required: ❌ No
- Default value: *(leave empty)*

**addCount**
- Type: `Integer`
- Attribute Key: `addCount`
- Required: ❌ No
- Min: `0`
- Max: `9999999`
- Default value: `0`

### New Indexes

Go to `audio_lectures` → **Indexes** tab → **Add Index**

**Index 1 — single field**
- Index Key: `original_lecture_idx`
- Type: `Key`
- Attributes: `originalLectureId` → `ASC`

**Index 2 — compound (used by duplicate-check query)**
- Index Key: `user_original_audio_idx`
- Type: `Key`
- Attributes: `userId` → `ASC`, `originalLectureId` → `ASC`

---

## Summary

| Collection | Attributes Added | Indexes Added |
|---|---|---|
| `pdf_resources` | `isImported`, `originalResourceId`, `addCount` | `original_resource_idx`, `user_original_pdf_idx` |
| `audio_lectures` | `isImported`, `originalLectureId`, `addCount` | `original_lecture_idx`, `user_original_audio_idx` |

**Total:** 6 new attributes, 4 new indexes across 2 collections.

---

## Impact on Existing Data

- All existing documents get `isImported = false` (the default) — treated as original resources
- All existing documents get `addCount = 0` — no history before this update
- All existing documents get `originalResourceId / originalLectureId = null` — treated as originals
- No existing data is deleted or modified
- No existing queries break — all new attributes are optional with defaults

---

## What breaks if you skip this

| Feature | Without update |
|---|---|
| "Already Added" button | Won't show — user can add the same resource multiple times |
| `addCount` display | Always shows 0 |
| Share button hidden on imports | Share button still shows on imported resources (but sharing an import just makes the copy public, not the original) |
| Duplicate import prevention | Not enforced |

The app will not crash — all new attribute writes/reads have graceful fallbacks in the code.
