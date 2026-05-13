// Language Learning AI Service
// Uses smartGenerateJSON with automatic failover:
// Gemini 2.0 Flash → Groq Llama 3.3 70B → DeepSeek

import { smartGenerateJSON, callGeminiText, callGroq, callDeepSeek, GROQ_MODELS } from './aiProvider';

// ===== PROMPTS =====

// System prompt for lesson generation
const LESSON_SYSTEM_PROMPT = (primaryLanguage, targetLanguage, currentStage, moduleName) => `
You are a language teacher. The student's primary language is ${primaryLanguage}.
They are learning ${targetLanguage}. They are currently at ${currentStage} level.
Current module: ${moduleName} (e.g., Vocabulary - Stage 1)

Scientific rules you MUST follow:
1. Comprehensible Input (i+1): Use 70% words the student already knows + 30% new content. Never overwhelm.
2. Context-first: Always introduce new words/grammar inside full sentences and real examples. Never isolated.
3. Pattern-based grammar: Show grammar through examples, never through abstract rules.
4. Teach in ${primaryLanguage} when explaining, but use ${targetLanguage} for all examples and exercises.
5. Frequency-first vocabulary: Teach most commonly used words first.
6. End every lesson with a mastery check: 3 quick questions. If score < 80%, repeat lesson with different examples.

Lesson structure to follow:
- Introduction (explain what will be learned today)
- Core content (teach the concept)
- Examples (3-5 real-world examples)
- Mini practice (2-3 quick checks inline)
- Summary
- Mastery check (3 questions, must score 2/3 to proceed)

Return lesson as structured JSON with sections:
{
  "introduction": "...",
  "coreContent": "...",
  "examples": [...],
  "miniPractice": [...],
  "summary": "...",
  "masteryCheck": [
    { "question": "...", "options": ["a", "b", "c", "d"], "correctAnswer": "..." }
  ]
}

Make it educational, engaging, and scientifically sound.
`;

// System prompt for AI conversation
const CONVERSATION_SYSTEM_PROMPT = (targetLanguage, completedModules) => `
You are a friendly conversation partner. The user is learning ${targetLanguage}.
They have learned up to ${completedModules} so far.

Rules:
1. ONLY use vocabulary and grammar the user has already learned. If you must use an unknown word, immediately define it in English.
2. Speak naturally but simply.
3. Do NOT correct errors mid-conversation (it breaks fluency).
4. After the conversation ends (user says 'end session'), provide a summary of: errors made, better alternatives, pronunciation tips, and positive feedback.
5. Keep conversation relevant to topics covered in their lessons.
6. Gradually increase complexity if user responds well.

Start the conversation with a simple greeting and ask about a topic they would be familiar with based on their learning progress.
`;

// System prompt for roadmap generation
const ROADMAP_SYSTEM_PROMPT = (primaryLanguage, targetLanguage) => `
You are an expert language acquisition specialist. Create a comprehensive, never-ending language learning roadmap for a user whose primary language is ${primaryLanguage} and wants to learn ${targetLanguage}.

The roadmap must include ALL of the following modules, organized in progressive stages (Beginner → Elementary → Intermediate → Upper-Intermediate → Advanced → Mastery → Native-like — each stage is never truly "done"):

Modules to include in every stage:
1. Vocabulary (frequency-based, most common words first)
2. Pronunciation (phonetics, sounds unique to target language)
3. Speaking (conversation, dialogue, expression)
4. Listening Comprehension
5. Reading (graded texts, then authentic content)
6. Writing (sentences → paragraphs → essays)
7. Grammar (implicit pattern-based, not rule memorization)
8. Sentence Structure
9. Synonyms & Antonyms
10. Idioms & Expressions
11. Cultural Context

Return a JSON array of stages. Each stage has:
- stageId, stageName, description
- modules: array of { moduleId, moduleName, type, estimatedMinutes, pointsReward }
- unlockCondition: points or previous stage completion

Make it a living roadmap — after Mastery stage, loop back with native-level content (news, literature, professional language).

Format as valid JSON only.
`;

// System prompt for writing evaluation
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

// System prompt for pronunciation evaluation
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

// ===== MAIN AI FUNCTIONS =====
// All functions now use smartGenerateJSON (Gemini → Groq → DeepSeek failover)

// Generate lesson using AI
export const generateLesson = async (primaryLanguage, targetLanguage, currentStage, moduleName) => {
  const prompt = LESSON_SYSTEM_PROMPT(primaryLanguage, targetLanguage, currentStage, moduleName);
  
  try {
    return await smartGenerateJSON(prompt);
  } catch (error) {
    console.error('All AI providers failed, using fallback lesson:', error);
    return getFallbackLesson(targetLanguage, currentStage, moduleName);
  }
};

// Fallback lesson when AI APIs fail
function getFallbackLesson(targetLanguage, currentStage, moduleName) {
  const sampleVocab = {
    en: { word: 'hello', translation: 'Hola', pinyin: 'OH-lah' },
    es: { word: 'hello', translation: 'Hola', pinyin: 'OH-lah' },
    de: { word: 'hello', translation: 'Hallo', pinyin: 'HAH-loh' },
    fr: { word: 'hello', translation: 'Bonjour', pinyin: 'bohn-ZHOOR' },
    zh: { word: 'hello', translation: '你好', pinyin: 'nee-HOW' },
    hi: { word: 'hello', translation: 'नमस्ते', pinyin: 'nah-muh-STAY' },
  };
  
  const vocab = sampleVocab[targetLanguage] || sampleVocab.en;
  
  return {
    introduction: `Welcome to your ${currentStage} ${moduleName} lesson! Today you'll learn essential ${targetLanguage} vocabulary.`,
    coreContent: `The word "${vocab.word}" in ${targetLanguage} is "${vocab.translation}". This is one of the most common words you'll use. Practice it daily!`,
    examples: [
      `Example: "${vocab.translation}" - Hello!`,
      `Example: Say "${vocab.translation}" when meeting someone.`,
      `Practice: Try using "${vocab.translation}" in a sentence.`,
    ],
    miniPractice: [
      'What is the translation of "hello" in ' + targetLanguage + '?',
      'How do you say "' + vocab.translation + '" in English?',
    ],
    summary: `You learned the word "${vocab.word}" which means "${vocab.translation}" in ${targetLanguage}. Keep practicing!`,
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

// Generate roadmap using AI
export const generateRoadmap = async (primaryLanguage, targetLanguage) => {
  const prompt = ROADMAP_SYSTEM_PROMPT(primaryLanguage, targetLanguage);
  
  try {
    const result = await smartGenerateJSON(prompt);
    if (Array.isArray(result)) return result;
    throw new Error('Invalid roadmap format');
  } catch (error) {
    console.error('All AI providers failed for roadmap:', error);
    throw error;
  }
};

// Generate AI conversation
export const generateConversationResponse = async (targetLanguage, completedModules, messages, newMessage) => {
  const systemPrompt = CONVERSATION_SYSTEM_PROMPT(targetLanguage, completedModules);
  const conversationHistory = messages
    .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n');
  
  const prompt = `${conversationHistory}\nUser: ${newMessage}\n\nRespond as the AI conversation partner following the rules. Keep your response natural and conversational.`;
  
  try {
    return await callGroq(systemPrompt, [{ role: 'user', content: prompt }], GROQ_MODELS.LLAMA_70B);
  } catch (error) {
    console.error('Groq failed for conversation, trying Gemini:', error);
    return await callGeminiText(`${systemPrompt}\n\n${prompt}`);
  }
};

// Evaluate writing
export const evaluateWriting = async (targetLanguage, prompt, userWriting) => {
  const fullPrompt = WRITING_EVALUATION_PROMPT(targetLanguage, prompt, userWriting);
  return await smartGenerateJSON(fullPrompt);
};

// Evaluate pronunciation
export const evaluatePronunciation = async (targetLanguage, expected, spoken) => {
  const fullPrompt = PRONUNCIATION_PROMPT(targetLanguage, expected, spoken);
  return await smartGenerateJSON(fullPrompt);
};

// Generate MCQ questions
export const generateMCQ = async (primaryLanguage, targetLanguage, topic, count = 5) => {
  const prompt = `
Generate ${count} multiple choice questions for ${targetLanguage} language learning.
Topic: ${topic}
Primary language of student: ${primaryLanguage}

Return JSON array of questions in this format:
[
  {
    "question": "question in ${primaryLanguage}",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "correct option",
    "explanation": "brief explanation in ${primaryLanguage}"
  }
]
`;
  
  try {
    const result = await smartGenerateJSON(prompt);
    if (Array.isArray(result)) return result;
    throw new Error('Invalid MCQ format');
  } catch (error) {
    throw error;
  }
};

// Generate flashcard content
export const generateFlashcards = async (primaryLanguage, targetLanguage, topic, count = 10) => {
  const prompt = `
You are generating language learning flashcards.
Native language: ${primaryLanguage}
Target language being learned: ${targetLanguage}
Topic: ${topic}
Count: ${count}

Each flashcard must have:
- "front": the word in ${primaryLanguage} (e.g. if ${primaryLanguage} is English: "hello")
- "back": the SAME word translated into ${targetLanguage} (e.g. if ${targetLanguage} is Chinese: "你好")
- "pronunciation": how to pronounce the ${targetLanguage} word using Roman letters (e.g. "nǐ hǎo")
- "example": a short sentence in ${targetLanguage} using the word
- "exampleTranslation": the English translation of that example sentence

Example output for English → Chinese:
[
  {
    "front": "hello",
    "back": "你好",
    "pronunciation": "nǐ hǎo",
    "example": "你好，你叫什么名字？",
    "exampleTranslation": "Hello, what is your name?"
  }
]

Now generate ${count} flashcards for the topic "${topic}".
Return ONLY the JSON array, no markdown, no explanation.
`;
  
  try {
    const result = await smartGenerateJSON(prompt);
    if (Array.isArray(result)) return result;
    throw new Error('Invalid flashcard format');
  } catch (error) {
    throw error;
  }
};

// Generate reading comprehension passage
export const generateReadingPassage = async (primaryLanguage, targetLanguage, level, topic) => {
  const prompt = `
Generate a short reading passage in ${targetLanguage} for ${level} level students.
Topic: ${topic}
Student's primary language: ${primaryLanguage}

Requirements:
- Use vocabulary and grammar appropriate for ${level} level (i+1 principle)
- 100-200 words
- Include 3-5 comprehension questions in ${primaryLanguage}

Return JSON:
{
  "title": "passage title",
  "content": "passage in ${targetLanguage}",
  "translation": "full translation in ${primaryLanguage}",
  "questions": [
    { "question": "question in ${primaryLanguage}", "answer": "answer in ${targetLanguage}" }
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
};