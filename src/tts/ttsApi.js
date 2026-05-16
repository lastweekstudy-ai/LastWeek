/**
 * Gemini TTS API Integration via Appwrite Function
 * Calls Appwrite serverless function to generate TTS audio
 */

const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const GEMINI_TTS_FUNCTION_ID = import.meta.env.VITE_GEMINI_TTS_FUNCTION_ID;

/**
 * Available voices for Gemini TTS
 */
export const VOICES = {
  // English voices
  PUCK: 'Puck',      // Energetic, youthful
  CHARON: 'Charon',  // Deep, authoritative
  KORE: 'Kore',      // Warm, friendly
  FENRIR: 'Fenrir',  // Strong, confident
  AOEDE: 'Aoede',    // Melodic, expressive
};

/**
 * Voice styles/emotions
 */
export const STYLES = {
  CHEERFUL: 'cheerfully',
  SERIOUS: 'seriously',
  EXCITED: 'excitedly',
  CALM: 'calmly',
  FRIENDLY: 'in a friendly way',
  PROFESSIONAL: 'professionally',
};

/**
 * Fetch TTS audio from Gemini via Appwrite Function
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice name (default: Kore)
 * @param {string} style - Speaking style/emotion (optional)
 * @returns {Promise<string>} Base64 encoded audio data
 */
export const fetchTTSAudio = async (text, voice = VOICES.KORE, style = '') => {
  console.log('[Gemini TTS] 🎤 Starting TTS request...');
  console.log('[Gemini TTS] Text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
  console.log('[Gemini TTS] Voice:', voice);
  console.log('[Gemini TTS] Style:', style || 'normal');

  if (!GEMINI_TTS_FUNCTION_ID) {
    console.error('[Gemini TTS] ❌ Function ID not configured!');
    console.error('[Gemini TTS] Please set VITE_GEMINI_TTS_FUNCTION_ID in .env');
    throw new Error('Gemini TTS function not configured. Please set VITE_GEMINI_TTS_FUNCTION_ID in .env');
  }

  console.log('[Gemini TTS] ✅ Function ID:', GEMINI_TTS_FUNCTION_ID);

  if (!text || text.trim().length === 0) {
    console.error('[Gemini TTS] ❌ Empty text provided');
    throw new Error('Text cannot be empty');
  }

  try {
    // Call Appwrite Function
    const functionUrl = `${APPWRITE_ENDPOINT}/functions/${GEMINI_TTS_FUNCTION_ID}/executions`;
    console.log('[Gemini TTS] 📡 Calling Appwrite Function:', functionUrl);
    
    const requestBody = JSON.stringify({
      text,
      voice,
      style,
    });
    console.log('[Gemini TTS] 📤 Request body:', requestBody);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
      },
      body: JSON.stringify({
        body: requestBody, // Appwrite expects the function body in a 'body' field
        async: false, // Wait for execution to complete
      })
    });

    console.log('[Gemini TTS] 📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Gemini TTS] ❌ Function error:', errorData);
      throw new Error(
        `Appwrite Function error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();
    console.log('[Gemini TTS] 📦 Raw response:', data);
    
    // Parse the function response
    const functionResponse = JSON.parse(data.responseBody || '{}');
    console.log('[Gemini TTS] 🎯 Function response:', {
      success: functionResponse.success,
      voice: functionResponse.voice,
      textLength: functionResponse.textLength,
      hasAudio: !!functionResponse.audio
    });
    
    if (!functionResponse.success) {
      console.error('[Gemini TTS] ❌ Function returned error:', functionResponse.error);
      throw new Error(functionResponse.error || 'TTS generation failed');
    }

    const audioData = functionResponse.audio;
    
    if (!audioData) {
      console.error('[Gemini TTS] ❌ No audio data in response');
      throw new Error('No audio data in response');
    }

    console.log('[Gemini TTS] ✅ Audio data received, length:', audioData.length, 'characters');
    console.log('[Gemini TTS] 🎉 TTS generation successful!');

    return audioData; // base64 PCM audio
  } catch (error) {
    console.error('[Gemini TTS] ❌ Error:', error);
    console.error('[Gemini TTS] Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Check if Gemini TTS is available
 * @returns {boolean}
 */
export const isGeminiTTSAvailable = () => {
  return !!import.meta.env.VITE_GEMINI_TTS_FUNCTION_ID;
};
