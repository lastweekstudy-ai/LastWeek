// Language Learning AI Service
// Uses smartGenerateJSON with automatic failover:
// Groq 70B → Gemini 2.0 Flash → DeepSeek

import { smartGenerateJSON, callGeminiText, callGroq, callDeepSeek, GROQ_MODELS } from './aiProvider';

// ===== STUDENT PROFILE SYSTEM =====

const LEVEL_FORMAT_RULES = {
  beginner: `
BEGINNER LEVEL — STRICT FORMAT RULES (never skip any of these):
- Every {targetLanguage} word or phrase MUST be followed by:
  1. Romanization/Pinyin in parentheses e.g. 你好 (nǐ hǎo)
  2. English translation in brackets e.g. [Hello]
- Example format: 你好 (nǐ hǎo) [Hello]
- NEVER show a {targetLanguage} word without both romanization AND translation
- Explanations must be in simple {primaryLanguage}
- Sentences must be SHORT (max 6 words in {targetLanguage})
- Introduce max 3-4 new words per lesson
- Every example must have: {targetLanguage} + romanization + {primaryLanguage} translation on separate lines
`,
  elementary: `
ELEMENTARY LEVEL — FORMAT RULES:
- Every NEW word must have romanization and translation
- Known words (taught in previous lessons) can appear without translation
- Keep sentences short (max 8 words)
- Explanations in {primaryLanguage}
`,
  intermediate: `
INTERMEDIATE LEVEL — FORMAT RULES:
- Romanization only for new or complex words
- Translation only when introducing new vocabulary
- Explanations can mix {primaryLanguage} and {targetLanguage}
`,
  upper_intermediate: `
UPPER-INTERMEDIATE LEVEL — FORMAT RULES:
- Minimal romanization (only for rare/complex characters)
- Explanations primarily in {targetLanguage}
- Translations only for idioms or cultural expressions
`,
  advanced: `
ADVANCED LEVEL — FORMAT RULES:
- No romanization needed
- Explanations in {targetLanguage}
- Treat student as near-fluent
`,
  mastery: `
MASTERY LEVEL — FORMAT RULES:
- Full {targetLanguage} immersion
- No translations or romanization
- Native-level content
`,
  native: `
NATIVE-LIKE LEVEL — FORMAT RULES:
- Complete immersion in {targetLanguage}
- Native speaker content only
`,
};

// ─── Frequency-based vocabulary buckets per stage ────────────────────────────
// Krashen i+1: teach the most frequent words first so 70% of input is already known.
const VOCAB_FREQUENCY_BUCKETS = {
  beginner:          { count: 100,  description: 'top-100 most common everyday words' },
  elementary:        { count: 500,  description: 'top-500 most common words' },
  intermediate:      { count: 2000, description: 'top-2000 words including common idioms' },
  upper_intermediate:{ count: 3000, description: 'top-3000 words including formal register' },
  advanced:          { count: 5000, description: 'top-5000 words including literary vocabulary' },
  mastery:           { count: 8000, description: 'top-8000 words including technical/professional' },
  native:            { count: 10000,description: 'full native vocabulary including slang and dialects' },
};

// ─── Script-specific languages that need IPA + romanization mapping ──────────
// For Chinese the Pronunciation module MUST include:
//   • IPA transcription
//   • Script-to-romanization mapping (Pinyin)
const SCRIPT_LANGUAGES = {
  zh: { name: 'Chinese', script: 'Hanzi', romanization: 'Pinyin', ipa: true },
};

// Language code → name map (used to look up script info from language name)
const LANG_NAME_TO_CODE = {
  chinese: 'zh', mandarin: 'zh',
};

function getScriptInfo(targetLanguage) {
  const code = LANG_NAME_TO_CODE[targetLanguage?.toLowerCase()];
  return code ? SCRIPT_LANGUAGES[code] : null;
}

// ─── Strict JSON schema injected into every lesson prompt ────────────────────
// This prevents "hallucinated keys" that crash the React rendering engine.
// The schema is the single source of truth for what lessonContent must contain.
const LESSON_JSON_SCHEMA = `
STRICT JSON SCHEMA — you MUST return an object matching EXACTLY this shape.
Do NOT add extra keys. Do NOT omit required keys. Do NOT nest differently.

{
  "introduction": string,          // 1-3 sentences in {primaryLanguage}
  "coreContent": string,           // main teaching content, follows level format rules
  "examples": [                    // EXACTLY 5 items
    string,                        // each: target text + romanization + translation per level rules
    string,
    string,
    string,
    string
  ],
  "miniPractice": [                // 2-3 items
    string                         // simple question or exercise in {primaryLanguage}
  ],
  "summary": string,               // recap in {primaryLanguage}
  "masteryCheck": [                // EXACTLY 3 items
    {
      "question": string,          // question in {primaryLanguage}
      "options": [string, string, string, string],  // EXACTLY 4 options
      "correctAnswer": string      // must match one of the options exactly
    }
  ]
}

VALIDATION RULES:
- examples array must have exactly 5 string elements
- masteryCheck array must have exactly 3 objects
- each masteryCheck.options must have exactly 4 strings
- correctAnswer must be identical to one of the 4 options
- No extra keys allowed at any level
`;

// Speaking/pronunciation schema (different masteryCheck shape)
const SPEAKING_JSON_SCHEMA = `
STRICT JSON SCHEMA — you MUST return an object matching EXACTLY this shape.

{
  "introduction": string,
  "coreContent": string,
  "examples": [string, string, string, string, string],
  "miniPractice": [string, string],
  "summary": string,
  "masteryCheck": [
    {
      "prompt": string,            // instruction to say a phrase aloud
      "expectedAnswer": string,    // the exact phrase the student should say
      "pronunciationTips": string  // tips for correct pronunciation
    }
  ]
}
`;

const buildStudentProfile = (primaryLanguage, targetLanguage, currentStage) => {
  const stage = currentStage?.toLowerCase().replace(/[- ]/g, '_') || 'beginner';
  const levelKey = Object.keys(LEVEL_FORMAT_RULES).find(k => stage.includes(k)) || 'beginner';
  const formatRules = LEVEL_FORMAT_RULES[levelKey]
    .replace(/\{targetLanguage\}/g, targetLanguage)
    .replace(/\{primaryLanguage\}/g, primaryLanguage);

  const vocabBucket = VOCAB_FREQUENCY_BUCKETS[levelKey] || VOCAB_FREQUENCY_BUCKETS.beginner;

  return `
═══════════════════════════════════════════════════════════
STUDENT PROFILE — READ BEFORE EVERY RESPONSE
═══════════════════════════════════════════════════════════
Native language: ${primaryLanguage}
Learning: ${targetLanguage}
Current level: ${currentStage || 'beginner'}
Vocabulary target: ${vocabBucket.description}

${formatRules}

UNIVERSAL RULES (apply at ALL levels):
1. Never show ${targetLanguage} text without context appropriate for the level above
2. Always use the i+1 principle: 70% known content + 30% new
3. Teach through examples first, rules second
4. Every example must be a complete, natural sentence — never isolated words
5. If the student is beginner/elementary, ALWAYS include pronunciation guide
6. Vocabulary MUST come from the ${vocabBucket.description} — do not use rare words
═══════════════════════════════════════════════════════════
`;
};

// ===== PROMPTS =====

const LESSON_SYSTEM_PROMPT = (primaryLanguage, targetLanguage, currentStage, moduleName) => {
  const schema = LESSON_JSON_SCHEMA
    .replace(/\{primaryLanguage\}/g, primaryLanguage);

  return `
${buildStudentProfile(primaryLanguage, targetLanguage, currentStage)}

You are a ${targetLanguage} language teacher. Teach the module: "${moduleName}".

Scientific teaching rules:
1. Comprehensible Input (i+1): 70% known + 30% new. Never overwhelm.
2. Context-first: Introduce words inside full sentences, never in isolation.
3. Pattern-based grammar: Show grammar through examples, not abstract rules.
4. Frequency-first: Only use vocabulary from the student's frequency bucket above.
5. Mastery check: 3 questions at the end. Student must score 2/3 to pass.

${schema}

CRITICAL: Follow the STUDENT PROFILE format rules above for EVERY piece of ${targetLanguage} text.
Return ONLY the JSON object. No markdown, no explanation, no code fences.
`;
};

const SPEAKING_LESSON_PROMPT = (primaryLanguage, targetLanguage, currentStage, moduleName) => {
  // Inject script-specific IPA instructions for Chinese, Hindi, Bangla
  const scriptInfo = getScriptInfo(targetLanguage);
  const scriptBlock = scriptInfo ? `
SCRIPT-SPECIFIC REQUIREMENTS for ${scriptInfo.name}:
- Every ${scriptInfo.script} character/word MUST include:
  1. ${scriptInfo.romanization} (e.g. nǐ hǎo / na-mas-te / a-mi)
  2. IPA transcription in square brackets (e.g. [ni˨˩˦ xɑʊ̯˨˩˦])
  3. Syllable stress markers where applicable
- Tone marks are MANDATORY for Chinese (Pinyin tones: ā á ǎ à)
- Aspirated vs unaspirated consonants must be explicitly noted
` : '';

  return `
${buildStudentProfile(primaryLanguage, targetLanguage, currentStage)}

You are a ${targetLanguage} pronunciation and speaking teacher. Teach the module: "${moduleName}".
${scriptBlock}
This is a SPEAKING/PRONUNCIATION lesson. Focus on:
1. Correct pronunciation and intonation
2. Natural speech patterns and rhythm
3. Minimal pairs (sounds that differ by one phoneme)
4. Speaking practice exercises

${SPEAKING_JSON_SCHEMA}

CRITICAL: Every ${targetLanguage} word MUST include romanization and IPA for script-based languages.
Return ONLY the JSON object. No markdown, no explanation, no code fences.
`;
};

const CONVERSATION_SYSTEM_PROMPT = (primaryLanguage, targetLanguage, currentStage, completedModules) => `
${buildStudentProfile(primaryLanguage, targetLanguage, currentStage)}

You are a friendly ${targetLanguage} conversation partner.
The student has learned: ${completedModules}

Rules:
1. ONLY use vocabulary the student has already learned. Define any unknown word immediately in ${primaryLanguage}.
2. Follow the STUDENT PROFILE format rules for every ${targetLanguage} word you use.
3. Do NOT correct errors mid-conversation (it breaks fluency).
4. After the user says "end session", give a summary: errors made, better alternatives, pronunciation tips, positive feedback.
5. Keep conversation relevant to topics covered in their lessons.
6. Gradually increase complexity if the student responds well.

Start with a simple greeting appropriate for the student's level.
`;

const ROADMAP_SYSTEM_PROMPT = (primaryLanguage, targetLanguage) => `
You are an expert language acquisition specialist. Create a language learning roadmap for a user whose primary language is ${primaryLanguage} and wants to learn ${targetLanguage}.

CRITICAL: You MUST use EXACTLY these stageId values (no other values allowed):
- "beginner"
- "elementary"  
- "intermediate"
- "upper_intermediate"
- "advanced"
- "mastery"
- "native"

CRITICAL: moduleId MUST be a lowercase slug using only letters, numbers, and hyphens. Examples:
- "vocabulary", "pronunciation", "speaking", "grammar", "reading", "writing"
- "sentence-structure", "idioms-expressions", "cultural-context"

Each stage must have exactly these 11 modules (use these exact moduleId values):
1. { moduleId: "vocabulary", moduleName: "Vocabulary" }
2. { moduleId: "pronunciation", moduleName: "Pronunciation" }
3. { moduleId: "speaking", moduleName: "Speaking" }
4. { moduleId: "listening", moduleName: "Listening" }
5. { moduleId: "reading", moduleName: "Reading" }
6. { moduleId: "writing", moduleName: "Writing" }
7. { moduleId: "grammar", moduleName: "Grammar" }
8. { moduleId: "sentence-structure", moduleName: "Sentence Structure" }
9. { moduleId: "synonyms-antonyms", moduleName: "Synonyms & Antonyms" }
10. { moduleId: "idioms-expressions", moduleName: "Idioms & Expressions" }
11. { moduleId: "cultural-context", moduleName: "Cultural Context" }

Return a JSON array of 7 stages. Each stage:
{
  "stageId": "beginner",
  "stageName": "Beginner",
  "description": "brief description",
  "modules": [
    {
      "moduleId": "vocabulary",
      "moduleName": "Vocabulary",
      "type": "learning",
      "estimatedMinutes": 15,
      "pointsReward": 100
    }
  ]
}

Return ONLY the JSON array. No markdown, no explanation.
`;

const WRITING_EVALUATION_PROMPT = (targetLanguage, prompt, userWriting) => `
You are a language teacher evaluating writing in ${targetLanguage}.

Prompt: ${prompt}
User's writing: ${userWriting}

Evaluate and return JSON:
{
  "score": 0-100,
  "grammar": ["list of grammar issues"],
  "vocabulary": ["vocabulary suggestions"],
  "structure": ["structural feedback"],
  "correctedVersion": "corrected version of the text",
  "explanation": "overall feedback"
}
`;

const PRONUNCIATION_PROMPT = (targetLanguage, expected, spoken) => `
You are a pronunciation expert for ${targetLanguage}.

Expected phrase: ${expected}
Spoken transcription: ${spoken}

Evaluate pronunciation and return JSON:
{
  "pronunciationScore": 0-100,
  "phoneticIssues": ["specific phonetic problems"],
  "tips": ["tips to improve"],
  "correctAudio": "IPA transcription of correct pronunciation"
}
`;

// ===== LESSON SCHEMA VALIDATOR =====
/**
 * Validates the AI-generated lesson object against the strict schema.
 * Returns a sanitised lesson or throws if the structure is unrecoverable.
 * This prevents hallucinated keys from crashing the React rendering engine.
 */
function validateLessonSchema(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Lesson is not an object');

  // Required string fields
  const lesson = {
    introduction: typeof raw.introduction === 'string' ? raw.introduction : String(raw.introduction ?? ''),
    coreContent:  typeof raw.coreContent  === 'string' ? raw.coreContent  : String(raw.coreContent  ?? ''),
    summary:      typeof raw.summary      === 'string' ? raw.summary      : String(raw.summary      ?? ''),
  };

  // examples — must be array of strings, exactly 5 (pad/trim)
  const rawExamples = Array.isArray(raw.examples) ? raw.examples : [];
  lesson.examples = rawExamples
    .slice(0, 5)
    .map(e => (typeof e === 'string' ? e : JSON.stringify(e)));
  while (lesson.examples.length < 3) lesson.examples.push(''); // minimum 3

  // miniPractice — array of strings, 2-3 items
  const rawPractice = Array.isArray(raw.miniPractice) ? raw.miniPractice : [];
  lesson.miniPractice = rawPractice
    .slice(0, 3)
    .map(p => (typeof p === 'string' ? p : (p?.question ?? JSON.stringify(p))));
  if (lesson.miniPractice.length === 0) lesson.miniPractice = ['Review what you just learned.'];

  // masteryCheck — array of {question, options[4], correctAnswer}
  const rawMastery = Array.isArray(raw.masteryCheck) ? raw.masteryCheck : [];
  lesson.masteryCheck = rawMastery.slice(0, 3).map(q => {
    if (typeof q === 'string') {
      // AI returned a string instead of object — wrap it
      return { question: q, options: ['A', 'B', 'C', 'D'], correctAnswer: 'A' };
    }
    // Handle speaking-module shape (prompt/expectedAnswer/pronunciationTips)
    if (q.prompt && q.expectedAnswer) return q;

    const options = Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : [];
    while (options.length < 4) options.push(`Option ${options.length + 1}`);
    const correctAnswer = typeof q.correctAnswer === 'string' ? q.correctAnswer : options[0];
    return {
      question: typeof q.question === 'string' ? q.question : JSON.stringify(q),
      options,
      correctAnswer,
    };
  });
  // Ensure at least 1 mastery question
  if (lesson.masteryCheck.length === 0) {
    lesson.masteryCheck = [{
      question: 'What did you learn in this lesson?',
      options: ['New vocabulary', 'Grammar rules', 'Pronunciation', 'All of the above'],
      correctAnswer: 'All of the above',
    }];
  }

  return lesson;
}

// ===== MAIN AI FUNCTIONS =====

export const generateLesson = async (primaryLanguage, targetLanguage, currentStage, moduleName) => {
  const isVoiceModule = ['pronunciation', 'speaking'].some(m =>
    moduleName?.toLowerCase().includes(m)
  );

  const prompt = isVoiceModule
    ? SPEAKING_LESSON_PROMPT(primaryLanguage, targetLanguage, currentStage, moduleName)
    : LESSON_SYSTEM_PROMPT(primaryLanguage, targetLanguage, currentStage, moduleName);

  try {
    const raw = await smartGenerateJSON(prompt);
    // Validate and sanitise — prevents hallucinated keys crashing React
    return validateLessonSchema(raw);
  } catch (error) {
    console.error('[generateLesson] All AI providers failed:', error.message);
    throw new Error('All AI providers failed. Please try again in a few moments.');
  }
};

// Fallback lesson when AI APIs fail
function getFallbackLesson(targetLanguage, currentStage, moduleName) {
  const sampleVocab = {
    en: { word: 'hello', translation: 'Hello',   pinyin: 'heh-LOH' },
    es: { word: 'hello', translation: 'Hola',    pinyin: 'OH-lah' },
    de: { word: 'hello', translation: 'Hallo',   pinyin: 'HAH-loh' },
    fr: { word: 'hello', translation: 'Bonjour', pinyin: 'bohn-ZHOOR' },
    zh: { word: 'hello', translation: '你好',     pinyin: 'nǐ hǎo' },
  };
  const vocab = sampleVocab[targetLanguage] || sampleVocab.en;
  return {
    introduction: `Welcome to your ${currentStage} ${moduleName} lesson! Today you'll learn essential ${targetLanguage} vocabulary.`,
    coreContent: `The word "hello" in ${targetLanguage} is "${vocab.translation}" (${vocab.pinyin}). This is one of the most common words you'll use.`,
    examples: [
      `"${vocab.translation}" (${vocab.pinyin}) [Hello]`,
      `Say "${vocab.translation}" when meeting someone.`,
      `Practice: "${vocab.translation}!"`,
      `Response: "${vocab.translation}, how are you?"`,
      `Formal: "${vocab.translation}, nice to meet you."`,
    ],
    miniPractice: [
      `What is the translation of "hello" in ${targetLanguage}?`,
      `How do you pronounce "${vocab.translation}"?`,
    ],
    summary: `You learned "${vocab.translation}" (${vocab.pinyin}) which means "hello" in ${targetLanguage}.`,
    masteryCheck: [
      {
        question: `What does "${vocab.translation}" mean in English?`,
        options: ['Goodbye', 'Hello', 'Thank you', 'Sorry'],
        correctAnswer: 'Hello',
      },
      {
        question: `How would you greet someone in ${targetLanguage}?`,
        options: [vocab.translation, 'Goodbye', 'Thank you', 'Sorry'],
        correctAnswer: vocab.translation,
      },
      {
        question: `Is "${vocab.word}" a common word in ${targetLanguage}?`,
        options: ['Yes, very common', 'No, rare', 'Only formal', 'Only informal'],
        correctAnswer: 'Yes, very common',
      },
    ],
  };
}

export const generateRoadmap = async (primaryLanguage, targetLanguage) => {
  const prompt = ROADMAP_SYSTEM_PROMPT(primaryLanguage, targetLanguage);

  const VALID_STAGE_IDS = ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'mastery', 'native'];
  const VALID_MODULE_IDS = ['vocabulary', 'pronunciation', 'speaking', 'listening', 'reading', 'writing', 'grammar', 'sentence-structure', 'synonyms-antonyms', 'idioms-expressions', 'cultural-context'];

  const normalizeRoadmap = (roadmap) => {
    return VALID_STAGE_IDS.map((stageId, i) => {
      const existing = roadmap.find(s =>
        s.stageId === stageId ||
        s.stageName?.toLowerCase().replace(/[^a-z]/g, '_').includes(stageId.replace('_', ''))
      ) || roadmap[i] || {};
      return {
        stageId,
        stageName: existing.stageName || stageId.charAt(0).toUpperCase() + stageId.slice(1).replace('_', '-'),
        description: existing.description || `${stageId} level ${targetLanguage}`,
        modules: VALID_MODULE_IDS.map((moduleId, j) => {
          const existingMod = existing.modules?.[j] || {};
          return {
            moduleId,
            moduleName: existingMod.moduleName || moduleId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            type: existingMod.type || 'learning',
            estimatedMinutes: existingMod.estimatedMinutes || 15,
            pointsReward: existingMod.pointsReward || 100,
          };
        }),
      };
    });
  };

  try {
    const result = await smartGenerateJSON(prompt);
    if (Array.isArray(result)) return normalizeRoadmap(result);
    throw new Error('Invalid roadmap format');
  } catch (error) {
    console.error('[generateRoadmap] All AI providers failed:', error.message);
    throw error;
  }
};

export const generateConversationResponse = async (primaryLanguage, targetLanguage, currentStage, completedModules, messages, newMessage) => {
  const systemPrompt = CONVERSATION_SYSTEM_PROMPT(primaryLanguage, targetLanguage, currentStage, completedModules);
  const conversationHistory = messages
    .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n');
  const prompt = `${conversationHistory}\nUser: ${newMessage}\n\nRespond as the AI conversation partner following the rules. Keep your response natural and conversational.`;

  try {
    return await callGroq(systemPrompt, [{ role: 'user', content: prompt }], GROQ_MODELS.LLAMA_70B);
  } catch (error) {
    console.error('[generateConversationResponse] Groq failed, trying Gemini:', error.message);
    return await callGeminiText(`${systemPrompt}\n\n${prompt}`);
  }
};

export const evaluateWriting = async (targetLanguage, prompt, userWriting) => {
  const fullPrompt = WRITING_EVALUATION_PROMPT(targetLanguage, prompt, userWriting);
  return await smartGenerateJSON(fullPrompt);
};

export const evaluatePronunciation = async (targetLanguage, expected, spoken) => {
  const fullPrompt = PRONUNCIATION_PROMPT(targetLanguage, expected, spoken);
  return await smartGenerateJSON(fullPrompt);
};

export const generateMCQ = async (primaryLanguage, targetLanguage, topic, count = 5, currentStage = 'beginner') => {
  const profile = buildStudentProfile(primaryLanguage, targetLanguage, currentStage);
  const prompt = `
${profile}

Generate ${count} multiple choice questions for ${targetLanguage} language learning.
Topic: ${topic}
Questions must be in ${primaryLanguage}.
Answer options must follow the STUDENT PROFILE format rules above.

Return JSON array:
[
  {
    "question": "Question in ${primaryLanguage}",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": "correct option",
    "explanation": "Brief explanation in ${primaryLanguage}"
  }
]
`;
  const result = await smartGenerateJSON(prompt);
  if (Array.isArray(result)) return result;
  throw new Error('Invalid MCQ format');
};

export const generateFlashcards = async (primaryLanguage, targetLanguage, topic, count = 10, currentStage = 'beginner') => {
  const profile = buildStudentProfile(primaryLanguage, targetLanguage, currentStage);
  const scriptInfo = getScriptInfo(targetLanguage);
  const scriptNote = scriptInfo
    ? `IMPORTANT: For every ${scriptInfo.script} word include: ${scriptInfo.romanization} AND IPA transcription.`
    : '';

  const prompt = `
${profile}
${scriptNote}

Generate ${count} flashcards for learning ${targetLanguage} vocabulary.
Topic: ${topic}

Each flashcard:
- "front": the word in ${primaryLanguage}
- "back": the word in ${targetLanguage}
- "pronunciation": romanization/pinyin — ALWAYS include for beginner/elementary levels
- "ipa": IPA transcription — required for Chinese, Hindi, Bangla
- "example": a short sentence in ${targetLanguage} — follow STUDENT PROFILE format rules
- "exampleTranslation": ${primaryLanguage} translation of the example

Return ONLY the JSON array.
`;
  const result = await smartGenerateJSON(prompt);
  if (Array.isArray(result)) return result;
  throw new Error('Invalid flashcard format');
};

export const generateReadingPassage = async (primaryLanguage, targetLanguage, level, topic) => {
  const profile = buildStudentProfile(primaryLanguage, targetLanguage, level);
  const prompt = `
${profile}

Generate a short reading passage in ${targetLanguage} for ${level} level students.
Topic: ${topic}

Requirements:
- Follow the STUDENT PROFILE format rules strictly for all ${targetLanguage} text
- 80-150 words appropriate for ${level} level
- Include 3-5 comprehension questions in ${primaryLanguage}

Return JSON:
{
  "title": "passage title in ${primaryLanguage}",
  "content": "passage in ${targetLanguage} — follow level format rules",
  "translation": "full translation in ${primaryLanguage}",
  "questions": [
    { "question": "question in ${primaryLanguage}", "answer": "answer following level format" }
  ]
}
`;
  return await smartGenerateJSON(prompt);
};

export const generateListeningContent = async (primaryLanguage, targetLanguage, level, topic) => {
  const profile = buildStudentProfile(primaryLanguage, targetLanguage, level);
  const prompt = `
${profile}

Generate a listening comprehension exercise in ${targetLanguage} for ${level} level students.
Topic: ${topic}

Requirements:
- Create a short audio script (80-150 words) in ${targetLanguage}
- Include 3-4 comprehension questions in ${primaryLanguage}
- Provide the script text so it can be read aloud
- Include pronunciation guide for difficult words

Return JSON:
{
  "script": "the audio script in ${targetLanguage}",
  "scriptTranslation": "English translation of the script",
  "questions": [
    { "question": "question in ${primaryLanguage}", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }
  ],
  "difficultWords": [
    { "word": "word in ${targetLanguage}", "pronunciation": "pronunciation", "meaning": "meaning in ${primaryLanguage}" }
  ]
}
`;
  return await smartGenerateJSON(prompt);
};

export default {
  generateLesson,
  generateRoadmap,
  generateConversationResponse,
  evaluateWriting,
  evaluatePronunciation,
  generateMCQ,
  generateFlashcards,
  generateReadingPassage,
  generateListeningContent,
};

