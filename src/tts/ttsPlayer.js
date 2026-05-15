/**
 * TTS Audio Player
 * Manages audio playback with play/pause/stop controls
 */

let currentAudio = null;
let currentUrl = null;

/**
 * Play audio from URL
 * @param {string} audioUrl - Audio URL (blob or http)
 * @param {Object} options - Playback options
 * @returns {HTMLAudioElement} Audio element
 */
export const playAudio = (audioUrl, options = {}) => {
  // Stop any currently playing audio
  stopAudio();

  try {
    currentAudio = new Audio(audioUrl);
    currentUrl = audioUrl;

    // Apply options
    if (options.volume !== undefined) {
      currentAudio.volume = Math.max(0, Math.min(1, options.volume));
    }
    if (options.playbackRate !== undefined) {
      currentAudio.playbackRate = Math.max(0.5, Math.min(2, options.playbackRate));
    }
    if (options.loop !== undefined) {
      currentAudio.loop = options.loop;
    }

    // Event handlers
    if (options.onStart) {
      currentAudio.addEventListener('play', options.onStart);
    }
    if (options.onEnd) {
      currentAudio.addEventListener('ended', options.onEnd);
    }
    if (options.onError) {
      currentAudio.addEventListener('error', options.onError);
    }
    if (options.onPause) {
      currentAudio.addEventListener('pause', options.onPause);
    }

    // Auto-cleanup on end
    currentAudio.addEventListener('ended', () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
      currentAudio = null;
      currentUrl = null;
    });

    // Play
    currentAudio.play().catch(error => {
      console.error('[TTS Player] Playback error:', error);
      if (options.onError) {
        options.onError(error);
      }
    });

    return currentAudio;
  } catch (error) {
    console.error('[TTS Player] Error creating audio:', error);
    throw error;
  }
};

/**
 * Pause current audio
 */
export const pauseAudio = () => {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
  }
};

/**
 * Resume paused audio
 */
export const resumeAudio = () => {
  if (currentAudio && currentAudio.paused) {
    currentAudio.play().catch(error => {
      console.error('[TTS Player] Resume error:', error);
    });
  }
};

/**
 * Stop and cleanup current audio
 */
export const stopAudio = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Cleanup blob URL
  if (currentUrl && currentUrl.startsWith('blob:')) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
};

/**
 * Check if audio is currently playing
 * @returns {boolean}
 */
export const isPlaying = () => {
  return currentAudio && !currentAudio.paused;
};

/**
 * Check if audio is paused
 * @returns {boolean}
 */
export const isPaused = () => {
  return currentAudio && currentAudio.paused;
};

/**
 * Get current playback time
 * @returns {number} Current time in seconds
 */
export const getCurrentTime = () => {
  return currentAudio ? currentAudio.currentTime : 0;
};

/**
 * Get total duration
 * @returns {number} Duration in seconds
 */
export const getDuration = () => {
  return currentAudio ? currentAudio.duration : 0;
};

/**
 * Seek to specific time
 * @param {number} time - Time in seconds
 */
export const seekTo = (time) => {
  if (currentAudio) {
    currentAudio.currentTime = Math.max(0, Math.min(time, currentAudio.duration));
  }
};

/**
 * Set volume
 * @param {number} volume - Volume (0 to 1)
 */
export const setVolume = (volume) => {
  if (currentAudio) {
    currentAudio.volume = Math.max(0, Math.min(1, volume));
  }
};

/**
 * Set playback rate
 * @param {number} rate - Playback rate (0.5 to 2)
 */
export const setPlaybackRate = (rate) => {
  if (currentAudio) {
    currentAudio.playbackRate = Math.max(0.5, Math.min(2, rate));
  }
};

/**
 * Get current audio element
 * @returns {HTMLAudioElement|null}
 */
export const getCurrentAudio = () => {
  return currentAudio;
};
