/**
 * Audio Converter Utilities
 * Converts base64 audio data to playable formats
 */

/**
 * Convert base64 audio data to a playable audio URL
 * @param {string} base64 - Base64 encoded audio data
 * @param {string} mimeType - MIME type (default: audio/wav)
 * @returns {string} Object URL for the audio
 */
export const base64ToAudioUrl = (base64, mimeType = 'audio/wav') => {
  try {
    // Decode base64 to binary
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Create blob and object URL
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('[Audio Converter] Error converting base64 to audio:', error);
    throw new Error('Failed to convert audio data');
  }
};

/**
 * Convert base64 to Blob
 * @param {string} base64 - Base64 encoded data
 * @param {string} mimeType - MIME type
 * @returns {Blob}
 */
export const base64ToBlob = (base64, mimeType = 'audio/wav') => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: mimeType });
};

/**
 * Convert base64 to File object
 * @param {string} base64 - Base64 encoded data
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 * @returns {File}
 */
export const base64ToFile = (base64, filename, mimeType = 'audio/wav') => {
  const blob = base64ToBlob(base64, mimeType);
  return new File([blob], filename, { type: mimeType });
};

/**
 * Revoke an object URL to free memory
 * @param {string} url - Object URL to revoke
 */
export const revokeAudioUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Download audio as file
 * @param {string} base64 - Base64 encoded audio
 * @param {string} filename - Download filename
 */
export const downloadAudio = (base64, filename = 'audio.wav') => {
  const url = base64ToAudioUrl(base64);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  revokeAudioUrl(url);
};
