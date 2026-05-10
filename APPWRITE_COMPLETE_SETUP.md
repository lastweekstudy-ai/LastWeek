# Complete Appwrite Setup Guide for LastWeek

## Overview
This guide covers the complete Appwrite backend setup for the LastWeek study application. Follow each step carefully to ensure all features work correctly.

**IMPORTANT**: All datetime fields use String type storing ISO 8601 format strings (e.g., "2024-01-15T10:30:00.000Z"), NOT DateTime type.

---

## Prerequisites

1. **Appwrite Instance**: Self-hosted or cloud instance running
2. **Appwrite CLI**: Installed and configured (optional but recommended)
3. **Admin Access**: To Appwrite console

---

## Step 1: Create Project

1. Log into Appwrite Console
2. Click "Create Project"
3. Name: `LastWeek` (or your preferred name)
4. Copy the **Project ID** - you'll need this for `.env`

---

## Step 2: Configure Environment Variables

Create/update `.env` file in project root:

```env
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here

# Database IDs
VITE_APPWRITE_DATABASE_ID=lastweek_db

# Collection IDs
VITE_APPWRITE_SESSIONS_COLLECTION_ID=sessions
VITE_APPWRITE_MESSAGES_COLLECTION_ID=messages
VITE_APPWRITE_ATTACHMENTS_COLLECTION_ID=file_attachments
VITE_APPWRITE_FLASHCARDS_COLLECTION_ID=flashcards
VITE_APPWRITE_PROFILES_COLLECTION_ID=user_profiles
VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID=pdf_resources
VITE_APPWRITE_PDF_NOTES_COLLECTION_ID=pdf_notes
VITE_APPWRITE_PDF_HIGHLIGHTS_COLLECTION_ID=pdf_highlights

# Storage Bucket ID
VITE_APPWRITE_STORAGE_BUCKET_ID=study_files

# AI API Keys
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

---

## Step 3: Create Database

1. Go to **Databases** in Appwrite Console
2. Click **Create Database**
3. Database ID: `lastweek_db`
4. Name: `LastWeek Database`

---

## Step 4: Create Collections

### Collection 1: Sessions
**Collection ID**: `sessions`

**Attributes**:
| Attribute Name | Type | Size | Required | Array | Default |
|---------------|------|------|----------|-------|---------|
| userId | String | 255 | Yes | No | - |
| mode | String | 255 | Yes | No | - |
| subject | String | 500 | No | No | - |
| title | String | 500 | Yes | No | - |
| createdAt | String | 255 | Yes | No | - |
| updatedAt | String | 255 | Yes | No | - |

**Indexes**:
- `userId_idx`: Key: `userId`, Type: Key, Order: ASC
- `updatedAt_idx`: Key: `updatedAt`, Type: Key, Order: DESC
- `userId_updatedAt_idx`: Keys: `userId`, `updatedAt`, Type: Key, Orders: ASC, DESC (composite index for efficient queries)

**Permissions**:
- Read: `user:[USER_ID]`
- Create: `user:[USER_ID]`
- Update: `user:[USER_ID]`
- Delete: `user:[USER_ID]`

---

### Collection 2: Messages
**Collection ID**: `messages`

**Attributes**:
| Attribute Name | Type | Size | Required | Array | Default |
|---------------|------|------|----------|-------|---------|
| sessionId | String | 255 | Yes | No | - |
| userId | String | 255 | Yes | No | - |
| role | String | 50 | Yes | No | - |
| content | String | 1000000 | Yes | No | - |
| createdAt | String | 255 | Yes | No | - |

**CRITICAL**: `content` must be size 1000000 to store full PDF context with page markers (43,000+ characters)

**Indexes**:
- `sessionId_idx`: Key: `sessionId`, Type: Key, Order: ASC
- `createdAt_idx`: Key: `createdAt`, Type: Key, Order: ASC
- `sessionId_createdAt_idx`: Keys: `sessionId`, `createdAt`, Type: Key, Orders: ASC, ASC (composite index for efficient message loading)
- `userId_idx`: Key: `userId`, Type: Key, Order: ASC

**Permissions**:
- Read: `user:[USER_ID]`
- Create: `user:[USER_ID]`
- Update: `user:[USER_ID]`
- Delete: `user:[USER_ID]`

---

### Collection 3: File Attachments
**Collection ID**: `file_attachments`

**Attributes**:
| Attribute Name | Type | Size | Required | Array | Default |
|---------------|------|------|----------|-------|---------|
| userId | String | 255 | Yes | No | - |
| sessionId | String | 255 | Yes | No | - |
| fileName | String | 255 | Yes | No | - |
| fileType | String | 100 | Yes | No | - |
| fileSize | Integer | - | Yes | No | - |
| fileId | String | 255 | No | No | null |
| content | String | 50000 | No | No | null |
| createdAt | String | 255 | Yes | No | - |

**Indexes**:
- `sessionId_idx`: Key: `sessionId`, Type: Key, Order: ASC
- `userId_idx`: Key: `userId`, Type: Key, Order: ASC
- `createdAt_idx`: Key: `createdAt`, Type: Key, Order: DESC
- `sessionId_createdAt_idx`: Keys: `sessionId`, `createdAt`, Type: Key, Orders: ASC, DESC (composite index)

**Permissions**:
- Read: `user:[USER_ID]`
- Create: `user:[USER_ID]`
- Update: `user:[USER_ID]`
- Delete: `user:[USER_ID]`

---

### Collection 4: Flashcards
**Collection ID**: `flashcards`

**Attributes**:
| Attribute Name | Type | Size | Required | Array | Default |
|---------------|------|------|----------|-------|---------|
| userId | String | 255 | Yes | No | - |
| sessionId | String | 255 | Yes | No | - |
| front | String | 1000 | Yes | No | - |
| back | String | 5000 | Yes | No | - |
| confidence | Integer | - | Yes | No | 0 |
| nextReviewAt | String | 255 | Yes | No | - |
| createdAt | String | 255 | Yes | No | - |

**Indexes**:
- `userId_idx`: Key: `userId`, Type: Key, Order: ASC
- `sessionId_idx`: Key: `sessionId`, Type: Key, Order: ASC
- `nextReviewAt_idx`: Key: `nextReviewAt`, Type: Key, Order: ASC
- `userId_nextReviewAt_idx`: Keys: `userId`, `nextReviewAt`, Type: Key, Orders: ASC, ASC (composite index for due flashcards)
- `createdAt_idx`: Key: `createdAt`, Type: Key, Order: DESC

**Permissions**:
- Read: `user:[USER_ID]`
- Create: `user:[USER_ID]`
- Update: `user:[USER_ID]`
- Delete: `user:[USER_ID]`

---

### Collection 5: User Profiles
**Collection ID**: `user_profiles`

**Attributes**:
| Attribute Name | Type | Size | Required | Array | Default |
|---------------|------|------|----------|-------|---------|
| userId | String | 255 | Yes | No | - |
| displayName | String | 255 | Yes | No | - |
| currentMode | String | 255 | No | No | null |
| totalSessions | Integer | - | Yes | No | 0 |
| createdAt | String | 255 | Yes | No | - |

**Indexes**:
- `userId_idx`: Key: `userId`, Type: Unique, Order: ASC (unique index to ensure one profile per user)

**Permissions**:
- Read: `user:[USER_ID]`
- Create: `user:[USER_ID]`
- Update: `user:[USER_ID]`
- Delete: `user:[USER_ID]`

---

### Collection 6: PDF Resources
**Collection ID**: `pdf_resources`

**Attributes**:
| Attribute Name | Type | Size | Required | Array | Default |
|---------------|------|------|----------|-------|---------|
| userId | String | 255 | Yes | No | - |
| sessionId | String | 255 | Yes | No | - |
| fileName | String | 255 | Yes | No | - |
| fileSize | Integer | - | Yes | No | - |
| storageFileId | String | 255 | Yes | No | - |
| pageCount | Integer | - | No | No | 1 |
| thumbnail | String | 500 | No | No | null |
| extractedText | String | 1000000 | No | No | null |
| notes | String | 1000000 | No | No | "" |
| currentPage | Integer | - | No | No | 1 |
| bookmarks | String | 10000 | No | No | "[]" |
| highlights | String | 10000 | No | No | "[]" |
| tags | String | 1000 | No | No | "" |
| lastAccessedAt | String | 255 | Yes | No | - |
| createdAt | String | 255 | Yes | No | - |

**CRITICAL**: `extractedText` must be size 1000000 to store full PDF text with page markers (43,000+ characters)

**Indexes**:
- `sessionId_idx`: Key: `sessionId`, Type: Key, Order: ASC
- `userId_idx`: Key: `userId`, Type: Key, Order: ASC
- `lastAccessedAt_idx`: Key: `lastAccessedAt`, Type: Key, Order: DESC
- `sessionId_lastAccessedAt_idx`: Keys: `sessionId`, `lastAccessedAt`, Type: Key, Orders: ASC, DESC (composite index)
- `userId_lastAccessedAt_idx`: Keys: `userId`, `lastAccessedAt`, Type: Key, Orders: ASC, DESC (composite index)
- `tags_idx`: Key: `tags`, Type: Fulltext (for searching by file type/tags)

**Permissions**:
- Read: `user:[USER_ID]`
- Create: `user:[USER_ID]`
- Update: `user:[USER_ID]`
- Delete: `user:[USER_ID]`

---

### Collection 7: PDF Notes
**Collection ID**: `pdf_notes`

**Attributes**:
| Attribute Name | Type | Size | Required | Array | Default |
|---------------|------|------|----------|-------|---------|
| userId | String | 255 | Yes | No | - |
| pdfResourceId | String | 255 | Yes | No | - |
| pageNumber | Integer | - | Yes | No | - |
| noteText | String | 10000 | Yes | No | - |
| position | String | 1000 | Yes | No | "{}" |
| color | String | 50 | No | No | "yellow" |
| createdAt | String | 255 | Yes | No | - |
| updatedAt | String | 255 | Yes | No | - |

**Indexes**:
- `pdfResourceId_idx`: Key: `pdfResourceId`, Type: Key, Order: ASC
- `userId_idx`: Key: `userId`, Type: Key, Order: ASC
- `pageNumber_idx`: Key: `pageNumber`, Type: Key, Order: ASC
- `pdfResourceId_pageNumber_idx`: Keys: `pdfResourceId`, `pageNumber`, Type: Key, Orders: ASC, ASC (composite index for page notes)
- `pdfResourceId_createdAt_idx`: Keys: `pdfResourceId`, `createdAt`, Type: Key, Orders: ASC, DESC (composite index)
- `updatedAt_idx`: Key: `updatedAt`, Type: Key, Order: DESC
- `noteText_idx`: Key: `noteText`, Type: Fulltext (for searching notes)

**Permissions**:
- Read: `user:[USER_ID]`
- Create: `user:[USER_ID]`
- Update: `user:[USER_ID]`
- Delete: `user:[USER_ID]`

---

### Collection 8: PDF Highlights
**Collection ID**: `pdf_highlights`

**Attributes**:
| Attribute Name | Type | Size | Required | Array | Default |
|---------------|------|------|----------|-------|---------|
| userId | String | 255 | Yes | No | - |
| pdfResourceId | String | 255 | Yes | No | - |
| pageNumber | Integer | - | Yes | No | - |
| highlightedText | String | 5000 | Yes | No | - |
| position | String | 1000 | Yes | No | "{}" |
| color | String | 50 | No | No | "yellow" |
| createdAt | String | 255 | Yes | No | - |

**Indexes**:
- `pdfResourceId_idx`: Key: `pdfResourceId`, Type: Key, Order: ASC
- `userId_idx`: Key: `userId`, Type: Key, Order: ASC
- `pageNumber_idx`: Key: `pageNumber`, Type: Key, Order: ASC
- `pdfResourceId_pageNumber_idx`: Keys: `pdfResourceId`, `pageNumber`, Type: Key, Orders: ASC, ASC (composite index for page highlights)
- `pdfResourceId_createdAt_idx`: Keys: `pdfResourceId`, `createdAt`, Type: Key, Orders: ASC, DESC (composite index)
- `createdAt_idx`: Key: `createdAt`, Type: Key, Order: DESC

**Permissions**:
- Read: `user:[USER_ID]`
- Create: `user:[USER_ID]`
- Update: `user:[USER_ID]`
- Delete: `user:[USER_ID]`

---

## Step 5: Create Storage Bucket

1. Go to **Storage** in Appwrite Console
2. Click **Create Bucket**
3. Bucket ID: `study_files`
4. Name: `Study Files`
5. **File Size Limit**: 50MB (or higher for large PDFs)
6. **Allowed File Extensions**: `pdf,png,jpg,jpeg,gif,svg,txt,doc,docx,xls,xlsx,ppt,pptx,md,html,css,js,json`
7. **Compression**: Disabled (to preserve PDF quality)
8. **Encryption**: Enabled (recommended)
9. **Antivirus**: Enabled (if available)

**Permissions**:
- Read: `user:[USER_ID]`
- Create: `user:[USER_ID]`
- Update: `user:[USER_ID]`
- Delete: `user:[USER_ID]`

---

## Step 6: Configure Authentication

1. Go to **Auth** in Appwrite Console
2. Enable **Email/Password** authentication
3. (Optional) Enable **OAuth providers** (Google, GitHub, etc.)
4. Configure **Password Settings**:
   - Minimum length: 8 characters
   - Require uppercase: Yes
   - Require lowercase: Yes
   - Require numbers: Yes
   - Require special characters: Optional

---

## Step 7: Verify Setup

Run this checklist:

### Database
- [ ] Database `lastweek_db` created
- [ ] All 8 collections created with correct IDs
- [ ] All attributes added with correct types and sizes
- [ ] **CRITICAL**: `messages.content` size = 1000000
- [ ] **CRITICAL**: `pdf_resources.extractedText` size = 1000000
- [ ] **CRITICAL**: `pdf_resources.notes` size = 1000000
- [ ] All datetime fields are String type (not DateTime)
- [ ] All indexes created (including composite indexes)
- [ ] Fulltext indexes created for `pdf_resources.tags` and `pdf_notes.noteText`
- [ ] Permissions set correctly

### Storage
- [ ] Bucket `study_files` created
- [ ] File size limit set (50MB+)
- [ ] File extensions configured
- [ ] Permissions set correctly

### Authentication
- [ ] Email/Password enabled
- [ ] Password requirements configured

### Environment
- [ ] `.env` file configured
- [ ] All IDs match Appwrite setup
- [ ] API keys added

---

## Common Issues

### "Collection not found"
**Solution**: Verify collection IDs in `.env` match Appwrite exactly (case-sensitive)

### "Permission denied"
**Solution**: Check collection permissions include `user:[USER_ID]` for all operations

### "File upload fails"
**Solution**: Check bucket permissions, file size limit, and allowed extensions

### "PDF text extraction empty"
**Solution**: 
1. Verify `extractedText` attribute size is 1000000 (not 50000 or smaller)
2. Re-upload the PDF after fixing attribute size
3. Check browser console for extraction errors
4. Verify FileAttachment.jsx is storing `pdfText` not `dualAIAnalysis`

### "PDF context not sent to AI"
**Solution**:
1. Verify `messages.content` size is 1000000
2. Re-upload PDF to get full text extraction
3. Check console logs for "[StudyInterface] Full context preview"
4. Verify extractedText has page markers: "=== PAGE X ==="

### "Messages not appearing after sending"
**Solution**:
1. Check browser console for errors
2. Verify DeepSeek API key is valid
3. Check Network tab for failed API requests
4. Look for "[useSession] DeepSeek response received" log

---

## Important Notes

1. **Datetime Storage**: All datetime fields use String type storing ISO 8601 format (e.g., "2024-01-15T10:30:00.000Z")
2. **Large Text Fields**: `content`, `extractedText`, and `notes` must be size 1000000 for full PDF support
3. **Composite Indexes**: Required for efficient queries (e.g., `userId` + `updatedAt`)
4. **Fulltext Indexes**: Enable searching in `tags` and `noteText` fields
5. **JSON Fields**: `bookmarks`, `highlights`, and `position` store JSON as strings
6. **Re-upload PDFs**: After fixing attribute sizes, you must re-upload all PDFs for changes to take effect

---

## Attribute Size Reference

| Field | Size | Reason |
|-------|------|--------|
| content (messages) | 1000000 | Stores full PDF context with page markers (43,000+ chars) |
| extractedText (pdf_resources) | 1000000 | Stores full PDF text with page markers (43,000+ chars) |
| notes (pdf_resources) | 1000000 | Allows extensive note-taking on PDFs |
| noteText (pdf_notes) | 10000 | Individual note per page |
| highlightedText (pdf_highlights) | 5000 | Highlighted text excerpt |
| content (file_attachments) | 50000 | Small file content storage |

---

## Setup Complete!

Your Appwrite backend is now fully configured for the LastWeek study application. All collections, indexes, and permissions are set up correctly for optimal performance.

**Next Steps**:
1. Test authentication (sign up/login)
2. Create a test session
3. Upload a PDF and verify text extraction
4. Send messages with PDF context
5. Create flashcards and notes

If you encounter any issues, refer to the Common Issues section above.
