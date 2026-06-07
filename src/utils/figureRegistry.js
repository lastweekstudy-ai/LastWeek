/**
 * figureRegistry.js — Figure detection and registry building for PDF Pipeline v4
 * 
 * This module detects and catalogs all figures, charts, diagrams, tables, and images
 * in PDF documents using Gemini Vision OCR.
 * 
 * Part of PDF Pipeline v4 (Stage 4)
 */

import { pdfjs as pdfjsLib } from 'react-pdf';

// ─── Figure Detection Prompt ────────────────────────────────────────────────

const FIGURE_DETECTION_PROMPT = `Analyze this PDF page image for visual content (figures, charts, diagrams, tables, images).

For EACH visual element you find, provide a JSON object with:
{
  "id": "fig-{pageNum}-{index}",
  "type": "chart|diagram|table|illustration|photo|map|equation",
  "caption": "exact caption text from the document, if visible",
  "title": "short descriptive title you assign (max 8 words)",
  "description": "detailed description of what this figure shows (2-4 sentences)",
  "data_summary": "for charts/tables: describe the data, trends, key values. For others: null",
  "position": "top|middle|bottom",
  "page": {pageNum}
}

Respond with a JSON array. If no figures exist on this page, respond with: []
Do not include markdown code fences. Raw JSON only.`;

// ─── Page Figure Detection ──────────────────────────────────────────────────

/**
 * Check if a PDF page contains figures/images using operator list inspection
 * @param {object} pdf - PDF.js document object
 * @param {number} pageNum - Page number to check
 * @returns {Promise<boolean>} True if page has figures
 */
export async function pageHasFigures(pdf, pageNum) {
  try {
    const page = await pdf.getPage(pageNum);
    const ops = await page.getOperatorList();
    
    // Image operation codes from PDF.js
    const IMAGE_OPS = [
      pdfjsLib.OPS.paintImageXObject,
      pdfjsLib.OPS.paintInlineImageXObject,
      pdfjsLib.OPS.paintImageMaskXObject,
    ];
    
    return ops.fnArray.some(op => IMAGE_OPS.includes(op));
  } catch (error) {
    console.warn(`[figureRegistry] Failed to check page ${pageNum} for figures:`, error.message);
    return false;
  }
}

/**
 * Render a PDF page to base64-encoded image for Vision OCR
 * @param {object} page - PDF.js page object
 * @param {number} scale - Rendering scale (default 1.5 for clarity)
 * @param {string} format - 'png' or 'jpeg'
 * @param {number} quality - JPEG quality 0-1 (default 0.85)
 * @returns {Promise<string>} Base64-encoded image without data URL prefix
 */
export async function renderPageToBase64(page, scale = 1.5, format = 'jpeg', quality = 0.85) {
  try {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    
    await page.render({ 
      canvasContext: context, 
      viewport 
    }).promise;
    
    // Use JPEG for 5x compression vs PNG (Pipeline v4 Priority 5)
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mimeType, quality);
    
    return dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
  } catch (error) {
    console.error('[figureRegistry] Failed to render page:', error.message);
    throw error;
  }
}

/**
 * Detect figures on a single page using Gemini Vision
 * @param {string} base64Image - Base64-encoded page image
 * @param {number} pageNum - Page number
 * @param {Function} processImage - Gemini Vision caller: (base64, prompt) => Promise<string>
 * @returns {Promise<Array>} Array of figure objects
 */
export async function detectFigures(base64Image, pageNum, processImage) {
  try {
    const prompt = FIGURE_DETECTION_PROMPT.replace(/{pageNum}/g, pageNum);
    const response = await processImage(base64Image, prompt);
    
    // Parse JSON response
    let figures = [];
    try {
      // Try to parse as JSON
      figures = JSON.parse(response.trim());
    } catch (parseError) {
      // Try to extract JSON from markdown code fences
      const jsonMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        figures = JSON.parse(jsonMatch[1]);
      } else if (response.trim() === '[]') {
        figures = [];
      } else {
        console.warn(`[figureRegistry] Failed to parse figure detection response for page ${pageNum}`);
        return [];
      }
    }
    
    // Validate and normalize figures
    if (!Array.isArray(figures)) {
      console.warn(`[figureRegistry] Figure detection returned non-array for page ${pageNum}`);
      return [];
    }
    
    return figures.map((fig, index) => ({
      id: fig.id || `fig-${pageNum}-${index + 1}`,
      type: fig.type || 'illustration',
      caption: fig.caption || null,
      title: fig.title || `Figure ${pageNum}-${index + 1}`,
      description: fig.description || 'No description available',
      data_summary: fig.data_summary || null,
      position: fig.position || 'middle',
      page: pageNum,
    }));
  } catch (error) {
    console.error(`[figureRegistry] Figure detection failed for page ${pageNum}:`, error.message);
    return [];
  }
}

// ─── Figure Registry Builder ────────────────────────────────────────────────

/**
 * Build complete figure registry for a PDF
 * 
 * @param {object} pdf - PDF.js document object
 * @param {Array} pageResults - Page extraction results from extractText()
 * @param {Function} processImage - Gemini Vision caller
 * @param {Function} onProgress - Progress callback: ({ pageNum, figuresFound }) => void
 * @returns {Promise<object>} Figure registry: { 'fig-1-1': {...}, 'fig-2-1': {...}, ... }
 */
export async function buildFigureRegistry(pdf, pageResults, processImage, onProgress = () => {}) {
  const registry = {};
  let totalFigures = 0;
  
  for (const pageResult of pageResults) {
    const { pageNum, method } = pageResult;
    
    // Check if page has figures
    let shouldDetectFigures = false;
    
    // Always check image-only pages
    if (method === 'vision' && pageResult.text === '[IMAGE_ONLY_PAGE]') {
      shouldDetectFigures = true;
    } else {
      // Check if page has embedded images using operator detection
      const hasFigs = await pageHasFigures(pdf, pageNum);
      if (hasFigs) {
        shouldDetectFigures = true;
      }
    }
    
    if (!shouldDetectFigures) {
      continue;
    }
    
    try {
      // Render page for figure detection
      const page = await pdf.getPage(pageNum);
      const base64 = await renderPageToBase64(page, 1.5, 'jpeg', 0.85);
      
      // Detect figures using Gemini Vision
      const figures = await detectFigures(base64, pageNum, processImage);
      
      // Add to registry
      for (const fig of figures) {
        registry[fig.id] = fig;
        totalFigures++;
      }
      
      // Update page result with figure IDs
      pageResult.figureIds = figures.map(f => f.id);
      pageResult.hasFigures = figures.length > 0;
      
      onProgress({ 
        pageNum, 
        figuresFound: figures.length,
        totalFigures,
      });
    } catch (error) {
      console.error(`[figureRegistry] Failed to process page ${pageNum}:`, error.message);
      // Don't block extraction on figure detection failure
      pageResult.figureIds = [];
      pageResult.hasFigures = false;
    }
  }
  
  console.log(`[figureRegistry] Built registry with ${totalFigures} figures across ${Object.keys(registry).length} pages`);
  
  return registry;
}

/**
 * Get figure by ID from registry
 * @param {object} registry - Figure registry
 * @param {string} figureId - Figure ID (e.g., 'fig-3-1')
 * @returns {object|null} Figure object or null
 */
export function getFigure(registry, figureId) {
  return registry[figureId] || null;
}

/**
 * Get all figures on a specific page
 * @param {object} registry - Figure registry
 * @param {number} pageNum - Page number
 * @returns {Array} Array of figure objects
 */
export function getFiguresOnPage(registry, pageNum) {
  return Object.values(registry).filter(fig => fig.page === pageNum);
}

/**
 * Search figures by text (title, caption, description)
 * @param {object} registry - Figure registry
 * @param {string} searchText - Text to search for
 * @returns {Array} Array of matching figure objects
 */
export function searchFigures(registry, searchText) {
  const query = searchText.toLowerCase();
  return Object.values(registry).filter(fig => 
    fig.title?.toLowerCase().includes(query) ||
    fig.caption?.toLowerCase().includes(query) ||
    fig.description?.toLowerCase().includes(query)
  );
}

export default {
  pageHasFigures,
  renderPageToBase64,
  detectFigures,
  buildFigureRegistry,
  getFigure,
  getFiguresOnPage,
  searchFigures,
};
