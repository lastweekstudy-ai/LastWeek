import { useState } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processImage = async (imageBase64, prompt = "Analyze this image and extract key information for studying") => {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    setLoading(true);
    setError(null);

    try {
      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: "image/jpeg", // Gemini accepts various image formats
                  data: base64Data
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to process image with Gemini');
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content received from Gemini API');
      }

      return content;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (documentText, prompt = "Summarize and extract key concepts from this document for studying") => {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${prompt}\n\nDocument content:\n${documentText}`
            }]
          }]
        }),
        // Add timeout and better error handling
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to process document with Gemini`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content received from Gemini API');
      }

      return content;
    } catch (err) {
      setError(err.message);
      
      // Provide more specific error messages for common network issues
      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        throw new Error('Network timeout - please check your internet connection and try again');
      } else if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_CLOSED')) {
        throw new Error('Network connection error - please check your internet connection and try again');
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const extractTextFromPDF = async (pdfBase64) => {
    // Note: Gemini doesn't directly process PDFs, but we can use it to analyze extracted text
    // For now, we'll return a placeholder that indicates PDF processing needs improvement
    return "PDF text extraction requires additional setup. Please copy and paste the text content for now.";
  };

  return {
    processImage,
    processDocument,
    extractTextFromPDF,
    loading,
    error
  };
};

export default useGemini;