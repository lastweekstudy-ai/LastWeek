import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ChartRenderer from './ChartRenderer';
import MermaidDiagram from './MermaidDiagram';
import SVGFigure from './SVGFigure';

import 'katex/dist/katex.min.css';

const CHART_REGEX = /\[CHART:(bar|line|pie|area):([^\]]+)\]([\s\S]*?)\[\\?\/CHART\]/gi;
const MERMAID_REGEX = /```mermaid\n([\s\S]*?)```/gi;
// Matches [FIGURE:optional title]<svg...>...</svg>[/FIGURE]
const FIGURE_REGEX = /\[FIGURE(?::([^\]]*))?\]([\s\S]*?)\[\/FIGURE\]/gi;

const EnhancedMessageFormatter = ({ content }) => {

  // ── Step 1: split content into chart/mermaid/figure blocks and text segments
  const segments = [];
  let lastIndex = 0;

  const combinedRegex = new RegExp(
    `(?:${CHART_REGEX.source})|(?:${MERMAID_REGEX.source})|(?:${FIGURE_REGEX.source})`,
    'gi'
  );
  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    const fullMatch = match[0];

    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: content.slice(lastIndex, match.index) });
    }

    const isChart = match[1] && ['bar', 'line', 'pie', 'area'].includes(match[1]);
    const isMermaid = !isChart && match[4] !== undefined && match[5] === undefined;
    const isFigure = match[5] !== undefined || (!isChart && !isMermaid && fullMatch.startsWith('[FIGURE'));

    if (isChart) {
      const [, type, title, dataStr] = match;
      let data = null;
      try { data = JSON.parse(dataStr.trim()); } catch (e) {}
      segments.push({ kind: 'chart', type, title, data });
    } else if (isFigure) {
      // groups: [5]=optional title, [6]=svg content  (or [4],[5] depending on order)
      // Find the SVG content — it's the last non-undefined group
      const figTitle = match[5] || '';
      const svgContent = match[6] || '';
      segments.push({ kind: 'figure', title: figTitle.trim(), svgContent });
    } else {
      // Mermaid — group [4] is the diagram body
      segments.push({ kind: 'mermaid', chart: match[4] });
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Remaining text after last chart (or all text if no charts)
  if (lastIndex < content.length) {
    segments.push({ kind: 'text', value: content.slice(lastIndex) });
  }

  // ── Step 2: normalise math delimiters in text segments ────────────────────
  const normaliseMath = (text) => {
    let t = text;
    // \[ ... \]  →  $$ ... $$
    t = t.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `$$${inner}$$`);
    // \( ... \)  →  $ ... $
    t = t.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner}$`);
    // ```math ... ```  →  $$ ... $$
    t = t.replace(/```math\s*([\s\S]*?)```/g, (_, inner) => `$$${inner.trim()}$$`);
    return t;
  };

  // ── Shared markdown component overrides ───────────────────────────────────
  const markdownComponents = {
    table: ({ node, ...props }) => (
      <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '8px',
          overflow: 'hidden'
        }} {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th style={{
        padding: '0.75rem',
        textAlign: 'left',
        borderBottom: '2px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-tertiary)',
        fontWeight: 600,
        color: 'var(--color-text-primary)'
      }} {...props} />
    ),
    td: ({ node, ...props }) => (
      <td style={{
        padding: '0.75rem',
        borderBottom: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)'
      }} {...props} />
    ),
    code: ({ node, inline, className, children, ...props }) => {
      return inline ? (
        <code style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          padding: '0.2rem 0.4rem',
          borderRadius: '4px',
          fontSize: '0.9em',
          color: 'var(--color-accent)'
        }} {...props}>{children}</code>
      ) : (
        <code style={{
          display: 'block',
          backgroundColor: 'var(--color-bg-tertiary)',
          padding: '1rem',
          borderRadius: '8px',
          overflowX: 'auto',
          fontSize: '0.9em',
          lineHeight: 1.5
        }} {...props}>{children}</code>
      );
    },
    pre: ({ node, ...props }) => (
      <pre style={{
        backgroundColor: 'var(--color-bg-tertiary)',
        padding: '1rem',
        borderRadius: '8px',
        overflowX: 'auto',
        margin: '1rem 0'
      }} {...props} />
    )
  };

  // ── Step 3: render segments in order ──────────────────────────────────────
  return (
    <div className="enhanced-message">
      {segments.map((seg, i) => {
        if (seg.kind === 'chart') {
          if (!seg.data || seg.data.length === 0) return null;
          return (
            <ChartRenderer
              key={`chart-${i}`}
              type={seg.type}
              title={seg.title}
              data={seg.data}
            />
          );
        }

        if (seg.kind === 'mermaid') {
          return (
            <MermaidDiagram
              key={`mermaid-${i}`}
              chart={seg.chart}
            />
          );
        }

        if (seg.kind === 'figure') {
          return (
            <SVGFigure
              key={`figure-${i}`}
              svgContent={seg.svgContent}
              title={seg.title}
            />
          );
        }

        // Text segment — run through ReactMarkdown with math support
        const normalised = normaliseMath(seg.value);
        if (!normalised.trim()) return null;

        return (
          <ReactMarkdown
            key={`text-${i}`}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {normalised}
          </ReactMarkdown>
        );
      })}
    </div>
  );
};

export default EnhancedMessageFormatter;
