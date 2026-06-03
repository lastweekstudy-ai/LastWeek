# AI Response Truncation Fix

## Problem

AI responses are getting truncated mid-response, particularly when generating complex content like:
- Multiple SVG figures with large coordinate data
- Long MCQ sets + flashcards + figures combined
- Detailed explanations with extensive formatting

**Root Cause**: Appwrite has document and attribute size limits:
- **Document size limit**: 1MB per document
- **Attribute size limit**: 1MB per text attribute
- When AI response content exceeds these limits, it gets truncated

## Current Flow

1. User sends message → AI generates response
2. Response stored as single message document in Appwrite `messages` collection
3. If response > 1MB → **TRUNCATED** (data loss)

## Solution Options

### Option 1: Chunked Storage (Recommended) ✅

**Store long responses across multiple documents**:
- Split responses >800KB into chunks
- Link chunks with `parentMessageId` + `chunkIndex`
- Reassemble on load

**Pros**:
- No data loss
- Works with existing Appwrite limits
- Backward compatible

**Cons**:
- Slightly more complex retrieval logic
- More documents to manage

### Option 2: External Storage (Overkill)

**Store large responses in R2/S3**:
- Save reference URL in Appwrite
- Fetch content from cloud storage

**Pros**:
- No size limits

**Cons**:
- Additional service dependency
- Slower retrieval
- More expensive

### Option 3: Compression (Insufficient)

**Compress before storage**:
- GZIP compression on large text

**Pros**:
- Simple

**Cons**:
- Only saves ~50-60% space
- Still hits limits on very large responses
- Decompression overhead

---

## Implementation Plan: Chunked Storage ✅

### 1. Detect Long Responses

```javascript
const MAX_CHUNK_SIZE = 800 * 1024; // 800KB (safe margin below 1MB)

function needsChunking(content) {
  const sizeInBytes = new TextEncoder().encode(content).length;
  return sizeInBytes > MAX_CHUNK_SIZE;
}
```

### 2. Split into Chunks

```javascript
function splitIntoChunks(content, chunkSize = MAX_CHUNK_SIZE) {
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(content);
  
  const chunks = [];
  let offset = 0;
  
  while (offset < contentBytes.length) {
    const chunkBytes = contentBytes.slice(offset, offset + chunkSize);
    const chunkText = new TextDecoder().decode(chunkBytes);
    chunks.push(chunkText);
    offset += chunkSize;
  }
  
  return chunks;
}
```

### 3. Store Chunks in Appwrite

```javascript
// Parent message (first chunk)
const parentMessage = {
  sessionId,
  userId,
  role: 'assistant',
  content: chunks[0],
  isChunked: true,
  totalChunks: chunks.length,
  timestamp: new Date().toISOString()
};

const parentDoc = await databases.createDocument(
  DATABASE_ID,
  MESSAGES_COLLECTION_ID,
  ID.unique(),
  parentMessage
);

// Subsequent chunks
for (let i = 1; i < chunks.length; i++) {
  await databases.createDocument(
    DATABASE_ID,
    MESSAGES_COLLECTION_ID,
    ID.unique(),
    {
      sessionId,
      userId,
      role: 'assistant_chunk',
      content: chunks[i],
      parentMessageId: parentDoc.$id,
      chunkIndex: i,
      timestamp: new Date().toISOString()
    }
  );
}
```

### 4. Retrieve and Reassemble

```javascript
async function loadMessages(sessionId, userId) {
  // Load all messages
  const response = await databases.listDocuments(
    DATABASE_ID,
    MESSAGES_COLLECTION_ID,
    [
      Query.equal('sessionId', sessionId),
      Query.equal('userId', userId),
      Query.orderAsc('timestamp'),
      Query.limit(1000) // Adjust as needed
    ]
  );
  
  const messages = [];
  const chunkMap = {}; // parentMessageId -> chunks
  
  // Group chunks
  for (const doc of response.documents) {
    if (doc.role === 'assistant_chunk') {
      if (!chunkMap[doc.parentMessageId]) {
        chunkMap[doc.parentMessageId] = [];
      }
      chunkMap[doc.parentMessageId].push(doc);
    }
  }
  
  // Reconstruct messages
  for (const doc of response.documents) {
    if (doc.role === 'assistant_chunk') continue; // Skip chunks, already processed
    
    if (doc.isChunked && chunkMap[doc.$id]) {
      // Reassemble chunks
      const chunks = [doc.content];
      const additionalChunks = chunkMap[doc.$id].sort((a, b) => a.chunkIndex - b.chunkIndex);
      chunks.push(...additionalChunks.map(c => c.content));
      
      messages.push({
        ...doc,
        content: chunks.join('') // Reassembled full content
      });
    } else {
      // Regular message
      messages.push(doc);
    }
  }
  
  return messages;
}
```

---

## Alternative: Client-Side Detection & Warning

If chunking is too complex, at minimum **detect truncation** and **warn the user**:

```javascript
function detectTruncation(content) {
  const sizeInBytes = new TextEncoder().encode(content).length;
  const isNearLimit = sizeInBytes > 900 * 1024; // 900KB
  
  // Check for incomplete SVG/MCQ/FLASHCARD blocks
  const incompleteSVG = content.includes('[FIGURE:') && !content.endsWith('[/FIGURE]');
  const incompleteMCQ = content.includes('[MCQ]') && !content.endsWith('[/MCQ]');
  const incompleteFlashcard = content.includes('**FRONT OF CARD**') && !content.includes('===');
  
  if (isNearLimit || incompleteSVG || incompleteMCQ || incompleteFlashcard) {
    return {
      truncated: true,
      reason: incompleteSVG ? 'SVG figure incomplete' :
              incompleteMCQ ? 'MCQ incomplete' :
              incompleteFlashcard ? 'Flashcard incomplete' :
              'Response too large'
    };
  }
  
  return { truncated: false };
}

// Usage
const truncationStatus = detectTruncation(aiResponse);
if (truncationStatus.truncated) {
  console.error('[AI Response] Truncation detected:', truncationStatus.reason);
  // Show warning to user
  // Offer to regenerate with shorter request
}
```

---

## Recommended Action

**Implement Option 1 (Chunked Storage)** because:
1. ✅ No data loss
2. ✅ Works within Appwrite limits
3. ✅ Backward compatible
4. ✅ Future-proof for even larger responses

**Steps**:
1. Create utility functions for chunking
2. Update message save logic to detect + chunk
3. Update message load logic to reassemble
4. Add `isChunked`, `totalChunks`, `parentMessageId`, `chunkIndex` fields to messages collection schema
5. Test with large SVG responses

---

## Testing Plan

1. **Generate large response**: Ask AI for "4 SVG figures + 10 MCQs + 20 flashcards"
2. **Verify chunking**: Check Appwrite console → should see multiple message documents
3. **Verify reassembly**: Reload page → should display full content without truncation
4. **Check performance**: Measure load time difference (chunked vs non-chunked)

---

## Migration Note

**Existing truncated messages**: 
- Cannot recover lost data
- Will display as-is (incomplete)
- New messages will use chunking (no truncation)

**Backward compatibility**:
- Old messages (no `isChunked` field) → display normally
- New messages with `isChunked: true` → reassemble chunks
- Mixed sessions → both work seamlessly

---

## Alternative Quick Fix (If No Database Access)

If you **cannot modify Appwrite schema** immediately:

1. **Request shorter responses** from AI:
   ```
   "Generate 2 SVG figures max per response"
   "Split into multiple messages if needed"
   ```

2. **Client-side warning**:
   ```javascript
   if (response.length > 800 * 1024) {
     alert('Response too large. Asking AI to split into parts...');
     // Auto-regenerate with "Please split this into 2 shorter responses"
   }
   ```

3. **Prompt engineering**:
   ```
   System Prompt: "If your response would exceed 100KB, split it into multiple responses. 
   End each part with '[CONTINUED]' and wait for user to say 'continue' before proceeding."
   ```

---

## Estimated Implementation Time

- **Chunked storage (full solution)**: 4-6 hours
- **Truncation detection + warning**: 1 hour
- **Prompt engineering workaround**: 30 minutes

---

## Files to Modify

1. **src/utils/messageStorage.js** (NEW) - Chunking utilities
2. **src/appwrite/messages.js** (NEW or MODIFY) - Message CRUD with chunking
3. **src/components/ChatInterface.jsx** - Use chunked save/load
4. **src/components/StudyInterface.jsx** - Use chunked save/load

---

**Status**: NOT YET IMPLEMENTED  
**Recommended**: Implement chunked storage solution  
**Priority**: HIGH (users are losing data)

