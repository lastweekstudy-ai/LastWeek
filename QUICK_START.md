# LastWeek - Quick Start Guide

Get up and running in 10 minutes!

---

## Step 1: Install Dependencies (2 min)

```bash
cd lastweek
npm install
```

---

## Step 2: Set Up Appwrite (5 min)

### Option A: Use Appwrite Cloud (Easiest)
1. Go to https://cloud.appwrite.io
2. Create account
3. Create new project
4. Copy Project ID

### Option B: Self-Host Appwrite
```bash
docker run -d \
  --name=appwrite \
  -p 80:80 -p 443:443 \
  appwrite/appwrite:latest
```

---

## Step 3: Configure Environment (1 min)

Create `.env` file:

```env
# Appwrite
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here

# Database & Collections (use these exact IDs)
VITE_APPWRITE_DATABASE_ID=lastweek_db
VITE_APPWRITE_SESSIONS_COLLECTION_ID=sessions
VITE_APPWRITE_MESSAGES_COLLECTION_ID=messages
VITE_APPWRITE_FILES_COLLECTION_ID=file_attachments
VITE_APPWRITE_FLASHCARDS_COLLECTION_ID=flashcards
VITE_APPWRITE_USER_PROFILES_COLLECTION_ID=user_profiles
VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID=pdf_resources
VITE_APPWRITE_PDF_NOTES_COLLECTION_ID=pdf_notes
VITE_APPWRITE_PDF_HIGHLIGHTS_COLLECTION_ID=pdf_highlights

# Storage
VITE_APPWRITE_STORAGE_BUCKET_ID=study_files

# AI Keys
VITE_GEMINI_API_KEY=your_gemini_key
VITE_DEEPSEEK_API_KEY=your_deepseek_key
```

**Get API Keys**:
- Gemini: https://makersuite.google.com/app/apikey
- DeepSeek: https://platform.deepseek.com

---

## Step 4: Create Appwrite Database (2 min)

### Quick Setup Script
Run this in Appwrite Console → Database → SQL:

```sql
-- Or use the Appwrite Console UI to create:
-- 1. Database: lastweek_db
-- 2. Collections: sessions, messages, file_attachments, flashcards, 
--    user_profiles, pdf_resources, pdf_notes, pdf_highlights
-- 3. Storage Bucket: study_files
```

**OR** Follow detailed guide: `APPWRITE_COMPLETE_SETUP.md`

### Minimum Required Collections

**sessions**:
- userId (string, 255)
- mode (string, 50)
- subject (string, 255)
- title (string, 255)
- createdAt (string, 50)
- updatedAt (string, 50)

**messages**:
- sessionId (string, 255)
- userId (string, 255)
- role (string, 50)
- content (string, 1000000) ← **Important: Must be 1000000 for PDF context**
- timestamp (string, 50)

**pdf_resources**:
- userId (string, 255)
- sessionId (string, 255)
- fileName (string, 255)
- fileSize (integer)
- storageFileId (string, 255)
- extractedText (string, 1000000) ← **Important: Must be 1000000**
- uploadedAt (string, 50)

**Storage Bucket** (study_files):
- File size limit: 50MB
- Allowed extensions: pdf,png,jpg,jpeg,gif,svg,txt,doc,docx

---

## Step 5: Run the App (30 sec)

```bash
npm run dev
```

Open http://localhost:5173

---

## Step 6: Test Features (2 min)

1. **Register** a new account
2. **Create** a study session
3. **Upload** a PDF
4. **Ask** questions about the PDF
5. **Try** different study modes

---

## Common Issues

### "Collection not found"
→ Check collection IDs in `.env` match Appwrite exactly

### "Permission denied"
→ Set permissions to `user:[USER_ID]` for all collections

### "PDF text empty"
→ Re-upload PDF, check `extractedText` attribute size is 1000000

### "AI not responding"
→ Check API keys, check console for errors

---

## Keyboard Shortcuts

- `Ctrl + K` - Show shortcuts
- `Ctrl + D` - Dashboard
- `Ctrl + N` - New session
- `Ctrl + Shift + T` - Toggle theme

---

## Next Steps

- Read `PROJECT_DOCUMENTATION.md` for full details
- Check `APPWRITE_COMPLETE_SETUP.md` for complete setup
- Review `TROUBLESHOOTING.md` if you have issues

---

## Need Help?

1. Check console logs (F12)
2. Review documentation files
3. Check Appwrite logs
4. Create GitHub issue

---

**You're ready to study smarter with LastWeek! 🚀**
