/**
 * Appwrite Function: AI Proxy (DeepSeek test)
 *
 * Accepts:
 *   POST { systemPrompt, messages, stream }
 *
 * Returns:
 *   { success: true, content: "..." }
 *
 * Environment variables required (set in Appwrite console):
 *   DEEPSEEK_API_KEY
 */

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';

export default async ({ req, res, log, error }) => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-appwrite-key',
    'Content-Type': 'application/json',
  };

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

  const { systemPrompt = '', messages = [] } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.json({ success: false, error: 'messages array is required' }, 400, CORS_HEADERS);
  }

  // ── Get API key from function environment ──────────────────────────────────
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_API_KEY) {
    error('DEEPSEEK_API_KEY not set in function environment variables');
    return res.json({ success: false, error: 'AI provider not configured' }, 500, CORS_HEADERS);
  }

  // ── Build request to DeepSeek ──────────────────────────────────────────────
  const deepseekMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  log(`[aiProxy] Calling DeepSeek with ${deepseekMessages.length} messages`);

  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: deepseekMessages,
        stream: false,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `DeepSeek error: ${response.status}`;
      error(`[aiProxy] DeepSeek failed: ${errMsg}`);
      return res.json({ success: false, error: errMsg }, response.status, CORS_HEADERS);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    log(`[aiProxy] DeepSeek success, response length: ${content.length} chars`);

    return res.json({ success: true, content }, 200, CORS_HEADERS);

  } catch (err) {
    error(`[aiProxy] Fetch error: ${err.message}`);
    return res.json(
      { success: false, error: `Network error: ${err.message}` },
      500,
      CORS_HEADERS
    );
  }
};
