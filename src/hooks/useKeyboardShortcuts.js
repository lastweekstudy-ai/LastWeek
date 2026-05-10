import { useEffect } from 'react';

const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if user is typing in an input/textarea
      const isTyping = ['INPUT', 'TEXTAREA'].includes(event.target.tagName);
      
      for (const shortcut of shortcuts) {
        const { key, ctrl, alt, shift, callback, allowInInput } = shortcut;
        
        // Skip if typing and shortcut doesn't allow input
        if (isTyping && !allowInInput) continue;
        
        // Check if all modifiers match
        const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const altMatch = alt ? event.altKey : !event.altKey;
        const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === key.toLowerCase();
        
        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          callback(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export default useKeyboardShortcuts;
