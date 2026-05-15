# Automated Appwrite TTS Setup

## 🚀 Quick Setup (1 minute)

Use the automated script to create all collections and attributes automatically.

### Prerequisites

1. **Appwrite API Key** with database permissions
2. **Environment variables** configured in `.env`

### Step 1: Get API Key

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Select your project
3. Go to **Settings** → **API Keys**
4. Click **"Create API Key"**
5. Name: `TTS Setup Script`
6. Scopes: Select **Database** → Check all permissions
7. Click **"Create"**
8. Copy the API key

### Step 2: Add API Key to .env

Add this line to your `.env` file:

```env
APPWRITE_API_KEY=your_api_key_here
```

### Step 3: Run Setup Script

```bash
node scripts/setup-tts-collections.js
```

### Expected Output

```
🚀 Appwrite TTS Collections Setup

Configuration:
  Endpoint: https://sgp.cloud.appwrite.io/v1
  Project: 69958be2003344c314a1
  Database: 69f742a2001f393e4b85

📦 Creating TTS Cache Metadata collection...
✅ Collection created
  Adding attributes...
    ✅ text (string, 500)
    ✅ voice (string, 50)
    ✅ fileId (string, 100)
    ✅ createdAt (datetime)
    ✅ charCount (integer)
  Waiting for attributes to be ready...
  Creating indexes...
    ✅ voice_idx
    ✅ created_idx
    ✅ file_idx
✅ TTS Cache Metadata collection setup complete!

📊 Creating TTS Usage collection...
✅ Collection created
  Adding attributes...
    ✅ userId (string, 100)
    ✅ charCount (integer)
    ✅ voice (string, 50)
    ✅ timestamp (datetime)
  Waiting for attributes to be ready...
  Creating indexes...
    ✅ user_idx
    ✅ timestamp_idx
    ✅ user_timestamp_idx
    ✅ voice_idx
✅ TTS Usage collection setup complete!

🔍 Verifying setup...

✅ TTS Cache Metadata (tts_cache_metadata)
   Attributes: 5
   Indexes: 3
✅ TTS Usage (tts_usage)
   Attributes: 4
   Indexes: 4

✅ All collections verified!

📝 Environment variables to add to .env:

# TTS Collections
VITE_TTS_CACHE_COLLECTION_ID=tts_cache_metadata
VITE_TTS_USAGE_COLLECTION_ID=tts_usage

🎉 Setup complete!

Next steps:
  1. Add the environment variables above to your .env file
  2. Restart your development server
  3. Test TTS: await speak("Hello!", { userId: "test" })
```

### Step 4: Update .env

Add these lines to your `.env` file:

```env
# TTS Collections
VITE_TTS_CACHE_COLLECTION_ID=tts_cache_metadata
VITE_TTS_USAGE_COLLECTION_ID=tts_usage
```

### Step 5: Restart Dev Server

```bash
npm run dev
```

### Step 6: Test TTS

Open browser console and run:

```javascript
import { speak, VOICES } from './tts';

await speak("Hello, this is a test!", {
  voice: VOICES.KORE,
  userId: 'test-user',
});
```

---

## 🐛 Troubleshooting

### Error: "Missing required environment variables"

**Solution**: Make sure your `.env` file contains:
```env
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=69958be2003344c314a1
VITE_APPWRITE_DATABASE_ID=69f742a2001f393e4b85
APPWRITE_API_KEY=your_api_key_here
```

### Error: "Unauthorized"

**Solution**: 
1. Check API key is correct
2. Verify API key has **Database** permissions
3. Make sure API key hasn't expired

### Error: "Collection already exists"

**Solution**: This is normal if you've run the script before. The script will skip existing collections.

### Error: "Attribute not found"

**Solution**: Wait a few seconds for attributes to be created, then run the script again.

---

## 📋 Manual Setup Alternative

If the automated script doesn't work, follow the manual setup guide:
- See `APPWRITE_TTS_SETUP.md` for step-by-step instructions

---

## ✅ Verification

After setup, verify in Appwrite Console:

1. Go to **Databases** → Your database
2. You should see 2 new collections:
   - **TTS Cache Metadata** (5 attributes, 3 indexes)
   - **TTS Usage** (4 attributes, 4 indexes)

---

## 🎉 You're Done!

Your Appwrite TTS setup is complete!

### Next Steps

1. ✅ Test basic TTS
2. ✅ Test caching (2nd call should be instant)
3. ✅ Test quota management
4. ✅ Integrate into your components

### Resources

- **Complete Guide**: `GEMINI_TTS_GUIDE.md`
- **Quick Reference**: `TTS_QUICK_REFERENCE.md`
- **Manual Setup**: `APPWRITE_TTS_SETUP.md`
