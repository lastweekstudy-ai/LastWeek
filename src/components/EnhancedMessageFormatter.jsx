import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ChartRenderer from './ChartRenderer';
import MermaidDiagram from './MermaidDiagram';
import SVGFigure from './SVGFigure';
import InlineFlashcard from './InlineFlashcard';
import InlineQuiz from './InlineQuiz';
import { fixChartFormat, processAIResponse } from '../utils/chartFixer';

import 'katex/dist/katex.min.css';

const CHART_REGEX = /\[CHART:(bar|line|pie|area):([^\]]+)\]([\s\S]*?)\[\\?\/CHART\]/gi;
const MERMAID_REGEX = /```mermaid\n([\s\S]*?)```/gi;
const FIGURE_REGEX = /\[FIGURE(?::([^\]]*))?\]([\s\S]*?)\[\/FIGURE\]/gi;

// Matches a single flashcard block (front + back)
// The lookahead allows: "---\n**How confident" OR end of string OR end of block
const FLASHCARD_REGEX = /\*\*FRONT OF CARD\*\*\s*([\s\S]*?)\s*---\s*\*\*BACK OF CARD\*\*\s*([\s\S]*?)(?=\s*---\s*\*\*How confident|\s*$)/i;

// Matches a full flashcard set — one or more cards separated by "==="
const FLASHCARD_SET_REGEX = /\*\*FRONT OF CARD\*\*([\s\S]*?)(?=\n===\n|\n={3,}\n|$)/gi;

/**
 * Extract ALL flashcards from a message.
 * Returns null if no flashcards found.
 * Returns { cards: [{front, back}], prefix, suffix } if found.
 */
const extractFlashcards = (text) => {
  const frontCount = (text.match(/\*\*FRONT OF CARD\*\*/gi) || []).length;
  if (frontCount === 0) return null;

  let cardBlocks = text.split(/\n={3,}\n/);

  if (frontCount > cardBlocks.length) {
    cardBlocks = text.split(/(?=\*\*FRONT OF CARD\*\*)/i).filter(b => b.trim());
  }

  const cards = [];
  let firstMatchIndex = null;
  let lastMatchEnd = 0;

  for (let i = 0; i < cardBlocks.length; i++) {
    const block = cardBlocks[i];
    const match = block.match(FLASHCARD_REGEX);
    if (match) {
      if (firstMatchIndex === null) {
        firstMatchIndex = text.indexOf(block);
      }
      cards.push({ front: match[1].trim(), back: match[2].trim() });
      lastMatchEnd = text.indexOf(block) + block.length;
    }
  }

  if (cards.length === 0) return null;

  return {
    cards,
    prefix: text.slice(0, firstMatchIndex).trim(),
    suffix: text.slice(lastMatchEnd).replace(/\n={3,}\n?/g, '').trim(),
  };
};

// Keep single-card extractor for backward compat
const extractFlashcard = (text) => {
  const result = extractFlashcards(text);
  if (!result) return null;
  return {
    front: result.cards[0].front,
    back: result.cards[0].back,
    prefix: result.prefix,
    allCards: result.cards,
  };
};

// MCQ block: [MCQ] ... [/MCQ]
const MCQ_BLOCK_REGEX = /\[MCQ\]([\s\S]*?)\[\/MCQ\]/gi;

/**
 * Parse a single [MCQ]...[/MCQ] block into a structured question object.
 * Expected format inside the block:
 *   Q: <question text>
 *   A) <option text>
 *   B) <option text>
 *   C) <option text>
 *   D) <option text>
 *   CORRECT: B
 *   EXPLANATION: <optional explanation>
 */
const parseMCQBlock = (blockContent) => {
  const lines = blockContent.trim().split('\n').map(l => l.trim()).filter(Boolean);
  let questionLines = [];
  const options = [];
  let correct = null;
  let explanationLines = [];
  let inExplanation = false;

  for (const line of lines) {
    if (/^Q:\s*/i.test(line)) {
      questionLines.push(line.replace(/^Q:\s*/i, ''));
      inExplanation = false;
    } else if (/^([A-E])\)\s*/i.test(line)) {
      const m = line.match(/^([A-E])\)\s*([\s\S]*)/i);
      if (m) options.push({ label: m[1].toUpperCase(), text: m[2].trim(), isCorrect: false });
      inExplanation = false;
    } else if (/^CORRECT:\s*/i.test(line)) {
      correct = line.replace(/^CORRECT:\s*/i, '').trim().toUpperCase();
      inExplanation = false;
    } else if (/^EXPLANATION:\s*/i.test(line)) {
      explanationLines.push(line.replace(/^EXPLANATION:\s*/i, ''));
      inExplanation = true;
    } else if (inExplanation) {
      explanationLines.push(line);
    } else {
      // continuation of question
      questionLines.push(line);
    }
  }

  if (correct) {
    options.forEach(o => { o.isCorrect = o.label === correct; });
  }

  return {
    questionText: questionLines.join('\n').trim(),
    options,
    explanation: explanationLines.join('\n').trim(),
    hasCorrect: !!correct,
  };
};

/**
 * Extract all MCQ blocks from a message.
 * Returns { prefix, questions: [...], suffix } or null if no MCQ blocks found.
 */
const extractMCQs = (text) => {
  const blocks = [];
  let lastIndex = 0;
  let prefixText = '';
  let suffixText = '';
  const regex = /\[MCQ\]([\s\S]*?)\[\/MCQ\]/gi;
  let match;
  let firstMatchIndex = null;

  while ((match = regex.exec(text)) !== null) {
    if (firstMatchIndex === null) {
      firstMatchIndex = match.index;
      prefixText = text.slice(0, match.index).trim();
    }
    const parsed = parseMCQBlock(match[1]);
    if (parsed.options.length >= 2) {
      blocks.push(parsed);
    }
    lastIndex = match.index + match[0].length;
  }

  if (blocks.length === 0) return null;

  suffixText = text.slice(lastIndex).trim();
  return { prefix: prefixText, questions: blocks, suffix: suffixText };
};

/**
 * MCQRenderer — stateful wrapper that tracks score across all questions in a set.
 */
const MCQRenderer = ({ messageId, prefix, questions, suffix, onMCQAnswer }) => {
  // Initialise answers from localStorage so restored answers count toward score
  const getInitialAnswers = () => {
    const init = {};
    questions.forEach((_, i) => {
      const key = messageId ? `mcq_answer_${messageId}_q${i + 1}` : null;
      if (!key) return;
      try {
        const saved = localStorage.getItem(key);
        if (saved) init[i] = JSON.parse(saved);
      } catch { /* ignore */ }
    });
    return init;
  };

  const [answers, setAnswers] = useState(getInitialAnswers);

  const handleAnswer = (index, answer) => {
    // Skip if this is a restored answer being re-fired on mount
    if (answer.restored) {
      setAnswers(prev => prev[index] ? prev : { ...prev, [index]: answer });
      return;
    }
    setAnswers(prev => ({ ...prev, [index]: answer }));
    onMCQAnswer?.(answer.isCorrect, questions[index]?.questionText);
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount  = Object.values(answers).filter(a => a.isCorrect).length;
  const allAnswered   = answeredCount === questions.length;

  const markdownComponents = {
    table: ({ node, ...props }) => (
      <div style={{ overflowX: 'auto', margin: '0.5rem 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} {...props} />
      </div>
    ),
  };

  return (
    <div className="enhanced-message">
      {prefix && (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
          {prefix}
        </ReactMarkdown>
      )}

      {questions.map((q, i) => (
        <InlineQuiz
          key={i}
          messageId={messageId}
          questionNumber={i + 1}
          totalQuestions={questions.length}
          questionText={q.questionText}
          options={q.options}
          explanation={q.explanation}
          onAnswer={(ans) => handleAnswer(i, ans)}
          isLast={i === questions.length - 1 && allAnswered}
          sessionScore={allAnswered ? { correct: correctCount, total: questions.length } : null}
        />
      ))}

      {suffix && (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
          {suffix}
        </ReactMarkdown>
      )}
    </div>
  );
};

/**
 * FlashcardSetRenderer — shows multiple flashcards one at a time with progress.
 * User rates each card, then it advances to the next automatically.
 */
const FlashcardSetRenderer = ({ cards, prefix, suffix, onFlashcardRate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState({}); // index → score
  const allDone = Object.keys(ratings).length === cards.length;

  const handleRate = (score, front, back) => {
    setRatings(prev => ({ ...prev, [currentIndex]: score }));
    onFlashcardRate?.(score, front, back);
    // Auto-advance to next card after a short delay
    if (currentIndex < cards.length - 1) {
      setTimeout(() => setCurrentIndex(i => i + 1), 400);
    }
  };

  const markdownComponents = {
    table: ({ node, ...props }) => (
      <div style={{ overflowX: 'auto', margin: '0.5rem 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} {...props} />
      </div>
    ),
  };

  return (
    <div className="enhanced-message">
      {prefix && (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
          {prefix}
        </ReactMarkdown>
      )}

      {/* Progress indicator — only show when there are multiple cards */}
      {cards.length > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)',
        }}>
          <span>Card {Math.min(currentIndex + 1, cards.length)} of {cards.length}</span>
          <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px' }}>
            <div style={{
              height: '100%', borderRadius: '2px', backgroundColor: 'var(--color-accent)',
              width: `${((allDone ? cards.length : currentIndex) / cards.length) * 100}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
          {allDone && <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Done</span>}
        </div>
      )}

      {!allDone ? (
        <InlineFlashcard
          key={currentIndex}
          front={cards[currentIndex].front}
          back={cards[currentIndex].back}
          onRate={(score, front, back) => handleRate(score, front, back)}
        />
      ) : (
        <div style={{
          padding: '1rem', borderRadius: '8px', textAlign: 'center',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🎉</span>
          <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>
            All {cards.length} flashcard{cards.length !== 1 ? 's' : ''} done!
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Cards saved to your library.
          </p>
        </div>
      )}

      {suffix && (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
          {suffix}
        </ReactMarkdown>
      )}
    </div>
  );
};

const EnhancedMessageFormatter = ({ content, messageId, onFlashcardRate, onMCQAnswer }) => {

  // ── Pre-process content to fix malformed charts ───────────────────────────
  const processedContent = processAIResponse(content);

  // ── Detect both flashcards AND MCQs ───────────────────────────────────────
  const flashcardData = extractFlashcards(processedContent);
  const mcqData       = extractMCQs(processedContent);

  const hasFlashcards = flashcardData && flashcardData.cards.length > 0;
  const hasMCQs       = mcqData && mcqData.questions.length > 0;

  // ── Mixed response: both flashcards AND MCQs in one message ───────────────
  // Render MCQs first (they appear before flashcards in the raw text),
  // then flashcards. Both are fully interactive.
  if (hasFlashcards && hasMCQs) {
    return (
      <div className="enhanced-message">
        {/* Any text before the first MCQ block */}
        {mcqData.prefix && (
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {mcqData.prefix}
          </ReactMarkdown>
        )}

        {/* All MCQ questions — interactive */}
        <MCQRenderer
          messageId={messageId}
          prefix=""
          questions={mcqData.questions}
          suffix=""
          onMCQAnswer={onMCQAnswer}
        />

        {/* All flashcards — interactive */}
        <FlashcardSetRenderer
          cards={flashcardData.cards}
          prefix={flashcardData.prefix}
          suffix={flashcardData.suffix}
          onFlashcardRate={onFlashcardRate}
        />
      </div>
    );
  }

  // ── Flashcards only ────────────────────────────────────────────────────────
  if (hasFlashcards) {
    return (
      <FlashcardSetRenderer
        cards={flashcardData.cards}
        prefix={flashcardData.prefix}
        suffix={flashcardData.suffix}
        onFlashcardRate={onFlashcardRate}
      />
    );
  }

  // ── MCQs only ─────────────────────────────────────────────────────────────
  if (hasMCQs) {
    return (
      <MCQRenderer
        messageId={messageId}
        prefix={mcqData.prefix}
        questions={mcqData.questions}
        suffix={mcqData.suffix}
        onMCQAnswer={onMCQAnswer}
      />
    );
  }

  // ── Step 1: split content into chart/mermaid/figure blocks and text segments
  const segments = [];
  let lastIndex = 0;

  const combinedRegex = new RegExp(
    `(?:${CHART_REGEX.source})|(?:${MERMAID_REGEX.source})|(?:${FIGURE_REGEX.source})`,
    'gi'
  );
  let match;

  while ((match = combinedRegex.exec(processedContent)) !== null) {
    const fullMatch = match[0];

    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: processedContent.slice(lastIndex, match.index) });
    }

    const isChart = match[1] && ['bar', 'line', 'pie', 'area'].includes(match[1]);
    const isMermaid = !isChart && match[4] !== undefined && match[5] === undefined;
    const isFigure = match[5] !== undefined || (!isChart && !isMermaid && fullMatch.startsWith('[FIGURE'));

    if (isChart) {
      const [, type, title, dataStr] = match;
      let data = null;
      try { data = JSON.parse(dataStr.trim()); } catch { /* malformed chart data */ }
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
  if (lastIndex < processedContent.length) {
    segments.push({ kind: 'text', value: processedContent.slice(lastIndex) });
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
