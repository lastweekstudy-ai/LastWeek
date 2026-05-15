/**
 * Gemini TTS API Integration
 * Handles API calls to Google's Gemini Flash TTS model
 */

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash-exp';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

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
 * Fetch TTS audio from Gemini API
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice name (default: Kore)
 * @param {string} style - Speaking style/emotion (optional)
 * @returns {Promise<string>} Base64 encoded audio data
 */
export const fetchTTSAudio = async (text, voice = VOICES.KORE, style = '') => {
  if (!GEMINI_KEY) {
    throw new Error('Gemini API key not configured');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  // Construct prompt with optional style
  const prompt = style 
    ? `Say ${style}: ${text}` 
    : `TTS the following: ${text}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: prompt }] 
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { 
                voiceName: voice 
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini TTS API error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    
    // Extract base64 audio data
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error('No audio data in response');
    }

    return audioData; // base64 PCM audio
  } catch (error) {
    console.error('[Gemini TTS] Error:', error);
    throw error;
  }
};

/**
 * Fetch multi-speaker conversation audio
 * @param {Array} speakers - Array of {name, voice} objects
 * @param {Array} script - Array of {speaker, line} objects
 * @returns {Promise<string>} Base64 encoded audio data
 */
export const fetchMultiSpeakerAudio = async (speakers, script) => {
  if (!GEMINI_KEY) {
    throw new Error('Gemini API key not configured');
  }

  if (!speakers || speakers.length === 0) {
    throw new Error('At least one speaker is required');
  }

  if (!script || script.length === 0) {
    throw new Error('Script cannot be empty');
  }

  // Format script as conversation
  const scriptText = script
    .map(({ speaker, line }) => `${speaker}: ${line}`)
    .join('\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `TTS the following conversation:\n${scriptText}`
          }]
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: speakers.map(({ name, voice }) => ({
                speaker: name,
                voiceConfig: {
                  prebuiltVoiceConfig: { 
                    voiceName: voice 
                  }
                }
              }))
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini TTS API error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error('No audio data in response');
    }

    return audioData;
  } catch (error) {
    console.error('[Gemini Multi-Speaker TTS] Error:', error);
    throw error;
  }
};

/**
 * Check if Gemini TTS is available
 * @returns {boolean}
 */
export const isGeminiTTSAvailable = () => {
  return !!GEMINI_KEY;
};
