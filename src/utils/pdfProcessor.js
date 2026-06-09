import { pdfjs as pdfjsLib } from 'react-pdf';

// Configure PDF.js worker - use the worker from public folder
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

// ─── Cache Management ───────────────────────────────────────────────────────

/**
 * Generate a deterministic cache key from file contents
 * @param {ArrayBuffer} arrayBuffer - Raw PDF binary data
 * @returns {Promise<string>} SHA-256 hash (first 32 hex chars)
 */
export async function getCacheKey(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// ─── Language Pre-Screening (Stage 2) ──────────────────────────────────────

/**
 * Script family definitions with Unicode ranges and routing strategy
 */
const SCRIPT_FAMILIES = {
  // Always try PDF.js first — these encode well
  LATIN:    { ranges: [[0x0020, 0x024F]], route: 'pdfjs' },
  CYRILLIC: { ranges: [[0x0400, 0x04FF]], route: 'pdfjs' },
  GREEK:    { ranges: [[0x0370, 0x03FF]], route: 'pdfjs' },
  CJK:      { ranges: [[0x4E00, 0x9FFF], [0x3000, 0x303F]], route: 'pdfjs' },

  // Always route directly to Vision OCR — never trust PDF.js for these
  INDIC:    { 
    ranges: [
      [0x0900, 0x097F], // Devanagari (Hindi)
      [0x0980, 0x09FF], // Bengali
      [0x0A00, 0x0A7F], // Gurmukhi (Punjabi)
      [0x0A80, 0x0AFF], // Gujarati
      [0x0B00, 0x0B7F], // Oriya
      [0x0B80, 0x0BFF], // Tamil
      [0x0C00, 0x0C7F], // Telugu
      [0x0C80, 0x0CFF], // Kannada
      [0x0D00, 0x0D7F], // Malayalam
    ], 
    route: 'vision' 
  },
  ARABIC:   { 
    ranges: [
      [0x0600, 0x06FF], // Arabic
      [0x0750, 0x077F], // Arabic Supplement
      [0x08A0, 0x08FF], // Arabic Extended-A
    ], 
    route: 'vision' 
  },
  SE_ASIAN: { 
    ranges: [
      [0x0E00, 0x0E7F], // Thai
      [0x1000, 0x109F], // Myanmar
      [0x1780, 0x17FF], // Khmer
    ], 
    route: 'vision' 
  },
};

/**
 * Detect the script family of a text sample and return routing strategy
 * @param {string} textSample - First ~200 chars from PDF.js quick extract
 * @returns {'pdfjs'|'vision'} - Routing decision
 */
export function detectPageScript(textSample) {
  if (!textSample || textSample.length === 0) return 'pdfjs';
  
  // Check for complex scripts that require Vision OCR
  for (const [family, config] of Object.entries(SCRIPT_FAMILIES)) {
    if (config.route === 'vision') {
      for (const [start, end] of config.ranges) {
        if ([...textSample].some(ch => {
          const cp = ch.codePointAt(0);
          return cp >= start && cp <= end;
        })) {
          return 'vision'; // Direct to Vision OCR
        }
      }
    }
  }
  
  return 'pdfjs'; // Default: try PDF.js
}

export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0
    });
    
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF loading timeout')), 60000)
      )
    ]);
    
    let fullText = '';
    const maxPages = pdf.numPages;
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Sort items by Y position (top to bottom) then X position (left to right)
        const sortedItems = textContent.items.sort((a, b) => {
          const yDiff = Math.abs(a.transform[5] - b.transform[5]);
          if (yDiff > 5) { // Different lines (5px threshold)
            return b.transform[5] - a.transform[5]; // Top to bottom
          }
          return a.transform[4] - b.transform[4]; // Left to right
        });
        
        // Group items into lines based on Y position
        const lines = [];
        let currentLine = [];
        let lastY = null;
        
        sortedItems.forEach(item => {
          const y = item.transform[5];
          
          if (lastY === null || Math.abs(y - lastY) > 5) {
            // New line
            if (currentLine.length > 0) {
              lines.push(currentLine.map(i => i.str).join(' ').trim());
            }
            currentLine = [item];
            lastY = y;
          } else {
            // Same line
            currentLine.push(item);
          }
        });
        
        // Add last line
        if (currentLine.length > 0) {
          lines.push(currentLine.map(i => i.str).join(' ').trim());
        }
        
        // Build page text with line numbers
        const pageText = lines
          .filter(line => line.length > 0)
          .map((line, idx) => `Line ${idx + 1}: ${line}`)
          .join('\n');
        
        if (pageText) {
          fullText += `\n\n=== PAGE ${pageNum} ===\n${pageText}\n=== END PAGE ${pageNum} ===`;
        }
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        fullText += `\n\n=== PAGE ${pageNum} ===\n[Error extracting text from this page]\n=== END PAGE ${pageNum} ===`;
      }
    }
    
    // Check if we got meaningful text
    const cleanText = fullText.replace(/===\s*(PAGE|END PAGE)\s*\d+\s*===/g, '').trim();
    if (cleanText.length < 100) {
      throw new Error('PDF appears to contain mostly images or unreadable text. Please try a text-based PDF or copy the content manually.');
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    
    // Provide more specific error messages
    if (error.message.includes('Setting up fake worker failed') || error.message.includes('Failed to fetch')) {
      throw new Error('PDF processing service is temporarily unavailable. Please copy and paste the text content from your PDF for now.');
    } else if (error.message.includes('Invalid PDF')) {
      throw new Error('This file appears to be corrupted or not a valid PDF. Please try a different file.');
    } else if (error.message.includes('mostly images')) {
      throw error; // Re-throw our custom message
    } else if (error.message.includes('timeout')) {
      throw new Error('PDF processing timed out. The file may be too complex. Please try a simpler PDF or copy the text manually.');
    } else {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
};

export const isPDFProcessable = (file) => {
  return file.type === 'application/pdf' && file.size < 50 * 1024 * 1024; // 50MB limit
};

// ─── New exports for the Omni-Content Pipeline (Phase 1) ───────────────────

/**
 * Compute the ratio of garbage characters in a string.
 *
 * Garbage characters are:
 *   - Non-printable characters below U+0020, except \t (U+0009), \n (U+000A), \r (U+000D)
 *   - The Unicode replacement character U+FFFD
 *   - Characters outside the Basic Multilingual Plane (code point > U+FFFF) that are NOT
 *     CJK Unified Ideographs or other common writing systems
 *
 * Valid Unicode ranges include:
 *   - Latin, Cyrillic, Greek, Arabic, Hebrew, Thai, etc. (U+0000-U+1FFF)
 *   - Indian scripts: Devanagari (U+0900–U+097F), Bengali (U+0980–U+09FF), 
 *     Gurmukhi (U+0A00–U+0A7F), Gujarati (U+0A80–U+0AFF), Oriya (U+0B00–U+0B7F),
 *     Tamil (U+0B80–U+0BFF), Telugu (U+0C00–U+0C7F), Kannada (U+0C80–U+0CFF),
 *     Malayalam (U+0D00–U+0D7F), Sinhala (U+0D80–U+0DFF)
 *   - Southeast Asian: Thai (U+0E00–U+0E7F), Lao (U+0E80–U+0EFF), Myanmar (U+1000–U+109F)
 *   - CJK Unified Ideographs (U+4E00–U+9FFF)
 *
 * @param {string} text
 * @returns {number} Ratio in [0, 1]; returns 0 for empty strings.
 */
export function computeGarbageRatio(text) {
  if (!text || text.length === 0) return 0;

  let garbageCount = 0;
  let totalCodePoints = 0;

  for (const char of text) {
    const cp = char.codePointAt(0);
    totalCodePoints++;

    // Check if it's garbage
    if (cp < 0x0020 && cp !== 0x0009 && cp !== 0x000A && cp !== 0x000D) {
      // Non-printable below U+0020 (except tab, newline, carriage return)
      garbageCount++;
    } else if (cp === 0xFFFD) {
      // Unicode replacement character
      garbageCount++;
    } else if (cp > 0xFFFF) {
      // Outside BMP — check if it's a valid extended character
      const isCJKExtA = cp >= 0x3400 && cp <= 0x4DBF;   // CJK Extension A
      const isCJKExtB = cp >= 0x20000 && cp <= 0x2A6DF; // CJK Extension B
      const isEmoji = cp >= 0x1F300 && cp <= 0x1F9FF;   // Emoji ranges
      const isSupplementary = cp >= 0x10000 && cp <= 0x10FFFF; // Other supplementary planes
      
      if (!isCJKExtA && !isCJKExtB && !isEmoji && !isSupplementary) {
        garbageCount++;
      }
    }
    // If we reach here and cp is in BMP (< 0xFFFF), it's valid
    // This includes Latin, Cyrillic, Arabic, Hebrew, Thai, Devanagari, Bengali, etc.
  }

  return totalCodePoints === 0 ? 0 : garbageCount / totalCodePoints;
}

/**
 * Classify a PDF page as 'good' or 'bad' based on its text items.
 *
 * Returns 'bad' if:
 *   - textItems is empty, OR
 *   - computeGarbageRatio(textItems.join('')) exceeds threshold (NOW 5%), OR
 *   - text contains complex scripts that PDF.js often mangles (Bengali, Devanagari, etc.)
 * Otherwise returns 'good'.
 *
 * @param {string[]} textItems  Raw text strings from PDF.js
 * @param {number}   threshold  Garbage ratio threshold (default 0.05 - STRICT!)
 * @returns {'good'|'bad'}
 */
export function classifyPage(textItems, threshold = 0.05) {
  if (!textItems || textItems.length === 0) return 'bad';
  const joined = textItems.join('');
  if (joined.length === 0) return 'bad';
  if (joined.trim().length < 20) return 'bad'; // Too short - likely empty
  
  // Check for corrupted/garbled Bengali text patterns
  // These patterns indicate font encoding issues where Bengali appears as Latin garbage
  const hasGarbledBengali = /[w†K‡b‡g‡Z‡e‡v‡i„]/.test(joined);
  if (hasGarbledBengali) {
    // This is clearly corrupted Bengali - force Vision OCR
    return 'bad';
  }
  
  // Check for complex scripts that often get garbled by PDF.js
  // These scripts have complex rendering rules and ligatures that PDF.js may not handle correctly
  const hasIndic = /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(joined);
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(joined);
  const hasSEAsian = /[\u0E00-\u0E7F\u1000-\u109F]/.test(joined);
  
  if (hasIndic || hasArabic || hasSEAsian) {
    // For complex scripts - prefer vision OCR unless text is perfect
    // STRICT threshold: if ANY garbage detected (>5%), use OCR
    const ratio = computeGarbageRatio(joined);
    if (ratio > 0.05) {
      return 'bad'; // Force OCR for complex scripts with even 5% garbage
    }
  }
  
  // For other scripts, use the strict 5% threshold (was 30%)
  return computeGarbageRatio(joined) > threshold ? 'bad' : 'good';
}

/**
 * Wrap page content in the standard page-block format.
 *
 * @param {number} pageNum
 * @param {string} content
 * @returns {string}
 */
export function wrapPageContent(pageNum, content) {
  return `=== PAGE ${pageNum} ===\n${content}\n=== END PAGE ${pageNum} ===`;
}

const OCR_PROMPT = `You are a PDF page OCR system. Extract ALL text from this page image.

Rules:
1. Preserve reading order (top to bottom, left to right; right to left for Arabic/Hebrew)
2. Format headings with markdown: # ## ###
3. Format lists with - or 1. 2. 3.
4. Format tables with | pipe | syntax
5. Format math with LaTeX: $inline$ or $$block$$
6. Preserve paragraph breaks with blank lines
7. If this page contains ONLY images/figures with no text, respond with: [IMAGE_ONLY_PAGE]
8. Do NOT add commentary, do NOT describe figures here — only extract text

Return the extracted text and nothing else.`;

/**
 * Main PDF extraction pipeline with Vision Fallback and Cache Support (Pipeline v4).
 *
 * @param {ArrayBuffer} arrayBuffer  Raw PDF binary data
 * @param {Object}      options
 * @param {Function}    [options.onProgress]       Called once per page: ({ stage, pageNum, method, charCount, garbageRatio }) => void
 * @param {Function}    [options.processImage]     Gemini Vision caller: (base64, prompt) => Promise<string>
 * @param {Function}    [options.checkCache]       Cache lookup: (cacheKey) => Promise<object|null>
 * @param {number}      [options.garbageThreshold=0.3]
 * @param {number}      [options.canvasScale=1.5]
 * @returns {Promise<object>} Extraction result: { text, cacheKey, manifest, pageResults, cached }
 * @throws {Error} If no page yields non-placeholder content
 */
export async function extractText(arrayBuffer, options = {}) {
  const {
    onProgress = () => {},
    processImage = null,
    checkCache = null,
    garbageThreshold = 0.3,
    canvasScale = 1.5,
  } = options;

  // ─── Stage 1: Generate Cache Key ─────────────────────────────────────────
  
  const cacheKey = await getCacheKey(arrayBuffer);
  console.log(`[PDF Pipeline] Generated cache key: ${cacheKey}`);
  
  // ─── Stage 2: Check Cache ────────────────────────────────────────────────
  
  if (checkCache) {
    onProgress({ stage: 'validating', percentComplete: 5 });
    
    const cachedResource = await checkCache(cacheKey);
    if (cachedResource && cachedResource.extractedText) {
      console.log('[PDF Pipeline] Cache HIT - returning cached content');
      
      // Parse cached data
      const extractedPages = typeof cachedResource.extractedText === 'string'
        ? JSON.parse(cachedResource.extractedText)
        : cachedResource.extractedText;
      
      const manifest = cachedResource.manifest 
        ? (typeof cachedResource.manifest === 'string' 
            ? JSON.parse(cachedResource.manifest) 
            : cachedResource.manifest)
        : null;
      
      const text = extractedPages.map(p => 
        wrapPageContent(p.pageNum, p.text)
      ).join('\n\n');
      
      onProgress({ stage: 'storing', percentComplete: 100 });
      
      return {
        text,
        cacheKey,
        manifest,
        pageResults: extractedPages,
        cached: true,
        figureRegistry: cachedResource.figureRegistry || null,
      };
    }
    
    console.log('[PDF Pipeline] Cache MISS - proceeding with extraction');
  }
  
  // ─── Stage 3: Load PDF Document ──────────────────────────────────────────

  onProgress({ stage: 'screening', percentComplete: 10 });

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;
  const pageResults = [];

  // ─── Stage 3A: Parallel Processing Queue (Priority 6) ────────────────────
  
  // Process pages with a queue that limits concurrent Vision OCR to 2 slots
  // This prevents API rate limiting while maximizing throughput
  const MAX_CONCURRENT_VISION = 2;
  const VISION_RATE_LIMIT_DELAY = 1000; // 1 second delay between vision requests
  let activeVisionOCR = 0;
  let lastVisionCallTime = 0;
  const visionQueue = [];
  
  /**
   * Process a single page (PDF.js or Vision OCR)
   */
  const processPage = async (pageNum) => {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map(item => item.str);

    const classification = classifyPage(textItems, garbageThreshold);
    const garbageRatio = textItems.length > 0
      ? computeGarbageRatio(textItems.join(''))
      : 0;

    let content;
    let method;
    let isPlaceholder = false;

    if (classification === 'good') {
      // PDF.js path (fast, no queue needed)
      content = textItems.join('');
      method = 'pdfjs';
    } else {
      // Vision OCR path (needs queue management + rate limiting)
      method = 'vision';
      
      // Wait for available Vision OCR slot
      while (activeVisionOCR >= MAX_CONCURRENT_VISION) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Rate limiting: ensure minimum delay between requests
      const now = Date.now();
      const timeSinceLastCall = now - lastVisionCallTime;
      if (timeSinceLastCall < VISION_RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, VISION_RATE_LIMIT_DELAY - timeSinceLastCall));
      }
      lastVisionCallTime = Date.now();
      
      activeVisionOCR++;
      
      try {
        let base64 = null;

        // Render page to JPEG
        try {
          const viewport = page.getViewport({ scale: canvasScale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const canvasContext = canvas.getContext('2d');

          await page.render({ canvasContext, viewport }).promise;
          
          // Use JPEG compression for 5x payload reduction (Priority 5)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        } catch (canvasError) {
          console.warn(`[pdfProcessor] Canvas render failed for page ${pageNum}:`, canvasError);
          base64 = null;
        }

        if (base64 && processImage) {
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Vision OCR timeout (30s)')), 30000)
            );
            content = await Promise.race([
              processImage(base64, OCR_PROMPT),
              timeoutPromise,
            ]);
          } catch (visionError) {
            console.warn(`[pdfProcessor] Vision OCR failed for page ${pageNum}:`, visionError);
            
            // Fallback to PDF.js text even if it's garbled (better than nothing)
            if (textItems.length > 0) {
              console.log(`[pdfProcessor] Using garbled PDF.js text as fallback for page ${pageNum}`);
              content = textItems.join('');
              method = 'pdfjs_fallback';
            } else {
              content = `[Page ${pageNum}: image-only — could not extract text]`;
              isPlaceholder = true;
            }
          }
        } else {
          content = `[Page ${pageNum}: image-only — could not extract text]`;
          isPlaceholder = true;
        }
      } finally {
        activeVisionOCR--;
      }
    }

    // Progress reporting
    const percentComplete = Math.floor(10 + (pageNum / numPages) * 75); // 10-85%
    onProgress({
      stage: method === 'vision' ? 'ocr' : 'extracting',
      pageNum,
      method,
      charCount: content.length,
      garbageRatio,
      totalPages: numPages,
      percentComplete,
    });

    return { 
      pageNum,
      text: content,
      method,
      isPlaceholder,
      charCount: content.length,
    };
  };

  // ─── Stage 3B: Process All Pages (with overlap for Vision OCR) ───────────
  
  // Create array of page processing promises
  const pagePromises = [];
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    pagePromises.push(processPage(pageNum));
  }
  
  // Wait for all pages to complete
  const results = await Promise.all(pagePromises);
  
  // Sort results by page number (they may complete out of order)
  pageResults.push(...results.sort((a, b) => a.pageNum - b.pageNum));

  // Check if every page is a placeholder
  const allPlaceholders = pageResults.every(r => r.isPlaceholder);
  if (allPlaceholders) {
    throw new Error('PDF extraction failed: no readable content found in any page');
  }

  // ─── Stage 4: Build Manifest ─────────────────────────────────────────────
  
  onProgress({ stage: 'indexing', percentComplete: 85 });
  
  // Import keyword extraction from tokenBudget module
  const { extractKeywords } = await import('./tokenBudget.js');
  
  const manifest = pageResults.map(p => ({
    pageNum: p.pageNum,
    method: p.method,
    charCount: p.charCount,
    hasFigures: false, // Will be updated in Stage 4.5
    figureIds: [],     // Will be populated in Stage 4.5
    keywords: extractKeywords(p.text, 10),
  }));

  // ─── Stage 4.5: Build Figure Registry (if processImage available) ─────────
  
  let figureRegistry = null;
  
  if (processImage) {
    try {
      onProgress({ stage: 'figures', percentComplete: 87 });
      
      const { buildFigureRegistry } = await import('./figureRegistry.js');
      
      figureRegistry = await buildFigureRegistry(
        pdf, 
        pageResults, 
        processImage,
        ({ pageNum, figuresFound, totalFigures }) => {
          onProgress({ 
            stage: 'figures', 
            pageNum,
            figuresFound: totalFigures,
            percentComplete: 87 + Math.floor((pageNum / numPages) * 5), // 87-92%
          });
        }
      );
      
      // Update manifest with figure data
      for (const pageResult of pageResults) {
        const manifestPage = manifest.find(m => m.pageNum === pageResult.pageNum);
        if (manifestPage) {
          manifestPage.hasFigures = pageResult.hasFigures || false;
          manifestPage.figureIds = pageResult.figureIds || [];
        }
      }
      
      console.log(`[PDF Pipeline] Figure registry built: ${Object.keys(figureRegistry).length} figures`);
    } catch (figError) {
      console.warn('[PDF Pipeline] Figure registry building failed (non-fatal):', figError.message);
      // Don't block extraction on figure detection failure
      figureRegistry = null;
    }
  }

  // ─── Stage 5: Format Output ──────────────────────────────────────────────
  
  const text = pageResults.map(p => 
    wrapPageContent(p.pageNum, p.text)
  ).join('\n\n');
  
  onProgress({ stage: 'storing', percentComplete: 95 });

  return {
    text,
    cacheKey,
    manifest,
    pageResults,
    cached: false,
    figureRegistry, // Now populated with actual figures (or null if disabled/failed)
    processingVersion: 4, // PDF Pipeline v4
  };
}