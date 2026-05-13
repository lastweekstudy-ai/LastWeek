import { useState } from 'react';
import { callGeminiVision, callGeminiText, smartAnalyzeDocument, smartAnalyzeImage } from '../services/aiProvider';

/**
 * useGemini — Vision and document analysis hook
 *
 * processImage: Groq Vision (fast, free) → Gemini Vision fallback
 * processDocument: Gemini 2.0 Flash → DeepSeek → Groq (truncated)
 */
export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Analyze an image — uses Groq Vision first (fast), Gemini as fallback
   */
  const processImage = async (imageBase64, prompt = 'Analyze this image and extract key information for studying') => {
    setLoading(true);
    setError(null);

    try {
      const mimeMatch = imageBase64.match(/^data:(image\/[a-z]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      return await smartAnalyzeImage(imageBase64, prompt, mimeType);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Analyze a document — Gemini (2M context) → DeepSeek → Groq fallback
   * NOTE: For PDFs, Gemini is always used first since Groq cannot process PDFs natively.
   */
  const processDocument = async (documentText, prompt = 'Summarize and extract key concepts from this document for studying') => {
    setLoading(true);
    setError(null);

    try {
      return await smartAnalyzeDocument(documentText, prompt);
    } catch (err) {
      setError(err.message);
      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        throw new Error('Network timeout - please check your internet connection and try again');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { processImage, processDocument, loading, error };
};

export default useGemini;
