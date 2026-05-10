import React from 'react';

const QuickActions = ({ mode, onQuickAction, disabled = false }) => {
  const getQuickActions = () => {
    switch (mode) {
      case 'mental_model':
        return [
          { id: 'analogy', label: 'Different Analogy', icon: 'brain', prompt: 'Can you explain this using a different analogy?' },
          { id: 'simple', label: 'Simplify', icon: 'target', prompt: 'Can you explain this more simply?' },
          { id: 'example', label: 'Real Example', icon: 'lightbulb', prompt: 'Give me a real-world example of this concept' },
          { id: 'connect', label: 'Connect Ideas', icon: 'link', prompt: 'How does this connect to what we discussed earlier?' }
        ];
      
      case 'active_recall':
        return [
          { id: 'quiz', label: 'Quiz Me', icon: 'question', prompt: 'Give me a quiz question about this topic' },
          { id: 'flashcard', label: 'Make Flashcard', icon: 'card', prompt: 'Create a flashcard for this concept' },
          { id: 'scenario', label: 'Scenario Test', icon: 'theater', prompt: 'Give me a scenario where I need to apply this knowledge' },
          { id: 'harder', label: 'Harder Question', icon: 'zap', prompt: 'Give me a more challenging question' }
        ];
      
      case 'focus_breakdown':
        return [
          { id: 'prereq', label: 'Prerequisites', icon: 'clipboard', prompt: 'What do I need to know before learning this?' },
          { id: 'tldr', label: 'Key Points', icon: 'zap', prompt: 'Give me just the core definitions and key points' },
          { id: 'chunk', label: 'Break Down', icon: 'puzzle', prompt: 'Break this into smaller, manageable pieces' },
          { id: 'summary', label: 'Summarize', icon: 'note', prompt: 'Summarize the main points in 3 bullets' }
        ];
      
      case 'collaborative_scholar':
        return [
          { id: 'debate', label: 'Challenge Me', icon: 'sword', prompt: 'Take an opposing view and debate this with me' },
          { id: 'historical', label: 'Historical View', icon: 'book', prompt: 'How would historical figures view this topic?' },
          { id: 'review', label: 'Review My Work', icon: 'edit', prompt: 'Please review and critique my understanding' },
          { id: 'perspective', label: 'Different Perspective', icon: 'eye', prompt: 'Show me this from a completely different angle' }
        ];
      
      case 'creative_synthesis':
        return [
          { id: 'mindmap', label: 'Mind Map', icon: 'map', prompt: 'Create a mind map of these concepts' },
          { id: 'story', label: 'Tell Story', icon: 'book', prompt: 'Turn this into an engaging story' },
          { id: 'project', label: 'Project Ideas', icon: 'tool', prompt: 'Suggest projects I can build to practice this' },
          { id: 'visual', label: 'Visualize', icon: 'palette', prompt: 'Help me visualize this concept creatively' }
        ];
      
      default:
        return [
          { id: 'explain', label: 'Explain', icon: 'lightbulb', prompt: 'Explain this concept clearly' },
          { id: 'example', label: 'Example', icon: 'star', prompt: 'Give me an example' },
          { id: 'practice', label: 'Practice', icon: 'target', prompt: 'How can I practice this?' },
          { id: 'next', label: 'What Next', icon: 'arrow', prompt: 'What should I learn next?' }
        ];
    }
  };

  const actions = getQuickActions();

  return (
    <div className="quick-actions">
      <div className="quick-actions-header">
        <span className="quick-actions-title">Quick Actions</span>
      </div>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className="quick-action-btn"
            onClick={() => onQuickAction(action.prompt)}
            disabled={disabled}
            title={action.prompt}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;