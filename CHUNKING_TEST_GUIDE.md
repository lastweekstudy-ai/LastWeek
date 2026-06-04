# AI Response Chunking - Testing Guide

## 🚨 CRITICAL: Restart Dev Server First

**Your dev server is running with OLD CODE (before chunking was added)**

### Step 1: Stop the Dev Server

Press **Ctrl+C** in the terminal running `npm run dev`

**OR** run this batch file:
```bash
restart_dev.bat
```

### Step 2: Hard Refresh Browser

After server restarts, press **Ctrl+Shift+R** to clear browser cache

---

## ✅ Expected Console Logs (Confirming Chunking Works)

### When Saving Large Messages

You should see these in **browser console** (F12):
```
[database.js] Large message detected, using chunked storage
[MessageChunking] Split content into 2 chunks (1.5MB total)
[MessageChunking] Created parent message abc123 with 2 total chunks
[MessageChunking] Created chunk 1/1 for message abc123
```

### When Loading Session

```
[MessageChunking] Reassembled message abc123 from 2 chunks (1.5MB)
```

---

## 🧪 Test Case: Large AI Response

### Test Request
Ask AI:
```
Explain this PDF with:
- 6 detailed SVG graphs
- 10 MCQs
- 20 flashcards

All in ONE response.
```

### Expected Behavior

✅ **Success Indicators**:
1. Console shows `[MessageChunking]` logs
2. Full response saves without truncation
3. All 6 SVG graphs render completely
4. All MCQs and flashcards appear
5. No `[Response truncated]` message

❌ **Failure Indicators**:
1. No `[MessageChunking]` logs in console
2. Response cuts off mid-SVG
3. Missing MCQs or flashcards
4. Truncation message appears

---

## 🔍 Verification in Appwrite Console

### Check Parent Message
```javascript
{
  "$id": "abc123...",
  "role": "assistant",
  "content": "First 800KB...",  // Truncated view
  "isChunked": true,             // ✅ Should be true
  "totalChunks": 2,              // ✅ Should be 2+
  "sessionId": "...",
  "userId": "..."
}
```

### Check Child Chunks
Look for documents with:
```javascript
{
  "role": "assistant_chunk",
  "parentMessageId": "abc123...",
  "chunkIndex": 1,
  "content": "Next 800KB..."
}
```

---

## 🐛 Troubleshooting

### Issue: No Console Logs

**Cause**: Dev server not restarted or browser cache

**Fix**:
1. Stop dev server (Ctrl+C)
2. Run `npm run dev` again
3. Hard refresh browser (Ctrl+Shift+R)
4. Try again

### Issue: "isChunked: false" in Appwrite

**Cause**: Chunking code not executing

**Fix**:
1. Verify `messageChunking.js` file exists at:
   ```
   src/appwrite/messageChunking.js
   ```

2. Verify import in `database.js`:
   ```javascript
   import { 
     needsChunking, 
     createChunkedMessage, 
     getSessionMessagesWithChunks 
   } from './messageChunking';
   ```

3. Check for build errors:
   ```bash
   npm run build
   ```

### Issue: Response Still Truncates

**Cause**: Fallback to aggressive truncation triggered

**Check Console** for:
```
[database.js] Chunking also failed, truncating aggressively
```

**This means chunking failed** - check:
1. Appwrite attributes exist (`isChunked`, `totalChunks`, etc.)
2. `parentMessageId_idx` index created
3. Database permissions allow document creation

---

## 📊 Performance Checks

### Storage Impact

Check Appwrite database after test:
- **Before**: 1 message document per AI response
- **After**: 2-3 message documents for large responses (>800KB)

### Load Time

Should be negligible:
- Reassembly: <50ms
- Network: Same data transferred (just split)
- Query: Handled by increased limit (3000 docs)

---

## ✅ Success Criteria

- [ ] Console shows `[MessageChunking]` logs
- [ ] Appwrite shows `isChunked: true` for large messages
- [ ] Appwrite shows child chunks with `role: "assistant_chunk"`
- [ ] Full AI response displays without truncation
- [ ] All SVG graphs render completely
- [ ] All MCQs and flashcards appear
- [ ] Page reload preserves full content

---

## 🚀 Next Steps After Local Success

1. **Commit Changes** (already done ✅)
   ```bash
   git status  # Should show "up to date"
   ```

2. **Push to GitHub**
   - Open GitHub Desktop
   - Push the 2 commits:
     - `22f618b` - Chunking implementation
     - `7a83b7e` - Updated ALL_TASKS_STATUS.md

3. **Deploy to Production**
   - Follow your normal deployment process
   - Vercel should auto-deploy on push

4. **Test in Production**
   - Same test case as local
   - Verify chunking works in live environment

---

## 📝 Quick Reference

### Files Changed
- `src/appwrite/messageChunking.js` (**NEW** - 310 lines)
- `src/appwrite/database.js` (**MODIFIED** - uses chunking)

### Appwrite Changes Required (✅ DONE by User)
- Added attributes: `isChunked`, `totalChunks`, `parentMessageId`, `chunkIndex`
- Added index: `parentMessageId_idx`

### Commits Made (✅ DONE)
- `22f618b` - Chunking implementation
- `7a83b7e` - Updated ALL_TASKS_STATUS.md

---

## ⚠️ REMINDER: Dev Server MUST Be Restarted

**The most common issue is testing with old code still running in browser**

1. Stop dev server
2. Start dev server
3. Hard refresh browser
4. Test again

---

**Last Updated**: Context Transfer Session
**Status**: Code complete, awaiting testing with restarted server
