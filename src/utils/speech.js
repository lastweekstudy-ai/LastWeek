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
  en: ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en'],
  zh: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
  es: ['es-ES', 'es-MX', 'es-US', 'es-AR', 'es'],
  de: ['de-DE', 'de-AT', 'de-CH', 'de'],
  fr: ['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr'],
  ja: ['ja-JP', 'ja'],
  ko: ['ko-KR', 'ko'],
  it: ['it-IT', 'it'],
  pt: ['pt-BR', 'pt-PT', 'pt'],
  ru: ['ru-RU', 'ru'],
  ar: ['ar-SA', 'ar-EG', 'ar-AE', 'ar'],
  hi: ['hi-IN', 'hi'],
  bn: ['bn-BD', 'bn-IN', 'bn'],
  nl: ['nl-NL', 'nl-BE', 'nl'],
  pl: ['pl-PL', 'pl'],
  tr: ['tr-TR', 'tr'],
  vi: ['vi-VN', 'vi'],
  th: ['th-TH', 'th'],
  sv: ['sv-SE', 'sv'],
  no: ['no-NO', 'nb-NO', 'no'],
  da: ['da-DK', 'da'],
  fi: ['fi-FI', 'fi'],
  el: ['el-GR', 'el'],
  he: ['he-IL', 'he'],
  id: ['id-ID', 'id'],
  ms: ['ms-MY', 'ms'],
  uk: ['uk-UA', 'uk'],
  cs: ['cs-CZ', 'cs'],
  ro: ['ro-RO', 'ro'],
  hu: ['hu-HU', 'hu'],
  sk: ['sk-SK', 'sk'],
};

// Human-readable language names for the "no voice" warning
const LANG_NAMES = {
  en: 'English', zh: 'Chinese', es: 'Spanish',
  de: 'German',  fr: 'French', ja: 'Japanese',
  ko: 'Korean', it: 'Italian', pt: 'Portuguese',
  ru: 'Russian', ar: 'Arabic', hi: 'Hindi',
  bn: 'Bangla', nl: 'Dutch', pl: 'Polish',
  tr: 'Turkish', vi: 'Vietnamese', th: 'Thai',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish',
  fi: 'Finnish', el: 'Greek', he: 'Hebrew',
  id: 'Indonesian', ms: 'Malay', uk: 'Ukrainian',
  cs: 'Czech', ro: 'Romanian', hu: 'Hungarian',
  sk: 'Slovak',
};

// Cache: langCode → best BCP-47 tag (or null if unsupported)
const voiceCache = {};
let allVoices = null;
let activeSpeechRunId = 0;

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

  // Fallback: try any voice that contains the language code
  const fuzzyMatch = voices.find(v => v.lang.toLowerCase().includes(langCode.toLowerCase()));
  if (fuzzyMatch) {
    console.log(`[Speech] Using fuzzy match voice for ${langCode}:`, fuzzyMatch.name);
    voiceCache[langCode] = { voice: fuzzyMatch, bcp47: fuzzyMatch.lang };
    return voiceCache[langCode];
  }

  // Last resort: use default voice if available
  const defaultVoice = voices.find(v => v.default) || voices[0];
  if (defaultVoice) {
    console.warn(`[Speech] No ${langCode} voice found, using default:`, defaultVoice.name);
    voiceCache[langCode] = { voice: defaultVoice, bcp47: defaultVoice.lang, isDefault: true };
    return voiceCache[langCode];
  }

  // No voice found at all
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function splitIntoSpeechChunks(text, maxLength = 180) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return [clean];

  const sentences = clean.match(/[^.!?。！？]+[.!?。！？]?/g) || [clean];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
    if (next.length <= maxLength) {
      current = next;
      continue;
    }
    if (current) chunks.push(current);
    if (sentence.length <= maxLength) {
      current = sentence.trim();
    } else {
      const words = sentence.trim().split(/\s+/);
      current = '';
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxLength && current) {
          chunks.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function speakUtterance(utterance, runId) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    utterance.onend = () => finish({ ok: true });
    utterance.onerror = (event) => {
      if (runId !== activeSpeechRunId || event.error === 'interrupted' || event.error === 'canceled') {
        finish({ ok: false, reason: event.error || 'canceled' });
        return;
      }
      reject(new Error(event.error || 'speech_error'));
    };

    window.speechSynthesis.speak(utterance);

    // Chrome occasionally stalls if speechSynthesis is left paused internally.
    const watchdog = setInterval(() => {
      if (settled || runId !== activeSpeechRunId) {
        clearInterval(watchdog);
        return;
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 1000);
  });
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
    const reason = 'Text-to-speech is not supported in this browser. Try using Chrome, Edge, Safari, or Firefox.';
    options.onUnsupported?.(reason);
    return { ok: false, reason: 'no_api' };
  }

  const speakable = extractSpeakableText(text, langCode);
  if (!speakable) return { ok: false, reason: 'empty_text' };

  const voiceInfo = await findVoice(langCode);

  if (!voiceInfo) {
    const langName = LANG_NAMES[langCode] || langCode;
    const reason = `No voices available in your browser. This is a browser/OS limitation, not an app issue. Try: 1) Using Chrome or Edge (best voice support), 2) Checking your OS language settings, or 3) Restarting your browser.`;
    console.warn(`[Speech] ${reason}`);
    options.onUnsupported?.(reason);
    return { ok: false, reason: 'no_voice', langName };
  }

  // Show warning if using default voice as fallback
  if (voiceInfo.isDefault) {
    const langName = LANG_NAMES[langCode] || langCode;
    console.info(`[Speech] Using default voice for ${langName}. For better pronunciation, add ${langName} voices in your OS settings.`);
  }

  const runId = ++activeSpeechRunId;
  window.speechSynthesis.cancel();
  await sleep(80);

  const chunks = splitIntoSpeechChunks(speakable, options.maxChunkLength || 180);

  try {
    for (const chunk of chunks) {
      if (runId !== activeSpeechRunId) {
        return { ok: false, reason: 'canceled' };
      }

      const utt = new SpeechSynthesisUtterance(chunk);
      utt.voice = voiceInfo.voice;
      utt.lang  = voiceInfo.bcp47;
      utt.rate  = options.rate  ?? 0.85;
      utt.pitch = options.pitch ?? 1;
      utt.volume = options.volume ?? 1;

      const result = await speakUtterance(utt, runId);
      if (!result.ok && result.reason !== 'canceled' && result.reason !== 'interrupted') {
        return result;
      }
    }

    return { ok: true, usingDefaultVoice: voiceInfo.isDefault, chunks: chunks.length };
  } catch (err) {
    // One clean retry handles the common first-utterance failure after voice loading.
    if (!options._retried) {
      await sleep(150);
      return speak(text, langCode, { ...options, _retried: true });
    }
    console.warn('[Speech] Playback failed:', err.message);
    return { ok: false, reason: err.message || 'speech_error' };
  }
}

export function stopSpeaking() {
  activeSpeechRunId += 1;
  window.speechSynthesis?.cancel();
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
 * Useful for debugging and showing users what's available.
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

/**
 * Get a user-friendly list of available languages
 * @returns {Array<{code: string, name: string, voiceCount: number}>}
 */
export function getAvailableLanguages() {
  const voices = window.speechSynthesis?.getVoices() || [];
  const langMap = {};
  
  voices.forEach(v => {
    const code = v.lang.split('-')[0];
    if (!langMap[code]) {
      langMap[code] = {
        code,
        name: LANG_NAMES[code] || code,
        voiceCount: 0,
        voices: []
      };
    }
    langMap[code].voiceCount++;
    langMap[code].voices.push(v.name);
  });
  
  return Object.values(langMap).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Check if Web Speech API is supported
 * @returns {boolean}
 */
export function isSpeechSupported() {
  return 'speechSynthesis' in window;
}
