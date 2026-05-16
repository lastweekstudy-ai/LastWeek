/**
 * Web Speech API Wrapper
 * Provides text-to-speech functionality using browser's built-in speech synthesis
 * (Gemini TTS requires @google/genai SDK which doesn't work in browsers)
 */

/**
 * Speak text using Web Speech API
 * 
 * @param {string} text - Text to speak
 * @param {string} langCode - Language code (e.g., 'en-US', 'es')
 * @param {Object} options - Speech options
 * @param {number} options.rate - Speech rate (0.5-2, default: 1)
 * @param {number} options.pitch - Pitch (0-2, default: 1)
 * @param {number} options.volume - Volume (0-1, default: 1)
 * @param {Function} options.onUnsupported - Callback if TTS not available
 * @param {Function} options.onStart - Callback when speech starts
 * @param {Function} options.onEnd - Callback when speech ends
 * @param {Function} options.onError - Callback on error
 * @returns {Promise<Object>} - { ok: boolean, usingDefaultVoice: boolean }
 */
export async function speak(text, langCode = 'en', options = {}) {
  try {
    // Check if Web Speech API is available
    if (!window.speechSynthesis) {
      throw new Error('Web Speech API is not supported in this browser');
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Wait a bit for cancel to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    
    // Try to find a voice for the language
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = langCode.split('-')[0];
    const matchingVoice = voices.find(v => v.lang.startsWith(langPrefix));
    
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    // Set up callbacks
    if (options.onStart) {
      utterance.onstart = options.onStart;
    }
    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }
    if (options.onError) {
      utterance.onerror = options.onError;
    }
    
    // Speak
    window.speechSynthesis.speak(utterance);
    
    return { ok: true, usingDefaultVoice: !matchingVoice };
  } catch (error) {
    console.error('[Speech] Error:', error);
    
    if (options.onUnsupported) {
      options.onUnsupported('Text-to-speech is not available. Please check your browser settings.');
    }
    
    if (options.onError) {
      options.onError(error);
    }
    
    return { ok: false, error: error.message };
  }
}

/**
 * Check if voice is available for a language
 * @param {string} langCode - Language code
 * @returns {boolean} - True if voice available
 */
export function isVoiceAvailable(langCode) {
  if (!window.speechSynthesis) return false;
  
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = langCode.split('-')[0];
  return voices.some(v => v.lang.startsWith(langPrefix));
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
 * @returns {boolean} - True if supported
 */
export function isSpeechSupported() {
  return 'speechSynthesis' in window;
}

/**
 * Get available languages
 * Returns all supported languages from browser
 * 
 * @returns {Array} - Array of language objects
 */
export function getAvailableLanguages() {
  if (!window.speechSynthesis) return [];
  
  const voices = window.speechSynthesis.getVoices();
  const languageMap = {};
  
  // Group voices by language
  voices.forEach(voice => {
    const langCode = voice.lang;
    if (!languageMap[langCode]) {
      languageMap[langCode] = {
        code: langCode,
        name: voice.name.split(' - ')[0] || langCode,
        voiceCount: 0,
      };
    }
    languageMap[langCode].voiceCount++;
  });
  
  return Object.values(languageMap);
}

/**
 * List available voices
 * Returns browser voices grouped by language
 * 
 * @returns {Object} - Grouped voices by language
 */
export function listAvailableVoices() {
  if (!window.speechSynthesis) return {};
  
  const voices = window.speechSynthesis.getVoices();
  const grouped = {};
  
  voices.forEach(voice => {
    const lang = voice.lang.split('-')[0];
    if (!grouped[lang]) {
      grouped[lang] = [];
    }
    grouped[lang].push({
      name: voice.name,
      lang: voice.lang,
      default: voice.default,
    });
  });
  
  return grouped;
}
