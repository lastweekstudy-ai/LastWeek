import React, { useState, useRef, useEffect } from 'react';
import { processAudioLecture } from '../appwrite/audioLecture';
import '../styles/AudioProcessor.css';

/**
 * AudioProcessor - Upload or record audio, transcribe with Gemini, process with DeepSeek
 * Creates a lecture document that behaves like a PDF resource
 */
const AudioProcessor = ({ userId, sessionId, onClose, onLectureCreated }) => {
  const [mode, setMode] = useState('upload'); // 'upload' or 'record'
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
      setError('Please upload a valid audio file (MP3, WAV, M4A, OGG, or WebM)');
      return;
    }

    // Validate file size (max 25MB for Gemini API)
    if (file.size > 25 * 1024 * 1024) {
      setError('Audio file must be smaller than 25MB');
      return;
    }

    setAudioFile(file);
    setError('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        setAudioFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Could not access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProcess = async () => {
    if (!audioFile) {
      setError('Please select or record an audio file first');
      return;
    }

    setProcessing(true);
    setError('');
    setProgress('Uploading audio...');

    // Debug log
    console.log('[Audio] Starting process:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      sizeMB: (audioFile.size / 1024 / 1024).toFixed(2) + ' MB'
    });

    try {
      const result = await processAudioLecture(audioFile, userId, sessionId, (progressMsg) => {
        console.log('[Audio] Progress:', progressMsg);
        setProgress(progressMsg);
      });

      console.log('[Audio] Success:', result);
      setProgress('Lecture created successfully!');
      setTimeout(() => {
        if (onLectureCreated) {
          onLectureCreated(result);
        }
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[Audio] Error:', err);
      setError(err.message || 'Failed to process audio. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="audio-processor-overlay" onClick={onClose}>
      <div className="audio-processor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="audio-processor-header">
          <h3>🎙️ Audio Lecture Processor</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="audio-processor-content">
          {/* Mode selector */}
          <div className="audio-mode-tabs">
            <button
              className={`audio-mode-tab ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => setMode('upload')}
              disabled={processing}
            >
              📁 Upload Audio
            </button>
            <button
              className={`audio-mode-tab ${mode === 'record' ? 'active' : ''}`}
              onClick={() => setMode('record')}
              disabled={processing}
            >
              🎤 Record Live
            </button>
          </div>

          {/* Upload mode */}
          {mode === 'upload' && (
            <div className="audio-upload-section">
              <div className="audio-upload-area">
                <input
                  type="file"
                  id="audio-file-input"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  disabled={processing}
                  style={{ display: 'none' }}
                />
                <label htmlFor="audio-file-input" className="audio-upload-label">
                  {audioFile ? (
                    <>
                      <div className="audio-file-icon">🎵</div>
                      <div className="audio-file-name">{audioFile.name}</div>
                      <div className="audio-file-size">
                        {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="audio-upload-icon">📁</div>
                      <p>Click to select audio file</p>
                      <span>MP3, WAV, M4A, OGG, WebM (max 25MB)</span>
                    </>
                  )}
                </label>
              </div>
              <p className="audio-hint">
                💡 Upload class recordings, podcasts, or YouTube audio downloads
                <br />
                <small>Audio will be saved for playback along with transcript and notes</small>
              </p>
            </div>
          )}

          {/* Record mode */}
          {mode === 'record' && (
            <div className="audio-record-section">
              <div className="audio-recorder">
                {!isRecording && !audioFile && (
                  <button className="record-btn" onClick={startRecording} disabled={processing}>
                    <div className="record-icon">⏺</div>
                    <span>Start Recording</span>
                  </button>
                )}

                {isRecording && (
                  <div className="recording-active">
                    <div className="recording-pulse"></div>
                    <div className="recording-time">{formatTime(recordingTime)}</div>
                    <button className="stop-btn" onClick={stopRecording}>
                      ⏹ Stop Recording
                    </button>
                  </div>
                )}

                {!isRecording && audioFile && (
                  <div className="recording-complete">
                    <div className="audio-file-icon">🎵</div>
                    <div className="audio-file-name">{audioFile.name}</div>
                    <div className="audio-file-size">
                      Duration: {formatTime(recordingTime)}
                    </div>
                    <button className="re-record-btn" onClick={() => setAudioFile(null)}>
                      🔄 Record Again
                    </button>
                  </div>
                )}
              </div>
              <p className="audio-hint">
                💡 Record live lectures, explanations, or voice notes
                <br />
                <small>Recording will be saved for playback along with transcript and notes</small>
              </p>
            </div>
          )}

          {/* Error message */}
          {error && <div className="audio-error">{error}</div>}

          {/* Progress */}
          {processing && (
            <div className="audio-progress">
              <div className="audio-progress-spinner"></div>
              <p>{progress}</p>
            </div>
          )}

          {/* Process button */}
          {audioFile && !processing && (
            <button className="audio-process-btn" onClick={handleProcess}>
              ✨ Process Audio → Create Lecture Notes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioProcessor;
