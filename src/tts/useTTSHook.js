/**
 * React Hook for TTS
 * Provides easy-to-use TTS functionality in React components
 */

import { useState, useCallback, useEffect } from 'react';
import { speak, speakLong, pauseAudio, stopAudio, resumeAudio, isPlaying as checkIsPlaying, VOICES, STYLES } from './useTTS';
import { speakConversation } from './ttsMulti';

/**
 * React hook for TTS functionality
 * @param {Object} options - Default options
 * @param {string} options.voice - Default voice
 * @param {string} options.userId - User ID for tracking
 * @param {boolean} options.useCache - Use caching
 * @returns {Object} TTS controls and state
 */
export const useTTS = (options = {}) => {
  const {
    voice = VOICES.KORE,
    userId = null,
    useCache = true,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Speak text
   */
  const speakText = useCallback(async (text, customOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      await speak(text, {
        voice,
        userId,
        useCache,
        ...customOptions,
        onStart: () => {
          setIsPlaying(true);
          setLoading(false);
          if (customOptions.onStart) customOptions.onStart();
        },
        onEnd: () => {
          setIsPlaying(false);
          if (customOptions.onEnd) customOptions.onEnd();
        },
        onError: (err) => {
          setError(err.message);
          setIsPlaying(false);
          setLoading(false);
          if (customOptions.onError) customOptions.onError(err);
        },
      });
    } catch (err) {
      setError(err.message);
      setIsPlaying(false);
      setLoading(false);
    }
  }, [voice, userId, useCache]);

  /**
   * Speak long text
   */
  const speakLongText = useCallback(async (text, customOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      await speakLong(text, {
        voice,
        userId,
        useCache,
        ...customOptions,
        onStart: () => {
          setIsPlaying(true);
          setLoading(false);
          if (customOptions.onStart) customOptions.onStart();
        },
        onEnd: () => {
          setIsPlaying(false);
          if (customOptions.onEnd) customOptions.onEnd();
        },
        onError: (err) => {
          setError(err.message);
          setIsPlaying(false);
          setLoading(false);
          if (customOptions.onError) customOptions.onError(err);
        },
      });
    } catch (err) {
      setError(err.message);
      setIsPlaying(false);
      setLoading(false);
    }
  }, [voice, userId, useCache]);

  /**
   * Speak conversation
   */
  const speakConv = useCallback(async (speakers, script, customOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      await speakConversation(speakers, script, {
        userId,
        useCache,
        ...customOptions,
        onStart: () => {
          setIsPlaying(true);
          setLoading(false);
          if (customOptions.onStart) customOptions.onStart();
        },
        onEnd: () => {
          setIsPlaying(false);
          if (customOptions.onEnd) customOptions.onEnd();
        },
        onError: (err) => {
          setError(err.message);
          setIsPlaying(false);
          setLoading(false);
          if (customOptions.onError) customOptions.onError(err);
        },
      });
    } catch (err) {
      setError(err.message);
      setIsPlaying(false);
      setLoading(false);
    }
  }, [userId, useCache]);

  /**
   * Pause audio
   */
  const pause = useCallback(() => {
    pauseAudio();
    setIsPlaying(false);
  }, []);

  /**
   * Resume audio
   */
  const resume = useCallback(() => {
    resumeAudio();
    setIsPlaying(true);
  }, []);

  /**
   * Stop audio
   */
  const stop = useCallback(() => {
    stopAudio();
    setIsPlaying(false);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return {
    speak: speakText,
    speakLong: speakLongText,
    speakConversation: speakConv,
    pause,
    resume,
    stop,
    isPlaying,
    loading,
    error,
    clearError,
    VOICES,
    STYLES,
  };
};

export default useTTS;
