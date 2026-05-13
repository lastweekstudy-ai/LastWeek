/**
 * aiProvider.js — Centralized AI provider with automatic failover
 *
 * Provider priority and best-use mapping:
 *
 * For TEXT/CHAT (streaming):
 *   1. Groq Llama 3.3 70B  — high-quality reasoning (1000 RPD, 12k TPM)
 *   2. Groq Qwen 3 32B      — coding & multilingual (1000 RPD, 6k TPM)
 *   3. DeepSeek R1          — deep reasoning fallback
 *   4. Groq Llama 3.1 8B   — fast lightweight fallback (14400 RPD, 6k TPM)
 *
 * For VISION/IMAGE:
 *   1. Gemini 2.0 Flash     — multimodal vision
 *
 * For DOCUMENT ANALYSIS:
 *   1. Gemini 2.0 Flash     — 2M context window
 *   2. Groq Llama 3.3 70B  — fallback
 *
 * For LANGUAGE LEARNING (JSON structured output):
 *   1. Gemini 2.0 Flash     — primary
 *   2. Groq Llama 3.3 70B  — fallback
 *   3. DeepSeek             — last resort
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_TRANSCRIPTION_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Model selection guide (May 2026 free tiers):
 *
 * GROQ:
 *   Llama 3.3 70B  — best reasoning,  1000 RPD, 12k TPM  → use for short/medium chat
 *   Llama 3.2 11B  — vision model,    7000 RPD, 7k TPM   → use for image analysis
 *   Llama 3.1 8B   — fast/cheap,     14400 RPD, 6k TPM   → fallback for chat
 *   Qwen 2.5 32B   — coding/multi,    1000 RPD, 6k TPM   → coding tasks
 *   Whisper V3     — audio only,      2000 RPD            → transcription
 *
 * GEMINI 2.0 Flash:
 *   — 2M context window, native PDF/image/video
 *   — 1500 RPD, 15 RPM (free tier)
 *   — Best for: PDFs, large documents, vision fallback
 *
 * DEEPSEEK (PAID):
 *   — No strict RPD/TPM limits (paid)
 *   — Best for: reliable fallback, long reasoning, large contexts
 *   — $0.14–$0.28 per 1M tokens
 */
export const GROQ_MODELS = {
  LLAMA_70B: 'llama3-70b-8192',         // Best reasoning available (8k context)
  LLAMA_8B: 'llama-3.1-8b-instant',     // Fast fallback (131k context)
  LLAMA_8B_LEGACY: 'llama3-8b-8192',    // Legacy fallback
  GEMMA: 'gemma2-9b-it',               // Google Gemma fallback
  WHISPER: 'whisper-large-v3',          // Audio transcription
  WHISPER_TURBO: 'whisper-large-v3-turbo', // Faster audio transcription
  // NOTE: No vision models available on this Groq account
  // Image analysis uses Gemini Vision only
};

// Token limits per model (conservative — leave headroom below hard limits)
const GROQ_TOKEN_LIMITS = {
  [GROQ_MODELS.LLAMA_70B]: 6000,       // 8k context, use 6k to be safe
  [GROQ_MODELS.LLAMA_8B]: 9000,        // 131k context, but TPM limit ~6k
  [GROQ_MODELS.LLAMA_8B_LEGACY]: 6000, // 8k context
  [GROQ_MODELS.GEMMA]: 6000,           // 8k context
};

// Threshold: above this, skip Groq and go straight to Gemini/DeepSeek
const GROQ_MAX_SAFE_TOKENS = 8000;

// ─── Token utilities ─────────────────────────────────────────────────────────

function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

function estimateMessagesTokens(systemPrompt, messages) {
  const sysTokens = estimateTokens(systemPrompt);
  const msgTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  return sysTokens + msgTokens;
}

/**
 * Truncate messages to fit within a token budget.
 * Always keeps the last user message. Drops oldest messages first.
 */
function truncateMessages(systemPrompt, messages, tokenLimit) {
  const systemTokens = estimateTokens(systemPrompt);
  const budget = tokenLimit - systemTokens - 300; // 300 token safety buffer

  if (messages.length === 0) return messages;

  const lastMsg = messages[messages.length - 1];
  const lastMsgTokens = estimateTokens(lastMsg?.content || '');

  if (lastMsgTokens >= budget) {
    // Last message itself is too large — truncate its content
    return [{
      ...lastMsg,
      content: lastMsg.content.substring(0, budget * 4) + '\n[Content truncated to fit token limit]',
    }];
  }

  let usedTokens = lastMsgTokens;
  const kept = [lastMsg];

  for (let i = messages.length - 2; i >= 0; i--) {
    const msgTokens = estimateTokens(messages[i].content);
    if (usedTokens + msgTokens > budget) break;
    usedTokens += msgTokens;
    kept.unshift(messages[i]);
  }

  return kept;
}

// ─── Groq API ────────────────────────────────────────────────────────────────

/**
 * Call Groq API (non-streaming)
 */
export async function callGroq(systemPrompt, messages, model = GROQ_MODELS.LLAMA_70B) {
  if (!GROQ_API_KEY) throw new Error('Groq API key not configured');

  const tokenLimit = GROQ_TOKEN_LIMITS[model] || 4500;
  const safeMessages = truncateMessages(systemPrompt, messages, tokenLimit);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...safeMessages,
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Call Groq Vision for image analysis (Llama 4 Scout — fast, free)
 * Max 4MB base64 image, up to 5 images per request.
 */
export async function callGroqVision(base64Image, prompt, mimeType = 'image/jpeg') {
  if (!GROQ_API_KEY) throw new Error('Groq API key not configured');

  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  console.log('[Groq Vision] Sending image, size:', Math.round(cleanBase64.length * 3 / 4 / 1024), 'KB, model:', GROQ_MODELS.LLAMA_VISION);

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODELS.LLAMA_VISION,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${cleanBase64}` },
          },
        ],
      }],
      temperature: 0.4,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq Vision error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Transcribe audio using Groq Whisper Large V3 (fastest transcription available)
 * @param {File|Blob} audioFile - max 25MB, supports mp3/wav/m4a/ogg/flac
 * @param {string} [language] - optional ISO code e.g. 'en', 'zh', 'es'
 * @returns {Promise<string>} transcribed text
 */
export async function transcribeAudio(audioFile, language = null) {
  if (!GROQ_API_KEY) throw new Error('Groq API key not configured');

  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', GROQ_MODELS.WHISPER);
  formData.append('response_format', 'text');
  if (language) formData.append('language', language);

  const response = await fetch(GROQ_TRANSCRIPTION_ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: formData,
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq Whisper error: ${response.status}`);
  }

  return await response.text();
}

/**
 * Call Groq API with SSE streaming
 */
export async function callGroqStream(systemPrompt, messages, onChunk, model = GROQ_MODELS.LLAMA_70B) {
  if (!GROQ_API_KEY) throw new Error('Groq API key not configured');

  const tokenLimit = GROQ_TOKEN_LIMITS[model] || 4500;
  const safeMessages = truncateMessages(systemPrompt, messages, tokenLimit);

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...safeMessages,
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assembled = '';
  let lineBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice('data: '.length).trim();
      if (payload === '[DONE]') return assembled;

      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          assembled += delta;
          onChunk(delta);
        }
      } catch {
        // skip malformed chunk
      }
    }
  }

  return assembled;
}

// ─── Gemini API ──────────────────────────────────────────────────────────────

/**
 * Call Gemini for text generation
 * @param {string} prompt
 * @param {string} [systemInstruction]
 * @returns {Promise<string>}
 */
export async function callGeminiText(prompt, systemInstruction = '') {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Call Gemini Vision with an image
 * @param {string} base64Image - base64 without data URL prefix
 * @param {string} prompt
 * @param {string} [mimeType]
 * @returns {Promise<string>}
 */
export async function callGeminiVision(base64Image, prompt, mimeType = 'image/jpeg') {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  // Strip data URL prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: cleanBase64,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini Vision error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── DeepSeek API ─────────────────────────────────────────────────────────────

/**
 * Call DeepSeek (non-streaming)
 */
export async function callDeepSeek(systemPrompt, messages) {
  if (!DEEPSEEK_API_KEY) throw new Error('DeepSeek API key not configured');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Call DeepSeek with SSE streaming
 */
export async function callDeepSeekStream(systemPrompt, messages, onChunk, retryCount = 0) {
  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `DeepSeek API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assembled = '';
    let lineBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice('data: '.length).trim();
        if (payload === '[DONE]') return assembled;

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            assembled += delta;
            onChunk(delta);
          }
        } catch {
          // skip
        }
      }
    }

    return assembled;
  } catch (err) {
    const isNetworkError =
      err.message.includes('Failed to fetch') ||
      err.message.includes('ERR_CONNECTION') ||
      err.name === 'AbortError';

    if (isNetworkError && retryCount < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return callDeepSeekStream(systemPrompt, messages, onChunk, retryCount + 1);
    }
    throw err;
  }
}

// ─── Smart Failover ──────────────────────────────────────────────────────────

/**
 * Smart text generation with automatic failover.
 *
 * Routing strategy:
 * - Small context (<8k tokens): Groq 70B (fast, free) → DeepSeek (paid) → Gemini → Groq 8B
 * - Large context (>8k tokens): DeepSeek (paid, no TPM limit) → Gemini (2M ctx) → Groq 8B (truncated)
 *
 * DeepSeek is paid so it's reliable — used as primary for large contexts.
 * Gemini is free but has 15 RPM limit — used as secondary.
 */
export async function smartChat(systemPrompt, messages) {
  const totalTokens = estimateMessagesTokens(systemPrompt, messages);

  if (totalTokens > GROQ_MAX_SAFE_TOKENS) {
    // Large context: DeepSeek → Gemini → Groq 8B (truncated)
    const providers = [
      { name: 'DeepSeek', fn: () => callDeepSeek(systemPrompt, messages) },
      {
        name: 'Gemini 2.0 Flash',
        fn: () => {
          const fullPrompt = `${systemPrompt}\n\n${messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}`;
          return callGeminiText(fullPrompt);
        },
      },
      { name: 'Groq Llama 8B', fn: () => callGroq(systemPrompt, messages, GROQ_MODELS.LLAMA_8B) },
    ];

    for (const p of providers) {
      try {
        const result = await p.fn();
        if (result) return result;
      } catch (err) {
        console.warn(`[AI] ${p.name} failed:`, err.message);
      }
    }
  } else {
    // Small context: Groq 70B → DeepSeek → Gemini → Groq 8B
    const providers = [
      { name: 'Groq Llama 70B', fn: () => callGroq(systemPrompt, messages, GROQ_MODELS.LLAMA_70B) },
      { name: 'DeepSeek', fn: () => callDeepSeek(systemPrompt, messages) },
      {
        name: 'Gemini 2.0 Flash',
        fn: () => {
          const fullPrompt = `${systemPrompt}\n\n${messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}`;
          return callGeminiText(fullPrompt);
        },
      },
      { name: 'Groq Llama 8B', fn: () => callGroq(systemPrompt, messages, GROQ_MODELS.LLAMA_8B) },
      { name: 'Groq Gemma', fn: () => callGroq(systemPrompt, messages, GROQ_MODELS.GEMMA) },
    ];

    for (const p of providers) {
      try {
        const result = await p.fn();
        if (result) return result;
      } catch (err) {
        console.warn(`[AI] ${p.name} failed:`, err.message);
      }
    }
  }

  throw new Error('All AI providers failed. Please try again later.');
}

/**
 * Smart streaming with automatic failover.
 *
 * - Small context: Groq 70B stream → DeepSeek stream → Gemini (non-stream, emit as one chunk) → Groq 8B stream
 * - Large context: DeepSeek stream → Gemini (non-stream) → Groq 8B stream (truncated)
 */
export async function smartChatStream(systemPrompt, messages, onChunk) {
  const totalTokens = estimateMessagesTokens(systemPrompt, messages);

  if (totalTokens > GROQ_MAX_SAFE_TOKENS) {
    // Large context: DeepSeek stream → Gemini → Groq 8B
    const providers = [
      { name: 'DeepSeek', fn: () => callDeepSeekStream(systemPrompt, messages, onChunk) },
      {
        name: 'Gemini 2.0 Flash',
        fn: async () => {
          const fullPrompt = `${systemPrompt}\n\n${messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}`;
          const result = await callGeminiText(fullPrompt);
          onChunk(result);
          return result;
        },
      },
      { name: 'Groq Llama 8B', fn: () => callGroqStream(systemPrompt, messages, onChunk, GROQ_MODELS.LLAMA_8B) },
    ];

    for (const p of providers) {
      try {
        const result = await p.fn();
        if (result) return result;
      } catch (err) {
        console.warn(`[AI Stream] ${p.name} failed:`, err.message);
      }
    }
  } else {
    // Small context: Groq 70B → DeepSeek → Gemini → Groq 8B
    const providers = [
      { name: 'Groq Llama 70B', fn: () => callGroqStream(systemPrompt, messages, onChunk, GROQ_MODELS.LLAMA_70B) },
      { name: 'DeepSeek', fn: () => callDeepSeekStream(systemPrompt, messages, onChunk) },
      {
        name: 'Gemini 2.0 Flash',
        fn: async () => {
          const fullPrompt = `${systemPrompt}\n\n${messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}`;
          const result = await callGeminiText(fullPrompt);
          onChunk(result);
          return result;
        },
      },
      { name: 'Groq Llama 8B', fn: () => callGroqStream(systemPrompt, messages, onChunk, GROQ_MODELS.LLAMA_8B) },
    ];

    for (const p of providers) {
      try {
        const result = await p.fn();
        if (result) return result;
      } catch (err) {
        console.warn(`[AI Stream] ${p.name} failed:`, err.message);
      }
    }
  }

  throw new Error('All AI providers failed. Please try again later.');
}

/**
 * Smart document analysis:
 * Gemini 2.0 Flash (2M context, native PDF) → DeepSeek (paid) → Groq 70B (truncated)
 *
 * NOTE: For PDFs, always use Gemini — Groq cannot process PDFs natively.
 */
export async function smartAnalyzeDocument(text, prompt) {
  try {
    const fullPrompt = `${prompt}\n\nDocument content:\n${text}`;
    return await callGeminiText(fullPrompt);
  } catch (err) {
    console.warn('[AI] Gemini document analysis failed, trying DeepSeek:', err.message);
    try {
      return await callDeepSeek(prompt, [{ role: 'user', content: text.substring(0, 60000) }]);
    } catch (err2) {
      console.warn('[AI] DeepSeek failed, trying Groq (truncated):', err2.message);
      return await callGroq(prompt, [{ role: 'user', content: text }], GROQ_MODELS.LLAMA_70B);
    }
  }
}

/**
 * Call OpenRouter Vision — free models with image support
 * Free vision models: google/gemini-2.0-flash-exp:free, meta-llama/llama-4-scout:free
 */
export async function callOpenRouterVision(base64Image, prompt, mimeType = 'image/jpeg') {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key not configured');

  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

  // Try free vision models in order
  const visionModels = [
    'baidu/qianfan-ocr-fast:free',          // OCR-optimized, perfect for handwriting
    'google/gemma-4-26b-a4b-it:free',       // Google Gemma 4 with vision
    'google/gemma-4-31b-it:free',           // Google Gemma 4 larger
    'nvidia/nemotron-nano-12b-v2-vl:free',  // NVIDIA vision-language
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', // NVIDIA omni
  ];

  for (const model of visionModels) {
    try {
      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://lastweek.app',
          'X-Title': 'LastWeek',
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          }],
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(45000),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.warn(`[OpenRouter Vision] ${model} failed:`, err.error?.message || response.status);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        console.log(`[OpenRouter Vision] Success with ${model}`);
        return text;
      }
    } catch (err) {
      console.warn(`[OpenRouter Vision] ${model} error:`, err.message);
    }
  }

  throw new Error('All OpenRouter vision models failed');
}

/**
 * Smart image analysis:
 * Gemini Vision → OpenRouter Vision (free) → error
 */
export async function smartAnalyzeImage(base64Image, prompt, mimeType = 'image/jpeg') {
  // Try Gemini Vision first
  try {
    return await callGeminiVision(base64Image, prompt, mimeType);
  } catch (err) {
    console.warn('[AI Vision] Gemini Vision failed:', err.message);
  }

  // Try Gemini 1.5 Flash as second option
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: cleanBase64 } },
            ],
          }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
        }),
        signal: AbortSignal.timeout(45000),
      }
    );
    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }
  } catch (err) {
    console.warn('[AI Vision] Gemini 1.5 Flash failed:', err.message);
  }

  // OpenRouter free vision models as final fallback
  try {
    return await callOpenRouterVision(base64Image, prompt, mimeType);
  } catch (err) {
    console.warn('[AI Vision] OpenRouter Vision failed:', err.message);
  }

  throw new Error('Image analysis unavailable. All vision providers failed. Please try again later.');
}

/**
 * Robustly extract and parse JSON from an AI response.
 * Handles: raw JSON, ```json ... ```, ``` ... ```, and JSON embedded in prose.
 */
function extractJSON(text) {
  if (!text) throw new Error('Empty response');

  // 1. Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue to next strategy
    }
  }

  // 2. Try parsing the whole text directly
  try {
    return JSON.parse(text.trim());
  } catch {
    // continue
  }

  // 3. Extract first JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      // continue
    }
  }

  // 4. Extract first JSON object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      // continue
    }
  }

  throw new Error('No valid JSON found in response');
}

/**
 * Smart JSON generation with failover:
 * Groq Llama 70B → DeepSeek → Gemini 2.0 Flash → Groq 8B
 *
 * Order changed: Groq first (fast), DeepSeek second (paid/reliable),
 * Gemini last (has daily quota limits).
 */
export async function smartGenerateJSON(prompt) {
  const systemMsg = 'You are a JSON generator. Return ONLY valid JSON with no markdown, no code fences, no explanation. Just the raw JSON.';

  const providers = [
    {
      name: 'Groq Llama 70B',
      fn: async () => {
        const text = await callGroq(systemMsg, [{ role: 'user', content: prompt }], GROQ_MODELS.LLAMA_70B);
        return extractJSON(text);
      },
    },
    {
      name: 'DeepSeek',
      fn: async () => {
        const text = await callDeepSeek(systemMsg, [{ role: 'user', content: prompt }]);
        return extractJSON(text);
      },
    },
    {
      name: 'Gemini 2.0 Flash',
      fn: async () => {
        const text = await callGeminiText(prompt);
        return extractJSON(text);
      },
    },
    {
      name: 'Groq Llama 8B',
      fn: async () => {
        const text = await callGroq(systemMsg, [{ role: 'user', content: prompt }], GROQ_MODELS.LLAMA_8B);
        return extractJSON(text);
      },
    },
    {
      name: 'Groq Gemma',
      fn: async () => {
        const text = await callGroq(systemMsg, [{ role: 'user', content: prompt }], GROQ_MODELS.GEMMA);
        return extractJSON(text);
      },
    },
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      if (result) return result;
    } catch (err) {
      console.warn(`[AI JSON] ${provider.name} failed:`, err.message);
    }
  }

  throw new Error('All AI providers failed to generate JSON.');
}
