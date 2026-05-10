import React from 'react';
import '../styles/KeyboardShortcutsModal.css';

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['Ctrl', 'D'], description: 'Go to Dashboard' },
      { keys: ['Ctrl', 'N'], description: 'New Session' },
      { keys: ['Ctrl', 'F'], description: 'Search Sessions' },
      { keys: ['Esc'], description: 'Close Modal/Cancel' },
    ]},
    { category: 'Actions', items: [
      { keys: ['Ctrl', 'Enter'], description: 'Send Message' },
      { keys: ['Ctrl', 'U'], description: 'Upload File' },
      { keys: ['Ctrl', 'K'], description: 'Show Shortcuts' },
      { keys: ['Ctrl', 'Shift', 'T'], description: 'Toggle Theme' },
    ]},
    { category: 'Session Management', items: [
      { keys: ['Ctrl', 'S'], description: 'Save/Update Session' },
      { keys: ['Ctrl', 'E'], description: 'Export Session' },
      { keys: ['Ctrl', 'Shift', 'D'], description: 'Delete Session' },
    ]},
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className="shortcuts-grid">
          {shortcuts.map((category) => (
            <div key={category.category} className="shortcuts-category">
              <h3>{category.category}</h3>
              <div className="shortcuts-list">
                {category.items.map((shortcut, index) => (
                  <div key={index} className="shortcut-item">
                    <div className="shortcut-keys">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          <kbd className="key">{key}</kbd>
                          {i < shortcut.keys.length - 1 && <span className="key-separator">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="shortcut-description">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
