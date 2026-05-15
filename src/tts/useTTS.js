/**
 * Main TTS Orchestrator
 * Ties together API, caching, and playback
 */

import { fetchTTSAudio, VOICES, STYLES, isGeminiTTSAvailable } from './ttsApi';
import { base64ToAudioUrl } from './audioConverter';
import { playAudio, pauseAudio, stopAudio, resumeAudio, isPlaying } from './ttsPlayer';
import { getCachedAudio, cacheAudio, logUsage, getMonthlyUsage } from './ttsCache';

// Monthly character limit per user (adjust as needed)
const MONTHLY_CHAR_LIMIT = 100000; // 100k chars per month

/**
 * Speak text using Gemini TTS
 * @param {string} text - Text to speak
 * @param {Object} options - TTS options
 * @param {string} options.voice - Voice name (default: Kore)
 * @param {string} options.style - Speaking style (optional)
 * @param {string} options.userId - User ID for usage tracking
 * @param {boolean} options.useCache - Use caching (default: true)
 * @param {number} options.volume - Volume (0-1, default: 1)
 * @param {number} options.playbackRate - Speed (0.5-2, default: 1)
 * @param {Function} options.onStart - Callback when audio starts
 * @param {Function} options.onEnd - Callback when audio ends
 * @param {Function} options.onError - Callback on error
 * @returns {Promise<void>}
 */
export const speak = async (text, options = {}) => {
  const {
    voice = VOICES.KORE,
    style = '',
    userId = null,
    useCache = true,
    volume = 1,
    playbackRate = 1,
    onStart,
    onEnd,
    onError,
  } = options;

  try {
    // Validate
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (!isGeminiTTSAvailable()) {
      throw new Error('Gemini TTS API key not configured');
    }

    // Check monthly usage quota if userId provided
    if (userId) {
      const used = await getMonthlyUsage(userId);
      if (used + text.length > MONTHLY_CHAR_LIMIT) {
        throw new Error(`Monthly TTS limit reached (${MONTHLY_CHAR_LIMIT} chars). Used: ${used}`);
      }
    }

    let audioUrl;

    // Try cache first if enabled
    if (useCache) {
      const cached = await getCachedAudio(text, voice);
      if (cached) {
        console.log('[TTS] Using cached audio');
        audioUrl = cached;
        
        // Play cached audio
        playAudio(audioUrl, {
          volume,
          playbackRate,
          onStart,
          onEnd,
          onError,
        });
        
        return;
      }
    }

    // Not cached - call Gemini API
    console.log('[TTS] Generating new audio...');
    const base64Audio = await fetchTTSAudio(text, voice, style);

    // Cache it for next time if enabled
    if (useCache) {
      try {
        audioUrl = await cacheAudio(text, voice, base64Audio);
      } catch (cacheError) {
        console.warn('[TTS] Caching failed, using temporary URL:', cacheError);
        audioUrl = base64ToAudioUrl(base64Audio);
      }
    } else {
      audioUrl = base64ToAudioUrl(base64Audio);
    }

    // Log usage if userId provided
    if (userId) {
      await logUsage(userId, text.length, voice);
    }

    // Play audio
    playAudio(audioUrl, {
      volume,
      playbackRate,
      onStart,
      onEnd,
      onError,
    });

  } catch (error) {
    console.error('[TTS] Error:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

/**
 * Speak long text by chunking into sentences
 * @param {string} text - Long text to speak
 * @param {Object} options - Same as speak() options
 * @returns {Promise<void>}
 */
export const speakLong = async (text, options = {}) => {
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  console.log(`[TTS] Speaking ${sentences.length} sentences`);

  let currentIndex = 0;

  const speakNext = async () => {
    if (currentIndex >= sentences.length) {
      if (options.onEnd) options.onEnd();
      return;
    }

    const sentence = sentences[currentIndex].trim();
    currentIndex++;

    await speak(sentence, {
      ...options,
      onEnd: () => {
        // Speak next sentence when current one ends
        speakNext();
      },
    });
  };

  if (options.onStart) options.onStart();
  await speakNext();
};

/**
 * Check if user has reached monthly limit
 * @param {string} userId - User ID
 * @param {number} additionalChars - Additional chars to check
 * @returns {Promise<Object>} { allowed: boolean, used: number, limit: number, remaining: number }
 */
export const checkQuota = async (userId, additionalChars = 0) => {
  const used = await getMonthlyUsage(userId);
  const remaining = MONTHLY_CHAR_LIMIT - used;
  const allowed = (used + additionalChars) <= MONTHLY_CHAR_LIMIT;

  return {
    allowed,
    used,
    limit: MONTHLY_CHAR_LIMIT,
    remaining,
  };
};

// Re-export player controls
export { 
  pauseAudio, 
  stopAudio, 
  resumeAudio, 
  isPlaying,
  VOICES,
  STYLES,
};

// Re-export for convenience
export { isGeminiTTSAvailable } from './ttsApi';
export { getMonthlyUsage, getUserStats } from './ttsCache';
