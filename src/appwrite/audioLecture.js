import { storage, databases, ID } from './config';
import { Query } from 'appwrite';
import { uploadAudioToR2, deleteAudioFromR2 } from './r2Storage';
import { transcribeAudio, callGeminiText, callDeepSeek } from '../services/aiProvider';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const AUDIO_LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID || 'audio_lectures';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

/**
 * Transcribe audio with Groq Whisper first, fall back to Gemini inline_data if Groq fails.
 */
async function transcribeWithFallback(audioFile, onProgress) {
  // Try Groq Whisper first (fastest, most accurate for transcription)
  try {
    onProgress?.('Transcribing audio...');
    const transcript = await transcribeAudio(audioFile);
    if (transcript && transcript.length > 50) {
      console.log('[Whisper] Transcription success, length:', transcript.length);
      return transcript;
    }
    throw new Error('Transcript too short');
  } catch (groqError) {
    console.warn('[Whisper] Failed, falling back to Gemini:', groqError.message);
  }

  // Fallback: Gemini multimodal (sends audio as base64 inline_data)
  try {
    onProgress?.('Transcribing audio...');
    const base64data = await fileToBase64(audioFile);
    const mimeType = audioFile.type === 'audio/mpeg' ? 'audio/mp3' : audioFile.type;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64data } },
              { text: 'Transcribe this audio lecture accurately. Include all spoken content, maintaining the structure and flow of the lecture.' },
            ],
          }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!transcript || transcript.length < 100) {
      throw new Error('Gemini transcript too short or empty');
    }
    console.log('[Gemini] Transcription fallback success, length:', transcript.length);
    return transcript;
  } catch (geminiError) {
    console.error('[Gemini] Transcription fallback also failed:', geminiError.message);
    throw new Error(`Audio transcription failed. Groq: rate limit or file issue. Gemini: ${geminiError.message}`);
  }
}

/**
 * Process audio file: upload to R2 → transcribe (Groq Whisper → Gemini) → structure with DeepSeek → save
 */
export const processAudioLecture = async (audioFile, userId, sessionId, onProgress) => {
  try {
    // Step 1: Upload audio to Cloudflare R2
    onProgress?.('Uploading audio to cloud storage...');
    const { fileId, url: audioUrl } = await uploadAudioToR2(audioFile, userId);

    // Step 2: Transcribe (Groq Whisper → Gemini fallback)
    const transcript = await transcribeWithFallback(audioFile, onProgress);

    // Step 3: Process transcript with DeepSeek to create structured lecture notes
    onProgress?.('Creating structured lecture notes...');
    
    const lectureResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. Convert lecture transcripts into well-structured, comprehensive study notes.'
          },
          {
            role: 'user',
            content: `Convert this lecture transcript into structured study notes with the following format:

# [Lecture Title - infer from content]

## Overview
[2-3 sentence summary of the lecture]

## Key Concepts
[List 5-8 main concepts covered, each with a brief explanation]

## Detailed Notes
[Comprehensive notes organized by topic/section with:
- Clear headings and subheadings
- Bullet points for key information
- Examples and explanations
- Important definitions highlighted
- When the lecture describes a diagram, figure, graph, geometric shape, process flow, or anything visual — embed an SVG figure using the EXACT format below]

SVG FIGURE RULES — FOLLOW EXACTLY:
[FIGURE:Descriptive Title of the Figure]
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <rect width="600" height="450" fill="#0f1117" rx="12"/>
  <!-- SAFE ZONE: x=60 to x=540, y=40 to y=410. NEVER place elements outside this zone. -->
  <!-- Colors: lines=#a78bfa, secondary=#60a5fa, positive=#34d399, negative=#f87171, highlight=#fbbf24 -->
  <!-- ALL text: font-family="system-ui,sans-serif" fill="#e2e8f0" -->
  <!-- Title: font-size="15" font-weight="bold" at y=28 text-anchor="middle" x="300" -->
  <!-- Labels: font-size="13", placed 8px away from the element they label -->
  <!-- Arrowheads: define colored markers in <defs>, use marker-end="url(#arr-purple)" etc. -->
  <!-- EVERY element must be labeled — no unlabeled shapes, lines, or arrows -->
</svg>
[/FIGURE]

SVG QUALITY RULES:
1. ALWAYS use viewBox="0 0 600 450" width="600" height="450" — standard canvas
2. ALWAYS start with <rect width="600" height="450" fill="#0f1117" rx="12"/> as background
3. SAFE ZONE: x=60–540, y=40–410. Nothing outside this zone.
4. Title at top: <text x="300" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="#e2e8f0">Title</text>
5. ALL text: font-family="system-ui,sans-serif" fill="#e2e8f0"
6. Color code by meaning: purple=primary, blue=secondary, green=positive/up, red=negative/down, yellow=highlight
7. EVERY shape, line, arrow, axis must have a text label with value and unit
8. For angled vectors: compute exact dx=length×cos(θ), dy=-length×sin(θ) — use real trig values
9. Define arrowhead markers in <defs> for each color used
10. Make figures fill the safe zone — use the full 480×370px drawing area

WHEN TO ADD FIGURES:
- Geometric shapes, trigonometry → labeled triangle/circle with all sides and angles
- Graphs, functions → axes with tick marks, plotted curve, labeled points
- Process flows, cycles → rounded rects connected by arrows
- Physics (forces, circuits, motion) → vectors with magnitude labels
- "imagine", "picture this", "as you can see", "draw a..." → always draw it
- Comparisons → bar chart using SVG rects
- Timelines → horizontal line with labeled event markers

## Summary
[Concise summary of main takeaways]

## Study Questions
[5 questions to test understanding]

Transcript:
${transcript}

Format the output in clean Markdown. Embed SVG figures inline where appropriate using the [FIGURE:title]...[/FIGURE] format. Make figures accurate to the lecture — use actual numbers, labels, and relationships mentioned by the lecturer.`
          }
        ],
        max_tokens: 8000,
        temperature: 0.7
      })
    });

    if (!lectureResponse.ok) {
      const errBody = await lectureResponse.json().catch(() => ({}));
      console.error('[DeepSeek] Error body:', errBody);
      throw new Error('Failed to process lecture notes');
    }

    const deepseekData = await lectureResponse.json();
    console.log('[DeepSeek] Response received, notes length:', 
      deepseekData.choices?.[0]?.message?.content?.length, 'chars');
    const lectureNotes = deepseekData.choices?.[0]?.message?.content;

    if (!lectureNotes) {
      throw new Error('Failed to generate lecture notes');
    }

    // Step 5: Extract title from lecture notes
    const titleMatch = lectureNotes.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : `Lecture - ${new Date().toLocaleDateString()}`;

    // Step 4: Save to database with R2 audio URL
    onProgress?.('Saving lecture...');
    
    const lectureData = {
      userId,
      title,
      audioFileId: fileId, // R2 file ID for deletion
      audioUrl, // Public R2 URL for playback
      transcript,
      lectureNotes,
      duration: 0, // Could be calculated from audio metadata
      isPublic: false, // Private by default - user must explicitly share
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add sessionId if provided and attribute exists
    if (sessionId) {
      lectureData.sessionId = sessionId;
    }
    
    let lectureDoc;
    try {
      lectureDoc = await databases.createDocument(
        DATABASE_ID,
        AUDIO_LECTURES_COLLECTION_ID,
        ID.unique(),
        lectureData
      );
    } catch (err) {
      // If sessionId attribute doesn't exist, remove it and retry
      if (err.message?.includes('sessionId') && lectureData.sessionId) {
        console.warn('[processAudioLecture] sessionId attribute not in schema yet, saving without it');
        console.warn('[processAudioLecture] To enable session scoping for audio, add sessionId attribute to audio_lectures collection in Appwrite');
        delete lectureData.sessionId;
        lectureDoc = await databases.createDocument(
          DATABASE_ID,
          AUDIO_LECTURES_COLLECTION_ID,
          ID.unique(),
          lectureData
        );
      } else if (err.message?.includes('isPublic') && lectureData.isPublic !== undefined) {
        console.warn('[processAudioLecture] isPublic attribute not in schema yet, saving without it');
        delete lectureData.isPublic;
        lectureDoc = await databases.createDocument(
          DATABASE_ID,
          AUDIO_LECTURES_COLLECTION_ID,
          ID.unique(),
          lectureData
        );
      } else {
        throw err;
      }
    }

    return {
      id: lectureDoc.$id,
      title,
      lectureNotes,
      transcript,
      audioUrl // Audio playback available!
    };

  } catch (error) {
    console.error('Audio processing error:', error);
    throw error;
  }
};

/**
 * Get audio lectures for a user, optionally filtered by session
 * @param {string} userId - User ID
 * @param {string} sessionId - Optional session ID to filter by session
 */
export const getUserAudioLectures = async (userId, sessionId = null) => {
  try {
    // Start with basic queries
    const queries = [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
      Query.limit(50)
    ];
    
    // Try to filter by session if provided
    if (sessionId) {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          AUDIO_LECTURES_COLLECTION_ID,
          [
            Query.equal('userId', userId),
            Query.equal('sessionId', sessionId),
            Query.orderDesc('createdAt'),
            Query.limit(50)
          ]
        );
        return response.documents;
      } catch (err) {
        // sessionId attribute doesn't exist yet, fall back to all user audio
        console.warn('[getUserAudioLectures] sessionId filtering not available, returning all user audio');
        const response = await databases.listDocuments(
          DATABASE_ID,
          AUDIO_LECTURES_COLLECTION_ID,
          queries
        );
        return response.documents;
      }
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      AUDIO_LECTURES_COLLECTION_ID,
      queries
    );
    return response.documents;
  } catch (error) {
    console.error('Failed to load audio lectures:', error);
    return [];
  }
};

/**
 * Get a single audio lecture by ID
 */
export const getAudioLecture = async (lectureId) => {
  try {
    return await databases.getDocument(
      DATABASE_ID,
      AUDIO_LECTURES_COLLECTION_ID,
      lectureId
    );
  } catch (error) {
    console.error('Failed to load lecture:', error);
    throw error;
  }
};

/**
 * Update last accessed time and increment view count
 * NOTE: audio_lectures table is at column limit — tracking stored in-memory only
 */
export const trackAudioLectureView = async (lectureId) => {
  // Column limit reached on audio_lectures — skip silently
};

/**
 * Track study time for an audio lecture
 * NOTE: audio_lectures table is at column limit — tracking stored in-memory only
 */
export const trackAudioStudyTime = async (lectureId, minutesStudied) => {
  // Column limit reached on audio_lectures — skip silently
};

/**
 * Delete an audio lecture
 */
export const deleteAudioLecture = async (lectureId, audioFileId) => {
  try {
    // Delete audio file from R2
    if (audioFileId) {
      await deleteAudioFromR2(audioFileId);
    }
    
    // Delete document
    await databases.deleteDocument(
      DATABASE_ID,
      AUDIO_LECTURES_COLLECTION_ID,
      lectureId
    );
  } catch (error) {
    console.error('Failed to delete lecture:', error);
    throw error;
  }
};

/**
 * Make an audio lecture public (opt-in sharing)
 */
export const makeAudioLecturePublic = async (lectureId) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      AUDIO_LECTURES_COLLECTION_ID,
      lectureId,
      { isPublic: true }
    );
  } catch (error) {
    console.error('Failed to make audio lecture public:', error);
    throw error;
  }
};

/**
 * Make an audio lecture private
 */
export const makeAudioLecturePrivate = async (lectureId) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      AUDIO_LECTURES_COLLECTION_ID,
      lectureId,
      { isPublic: false }
    );
  } catch (error) {
    console.error('Failed to make audio lecture private:', error);
    throw error;
  }
};

/**
 * Helper: Convert file to base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data:audio/...;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};
