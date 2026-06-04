# Secure Audio Transcription Implementation

## Problem
- Appwrite synchronous executions have 30s timeout
- Audio transcription takes longer than 30s
- Exposing paid API keys in client is a security risk

## Solution: Async Execution with Database Polling

### Architecture
```
Client → Create transcription job in DB
      → Call Appwrite Function (async=true) with job ID
      → Poll DB for completion
      → Get result from DB
```

### Steps to Implement

#### 1. Create Transcription Jobs Collection
In Appwrite Console → Databases → Your Database → Create Collection:
- **Collection ID**: `transcription_jobs`
- **Attributes**:
  - `userId` (string, required)
  - `status` (string, required) - "pending" | "processing" | "completed" | "failed"
  - `audioUrl` (string, required) - R2 URL or base64
  - `result` (string) - transcribed text
  - `error` (string) - error message if failed
- **Indexes**: 
  - `userId` (ASC)
  - `status` (ASC)
- **Permissions**:
  - Create: Users
  - Read: User (creator only)
  - Update: API (server-side only)

#### 2. Update Appwrite Function
Add new endpoint for async transcription:

```javascript
// In index.js
if (body.action === 'transcribe_async') {
  const { jobId, audioFile } = body;
  
  // Update job status to processing
  await databases.updateDocument(DATABASE_ID, 'transcription_jobs', jobId, {
    status: 'processing'
  });
  
  try {
    // Transcribe audio (can take >30s, that's OK for async)
    const result = await groqTranscribe(audioFile);
    
    // Store result in database
    await databases.updateDocument(DATABASE_ID, 'transcription_jobs', jobId, {
      status: 'completed',
      result: result.text
    });
  } catch (error) {
    await databases.updateDocument(DATABASE_ID, 'transcription_jobs', jobId, {
      status: 'failed',
      error: error.message
    });
  }
}
```

#### 3. Update Client Code
```javascript
// In secureAiProvider.js
export async function transcribeAudio(audioBase64) {
  // Create job in database
  const job = await databases.createDocument(
    DATABASE_ID,
    'transcription_jobs',
    'unique()',
    {
      userId: currentUserId,
      status: 'pending',
      audioUrl: audioBase64
    }
  );
  
  // Call function asynchronously
  await functions.createExecution(
    AI_PROXY_FUNCTION_ID,
    JSON.stringify({
      action: 'transcribe_async',
      jobId: job.$id,
      audioFile: audioBase64
    }),
    true // async = true (no 30s timeout)
  );
  
  // Poll for completion
  let attempts = 0;
  const maxAttempts = 120; // 2 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 1000)); // Wait 1s
    
    const updatedJob = await databases.getDocument(
      DATABASE_ID,
      'transcription_jobs',
      job.$id
    );
    
    if (updatedJob.status === 'completed') {
      return updatedJob.result;
    } else if (updatedJob.status === 'failed') {
      throw new Error(updatedJob.error || 'Transcription failed');
    }
    
    attempts++;
  }
  
  throw new Error('Transcription timed out');
}
```

### Benefits
✅ No 30s timeout limit
✅ API keys stay secure (server-side only)
✅ Works for any audio length
✅ Can show progress to user (poll status updates)
✅ Safe for paid API keys

### Drawbacks
❌ More complex setup (need DB collection)
❌ Slightly slower (polling overhead)
❌ Requires Appwrite Database access from function

## Recommendation
- **Free tier Groq**: Use current direct API call (simpler)
- **Paid tier Groq**: Implement database polling (secure)

## Migration Path
1. Keep current direct API implementation for now
2. When upgrading to paid, implement database polling
3. Add feature flag to switch between methods
