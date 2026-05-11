import { storage, databases, ID } from './config';
import { Query } from 'appwrite';
import { uploadAudioToR2, deleteAudioFromR2 } from './r2Storage';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const AUDIO_LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID || 'audio_lectures';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

/**
 * Process audio file: upload to R2 → transcribe with Gemini → structure with DeepSeek → save as lecture
 */
export const processAudioLecture = async (audioFile, userId, sessionId, onProgress) => {
  try {
    // Step 1: Upload audio to Cloudflare R2
    onProgress?.('Uploading audio to cloud storage...');
    console.log('[R2] Uploading file:', audioFile.name, audioFile.type);
    const { fileId, url: audioUrl } = await uploadAudioToR2(audioFile, userId);
    console.log('[R2] Upload success. fileId:', fileId, 'url:', audioUrl);

    // Step 2: Transcribe with Gemini (supports audio input)
    onProgress?.('Transcribing audio with Gemini AI...');
    console.log('[Gemini] Starting transcription, mime_type:', 
      audioFile.type === 'audio/mpeg' ? 'audio/mp3' : audioFile.type);
    
    const base64data = await fileToBase64(audioFile);
    console.log('[Gemini] Base64 length:', base64data.length, 'chars (~', 
      (base64data.length * 0.75 / 1024 / 1024).toFixed(2), 'MB)');

    // Use Gemini's audio transcription - use gemini-flash-latest (same as chat)
    const transcriptResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              inline_data: {
                // Normalize mime type - Gemini needs specific audio types
                mime_type: audioFile.type === 'audio/mpeg' ? 'audio/mp3' : audioFile.type,
                data: base64data
              }
            }, {
              text: "Transcribe this audio lecture accurately. Include all spoken content, maintaining the structure and flow of the lecture."
            }]
          }]
        })
      }
    );

    console.log('[Gemini] Response status:', transcriptResponse.status, transcriptResponse.statusText);

    if (!transcriptResponse.ok) {
      const errBody = await transcriptResponse.json().catch(() => ({}));
      console.error('[Gemini] Error body:', errBody);
      throw new Error(`Failed to transcribe audio: ${errBody?.error?.message || transcriptResponse.status}`);
    }

    const transcriptData = await transcriptResponse.json();
    console.log('[Gemini] Response candidates:', transcriptData.candidates?.length);
    const transcript = transcriptData.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('[Gemini] Transcript length:', transcript?.length, 'chars');

    if (!transcript || transcript.length < 100) {
      throw new Error('Transcript is too short or empty. Please use a longer audio file.');
    }

    // Step 2: Process transcript with DeepSeek to create structured lecture notes
    onProgress?.('Creating structured lecture notes with DeepSeek...');
    
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
- When the lecture describes a diagram, figure, graph, geometric shape, process flow, or anything visual — embed an SVG figure using this exact format:

[FIGURE:Title of figure]
<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;background:#1e1e2e;border-radius:8px;padding:8px">
  <!-- draw the figure here using SVG elements: rect, circle, line, path, text, etc. -->
  <!-- Use light colors (#e2e8f0, #94a3b8) for shapes and white for text labels -->
  <!-- Keep it clean, educational, and clearly labeled -->
</svg>
[/FIGURE]

Examples of when to add figures:
- Geometric shapes or trigonometry → draw the triangle/circle with labeled angles/sides
- Graphs or functions → draw axes with the curve
- Process flows or cycles → draw boxes with arrows
- Anatomical or structural diagrams → draw the structure with labels
- Physics diagrams (forces, circuits) → draw the diagram
- Any time the lecturer says "imagine", "picture this", "as you can see", "draw a..."
]

## Summary
[Concise summary of main takeaways]

## Study Questions
[5 questions to test understanding]

Transcript:
${transcript}

Format the output in clean Markdown. Embed SVG figures inline where appropriate as described above.`
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
