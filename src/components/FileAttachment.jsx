import React, { useState } from 'react';
import { uploadFile } from '../appwrite/storage';
import { createFileAttachment } from '../appwrite/database';
import { createPDFResource } from '../appwrite/pdfResources';
import useGemini from '../hooks/useGemini';
import { extractTextFromPDF, isPDFProcessable, extractText } from '../utils/pdfProcessor';
import { transcribeAudio } from '../services/aiProvider';

const FileAttachment = ({ onFileProcess, disabled = false, userId = null, sessionId = null, studyMode = 'mental_model', subject = 'General' }) => {
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progressText, setProgressText] = useState('');
  const { processImage, processDocument } = useGemini();

  const supportedTypes = {
    'application/pdf': 'PDF',
    'image/jpeg': 'Image',
    'image/png': 'Image',
    'image/svg+xml': 'SVG',
    'text/html': 'HTML',
    'text/plain': 'Text',
    'text/markdown': 'Markdown',
    'text/csv': 'CSV',
    'application/json': 'JSON',
    'audio/mpeg': 'Audio',
    'audio/mp3': 'Audio',
    'audio/wav': 'Audio',
    'audio/mp4': 'Audio',
    'audio/m4a': 'Audio',
    'audio/ogg': 'Audio',
    'audio/flac': 'Audio',
    'audio/webm': 'Audio',
  };

  const processFile = async (file) => {
    if (!file) return;

    setProcessing(true);
    try {
      let content = '';
      let fileType = file.type;
      let storageFileId = null;

      // ── Audio files: transcribe with Groq Whisper ─────────────────────────
      const isAudio = fileType.startsWith('audio/') || 
                      file.name.match(/\.(mp3|wav|m4a|ogg|flac|webm|aac)$/i);
      
      if (isAudio) {
        const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB Groq limit
        if (file.size > MAX_AUDIO_SIZE) {
          content = `[Audio file: ${file.name}]\n\nThis audio file is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 25MB. Please trim the audio and try again.`;
        } else {
          try {
            setProgressText('Transcribing audio…');
            const transcript = await transcribeAudio(file);
            setProgressText('');
            
            content = `[Audio transcribed: ${file.name}]\n\nTranscription:\n${transcript}\n\nThe audio has been transcribed. I can now help you study this content.`;
          } catch (audioError) {
            setProgressText('');
            console.error('Audio transcription failed:', audioError);
            content = `[Audio file: ${file.name}]\n\nAudio transcription failed: ${audioError.message}\n\nPlease try again or manually type out the content you want to study.`;
          }
        }

        await onFileProcess({
          name: file.name,
          type: fileType || 'audio/mpeg',
          size: file.size,
          content,
        });
        return;
      }

      // For larger files or PDFs, try to process content first, then optionally store
      const shouldTryProcessing = file.size > 100000 || fileType === 'application/pdf'; // 100KB threshold

      if (shouldTryProcessing) {
        // Try to extract content first
        let extractedContent = null;
        
        if (fileType === 'application/pdf') {
          try {
            if (!isPDFProcessable(file)) {
              throw new Error('PDF is too large or not processable');
            }
            
            const arrayBuffer = await file.arrayBuffer();
            const pdfText = await extractText(arrayBuffer, {
              processImage,
              onProgress: ({ pageNum }) => {
                setProgressText(`Processing page ${pageNum}…`);
              }
            });
            setProgressText('');
            
            if (!pdfText || pdfText.length < 50) {
              throw new Error('No readable text found in PDF');
            }
            
            extractedContent = pdfText;
          } catch (pdfError) {
            setProgressText('');
            console.error('PDF processing failed:', pdfError);
            console.error('PDF processing error details:', {
              message: pdfError.message,
              name: pdfError.name,
              code: pdfError.code,
              stack: pdfError.stack
            });
            extractedContent = `[PDF file: ${file.name}]

PDF text extraction failed: ${pdfError.message}

To proceed with studying this content, please:
1. Open the PDF file on your device
2. Copy the text you want to study  
3. Paste it directly into this chat
4. I'll help you analyze it using the current study mode

If this PDF contains mainly images, diagrams, or charts, please describe what you see and I'll help you understand the concepts.`;
          }
        } else if (fileType.startsWith('image/')) {
          try {
            const base64 = await fileToBase64(file);
            const geminiAnalysis = await processImage(base64, "Analyze this image and explain the concepts shown. Extract any text, diagrams, charts, tables, or educational content that would be useful for studying.");
            extractedContent = `[Image analyzed: ${file.name}]\n\nImage analysis:\n${geminiAnalysis}\n\nThe image has been processed. I can now help you study this content using the ${studyMode} approach.`;
          } catch (geminiError) {
            console.error('Image processing failed:', geminiError);
            extractedContent = `[Image uploaded: ${file.name}]\n\nImage processing is temporarily unavailable. Please describe what you see in the image and I'll help you study it using the ${studyMode} approach.`;
          }
        } else if (fileType.startsWith('text/') || fileType === 'application/json') {
          // Process text files
          const textContent = await file.text();
          try {
            const geminiAnalysis = await processDocument(textContent, "Extract key concepts and create study notes from this text content");
            extractedContent = `[Text file processed: ${file.name}]

File content analysis:
${geminiAnalysis}

Original text content:
${textContent.substring(0, 2000)}${textContent.length > 2000 ? '...' : ''}`;
          } catch (geminiError) {
            console.error('Gemini processing failed, using raw text:', geminiError);
            extractedContent = `[Text file uploaded: ${file.name}]

${textContent}`;
          }
        } else {
          // For other file types, provide guidance
          extractedContent = `[File uploaded: ${file.name} (${fileType})]

This file type requires manual content extraction. Please:
1. Open the file on your device
2. Copy the text content you want to study
3. Paste it in this chat
4. I'll help you analyze it using the current study mode`;
        }

        // Decide whether to upload to Appwrite Storage.
        // Files over 10MB cannot be uploaded (Appwrite bucket limit).
        // In that case we still create a resource record with the extracted text
        // so the PDF appears in the library — it just won't have a streaming URL.
        const STORAGE_LIMIT = 10 * 1024 * 1024; // 10 MB
        const isViewableResource = fileType === 'application/pdf' || 
                                   fileType.startsWith('image/') || 
                                   fileType === 'text/html';
        const canUpload = file.size <= STORAGE_LIMIT;
        const shouldStore = isViewableResource && userId && sessionId;
        
        if (shouldStore) {
          if (canUpload) {
            try {
              const uploadResult = await uploadFile(file);
              storageFileId = uploadResult.$id;
            } catch (storageError) {
              console.error('Storage upload failed, continuing without storage:', storageError);
            }
          }

          try {
            await createFileAttachment(
              userId,
              sessionId,
              file.name,
              fileType,
              file.size,
              storageFileId,
              extractedContent.substring(0, 50000)
            );

            const resource = await createPDFResource(
              userId,
              sessionId,
              file.name,
              file.size,
              storageFileId,
              extractedContent.substring(0, 1000000),
              null,
              fileType
            );
          } catch (resourceError) {
            console.error('Failed to create resource:', resourceError.message);
          }
        } else if (userId && sessionId) {
          // Non-viewable file types — just save metadata
          try {
            await createFileAttachment(
              userId,
              sessionId,
              file.name,
              fileType,
              file.size,
              null,
              extractedContent.substring(0, 50000)
            );
          } catch (dbError) {
            console.error('Database save failed, continuing:', dbError);
          }
        }

        content = extractedContent;
      } else {
        // For smaller files, process directly
        if (fileType.startsWith('text/') || fileType === 'application/json') {
          // Text-based files - process with Gemini for better analysis
          const textContent = await file.text();
          try {
            const geminiAnalysis = await processDocument(textContent, "Extract key concepts and create study notes from this text content");
            content = `[Text file processed: ${file.name}]

File content analysis:
${geminiAnalysis}

Original text content:
${textContent.substring(0, 2000)}${textContent.length > 2000 ? '...' : ''}`;
          } catch (geminiError) {
            console.error('Gemini processing failed, using raw text:', geminiError);
            content = `[Text file uploaded: ${file.name}]

${textContent}`;
          }
        } else if (fileType.startsWith('image/')) {
          // Images - use Gemini for analysis
          try {
            const base64 = await fileToBase64(file);
            const geminiAnalysis = await processImage(base64, "Analyze this image and explain the concepts shown. Extract any text, diagrams, or educational content that would be useful for studying.");
            content = `[Image analyzed: ${file.name}]

Image analysis:
${geminiAnalysis}

The image has been processed and the content above contains all the educational information extracted from it.`;
          } catch (geminiError) {
            console.error('Gemini image processing failed:', geminiError);
            content = `[Image uploaded: ${file.name}]

Image processing is temporarily unavailable. Please describe what you see in the image and I'll help you study it.`;
          }
        } else if (fileType === 'application/pdf') {
          // PDFs - extract text and process with Gemini
          try {
            if (!isPDFProcessable(file)) {
              throw new Error('PDF is too large or not processable');
            }
            
            const arrayBuffer = await file.arrayBuffer();
            const pdfText = await extractText(arrayBuffer, {
              processImage,
              onProgress: ({ pageNum }) => {
                setProgressText(`Processing page ${pageNum} of ${file.name}…`);
              }
            });
            setProgressText('');
            
            if (!pdfText || pdfText.length < 50) {
              throw new Error('No readable text found in PDF');
            }
            
            try {
              const geminiAnalysis = await processDocument(pdfText, "Analyze this PDF content and extract key concepts, main ideas, and important information for studying. Create a structured summary.");
              
              content = `[PDF processed: ${file.name}]

Document Analysis:
${geminiAnalysis}

Original Text Content:
${pdfText}

The PDF has been successfully processed and analyzed. I can now help you study this content using the current learning mode.`;
            } catch (geminiError) {
              console.error('Gemini processing failed, using extracted text:', geminiError);
              // Fallback: provide the extracted text without Gemini analysis
              content = `[PDF processed: ${file.name}]

Document Content:
${pdfText}

The PDF text has been successfully extracted. I can now help you study this content using the current learning mode.

Note: Advanced AI analysis is temporarily unavailable due to network connectivity, but I can still help you learn from the extracted content.`;
            }
          } catch (pdfError) {
            setProgressText('');
            console.error('PDF processing failed:', pdfError);
            content = `[PDF file: ${file.name}]

PDF text extraction failed: ${pdfError.message}

Please copy and paste the text content you'd like me to help you study.`;
          }
        } else {
          content = `[File uploaded: ${file.name} (${fileType})]

This file type is supported. Please describe the content you'd like me to help you study, and I'll assist you using the current learning mode.`;
        }

        // Save to database with content for smaller files (non-PDF)
        if (userId && sessionId) {
          try {
            await createFileAttachment(
              userId,
              sessionId,
              file.name,
              fileType,
              file.size,
              null, // No storage file ID
              content.substring(0, 50000) // Limit content size for database
            );
          } catch (dbError) {
            console.error('Database save failed, continuing:', dbError);
          }
        }

        // content is already set above in the small files branch
      }

      await onFileProcess({
        name: file.name,
        type: fileType,
        size: file.size,
        content: content,
        storageFileId: storageFileId,
        fileUrl: storageFileId ? `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID}/files/${storageFileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}` : null
      });

    } catch (error) {
      console.error('File processing error:', error);
      await onFileProcess({
        name: file.name,
        type: file.type,
        size: file.size,
        content: `[Error processing file: ${file.name}]\nError: ${error.message}\nPlease try uploading again or describe the content manually.`
      });
    } finally {
      setProcessing(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="file-attachment">
      <div 
        className={`file-drop-zone ${dragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          className="file-input-hidden"
          onChange={handleFileSelect}
          disabled={disabled || processing}
          accept=".pdf,.jpg,.jpeg,.png,.svg,.html,.htm,.txt,.md,.csv,.json,.mp3,.wav,.m4a,.ogg,.flac,.webm,.aac"
        />
        
        <label htmlFor="file-input" className="file-input-label">
          {processing ? (
            <div className="processing-state">
              <div className="spinner"></div>
              <span>{progressText || 'Processing file...'}</span>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>
              <div className="upload-text">
                <span className="primary-text">Attach file or drag & drop</span>
                <span className="secondary-text">PDF, Images (JPG, PNG, SVG), HTML</span>
              </div>
            </div>
          )}
        </label>
      </div>

      <div className="supported-formats">
        <span className="formats-label">Supported:</span>
        {Object.values(supportedTypes).map((type, index) => (
          <span key={index} className="format-tag">{type}</span>
        ))}
      </div>
    </div>
  );
};

export default FileAttachment;