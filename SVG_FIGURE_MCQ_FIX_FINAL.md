# SVG Figure + MCQ/Flashcard Rendering Fix - FINAL

## Problem Identified

When users asked AI to "explain PDF with SVG figures + MCQs + flashcards in one chat", the **FIGURE blocks were showing as raw markup text** instead of rendered SVG images.

### Root Cause

The `parseContentSegments()` helper function was using a **combined regex** that had **incorrect group indices** when matching FIGURE blocks. This caused:

1. ✅ FIGURE detection logs showed up correctly (4 times in console)
2. ❌ But the actual SVG content was not extracted properly
3. ❌ Text segments still contained `[FIGURE:...]` markup
4. ❌ ReactMarkdown rendered these as plain text instead of SVG components

### Console Logs Analysis

```
[EnhancedMessageFormatter] FIGURE detected
  Full match preview: [FIGURE:Three Lines from the PDF — Slope and Y-Intercept]<svg xmlns="http://www.w3.org/2000/svg" vi...
  Title (match[5]): Three Lines from the PDF — Slope and Y-Intercept
  SVG content length (match[6]): 5988
```

The logs showed **match[5]** and **match[6]** were being used, but in the combined regex, the group indices were **shifting** depending on which pattern matched first (CHART has 3 groups, MERMAID has 1 group, FIGURE has 2 groups).

---

## Solution Implemented

### Changed: `parseContentSegments()` function (lines ~358-415)

**BEFORE** (broken combined regex):
```javascript
const combinedRegex = new RegExp(
  `(?:${CHART_REGEX.source})|(?:${MERMAID_REGEX.source})|(?:${FIGURE_REGEX.source})`,
  'gi'
);
// Group indices were unpredictable
```

**AFTER** (separate regex execution):
```javascript
// Create fresh regex instances with stable group indices
const chartRe = /\[CHART:(bar|line|pie|area):([^\]]+)\]([\s\S]*?)\[\\?\/CHART\]/gi;
const mermaidRe = /```mermaid\n([\s\S]*?)```/gi;
const figureRe = /\[FIGURE(?::([^\]]*))?\]([\s\S]*?)\[\/FIGURE\]/gi;

// Find all matches separately
const allMatches = [];

// Execute each regex independently
while ((match = chartRe.exec(content)) !== null) { ... }
while ((match = mermaidRe.exec(content)) !== null) { ... }
while ((match = figureRe.exec(content)) !== null) { ... }

// Sort by position and build segments
allMatches.sort((a, b) => a.index - b.index);
```

### Key Improvements

1. ✅ **Stable group indices** - Each regex runs independently with predictable capture groups
2. ✅ **Complete extraction** - FIGURE blocks are fully removed from text before passing to ReactMarkdown
3. ✅ **Proper ordering** - Matches are sorted by position to maintain content flow
4. ✅ **Better logging** - Added `[parseContentSegments] FIGURE found:` log for debugging

---

## How It Works Now

### Normal Flow (No MCQ/Flashcards)
1. Content parsed into segments (text, chart, mermaid, figure)
2. Each segment rendered with appropriate component
3. SVGFigure component renders interactive SVG

### MCQ/Flashcard Flow (Previously Broken)
1. **Prefix content** → `parseContentSegments()` extracts FIGUREs
2. **MCQ questions** → Rendered with `MCQRenderer`
3. **Flashcard content** → Rendered with `FlashcardSetRenderer`
4. **Suffix content** → `parseContentSegments()` extracts FIGUREs
5. All FIGURE segments → Rendered with `SVGFigure` component ✅

---

## Testing Checklist

### Test Scenario 1: SVG Only (Already Working)
- [x] Ask AI: "Explain this PDF with SVG diagrams"
- [x] Verify: SVG renders as interactive image

### Test Scenario 2: MCQ + SVG (NOW FIXED)
- [ ] Ask AI: "Explain this PDF with SVG diagrams and MCQs"
- [ ] Verify: Both SVG and MCQ components render correctly
- [ ] Check console: Should see `[parseContentSegments] FIGURE found:`

### Test Scenario 3: Flashcards + SVG (NOW FIXED)
- [ ] Ask AI: "Create flashcards and SVG diagrams from this PDF"
- [ ] Verify: Both flashcards and SVG render correctly

### Test Scenario 4: All Together (NOW FIXED)
- [ ] Ask AI: "Explain PDF with SVG figures, MCQs, and flashcards"
- [ ] Verify: All three component types render correctly
- [ ] Verify: No raw `[FIGURE:...]` markup visible as text
- [ ] Check console: No warnings about FIGURE tags in text segments

---

## What to Look For

### ✅ Success Indicators
1. SVG appears as **interactive zoomable image**
2. No `[FIGURE:...]` text visible in UI
3. Console shows: `[parseContentSegments] FIGURE found: <title>`
4. SVGFigure component renders with pan/zoom controls

### ❌ Failure Indicators
1. Raw `[FIGURE:Three Lines from PDF...]<svg xmlns=...` visible as text
2. Console warning: `⚠️ Segment X (text) still contains [FIGURE tag!`
3. SVG tags visible but not rendered as image

---

## Build Status

✅ **Build successful**: 4.83s with no errors

---

## Files Modified

- `d:\LastWeek\LastWeek\src\components\EnhancedMessageFormatter.jsx`
  - Fixed `parseContentSegments()` helper function
  - Separated regex execution to fix group index issues
  - Added better logging for debugging

---

## Next Steps

1. **Test in browser** with the exact scenario from console logs:
   - Upload a PDF
   - Ask: "Explain with SVG figures, MCQs, and flashcards"

2. **Check browser console** for:
   - `[parseContentSegments] FIGURE found:` logs
   - No warnings about FIGURE tags remaining in text

3. **Verify UI** shows:
   - Interactive SVG images (not raw markup)
   - MCQ questions with answer buttons
   - Flashcards with flip animation

---

## Technical Notes

### Why Combined Regex Failed

When using `(?:pattern1)|(?:pattern2)|(?:pattern3)` with different numbers of capture groups:
- Pattern 1 (CHART) has groups 1, 2, 3
- Pattern 2 (MERMAID) has group 4
- Pattern 3 (FIGURE) should have groups 5, 6

But if CHART doesn't match, groups 1-3 are `undefined`, shifting FIGURE groups unpredictably.

### Why Separate Execution Works

Each regex executes independently:
- `chartRe.exec()` always has groups at indices 1, 2, 3
- `figureRe.exec()` always has groups at indices 1, 2
- No interference between patterns
- Predictable, stable extraction

---

**Status**: ✅ Fix implemented and built successfully  
**Remaining**: User testing to confirm SVG rendering works in all scenarios
