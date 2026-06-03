# Task 6: SVG + MCQ Rendering - Testing Guide

## Quick Test Instructions

### What to Test
The fix ensures that when you ask AI to **combine SVG figures + MCQs + flashcards in one response**, all components render correctly (not as raw markup text).

---

## Test Scenario 1: SVG + MCQs (Primary Test)

### Steps:
1. **Open your app** in the browser
2. **Upload a PDF** (any PDF with diagrams or graphs)
3. **Ask AI**: 
   ```
   Explain this PDF with SVG diagrams and create MCQ questions
   ```
4. **Wait for response**

### Expected Results:
✅ **SVG figures appear as interactive zoomable images** with these controls:
   - Pan and zoom (scroll wheel)
   - Toolbar buttons: `−` `+` `⊡` `↓`
   - Title above the figure
   
✅ **MCQ questions appear as interactive quizzes** with:
   - Question text
   - Multiple choice buttons (A, B, C, D)
   - Click to answer
   - Explanation after answering

❌ **FAILURE**: If you see raw text like:
```
[FIGURE:Three Lines from the PDF]<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"...
```

---

## Test Scenario 2: SVG + Flashcards

### Steps:
1. **Upload a PDF**
2. **Ask AI**:
   ```
   Create flashcards and SVG diagrams from this PDF
   ```

### Expected Results:
✅ SVG figures render as interactive images
✅ Flashcards appear with flip animation
✅ "FRONT OF CARD" / "BACK OF CARD" formatted nicely

---

## Test Scenario 3: All Three Together (Critical)

### Steps:
1. **Upload a PDF**
2. **Ask AI**:
   ```
   Explain this PDF with SVG figures, create MCQ questions, and make flashcards
   ```

### Expected Results:
✅ All three component types render correctly:
   - SVG figures = interactive images
   - MCQ questions = interactive quizzes
   - Flashcards = flip cards
✅ No raw markup text visible
✅ Content flows naturally

---

## Browser Console Checks

### Open Developer Tools (F12)

### Look for SUCCESS indicators:
```
[parseContentSegments] FIGURE found: <title>
[SVGFigure] Attempting to render
[SVGFigure] ✅ Render successful
```

### Look for FAILURE indicators:
```
⚠️ Segment X (text) still contains [FIGURE tag!
[SVGFigure] ❌ Render error:
```

---

## Visual Comparison

### ✅ CORRECT (After Fix):
```
┌─────────────────────────────────────┐
│ Three Lines from the PDF            │ ← Title
├─────────────────────────────────────┤
│                                     │
│    [Interactive SVG Graph]          │ ← Rendered SVG
│    • Pan/zoom enabled               │
│    • Toolbar visible                │
│                                     │
└─────────────────────────────────────┘

Q: What is the slope of line A?
[ ] A) 2
[ ] B) -1   ← Interactive buttons
[ ] C) 0
[ ] D) 3
```

### ❌ INCORRECT (Before Fix):
```
[FIGURE:Three Lines from the PDF]<svg xmlns="http://www.w3.org/2000/svg" 
viewBox="0 0 600 450" width="600" height="450"><rect width="600" 
height="450" fill="#0f1117" rx="12"/><defs><linearGradient 
id="grid-fade" x1="0" y1="0" x2="0" y2="1">...

Q: What is the slope of line A?
[ ] A) 2
[ ] B) -1
[ ] C) 0
[ ] D) 3
```

---

## What Was Fixed

### Technical Details:

**Problem**: Combined regex had unstable group indices
- CHART regex: groups 1, 2, 3
- MERMAID regex: group 4
- FIGURE regex: groups 5, 6 (but shifted unpredictably!)

**Solution**: Separate regex execution
- Each regex runs independently
- Stable, predictable group indices
- Sort all matches by position
- Complete FIGURE extraction before markdown parsing

---

## Rollback (If Needed)

If the fix causes issues:

```bash
# In Git
git log --oneline -3
git revert <commit-hash>
npm run build
```

Or manually revert the `parseContentSegments()` function in:
`src/components/EnhancedMessageFormatter.jsx`

---

## Success Metrics

### After testing, you should see:
- [x] 0 instances of raw `[FIGURE:...]` text in UI
- [x] SVG figures render as interactive images
- [x] MCQs work correctly
- [x] Flashcards work correctly
- [x] All three can coexist in one response
- [x] Console shows successful FIGURE parsing
- [x] No console errors or warnings

---

## Common Issues & Solutions

### Issue: Still seeing raw markup
**Check**: Look for console warning about FIGURE tags in text
**Solution**: Verify the regex patterns are correct and not being reset

### Issue: SVG renders but MCQs broken
**Check**: Make sure MCQ_BLOCK_REGEX still works
**Solution**: Test MCQs alone (without SVG) to isolate

### Issue: Console shows "FIGURE found" but no render
**Check**: SVGFigure component logs
**Solution**: Check if SVG content is being passed correctly

---

## Report Results

### If Successful:
✅ "Task 6 complete - all three component types render correctly together"

### If Failed:
❌ Provide:
1. Screenshot of the issue
2. Console logs (full output)
3. Which scenario failed (SVG+MCQ, SVG+Flashcard, or All Three)
4. What you see vs. what you expected

---

## Related Files

- **Fix Documentation**: `SVG_FIGURE_MCQ_FIX_FINAL.md`
- **Modified Code**: `src/components/EnhancedMessageFormatter.jsx`
- **SVG Component**: `src/components/SVGFigure.jsx`
- **Status Document**: `ALL_TASKS_STATUS.md`

---

**Testing Priority**: HIGH 🔴  
**Estimated Time**: 5-10 minutes  
**Complexity**: Simple (just upload PDF and ask AI)  
**Risk Level**: Low (only affects rendering, no data loss)
