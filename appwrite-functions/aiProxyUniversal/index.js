/**
 * Appwrite Function: Universal AI Proxy
 *
 * Secures ALL AI API calls by keeping keys server-side.
 * Supports: DeepSeek, Gemini, Groq
 *
 * POST /aiProxy
 * Body: {
 *   provider: 'deepseek' | 'gemini' | 'groq',
 *   action: 'chat' | 'vision' | 'transcribe',
 *   systemPrompt?: string,
 *   messages?: [{role, content}],
 *   prompt?: string,  // for simple prompts
 *   model?: string,
 *   image?: string,   // base64 or URL
 *   mimeType?: string,
 *   audioFile?: string, // base64
 *   temperature?: number,
 *   maxTokens?: number,
 * }
 *
 * Returns: { success: true, content: "...", usage?: {...} }
 * or { success: false, error: "..." }
 *
 * Environment variables (set in Appwrite console):
 *   DEEPSEEK_API_KEY
 *   GEMINI_API_KEY
 *   GROQ_API_KEY
 */

const ENDPOINTS = {
  deepseek: 'https://api.deepseek.com/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  groqTranscribe: 'https://api.groq.com/openai/v1/audio/transcriptions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-appwrite-key',
  'Content-Type': 'application/json',
};

export default async ({ req, res, log, error }) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.json({}, 200, CORS_HEADERS);
  }

  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method not allowed' }, 405, CORS_HEADERS);
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.json({ success: false, error: 'Invalid JSON body' }, 400, CORS_HEADERS);
  }

  const {
    provider,
    action = 'chat',
    systemPrompt = '',
    messages = [],
    prompt = '',
    model,
    image,
    mimeType = 'image/jpeg',
    audioFile,
    temperature = 0.7,
    maxTokens = 4096,
  } = body;

  if (!provider) {
    return res.json({ success: false, error: 'provider is required' }, 400, CORS_HEADERS);
  }

  log(`[aiProxy] ${provider} ${action} request`);
  log(`[aiProxy] Version: v3 - 2024-06-04`);

  // ── Route to provider handlers ─────────────────────────────────────────────
  try {
    let result;
    switch (provider) {
      case 'deepseek':
        result = await handleDeepSeek({ systemPrompt, messages, prompt, model, temperature, maxTokens }, { log, error });
        break;
      case 'gemini':
        result = await handleGemini({ action, systemPrompt, messages, prompt, image, mimeType, model }, { log, error });
        break;
      case 'groq':
        if (action === 'transcribe_async') {
          result = await handleAsyncTranscription({ jobId: body.jobId, audioData: body.audioFile }, { log, error });
        } else {
          result = await handleGroq({ action, systemPrompt, messages, prompt, image, mimeType, audioFile, model, temperature, maxTokens }, { log, error });
        }
        break;
      default:
        return res.json({ success: false, error: `Unknown provider: ${provider}` }, 400, CORS_HEADERS);
    }
    return res.json(result, 200, CORS_HEADERS);
  } catch (err) {
    error(`[aiProxy] Error: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500, CORS_HEADERS);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEEPSEEK HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

async function handleDeepSeek(params, { log, error }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const { systemPrompt, messages, prompt, model = 'deepseek-chat', temperature, maxTokens } = params;

  // Build messages array
  let msgs = [];
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
  if (prompt) msgs.push({ role: 'user', content: prompt });
  if (messages && messages.length > 0) msgs = msgs.concat(messages);

  if (msgs.length === 0) throw new Error('No messages provided');

  log(`[DeepSeek] Calling with ${msgs.length} messages`);

  const response = await fetch(ENDPOINTS.deepseek, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: msgs,
      stream: false,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `DeepSeek error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  log(`[DeepSeek] Success, ${content.length} chars`);

  return {
    success: true,
    content,
    usage: data.usage,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

async function handleGemini(params, { log, error }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const { action, systemPrompt, messages, prompt, image, mimeType, model = 'gemini-2.5-flash' } = params;

  const endpoint = `${ENDPOINTS.gemini}/${model}:generateContent?key=${apiKey}`;

  let parts = [];

  if (action === 'vision' && image) {
    // Vision mode
    const cleanBase64 = image.replace(/^data:image\/[a-z]+;base64,/, '');
    parts.push({ text: prompt || 'Describe this image' });
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64,
      },
    });
  } else {
    // Text mode
    let textContent = '';
    if (systemPrompt) textContent += systemPrompt + '\n\n';
    if (prompt) textContent += prompt;
    if (messages && messages.length > 0) {
      textContent += messages.map(m => `${m.role}: ${m.content}`).join('\n');
    }
    parts.push({ text: textContent });
  }

  log(`[Gemini] Calling ${model} with ${parts.length} parts`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      ...(systemPrompt && !image && {
        systemInstruction: { parts: [{ text: systemPrompt }] },
      }),
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gemini error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  log(`[Gemini] Success, ${content.length} chars`);

  return {
    success: true,
    content,
    usage: data.usageMetadata,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROQ HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC TRANSCRIPTION HANDLER (bypasses 30s sync timeout)
// ═══════════════════════════════════════════════════════════════════════════════

async function handleAsyncTranscription({ jobId, audioData }, { log, error }) {
  const apiKey = process.env.GROQ_API_KEY;
  const appwriteApiKey = process.env.APPWRITE_API_KEY;
  const appwriteEndpoint = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const databaseId = process.env.APPWRITE_DATABASE_ID || '69f742a2001f393e4b85';
  const collectionId = 'transcription_jobs';

  if (!apiKey) throw new Error('GROQ_API_KEY not configured');
  if (!appwriteApiKey) throw new Error('APPWRITE_API_KEY not configured');

  const patchJob = async (data) => {
    await fetch(`${appwriteEndpoint}/databases/${databaseId}/collections/${collectionId}/documents/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': appwriteApiKey,
      },
      body: JSON.stringify(data),
    });
  };

  // Mark as processing
  await patchJob({ status: 'processing' }).catch(err => error(`[AsyncTranscription] Status update failed: ${err.message}`));
  log(`[AsyncTranscription] Processing job ${jobId}`);

  try {
    const buffer = Buffer.from(audioData, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-large-v3');

    log(`[AsyncTranscription] Calling Groq Whisper, audio size: ${Math.round(buffer.length / 1024)}KB`);

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Groq transcribe error: ${response.status}`);
    }

    const data = await response.json();
    const transcript = data.text || '';
    log(`[AsyncTranscription] Success, ${transcript.length} chars`);

    // Store result
    await patchJob({ status: 'completed', result: transcript });

    return { success: true, message: 'Transcription completed' };
  } catch (err) {
    error(`[AsyncTranscription] Error: ${err.message}`);
    await patchJob({ status: 'failed', error: err.message }).catch(() => {});
    throw err;
  }
}
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const { action, systemPrompt, messages, prompt, image, mimeType, audioFile, model, temperature, maxTokens } = params;

  if (action === 'transcribe') {
    // Audio transcription
    if (!audioFile) throw new Error('audioFile required for transcription');
    log('[Groq] Transcribing audio');

    // Convert base64 to buffer
    const buffer = Buffer.from(audioFile, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-large-v3');

    const response = await fetch(ENDPOINTS.groqTranscribe, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Groq transcribe error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      content: data.text || '',
    };
  }

  // Chat completion (text or vision)
  const chatModel = model || (action === 'vision' ? 'llama-3.2-90b-vision-preview' : 'llama-3.3-70b-versatile');

  // Reduce max_tokens for 8B model to stay within TPM limits (6000 TPM for free tier)
  const safeMaxTokens = chatModel.includes('8b') ? Math.min(maxTokens || 2048, 2048) : (maxTokens || 4096);

  let msgs = [];
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });

  if (action === 'vision' && image) {
    const cleanBase64 = image.replace(/^data:image\/[a-z]+;base64,/, '');
    msgs.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt || 'Describe this image' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${cleanBase64}` } },
      ],
    });
  } else {
    if (prompt) msgs.push({ role: 'user', content: prompt });
    if (messages && messages.length > 0) msgs = msgs.concat(messages);
  }

  log(`[Groq] Calling ${chatModel} with ${msgs.length} messages`);

  const response = await fetch(ENDPOINTS.groq, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: chatModel,
      messages: msgs,
      temperature,
      max_tokens: safeMaxTokens,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Groq error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  log(`[Groq] Success, ${content.length} chars`);

  return {
    success: true,
    content,
    usage: data.usage,
  };
}

