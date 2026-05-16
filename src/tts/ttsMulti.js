/**
 * Multi-Speaker TTS
 * Handles conversations with multiple voices
 * Note: Multi-speaker is not yet supported via Appwrite Function
 * This module will speak each line separately for now
 */

import { fetchTTSAudio, VOICES } from './ttsApi';
import { base64ToAudioUrl } from './audioConverter';
import { playAudio } from './ttsPlayer';
import { getCachedAudio, cacheAudio, logUsage, getMonthlyUsage } from './ttsCache';

/**
 * Generate cache key for multi-speaker audio
 * @param {Array} speakers - Array of speaker configs
 * @param {Array} script - Array of script lines
 * @returns {Promise<string>}
 */
const generateMultiSpeakerCacheKey = async (speakers, script) => {
  const speakersStr = speakers.map(s => `${s.name}:${s.voice}`).join('|');
  const scriptStr = script.map(s => `${s.speaker}:${s.line}`).join('|');
  const raw = `multi_${speakersStr}_${scriptStr}`;
  
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Speak a multi-speaker conversation
 * @param {Array} speakers - Array of {name, voice} objects
 * @param {Array} script - Array of {speaker, line} objects
 * @param {Object} options - Playback options
 * @param {string} options.userId - User ID for usage tracking
 * @param {boolean} options.useCache - Use caching (default: true)
 * @param {number} options.volume - Volume (0-1)
 * @param {number} options.playbackRate - Speed (0.5-2)
 * @param {Function} options.onStart - Callback when audio starts
 * @param {Function} options.onEnd - Callback when audio ends
 * @param {Function} options.onError - Callback on error
 * @returns {Promise<void>}
 */
export const speakConversation = async (speakers, script, options = {}) => {
  const {
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
    if (!speakers || speakers.length === 0) {
      throw new Error('At least one speaker is required');
    }

    if (!script || script.length === 0) {
      throw new Error('Script cannot be empty');
    }

    // Calculate total characters
    const totalChars = script.reduce((sum, line) => sum + line.line.length, 0);

    // Check quota if userId provided
    if (userId) {
      const used = await getMonthlyUsage(userId);
      const MONTHLY_LIMIT = 100000;
      if (used + totalChars > MONTHLY_LIMIT) {
        throw new Error(`Monthly TTS limit reached. Used: ${used}/${MONTHLY_LIMIT}`);
      }
    }

    let audioUrl;

    // Try cache first if enabled
    if (useCache) {
      const cacheKey = await generateMultiSpeakerCacheKey(speakers, script);
      // Use a dummy text for cache lookup
      const cached = await getCachedAudio(cacheKey, 'multi');
      if (cached) {
        console.log('[Multi-Speaker TTS] Using cached audio');
        audioUrl = cached;
        
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

    // Not cached - generate new audio
    // Note: Multi-speaker not yet supported, speaking lines sequentially
    console.log('[Multi-Speaker TTS] Generating conversation audio (sequential)...');
    console.warn('[Multi-Speaker TTS] True multi-speaker not yet supported, speaking lines one by one');
    
    // For now, concatenate all lines and speak with first speaker's voice
    const fullText = script.map(s => `${s.speaker}: ${s.line}`).join('. ');
    const firstVoice = speakers[0]?.voice || VOICES.KORE;
    
    const base64Audio = await fetchTTSAudio(fullText, firstVoice, '');

    // Cache it if enabled
    if (useCache) {
      try {
        const cacheKey = await generateMultiSpeakerCacheKey(speakers, script);
        audioUrl = await cacheAudio(cacheKey, 'multi', base64Audio);
      } catch (cacheError) {
        console.warn('[Multi-Speaker TTS] Caching failed:', cacheError);
        audioUrl = base64ToAudioUrl(base64Audio);
      }
    } else {
      audioUrl = base64ToAudioUrl(base64Audio);
    }

    // Log usage if userId provided
    if (userId) {
      await logUsage(userId, totalChars, 'multi-speaker');
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
    console.error('[Multi-Speaker TTS] Error:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

/**
 * Create a conversation from a dialogue array
 * Convenience function to format dialogue for speakConversation
 * @param {Array} dialogue - Array of {speaker, text, voice} objects
 * @returns {Object} { speakers, script }
 */
export const createConversation = (dialogue) => {
  const speakerMap = new Map();
  const script = [];

  dialogue.forEach(({ speaker, text, voice = VOICES.KORE }) => {
    if (!speakerMap.has(speaker)) {
      speakerMap.set(speaker, voice);
    }
    script.push({ speaker, line: text });
  });

  const speakers = Array.from(speakerMap.entries()).map(([name, voice]) => ({
    name,
    voice,
  }));

  return { speakers, script };
};

/**
 * Preset conversation templates
 */
export const CONVERSATION_PRESETS = {
  // Language learning dialogue
  LANGUAGE_LESSON: (targetLang, phrases) => {
    return createConversation([
      { speaker: 'Teacher', text: `Let's practice ${targetLang}`, voice: VOICES.KORE },
      ...phrases.flatMap((phrase, i) => [
        { speaker: 'Teacher', text: phrase.english, voice: VOICES.KORE },
        { speaker: 'Native', text: phrase.target, voice: VOICES.AOEDE },
      ]),
    ]);
  },

  // Interview practice
  INTERVIEW: (questions) => {
    return createConversation([
      { speaker: 'Interviewer', text: 'Welcome! Let me ask you a few questions.', voice: VOICES.CHARON },
      ...questions.flatMap((q, i) => [
        { speaker: 'Interviewer', text: q, voice: VOICES.CHARON },
        { speaker: 'Candidate', text: '[Your answer here]', voice: VOICES.PUCK },
      ]),
    ]);
  },

  // Story narration with characters
  STORY: (narrator, characters, lines) => {
    const dialogue = [
      { speaker: 'Narrator', text: narrator, voice: VOICES.FENRIR },
    ];

    lines.forEach(({ character, text }) => {
      const voice = characters[character] || VOICES.KORE;
      dialogue.push({ speaker: character, text, voice });
    });

    return createConversation(dialogue);
  },
};
