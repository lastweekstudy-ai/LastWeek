/**
 * contextManager.js — Token-budget-aware context builder for AI API calls.
 *
 * Implements Phase 3 of the Omni-Content Pipeline + PDF Pipeline v4:
 *   - Sliding window eviction (newest pairs kept, oldest dropped)
 *   - Session Memory block (last 3 AI responses, each ≤ 500 chars)
 *   - Smart PDF page selection using relevance scoring (Pipeline v4)
 *   - Token estimation at 4 chars/token
 *
 * References: Requirements 3.1–3.7, Design §Phase 3, PDF Pipeline v4 Stage 6
 */

import { buildContextForAI as buildPDFContext } from './tokenBudget.js';

/**
 * Estimate token count for a messages array.
 * Uses the approximation: 1 token ≈ 4 characters.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @returns {number}
 */
export function estimateTokens(messages) {
  const totalChars = messages.reduce(
    (sum, m) => sum + m.role.length + m.content.length,
    0
  );
  return Math.ceil(totalChars / 4);
}

/**
 * Build the Session Memory block from the last N assistant responses.
 * Returns null if there are fewer than 4 assistant messages in the history
 * (not enough history to warrant a memory block).
 *
 * @param {Array<{role: string, content: string}>} messages - Full message history
 * @param {number} [n=3]          - Number of AI responses to include
 * @param {number} [maxChars=500] - Max characters per response segment
 * @returns {string|null}
 */
export function buildSessionMemory(messages, n = 3, maxChars = 500) {
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  // Require at least 4 assistant messages before building session memory
  if (assistantMessages.length < 4) {
    return null;
  }

  const lastN = assistantMessages.slice(-n);
  const segments = lastN.map(m => m.content.substring(0, maxChars));
  return segments.join('\n');
}

function buildStoredSummaryMemory(activeSession) {
  const summary = activeSession?.summary;
  if (!summary || typeof summary !== 'string') return null;
  return summary.trim().substring(0, 1800);
}

/**
 * Extract a focused window of pages from the full PDF extracted text.
 * Returns pages currentPage-1 through currentPage+1.
 * Falls back to first 8000 chars if no page markers are found.
 *
 * @param {string} pageContext   - Full extracted PDF text with === PAGE X === markers
 * @param {number} currentPage  - The page the user is currently viewing
 * @returns {string}
 */
function extractFocusedPageContext(pageContext, currentPage) {
  const pages = {};
  const pageRegex = /=== PAGE (\d+) ===([\s\S]*?)=== END PAGE \1 ===/gi;
  let match;
  while ((match = pageRegex.exec(pageContext)) !== null) {
    pages[parseInt(match[1])] = match[0];
  }

  if (Object.keys(pages).length === 0) {
    return pageContext.substring(0, 8000);
  }

  const start = Math.max(1, currentPage - 1);
  const end = currentPage + 1;
  const chunks = [];
  for (let p = start; p <= end; p++) {
    if (pages[p]) chunks.push(pages[p]);
  }

  return chunks.length > 0 ? chunks.join('\n\n') : pageContext.substring(0, 8000);
}

/**
 * Extract a single page from the full PDF extracted text.
 *
 * @param {string} pageContext  - Full extracted PDF text
 * @param {number} currentPage - The page to extract
 * @returns {string}
 */
function extractSinglePage(pageContext, currentPage) {
  const pageRegex = /=== PAGE (\d+) ===([\s\S]*?)=== END PAGE \1 ===/gi;
  let match;
  while ((match = pageRegex.exec(pageContext)) !== null) {
    if (parseInt(match[1]) === currentPage) {
      return match[0];
    }
  }
  return pageContext.substring(0, 8000);
}

/**
 * Strip large PDF/study-mode blocks from a message's content to reduce token usage.
 * Handles JSON-encoded messages, [STUDY MODE:] blocks, and COMPLETE DOCUMENT TEXT: blocks.
 *
 * @param {string} content - Raw message content
 * @returns {string}       - Stripped content
 */
function stripLargeBlocks(content) {
  let stripped = content;

  // Handle JSON-encoded messages (try to extract .text field)
  try {
    const parsed = JSON.parse(stripped);
    if (parsed.text) stripped = parsed.text;
  } catch (e) {
    // Not JSON — use as-is
  }

  // Strip large PDF context blocks
  if (stripped.includes('[STUDY MODE:') || stripped.includes('COMPLETE DOCUMENT TEXT:')) {
    const questionMatch = stripped.match(/User Question:\s*([\s\S]{0,500})/);
    stripped = questionMatch ? questionMatch[1].trim() : stripped.substring(0, 200);
  }

  return stripped;
}

/**
 * Build AI context using PDF Pipeline v4 token budget manager.
 * Uses relevance scoring to select the most important pages instead of simple windowing.
 * 
 * @param {object} pdfResource - Full PDF resource from database with manifest and figureRegistry
 * @param {string} userMessage - User's current question
 * @param {number} currentPage - Page user is viewing
 * @param {string} model - AI model identifier ('groq_llama' | 'deepseek' | 'gemini')
 * @returns {object} Context with pdfContext, figureContext, pagesIncluded, tokenEstimate
 */
export function buildSmartPDFContext(pdfResource, userMessage, currentPage, model = 'groq_llama') {
  try {
    return buildPDFContext(pdfResource, userMessage, [], currentPage, model);
  } catch (error) {
    console.warn('[contextManager] Smart PDF context failed, using fallback:', error.message);
    // Fallback to old windowing approach
    return {
      pdfContext: extractFocusedPageContext(pdfResource.extractedText || '', currentPage),
      figureContext: '',
      pagesIncluded: [currentPage - 1, currentPage, currentPage + 1].filter(p => p > 0),
      tokenEstimate: 0,
    };
  }
}

/**
 * Build the messages array for a DeepSeek API call with token-budget-aware
 * sliding window eviction, session memory, and optional page context injection.
 *
 * Algorithm:
 *  1. Build two fixed priming messages (always retained)
 *  2. Build session memory block (if ≥ 4 assistant messages exist)
 *  3. Strip large PDF blocks from historical messages
 *  4. Collect user/assistant pairs newest-first
 *  5. Sliding window: add pairs until budget exceeded; always keep ≥ 2 pairs
 *  6. Inject page context block (using v4 smart selection if pdfResource provided, else old windowing)
 *  7. Add the new user message
 *  8. Log evictions if any
 *  9. Return assembled result
 *
 * @param {Array<{role: string, content: string}>} messages - Full session history
 * @param {string}   aiContextMessage  - The current user's context-enriched message
 * @param {{subject: string, mode: string}} activeSession
 * @param {number}   [tokenBudget=28000]
 * @param {Object}   [options={}]
 * @param {number}   [options.currentPage]  - For PDF study mode page windowing
 * @param {string}   [options.pageContext]  - Full extracted PDF text (legacy)
 * @param {object}   [options.pdfResource]  - Full PDF resource with manifest (v4)
 * @param {string}   [options.model='groq_llama'] - AI model for token budget
 * @returns {{ messages: Array, tokenEstimate: number, evictedCount: number, hasSessionMemory: boolean, pagesIncluded: Array }}
 */
export function buildContextMessages(
  messages,
  aiContextMessage,
  activeSession,
  tokenBudget = 28000,
  options = {}
) {
  // ── Step 1: Fixed priming messages (always retained) ──────────────────────
  const primingMessages = [
    {
      role: 'user',
      content: `[CONTEXT] I am studying: ${activeSession.subject}. Current learning mode: ${activeSession.mode}. Please stay focused on this subject throughout our conversation.`
    },
    {
      role: 'assistant',
      content: `Understood. I will focus entirely on ${activeSession.subject} using the ${activeSession.mode} approach. Let's begin.`
    }
  ];

  // ── Step 2: Session Memory block ──────────────────────────────────────────
  let hasSessionMemory = false;
  const sessionMemoryMessages = [];
  const storedSummary = buildStoredSummaryMemory(activeSession);
  if (storedSummary !== null) {
    sessionMemoryMessages.push({
      role: 'user',
      content: '[ROLLING SESSION SUMMARY]\n' + storedSummary
    });
    hasSessionMemory = true;
  }

  const sessionMemory = buildSessionMemory(messages);
  if (sessionMemory !== null) {
    sessionMemoryMessages.push({
      role: 'user',
      content: '[SESSION MEMORY]\n' + sessionMemory
    });
    hasSessionMemory = true;
  }

  // ── Step 3: Strip large blocks from historical messages ───────────────────
  const strippedMessages = messages.map(m => ({
    role: m.role,
    content: stripLargeBlocks(m.content)
  }));

  // ── Step 4: Collect user/assistant pairs newest-first ─────────────────────
  // A "pair" is a consecutive user message followed by an assistant message.
  // We walk backwards through the history collecting complete pairs.
  const pairs = []; // each element: [userMsg, assistantMsg]
  let i = strippedMessages.length - 1;
  while (i >= 1) {
    if (
      strippedMessages[i].role === 'assistant' &&
      strippedMessages[i - 1].role === 'user'
    ) {
      pairs.push([strippedMessages[i - 1], strippedMessages[i]]);
      i -= 2;
    } else {
      i -= 1;
    }
  }
  // pairs[0] is the newest pair, pairs[last] is the oldest

  const totalPairs = pairs.length;

  // ── Step 5: Sliding window — add pairs newest-first until budget exceeded ──
  // Always keep a minimum of 2 pairs even if over budget.
  const MIN_PAIRS = 2;
  const MAX_PAIRS = Math.max(MIN_PAIRS, options.maxPairs || 6);
  const newUserMessage = { role: 'user', content: aiContextMessage };

  let keptPairs = 0;
  for (let p = 0; p < Math.min(pairs.length, MAX_PAIRS); p++) {
    const candidateWindow = pairs.slice(0, p + 1).flat(); // newest-first flat list
    const candidateMessages = [
      ...primingMessages,
      ...sessionMemoryMessages,
      ...candidateWindow,
      newUserMessage
    ];
    if (estimateTokens(candidateMessages) > tokenBudget && p >= MIN_PAIRS) {
      // Adding this pair would exceed budget and we already have the minimum
      break;
    }
    keptPairs = p + 1;
  }

  // Ensure we always keep at least MIN_PAIRS (even if over budget)
  keptPairs = Math.max(keptPairs, Math.min(MIN_PAIRS, pairs.length));

  const evictedCount = totalPairs - keptPairs;

  // The kept pairs are pairs[0..keptPairs-1] (newest-first).
  // Reverse them so they appear oldest-first in the final messages array.
  const windowPairs = pairs.slice(0, keptPairs).reverse().flat();

  // ── Step 6: Page context injection ────────────────────────────────────────
  const pageContextMessages = [];
  let pagesIncluded = [];
  
  // Try v4 smart PDF context first (if pdfResource provided)
  if (options.pdfResource && options.pdfResource.manifest) {
    try {
      const model = options.model || 'groq_llama';
      const smartContext = buildSmartPDFContext(
        options.pdfResource, 
        aiContextMessage, 
        options.currentPage || 1, 
        model
      );
      
      // Combine PDF content and figure context
      let contextContent = smartContext.pdfContext;
      if (smartContext.figureContext) {
        contextContent += '\n\n' + smartContext.figureContext;
      }
      
      if (contextContent.trim()) {
        pageContextMessages.push({
          role: 'user',
          content: 'RELEVANT DOCUMENT CONTENT:\n' + contextContent
        });
        pagesIncluded = smartContext.pagesIncluded || [];
        
        console.log(`[Context v4] Selected ${pagesIncluded.length} pages using relevance scoring`);
      }
    } catch (error) {
      console.warn('[contextManager] Smart PDF context failed, falling back to legacy:', error.message);
      // Fall through to legacy approach
      options.pageContext = options.pdfResource.extractedText;
    }
  }
  
  // Legacy fallback: old windowing approach (if pageContext provided and v4 didn't work)
  if (options.pageContext && pageContextMessages.length === 0) {
    let focusedText;
    if (options.currentPage) {
      focusedText = extractFocusedPageContext(options.pageContext, options.currentPage);
      pagesIncluded = [
        Math.max(1, options.currentPage - 1),
        options.currentPage,
        options.currentPage + 1
      ];
    } else {
      // No specific page — use first 8000 chars
      focusedText = options.pageContext.substring(0, 8000);
    }

    const pageContextMsg = {
      role: 'user',
      content: 'RELEVANT DOCUMENT CONTENT:\n' + focusedText
    };

    // Check if adding the page context would exceed the budget
    const withPageContext = [
      ...primingMessages,
      ...sessionMemoryMessages,
      ...windowPairs,
      pageContextMsg,
      newUserMessage
    ];

    if (estimateTokens(withPageContext) > tokenBudget && options.currentPage) {
      // Trim to single page only
      const singlePageText = extractSinglePage(options.pageContext, options.currentPage);
      pageContextMessages.push({
        role: 'user',
        content: 'RELEVANT DOCUMENT CONTENT:\n' + singlePageText
      });
      pagesIncluded = [options.currentPage];
    } else {
      pageContextMessages.push(pageContextMsg);
    }
  }

  // ── Step 7: Assemble final messages array ─────────────────────────────────
  const finalMessages = [
    ...primingMessages,
    ...sessionMemoryMessages,
    ...windowPairs,
    ...pageContextMessages,
    newUserMessage
  ];

  // ── Step 8: Compute token estimate ────────────────────────────────────────
  const tokenEstimate = estimateTokens(finalMessages);

  // ── Step 9: Log evictions ─────────────────────────────────────────────────
  if (evictedCount > 0) {
    // Silent eviction — no logging needed in production
  }

  return {
    messages: finalMessages,
    tokenEstimate,
    evictedCount,
    hasSessionMemory,
    pagesIncluded,
  };
}
