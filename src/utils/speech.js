/**
 * speech.js — Robust cross-browser TTS utility for language learning
 *
 * Problems solved:
 * 1. Bangla (bn-BD), Hindi (hi-IN) have NO voices in most browsers on Windows/Mac.
 *    The browser silently skips the utterance — no error, no sound.
 * 2. The lesson text format is "word (romanization) [translation]" — we must
 *    strip the romanization and translation before speaking, otherwise the TTS
 *    reads out "(nǐ hǎo) [Hello]" literally.
 * 3. Some languages need a specific voice variant (e.g. zh-TW vs zh-CN).
 *
 * Strategy:
 * - On first call, enumerate all available voices and cache them.
 * - For each language, try BCP-47 variants in priority order.
 * - If no matching voice exists, return { supported: false } so the UI can
 *   show a helpful message instead of silently doing nothing.
 */

// BCP-47 candidates per language code, in priority order.
// Multiple variants listed because browser voice libraries vary wildly.
const LANG_BCP47_CANDIDATES = {
  en: ['en-US', 'en-GB', 'en-AU', 'en'],
  zh: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
  es: ['es-ES', 'es-MX', 'es-US', 'es'],
  de: ['de-DE', 'de-AT', 'de-CH', 'de'],
  fr: ['fr-FR', 'fr-CA', 'fr-BE', 'fr'],
};

// Human-readable language names for the "no voice" warning
const LANG_NAMES = {
  en: 'English', zh: 'Chinese', es: 'Spanish',
  de: 'German',  fr: 'French',
};

// Cache: langCode → best BCP-47 tag (or null if unsupported)
const voiceCache = {};
let allVoices = null;

/**
 * Load and cache all available voices.
 * Voices load asynchronously in Chrome — we wait for the event.
 */
function loadVoices() {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      allVoices = voices;
      resolve(voices);
      return;
    }
    // Chrome fires onvoiceschanged when voices are ready
    window.speechSynthesis.onvoiceschanged = () => {
      allVoices = window.speechSynthesis.getVoices();
      resolve(allVoices);
    };
    // Timeout fallback — some browsers never fire the event
    setTimeout(() => {
      allVoices = window.speechSynthesis.getVoices();
      resolve(allVoices);
    }, 1500);
  });
}

/**
 * Find the best available voice for a language code.
 * Returns { voice, bcp47 } or null if nothing found.
 */
async function findVoice(langCode) {
  if (voiceCache[langCode] !== undefined) return voiceCache[langCode];

  const voices = allVoices || await loadVoices();
  const candidates = LANG_BCP47_CANDIDATES[langCode] || [langCode];

  for (const tag of candidates) {
    // Exact match first
    const exact = voices.find(v => v.lang === tag);
    if (exact) {
      voiceCache[langCode] = { voice: exact, bcp47: tag };
      return voiceCache[langCode];
    }
    // Prefix match (e.g. "zh" matches "zh-CN")
    const prefix = voices.find(v => v.lang.startsWith(tag.split('-')[0]));
    if (prefix) {
      voiceCache[langCode] = { voice: prefix, bcp47: prefix.lang };
      return voiceCache[langCode];
    }
  }

  // No voice found
  voiceCache[langCode] = null;
  return null;
}

/**
 * Strip romanization, IPA, and translation annotations from lesson text
 * before passing to TTS. The lesson format is:
 *   "你好 (nǐ hǎo) [Hello]"
 *   "নমস্কার (nô-môs-kar) [Hello]"
 *   "Bonjour — Good morning"
 *
 * We want only the script/word part: "你好", "নমস্কার", "Bonjour"
 */
export function extractSpeakableText(text, langCode) {
  if (!text) return '';

  let clean = text;

  // Remove content in parentheses — romanization/pinyin: (nǐ hǎo)
  clean = clean.replace(/\([^)]*\)/g, '');

  // Remove content in square brackets — translations: [Hello]
  clean = clean.replace(/\[[^\]]*\]/g, '');

  // Remove content in curly braces
  clean = clean.replace(/\{[^}]*\}/g, '');

  // Remove IPA in angle brackets: <nɪ˨˩˦ xɑʊ̯˨˩˦>
  clean = clean.replace(/<[^>]*>/g, '');

  // Remove "Example N:" or "N." prefixes
  clean = clean.replace(/^(Example\s*\d+\s*[:\-—]?\s*|\d+\.\s*)/i, '');

  // Remove " — translation" style suffixes (dash followed by Latin text for non-Latin scripts)
  // Only strip if the language uses a non-Latin script
  const nonLatinScripts = ['zh'];
  if (nonLatinScripts.includes(langCode)) {
    // Strip everything after " — " or " - " or ": "
    clean = clean.replace(/\s*[—\-–:]\s*[A-Za-z].*$/g, '');
  }

  // Collapse whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  // If nothing left (e.g. the whole string was romanization), return original trimmed
  return clean || text.trim();
}

/**
 * Main speak function.
 *
 * @param {string} text       - Raw lesson text (may contain romanization/translation)
 * @param {string} langCode   - App language code: 'en', 'zh', 'es', 'de', 'fr', 'hi', 'bn'
 * @param {object} [options]
 * @param {number} [options.rate=0.85]   - Speech rate
 * @param {number} [options.pitch=1]     - Pitch
 * @param {function} [options.onUnsupported] - Called when no voice is available
 *
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function speak(text, langCode, options = {}) {
  if (!window.speechSynthesis) {
    options.onUnsupported?.('Speech synthesis not supported in this browser.');
    return { ok: false, reason: 'no_api' };
  }

  const speakable = extractSpeakableText(text, langCode);
  if (!speakable) return { ok: false, reason: 'empty_text' };

  const voiceInfo = await findVoice(langCode);

  if (!voiceInfo) {
    const langName = LANG_NAMES[langCode] || langCode;
    const reason = `No ${langName} voice installed in your browser. Install a ${langName} TTS voice in your OS settings to hear audio.`;
    console.warn(`[Speech] ${reason}`);
    options.onUnsupported?.(reason);
    return { ok: false, reason: 'no_voice', langName };
  }

  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(speakable);
  utt.voice = voiceInfo.voice;
  utt.lang  = voiceInfo.bcp47;
  utt.rate  = options.rate  ?? 0.85;
  utt.pitch = options.pitch ?? 1;

  window.speechSynthesis.speak(utt);
  return { ok: true };
}

/**
 * Check whether a voice is available for a language code.
 * Useful for showing/hiding speaker buttons before the user clicks.
 *
 * @param {string} langCode
 * @returns {Promise<boolean>}
 */
export async function isVoiceAvailable(langCode) {
  const v = await findVoice(langCode);
  return v !== null;
}

/**
 * Get a list of all available voices grouped by language.
 * Useful for debugging.
 */
export function listAvailableVoices() {
  const voices = window.speechSynthesis?.getVoices() || [];
  const grouped = {};
  for (const v of voices) {
    const lang = v.lang.split('-')[0];
    if (!grouped[lang]) grouped[lang] = [];
    grouped[lang].push({ name: v.name, lang: v.lang, default: v.default });
  }
  return grouped;
}
