/**
 * TTS Module - Main Export
 * Gemini-powered Text-to-Speech with caching and usage tracking
 */

// Main TTS functions
export { 
  speak, 
  speakLong,
  checkQuota,
  pauseAudio, 
  stopAudio, 
  resumeAudio, 
  isPlaying,
  VOICES,
  STYLES,
  isGeminiTTSAvailable,
  getMonthlyUsage,
  getUserStats,
} from './useTTS';

// Multi-speaker TTS
export {
  speakConversation,
  createConversation,
  CONVERSATION_PRESETS,
} from './ttsMulti';

// Low-level utilities (for advanced use)
export { fetchTTSAudio } from './ttsApi';
export { base64ToAudioUrl, base64ToBlob, base64ToFile, downloadAudio } from './audioConverter';
export { 
  playAudio, 
  getCurrentTime, 
  getDuration, 
  seekTo, 
  setVolume, 
  setPlaybackRate,
  getCurrentAudio,
} from './ttsPlayer';
export { 
  getCachedAudio, 
  cacheAudio, 
  logUsage, 
  clearOldCache,
} from './ttsCache';
