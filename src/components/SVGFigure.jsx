import React, { useState } from 'react';

/**
 * SVGFigure — renders an SVG figure block produced by the AI.
 * The AI outputs raw SVG markup inside [SVG:title]...[/SVG] tags.
 * This component sanitises and renders it safely.
 */
const SVGFigure = ({ svgContent, title }) => {
  const [error, setError] = useState(null);

  // Basic sanitisation — strip script tags and event handlers
  const sanitise = (raw) => {
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/\bon\w+\s*=/gi, 'data-removed=');
  };

  const clean = sanitise(svgContent || '');

  if (!clean.trim()) return null;

  return (
    <div style={{ margin: '1.5rem 0' }}>
      {title && (
        <p style={{
          marginBottom: '0.5rem',
          fontWeight: 600,
          fontSize: '0.95rem',
          color: 'var(--color-text-primary)',
          fontStyle: 'italic'
        }}>
          {title}
        </p>
      )}
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          overflowX: 'auto',
          textAlign: 'center',
        }}
        dangerouslySetInnerHTML={{ __html: clean }}
        onError={() => setError('SVG render failed')}
      />
      {error && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default SVGFigure;
