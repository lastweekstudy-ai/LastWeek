import React, { useMemo, useState } from 'react';
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


const CHART_REGEX = /\[CHART:([a-z-]+):([^\]]+)\]([\s\S]*?)\[\\?\/CHART\]/gi;
const MERMAID_REGEX = /```mermaid\n([\s\S]*?)```/gi;
const FIGURE_REGEX = /\[FIGURE(?::([^\]]*))?\]([\s\S]*?)\[\/FIGURE\]/gi;
const ACTION_BUTTON_REGEX = /\[ACTION:([^\]]+)\]/g;

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

  if (blocks.length === 0) return extractLooseMCQs(text);

  suffixText = text.slice(lastIndex).trim();
  return { prefix: prefixText, questions: blocks, suffix: suffixText };
};

const splitCombinedOptions = (line, labels) => {
  const cleaned = line.trim();
  if (!cleaned) return [];

  const explicit = cleaned.match(/(?:^|\s)([A-E])[\).:-]\s*([^A-E]*?)(?=\s+[A-E][\).:-]\s*|$)/gi);
  if (explicit && explicit.length >= 2) {
    return explicit.map(part => part.replace(/^\s*[A-E][\).:-]\s*/i, '').trim()).filter(Boolean);
  }

  const chunks = cleaned
    .replace(/([a-z])([A-Z])/g, '$1|$2')
    .split('|')
    .map(part => part.trim())
    .filter(Boolean);

  if (chunks.length >= labels.length) return chunks.slice(0, labels.length);

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= labels.length) return words.slice(0, labels.length - 1).concat(words.slice(labels.length - 1).join(' '));

  return [cleaned];
};

const parseLooseMCQBlock = (block) => {
  const lines = block
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  let labelIndex = lines.findIndex(line => /^[A-E](?:\s+[A-E]){1,4}$/i.test(line));
  const singleLabelIndexes = lines
    .map((line, index) => (/^[A-E]$/i.test(line) ? index : -1))
    .filter(index => index >= 0);

  if (singleLabelIndexes.length >= 2 && (labelIndex === -1 || singleLabelIndexes[0] < labelIndex)) {
    labelIndex = -1;
  }
  let labels = [];
  let questionLines = [];
  let options = [];

  if (labelIndex >= 0) {
    labels = lines[labelIndex].split(/\s+/).map(label => label.toUpperCase());
    questionLines = lines.slice(0, labelIndex);
    const optionLines = lines.slice(labelIndex + 1);

    if (optionLines.length >= labels.length) {
      options = labels.map((label, index) => ({
        label,
        text: optionLines[index] || label,
        isCorrect: false,
      }));
    } else if (optionLines.length === 1) {
      const split = splitCombinedOptions(optionLines[0], labels);
      options = labels.map((label, index) => ({
        label,
        text: split[index] || label,
        isCorrect: false,
      }));
    }
  } else {
    if (singleLabelIndexes.length >= 2) {
      questionLines = lines.slice(0, singleLabelIndexes[0]);
      options = singleLabelIndexes.map((lineIndex, index) => {
        const label = lines[lineIndex].toUpperCase();
        const nextLabelIndex = singleLabelIndexes[index + 1] ?? lines.length;
        return {
          label,
          text: lines.slice(lineIndex + 1, nextLabelIndex).join('\n').trim() || label,
          isCorrect: false,
        };
      });
    }
  }

  if (questionLines.length === 0 || options.length < 2) return null;

  return {
    questionText: questionLines.join('\n').trim(),
    options,
    explanation: '',
    hasCorrect: false,
  };
};

const extractLooseMCQs = (text) => {
  const headingRegex = /(?:^|\n)\s*(?:MCQ\s*)?Question\s+\d+\s+of\s+\d+/gi;
  const matches = [...text.matchAll(headingRegex)];
  if (matches.length === 0) return null;

  const questions = [];
  const prefix = text.slice(0, matches[0].index).trim();
  let suffix = '';

  matches.forEach((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    const parsed = parseLooseMCQBlock(text.slice(start, end));
    if (parsed) questions.push(parsed);
    if (index === matches.length - 1) suffix = text.slice(end).trim();
  });

  if (questions.length === 0) return null;
  return { prefix, questions, suffix };
};

/**
 * Extract action buttons from text.
 * Returns { textWithoutActions, buttons: [...] }
 * Buttons format: [ACTION:button_text]
 */
const extractActionButtons = (text) => {
  const buttons = [];
  const regex = /\[ACTION:([^\]]+)\]/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    buttons.push({
      text: match[1].trim(),
      fullMatch: match[0]
    });
  }
  
  // Remove action tags from text
  const textWithoutActions = text.replace(regex, '').trim();
  
  return { textWithoutActions, buttons };
};

/**
 * ActionButtonBar — renders extracted action buttons
 */
const ActionButtonBar = ({ buttons, onActionClick }) => {
  if (!buttons || buttons.length === 0) return null;
  
  return (
    <div className="action-button-bar">
      {buttons.map((button, idx) => (
        <button
          key={idx}
          className="action-button"
          onClick={() => onActionClick?.(button.text)}
        >
          {button.text}
        </button>
      ))}
    </div>
  );
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

const EnhancedMessageFormatter = ({ content, messageId, onFlashcardRate, onMCQAnswer, onActionClick }) => {

  // ── Pre-process content to fix malformed charts ───────────────────────────
  const processedContent = useMemo(() => processAIResponse(content), [content]);

  // ── Extract action buttons FIRST (before other parsing) ──────────────────
  const { textWithoutActions, buttons } = useMemo(
    () => extractActionButtons(processedContent),
    [processedContent]
  );
  const contentForParsing = textWithoutActions;

  // ── Detect both flashcards AND MCQs ───────────────────────────────────────
  const flashcardData = useMemo(() => extractFlashcards(contentForParsing), [contentForParsing]);
  const mcqData = useMemo(() => extractMCQs(contentForParsing), [contentForParsing]);

  const hasFlashcards = flashcardData && flashcardData.cards.length > 0;
  const hasMCQs       = mcqData && mcqData.questions.length > 0;
  const hasActions    = buttons && buttons.length > 0;

  // ── Define helper functions BEFORE using them ─────────────────────────────
  
  // Normalise math delimiters in text
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

  // Markdown component overrides
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

  // Helper function to parse content (including FIGURE blocks) into segments
  const parseContentSegments = (content) => {
    if (!content || !content.trim()) return [];
    
    const segments = [];
    let lastIndex = 0;

    // Create fresh regex instances with correct group indices
    const chartRe = new RegExp(CHART_REGEX.source, 'gi');
    const mermaidRe = /```mermaid\n([\s\S]*?)```/gi;
    const figureRe = /\[FIGURE(?::([^\]]*))?\]([\s\S]*?)\[\/FIGURE\]/gi;
    
    // Find all matches first
    const allMatches = [];
    
    let match;
    while ((match = chartRe.exec(content)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        type: 'chart',
        chartType: match[1],
        title: match[2],
        dataStr: match[3]
      });
    }
    
    while ((match = mermaidRe.exec(content)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        type: 'mermaid',
        chart: match[1]
      });
    }
    
    while ((match = figureRe.exec(content)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        type: 'figure',
        title: (match[1] || '').trim(),
        svgContent: (match[2] || '').trim()
      });
    }
    
    // Sort by position
    allMatches.sort((a, b) => a.index - b.index);
    
    // Build segments
    allMatches.forEach((m) => {
      if (m.index > lastIndex) {
        segments.push({ kind: 'text', value: content.slice(lastIndex, m.index) });
      }
      
      if (m.type === 'chart') {
        let data = null;
        try { data = JSON.parse(m.dataStr.trim()); } catch { /* malformed */ }
        segments.push({ kind: 'chart', type: m.chartType, title: m.title, data });
      } else if (m.type === 'figure') {
        console.log('[parseContentSegments] FIGURE found:', m.title);
        segments.push({ kind: 'figure', title: m.title, svgContent: m.svgContent });
      } else if (m.type === 'mermaid') {
        segments.push({ kind: 'mermaid', chart: m.chart });
      }
      
      lastIndex = m.index + m.length;
    });

    if (lastIndex < content.length) {
      segments.push({ kind: 'text', value: content.slice(lastIndex) });
    }

    return segments;
  };

  // Helper to render segments
  const renderSegments = (segments, markdownComponents) => {
    return segments.map((seg, i) => {
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
    });
  };

  // ── Mixed response: both flashcards AND MCQs in one message ───────────────
  if (hasFlashcards && hasMCQs) {
    const prefixSegments = parseContentSegments(mcqData.prefix);
    
    return (
      <div className="enhanced-message">
        {/* Parse prefix for figures/charts */}
        {renderSegments(prefixSegments, markdownComponents)}

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
        
        {/* Action buttons */}
        {hasActions && (
          <ActionButtonBar buttons={buttons} onActionClick={onActionClick} />
        )}
      </div>
    );
  }

  // ── Flashcards only ────────────────────────────────────────────────────────
  if (hasFlashcards) {
    const prefixSegments = parseContentSegments(flashcardData.prefix);
    const suffixSegments = parseContentSegments(flashcardData.suffix);
    
    return (
      <div className="enhanced-message">
        {renderSegments(prefixSegments, markdownComponents)}
        <FlashcardSetRenderer
          cards={flashcardData.cards}
          prefix=""
          suffix=""
          onFlashcardRate={onFlashcardRate}
        />
        {renderSegments(suffixSegments, markdownComponents)}
        {hasActions && (
          <ActionButtonBar buttons={buttons} onActionClick={onActionClick} />
        )}
      </div>
    );
  }

  // ── MCQs only ─────────────────────────────────────────────────────────────
  if (hasMCQs) {
    const prefixSegments = parseContentSegments(mcqData.prefix);
    const suffixSegments = parseContentSegments(mcqData.suffix);
    
    return (
      <div className="enhanced-message">
        {renderSegments(prefixSegments, markdownComponents)}
        <MCQRenderer
          messageId={messageId}
          prefix=""
          questions={mcqData.questions}
          suffix=""
          onMCQAnswer={onMCQAnswer}
        />
        {renderSegments(suffixSegments, markdownComponents)}
        {hasActions && (
          <ActionButtonBar buttons={buttons} onActionClick={onActionClick} />
        )}
      </div>
    );
  }

  // ── Step 1: split content into chart/mermaid/figure blocks and text segments
  // Use the same parseContentSegments function that works for flashcard/MCQ prefix/suffix
  const segments = parseContentSegments(contentForParsing);

  console.log('[EnhancedMessageFormatter] Total segments:', segments.length);
  console.log('[EnhancedMessageFormatter] Segment types:', segments.map(s => s.kind).join(', '));
  segments.forEach((seg, i) => {
    if (seg.kind === 'text' && seg.value.includes('[FIGURE')) {
      console.warn(`⚠️ Segment ${i} (text) still contains [FIGURE tag!`, seg.value.substring(0, 100));
    }
  });
  
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
      
      {/* Render action buttons at the end if present */}
      {hasActions && (
        <ActionButtonBar buttons={buttons} onActionClick={onActionClick} />
      )}
    </div>
  );
};

export default React.memo(EnhancedMessageFormatter, (prev, next) => (
  prev.content === next.content &&
  prev.messageId === next.messageId &&
  prev.onFlashcardRate === next.onFlashcardRate &&
  prev.onMCQAnswer === next.onMCQAnswer &&
  prev.onActionClick === next.onActionClick
));
