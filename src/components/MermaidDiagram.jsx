import React, { useEffect, useRef, useState } from 'react';

/**
 * MermaidDiagram — renders a Mermaid diagram string as an SVG.
 * Lazy-loads mermaid to keep the initial bundle small.
 */
const MermaidDiagram = ({ chart, title }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!chart || !containerRef.current) return;

    let cancelled = false;

    const render = async () => {
      try {
        console.log('[MermaidDiagram] Starting render, chart:', chart.substring(0, 100));
        
        // Lazy-load mermaid so it doesn't bloat the initial bundle
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
          themeVariables: {
            primaryColor: 'var(--color-accent)',
            primaryTextColor: 'var(--color-text-primary, #1f2937)',
            primaryBorderColor: '#7e22ce',
            lineColor: 'var(--color-accent-hover)',
            secondaryColor: 'var(--color-bg-secondary, #f9fafb)',
            tertiaryColor: 'var(--color-bg-tertiary, #f3f4f6)',
            background: 'var(--color-bg-primary, #ffffff)',
            mainBkg: 'var(--color-bg-secondary, #f9fafb)',
            nodeBorder: '#7e22ce',
            clusterBkg: 'var(--color-bg-tertiary, #f3f4f6)',
            titleColor: 'var(--color-text-primary, #1f2937)',
            edgeLabelBackground: 'var(--color-bg-secondary, #f9fafb)',
            fontFamily: 'inherit',
          },
          flowchart: { curve: 'basis', htmlLabels: true },
          securityLevel: 'loose',
        });

        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        console.log('[MermaidDiagram] Rendering with ID:', id);
        
        const { svg } = await mermaid.render(id, chart.trim());
        
        console.log('[MermaidDiagram] Render successful, SVG length:', svg.length);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Make SVG responsive
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            console.log('[MermaidDiagram] SVG element found, original dimensions:', {
              width: svgEl.getAttribute('width'),
              height: svgEl.getAttribute('height'),
              viewBox: svgEl.getAttribute('viewBox')
            });
            
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
            svgEl.style.display = 'block';
            svgEl.style.margin = '0 auto';
            
            // Keep viewBox but remove fixed width
            svgEl.removeAttribute('width');
            
            console.log('[MermaidDiagram] SVG styled and ready');
          } else {
            console.warn('[MermaidDiagram] No SVG element found in rendered output');
          }
          setRendered(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[MermaidDiagram] Render error:', err);
          setError('Could not render diagram. The diagram syntax may be invalid.');
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div style={{
        margin: '1rem 0',
        padding: '1rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
        fontSize: '0.875rem'
      }}>
        <strong>Diagram:</strong> {error}
        <pre style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          overflowX: 'auto',
          color: 'var(--color-text-secondary)'
        }}>{chart}</pre>
      </div>
    );
  }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      {title && (
        <p style={{
          marginBottom: '0.5rem',
          fontWeight: 600,
          fontSize: '0.95rem',
          color: 'var(--color-text-primary)'
        }}>
          {title}
        </p>
      )}
      <div
        ref={containerRef}
        style={{
          padding: '1rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          overflowX: 'auto',
          textAlign: 'center',
          minHeight: rendered ? undefined : '80px',
        }}
      >
        {!rendered && !error && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Rendering diagram…
          </span>
        )}
      </div>
    </div>
  );
};

export default MermaidDiagram;
