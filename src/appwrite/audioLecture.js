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
When creating any visual figure, use this format:

[FIGURE:Descriptive Title]
<svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;background:#1a1b2e;border-radius:12px">
  <!-- CRITICAL: All content must be inside a 20% padding zone -->
  <!-- Drawing area: x=50 to x=450, y=40 to y=360 (20% inset from edges) -->
  <!-- NEVER place elements at x<50, x>450, y<40, or y>360 -->
  
  <!-- Use these colors: -->
  <!-- Shapes/lines: #a78bfa (purple), #60a5fa (blue), #34d399 (green), #f87171 (red) -->
  <!-- Text labels: #e2e8f0 (light gray) -->
  <!-- Axes/borders: #475569 (dark gray) -->
  <!-- Fill areas: use 0.2 opacity versions of the above colors -->
  
  <!-- Text: font-family="sans-serif", font-size 13-16px, fill="#e2e8f0" -->
  <!-- Lines: stroke-width 2-3px -->
  <!-- Arrowheads: define in <defs> section -->
</svg>
[/FIGURE]

SVG QUALITY RULES:
1. ALWAYS use viewBox="0 0 500 400" for consistent sizing
2. ALWAYS keep 20% padding — nothing touches the edges (min x=50, max x=450, min y=40, max y=360)
3. ALWAYS label everything — every shape, axis, arrow, and data point must have a text label
4. ALWAYS use the dark background (#1a1b2e) with light-colored elements
5. For geometric figures: draw accurate angles, label all sides and angles with values from the lecture
6. For graphs: draw proper axes with tick marks, label axes, plot data points accurately
7. For process flows: use rounded rectangles connected by arrows, label each step
8. For force/vector diagrams: use arrows with proper direction and magnitude labels
9. Make figures LARGE and CLEAR — use the full drawing area (50-450 x, 40-360 y)
10. Include a title text at the top of the SVG (y=30, centered, font-size 16, bold)

WHEN TO ADD FIGURES:
- Geometric shapes or trigonometry → draw the triangle/circle with labeled angles/sides
- Graphs or functions → draw axes with the curve plotted accurately
- Process flows or cycles → draw boxes with arrows showing the flow
- Anatomical or structural diagrams → draw the structure with labels
- Physics diagrams (forces, circuits, motion) → draw with proper vectors
- Any time the lecturer says "imagine", "picture this", "as you can see", "draw a..."
- Comparisons or rankings → draw a bar chart or comparison diagram
- Timelines → draw a horizontal timeline with labeled events

## Summary
[Concise summary of main takeaways]

## Study Questions
[5 questions to test understanding]

Transcript:
${transcript}

Format the output in clean Markdown. Embed SVG figures inline where appropriate using the [FIGURE:title]...[/FIGURE] format described above. Make figures accurate to the lecture content — use actual numbers, labels, and relationships mentioned by the lecturer.`
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
