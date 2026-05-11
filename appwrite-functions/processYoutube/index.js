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
      
      // If old cache missing new fields, reprocess
      if (!doc.title || !doc.detailedNotes) {
        log(`Cache outdated for videoId: ${videoId}, reprocessing...`);
        // Delete old cache and continue to reprocess
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
        } catch (e) {
          log('Failed to delete outdated cache: ' + e.message);
        }
      } else {
        log(`Cache hit for videoId: ${videoId}`);
        return res.json({
          success: true,
          cached: true,
          docId: doc.$id,
          data: {
            title:       doc.title,
            summary:     doc.summary,
            detailedNotes: doc.detailedNotes,
            flashcards:  doc.flashcards,
            quiz:        doc.quiz,
            keyTopics:   doc.keyTopics,
          },
        });
      }
    }
  } catch (e) {
    // Collection empty or query failed — continue to process
    log('Cache check failed, continuing: ' + e.message);
  }

  // ── Fetch YouTube transcript (server-side, try multiple times with delay) ──
  let transcript, videoTitle = 'Untitled Video';
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      log(`Fetching transcript, attempt ${attempts}/${maxAttempts}`);
      
      const raw = await YoutubeTranscript.fetchTranscript(videoId);
      transcript = raw.map(t => t.text).join(' ');
      
      if (transcript && transcript.trim().length >= 100) {
        log('Transcript fetched successfully');
        break;
      }
    } catch (e) {
      error(`Transcript fetch attempt ${attempts} failed: ${e.message}`);
      
      if (attempts < maxAttempts) {
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        return res.json({
          error: 'No captions available for this video. Try a different video that has subtitles/captions enabled.',
        }, 400);
      }
    }
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
            content: 'You are an expert study assistant. Always respond with valid JSON only. No markdown, no explanation outside the JSON. Always write your response in English, even if the transcript is in another language.',
          },
          {
            role: 'user',
            content: `Analyze this video transcript and return a JSON object with exactly this structure:
{
  "title": "Inferred video title from content (10-15 words max)",
  "summary": ["key point 1", "key point 2", ..., "key point 10"],
  "detailedNotes": "A comprehensive 3-4 paragraph summary covering all major concepts, examples, and takeaways from the video. Write in clear, educational prose.",
  "flashcards": [
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." },
    ... (10 total flashcards)
  ],
  "quiz": [
    { "question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Why this answer is correct" },
    { "question": "...", "options": ["A", "B", "C", "D"], "correct": 1, "explanation": "..." },
    ... (5 total quiz questions)
  ],
  "keyTopics": ["topic 1", "topic 2", ..., "topic 8"]
}

Rules:
- Infer a descriptive title from the content (10-15 words max)
- Generate exactly 10 summary points (each under 20 words)
- Write detailed notes as 3-4 connected paragraphs (200-300 words total)
- Create 10 flashcards covering all major concepts
- Create 5 quiz questions with explanations for each correct answer
- Extract 8 key topics/concepts
- "correct" is the 0-based index of the correct option in the options array
- Make flashcard questions specific and testable
- Quiz questions should test understanding, not just recall

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
    !studyMaterial.title ||
    !Array.isArray(studyMaterial.summary) ||
    !studyMaterial.detailedNotes ||
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
      title:       studyMaterial.title,
      summary:     studyMaterial.summary,
      detailedNotes: studyMaterial.detailedNotes,
      flashcards:  JSON.stringify(studyMaterial.flashcards),
      quiz:        JSON.stringify(studyMaterial.quiz),
      keyTopics:   studyMaterial.keyTopics,
      createdAt:   new Date().toISOString(),
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
        title:       studyMaterial.title,
        summary:     studyMaterial.summary,
        detailedNotes: studyMaterial.detailedNotes,
        flashcards:  JSON.stringify(studyMaterial.flashcards),
        quiz:        JSON.stringify(studyMaterial.quiz),
        keyTopics:   studyMaterial.keyTopics,
      },
    });
  }

  return res.json({
    success: true,
    cached:  false,
    docId:   saved.$id,
    data: {
      title:       studyMaterial.title,
      summary:     studyMaterial.summary,
      detailedNotes: studyMaterial.detailedNotes,
      flashcards:  JSON.stringify(studyMaterial.flashcards),
      quiz:        JSON.stringify(studyMaterial.quiz),
      keyTopics:   studyMaterial.keyTopics,
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
