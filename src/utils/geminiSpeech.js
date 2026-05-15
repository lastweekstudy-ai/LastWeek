/**
 * Gemini TTS Speech Wrapper
 * Replaces the old Web Speech API with Gemini TTS
 */

import { speak as geminiSpeak, VOICES } from '../tts';

// Voice mapping: language code to Gemini voice
const VOICE_MAP = {
  'en': VOICES.KORE,      // English - friendly
  'en-US': VOICES.KORE,
  'en-GB': VOICES.CHARON,
  'es': VOICES.AOEDE,     // Spanish - melodic
  'es-ES': VOICES.AOEDE,
  'es-MX': VOICES.AOEDE,
  'fr': VOICES.AOEDE,     // French - melodic
  'fr-FR': VOICES.AOEDE,
  'de': VOICES.FENRIR,    // German - strong
  'de-DE': VOICES.FENRIR,
  'it': VOICES.AOEDE,     // Italian - melodic
  'it-IT': VOICES.AOEDE,
  'pt': VOICES.AOEDE,     // Portuguese - melodic
  'pt-BR': VOICES.AOEDE,
  'pt-PT': VOICES.AOEDE,
  'ja': VOICES.KORE,      // Japanese - friendly
  'ja-JP': VOICES.KORE,
  'ko': VOICES.KORE,      // Korean - friendly
  'ko-KR': VOICES.KORE,
  'zh': VOICES.KORE,      // Chinese - friendly
  'zh-CN': VOICES.KORE,
  'zh-TW': VOICES.KORE,
  'ar': VOICES.CHARON,    // Arabic - authoritative
  'ar-SA': VOICES.CHARON,
  'hi': VOICES.KORE,      // Hindi - friendly
  'hi-IN': VOICES.KORE,
  'ru': VOICES.FENRIR,    // Russian - strong
  'ru-RU': VOICES.FENRIR,
};

/**
 * Get Gemini voice for a language code
 * @param {string} langCode - Language code (e.g., 'en-US', 'es')
 * @returns {string} - Gemini voice name
 */
function getVoiceForLanguage(langCode) {
  if (!langCode) return VOICES.KORE;
  
  // Try exact match first
  if (VOICE_MAP[langCode]) {
    return VOICE_MAP[langCode];
  }
  
  // Try language without region (e.g., 'en' from 'en-US')
  const baseLang = langCode.split('-')[0];
  if (VOICE_MAP[baseLang]) {
    return VOICE_MAP[baseLang];
  }
  
  // Default to Kore (friendly voice)
  return VOICES.KORE;
}

/**
 * Speak text using Gemini TTS
 * Compatible with old Web Speech API interface
 * 
 * @param {string} text - Text to speak
 * @param {string} langCode - Language code (e.g., 'en-US', 'es')
 * @param {Object} options - Speech options
 * @param {number} options.rate - Speech rate (0.5-2, default: 1)
 * @param {number} options.pitch - Pitch (ignored, Gemini doesn't support)
 * @param {number} options.volume - Volume (0-1, default: 1)
 * @param {Function} options.onUnsupported - Callback if TTS not available
 * @param {Function} options.onStart - Callback when speech starts
 * @param {Function} options.onEnd - Callback when speech ends
 * @param {Function} options.onError - Callback on error
 * @returns {Promise<Object>} - { ok: boolean, usingDefaultVoice: boolean }
 */
export async function speak(text, langCode = 'en', options = {}) {
  try {
    // Get user ID from localStorage or use 'guest'
    const userId = localStorage.getItem('userId') || 'guest';
    
    // Get appropriate voice for language
    const voice = getVoiceForLanguage(langCode);
    
    // Determine speaking style based on rate
    let style = '';
    if (options.rate && options.rate < 0.8) {
      style = 'slowly';
    } else if (options.rate && options.rate > 1.2) {
      style = 'quickly';
    }
    
    // Call Gemini TTS
    await geminiSpeak(text, {
      voice,
      style,
      userId,
      volume: options.volume || 1,
      playbackRate: options.rate || 1,
      onStart: options.onStart,
      onEnd: options.onEnd,
      onError: (error) => {
        console.error('[Gemini Speech] Error:', error);
        if (options.onError) {
          options.onError(error);
        }
      },
    });
    
    return { ok: true, usingDefaultVoice: false };
  } catch (error) {
    console.error('[Gemini Speech] Failed:', error);
    
    if (options.onUnsupported) {
      options.onUnsupported('Gemini TTS is not available. Please check your API key.');
    }
    
    if (options.onError) {
      options.onError(error);
    }
    
    return { ok: false, error: error.message };
  }
}

/**
 * Check if voice is available for a language
 * Always returns true for Gemini TTS (supports all languages)
 * 
 * @param {string} langCode - Language code
 * @returns {boolean} - Always true
 */
export function isVoiceAvailable(langCode) {
  // Gemini TTS supports all languages
  return true;
}

/**
 * Extract speakable text from formatted text
 * Removes markdown, HTML, and other formatting
 * 
 * @param {string} text - Text with formatting
 * @returns {string} - Clean speakable text
 */
export function extractSpeakableText(text) {
  if (!text) return '';
  
  let clean = text;
  
  // Remove markdown links [text](url)
  clean = clean.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown bold/italic **text** or *text*
  clean = clean.replace(/\*\*([^\*]+)\*\*/g, '$1');
  clean = clean.replace(/\*([^\*]+)\*/g, '$1');
  
  // Remove markdown headers # text
  clean = clean.replace(/^#+\s+/gm, '');
  
  // Remove HTML tags
  clean = clean.replace(/<[^>]+>/g, '');
  
  // Remove extra whitespace
  clean = clean.replace(/\s+/g, ' ').trim();
  
  return clean;
}

/**
 * Check if speech is supported
 * Always returns true for Gemini TTS
 * 
 * @returns {boolean} - Always true
 */
export function isSpeechSupported() {
  // Gemini TTS is always available (API-based)
  return true;
}

/**
 * Get available languages
 * Returns all supported languages
 * 
 * @returns {Array} - Array of language objects
 */
export function getAvailableLanguages() {
  // Return all languages we have voice mappings for
  const languages = [
    { code: 'en-US', name: 'English (US)', voiceCount: 5 },
    { code: 'en-GB', name: 'English (UK)', voiceCount: 5 },
    { code: 'es-ES', name: 'Spanish (Spain)', voiceCount: 5 },
    { code: 'es-MX', name: 'Spanish (Mexico)', voiceCount: 5 },
    { code: 'fr-FR', name: 'French', voiceCount: 5 },
    { code: 'de-DE', name: 'German', voiceCount: 5 },
    { code: 'it-IT', name: 'Italian', voiceCount: 5 },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', voiceCount: 5 },
    { code: 'pt-PT', name: 'Portuguese (Portugal)', voiceCount: 5 },
    { code: 'ja-JP', name: 'Japanese', voiceCount: 5 },
    { code: 'ko-KR', name: 'Korean', voiceCount: 5 },
    { code: 'zh-CN', name: 'Chinese (Simplified)', voiceCount: 5 },
    { code: 'zh-TW', name: 'Chinese (Traditional)', voiceCount: 5 },
    { code: 'ar-SA', name: 'Arabic', voiceCount: 5 },
    { code: 'hi-IN', name: 'Hindi', voiceCount: 5 },
    { code: 'ru-RU', name: 'Russian', voiceCount: 5 },
  ];
  
  return languages;
}

/**
 * List available voices
 * Returns Gemini voices
 * 
 * @returns {Object} - Grouped voices by language
 */
export function listAvailableVoices() {
  const voices = {
    'English': [
      { name: 'Kore', description: 'Warm, friendly' },
      { name: 'Charon', description: 'Deep, authoritative' },
      { name: 'Puck', description: 'Energetic, youthful' },
      { name: 'Fenrir', description: 'Strong, confident' },
      { name: 'Aoede', description: 'Melodic, expressive' },
    ],
  };
  
  return voices;
}

// Export voice constants for direct use
export { VOICES } from '../tts';
