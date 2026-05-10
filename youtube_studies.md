# YouTube Study Feature — Full Implementation Spec

## Overview

Add a YouTube video study feature to the existing React + Appwrite app. Users paste a YouTube URL, the app fetches the transcript, sends it to DeepSeek AI, and returns a summary, flashcards, quiz, and key topics. Results are saved in Appwrite Database and cached so the same video is never processed twice.

---

## Tech Stack

- Frontend: React JS
- Backend: Appwrite Cloud (Functions, Database, Storage)
- AI for text: DeepSeek API
- AI for images/vision: Gemini Flash API
- Transcript fetching: youtube-transcript npm package (free, no API key needed)

---

## Part 1: Appwrite Database

### Create a new collection called `youtube_studies`

Add the following attributes to the collection:

| Attribute Name | Type | Required |
|---|---|---|
| userId | String, size 255 | Yes |
| videoId | String, size 255 | Yes |
| youtubeUrl | String, size 500 | Yes |
| summary | String[], array | Yes |
| flashcards | String, size 50000 | Yes |
| quiz | String, size 50000 | Yes |
| keyTopics | String[], array | Yes |
| createdAt | String, size 255 | Yes |

### Collection permissions
- Create: Users
- Read: Users (own documents only)
- Update: Any (for Appwrite Function server key)
- Delete: Users (own documents only)

---

## Part 2: Appwrite Function — processYoutube

### Function settings
- Name: processYoutube
- Runtime: Node.js 18
- Method: POST
- Timeout: 60 seconds

### Environment variables to add in Appwrite Function settings

```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_appwrite_server_api_key_here
APPWRITE_DATABASE_ID=your_database_id_here
```

### package.json for the function

Create this file inside your function folder:

```json
{
  "name": "process-youtube",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "youtube-transcript": "^1.2.1",
    "node-appwrite": "^12.0.0"
  }
}
```

### index.js for the function

Create this file inside your function folder:

```javascript
import { Client, Databases, ID, Query } from 'node-appwrite';
import { YoutubeTranscript } from 'youtube-transcript';

export default async ({ req, res }) => {
  const { youtubeUrl, userId } = req.body;

  if (!youtubeUrl || !userId) {
    return res.json({ error: 'youtubeUrl and userId are required' }, 400);
  }

  // Step 1: Extract video ID from URL
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    return res.json({ error: 'Invalid YouTube URL. Please paste a valid YouTube link.' }, 400);
  }

  // Step 2: Set up Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // Step 3: Check if this video was already processed (cache)
  try {
    const existing = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'youtube_studies',
      [Query.equal('videoId', videoId)]
    );

    if (existing.documents.length > 0) {
      const doc = existing.documents[0];
      return res.json({
        success: true,
        cached: true,
        data: {
          summary: doc.summary,
          flashcards: doc.flashcards,
          quiz: doc.quiz,
          keyTopics: doc.keyTopics
        },
        docId: doc.$id
      });
    }
  } catch (e) {
    // Collection might be empty, continue
  }

  // Step 4: Fetch YouTube transcript
  let transcript;
  try {
    const raw = await YoutubeTranscript.fetchTranscript(videoId);
    transcript = raw.map(t => t.text).join(' ');
  } catch (e) {
    return res.json({
      error: 'No captions available for this video. Try a different video.'
    }, 400);
  }

  if (!transcript || transcript.trim().length < 100) {
    return res.json({
      error: 'Transcript is too short to analyze. Try a longer video.'
    }, 400);
  }

  // Step 5: Chunk transcript (use first 3000 words to stay within token limits)
  const chunks = chunkText(transcript, 3000);
  const textToAnalyze = chunks[0];

  // Step 6: Send to DeepSeek AI
  let studyMaterial;
  try {
    const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an expert study assistant. Always respond with valid JSON only. No markdown, no explanation, just the JSON object.'
          },
          {
            role: 'user',
            content: `Analyze this video transcript and return a JSON object with exactly this structure:
{
  "summary": ["key point 1", "key point 2", "key point 3", "key point 4", "key point 5"],
  "flashcards": [
    { "question": "question text here", "answer": "answer text here" },
    { "question": "question text here", "answer": "answer text here" },
    { "question": "question text here", "answer": "answer text here" },
    { "question": "question text here", "answer": "answer text here" },
    { "question": "question text here", "answer": "answer text here" }
  ],
  "quiz": [
    {
      "question": "question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0
    },
    {
      "question": "question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 1
    },
    {
      "question": "question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 2
    }
  ],
  "keyTopics": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"]
}

The "correct" field in quiz is the index (0-3) of the correct option in the options array.
Generate exactly 5 summary points, 5 flashcards, 3 quiz questions, and 5 key topics.

Transcript:
${textToAnalyze}`
          }
        ]
      })
    });

    const aiData = await aiResponse.json();

    if (!aiData.choices || !aiData.choices[0]) {
      return res.json({ error: 'AI failed to process the transcript. Please try again.' }, 500);
    }

    studyMaterial = JSON.parse(aiData.choices[0].message.content);
  } catch (e) {
    return res.json({ error: 'Failed to analyze transcript with AI. Please try again.' }, 500);
  }

  // Step 7: Save to Appwrite Database
  let saved;
  try {
    saved = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'youtube_studies',
      ID.unique(),
      {
        userId,
        videoId,
        youtubeUrl,
        summary: studyMaterial.summary,
        flashcards: JSON.stringify(studyMaterial.flashcards),
        quiz: JSON.stringify(studyMaterial.quiz),
        keyTopics: studyMaterial.keyTopics,
        createdAt: new Date().toISOString()
      }
    );
  } catch (e) {
    // Still return data even if save fails
    return res.json({
      success: true,
      cached: false,
      data: {
        summary: studyMaterial.summary,
        flashcards: JSON.stringify(studyMaterial.flashcards),
        quiz: JSON.stringify(studyMaterial.quiz),
        keyTopics: studyMaterial.keyTopics
      }
    });
  }

  return res.json({
    success: true,
    cached: false,
    data: {
      summary: studyMaterial.summary,
      flashcards: JSON.stringify(studyMaterial.flashcards),
      quiz: JSON.stringify(studyMaterial.quiz),
      keyTopics: studyMaterial.keyTopics
    },
    docId: saved.$id
  });
};

// Helper: extract video ID from any YouTube URL format
function extractVideoId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper: split transcript into chunks by word count
function chunkText(text, wordCount) {
  const words = text.split(' ');
  const chunks = [];
  for (let i = 0; i < words.length; i += wordCount) {
    chunks.push(words.slice(i, i + wordCount).join(' '));
  }
  return chunks;
}
```

---

## Part 3: React Components

### File 1: src/appwrite/functions.js

Add this function to your existing Appwrite functions file (or create it if it does not exist):

```javascript
import { functions } from './config'; // your existing appwrite config file

export const processYoutubeVideo = async (youtubeUrl, userId) => {
  const execution = await functions.createExecution(
    'processYoutube', // must match your Appwrite Function ID exactly
    JSON.stringify({ youtubeUrl, userId }),
    false
  );

  if (execution.status === 'failed') {
    throw new Error('Function execution failed');
  }

  const response = JSON.parse(execution.responseBody);
  return response;
};
```

### File 2: src/components/YoutubeStudy/FlashCard.jsx

```jsx
import { useState } from 'react';

export default function FlashCard({ card, index }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{
        cursor: 'pointer',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: flipped ? '#f0fdf4' : '#fafafa',
        transition: 'background-color 0.3s ease',
        userSelect: 'none'
      }}
    >
      <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
        Card {index + 1} — {flipped ? 'Answer' : 'Question'} (click to flip)
      </span>
      <p style={{ fontSize: '16px', fontWeight: '500', color: '#1e293b', margin: 0 }}>
        {flipped ? card.answer : card.question}
      </p>
    </div>
  );
}
```

### File 3: src/components/YoutubeStudy/Quiz.jsx

```jsx
import { useState } from 'react';

export default function Quiz({ questions }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const score = Object.entries(answers).filter(
    ([i, a]) => Number(a) === questions[Number(i)].correct
  ).length;

  const handleSelect = (questionIndex, optionIndex) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {questions.map((q, i) => (
        <div key={i} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <p style={{ fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
            {i + 1}. {q.question}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {q.options.map((opt, j) => {
              let bgColor = '#f8fafc';
              let borderColor = '#e2e8f0';
              let color = '#374151';

              if (submitted) {
                if (j === q.correct) {
                  bgColor = '#f0fdf4';
                  borderColor = '#22c55e';
                  color = '#15803d';
                } else if (answers[i] === j && j !== q.correct) {
                  bgColor = '#fef2f2';
                  borderColor = '#ef4444';
                  color = '#b91c1c';
                }
              } else if (answers[i] === j) {
                bgColor = '#eff6ff';
                borderColor = '#3b82f6';
                color = '#1d4ed8';
              }

              return (
                <div
                  key={j}
                  onClick={() => handleSelect(i, j)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    backgroundColor: bgColor,
                    color,
                    cursor: submitted ? 'default' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {opt}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Submit Quiz
        </button>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
            Your Score: {score} / {questions.length}
          </p>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>
            {score === questions.length
              ? 'Perfect score! Great job!'
              : score >= questions.length / 2
              ? 'Good effort! Review the ones you missed.'
              : 'Keep studying and try again!'}
          </p>
          <button
            onClick={handleRetry}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f1f5f9',
              color: '#374151',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
```

### File 4: src/components/YoutubeStudy/YoutubeStudy.jsx

This is the main component. Import and use this wherever you want the feature to appear in your app.

```jsx
import { useState } from 'react';
import { processYoutubeVideo } from '../../appwrite/functions';
import FlashCard from './FlashCard';
import Quiz from './Quiz';

export default function YoutubeStudy({ user }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  const handleProcess = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await processYoutubeVideo(trimmedUrl, user.$id);

      if (!response.success) {
        setError(response.error || 'Something went wrong. Please try again.');
        return;
      }

      const data = response.data;
      setResult({
        summary: data.summary,
        flashcards: typeof data.flashcards === 'string'
          ? JSON.parse(data.flashcards)
          : data.flashcards,
        quiz: typeof data.quiz === 'string'
          ? JSON.parse(data.quiz)
          : data.quiz,
        keyTopics: data.keyTopics,
        cached: response.cached
      });

      setActiveTab('summary');
    } catch (e) {
      setError('Failed to process video. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleProcess();
  };

  const tabs = ['summary', 'flashcards', 'quiz', 'topics'];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
        Study a YouTube Video
      </h2>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Paste any YouTube link and get instant summaries, flashcards, and a quiz.
      </p>

      {/* URL Input */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '15px',
            outline: 'none',
            backgroundColor: loading ? '#f8fafc' : 'white'
          }}
        />
        <button
          onClick={handleProcess}
          disabled={loading || !url.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: loading || !url.trim() ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? 'Analyzing...' : 'Study This Video'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          color: '#64748b'
        }}>
          <p style={{ fontSize: '16px' }}>Fetching transcript and generating study materials...</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>This may take 10–20 seconds.</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#b91c1c',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div>
          {result.cached && (
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              Loaded from cache — this video was analyzed before.
            </p>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === tab ? '#3b82f6' : '#64748b',
                  fontWeight: activeTab === tab ? '600' : '400',
                  fontSize: '15px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'topics' ? 'Key Topics' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: 0, listStyle: 'none' }}>
              {result.summary.map((point, i) => (
                <li
                  key={i}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    borderLeft: '3px solid #3b82f6',
                    color: '#1e293b',
                    fontSize: '15px'
                  }}
                >
                  {point}
                </li>
              ))}
            </ul>
          )}

          {/* Flashcards Tab */}
          {activeTab === 'flashcards' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {result.flashcards.map((card, i) => (
                <FlashCard key={i} card={card} index={i} />
              ))}
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <Quiz questions={result.quiz} />
          )}

          {/* Key Topics Tab */}
          {activeTab === 'topics' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {result.keyTopics.map((topic, i) => (
                <span
                  key={i}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    borderRadius: '999px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #bfdbfe'
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Part 4: How to use the component in your app

In whichever page you want the YouTube study feature, import and render it like this:

```jsx
import YoutubeStudy from '../components/YoutubeStudy/YoutubeStudy';
import { useAuth } from '../hooks/useAuth'; // your existing auth hook

export default function StudyPage() {
  const { user } = useAuth();

  return (
    <div>
      <YoutubeStudy user={user} />
    </div>
  );
}
```

---

## Part 5: Checklist before testing

- [ ] Created `youtube_studies` collection in Appwrite with all attributes listed above
- [ ] Created `processYoutube` Appwrite Function with Node.js 18 runtime
- [ ] Added all 5 environment variables to the Appwrite Function
- [ ] Deployed the function (Appwrite Cloud > Functions > Deploy)
- [ ] Noted the exact Function ID from Appwrite dashboard and used it in `functions.js`
- [ ] Created the 4 files: `functions.js`, `FlashCard.jsx`, `Quiz.jsx`, `YoutubeStudy.jsx`
- [ ] Imported `YoutubeStudy` in your page and passed the `user` prop

---

## Part 6: Testing

Test with these YouTube URLs which are known to have transcripts:

- https://www.youtube.com/watch?v=dQw4w9WgXcQ
- https://www.youtube.com/watch?v=aircAruvnKk (3Blue1Brown — Neural Networks)
- https://youtu.be/rfscVS0vtbw (freeCodeCamp Python tutorial)

If you get "No captions available", try a different video. Educational and lecture videos almost always have transcripts.