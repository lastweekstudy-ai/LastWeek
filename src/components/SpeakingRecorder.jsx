import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/aiProvider';
import { smartChat } from '../services/aiProvider';

/**
 * SpeakingRecorder
 *
 * Flow:
 * 1. User clicks "Record" → browser MediaRecorder captures mic audio
 * 2. User clicks "Stop" → audio blob sent to Groq Whisper for transcription
 * 3. Transcript + expected word sent to AI for pronunciation scoring
 * 4. Score, feedback, mistakes, and tip returned to parent via onResult()
 */
const SpeakingRecorder = ({ expectedWord, expectedPhrase, targetLanguage, targetLangCode, onResult }) => {
  const [state, setState] = useState('idle'); // idle | recording | processing | done
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setState('processing');
        await processRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setState('recording');
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.');
      setState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processRecording = async () => {
    try {
      // Step 1: Convert chunks to audio file
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'speaking.webm', { type: 'audio/webm' });

      // Step 2: Transcribe with Groq Whisper
      let transcript = '';
      try {
        transcript = await transcribeAudio(audioFile, targetLangCode === 'zh' ? 'zh' : null);
      } catch (whisperErr) {
        // Fallback: use browser SpeechRecognition if Whisper fails
        transcript = await browserTranscribe(targetLangCode);
      }

      if (!transcript || transcript.trim().length === 0) {
        setError('Could not hear anything. Please speak clearly and try again.');
        setState('idle');
        return;
      }

      // Step 3: AI pronunciation evaluation
      const evalPrompt = `You are a ${targetLanguage} pronunciation coach evaluating a language learner.

The student was asked to say: "${expectedWord}"
What the student said (transcribed): "${transcript}"

Evaluate their pronunciation attempt and return ONLY valid JSON (no markdown, no explanation):
{
  "score": <number 0-100>,
  "feedback": "<one sentence feedback>",
  "mistakes": [<list of specific mistakes if any>],
  "tip": "<one actionable tip to improve>"
}

Scoring guide:
- 90-100: Perfect or near-perfect match
- 80-89: Good attempt, minor pronunciation issues
- 70-79: Acceptable, some pronunciation issues
- 60-69: Understandable but needs work
- 50-59: Significant issues but recognizable
- Below 50: Very difficult to understand

If the transcript is very similar to the expected word, give a score of 85+.
If the transcript is somewhat similar, give 70-84.
If the transcript is different but understandable, give 50-69.
Be encouraging - this is a learner.`;

      const aiResponse = await smartChat('You are a language pronunciation evaluator. Return ONLY valid JSON with no markdown or explanation.', [
        { role: 'user', content: evalPrompt }
      ]);

      // Parse AI response
      let result = { score: 50, feedback: 'Keep practicing!', mistakes: [], tip: 'Try again.' };
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result = { ...result, ...parsed };
          // Ensure score is a number between 0-100
          if (typeof result.score === 'number' && result.score >= 0 && result.score <= 100) {
            // Score is valid
          } else {
            result.score = 50; // Default if invalid
          }
        }
      } catch (parseErr) {
        console.error('Failed to parse AI response:', parseErr, 'Response:', aiResponse);
        // Use defaults
      }

      result.transcript = transcript;
      console.log('[SpeakingRecorder] Final result:', result);
      onResult(result);
      setState('done');
    } catch (err) {
      console.error('Speaking evaluation error:', err);
      setError(`Evaluation failed: ${err.message}`);
      setState('idle');
    }
  };

  // Browser SpeechRecognition fallback
  const browserTranscribe = (langCode) => {
    return new Promise((resolve) => {
      const langCodeMap = {
        en: 'en-US', zh: 'zh-CN', es: 'es-ES', de: 'de-DE',
        fr: 'fr-FR', hi: 'hi-IN', bn: 'bn-BD',
      };
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) { resolve(''); return; }

      const recognition = new SpeechRecognition();
      recognition.lang = langCodeMap[langCode] || 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (e) => resolve(e.results[0][0].transcript);
      recognition.onerror = () => resolve('');
      recognition.start();
    });
  };

  const reset = () => {
    setState('idle');
    setError('');
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{error}</p>
      )}

      {state === 'idle' && (
        <button
          onClick={startRecording}
          style={{
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '2rem',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          🎙️ Record My Pronunciation
        </button>
      )}

      {state === 'recording' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
            <span>Recording... speak now</span>
          </div>
          <button
            onClick={stopRecording}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '2rem',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            ⏹ Stop Recording
          </button>
        </div>
      )}

      {state === 'processing' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-muted)' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span>Analyzing your pronunciation with AI...</span>
        </div>
      )}

      {state === 'done' && (
        <button
          onClick={reset}
          style={{
            background: 'transparent',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-accent)',
            borderRadius: '2rem',
            padding: '0.5rem 1.5rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          🔄 Try Again
        </button>
      )}
    </div>
  );
};

export default SpeakingRecorder;
