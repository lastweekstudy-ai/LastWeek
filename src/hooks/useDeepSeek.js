import { useState } from 'react';

const useDeepSeek = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = async (systemPrompt, messagesHistory, retryCount = 0) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messagesHistory
          ],
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from AI');
      }
      
      return data.choices[0].message.content;
    } catch (err) {
      clearTimeout(timeoutId);
      
      // Retry logic for network errors
      const isNetworkError = err.message.includes('Failed to fetch') || 
                            err.message.includes('ERR_CONNECTION') ||
                            err.name === 'AbortError';
      
      if (isNetworkError && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return makeRequest(systemPrompt, messagesHistory, retryCount + 1);
      }
      
      throw err;
    }
  };

  const ask = async (systemPrompt, messagesHistory) => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await makeRequest(systemPrompt, messagesHistory);
    } catch (err) {
      let errorMessage = 'Failed to connect to AI. Please try again.';
      
      // Provide specific error messages for common issues
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. The AI is taking too long to respond. Please try again.';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
      } else if (err.message.includes('401')) {
        errorMessage = 'API authentication failed. Please check your API key configuration.';
      } else if (err.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (err.message.includes('500') || err.message.includes('502') || err.message.includes('503')) {
        errorMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const askStream = async (systemPrompt, messagesHistory, onChunk, retryCount = 0) => {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messagesHistory
          ],
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assembled = '';
      let lineBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split('\n');
        // Keep the last (potentially incomplete) line in the buffer
        lineBuffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const payload = line.slice('data: '.length).trim();

          if (payload === '[DONE]') {
            return assembled;
          }

          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              assembled += delta;
              onChunk(delta);
            }
          } catch {
            console.warn('[askStream] Failed to parse SSE chunk, skipping:', payload);
          }
        }
      }

      // Handle any remaining data in the buffer after the stream ends
      if (lineBuffer.startsWith('data: ')) {
        const payload = lineBuffer.slice('data: '.length).trim();
        if (payload === '[DONE]') {
          return assembled;
        }
        if (payload) {
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              assembled += delta;
              onChunk(delta);
            }
          } catch {
            console.warn('[askStream] Failed to parse final SSE chunk, skipping:', payload);
          }
        }
      }

      return assembled;
    } catch (err) {
      const isNetworkError =
        err.message.includes('Failed to fetch') ||
        err.message.includes('ERR_CONNECTION') ||
        err.name === 'AbortError';

      if (isNetworkError && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return askStream(systemPrompt, messagesHistory, onChunk, retryCount + 1);
      }

      throw err;
    }
  };

  return { ask, askStream, isLoading, error };
};

export default useDeepSeek;