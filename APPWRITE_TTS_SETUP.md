# Appwrite TTS Setup Guide

Complete step-by-step guide to set up Appwrite collections for the Gemini TTS system.

## 📋 Overview

You need to create **2 collections** in Appwrite:
1. **`tts_cache_metadata`** - Stores metadata about cached audio files
2. **`tts_usage`** - Tracks per-user TTS usage

## 🚀 Quick Setup (5 minutes)

### Step 1: Access Appwrite Console

1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Log in to your account
3. Select your project: **`69958be2003344c314a1`**
4. Navigate to **Databases** in the left sidebar
5. Select database: **`69f742a2001f393e4b85`**

---

## 📦 Collection 1: TTS Cache Metadata

### Create Collection

1. Click **"Create Collection"** button
2. Enter Collection ID: `tts_cache_metadata`
3. Enter Collection Name: `TTS Cache Metadata`
4. Click **"Create"**

### Configure Permissions

1. Go to **Settings** tab
2. **Enable Document Security**:
   - Find "Document Security" section
   - Toggle **ON** (enabled)
3. **Set Collection Permissions**:
   - Find "Permissions" section
   - **Leave it EMPTY** (no roles)
4. Click **"Update"**

**Note**: We use document-level permissions. Cache is shared (anyone can read), but usage is private (owner only). See `APPWRITE_TTS_PERMISSIONS_GUIDE.md` for details.

### Add Attributes

Click **"Attributes"** tab, then add each attribute:

#### Attribute 1: text
- **Type**: String
- **Key**: `text`
- **Size**: `500`
- **Required**: ✅ Yes
- **Array**: ❌ No
- **Default**: (leave empty)
- Click **"Create"**

#### Attribute 2: voice
- **Type**: String
- **Key**: `voice`
- **Size**: `50`
- **Required**: ✅ Yes
- **Array**: ❌ No
- **Default**: (leave empty)
- Click **"Create"**

#### Attribute 3: fileId
- **Type**: String
- **Key**: `fileId`
- **Size**: `100`
- **Required**: ✅ Yes
- **Array**: ❌ No
- **Default**: (leave empty)
- Click **"Create"**

#### Attribute 4: createdAt
- **Type**: DateTime
- **Key**: `createdAt`
- **Required**: ✅ Yes
- **Array**: ❌ No
- **Default**: (leave empty)
- Click **"Create"**

#### Attribute 5: charCount
- **Type**: Integer
- **Key**: `charCount`
- **Required**: ✅ Yes
- **Array**: ❌ No
- **Min**: `0`
- **Max**: `1000000`
- **Default**: (leave empty)
- Click **"Create"**

### Add Indexes

Click **"Indexes"** tab, then add each index:

#### Index 1: voice_idx
- **Key**: `voice_idx`
- **Type**: Key
- **Attributes**: `voice` (ASC)
- Click **"Create"**

#### Index 2: created_idx
- **Key**: `created_idx`
- **Type**: Key
- **Attributes**: `createdAt` (DESC)
- Click **"Create"**

#### Index 3: file_idx
- **Key**: `file_idx`
- **Type**: Key
- **Attributes**: `fileId` (ASC)
- Click **"Create"**

✅ **Collection 1 Complete!**

---

## 📊 Collection 2: TTS Usage

### Create Collection

1. Click **"Create Collection"** button
2. Enter Collection ID: `tts_usage`
3. Enter Collection Name: `TTS Usage`
4. Click **"Create"**

### Configure Permissions

1. Go to **Settings** tab
2. **Enable Document Security**:
   - Find "Document Security" section
   - Toggle **ON** (enabled)
3. **Set Collection Permissions**:
   - Find "Permissions" section
   - **Leave it EMPTY** (no roles)
4. Click **"Update"**

**Note**: Document-level permissions ensure users can only see their own usage data. See `APPWRITE_TTS_PERMISSIONS_GUIDE.md` for details.

### Add Attributes

Click **"Attributes"** tab, then add each attribute:

#### Attribute 1: userId
- **Type**: String
- **Key**: `userId`
- **Size**: `100`
- **Required**: ✅ Yes
- **Array**: ❌ No
- **Default**: (leave empty)
- Click **"Create"**

#### Attribute 2: charCount
- **Type**: Integer
- **Key**: `charCount`
- **Required**: ✅ Yes
- **Array**: ❌ No
- **Min**: `0`
- **Max**: `1000000`
- **Default**: (leave empty)
- Click **"Create"**

#### Attribute 3: voice
- **Type**: String
- **Key**: `voice`
- **Size**: `50`
- **Required**: ✅ Yes
- **Array**: ❌ No
- **Default**: (leave empty)
- Click **"Create"**

#### Attribute 4: timestamp
- **Type**: DateTime
- **Key**: `timestamp`
- **Required**: ✅ Yes
- **Array**: ❌ No
- **Default**: (leave empty)
- Click **"Create"**

### Add Indexes

Click **"Indexes"** tab, then add each index:

#### Index 1: user_idx
- **Key**: `user_idx`
- **Type**: Key
- **Attributes**: `userId` (ASC)
- Click **"Create"**

#### Index 2: timestamp_idx
- **Key**: `timestamp_idx`
- **Type**: Key
- **Attributes**: `timestamp` (DESC)
- Click **"Create"**

#### Index 3: user_timestamp_idx
- **Key**: `user_timestamp_idx`
- **Type**: Key
- **Attributes**: `userId` (ASC), `timestamp` (DESC)
- Click **"Create"**

#### Index 4: voice_idx
- **Key**: `voice_idx`
- **Type**: Key
- **Attributes**: `voice` (ASC)
- Click **"Create"**

✅ **Collection 2 Complete!**

---

## � Understanding Permissions

### Document-Level Security

Both collections use **document-level permissions** for security:

**TTS Cache Metadata** (Shared):
- ✅ Anyone can read (shared cache saves API costs)
- ✅ Authenticated users can update/delete
- ✅ No sensitive data stored

**TTS Usage** (Private):
- ✅ Only owner can read their usage
- ✅ Only owner can update/delete
- ✅ Complete privacy per user

### Why This Approach?

1. **Cost Savings**: Shared cache reduces API calls by 90%
2. **Privacy**: Users can't see others' usage data
3. **Security**: Each document has specific permissions
4. **Flexibility**: Easy to customize per use case

### Learn More

See `APPWRITE_TTS_PERMISSIONS_GUIDE.md` for:
- Detailed permission explanations
- Testing permission boundaries
- Custom configurations
- Troubleshooting permission issues

---

## �🔧 Update Environment Variables

Add these to your `.env` file:

```env
# TTS Collections (add these lines)
VITE_TTS_CACHE_COLLECTION_ID=tts_cache_metadata
VITE_TTS_USAGE_COLLECTION_ID=tts_usage
```

---

## ✅ Verify Setup

### Test in Browser Console

1. Open your app in browser
2. Open Developer Console (F12)
3. Run this test:

```javascript
// Test TTS
import { speak, VOICES } from './tts';

await speak("Hello, this is a test!", {
  voice: VOICES.KORE,
  userId: 'test-user-123',
});

// Check if it worked
console.log('TTS test complete!');
```

### Check Appwrite Console

1. Go to **Databases** → **TTS Cache Metadata**
2. You should see a new document with:
   - `text`: "Hello, this is a test!"
   - `voice`: "Kore"
   - `fileId`: (some hash)
   - `createdAt`: (current timestamp)
   - `charCount`: 24

3. Go to **Databases** → **TTS Usage**
4. You should see a new document with:
   - `userId`: "test-user-123"
   - `charCount`: 24
   - `voice`: "Kore"
   - `timestamp`: (current timestamp)

5. Go to **Storage** → Your bucket
6. You should see a new audio file (WAV format)

---

## 🎯 Collection Summary

### tts_cache_metadata

**Purpose**: Stores metadata about cached audio files

| Attribute | Type | Size | Required | Description |
|-----------|------|------|----------|-------------|
| text | String | 500 | ✅ | First 500 chars of text |
| voice | String | 50 | ✅ | Voice name (Kore, Puck, etc.) |
| fileId | String | 100 | ✅ | Storage file ID (SHA-256 hash) |
| createdAt | DateTime | - | ✅ | When cached |
| charCount | Integer | - | ✅ | Character count |

**Indexes**:
- `voice_idx` on `voice`
- `created_idx` on `createdAt`
- `file_idx` on `fileId`

### tts_usage

**Purpose**: Tracks per-user TTS usage for quota management

| Attribute | Type | Size | Required | Description |
|-----------|------|------|----------|-------------|
| userId | String | 100 | ✅ | User ID |
| charCount | Integer | - | ✅ | Characters used |
| voice | String | 50 | ✅ | Voice used |
| timestamp | DateTime | - | ✅ | When used |

**Indexes**:
- `user_idx` on `userId`
- `timestamp_idx` on `timestamp`
- `user_timestamp_idx` on `userId, timestamp`
- `voice_idx` on `voice`

---

## 🔒 Security Best Practices

### Permissions

Both collections use **user-level permissions**:
- Users can only create/read/update/delete their own documents
- This is automatically handled by Appwrite's permission system

### Storage

Audio files are stored in your existing bucket:
- Bucket ID: `6995f259001c9af55009`
- Files are named with SHA-256 hashes (no personal data in filenames)
- Files are accessible via secure URLs

### API Key

Your Gemini API key is stored in `.env`:
- Never commit `.env` to git
- Key is only used server-side (Vite environment variables)
- No client-side exposure

---

## 📊 Monitoring & Maintenance

### Check Usage

```javascript
import { getUserStats, getMonthlyUsage } from './tts';

// Get monthly usage for a user
const used = await getMonthlyUsage('user-id');
console.log(`Used ${used} characters this month`);

// Get detailed stats
const stats = await getUserStats('user-id');
console.log(stats);
// {
//   totalChars: 45000,
//   totalRequests: 120,
//   voiceUsage: { 'Kore': 30000, 'Puck': 15000 },
//   lastUsed: '2026-05-15T10:30:00Z'
// }
```

### Clear Old Cache

```javascript
import { clearOldCache } from './tts';

// Clear cache entries older than 30 days
const deleted = await clearOldCache();
console.log(`Deleted ${deleted} old cache entries`);
```

### View in Appwrite Console

1. **Cache Metadata**: Databases → tts_cache_metadata
   - See all cached audio files
   - Check creation dates
   - Monitor storage usage

2. **Usage Tracking**: Databases → tts_usage
   - See per-user usage
   - Filter by date range
   - Export to CSV for analysis

---

## 🐛 Troubleshooting

### Error: "Collection not found"

**Solution**: Make sure collection IDs match exactly:
- `tts_cache_metadata` (not `tts-cache-metadata`)
- `tts_usage` (not `tts-usage`)

### Error: "Attribute not found"

**Solution**: Check attribute names are exact:
- `userId` (not `user_id`)
- `charCount` (not `char_count`)
- `createdAt` (not `created_at`)

### Error: "Permission denied"

**Solution**: 
1. Check collection permissions include `users`
2. Make sure user is authenticated
3. Verify `userId` matches authenticated user

### Error: "File not found in storage"

**Solution**:
1. Check storage bucket ID is correct
2. Verify bucket permissions allow file creation
3. Check file size limits (default: 50MB)

### Cache not working

**Solution**:
1. Check if documents are being created in `tts_cache_metadata`
2. Verify `fileId` matches storage file ID
3. Check indexes are created correctly

---

## 📈 Performance Tips

### Indexes

Indexes speed up queries:
- `user_timestamp_idx` makes monthly usage queries fast
- `voice_idx` helps filter by voice
- `created_idx` helps with cache cleanup

### Caching Strategy

The system automatically:
- Caches all TTS requests
- Uses SHA-256 hash as cache key
- Checks cache before API call
- Saves ~90% on API costs

### Quota Management

Default: 100,000 chars/month per user

To change, edit `src/tts/useTTS.js`:
```javascript
const MONTHLY_CHAR_LIMIT = 100000; // Change this
```

---

## 🎉 You're Done!

Your Appwrite TTS setup is complete! 

### Next Steps

1. ✅ Test basic TTS: `await speak("Hello!")`
2. ✅ Test caching: Call same text twice (2nd should be instant)
3. ✅ Test quota: Check `getMonthlyUsage()`
4. ✅ Test multi-speaker: Try `speakConversation()`

### Resources

- **Complete Guide**: `GEMINI_TTS_GUIDE.md`
- **Quick Reference**: `TTS_QUICK_REFERENCE.md`
- **API Docs**: Inline JSDoc comments in `src/tts/`

---

**Need Help?**
- Check error messages in browser console
- Verify collection IDs in Appwrite Console
- Review permissions settings
- Test with simple examples first
