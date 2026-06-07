/**
 * tokenBudget.js — Token-aware context builder with page relevance scoring
 * 
 * Part of PDF Pipeline v4 (Stage 6)
 * 
 * This module replaces the old "dump entire PDF into context" approach with
 * intelligent page selection based on relevance scoring.
 * 
 * Expected savings: 70-80% token reduction on typical queries
 */

// ─── Token Budget Configuration ────────────────────────────────────────────

/**
 * Token budgets per AI model
 * Conservative limits that account for system prompts and leave room for output
 */
export const TOKEN_BUDGETS = {
  groq_llama: {
    pdf: 6_000,      // PDF content
    history: 3_000,  // Conversation history
    system: 1_500,   // System prompt
  },
  deepseek: {
    pdf: 40_000,
    history: 10_000,
    system: 2_000,
  },
  gemini: {
    pdf: 80_000,
    history: 20_000,
    system: 2_000,
  },
};

/**
 * Conservative character-to-token ratio
 * Actual ratio varies by language, but 3.5 is safe for most content
 */
const CHARS_PER_TOKEN = 3.5;

// ─── Keyword Extraction (Simple TF-IDF) ────────────────────────────────────

/**
 * Common English stopwords - words that don't carry semantic meaning
 */
const STOPWORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  // Academic stopwords
  'figure', 'table', 'page', 'chapter', 'section', 'et', 'al', 'e.g', 'i.e',
  'however', 'therefore', 'thus', 'hence', 'moreover', 'furthermore',
]);

/**
 * Tokenize text into words
 * @param {string} text - Input text
 * @returns {string[]} Array of lowercase tokens
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Extract top N keywords from text using simple TF-IDF approximation
 * @param {string} text - Page text
 * @param {number} n - Number of keywords to return (default 10)
 * @returns {string[]} Top N keywords
 */
export function extractKeywords(text, n = 10) {
  if (!text || text.length === 0) return [];
  
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];
  
  // Count term frequency
  const termFreq = {};
  tokens.forEach(token => {
    termFreq[token] = (termFreq[token] || 0) + 1;
  });
  
  // Score = TF * log(1 + docLength / termLength)
  // This approximates IDF without needing a corpus
  const scored = Object.entries(termFreq).map(([term, freq]) => ({
    term,
    score: freq * Math.log(1 + text.length / term.length),
  }));
  
  // Sort by score and return top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(item => item.term);
}

// ─── Page Relevance Scoring ─────────────────────────────────────────────────

/**
 * Score a page's relevance to the current user query
 * 
 * Scoring factors:
 * 1. Current page (user is viewing it)
 * 2. Adjacent pages (context continuity)
 * 3. Keyword overlap (semantic relevance)
 * 4. Explicit page references ("page 5", "p. 10")
 * 5. Figure references (if page has figures)
 * 
 * @param {object} page - Page from manifest { pageNum, keywords, hasFigures, figureIds }
 * @param {object[]} manifest - Full PDF manifest
 * @param {string} userMessage - User's question/message
 * @param {number} currentPage - Page number user is currently viewing
 * @returns {number} Relevance score (higher = more relevant)
 */
export function scorePageRelevance(page, manifest, userMessage, currentPage) {
  let score = 0;
  
  // 1. Current page gets highest priority
  if (page.pageNum === currentPage) {
    score += 50;
  }
  
  // 2. Adjacent pages (context continuity)
  const distance = Math.abs(page.pageNum - currentPage);
  if (distance === 1) score += 20;
  if (distance === 2) score += 10;
  if (distance === 3) score += 5;
  
  // 3. Keyword overlap (semantic relevance)
  const userWords = tokenize(userMessage);
  const pageKeywords = page.keywords || [];
  const overlap = pageKeywords.filter(kw => userWords.includes(kw)).length;
  score += overlap * 15;
  
  // 4. Explicit page references
  const pageRefPattern = /(?:page|p\.?)\s*(\d+)/gi;
  let match;
  while ((match = pageRefPattern.exec(userMessage)) !== null) {
    const refNum = parseInt(match[1]);
    if (refNum === page.pageNum) {
      score += 80; // Very strong signal
    }
  }
  
  // 5. Figure references
  if (page.hasFigures && page.figureIds && page.figureIds.length > 0) {
    const figPattern = /fig(?:ure)?\s*([\d.-]+)/gi;
    let figMatch;
    while ((figMatch = figPattern.exec(userMessage)) !== null) {
      const refNum = figMatch[1];
      // Check if any figure on this page matches the reference
      const hasMatch = page.figureIds.some(figId => 
        figId.includes(refNum) || figId.includes(`fig-${page.pageNum}`)
      );
      if (hasMatch) {
        score += 40;
      }
    }
  }
  
  // 6. Bonus for pages with figures when user asks visual questions
  const visualKeywords = ['diagram', 'chart', 'graph', 'figure', 'image', 'illustration', 'table'];
  if (page.hasFigures && visualKeywords.some(kw => userMessage.toLowerCase().includes(kw))) {
    score += 10;
  }
  
  return score;
}

// ─── Context Building ───────────────────────────────────────────────────────

/**
 * Build AI context with token-aware page selection
 * 
 * @param {object} pdfResource - Full PDF resource from database
 * @param {string} userMessage - User's current question
 * @param {object[]} conversationHistory - Recent message history
 * @param {number} currentPage - Page user is viewing
 * @param {string} model - AI model identifier ('groq_llama' | 'deepseek' | 'gemini')
 * @returns {object} Context object with selected pages and metadata
 */
export function buildContextForAI(pdfResource, userMessage, conversationHistory, currentPage, model = 'groq_llama') {
  const budget = TOKEN_BUDGETS[model] || TOKEN_BUDGETS.groq_llama;
  const charBudget = Math.floor(budget.pdf * CHARS_PER_TOKEN);
  
  // Parse manifest and extracted text
  const manifest = typeof pdfResource.manifest === 'string' 
    ? JSON.parse(pdfResource.manifest) 
    : pdfResource.manifest;
  
  const extractedPages = typeof pdfResource.extractedText === 'string'
    ? JSON.parse(pdfResource.extractedText)
    : pdfResource.extractedText;
  
  // Score all pages
  const scored = manifest.map(page => ({
    ...page,
    score: scorePageRelevance(page, manifest, userMessage, currentPage),
  })).sort((a, b) => b.score - a.score);
  
  // Greedily fill budget from top-scored pages
  let usedChars = 0;
  const includedPages = [];
  
  for (const page of scored) {
    // Find page text
    const pageData = extractedPages.find(p => p.pageNum === page.pageNum);
    if (!pageData || !pageData.text) continue;
    
    const pageChars = pageData.text.length;
    
    // Skip if would exceed budget
    if (usedChars + pageChars > charBudget) continue;
    
    includedPages.push({
      pageNum: page.pageNum,
      text: pageData.text,
      method: pageData.method,
      figureIds: page.figureIds || [],
      score: page.score,
    });
    
    usedChars += pageChars;
  }
  
  // Sort included pages by page number (not score) for logical reading order
  includedPages.sort((a, b) => a.pageNum - b.pageNum);
  
  // Build figure context if figures exist
  const figureContext = buildFigureContext(
    pdfResource.figureRegistry,
    userMessage,
    includedPages
  );
  
  return {
    pdfContext: formatPagesForAI(includedPages),
    figureContext,
    pagesIncluded: includedPages.map(p => p.pageNum),
    totalPages: manifest.length,
    tokenEstimate: Math.ceil(usedChars / CHARS_PER_TOKEN),
    budgetUsed: Math.ceil((usedChars / charBudget) * 100),
  };
}

/**
 * Format selected pages for AI consumption
 * @param {object[]} pages - Selected pages with text
 * @returns {string} Formatted page content
 */
function formatPagesForAI(pages) {
  if (pages.length === 0) return '';
  
  return pages.map(page => `
=== PAGE ${page.pageNum} ===
${page.text}
=== END PAGE ${page.pageNum} ===
`.trim()).join('\n\n');
}

// ─── Figure Context Building ────────────────────────────────────────────────

/**
 * Build figure context from registry
 * Includes figures from selected pages + explicitly referenced figures
 * 
 * @param {object} figureRegistry - Full figure registry { 'fig-1-1': {...}, ... }
 * @param {string} userMessage - User's question
 * @param {object[]} includedPages - Pages already included in context
 * @returns {string} Formatted figure context
 */
export function buildFigureContext(figureRegistry, userMessage, includedPages) {
  if (!figureRegistry || Object.keys(figureRegistry).length === 0) {
    return '';
  }
  
  // Parse registry if it's a JSON string
  const registry = typeof figureRegistry === 'string'
    ? JSON.parse(figureRegistry)
    : figureRegistry;
  
  const relevantFigs = [];
  
  // 1. Include figures from included pages
  for (const page of includedPages) {
    for (const figId of page.figureIds || []) {
      if (registry[figId]) {
        relevantFigs.push(registry[figId]);
      }
    }
  }
  
  // 2. Include figures explicitly referenced in user message
  const figPattern = /fig(?:ure)?\s*([\d.-]+)/gi;
  let match;
  while ((match = figPattern.exec(userMessage)) !== null) {
    const refNum = match[1];
    // Find figures whose ID or caption contains this number
    const found = Object.values(registry).filter(fig => 
      fig.id.includes(refNum) || (fig.caption && fig.caption.includes(refNum))
    );
    relevantFigs.push(...found);
  }
  
  if (relevantFigs.length === 0) return '';
  
  // Deduplicate by figure ID
  const deduplicated = [...new Map(relevantFigs.map(f => [f.id, f])).values()];
  
  // Format for AI
  return `\n\n## Figures Available\n\n` + deduplicated.map(fig => `
**${fig.id}** (Page ${fig.page}) — ${fig.type}
${fig.title ? `Title: ${fig.title}` : ''}
${fig.caption ? `Caption: ${fig.caption}` : ''}
Description: ${fig.description}
${fig.data_summary ? `Data: ${fig.data_summary}` : ''}
`.trim()).join('\n\n');
}

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Get text for a specific page from PDF resource
 * @param {object} pdfResource - PDF resource from database
 * @param {number} pageNum - Page number to retrieve
 * @returns {string} Page text or empty string
 */
export function getPageText(pdfResource, pageNum) {
  const extractedPages = typeof pdfResource.extractedText === 'string'
    ? JSON.parse(pdfResource.extractedText)
    : pdfResource.extractedText;
  
  const page = extractedPages.find(p => p.pageNum === pageNum);
  return page ? page.text : '';
}

/**
 * Estimate token count from text
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  return Math.ceil((text || '').length / CHARS_PER_TOKEN);
}

/**
 * Get model identifier from study mode/context
 * @param {string} mode - Study mode or context
 * @returns {string} Model identifier for TOKEN_BUDGETS
 */
export function getModelForMode(mode) {
  // Creative synthesis uses DeepSeek for deep reasoning
  if (mode === 'creative_synthesis') return 'deepseek';
  
  // Document analysis uses Gemini for large context
  if (mode === 'document_analysis') return 'gemini';
  
  // Default to Groq Llama for most study modes
  return 'groq_llama';
}

export default {
  TOKEN_BUDGETS,
  extractKeywords,
  scorePageRelevance,
  buildContextForAI,
  buildFigureContext,
  getPageText,
  estimateTokens,
  getModelForMode,
};
