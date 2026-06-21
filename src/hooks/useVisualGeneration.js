import { useState } from 'react';
import { callGeminiText } from '../services/secureAiProvider';

export const useVisualGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateVisual = async (topic, visualType, context = '') => {
    setLoading(true);
    setError(null);

    try {
      let prompt = '';
      
      switch (visualType) {
        case 'diagram':
          prompt = `Create a detailed ASCII diagram or flowchart to explain: ${topic}

Context: ${context}

Requirements:
- Use ASCII art with boxes, arrows, and clear labels
- Make it educational and easy to understand
- Include key concepts and relationships
- Use symbols like: ┌─┐ │ └─┘ ├─┤ ↓ → ← ↑ ═ ║ ╔ ╗ ╚ ╝
- Add explanatory notes below the diagram

Format the output as a clear, well-structured diagram.`;
          break;

        case 'table':
          prompt = `Create a comprehensive comparison table for: ${topic}

Context: ${context}

Requirements:
- Use markdown table format
- Include relevant columns for comparison
- Add clear headers
- Fill with accurate, educational information
- Include at least 5-7 rows
- Add a summary row if applicable

Make it visually organized and easy to scan.`;
          break;

        case 'chart':
          prompt = `Create a text-based chart or graph to visualize: ${topic}

Context: ${context}

Requirements:
- Use ASCII art or text-based visualization
- Show data relationships clearly
- Include axis labels and legends
- Use symbols like: █ ▓ ▒ ░ ■ □ ● ○ ▲ ▼
- Add interpretation notes below

Make it informative and visually clear.`;
          break;

        case 'timeline':
          prompt = `Create a visual timeline for: ${topic}

Context: ${context}

Requirements:
- Use ASCII art with clear time markers
- Show chronological progression
- Include key events and dates
- Use arrows and connectors: ─── ──→ ●
- Add brief descriptions for each point

Make it easy to follow chronologically.`;
          break;

        case 'mindmap':
          prompt = `Create a text-based mind map for: ${topic}

Context: ${context}

Requirements:
- Central concept in the middle
- Branch out to related concepts
- Use indentation and symbols: ├── └── │
- Show hierarchical relationships
- Include 3-4 levels of depth

Make it organized and easy to understand connections.`;
          break;

        case 'flowchart':
          prompt = `Create a detailed flowchart for: ${topic}

Context: ${context}

Requirements:
- Use ASCII boxes and arrows
- Show decision points with diamonds ◇
- Use rectangles for processes ▭
- Include start/end points ●
- Add clear labels and conditions
- Use arrows: → ↓ ← ↑

Make the flow logical and easy to follow.`;
          break;

        case 'comparison':
          prompt = `Create a side-by-side comparison for: ${topic}

Context: ${context}

Requirements:
- Use two-column format
- List similarities and differences
- Use symbols: ✓ ✗ ≈ ≠ = ≡
- Include pros and cons
- Add visual separators

Make it balanced and informative.`;
          break;

        case 'hierarchy':
          prompt = `Create an organizational hierarchy diagram for: ${topic}

Context: ${context}

Requirements:
- Show top-down structure
- Use tree-like ASCII art
- Clear parent-child relationships
- Use symbols: ├── └── │ ─
- Include all levels

Make the hierarchy clear and logical.`;
          break;

        default:
          prompt = `Create a visual representation to explain: ${topic}

Context: ${context}

Choose the most appropriate format (diagram, table, chart, etc.) and create a clear, educational visualization using ASCII art or markdown formatting.`;
      }

      const content = await callGeminiText(prompt);
      
      if (!content) {
        throw new Error('No content received from Gemini API');
      }

      return {
        type: visualType,
        content: content,
        topic: topic
      };
    } catch (err) {
      setError(err.message);
      
      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        throw new Error('Visual generation timed out - please try again');
      } else if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_CLOSED')) {
        throw new Error('Network connection error - please check your internet connection');
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    generateVisual,
    loading,
    error
  };
};

export default useVisualGeneration;
