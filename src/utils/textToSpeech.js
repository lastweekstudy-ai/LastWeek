/**
 * Text-to-Speech Utility using Web Speech API
 * Browser-native TTS - no external dependencies needed
 */

class TTSPlayer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.currentUtterance = null;
    this.isInitialized = false;
    
    // Check browser support
    if (!this.synth) {
      console.warn('Web Speech API not supported in this browser');
      return;
    }
    
    this.loadVoices();
  }

  /**
   * Load available voices (async operation)
   */
  loadVoices() {
    return new Promise((resolve) => {
      this.voices = this.synth.getVoices();
      
      if (this.voices.length > 0) {
        this.isInitialized = true;
        console.log(`[TTS] Loaded ${this.voices.length} voices`);
        resolve(this.voices);
        return;
      }
      
      // Voices load asynchronously in some browsers
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
        this.isInitialized = true;
        console.log(`[TTS] Loaded ${this.voices.length} voices`);
        resolve(this.voices);
      };
    });
  }

  /**
   * Get all available voices
   */
  async getVoices() {
    if (!this.isInitialized) {
      await this.loadVoices();
    }
    return this.voices;
  }

  /**
   * Get best voice for a language
   * @param {string} lang - Language code (e.g., 'en-US', 'bn-BD')
   */
  getVoiceForLang(lang) {
    if (!this.voices.length) {
      return null;
    }

    // Try exact match first
    let voice = this.voices.find(v => v.lang === lang);
    
    // Try language prefix match (e.g., 'en' from 'en-US')
    if (!voice) {
      const langPrefix = lang.split('-')[0];
      voice = this.voices.find(v => v.lang.startsWith(langPrefix));
    }
    
    // Fallback to first available voice
    return voice || this.voices[0];
  }

  /**
   * Speak text with options
   * @param {string} text - Text to speak
   * @param {string} lang - Language code (default: 'en-US')
   * @param {object} options - Additional options
   * @returns {SpeechSynthesisUtterance} - Utterance object for event handling
   */
  speak(text, lang = 'en-US', options = {}) {
    if (!this.synth) {
      console.warn('[TTS] Speech synthesis not available');
      return null;
    }

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const voice = this.getVoiceForLang(lang);
    if (voice) {
      utterance.voice = voice;
    }
    
    // Set language
    utterance.lang = lang;
    
    // Set options with defaults
    utterance.rate = options.rate || 1;       // 0.1 to 10 (1 = normal)
    utterance.pitch = options.pitch || 1;     // 0 to 2 (1 = normal)
    utterance.volume = options.volume || 1;   // 0 to 1 (1 = max)
    
    // Event handlers
    utterance.onstart = () => {
      console.log('[TTS] Started speaking');
      if (options.onStart) options.onStart();
    };
    
    utterance.onend = () => {
      console.log('[TTS] Finished speaking');
      this.currentUtterance = null;
      if (options.onEnd) options.onEnd();
    };
    
    utterance.onerror = (event) => {
      console.error('[TTS] Error:', event.error);
      this.currentUtterance = null;
      if (options.onError) options.onError(event);
    };
    
    utterance.onpause = () => {
      console.log('[TTS] Paused');
      if (options.onPause) options.onPause();
    };
    
    utterance.onresume = () => {
      console.log('[TTS] Resumed');
      if (options.onResume) options.onResume();
    };
    
    // Word boundary event (useful for highlighting current word)
    utterance.onboundary = (event) => {
      if (options.onBoundary) {
        const word = text.substr(event.charIndex, event.charLength);
        options.onBoundary(word, event.charIndex, event.charLength);
      }
    };
    
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    
    return utterance;
  }

  /**
   * Speak long text by chunking into sentences
   * Chrome has a ~15 second limit, so we chunk long text
   * @param {string} text - Long text to speak
   * @param {string} lang - Language code
   * @param {object} options - Additional options
   */
  speakLong(text, lang = 'en-US', options = {}) {
    if (!this.synth) {
      console.warn('[TTS] Speech synthesis not available');
      return;
    }

    // Stop any ongoing speech
    this.stop();

    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    console.log(`[TTS] Speaking ${sentences.length} sentences`);
    
    let currentIndex = 0;
    
    const speakNext = () => {
      if (currentIndex >= sentences.length) {
        if (options.onEnd) options.onEnd();
        return;
      }
      
      const sentence = sentences[currentIndex].trim();
      currentIndex++;
      
      const utterance = new SpeechSynthesisUtterance(sentence);
      const voice = this.getVoiceForLang(lang);
      if (voice) utterance.voice = voice;
      
      utterance.lang = lang;
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      utterance.onend = () => {
        // Speak next sentence
        speakNext();
      };
      
      utterance.onerror = (event) => {
        console.error('[TTS] Error:', event.error);
        if (options.onError) options.onError(event);
      };
      
      this.synth.speak(utterance);
    };
    
    // Start speaking
    if (options.onStart) options.onStart();
    speakNext();
  }

  /**
   * Pause current speech
   */
  pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Stop and cancel all speech
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Check if currently speaking
   */
  get isSpeaking() {
    return this.synth ? this.synth.speaking : false;
  }

  /**
   * Check if currently paused
   */
  get isPaused() {
    return this.synth ? this.synth.paused : false;
  }

  /**
   * Check if speech is pending
   */
  get isPending() {
    return this.synth ? this.synth.pending : false;
  }

  /**
   * Check if TTS is supported
   */
  static isSupported() {
    return 'speechSynthesis' in window;
  }
}

// Create singleton instance
const ttsPlayer = new TTSPlayer();

// Export both class and instance
export { TTSPlayer, ttsPlayer };
export default ttsPlayer;
