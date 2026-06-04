# Transcription Jobs Implementation

## Part 1: Update Appwrite Function

### Add to `index.js` (after existing handlers):

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC TRANSCRIPTION HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

async function handleAsyncTranscription(params, { log, error }) {
  const { jobId, audioData } = params;
  
  // Get environment variables
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
  const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69f742a2001f393e4b85';
  const TRANSCRIPTION_JOBS_COLLECTION_ID = 'transcription_jobs';
  
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
  if (!APPWRITE_API_KEY) throw new Error('APPWRITE_API_KEY not configured for database updates');
  
  log(`[Async Transcription] Starting job ${jobId}`);
  
  // Update job status to processing
  try {
    await fetch(`${process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'}/databases/${APPWRITE_DATABASE_ID}/collections/${TRANSCRIPTION_JOBS_COLLECTION_ID}/documents/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
      },
      body: JSON.stringify({
        status: 'processing',
      }),
    });
  } catch (err) {
    error(`[Async Transcription] Failed to update job status: ${err.message}`);
  }
  
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(audioData, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    
    log(`[Async Transcription] Calling Groq Whisper...`);
    
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Groq transcribe error: ${response.status}`);
    }
    
    const data = await response.json();
    const transcript = data.text || '';
    
    log(`[Async Transcription] Success, ${transcript.length} chars`);
    
    // Update job with result
    await fetch(`${process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'}/databases/${APPWRITE_DATABASE_ID}/collections/${TRANSCRIPTION_JOBS_COLLECTION_ID}/documents/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
      },
      body: JSON.stringify({
        status: 'completed',
        result: transcript,
      }),
    });
    
    return {
      success: true,
      message: 'Transcription completed',
    };
  } catch (err) {
    error(`[Async Transcription] Error: ${err.message}`);
    
    // Update job with error
    try {
      await fetch(`${process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'}/databases/${APPWRITE_DATABASE_ID}/collections/${TRANSCRIPTION_JOBS_COLLECTION_ID}/documents/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': APPWRITE_API_KEY,
        },
        body: JSON.stringify({
          status: 'failed',
          error: err.message,
        }),
      });
    } catch (updateErr) {
      error(`[Async Transcription] Failed to update error status: ${updateErr.message}`);
    }
    
    throw err;
  }
}
```

### Update the main handler to route async transcription:

```javascript
// In the main switch statement, add:
case 'groq':
  if (action === 'transcribe_async') {
    result = await handleAsyncTranscription({ jobId: body.jobId, audioData: body.audioFile }, { log, error });
  } else {
    result = await handleGroq({ action, systemPrompt, messages, prompt, image, mimeType, audioFile, model, temperature, maxTokens }, { log, error });
  }
  break;
```

### Add environment variables in Appwrite Console:

Go to Functions → aiProxyUniversal → Settings → Variables:
- `APPWRITE_API_KEY` - Your server API key (create one in Appwrite Console → Settings → API Keys)
- `APPWRITE_PROJECT_ID` - Your project ID (already have this)
- `APPWRITE_DATABASE_ID` - `69f742a2001f393e4b85`

## Part 2: Update Client Code

### Replace `transcribeAudio` in `secureAiProvider.js`:

```javascript
import { databases } from '../appwrite/config';
import { ID } from 'appwrite';

const TRANSCRIPTION_JOBS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TRANSCRIPTION_JOBS_COLLECTION_ID || 'transcription_jobs';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

/**
 * Transcribe audio using async Groq Whisper (secure, no timeout)
 * @param {string} audioBase64 - Base64 encoded audio file
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(audioBase64) {
  try {
    // Get current user ID
    const user = await account.get();
    const userId = user.$id;
    
    // Create transcription job in database
    console.log('[Transcription] Creating job...');
    const job = await databases.createDocument(
      DATABASE_ID,
      TRANSCRIPTION_JOBS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        status: 'pending',
        audioData: audioBase64,
      }
    );
    
    console.log('[Transcription] Job created:', job.$id);
    
    // Call function asynchronously (no 30s timeout)
    await functions.createExecution(
      AI_PROXY_FUNCTION_ID,
      JSON.stringify({
        provider: 'groq',
        action: 'transcribe_async',
        jobId: job.$id,
        audioFile: audioBase64,
      }),
      true // async = true
    );
    
    console.log('[Transcription] Function called, polling for result...');
    
    // Poll for completion
    let attempts = 0;
    const maxAttempts = 180; // 3 minutes max (180 * 1s)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
      
      const updatedJob = await databases.getDocument(
        DATABASE_ID,
        TRANSCRIPTION_JOBS_COLLECTION_ID,
        job.$id
      );
      
      console.log('[Transcription] Status:', updatedJob.status);
      
      if (updatedJob.status === 'completed') {
        console.log('[Transcription] Completed!');
        return updatedJob.result;
      } else if (updatedJob.status === 'failed') {
        throw new Error(updatedJob.error || 'Transcription failed');
      }
      
      attempts++;
    }
    
    throw new Error('Transcription timed out after 3 minutes');
  } catch (error) {
    console.error('[Transcription] Error:', error);
    throw error;
  }
}
```

### Add import at top of file:

```javascript
import { account } from '../appwrite/config';
```

## Part 3: Deploy

1. Update the Appwrite Function `index.js`
2. Create new `.tar.gz`:
   ```bash
   tar -czvf aiProxyUniversal_v7.tar.gz -C aiProxyUniversal index.js package.json
   ```
3. Deploy to Appwrite
4. Test audio transcription

## Testing

1. Upload an audio file
2. Check Appwrite Console → Databases → transcription_jobs
3. Watch the status change: `pending` → `processing` → `completed`
4. Result should appear in the `result` field

## Benefits

✅ No 30-second timeout
✅ Secure (API key on server)
✅ Works for any audio length
✅ Can show progress to user
