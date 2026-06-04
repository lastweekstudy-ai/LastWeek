# Audio Transcription Async Solution

## Problem
Appwrite synchronous function executions have a **hard 30-second timeout limit**. Audio transcription via Groq Whisper can take longer than 30 seconds, causing timeouts.

## Solution Architecture

### Option 1: Store Results in Database (Recommended)
1. Create a `transcription_jobs` collection in Appwrite
2. Client creates a document with `status: 'pending'` and gets a job ID
3. Client calls function with `async = true` and passes job ID
4. Function transcribes audio and updates document with result
5. Client polls the document until status changes to 'completed'

### Option 2: Use Direct Groq API Call (Quick Fix)
Move Groq Whisper transcription back to client-side with API key in environment variables. This bypasses Appwrite's 30s limit.

**Trade-off:** API key is exposed in client, but Groq is free-tier so risk is minimal.

## Implementation

### Quick Fix (Option 2)
Just move audio transcription to direct API call:

```javascript
// In secureAiProvider.js
export async function transcribeAudio(audioBase64) {
  // Direct Groq API call instead of going through Appwrite
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  
  const buffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
  const blob = new Blob([buffer], { type: 'audio/webm' });
  
  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: formData,
  });
  
  const data = await response.json();
  return data.text;
}
```

### Proper Solution (Option 1)
Requires creating transcription jobs collection and polling mechanism.

## Recommendation
Use **Option 2** (direct API call) for now since:
- Groq is free tier (low security risk)
- Audio transcription is blocking UI anyway (user waits)
- Simpler implementation
- No Appwrite timeout issues

Later, can migrate to Option 1 for better security.
