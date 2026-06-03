# SVG Figure Rendering Issue - Debug Guide

## Issue Report
User reported: "reply is giving svg markups instead of svg image"

This means SVG content is being displayed as raw text markup instead of being rendered as an interactive image.

## What Should Happen

When AI generates a response with SVG figures, they should appear as:
- **Interactive zoomable/pannable images** with a dark background
- **Toolbar controls** (zoom in/out, fit, download)
- **Smooth scrolling and dragging**

Instead, users are seeing:
- Raw SVG XML markup as text
- `<svg>...</svg>` tags visible in the message

## Changes Made for Debugging

### 1. Added Console Logging
**File**: `src/components/EnhancedMessageFormatter.jsx`

Added debug logging to track FIGURE tag parsing:
```javascript
console.log('[EnhancedMessageFormatter] FIGURE match:', {
  fullMatch: fullMatch.substring(0, 100),
  figTitle,
  svgContentLength: svgContent?.length,
  svgContentPreview: svgContent?.substring(0, 100)
});
```

### 2. Build Status
✅ **Build Successful** - 4.86s, 0 errors

## How to Debug

### Step 1: Check Browser Console
1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Send a message that generates an SVG figure
5. Look for logs starting with `[EnhancedMessageFormatter]`

### Step 2: Check What's Logged
The debug log should show:
```javascript
{
  fullMatch: "[FIGURE:Graph of All Three Equations]<svg...",  // First 100 chars
  figTitle: "Graph of All Three Equations from the PDF",      // Extracted title
  svgContentLength: 1234,                                      // Length of SVG content
  svgContentPreview: "<svg xmlns=\"http://www.w3.org/2000..."  // First 100 chars of SVG
}
```

### Step 3: Check for Issues

#### Issue A: No Console Log Appears
**Meaning**: FIGURE regex is not matching
**Possible causes**:
- AI response format changed
- FIGURE tags are malformed
- Regex pattern doesn't match the actual format

**Solution**: Check the raw AI response format

#### Issue B: svgContent is empty or undefined
**Meaning**: Regex is matching but not extracting content correctly
**Possible causes**:
- Regex capture groups are wrong
- Combined regex offsets are incorrect

**Solution**: Check regex group indexing

#### Issue C: svgContent has content but no image appears
**Meaning**: SVGFigure component is not rendering
**Possible causes**:
- SVGFigure component error
- Content sanitization removing content
- svg.js library issue

**Solution**: Check SVGFigure component errors

## Expected FIGURE Format

The AI should generate figures in this **exact** format:

```
[FIGURE:Descriptive Title of the Figure]
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <rect width="600" height="450" fill="#0f1117" rx="12"/>
  <!-- SVG elements here -->
</svg>
[/FIGURE]
```

### Format Rules:
1. ✅ Opening tag: `[FIGURE:Title Here]` (title is optional but recommended)
2. ✅ SVG content: Complete `<svg>...</svg>` element
3. ✅ Closing tag: `[/FIGURE]`
4. ❌ NO extra spaces or newlines before/after SVG
5. ❌ NO markdown code blocks around SVG
6. ❌ NO HTML escaping (use actual `<` and `>`, not `&lt;` `&gt;`)

### Example (Correct):
```
[FIGURE:Force Diagram]
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <rect width="600" height="450" fill="#0f1117" rx="12"/>
  <text x="300" y="30" text-anchor="middle" fill="#e2e8f0">Force Diagram</text>
</svg>
[/FIGURE]
```

### Example (Wrong - will not work):
````
[FIGURE:Force Diagram]
```svg
<svg xmlns="http://www.w3.org/2000/svg">
  ...
</svg>
```
[/FIGURE]
````

## Regex Pattern Analysis

### Individual FIGURE Regex
```javascript
const FIGURE_REGEX = /\[FIGURE(?::([^\]]*))?\]([\s\S]*?)\[\/FIGURE\]/gi;
```

**Capture Groups**:
- Group 1: `([^\]]*)` - Optional title after the colon
- Group 2: `([\s\S]*?)` - SVG content (everything between tags)

### Combined Regex
```javascript
const combinedRegex = new RegExp(
  `(?:${CHART_REGEX.source})|(?:${MERMAID_REGEX.source})|(?:${FIGURE_REGEX.source})`,
  'gi'
);
```

**Group Offset in Combined Regex**:
- CHART_REGEX has 3 groups → [1, 2, 3]
- MERMAID_REGEX has 1 group → [4]
- FIGURE_REGEX has 2 groups → [5, 6]

**So in combined regex**:
- `match[5]` = FIGURE title
- `match[6]` = FIGURE SVG content

## Testing the Fix

### Test Case 1: Simple SVG
Send this message to the AI:
```
Show me a simple graph.
```

The AI should respond with a FIGURE block. Check:
1. Console shows FIGURE match log
2. SVG renders as interactive image
3. Zoom/pan controls work

### Test Case 2: PDF Upload
Upload a PDF with math/graphs and ask:
```
Explain this with diagrams.
```

The AI should generate FIGURE blocks for diagrams. Check:
1. Multiple FIGURE blocks parse correctly
2. Each figure renders separately
3. No raw SVG markup visible

### Test Case 3: Math Problem
Ask:
```
Solve y = 2x + 3 and show the graph.
```

The AI should include a FIGURE with the line graph. Check:
1. Graph renders correctly
2. Axes and labels visible
3. Can zoom in to see details

## If Still Not Working

### Check 1: AI Response Format
1. Go to browser DevTools → Network tab
2. Find the AI response
3. Look at the raw response body
4. Verify FIGURE tags are present and correctly formatted

### Check 2: SVGFigure Component
1. Check browser Console for errors from SVGFigure
2. Look for sanitization warnings
3. Check if svg.js library loaded correctly

### Check 3: Regex Matching
1. Copy the FIGURE block from AI response
2. Test it against FIGURE_REGEX in browser console:
```javascript
const FIGURE_REGEX = /\[FIGURE(?::([^\]]*))?\]([\s\S]*?)\[\/FIGURE\]/gi;
const test = `[FIGURE:Test]<svg>...</svg>[/FIGURE]`;
const match = FIGURE_REGEX.exec(test);
console.log(match);
```

### Check 4: Combined Regex Group Indexing
If FIGURE content is not extracted, the group indices might be wrong. The code expects:
- `match[5]` = title
- `match[6]` = svg content

But if other regexes changed, these indices might be different.

## Quick Fix (Temporary)

If the issue persists, you can temporarily add a fallback to render raw SVG:

**File**: `src/components/EnhancedMessageFormatter.jsx`

Add after line 540 (in the figure rendering section):
```javascript
if (seg.kind === 'figure') {
  // Try SVGFigure component first
  if (seg.svgContent && seg.svgContent.trim()) {
    return (
      <SVGFigure
        key={`figure-${i}`}
        svgContent={seg.svgContent}
        title={seg.title}
      />
    );
  }
  // Fallback: render as raw HTML (not recommended long-term)
  return (
    <div key={`figure-${i}`} dangerouslySetInnerHTML={{ __html: seg.svgContent }} />
  );
}
```

**⚠️ Warning**: This bypasses security sanitization. Only use for debugging!

## Related Files

| File | Purpose |
|------|---------|
| `src/components/EnhancedMessageFormatter.jsx` | Parses FIGURE tags from AI responses |
| `src/components/SVGFigure.jsx` | Renders SVG with zoom/pan controls |
| `src/utils/promptBuilder.js` | Instructs AI how to format FIGURE blocks |
| `src/appwrite/audioLecture.js` | Audio lecture SVG generation rules |
| `src/appwrite/examPlanner.js` | Exam plan SVG generation rules |

## Next Steps

1. ✅ Build completed with debug logging
2. 🔄 Test in browser with console open
3. 🔄 Check console logs when SVG appears
4. 🔄 Report findings:
   - Is FIGURE log appearing?
   - What are the logged values?
   - Are there any errors?
5. 🔄 Based on logs, determine root cause
6. 🔄 Apply appropriate fix

## Reporting Results

When testing, please report:
1. **Console Logs**: Copy the FIGURE match log from console
2. **Network Response**: What does the raw AI response look like?
3. **Visual Result**: Screenshot of what's displayed
4. **Errors**: Any errors in console?

This will help identify exactly where the issue is occurring.

---

**Status**: 🔧 **DEBUG BUILD READY**
**Next Action**: Test in browser and check console logs
**Updated**: Debug session

