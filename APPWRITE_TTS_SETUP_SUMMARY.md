# Appwrite TTS Setup - Complete Summary

## 📚 Available Setup Guides

I've created **4 comprehensive guides** for setting up Appwrite TTS:

### 1. 🚀 Automated Setup (Recommended)
**File**: `APPWRITE_TTS_SETUP_AUTOMATED.md`

- **Time**: 1 minute
- **Method**: Run automated script
- **Command**: `npm run setup:tts`
- **Best for**: Quick setup, beginners

### 2. 📖 Manual Setup (Detailed)
**File**: `APPWRITE_TTS_SETUP.md`

- **Time**: 5 minutes
- **Method**: Step-by-step in Appwrite Console
- **Best for**: Learning, troubleshooting

### 3. 🎨 Visual Guide (Screenshots)
**File**: `APPWRITE_TTS_VISUAL_GUIDE.md`

- **Time**: 5 minutes
- **Method**: Visual walkthrough with placeholders
- **Best for**: First-time Appwrite users

### 4. 📝 Quick Reference
**File**: `TTS_QUICK_REFERENCE.md`

- **Time**: 30 seconds
- **Method**: Quick command reference
- **Best for**: Experienced developers

---

## ⚡ Quick Start (Choose One)

### Option A: Automated (1 minute)

```bash
# 1. Get Appwrite API key from console
# 2. Add to .env:
APPWRITE_API_KEY=your_key_here

# 3. Install dependencies
npm install

# 4. Run setup script
npm run setup:tts

# 5. Add to .env:
VITE_TTS_CACHE_COLLECTION_ID=tts_cache_metadata
VITE_TTS_USAGE_COLLECTION_ID=tts_usage

# 6. Restart dev server
npm run dev
```

### Option B: Manual (5 minutes)

1. Go to Appwrite Console
2. Create 2 collections:
   - `tts_cache_metadata` (5 attributes, 3 indexes)
   - `tts_usage` (4 attributes, 4 indexes)
3. Add to `.env`:
   ```env
   VITE_TTS_CACHE_COLLECTION_ID=tts_cache_metadata
   VITE_TTS_USAGE_COLLECTION_ID=tts_usage
   ```
4. Restart dev server

---

## 📦 What Gets Created

### Collection 1: tts_cache_metadata

**Purpose**: Stores metadata about cached audio files

| Attribute | Type | Size | Description |
|-----------|------|------|-------------|
| text | String | 500 | First 500 chars of text |
| voice | String | 50 | Voice name (Kore, Puck, etc.) |
| fileId | String | 100 | Storage file ID (SHA-256 hash) |
| createdAt | DateTime | - | When cached |
| charCount | Integer | - | Character count |

**Indexes**:
- `voice_idx` - Fast voice filtering
- `created_idx` - Fast date sorting
- `file_idx` - Fast file lookup

### Collection 2: tts_usage

**Purpose**: Tracks per-user TTS usage for quota management

| Attribute | Type | Size | Description |
|-----------|------|------|-------------|
| userId | String | 100 | User ID |
| charCount | Integer | - | Characters used |
| voice | String | 50 | Voice used |
| timestamp | DateTime | - | When used |

**Indexes**:
- `user_idx` - Fast user lookup
- `timestamp_idx` - Fast date sorting
- `user_timestamp_idx` - Fast monthly usage queries
- `voice_idx` - Fast voice filtering

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Collections created in Appwrite Console
- [ ] All attributes present and "Available"
- [ ] All indexes created successfully
- [ ] Environment variables added to `.env`
- [ ] Dev server restarted
- [ ] Test TTS works: `await speak("Hello!")`
- [ ] Check cache: 2nd call should be instant
- [ ] Verify storage: Audio file created in bucket
- [ ] Check usage: Document created in `tts_usage`

---

## 🧪 Test Commands

### Basic Test

```javascript
import { speak, VOICES } from './tts';

await speak("Hello, this is a test!", {
  voice: VOICES.KORE,
  userId: 'test-user',
});
```

### Cache Test

```javascript
// First call - should take 2-5 seconds
await speak("Test caching", { userId: 'test' });

// Second call - should be instant (< 100ms)
await speak("Test caching", { userId: 'test' });
```

### Quota Test

```javascript
import { checkQuota, getMonthlyUsage } from './tts';

const used = await getMonthlyUsage('test-user');
console.log(`Used: ${used} characters`);

const quota = await checkQuota('test-user', 500);
console.log(`Remaining: ${quota.remaining} characters`);
```

### Multi-Speaker Test

```javascript
import { speakConversation } from './tts';

const speakers = [
  { name: 'Teacher', voice: VOICES.KORE },
  { name: 'Student', voice: VOICES.PUCK },
];

const script = [
  { speaker: 'Teacher', line: 'Hello!' },
  { speaker: 'Student', line: 'Hi there!' },
];

await speakConversation(speakers, script, { userId: 'test' });
```

---

## 🔧 Environment Variables

### Required (Already in .env)

```env
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=69958be2003344c314a1
VITE_APPWRITE_DATABASE_ID=69f742a2001f393e4b85
VITE_APPWRITE_STORAGE_BUCKET_ID=6995f259001c9af55009
VITE_GEMINI_API_KEY=AIzaSyCCjuUlmu9UktPggVO2EcAgXFSegBIMMJI
```

### To Add (After Setup)

```env
# TTS Collections
VITE_TTS_CACHE_COLLECTION_ID=tts_cache_metadata
VITE_TTS_USAGE_COLLECTION_ID=tts_usage
```

### Optional (For Setup Script)

```env
# Only needed for automated setup script
APPWRITE_API_KEY=your_api_key_here
```

---

## 📊 Cost Analysis

### Gemini API Costs

- **Free Tier**: 1M characters/month
- **Paid**: ~$0.10 per 1M characters

### With Caching (90% hit rate)

| Users | Monthly Chars | API Calls | Cost |
|-------|--------------|-----------|------|
| 10 | 1M | 100k | Free |
| 100 | 10M | 1M | ~$0.10 |
| 1,000 | 100M | 10M | ~$1.00 |
| 10,000 | 1B | 100M | ~$10.00 |

### Appwrite Storage Costs

- **Free Tier**: 2GB storage
- **Paid**: ~$0.02 per GB/month

**Average audio file**: ~50KB
- 1,000 files = 50MB
- 10,000 files = 500MB
- 100,000 files = 5GB (~$0.10/month)

---

## 🎯 Next Steps After Setup

### 1. Test Basic Functionality

```javascript
import { speak, VOICES } from './tts';
await speak("Hello!", { voice: VOICES.KORE, userId: user.$id });
```

### 2. Integrate into Components

Replace old Web Speech API calls:

**Before:**
```javascript
import { speak } from './utils/speech';
speak(text, langCode);
```

**After:**
```javascript
import { speak, VOICES } from './tts';
speak(text, { voice: VOICES.KORE, userId: user.$id });
```

### 3. Use React Hook

```javascript
import { useTTS } from './tts/useTTSHook';

function MyComponent() {
  const { speak, isPlaying } = useTTS({ userId: user.$id });
  
  return (
    <button onClick={() => speak("Hello!")}>
      {isPlaying ? 'Speaking...' : 'Speak'}
    </button>
  );
}
```

### 4. Monitor Usage

```javascript
import { getUserStats } from './tts';

const stats = await getUserStats(user.$id);
console.log(`Total: ${stats.totalChars} chars`);
console.log(`Requests: ${stats.totalRequests}`);
```

---

## 📚 Documentation Index

### Setup Guides
- `APPWRITE_TTS_SETUP_AUTOMATED.md` - Automated setup (1 min)
- `APPWRITE_TTS_SETUP.md` - Manual setup (5 min)
- `APPWRITE_TTS_VISUAL_GUIDE.md` - Visual walkthrough
- `APPWRITE_TTS_SETUP_SUMMARY.md` - This file

### Usage Guides
- `GEMINI_TTS_GUIDE.md` - Complete guide (100+ examples)
- `TTS_QUICK_REFERENCE.md` - Quick reference card
- `GEMINI_TTS_COMPLETE.md` - Implementation summary

### Code
- `src/tts/` - All TTS modules
- `scripts/setup-tts-collections.js` - Automated setup script

---

## 🐛 Common Issues

### Issue: "Collection not found"

**Cause**: Collection IDs don't match

**Solution**: 
- Use exact IDs: `tts_cache_metadata` and `tts_usage`
- Check for typos in `.env`

### Issue: "Attribute not found"

**Cause**: Attributes not created or still processing

**Solution**:
- Wait 30 seconds after creating attributes
- Check attribute status is "Available"
- Refresh Appwrite Console

### Issue: "Permission denied"

**Cause**: User not authenticated or wrong permissions

**Solution**:
- Verify user is logged in
- Check collection permissions include "users" role
- Test with different user

### Issue: "API key invalid"

**Cause**: Wrong API key or insufficient permissions

**Solution**:
- Verify API key is correct
- Check API key has database permissions
- Generate new API key if needed

### Issue: "Cache not working"

**Cause**: Storage or collection issues

**Solution**:
- Check storage bucket ID is correct
- Verify files are being created in storage
- Check `tts_cache_metadata` documents

---

## 🎉 You're Ready!

Your Appwrite TTS system is now set up and ready to use!

### Quick Links

- **Start Here**: `APPWRITE_TTS_SETUP_AUTOMATED.md`
- **Full Guide**: `GEMINI_TTS_GUIDE.md`
- **Quick Ref**: `TTS_QUICK_REFERENCE.md`
- **Troubleshooting**: See any setup guide

### Support

- Check browser console for errors
- Verify Appwrite Console shows collections
- Test with simple examples first
- Review documentation for detailed help

---

**Happy coding! 🚀**
