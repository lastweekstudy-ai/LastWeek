// Language Learning AI Service
// Uses Gemini API (primary) and DeepSeek API (fallback)

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

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

// Call Gemini API
async function callGemini(prompt, systemInstruction = '') {
  try {
    const response = await fetch(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            topP: 0.95,
            topK: 40,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Try to extract JSON from response
    try {
      // Find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return text;
    } catch {
      return text;
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Call DeepSeek API (fallback)
async function callDeepSeek(prompt, systemInstruction = '') {
  try {
    const response = await fetch(
      DEEPSEEK_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    // Try to extract JSON from response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return text;
    } catch {
      return text;
    }
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
}

// Generate lesson using AI
export const generateLesson = async (primaryLanguage, targetLanguage, currentStage, moduleName) => {
  const prompt = LESSON_SYSTEM_PROMPT(primaryLanguage, targetLanguage, currentStage, moduleName);
  
  try {
    return await callGemini(prompt);
  } catch (error) {
    console.error('Gemini failed, trying DeepSeek:', error);
    try {
      return await callDeepSeek(prompt);
    } catch (deepseekError) {
      console.error('Both APIs failed:', deepseekError);
      throw deepseekError;
    }
  }
};

// Generate roadmap using AI
export const generateRoadmap = async (primaryLanguage, targetLanguage) => {
  const prompt = ROADMAP_SYSTEM_PROMPT(primaryLanguage, targetLanguage);
  
  try {
    const result = await callGemini(prompt);
    // Ensure result is an array
    if (Array.isArray(result)) {
      return result;
    }
    // If result is not an array, try to parse it
    if (typeof result === 'string') {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    throw new Error('Invalid roadmap format');
  } catch (error) {
    console.error('Gemini failed, trying DeepSeek:', error);
    try {
      const result = await callDeepSeek(prompt);
      if (Array.isArray(result)) {
        return result;
      }
      throw new Error('Invalid roadmap format');
    } catch (deepseekError) {
      console.error('Both APIs failed:', deepseekError);
      throw deepseekError;
    }
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
    return await callGemini(prompt, systemPrompt);
  } catch (error) {
    console.error('Gemini failed, trying DeepSeek:', error);
    try {
      return await callDeepSeek(prompt, systemPrompt);
    } catch (deepseekError) {
      throw deepseekError;
    }
  }
};

// Evaluate writing
export const evaluateWriting = async (targetLanguage, prompt, userWriting) => {
  const fullPrompt = WRITING_EVALUATION_PROMPT(targetLanguage, prompt, userWriting);
  
  try {
    return await callGemini(fullPrompt);
  } catch (error) {
    console.error('Gemini failed, trying DeepSeek:', error);
    try {
      return await callDeepSeek(fullPrompt);
    } catch (deepseekError) {
      throw deepseekError;
    }
  }
};

// Evaluate pronunciation
export const evaluatePronunciation = async (targetLanguage, expected, spoken) => {
  const fullPrompt = PRONUNCIATION_PROMPT(targetLanguage, expected, spoken);
  
  try {
    return await callGemini(fullPrompt);
  } catch (error) {
    console.error('Gemini failed, trying DeepSeek:', error);
    try {
      return await callDeepSeek(fullPrompt);
    } catch (deepseekError) {
      throw deepseekError;
    }
  }
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
    const result = await callGemini(prompt);
    if (Array.isArray(result)) {
      return result;
    }
    throw new Error('Invalid MCQ format');
  } catch (error) {
    console.error('Gemini failed, trying DeepSeek:', error);
    try {
      const result = await callDeepSeek(prompt);
      if (Array.isArray(result)) {
        return result;
      }
      throw new Error('Invalid MCQ format');
    } catch (deepseekError) {
      throw deepseekError;
    }
  }
};

// Generate flashcard content
export const generateFlashcards = async (primaryLanguage, targetLanguage, topic, count = 10) => {
  const prompt = `
Generate ${count} flashcards for ${targetLanguage} vocabulary learning.
Topic: ${topic}
Student's primary language: ${primaryLanguage}

Return JSON array of flashcards:
[
  {
    "front": "word/phrase in ${primaryLanguage}",
    "back": "translation in ${targetLanguage}",
    "pronunciation": "pronunciation guide",
    "example": "example sentence in ${targetLanguage}",
    "exampleTranslation": "translation in ${primaryLanguage}"
  }
]

Use common, frequency-based vocabulary appropriate for beginners.
`;
  
  try {
    const result = await callGemini(prompt);
    if (Array.isArray(result)) {
      return result;
    }
    throw new Error('Invalid flashcard format');
  } catch (error) {
    console.error('Gemini failed, trying DeepSeek:', error);
    try {
      const result = await callDeepSeek(prompt);
      if (Array.isArray(result)) {
        return result;
      }
      throw new Error('Invalid flashcard format');
    } catch (deepseekError) {
      throw deepseekError;
    }
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
  
  try {
    return await callGemini(prompt);
  } catch (error) {
    console.error('Gemini failed, trying DeepSeek:', error);
    try {
      return await callDeepSeek(prompt);
    } catch (deepseekError) {
      throw deepseekError;
    }
  }
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