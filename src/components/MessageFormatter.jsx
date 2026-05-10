import React from 'react';

const MessageFormatter = ({ content, mode }) => {
  // Clean up markdown formatting for better readability
  const formatContent = (text) => {
    // Remove excessive markdown formatting and decorative elements
    let formatted = text
      // Remove all dashes and asterisks used for decoration
      .replace(/^---+.*$/gm, '')
      .replace(/^\*\*\*+.*$/gm, '')
      .replace(/---+/g, '')
      .replace(/\*\*\*/g, '')
      // Remove markdown headers and convert to clean text
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      // Fix broken HTML tags like <strong>?<strong>strong>
      .replace(/<(\w+)>[^<]*<(\w+)>([^<]*)<\/\1>/g, '<$1>$3</$1>')
      .replace(/<(\w+)>[^<]*<\1>([^<]*)<\/\1>/g, '<$1>$2</$1>')
      // Convert **bold** to <strong> - more precise regex
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      // Convert *italic* to <em> - more precise regex
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
      // Clean up bullet points - remove markdown bullets
      .replace(/^\s*[-*+]\s+/gm, '')
      // Remove excessive line breaks and spacing
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s*\n/gm, '')
      // Clean up numbered lists
      .replace(/^\s*(\d+)\.\s+/gm, '$1. ')
      // Remove any remaining broken HTML tags patterns
      .replace(/<(\w+)>\?<\1>\1>/g, '<$1>')
      .replace(/<(\w+)>[^<]*<(\w+)[^>]*>/g, '<$1>')
      // Clean up any remaining markdown artifacts
      .replace(/\*+/g, '')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Remove "Ready for..." prompts and similar chatbot language
      .replace(/^Ready for .+\?.*$/gm, '')
      .replace(/^Want .+\?.*$/gm, '')
      .replace(/^Shall we .+\?.*$/gm, '')
      .replace(/^Let's .+\?.*$/gm, '')
      // Remove TL;DR headers but keep content
      .replace(/^TL;DR:?\s*/gm, '')
      // Clean up extra whitespace
      .trim();

    return formatted;
  };

  // Structure content into sections for better readability
  const structureContent = (text) => {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { type: 'text', content: [] };

    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
          currentSection = { type: 'text', content: [] };
        }
        return;
      }

      // Detect section types
      if (trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
        if (currentSection.type !== 'list') {
          if (currentSection.content.length > 0) {
            sections.push(currentSection);
          }
          currentSection = { type: 'list', content: [] };
        }
        currentSection.content.push(trimmed);
      } else if (trimmed.includes('Summary:') || trimmed.includes('Key Points:')) {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { type: 'summary', content: [trimmed] };
      } else if (trimmed.includes('Example:') || trimmed.includes('In plain English:')) {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { type: 'example', content: [trimmed] };
      } else {
        if (currentSection.type !== 'text') {
          if (currentSection.content.length > 0) {
            sections.push(currentSection);
          }
          currentSection = { type: 'text', content: [] };
        }
        currentSection.content.push(trimmed);
      }
    });

    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  };

  const formatted = formatContent(content);
  const sections = structureContent(formatted);

  return (
    <div className="formatted-message">
      {sections.map((section, index) => {
        switch (section.type) {
          case 'list':
            return (
              <div key={index} className="message-list">
                {section.content.map((item, i) => (
                  <div key={i} className="list-item">
                    {item}
                  </div>
                ))}
              </div>
            );
          
          case 'summary':
            return (
              <div key={index} className="message-summary">
                <div className="summary-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="summary-content">
                  {section.content.map((item, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </div>
              </div>
            );
          
          case 'example':
            return (
              <div key={index} className="message-example">
                <div className="example-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="example-content">
                  {section.content.map((item, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </div>
              </div>
            );
          
          default:
            return (
              <div key={index} className="message-text-section">
                {section.content.map((item, i) => (
                  <div key={i} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </div>
            );
        }
      })}
    </div>
  );
};

export default MessageFormatter;