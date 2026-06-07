# Kiro Spec: LastWeek PDF Pipeline v4 — Reliable, Token-Efficient, Figure-Aware

**Status:** Ready for implementation  
**Priority:** High  
**Owner:** PDF Processing Team  

---

## Problem Statement

The current pipeline has four critical failure modes:

1. **Token waste** — Full extracted text is dumped into AI context on every message, regardless of what the user is asking. A 100-page PDF burns 60K+ tokens even if the user asks about one paragraph.
2. **Unreliable language support** — The garbled-Bengali detector is a brittle regex. Any non-Latin script that slips past the regex gets silently bad extraction. Vision OCR is a "fallback" when it should be the first-choice for all complex scripts.
3. **Figure blindness** — Figures, charts, diagrams, and images inside PDFs are invisible to the AI. When a user asks "what does Figure 4 show?" the AI has no idea.
4. **No caching layer** — Every page reprocesses from scratch on re-upload. Vision OCR costs money and takes time; hitting the same page twice is pure waste.

---

## Goals

- Process any PDF in any language with ≥95% accuracy
- Reduce AI token consumption by 70–80% through page-aware context injection
- Build a figure registry so the AI can answer questions about charts, diagrams, and images
- Cache processed output so re-uploads and revisits are instant and free
- Keep the UI non-blocking with accurate per-page progress

---

## Non-Goals

- Real-time collaborative PDF annotation (future)
- Server-side PDF processing (stays client-side for privacy)
- Offline/service-worker caching (out of scope)

---

## Architecture

### New Pipeline Stages

```
User Upload
    ↓
[STAGE 1] File Validation & Cache Check
    ↓ cache hit → skip to Store & Serve
    ↓ cache miss ↓
[STAGE 2] Language Pre-screening
    ↓ detect script family per page
    ↓
[STAGE 3A] Latin/CJK/Cyrillic/Greek pages
    → PDF.js extraction
    → Quality gate (garbage ratio < 5%)
    → PASS → use text
    → FAIL → escalate to Stage 3B
[STAGE 3B] Complex-script or failed pages
    → Render page as image (1.5x scale, PNG)
    → Gemini Vision OCR
    → Extract text + figure metadata
[STAGE 4] Figure Registry Builder
    → Gemini Vision: identify all figures, tables, charts, diagrams
    → Assign stable IDs (fig-1, fig-2, ...)
    → Store: page number, type, description, base64 thumbnail
[STAGE 5] Page Manifest Builder
    → One record per page: { pageNum, method, charCount, hasFigures, figureIds }
    → Store manifest in Appwrite DB
[STAGE 6] Token Budget Manager
    → On each user message: score page relevance
    → Inject only top-N relevant pages into AI context
    → Hard cap: 15,000 tokens of PDF content per message
    ↓
Store in Appwrite DB
    ↓
AI-Assisted Study
```

---

## Stage Specifications

---

### Stage 1: File Validation & Cache Check

**File:** `src/utils/pdfProcessor.js`

**Logic:**

```javascript
// Generate a deterministic cache key from file contents
async function getCacheKey(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function checkCache(cacheKey) {
  // Query Appwrite: does a pdf_resources record exist with this cacheKey?
  // If yes, return the stored manifest + extracted text immediately
  // Skip all processing stages
}
```

**Cache key:** SHA-256 of the raw `ArrayBuffer`, first 32 hex chars (collision-safe for this use case).

**Cache hit path:** Return existing `pdf_resources` record. Zero reprocessing. Zero API calls.

**Validation rules (unchanged):**
- `file.type === 'application/pdf'`
- `file.size < 50 * 1024 * 1024`

---

### Stage 2: Language Pre-Screening

**File:** `src/utils/pdfProcessor.js`

**Purpose:** Decide the extraction strategy for each page *before* processing, not reactively. This eliminates the "extract bad text, detect it's bad, re-do with Vision OCR" double-work.

**Script families and routing:**

```javascript
const SCRIPT_FAMILIES = {
  // Always try PDF.js first — these encode well
  LATIN:    { ranges: [[0x0020, 0x024F]], route: 'pdfjs' },
  CYRILLIC: { ranges: [[0x0400, 0x04FF]], route: 'pdfjs' },
  GREEK:    { ranges: [[0x0370, 0x03FF]], route: 'pdfjs' },
  CJK:      { ranges: [[0x4E00, 0x9FFF], [0x3000, 0x303F]], route: 'pdfjs' },

  // Always route directly to Vision OCR — never trust PDF.js for these
  INDIC:    { ranges: [[0x0900, 0x097F], [0x0980, 0x09FF], [0x0A00, 0x0A7F],
                        [0x0A80, 0x0AFF], [0x0B00, 0x0B7F], [0x0B80, 0x0BFF],
                        [0x0C00, 0x0C7F], [0x0C80, 0x0CFF], [0x0D00, 0x0D7F]], route: 'vision' },
  ARABIC:   { ranges: [[0x0600, 0x06FF], [0x0750, 0x077F], [0x08A0, 0x08FF]], route: 'vision' },
  SE_ASIAN: { ranges: [[0x0E00, 0x0E7F], [0x1000, 0x109F], [0x1780, 0x17FF]], route: 'vision' },
};

function detectPageScript(textSample) {
  // textSample = first 200 chars of PDF.js quick extract (no layout processing)
  // Returns: 'pdfjs' | 'vision'
  
  for (const [family, config] of Object.entries(SCRIPT_FAMILIES)) {
    if (config.route === 'vision') {
      for (const [start, end] of config.ranges) {
        if ([...textSample].some(ch => ch.codePointAt(0) >= start && ch.codePointAt(0) <= end)) {
          return 'vision'; // Direct to Vision OCR — no trial extraction
        }
      }
    }
  }
  return 'pdfjs'; // Default: try PDF.js
}
```

**Key insight:** Do a "quick extract" (just `page.getTextContent()` with no sorting/grouping) to get a 200-char sample for script detection. This is cheap (no layout computation). Only then decide whether to do full PDF.js extraction or Vision OCR.

---

### Stage 3A: PDF.js Extraction (for Latin/CJK/Cyrillic/Greek)

**File:** `src/utils/pdfProcessor.js`

**No changes to existing extraction logic** — it works fine for supported scripts.

**Quality gate changes:**

```javascript
function qualityGate(text, pageNum) {
  const ratio = computeGarbageRatio(text);
  const isEmpty = text.trim().length < 20;
  
  if (isEmpty || ratio > 0.05) {
    // Escalate — do NOT use this text
    return { pass: false, reason: isEmpty ? 'empty' : 'garbage', ratio };
  }
  return { pass: true, ratio };
}
```

**Change from current:** Threshold lowered from 30% to **5%**. Even small amounts of garbage indicate an encoding problem that Vision OCR will handle better. This catches more bad extractions earlier.

---

### Stage 3B: Vision OCR (for complex scripts and failed pages)

**File:** `src/services/secureAiProvider.js` — new function `ocrPage()`

**Rendering spec:**

```javascript
async function renderPageToBase64(page) {
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  
  // Compress to JPEG at 85% quality — dramatically reduces base64 size vs PNG
  // PNG: ~800KB/page average. JPEG 85%: ~150KB/page average. 5x reduction.
  return canvas.toDataURL('image/jpeg', 0.85).replace(/^data:image\/jpeg;base64,/, '');
}
```

**OCR prompt (revised):**

```
You are a PDF page OCR system. Extract ALL text from this page image.

Rules:
1. Preserve reading order (top to bottom, left to right; right to left for Arabic/Hebrew)
2. Format headings with markdown: # ## ###
3. Format lists with - or 1. 2. 3.
4. Format tables with | pipe | syntax
5. Format math with LaTeX: $inline$ or $$block$$
6. Preserve paragraph breaks with blank lines
7. If this page contains ONLY images/figures with no text, respond with: [IMAGE_ONLY_PAGE]
8. Do NOT add commentary, do NOT describe figures here — only extract text

Return the extracted text and nothing else.
```

**Why separate from figure extraction:** Doing OCR + figure detection in one prompt is slower and less accurate. Two focused prompts are faster total because each is shorter and the model doesn't split attention.

---

### Stage 4: Figure Registry Builder ⭐ (New)

**File:** `src/utils/figureRegistry.js` (new file)

This is the core new feature. Every page with visual content gets analyzed separately for figures.

**What counts as a figure:**
- Charts (bar, line, pie, scatter, etc.)
- Diagrams (flowcharts, system diagrams, network diagrams)
- Tables with complex structure (simple markdown tables are handled in OCR)
- Scientific/technical illustrations
- Photographs
- Maps
- Mathematical figures

**Figure detection prompt:**

```
Analyze this PDF page image for visual content (figures, charts, diagrams, tables, images).

For EACH visual element you find, provide a JSON object with:
{
  "id": "fig-{pageNum}-{index}",        // e.g. "fig-3-1", "fig-3-2"
  "type": "chart|diagram|table|illustration|photo|map|equation",
  "caption": "exact caption text from the document, if visible",
  "title": "short descriptive title you assign (max 8 words)",
  "description": "detailed description of what this figure shows (2-4 sentences)",
  "data_summary": "for charts/tables: describe the data, trends, key values. For others: null",
  "position": "top|middle|bottom",
  "page": {pageNum}
}

Respond with a JSON array. If no figures exist on this page, respond with: []
Do not include markdown code fences. Raw JSON only.
```

**Only run figure detection on pages where:**
1. Vision OCR returned `[IMAGE_ONLY_PAGE]`, OR
2. The page image, when rendered, contains image-like regions (detected by checking if PDF.js reports embedded images via `page.getOperatorList()` — any `paintImageXObject` or `paintInlineImageXObject` operator means figures may be present)

**Implementation:**

```javascript
async function buildFigureRegistry(pdf, pageResults) {
  const registry = {}; // { 'fig-3-1': { ...metadata }, ... }
  
  for (const pageResult of pageResults) {
    const hasFigures = await pageHasFigures(pdf, pageResult.pageNum);
    if (!hasFigures && pageResult.method !== 'vision_image_only') continue;
    
    const base64 = await renderPageToBase64(await pdf.getPage(pageResult.pageNum));
    const figures = await detectFigures(base64, pageResult.pageNum);
    
    for (const fig of figures) {
      registry[fig.id] = fig;
    }
    
    pageResult.figureIds = figures.map(f => f.id);
  }
  
  return registry;
}

async function pageHasFigures(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);
  const ops = await page.getOperatorList();
  const IMAGE_OPS = [
    pdfjsLib.OPS.paintImageXObject,
    pdfjsLib.OPS.paintInlineImageXObject,
    pdfjsLib.OPS.paintImageMaskXObject,
  ];
  return ops.fnArray.some(op => IMAGE_OPS.includes(op));
}
```

**Storage:** Figure registry stored as JSON in the `pdf_resources` record under a new `figureRegistry` field (max 500KB — well within Appwrite's 4MB document limit for typical academic PDFs).

---

### Stage 5: Page Manifest Builder

**File:** `src/utils/pdfProcessor.js`

After all pages are processed, build a manifest:

```javascript
const manifest = pages.map(p => ({
  pageNum: p.pageNum,
  method: p.method,           // 'pdfjs' | 'vision'
  charCount: p.text.length,
  hasFigures: p.figureIds.length > 0,
  figureIds: p.figureIds,     // ['fig-3-1', 'fig-3-2']
  keywords: extractKeywords(p.text), // Top 10 TF-IDF keywords per page
}));
```

**Keyword extraction:**

```javascript
function extractKeywords(text, n = 10) {
  // Simple TF-IDF approximation
  // 1. Tokenize: split on whitespace/punctuation, lowercase
  // 2. Remove stopwords (English + common academic stopwords)
  // 3. Count term frequency
  // 4. Score = TF * log(1 + charCount / termLength) as IDF proxy
  // 5. Return top N terms
  
  // These keywords are the lookup index for Stage 6 relevance scoring
}
```

Keywords are stored per page in the manifest. They are NOT stored in the page text itself — they're the index, not the content.

---

### Stage 6: Token Budget Manager ⭐ (New)

**File:** `src/utils/contextManager.js` — replace existing `buildContextForAI()`

This is the biggest token-saving change. Instead of sending the full PDF every message, we score each page for relevance to the user's current question and inject only the top pages.

**Budget limits:**

```javascript
const TOKEN_BUDGETS = {
  groq_llama:  { pdf: 6_000,  history: 3_000,  system: 1_500 }, // 10.5K total
  deepseek:    { pdf: 40_000, history: 10_000, system: 2_000 }, // 52K total  
  gemini:      { pdf: 80_000, history: 20_000, system: 2_000 }, // 102K total
};

const CHARS_PER_TOKEN = 3.5; // Conservative estimate
```

**Relevance scoring:**

```javascript
function scorePageRelevance(page, manifest, userMessage, currentPage) {
  let score = 0;
  
  // 1. User is on this page (high signal)
  if (page.pageNum === currentPage) score += 50;
  
  // 2. Adjacent pages (context continuity)
  if (Math.abs(page.pageNum - currentPage) === 1) score += 20;
  if (Math.abs(page.pageNum - currentPage) === 2) score += 10;
  
  // 3. Keyword overlap between user message and page keywords
  const userWords = tokenize(userMessage);
  const overlap = page.keywords.filter(kw => userWords.includes(kw)).length;
  score += overlap * 15;
  
  // 4. User explicitly mentions a page number
  const pageRefs = userMessage.match(/page\s*(\d+)/gi) || [];
  if (pageRefs.some(ref => parseInt(ref.match(/\d+/)[0]) === page.pageNum)) score += 80;
  
  // 5. User references a figure ID or figure number
  const figRefs = userMessage.match(/fig(?:ure)?\s*[\d.-]+/gi) || [];
  if (figRefs.length > 0 && page.hasFigures) score += 40;
  
  // 6. Pages with figures are slightly deprioritized for text-only questions
  // (their content is in the figure registry, not the text)
  
  return score;
}
```

**Context assembly:**

```javascript
function buildContextForAI(pdfResource, userMessage, conversationHistory, currentPage, model) {
  const budget = TOKEN_BUDGETS[model];
  const charBudget = Math.floor(budget.pdf * CHARS_PER_TOKEN);
  
  // Score all pages
  const scored = pdfResource.manifest
    .map(page => ({ ...page, score: scorePageRelevance(page, pdfResource.manifest, userMessage, currentPage) }))
    .sort((a, b) => b.score - a.score);
  
  // Greedily fill budget from top-scored pages
  let usedChars = 0;
  const includedPages = [];
  
  for (const page of scored) {
    const pageText = getPageText(pdfResource, page.pageNum); // Load from stored text
    const pageChars = pageText.length;
    if (usedChars + pageChars > charBudget) continue;
    includedPages.push({ pageNum: page.pageNum, text: pageText, figureIds: page.figureIds });
    usedChars += pageChars;
  }
  
  // Sort included pages by page number (not score) for the AI
  includedPages.sort((a, b) => a.pageNum - b.pageNum);
  
  // Append figure data for any figures mentioned or on included pages
  const figureContext = buildFigureContext(pdfResource.figureRegistry, userMessage, includedPages);
  
  return {
    pdfContext: formatPagesForAI(includedPages),
    figureContext,
    pagesIncluded: includedPages.map(p => p.pageNum),
    tokenEstimate: Math.ceil(usedChars / CHARS_PER_TOKEN),
  };
}
```

**Figure context injection:**

```javascript
function buildFigureContext(figureRegistry, userMessage, includedPages) {
  if (!figureRegistry || Object.keys(figureRegistry).length === 0) return '';
  
  const relevantFigs = [];
  
  // Always include figures from included pages
  for (const page of includedPages) {
    for (const figId of page.figureIds) {
      if (figureRegistry[figId]) relevantFigs.push(figureRegistry[figId]);
    }
  }
  
  // Also include any figures explicitly referenced in the user message
  const figPattern = /fig(?:ure)?\s*([\d.-]+)/gi;
  let match;
  while ((match = figPattern.exec(userMessage)) !== null) {
    const refNum = match[1];
    // Find figures whose ID or caption contains this number
    const found = Object.values(figureRegistry).filter(fig => 
      fig.id.includes(refNum) || (fig.caption && fig.caption.includes(refNum))
    );
    relevantFigs.push(...found);
  }
  
  if (relevantFigs.length === 0) return '';
  
  const deduplicated = [...new Map(relevantFigs.map(f => [f.id, f])).values()];
  
  return `\n\n## Figures in this document\n` + deduplicated.map(fig => `
**${fig.id}** (Page ${fig.page}) — ${fig.type}
Caption: ${fig.caption || 'none'}
Description: ${fig.description}
${fig.data_summary ? `Data: ${fig.data_summary}` : ''}
`.trim()).join('\n\n');
}
```

---

### AI System Prompt Update

**File:** Each study mode prompt file

Add this section to every AI system prompt:

```
You have access to a PDF document. The content is provided page by page.

IMPORTANT — figures:
- When a figure registry is provided, you CAN answer questions about charts, diagrams, and images
- Refer to figures by their ID (e.g. "Figure 3-1 shows...")  
- If a user asks about a figure not in the provided context, tell them the figure exists but ask them to navigate to that page so you can load it

IMPORTANT — pages:
- Not all pages are included in every message (for efficiency)
- If a user asks about content you cannot find, say: "That may be on a page I haven't loaded. Can you tell me what page number you're looking at?"
- Never invent content that isn't in your context
```

---

## Database Changes

### `pdf_resources` collection — new fields

| Field | Type | Size | Purpose |
|-------|------|------|---------|
| `cacheKey` | string | 32 chars | SHA-256 fingerprint for cache lookup |
| `manifest` | string (JSON) | 100KB | Per-page metadata (pageNum, method, charCount, hasFigures, figureIds, keywords) |
| `figureRegistry` | string (JSON) | 500KB | All figure metadata (descriptions, data summaries) |
| `processingVersion` | integer | — | Schema version; increment when pipeline changes |

### `extractedText` field — change storage format

**Current:** One giant string, first 1M chars  
**New:** JSON array of page objects

```json
[
  { "pageNum": 1, "text": "...", "method": "pdfjs" },
  { "pageNum": 2, "text": "...", "method": "vision" },
  ...
]
```

This allows on-demand page loading instead of loading everything.

**Appwrite index:** Add index on `cacheKey` field for fast cache lookups.

---

## Progress Reporting — Updated

```javascript
onProgress({
  stage: 'validating' | 'screening' | 'extracting' | 'ocr' | 'figures' | 'indexing' | 'storing',
  pageNum: 3,
  totalPages: 20,
  method: 'pdfjs' | 'vision',
  figuresFound: 2,
  percentComplete: 15,
});
```

**UI text per stage:**
- `validating` → "Checking cache..."
- `screening` → "Analyzing document structure..."
- `extracting` → "Extracting page {n} of {total}..."
- `ocr` → "Running OCR on page {n} (complex script detected)..."
- `figures` → "Building figure registry ({n} figures found so far)..."
- `indexing` → "Indexing content..."
- `storing` → "Saving to your library..."

---

## File Changes Summary

### New files
- `src/utils/figureRegistry.js` — Figure detection, storage, and retrieval
- `src/utils/tokenBudget.js` — Token budget manager and relevance scoring

### Modified files

| File | Change |
|------|--------|
| `src/utils/pdfProcessor.js` | Add cache check, language pre-screening, quality gate threshold change (5%), page manifest builder |
| `src/utils/contextManager.js` | Replace `buildContextForAI()` with scored page injection + figure context |
| `src/services/secureAiProvider.js` | Add `ocrPage()` with JPEG compression; add `detectFigures()` |
| `src/appwrite/pdfResources.js` | Add `cacheKey`, `manifest`, `figureRegistry`, `processingVersion` fields; change `extractedText` to JSON array |
| All study mode prompt files | Add figure/page context instructions to system prompt |

---

## Processing Order Per Page

For each page, execute in this order:

1. Quick-extract 200 chars (PDF.js, no layout — fast)
2. Detect script family
3. If `route = 'vision'`: skip to step 5
4. If `route = 'pdfjs'`: full extraction → quality gate → if FAIL, go to step 5
5. Render page as JPEG 85%
6. Vision OCR (text extraction)
7. Check for figures (`paintImageXObject` operator detection)
8. If figures: figure detection call (separate Gemini Vision call)
9. Extract keywords from page text (TF-IDF)
10. Append to manifest

**Parallelism:** Steps 6 and 7 can overlap (render the next page while waiting for Vision OCR on the current one). Use a queue with 2 concurrent Vision OCR slots maximum to avoid API rate limits.

---

## Token Savings Estimate

| Scenario | Current | New | Savings |
|----------|---------|-----|---------|
| 20-page PDF, user asks about page 5 | 60K tokens | 6K tokens | 90% |
| 100-page PDF, user asks a general question | 200K tokens | 12K tokens | 94% |
| User asks about a figure | 0 (no figure data) + 60K text | 3K figure data + 4K text | Works + 88% |
| Re-upload same PDF | Full reprocess | 0 (cache hit) | 100% |

---

## Error Handling

| Error | Current behavior | New behavior |
|-------|-----------------|--------------|
| Vision OCR timeout | Show error | Retry once; if still fails, store `[OCR_FAILED]` placeholder, continue with other pages |
| Figure detection fails | N/A | Log silently, page.figureIds = [], continue — don't block text extraction |
| Manifest too large for Appwrite | N/A | Truncate keywords to top 5 per page; if still too large, drop keywords entirely |
| Cache key collision | N/A | Impossible — SHA-256 collision probability is negligible |
| PDF.js timeout (>60s) | Block UI | Cancel, release memory, show error with "Try a smaller file" suggestion |

---

## Testing Checklist

Before marking implementation complete:

- [ ] English PDF (text) processes via PDF.js path
- [ ] Bengali PDF routes directly to Vision OCR (pre-screening, not fallback)
- [ ] Arabic PDF routes directly to Vision OCR
- [ ] Scanned (image-only) PDF processes via Vision OCR
- [ ] PDF with embedded figures populates figure registry
- [ ] User asking "what does Figure 2 show?" gets accurate answer
- [ ] Re-uploading the same PDF returns cache hit (no reprocessing)
- [ ] 100-page PDF: asking about page 5 injects ≤ 10 pages into context
- [ ] Mixed-language PDF (English + Arabic sections) handles each page independently
- [ ] Figure detection API call failure does NOT block text extraction
- [ ] Progress UI updates smoothly through all stages

---

## Implementation Priority

1. **Cache check** (Stage 1) — immediate ROI, zero API cost for re-uploads
2. **Token Budget Manager** (Stage 6) — biggest token reduction, implement early
3. **Language Pre-screening** (Stage 2) — fixes reliability for non-Latin languages
4. **Figure Registry** (Stage 4) — enables new capability
5. **JPEG compression** in Vision OCR — reduces API payload size ~5x
6. **Parallel page processing** — speed improvement, do last

---

**Version:** 1.0  
**Last Updated:** June 2026
