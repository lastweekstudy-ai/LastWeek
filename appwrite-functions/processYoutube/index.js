import { Client, Databases, ID, Query } from 'node-appwrite';
import { YoutubeTranscript } from 'youtube-transcript';

export default async ({ req, res, log, error }) => {

  // ── Parse request body ─────────────────────────────────────────────────────
  let youtubeUrl, userId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    youtubeUrl = body.youtubeUrl;
    userId = body.userId;
  } catch (e) {
    return res.json({ error: 'Invalid request body.' }, 400);
  }

  if (!youtubeUrl || !userId) {
    return res.json({ error: 'youtubeUrl and userId are required.' }, 400);
  }

  // ── Extract video ID ───────────────────────────────────────────────────────
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    return res.json({ error: 'Invalid YouTube URL. Please paste a valid YouTube link.' }, 400);
  }

  // ── Set up Appwrite client (server-side) ───────────────────────────────────
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const COLLECTION_ID = 'youtube_studies';

  // ── Check cache — same video already processed? ────────────────────────────
  try {
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('videoId', videoId),
      Query.limit(1),
    ]);

    if (existing.documents.length > 0) {
      const doc = existing.documents[0];
      log(`Cache hit for videoId: ${videoId}`);
      return res.json({
        success: true,
        cached: true,
        docId: doc.$id,
        data: {
          summary:    doc.summary,
          flashcards: doc.flashcards,
          quiz:       doc.quiz,
          keyTopics:  doc.keyTopics,
        },
      });
    }
  } catch (e) {
    // Collection empty or query failed — continue to process
    log('Cache check failed, continuing: ' + e.message);
  }

  // ── Fetch YouTube transcript ───────────────────────────────────────────────
  let transcript;
  try {
    const raw = await YoutubeTranscript.fetchTranscript(videoId);
    transcript = raw.map(t => t.text).join(' ');
  } catch (e) {
    error('Transcript fetch failed: ' + e.message);
    return res.json({
      error: 'No captions available for this video. Try a different video that has subtitles/captions enabled.',
    }, 400);
  }

  if (!transcript || transcript.trim().length < 100) {
    return res.json({ error: 'Transcript is too short to analyze. Try a longer video.' }, 400);
  }

  // ── Chunk to first 3000 words (token limit safety) ─────────────────────────
  const textToAnalyze = transcript.split(' ').slice(0, 3000).join(' ');

  // ── Call DeepSeek AI ───────────────────────────────────────────────────────
  let studyMaterial;
  try {
    const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an expert study assistant. Always respond with valid JSON only. No markdown, no explanation outside the JSON.',
          },
          {
            role: 'user',
            content: `Analyze this video transcript and return a JSON object with exactly this structure:
{
  "summary": ["key point 1", "key point 2", "key point 3", "key point 4", "key point 5"],
  "flashcards": [
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ],
  "quiz": [
    { "question": "...", "options": ["A", "B", "C", "D"], "correct": 0 },
    { "question": "...", "options": ["A", "B", "C", "D"], "correct": 1 },
    { "question": "...", "options": ["A", "B", "C", "D"], "correct": 2 }
  ],
  "keyTopics": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"]
}

Rules:
- "correct" is the 0-based index of the correct option in the options array
- Generate exactly 5 summary points, 5 flashcards, 3 quiz questions, 5 key topics
- Keep each summary point under 20 words
- Make flashcard questions specific and testable

Transcript:
${textToAnalyze}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      error('DeepSeek API error: ' + errText);
      return res.json({ error: 'AI failed to process the transcript. Please try again.' }, 500);
    }

    const aiData = await aiResponse.json();

    if (!aiData.choices?.[0]?.message?.content) {
      return res.json({ error: 'AI returned an empty response. Please try again.' }, 500);
    }

    studyMaterial = JSON.parse(aiData.choices[0].message.content);
  } catch (e) {
    error('AI processing error: ' + e.message);
    return res.json({ error: 'Failed to analyze transcript with AI. Please try again.' }, 500);
  }

  // ── Validate AI output ─────────────────────────────────────────────────────
  if (
    !Array.isArray(studyMaterial.summary) ||
    !Array.isArray(studyMaterial.flashcards) ||
    !Array.isArray(studyMaterial.quiz) ||
    !Array.isArray(studyMaterial.keyTopics)
  ) {
    return res.json({ error: 'AI returned unexpected format. Please try again.' }, 500);
  }

  // ── Save to Appwrite Database ──────────────────────────────────────────────
  let saved;
  try {
    saved = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      userId,
      videoId,
      youtubeUrl,
      summary:    studyMaterial.summary,
      flashcards: JSON.stringify(studyMaterial.flashcards),
      quiz:       JSON.stringify(studyMaterial.quiz),
      keyTopics:  studyMaterial.keyTopics,
      createdAt:  new Date().toISOString(),
    });
    log(`Saved study for videoId: ${videoId}, docId: ${saved.$id}`);
  } catch (e) {
    error('Database save failed: ' + e.message);
    // Non-fatal — still return the data even if save fails
    return res.json({
      success: true,
      cached:  false,
      docId:   null,
      data: {
        summary:    studyMaterial.summary,
        flashcards: JSON.stringify(studyMaterial.flashcards),
        quiz:       JSON.stringify(studyMaterial.quiz),
        keyTopics:  studyMaterial.keyTopics,
      },
    });
  }

  return res.json({
    success: true,
    cached:  false,
    docId:   saved.$id,
    data: {
      summary:    studyMaterial.summary,
      flashcards: JSON.stringify(studyMaterial.flashcards),
      quiz:       JSON.stringify(studyMaterial.quiz),
      keyTopics:  studyMaterial.keyTopics,
    },
  });
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractVideoId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
