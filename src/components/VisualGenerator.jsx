import React, { useState } from 'react';
import { useVisualGeneration } from '../hooks/useVisualGeneration';
import '../styles/VisualGenerator.css';

const VisualGenerator = ({ onVisualGenerated, disabled = false }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [topic, setTopic] = useState('');
  const [selectedType, setSelectedType] = useState('diagram');
  const { generateVisual, loading } = useVisualGeneration();

  const visualTypes = [
    { id: 'diagram', name: 'Diagram', icon: '📊', description: 'Visual diagram with boxes and arrows' },
    { id: 'table', name: 'Table', icon: '📋', description: 'Comparison or data table' },
    { id: 'chart', name: 'Chart', icon: '📈', description: 'Data visualization or graph' },
    { id: 'timeline', name: 'Timeline', icon: '⏱️', description: 'Chronological sequence' },
    { id: 'mindmap', name: 'Mind Map', icon: '🧠', description: 'Concept relationships' },
    { id: 'flowchart', name: 'Flowchart', icon: '🔄', description: 'Process or decision flow' },
    { id: 'comparison', name: 'Comparison', icon: '⚖️', description: 'Side-by-side comparison' },
    { id: 'hierarchy', name: 'Hierarchy', icon: '🌳', description: 'Organizational structure' },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    try {
      const visual = await generateVisual(topic, selectedType);
      
      const formattedMessage = `[Visual Generated: ${visual.type}]

Topic: ${visual.topic}

${visual.content}

---
This visual was generated to help you understand the concept better. Feel free to ask questions about any part of it!`;

      onVisualGenerated(formattedMessage);
      setTopic('');
      setShowPanel(false);
    } catch (error) {
      console.error('Visual generation failed:', error);
      alert('Failed to generate visual: ' + error.message);
    }
  };

  if (!showPanel) {
    return (
      <button
        className="btn btn-secondary visual-trigger"
        onClick={() => setShowPanel(true)}
        disabled={disabled}
        title="Generate visual learning aid"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        Generate Visual
      </button>
    );
  }

  return (
    <div className="visual-generator-panel">
      <div className="panel-header">
        <h3>Generate Visual Learning Aid</h3>
        <button
          className="panel-close"
          onClick={() => setShowPanel(false)}
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="panel-content">
        <div className="form-group">
          <label className="form-label">What would you like to visualize?</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., Photosynthesis process, Python data types, World War II timeline..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Visual Type</label>
          <div className="visual-types-grid">
            {visualTypes.map((type) => (
              <button
                key={type.id}
                className={`visual-type-card ${selectedType === type.id ? 'selected' : ''}`}
                onClick={() => setSelectedType(type.id)}
              >
                <span className="type-icon">{type.icon}</span>
                <span className="type-name">{type.name}</span>
                <span className="type-description">{type.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowPanel(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!topic.trim() || loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Generating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Generate Visual
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualGenerator;
