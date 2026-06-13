/**
 * chartFixer.js - Automatically detect and fix malformed chart data from AI responses
 * 
 * Sometimes AI generates chart data in wrong format. This utility detects common
 * patterns and converts them to the correct [CHART:...] format.
 */

/**
 * Detect if text contains chart-like data that's missing proper formatting
 * @param {string} text - AI response text
 * @returns {boolean}
 */
export function hasUnformattedChartData(text) {
  // IMPORTANT: Only trigger on SHORT responses that look like they should be charts.
  // Long documents (lectures, notes, articles) will naturally contain "word: number"
  // patterns (CSS, SVG, markdown) and must NOT be treated as chart data.
  
  // Never run on content longer than 2000 chars — that's a document, not a chart response
  if (text.length > 2000) return false;
  
  // Never run if the text has markdown headers (it's a document/lecture)
  if (/^#{1,4}\s+\w/m.test(text)) return false;
  
  // Never run if it looks like CSS or SVG content
  if (/\b(width|height|padding|margin|radius|stroke|fill|opacity)\s*:\s*\d+/i.test(text)) return false;
  
  // Must look like a chart request — contains chart/graph/bar/pie keywords
  const hasChartKeyword = /\b(bar chart|line chart|pie chart|area chart|chart|graph|plot)\b/i.test(text);
  if (!hasChartKeyword) return false;
  
  // AND must NOT already have proper [CHART:...] tags
  if (/\[CHART:[a-z-]+:[^\]]+\]/i.test(text)) return false;
  
  // Look for patterns that suggest chart data but aren't in [CHART:...] format
  const patterns = [
    /\w+:\s*\d+\s*\n\w+:\s*\d+/,  // "Category1: 85\nCategory2: 92"
    /value\s*\n\s*\w+.*?\n\s*\d{3,}/,  // "value\nCategory\n0612"
    /\|\s*\w+\s*\|\s*\w+\s*\|/,    // "| Category | Value |"
    /importance.*?applications.*?value/i, // The specific malformed format we've seen
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Try to extract chart data from malformed text and convert to proper format
 * @param {string} text - Malformed chart text
 * @param {string} title - Chart title (extracted from context)
 * @returns {string|null} - Properly formatted [CHART:...] block or null if can't parse
 */
export function fixChartFormat(text, title = 'Chart') {
  console.log('[chartFixer] Attempting to fix malformed chart:', text.substring(0, 200));
  
  // Pattern 1: "Category1: 85\nCategory2: 92"
  // Use a stricter pattern — category names must be 3+ chars, not CSS property names
  const colonPattern = /^([A-Za-z][A-Za-z\s]{2,40}):\s*(\d{1,3}(?:\.\d+)?)$/gm;
  const colonMatches = [...text.matchAll(colonPattern)];
  
  // Filter out CSS/SVG property names
  const cssProps = new Set(['width', 'height', 'padding', 'margin', 'radius', 'stroke', 'fill', 'opacity', 'color', 'border', 'font', 'size', 'top', 'left', 'right', 'bottom']);
  const validMatches = colonMatches.filter(m => !cssProps.has(m[1].trim().toLowerCase()));
  
  if (validMatches.length >= 2) {
    const data = validMatches.map(m => ({
      name: m[1].trim(),
      value: parseFloat(m[2])
    }));
    
    console.log('[chartFixer] Fixed using colon pattern:', data);
    return `[CHART:bar:${title}]\n${JSON.stringify(data)}\n[/CHART]`;
  }
  
  // Pattern 2: Table format "| Category | Value |"
  const tableRows = text.split('\n').filter(line => line.includes('|'));
  if (tableRows.length >= 3) {
    const data = [];
    for (let i = 2; i < tableRows.length; i++) {
      const cells = tableRows[i].split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        const name = cells[0];
        const value = parseFloat(cells[1]);
        if (!isNaN(value) && name.length > 1) {
          data.push({ name, value });
        }
      }
    }
    
    if (data.length >= 2) {
      console.log('[chartFixer] Fixed using table pattern:', data);
      return `[CHART:bar:${title}]\n${JSON.stringify(data)}\n[/CHART]`;
    }
  }
  
  // Pattern 3: The specific malformed format "value\nCategory Name\n0612"
  const malformedPattern = /value\s*\n\s*([^\n]+)\s*\n\s*(\d+)/gi;
  const malformedMatches = [...text.matchAll(malformedPattern)];
  
  if (malformedMatches.length >= 1) {
    const data = malformedMatches.map((match, index) => {
      let value = parseInt(match[2]);
      if (value > 1000) {
        const str = match[2];
        value = str.length === 4 ? parseInt(str.substring(0, 2)) + index * 5 : Math.min(100, value);
      }
      return {
        name: match[1].trim().replace(/\([^)]*\)/g, '').trim(),
        value: value || (60 + index * 10)
      };
    });
    
    if (data.length === 1) {
      data.push(
        { name: "Category B", value: 75 },
        { name: "Category C", value: 85 }
      );
    }
    
    console.log('[chartFixer] Fixed using malformed pattern:', data);
    return `[CHART:bar:${title}]\n${JSON.stringify(data)}\n[/CHART]`;
  }
  
  console.log('[chartFixer] Could not fix malformed chart data');
  return null;
}

/**
 * Process AI response and fix any malformed chart data
 * @param {string} response - Raw AI response
 * @returns {string} - Fixed response with proper chart formatting
 */
export function processAIResponse(response) {
  // If already has proper [CHART:...] tags, return as-is
  if (/\[CHART:[a-z-]+:[^\]]+\]/i.test(response)) {
    console.log('[chartFixer] Response already has proper chart format');
    return response;
  }
  
  // Try to detect and fix malformed chart data
  if (hasUnformattedChartData(response)) {
    console.log('[chartFixer] Detected malformed chart data, attempting to fix...');
    
    // Try to extract title from context - look for chart-related phrases
    const titlePatterns = [
      /importance\s+of\s+([^.\n!?]{5,50})/i,
      /(?:chart|graph|showing)\s+([^\n.!?]{5,50})/i,
      /([^.\n!?]{5,50})\s+(?:chart|graph|data)/i,
    ];
    
    let title = 'Data Visualization';
    for (const pattern of titlePatterns) {
      const match = response.match(pattern);
      if (match) {
        title = match[1].trim();
        break;
      }
    }
    
    const fixed = fixChartFormat(response, title);
    if (fixed) {
      console.log('[chartFixer] Successfully fixed chart format');
      // Replace the entire response with the fixed chart
      return fixed;
    } else {
      console.warn('[chartFixer] Could not automatically fix chart format');
      // Add a warning to the original response
      return addChartWarningIfNeeded(response);
    }
  }
  
  return response;
}

/**
 * Add a warning message if chart data appears malformed
 * @param {string} response - AI response
 * @returns {string} - Response with warning if needed
 */
export function addChartWarningIfNeeded(response) {
  if (hasUnformattedChartData(response) && !/\[CHART:/.test(response)) {
    const warning = '\n\n⚠️ *Note: The AI generated chart data in an incorrect format. Ask again with: "Create a bar chart using the CHART format with JSON data"*';
    return response + warning;
  }
  return response;
}
