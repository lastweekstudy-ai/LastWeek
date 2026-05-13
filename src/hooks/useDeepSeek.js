import { useState } from 'react';
import { smartChat, smartChatStream } from '../services/aiProvider';

/**
 * useDeepSeek — Chat hook with Groq + DeepSeek failover
 *
 * Internally uses smartChat / smartChatStream which tries:
 *   Groq Llama 3.3 70B → Groq Qwen 32B → DeepSeek → Groq Llama 3.1 8B
 */
const useDeepSeek = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const ask = async (systemPrompt, messagesHistory) => {
    setIsLoading(true);
    setError(null);

    try {
      return await smartChat(systemPrompt, messagesHistory);
    } catch (err) {
      let errorMessage = 'Failed to connect to AI. Please try again.';

      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION')) {
        errorMessage = 'Network connection error. Please check your internet connection.';
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

  const askStream = async (systemPrompt, messagesHistory, onChunk) => {
    try {
      return await smartChatStream(systemPrompt, messagesHistory, onChunk);
    } catch (err) {
      throw err;
    }
  };

  return { ask, askStream, isLoading, error };
};

export default useDeepSeek;
