/**
 * Appwrite Function: Gemini TTS
 * Converts text to speech using Google's Gemini API
 * Returns base64 audio data
 */

export default async ({ req, res, log, error }) => {
  // CORS headers for browser requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.json({}, 200, headers);
  }

  try {
    // Get Gemini API key from environment
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || Deno.env.get('GEMINI_API_KEY');
    
    log(`Environment check - Has API key: ${!!GEMINI_API_KEY}`);
    
    if (!GEMINI_API_KEY) {
      error('GEMINI_API_KEY not configured in environment variables');
      return res.json(
        { success: false, error: 'API key not configured' },
        500,
        headers
      );
    }

    // Parse request body
    const body = JSON.parse(req.body || '{}');
    const { text, voice = 'Kore', style = '' } = body;

    if (!text) {
      return res.json(
        { success: false, error: 'Text is required' },
        400,
        headers
      );
    }

    // Construct prompt
    const prompt = style ? `Say ${style}: ${text}` : text;

    log(`Generating TTS for: "${text.substring(0, 50)}..." with voice: ${voice}`);

    // Call Gemini API
    const MODEL = 'gemini-2.0-flash-exp';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
      return res.json(
        {
          success: false,
          error: `Gemini API error: ${response.status}`,
          details: errorData.error?.message || response.statusText
        },
        response.status,
        headers
      );
    }

    const data = await response.json();
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      error('No audio data in response');
      return res.json(
        { success: false, error: 'No audio data in response' },
        500,
        headers
      );
    }

    log('TTS generation successful');

    // Return audio data
    return res.json(
      {
        success: true,
        audio: audioData, // base64 encoded audio
        voice,
        textLength: text.length
      },
      200,
      headers
    );

  } catch (err) {
    error(`Function error: ${err.message}`);
    return res.json(
      {
        success: false,
        error: 'Internal server error',
        details: err.message
      },
      500,
      headers
    );
  }
};
