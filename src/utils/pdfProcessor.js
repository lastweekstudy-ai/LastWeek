import { pdfjs as pdfjsLib } from 'react-pdf';

// Configure PDF.js worker - use the worker from public folder
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
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
 *   - computeGarbageRatio(textItems.join('')) exceeds threshold, OR
 *   - text contains complex scripts that PDF.js often mangles (Bengali, Devanagari, etc.)
 * Otherwise returns 'good'.
 *
 * @param {string[]} textItems  Raw text strings from PDF.js
 * @param {number}   threshold  Garbage ratio threshold (default 0.3)
 * @returns {'good'|'bad'}
 */
export function classifyPage(textItems, threshold = 0.3) {
  if (!textItems || textItems.length === 0) return 'bad';
  const joined = textItems.join('');
  if (joined.length === 0) return 'bad';
  
  // Check for complex scripts that often get garbled by PDF.js
  // These scripts have complex rendering rules and ligatures that PDF.js may not handle correctly
  const hasComplexScript = /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0E00-\u0E7F\u1000-\u109F\u0600-\u06FF\u0750-\u077F]/.test(joined);
  
  if (hasComplexScript) {
    // For Indic scripts, Arabic, Thai, Myanmar - prefer vision OCR
    // Only use text extraction if the text looks clean (very low garbage ratio)
    return computeGarbageRatio(joined) > 0.1 ? 'bad' : 'good';
  }
  
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

const OCR_PROMPT =
  'Convert this PDF page image to Markdown. Preserve headings, lists, tables, and mathematical expressions as Markdown. Return plain-text paragraphs for any content that cannot be mapped to those structures.';

/**
 * Main PDF extraction pipeline with Vision Fallback.
 *
 * @param {ArrayBuffer} arrayBuffer  Raw PDF binary data
 * @param {Object}      options
 * @param {Function}    [options.onProgress]       Called once per page: ({ pageNum, method, charCount, garbageRatio }) => void
 * @param {Function}    [options.processImage]     Gemini Vision caller: (base64, prompt) => Promise<string>
 * @param {number}      [options.garbageThreshold=0.3]
 * @param {number}      [options.canvasScale=1.5]
 * @returns {Promise<string>} Combined extracted text
 * @throws {Error} If no page yields non-placeholder content
 */
export async function extractText(arrayBuffer, options = {}) {
  const {
    onProgress = () => {},
    processImage = null,
    garbageThreshold = 0.3,
    canvasScale = 1.5,
  } = options;

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;
  const pageResults = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
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
      content = textItems.join('');
      method = 'pdfjs';
    } else {
      // Vision Fallback path
      method = 'vision';
      let base64 = null;

      // Attempt canvas render
      try {
        const viewport = page.getViewport({ scale: canvasScale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const canvasContext = canvas.getContext('2d');

        await page.render({ canvasContext, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');
        base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      } catch (canvasError) {
        console.warn(`[pdfProcessor] Canvas render failed for page ${pageNum}:`, canvasError);
        base64 = null;
      }

      if (base64 && processImage) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Vision Fallback timeout (30s)')), 30000)
          );
          content = await Promise.race([
            processImage(base64, OCR_PROMPT),
            timeoutPromise,
          ]);
        } catch (visionError) {
          console.warn(`[pdfProcessor] Vision Fallback failed for page ${pageNum}:`, visionError);
          content = `[Page ${pageNum}: image-only — could not extract text]`;
          isPlaceholder = true;
        }
      } else {
        content = `[Page ${pageNum}: image-only — could not extract text]`;
        isPlaceholder = true;
      }
    }

    const wrapped = wrapPageContent(pageNum, content);

    onProgress({
      pageNum,
      method,
      charCount: content.length,
      garbageRatio,
      totalPages: numPages,
    });

    pageResults.push({ wrapped, isPlaceholder });
  }

  // Check if every page is a placeholder
  const allPlaceholders = pageResults.every(r => r.isPlaceholder);
  if (allPlaceholders) {
    throw new Error('PDF extraction failed: no readable content found in any page');
  }

  return pageResults.map(r => r.wrapped).join('\n\n');
}