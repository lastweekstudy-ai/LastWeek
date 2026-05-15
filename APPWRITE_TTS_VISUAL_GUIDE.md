# Appwrite TTS Visual Setup Guide

Step-by-step visual guide with screenshots for setting up TTS collections.

## 🎯 Choose Your Setup Method

### Option 1: Automated Setup (Recommended) ⚡

**Time**: 1 minute  
**Difficulty**: Easy  
**Best for**: Quick setup, less prone to errors

👉 **[Jump to Automated Setup](#automated-setup)**

### Option 2: Manual Setup 🔧

**Time**: 5 minutes  
**Difficulty**: Medium  
**Best for**: Learning, troubleshooting, custom configurations

👉 **[Jump to Manual Setup](#manual-setup)**

---

## Automated Setup

### Step 1: Get Appwrite API Key

1. **Go to Appwrite Console**
   - URL: https://cloud.appwrite.io
   - Log in to your account

2. **Select Your Project**
   - Project ID: `69958be2003344c314a1`

3. **Navigate to API Keys**
   ```
   Left Sidebar → Settings → API Keys
   ```

4. **Create New API Key**
   - Click **"Create API Key"** button
   - Name: `TTS Setup Script`
   - Expiration: Never (or set your preference)

5. **Select Scopes**
   - Expand **"Database"** section
   - Check **ALL** database permissions:
     - ✅ `databases.read`
     - ✅ `databases.write`
     - ✅ `collections.read`
     - ✅ `collections.write`
     - ✅ `attributes.read`
     - ✅ `attributes.write`
     - ✅ `indexes.read`
     - ✅ `indexes.write`
     - ✅ `documents.read`
     - ✅ `documents.write`

6. **Create and Copy**
   - Click **"Create"**
   - Copy the API key (you won't see it again!)

### Step 2: Add API Key to .env

Open your `.env` file and add:

```env
# Appwrite API Key (for setup scripts)
APPWRITE_API_KEY=your_api_key_here
```

**Example:**
```env
APPWRITE_API_KEY=standard_4394307ceb4f8cc92e625ed28b9cd85db624331430b62bf3a3268df0a9aa8117092e3bf31c1bfce8922a96ca3a5e54f37bf2a4ffe7d46e4a042a79b46dc856324d0f328f556121b5992d424ad65a3053714f5630ce14bc75ae0e060d2035ae2ca7309ba179a7f71b852e3de1af253983f9d0f55279c5c7664af3b139d90031e2
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install `dotenv` which is needed for the setup script.

### Step 4: Run Setup Script

```bash
npm run setup:tts
```

**Expected Output:**

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
```

### Step 5: Update .env

Add these lines to your `.env` file:

```env
# TTS Collections
VITE_TTS_CACHE_COLLECTION_ID=tts_cache_metadata
VITE_TTS_USAGE_COLLECTION_ID=tts_usage
```

### Step 6: Verify in Appwrite Console

1. Go to **Databases** → Your database
2. You should see 2 new collections:
   - **TTS Cache Metadata**
   - **TTS Usage**

### Step 7: Test TTS

Restart your dev server:
```bash
npm run dev
```

Open browser console and test:
```javascript
import { speak, VOICES } from './tts';

await speak("Hello, this is a test!", {
  voice: VOICES.KORE,
  userId: 'test-user',
});
```

✅ **Done!** If you hear audio, setup is complete!

---

## Manual Setup

### Collection 1: TTS Cache Metadata

#### 1. Create Collection

**Navigation:**
```
Appwrite Console → Databases → Your Database → Create Collection
```

**Settings:**
- Collection ID: `tts_cache_metadata`
- Collection Name: `TTS Cache Metadata`

**Screenshot Placeholder:**
```
┌─────────────────────────────────────┐
│ Create Collection                   │
├─────────────────────────────────────┤
│ Collection ID:                      │
│ [tts_cache_metadata            ]    │
│                                     │
│ Collection Name:                    │
│ [TTS Cache Metadata            ]    │
│                                     │
│         [Cancel]  [Create]          │
└─────────────────────────────────────┘
```

#### 2. Configure Permissions

**Navigation:**
```
Collection → Settings → Permissions
```

**Add Permissions:**
- Click **"Add Role"**
- Select **"Users"**
- Check: ✅ Create, ✅ Read, ✅ Update, ✅ Delete

**Screenshot Placeholder:**
```
┌─────────────────────────────────────┐
│ Permissions                         │
├─────────────────────────────────────┤
│ Role: Users                         │
│ ✅ Create                           │
│ ✅ Read                             │
│ ✅ Update                           │
│ ✅ Delete                           │
└─────────────────────────────────────┘
```

#### 3. Add Attributes

**Navigation:**
```
Collection → Attributes → Create Attribute
```

**Attribute 1: text**
```
Type: String
Key: text
Size: 500
Required: ✅ Yes
Array: ❌ No
```

**Attribute 2: voice**
```
Type: String
Key: voice
Size: 50
Required: ✅ Yes
Array: ❌ No
```

**Attribute 3: fileId**
```
Type: String
Key: fileId
Size: 100
Required: ✅ Yes
Array: ❌ No
```

**Attribute 4: createdAt**
```
Type: DateTime
Key: createdAt
Required: ✅ Yes
Array: ❌ No
```

**Attribute 5: charCount**
```
Type: Integer
Key: charCount
Required: ✅ Yes
Min: 0
Max: 1000000
Array: ❌ No
```

**Screenshot Placeholder:**
```
┌─────────────────────────────────────┐
│ Attributes                          │
├─────────────────────────────────────┤
│ ✅ text (string, 500)               │
│ ✅ voice (string, 50)               │
│ ✅ fileId (string, 100)             │
│ ✅ createdAt (datetime)             │
│ ✅ charCount (integer)              │
└─────────────────────────────────────┘
```

#### 4. Add Indexes

**Navigation:**
```
Collection → Indexes → Create Index
```

**Index 1: voice_idx**
```
Key: voice_idx
Type: Key
Attributes: voice (ASC)
```

**Index 2: created_idx**
```
Key: created_idx
Type: Key
Attributes: createdAt (DESC)
```

**Index 3: file_idx**
```
Key: file_idx
Type: Key
Attributes: fileId (ASC)
```

**Screenshot Placeholder:**
```
┌─────────────────────────────────────┐
│ Indexes                             │
├─────────────────────────────────────┤
│ ✅ voice_idx (voice ASC)            │
│ ✅ created_idx (createdAt DESC)     │
│ ✅ file_idx (fileId ASC)            │
└─────────────────────────────────────┘
```

✅ **Collection 1 Complete!**

---

### Collection 2: TTS Usage

#### 1. Create Collection

**Settings:**
- Collection ID: `tts_usage`
- Collection Name: `TTS Usage`

#### 2. Configure Permissions

**Add Permissions:**
- Role: **Users**
- Check: ✅ Create, ✅ Read, ✅ Update, ✅ Delete

#### 3. Add Attributes

**Attribute 1: userId**
```
Type: String
Key: userId
Size: 100
Required: ✅ Yes
```

**Attribute 2: charCount**
```
Type: Integer
Key: charCount
Required: ✅ Yes
Min: 0
Max: 1000000
```

**Attribute 3: voice**
```
Type: String
Key: voice
Size: 50
Required: ✅ Yes
```

**Attribute 4: timestamp**
```
Type: DateTime
Key: timestamp
Required: ✅ Yes
```

**Screenshot Placeholder:**
```
┌─────────────────────────────────────┐
│ Attributes                          │
├─────────────────────────────────────┤
│ ✅ userId (string, 100)             │
│ ✅ charCount (integer)              │
│ ✅ voice (string, 50)               │
│ ✅ timestamp (datetime)             │
└─────────────────────────────────────┘
```

#### 4. Add Indexes

**Index 1: user_idx**
```
Key: user_idx
Type: Key
Attributes: userId (ASC)
```

**Index 2: timestamp_idx**
```
Key: timestamp_idx
Type: Key
Attributes: timestamp (DESC)
```

**Index 3: user_timestamp_idx**
```
Key: user_timestamp_idx
Type: Key
Attributes: userId (ASC), timestamp (DESC)
```

**Index 4: voice_idx**
```
Key: voice_idx
Type: Key
Attributes: voice (ASC)
```

**Screenshot Placeholder:**
```
┌─────────────────────────────────────┐
│ Indexes                             │
├─────────────────────────────────────┤
│ ✅ user_idx (userId ASC)            │
│ ✅ timestamp_idx (timestamp DESC)   │
│ ✅ user_timestamp_idx (multi)       │
│ ✅ voice_idx (voice ASC)            │
└─────────────────────────────────────┘
```

✅ **Collection 2 Complete!**

---

## Final Steps

### Update .env

Add these lines:

```env
# TTS Collections
VITE_TTS_CACHE_COLLECTION_ID=tts_cache_metadata
VITE_TTS_USAGE_COLLECTION_ID=tts_usage
```

### Restart Dev Server

```bash
npm run dev
```

### Test TTS

```javascript
import { speak, VOICES } from './tts';

await speak("Hello!", {
  voice: VOICES.KORE,
  userId: 'test-user',
});
```

---

## 🎉 Setup Complete!

Your Appwrite TTS system is ready to use!

### Next Steps

1. ✅ Test basic TTS
2. ✅ Test caching (2nd call should be instant)
3. ✅ Test quota management
4. ✅ Integrate into your components

### Resources

- **Complete Guide**: `GEMINI_TTS_GUIDE.md`
- **Quick Reference**: `TTS_QUICK_REFERENCE.md`
- **Automated Setup**: `APPWRITE_TTS_SETUP_AUTOMATED.md`
- **Manual Setup**: `APPWRITE_TTS_SETUP.md`

---

## 🐛 Troubleshooting

### Collections Not Showing

**Solution**: Refresh the page, wait a few seconds for Appwrite to sync

### Attributes Not Creating

**Solution**: Wait 30 seconds between creating attributes (Appwrite needs time to process)

### Indexes Failing

**Solution**: Make sure all attributes are created and in "Available" status before creating indexes

### Permission Errors

**Solution**: 
1. Check permissions include "users" role
2. Verify user is authenticated
3. Test with a different user

### API Key Issues

**Solution**:
1. Verify API key has database permissions
2. Check API key hasn't expired
3. Make sure API key is in `.env` file

---

## 📞 Need Help?

- Check error messages in browser console
- Verify collection IDs match exactly
- Review permissions settings
- Test with simple examples first
- See `GEMINI_TTS_GUIDE.md` for complete documentation
