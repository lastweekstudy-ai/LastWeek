/**
 * Secure AI Provider - Routes all AI calls through Appwrite Function
 * 
 * This replaces direct API calls with secure server-side proxy calls.
 * All API keys are stored in Appwrite Function environment variables.
 */

import { functions, databases, account } from '../appwrite/config';
import { ID } from 'appwrite';

const AI_PROXY_FUNCTION_ID = import.meta.env.VITE_AI_PROXY_FUNCTION_ID || 'aiProxyUniversal';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TRANSCRIPTION_JOBS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TRANSCRIPTION_JOBS_COLLECTION_ID || 'transcription_jobs';

/**
 * Call the AI proxy function
 * @private
 */
async function callAiProxy(payload) {
  try {
    const execution = await functions.createExecution(
      AI_PROXY_FUNCTION_ID,
      JSON.stringify(payload),
      false // async = false (wait for response)
    );

    if (execution.status === 'failed') {
      throw new Error(execution.errors || 'AI proxy execution failed');
    }

    const response = JSON.parse(execution.responseBody || '{}');
    
    if (!response.success) {
      throw new Error(response.error || 'AI request failed');
    }

    return response;
  } catch (error) {
    console.error('[SecureAI] Error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEEPSEEK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Call DeepSeek via secure proxy
 * @param {string} systemPrompt - System prompt
 * @param {Array} messages - Message history [{role, content}]
 * @param {string} model - Model name (default: deepseek-chat)
 * @returns {Promise<string>} - AI response content
 */
export async function callDeepSeek(systemPrompt, messages, model = 'deepseek-chat') {
  const response = await callAiProxy({
    provider: 'deepseek',
    action: 'chat',
    systemPrompt,
    messages,
    model,
    temperature: 0.7,
    maxTokens: 16000, // Increased from 4096 to support large responses with multiple SVGs
  });
  return response.content;
}

/**
 * Call DeepSeek with a simple prompt
 * @param {string} prompt - User prompt
 * @param {string} systemPrompt - Optional system prompt
 * @returns {Promise<string>} - AI response content
 */
export async function callDeepSeekSimple(prompt, systemPrompt = '') {
  const response = await callAiProxy({
    provider: 'deepseek',
    action: 'chat',
    systemPrompt,
    prompt,
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 16000, // Increased from 4096 to support large responses with multiple SVGs
  });
  return response.content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Call Gemini for text generation
 * @param {string} prompt - User prompt
 * @param {string} systemInstruction - System instruction
 * @returns {Promise<string>} - AI response content
 */
export async function callGeminiText(prompt, systemInstruction = '') {
  const response = await callAiProxy({
    provider: 'gemini',
    action: 'chat',
    systemPrompt: systemInstruction,
    prompt,
    model: 'gemini-2.5-flash',
  });
  return response.content;
}

/**
 * Call Gemini for vision analysis
 * @param {string} base64Image - Base64 encoded image
 * @param {string} prompt - Analysis prompt
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<string>} - AI response content
 */
export async function callGeminiVision(base64Image, prompt, mimeType = 'image/jpeg') {
  const response = await callAiProxy({
    provider: 'gemini',
    action: 'vision',
    image: base64Image,
    prompt,
    mimeType,
    model: 'gemini-2.5-flash',
  });
  return response.content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROQ
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Call Groq for chat completion
 * @param {string} systemPrompt - System prompt
 * @param {Array} messages - Message history
 * @param {string} model - Model name (default: llama-3.1-70b-versatile)
 * @returns {Promise<string>} - AI response content
 */
export async function callGroq(systemPrompt, messages, model = 'llama-3.3-70b-versatile') {
  const response = await callAiProxy({
    provider: 'groq',
    action: 'chat',
    systemPrompt,
    messages,
    model,
    temperature: 0.7,
    maxTokens: 8000, // Increased from 4500 to support larger responses
  });
  return response.content;
}

/**
 * Call Groq for vision analysis
 * @param {string} base64Image - Base64 encoded image
 * @param {string} prompt - Analysis prompt
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<string>} - AI response content
 */
export async function callGroqVision(base64Image, prompt, mimeType = 'image/jpeg') {
  const response = await callAiProxy({
    provider: 'groq',
    action: 'vision',
    image: base64Image,
    prompt,
    mimeType,
    model: 'llama-3.2-90b-vision-preview',
  });
  return response.content;
}

/**
 * Transcribe audio using async Groq Whisper via database polling
 * Uses async execution to bypass Appwrite's 30-second sync timeout
 * @param {string} audioBase64 - Base64 encoded audio file
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(audioBase64) {
  try {
    // Get current user ID
    const user = await account.get();
    const userId = user.$id;

    // Step 1: Create a job document in the database
    console.log('[Transcription] Creating job in database...');
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

    // Step 2: Call function ASYNC (no 30s limit)
    await functions.createExecution(
      AI_PROXY_FUNCTION_ID,
      JSON.stringify({
        provider: 'groq',
        action: 'transcribe_async',
        jobId: job.$id,
        audioFile: audioBase64,
      }),
      true // async = true, bypasses 30s limit
    );
    console.log('[Transcription] Async function triggered, polling...');

    // Step 3: Poll database for result (max 3 minutes)
    const maxAttempts = 180;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s

      const updatedJob = await databases.getDocument(
        DATABASE_ID,
        TRANSCRIPTION_JOBS_COLLECTION_ID,
        job.$id
      );

      console.log(`[Transcription] Poll ${i + 1}: status = ${updatedJob.status}`);

      if (updatedJob.status === 'completed') {
        // Clean up job document
        databases.deleteDocument(DATABASE_ID, TRANSCRIPTION_JOBS_COLLECTION_ID, job.$id)
          .catch(() => {}); // best-effort cleanup
        return updatedJob.result;
      }

      if (updatedJob.status === 'failed') {
        throw new Error(updatedJob.error || 'Transcription failed');
      }
    }

    throw new Error('Transcription timed out after 3 minutes');
  } catch (error) {
    console.error('[Transcription] Error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  // DeepSeek
  callDeepSeek,
  callDeepSeekSimple,
  
  // Gemini
  callGeminiText,
  callGeminiVision,
  
  // Groq
  callGroq,
  callGroqVision,
  transcribeAudio,
};
