# LastWeek API Documentation

## Overview

LastWeek uses Appwrite as the backend service. This document covers the main API endpoints and operations used throughout the application.

## Authentication

All API requests require authentication via Appwrite SDK.

```javascript
import { Client, Account, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
```

## Authentication Endpoints

### Sign Up

```javascript
await account.create(
  ID.unique(),
  email,
  password,
  name
);
```

### Login

```javascript
await account.createEmailPasswordSession(email, password);
```

### Logout

```javascript
await account.deleteSession('current');
```

### Get Current User

```javascript
const user = await account.get();
```

---

## PDF Resources API

### Create PDF Resource

```javascript
const resource = await databases.createDocument(
  DATABASE_ID,
  PDF_RESOURCES_COLLECTION_ID,
  ID.unique(),
  {
    userId,
    sessionId,
    fileName,
    fileSize,
    storageFileId,
    pageCount,
    extractedText,
    tags: 'application/pdf',
    lastAccessedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
);
```

### Get Session PDFs

```javascript
const pdfs = await databases.listDocuments(
  DATABASE_ID,
  PDF_RESOURCES_COLLECTION_ID,
  [
    Query.equal('sessionId', sessionId),
    Query.orderDesc('lastAccessedAt'),
    Query.limit(100)
  ]
);
```

### Update PDF Progress

```javascript
await databases.updateDocument(
  DATABASE_ID,
  PDF_RESOURCES_COLLECTION_ID,
  pdfId,
  {
    currentPage: pageNumber,
    lastAccessedAt: new Date().toISOString()
  }
);
```

### Add PDF Highlight

```javascript
const highlight = await databases.createDocument(
  DATABASE_ID,
  PDF_HIGHLIGHTS_COLLECTION_ID,
  ID.unique(),
  {
    userId,
    pdfResourceId,
    pageNumber,
    highlightedText,
    color,
    position: JSON.stringify({ x, y, width, height }),
    createdAt: new Date().toISOString()
  }
);
```

### Add PDF Note

```javascript
const note = await databases.createDocument(
  DATABASE_ID,
  PDF_NOTES_COLLECTION_ID,
  ID.unique(),
  {
    userId,
    pdfResourceId,
    pageNumber,
    noteText,
    position: JSON.stringify({ x, y }),
    createdAt: new Date().toISOString()
  }
);
```

### Make PDF Public

```javascript
await databases.updateDocument(
  DATABASE_ID,
  PDF_RESOURCES_COLLECTION_ID,
  resourceId,
  {
    isPublic: true,
    aiTitle: title
  }
);
```

### Make PDF Private

```javascript
await databases.updateDocument(
  DATABASE_ID,
  PDF_RESOURCES_COLLECTION_ID,
  resourceId,
  { isPublic: false }
);
```

---

## Audio Lectures API

### Process Audio Lecture

```javascript
const lecture = await processAudioLecture(
  audioFile,
  userId,
  sessionId,
  onProgress
);
```

**Process Steps**:
1. Upload to R2 storage
2. Transcribe with Gemini
3. Generate notes with DeepSeek
4. Save to database

### Get Session Audio Lectures

```javascript
const lectures = await getUserAudioLectures(userId, sessionId);
```

### Make Audio Public

```javascript
await makeAudioLecturePublic(lectureId);
```

### Make Audio Private

```javascript
await makeAudioLecturePrivate(lectureId);
```

### Import Audio Lecture

```javascript
const imported = await importSharedAudioLecture(
  sourceLectureId,
  targetUserId,
  targetSessionId
);
```

---

## Resource Library API

### Search Public Resources

```javascript
const results = await searchPublicResources(query, limit);
```

**Features**:
- Semantic search with topic expansion
- Searches PDFs and audio lectures
- Client-side filtering
- Returns up to `limit` results

### Import PDF Resource

```javascript
const imported = await importSharedPDFResource(
  sourceResourceId,
  targetUserId,
  targetSessionId
);
```

**Imported Data**:
- ✅ Extracted text
- ✅ AI title
- ✅ File metadata
- ❌ Personal notes
- ❌ Highlights
- ❌ Bookmarks

### Import Audio Lecture

```javascript
const imported = await importSharedAudioLecture(
  sourceLectureId,
  targetUserId,
  targetSessionId
);
```

**Imported Data**:
- ✅ Transcript
- ✅ Lecture notes
- ✅ Audio URL
- ❌ Personal notes
- ❌ Highlights

---

## Study Sessions API

### Create Study Session

```javascript
const session = await databases.createDocument(
  DATABASE_ID,
  STUDY_SESSIONS_COLLECTION_ID,
  ID.unique(),
  {
    userId,
    title,
    mode,
    subject,
    status: 'active',
    messages: JSON.stringify([]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
);
```

### Get User Sessions

```javascript
const sessions = await databases.listDocuments(
  DATABASE_ID,
  STUDY_SESSIONS_COLLECTION_ID,
  [
    Query.equal('userId', userId),
    Query.orderDesc('updatedAt'),
    Query.limit(50)
  ]
);
```

### Update Session

```javascript
await databases.updateDocument(
  DATABASE_ID,
  STUDY_SESSIONS_COLLECTION_ID,
  sessionId,
  {
    messages: JSON.stringify(updatedMessages),
    updatedAt: new Date().toISOString()
  }
);
```

### Archive Session

```javascript
await databases.updateDocument(
  DATABASE_ID,
  STUDY_SESSIONS_COLLECTION_ID,
  sessionId,
  { status: 'archived' }
);
```

---

## Exam Plans API

### Create Exam Plan

```javascript
const plan = await databases.createDocument(
  DATABASE_ID,
  EXAM_PLANS_COLLECTION_ID,
  ID.unique(),
  {
    userId,
    examName,
    examDate,
    topics: JSON.stringify(topicsArray),
    schedule: JSON.stringify(scheduleObject),
    progress: JSON.stringify({}),
    createdAt: new Date().toISOString()
  }
);
```

### Get Exam Plans

```javascript
const plans = await databases.listDocuments(
  DATABASE_ID,
  EXAM_PLANS_COLLECTION_ID,
  [
    Query.equal('userId', userId),
    Query.orderDesc('examDate')
  ]
);
```

### Update Exam Progress

```javascript
await databases.updateDocument(
  DATABASE_ID,
  EXAM_PLANS_COLLECTION_ID,
  planId,
  {
    progress: JSON.stringify(updatedProgress)
  }
);
```

---

## File Storage API

### Upload File to Appwrite Storage

```javascript
const file = await storage.createFile(
  BUCKET_ID,
  ID.unique(),
  fileObject
);
```

### Upload Audio to R2

```javascript
const { fileId, url } = await uploadAudioToR2(audioFile, userId);
```

### Get File URL

```javascript
const url = await getFileURL(storageFileId);
```

### Delete File

```javascript
await storage.deleteFile(BUCKET_ID, fileId);
```

---

## Query Examples

### Get All Resources for User

```javascript
const resources = await databases.listDocuments(
  DATABASE_ID,
  PDF_RESOURCES_COLLECTION_ID,
  [
    Query.equal('userId', userId),
    Query.orderDesc('lastAccessedAt'),
    Query.limit(100)
  ]
);
```

### Get Public Resources

```javascript
const publicResources = await databases.listDocuments(
  DATABASE_ID,
  PDF_RESOURCES_COLLECTION_ID,
  [
    Query.equal('isPublic', true),
    Query.limit(50)
  ]
);
```

### Get Resources by Session

```javascript
const sessionResources = await databases.listDocuments(
  DATABASE_ID,
  PDF_RESOURCES_COLLECTION_ID,
  [
    Query.equal('sessionId', sessionId),
    Query.equal('userId', userId)
  ]
);
```

### Search by Tags

```javascript
const tagged = await databases.listDocuments(
  DATABASE_ID,
  PDF_RESOURCES_COLLECTION_ID,
  [
    Query.equal('userId', userId),
    Query.search('tags', searchTerm)
  ]
);
```

---

## Error Handling

### Common Errors

```javascript
try {
  // API call
} catch (error) {
  if (error.code === 401) {
    // Unauthorized - redirect to login
  } else if (error.code === 403) {
    // Forbidden - access denied
  } else if (error.code === 404) {
    // Not found
  } else if (error.code === 400) {
    // Bad request - validation error
  } else {
    // Other error
  }
}
```

### Validation Errors

```javascript
{
  code: 400,
  message: "Invalid document structure",
  errors: [
    {
      key: "fieldName",
      message: "Field validation failed"
    }
  ]
}
```

---

## Rate Limiting

- **Requests per minute**: 60
- **Requests per hour**: 3600
- **File upload size**: 100MB max
- **Database document size**: 1MB max

---

## Pagination

```javascript
const page1 = await databases.listDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    Query.limit(20),
    Query.offset(0)
  ]
);

const page2 = await databases.listDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    Query.limit(20),
    Query.offset(20)
  ]
);
```

---

## Batch Operations

### Batch Create

```javascript
const documents = [];
for (let i = 0; i < 10; i++) {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID,
    ID.unique(),
    data
  );
  documents.push(doc);
}
```

### Batch Update

```javascript
for (const doc of documents) {
  await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID,
    doc.$id,
    updatedData
  );
}
```

---

## Webhooks

### Setup Webhook

```javascript
const webhook = await client.request(
  'POST',
  '/webhooks',
  {},
  {
    name: 'Resource Updated',
    url: 'https://yourapp.com/webhook',
    events: ['databases.*.documents.*.update']
  }
);
```

### Webhook Events

- `databases.*.documents.*.create`
- `databases.*.documents.*.update`
- `databases.*.documents.*.delete`
- `storage.*.files.*.create`
- `storage.*.files.*.delete`

---

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch
2. **Pagination**: Use limit/offset for large datasets
3. **Caching**: Cache frequently accessed data
4. **Validation**: Validate data before sending
5. **Rate Limiting**: Implement exponential backoff
6. **Logging**: Log important API calls
7. **Security**: Never expose API keys in client code
8. **Optimization**: Use indexes for common queries

---

## SDK Reference

- [Appwrite SDK Documentation](https://appwrite.io/docs)
- [Appwrite REST API](https://appwrite.io/docs/references/cloud/client-rest)
- [Appwrite JavaScript SDK](https://github.com/appwrite/sdk-for-web)

---

## Support

For API issues:
- Check [Appwrite Documentation](https://appwrite.io/docs)
- Review error messages carefully
- Check network tab in browser DevTools
- Contact support@lastweek.com
