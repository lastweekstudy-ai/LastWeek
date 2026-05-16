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

  console.log('[TTS] 🎵 Speak called');
  console.log('[TTS] Options:', { voice, style, userId, useCache, volume, playbackRate });

  try {
    // Validate
    if (!text || text.trim().length === 0) {
      console.error('[TTS] ❌ Empty text');
      throw new Error('Text cannot be empty');
    }

    console.log('[TTS] Text to speak:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));

    if (!isGeminiTTSAvailable()) {
      console.error('[TTS] ❌ Gemini TTS not available');
      throw new Error('Gemini TTS API key not configured');
    }

    console.log('[TTS] ✅ Gemini TTS is available');

    // Check monthly usage quota if userId provided
    if (userId) {
      console.log('[TTS] 📊 Checking quota for user:', userId);
      const used = await getMonthlyUsage(userId);
      console.log('[TTS] Usage:', used, '/', MONTHLY_CHAR_LIMIT);
      if (used + text.length > MONTHLY_CHAR_LIMIT) {
        console.error('[TTS] ❌ Quota exceeded');
        throw new Error(`Monthly TTS limit reached (${MONTHLY_CHAR_LIMIT} chars). Used: ${used}`);
      }
      console.log('[TTS] ✅ Quota OK, remaining:', MONTHLY_CHAR_LIMIT - used);
    }

    let audioUrl;

    // Try cache first if enabled
    if (useCache) {
      console.log('[TTS] 🔍 Checking cache...');
      const cached = await getCachedAudio(text, voice);
      if (cached) {
        console.log('[TTS] ✅ Cache hit! Using cached audio');
        audioUrl = cached;
        
        // Play cached audio
        console.log('[TTS] 🔊 Playing cached audio');
        playAudio(audioUrl, {
          volume,
          playbackRate,
          onStart,
          onEnd,
          onError,
        });
        
        return;
      }
      console.log('[TTS] ❌ Cache miss, generating new audio');
    }

    // Not cached - call Gemini API
    console.log('[TTS] 🎤 Generating new audio via Gemini...');
    const base64Audio = await fetchTTSAudio(text, voice, style);
    console.log('[TTS] ✅ Audio generated, size:', base64Audio.length, 'chars');

    // Cache it for next time if enabled
    if (useCache) {
      try {
        console.log('[TTS] 💾 Caching audio...');
        audioUrl = await cacheAudio(text, voice, base64Audio);
        console.log('[TTS] ✅ Audio cached successfully');
      } catch (cacheError) {
        console.warn('[TTS] ⚠️ Caching failed, using temporary URL:', cacheError);
        audioUrl = base64ToAudioUrl(base64Audio);
      }
    } else {
      console.log('[TTS] ⏭️ Skipping cache, creating temporary URL');
      audioUrl = base64ToAudioUrl(base64Audio);
    }

    // Log usage if userId provided
    if (userId) {
      console.log('[TTS] 📝 Logging usage...');
      await logUsage(userId, text.length, voice);
      console.log('[TTS] ✅ Usage logged');
    }

    // Play audio
    console.log('[TTS] 🔊 Playing audio');
    playAudio(audioUrl, {
      volume,
      playbackRate,
      onStart,
      onEnd,
      onError,
    });

    console.log('[TTS] 🎉 Speak completed successfully!');

  } catch (error) {
    console.error('[TTS] ❌ Error:', error);
    console.error('[TTS] Error stack:', error.stack);
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
