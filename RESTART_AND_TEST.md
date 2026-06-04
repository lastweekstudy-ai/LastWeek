# 🔄 Restart Dev Server and Test Chunking

## Current Status

✅ **Code is COMPLETE and COMMITTED**
- `messageChunking.js` exists (9,732 characters)
- `database.js` imports and uses chunking functions correctly
- All Appwrite attributes configured
- 2 commits ready to push

❌ **Dev Server is Running OLD CODE**
- Node processes detected: PID 7832, 17384
- Server started BEFORE chunking code was added
- Browser has cached old JavaScript bundle

---

## 🚨 STEP 1: Stop Dev Server

### Option A: Manual Stop
1. Find the terminal running `npm run dev`
2. Press **Ctrl+C**
3. Wait for "Process terminated"

### Option B: Use Batch Script
```bash
restart_dev.bat
```

### Option C: Kill Processes Manually
```bash
taskkill /F /IM node.exe
```

**Verify Stopped**:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```
Should show NO results

---

## 🚀 STEP 2: Start Dev Server Fresh

In the terminal:
```bash
npm run dev
```

**Wait for**:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**DO NOT** test until you see this message!

---

## 🌐 STEP 3: Hard Refresh Browser

1. Open browser to `http://localhost:5173`
2. Press **Ctrl+Shift+R** (Windows) - **NOT** just F5
3. This clears cached JavaScript

**OR** do this:
1. Press F12 (open DevTools)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

---

## 🧪 STEP 4: Test with Large AI Request

### Open Browser Console (F12)

You'll watch for specific logs here

### Send Test Request

In your app, send this to AI:
```
Explain this PDF with:
- 6 detailed SVG graphs with coordinate grids
- 10 multiple choice questions
- 20 flashcards

Generate ALL of this in ONE response.
```

**Note**: This should generate ~1-2MB of content (triggers chunking)

---

## ✅ STEP 5: Check Console Logs

### ✅ SUCCESS - You Should See:

```
[database.js] Large message detected, using chunked storage
[MessageChunking] Split content into 2 chunks (1.5MB total)
[MessageChunking] Created parent message 67abcd123... with 2 total chunks
[MessageChunking] Created chunk 1/1 for message 67abcd123...
```

Then when loading:
```
[MessageChunking] Reassembled message 67abcd123... from 2 chunks (1.5MB)
```

### ❌ FAILURE - If You See:

**Nothing** (no logs at all)
- Chunking not triggering
- Server still running old code
- Go back to Step 1

**Truncation message**:
```
[Response truncated - content too long for database]
```
- Chunking failed completely
- Check Appwrite configuration

---

## 🔍 STEP 6: Verify in Appwrite Console

### Go to Appwrite Console
1. Open your Appwrite dashboard
2. Navigate to your database
3. Open the `messages` collection
4. Find the most recent message

### Check Parent Message

Should look like:
```json
{
  "$id": "67abcd123...",
  "role": "assistant",
  "content": "[First 800KB of response]",
  "isChunked": true,           ← ✅ Should be TRUE
  "totalChunks": 2,             ← ✅ Should be 2 or more
  "sessionId": "...",
  "userId": "...",
  "createdAt": "2024-..."
}
```

### Check for Child Chunks

You should see additional documents with:
```json
{
  "$id": "67xyz789...",
  "role": "assistant_chunk",   ← ✅ Note the "_chunk" suffix
  "content": "[Next 800KB]",
  "parentMessageId": "67abcd123...",  ← ✅ Points to parent
  "chunkIndex": 1,              ← ✅ Sequential number
  "sessionId": "...",
  "userId": "...",
  "createdAt": "2024-..."
}
```

---

## 🎯 STEP 7: Verify Full Content Displayed

### In Your App

1. The AI response should display COMPLETELY
2. All 6 SVG graphs should render fully (no truncation)
3. All 10 MCQs should appear
4. All 20 flashcards should appear
5. No `[Response truncated]` message

### Reload Test

1. Refresh the page (F5)
2. Navigate back to the session
3. Full content should STILL be there
4. Check console for: `[MessageChunking] Reassembled message...`

---

## 🐛 Troubleshooting

### Problem: No Console Logs

**Diagnosis**: Old code still running

**Fix**:
1. Kill ALL Node processes:
   ```bash
   taskkill /F /IM node.exe
   ```
2. Close ALL terminal windows
3. Open NEW terminal
4. Run `npm run dev` again
5. Hard refresh browser (Ctrl+Shift+R)

### Problem: "isChunked: false" in Appwrite

**Diagnosis**: Content not large enough OR chunking not detecting size

**Check**:
1. Does your AI response have lots of SVG data?
2. Console shows size check? Add this to test:
   ```javascript
   // In browser console
   const testSize = new TextEncoder().encode(largeString).length;
   console.log(`Size: ${Math.round(testSize / 1024)}KB`);
   ```

**Fix**: Try an even larger request (8-10 graphs)

### Problem: Import Error in Console

```
Failed to resolve import './messageChunking'
```

**Diagnosis**: File path issue

**Fix**:
1. Check file exists:
   ```bash
   dir src\appwrite\messageChunking.js
   ```
2. If missing, file wasn't committed properly
3. Check git status:
   ```bash
   git status
   git log --name-only -1
   ```

### Problem: Response Still Truncates

**Check Console For**:
```
[database.js] Chunking also failed, truncating aggressively
```

**This means chunking failed** - possible causes:

1. **Appwrite attributes missing**
   - Go to Appwrite Console
   - Database → Messages Collection → Attributes
   - Verify: `isChunked`, `totalChunks`, `parentMessageId`, `chunkIndex`

2. **Index missing**
   - Same location → Indexes
   - Verify: `parentMessageId_idx` exists

3. **Permissions issue**
   - Messages Collection → Settings → Permissions
   - Verify: "Create documents" permission enabled for users

---

## 📊 Expected Results Summary

| Check | Expected | Location |
|-------|----------|----------|
| Console logs | `[MessageChunking]` messages | Browser F12 |
| Parent doc | `isChunked: true` | Appwrite Console |
| Child chunks | 1-3 docs with `role: "assistant_chunk"` | Appwrite Console |
| UI display | Full response, no truncation | App interface |
| After reload | Content persists fully | App after F5 |

---

## 🎉 SUCCESS CRITERIA

When everything works, you should have:

- [x] Console shows `[MessageChunking]` logs
- [x] Appwrite shows parent + child documents
- [x] Full AI response displays (no truncation)
- [x] All SVG graphs render completely
- [x] All MCQs and flashcards appear
- [x] Content persists after page reload
- [x] No errors in console

**If all checked**: ✅ READY FOR DEPLOYMENT!

---

## 🚀 After Successful Local Testing

### Push to GitHub
```bash
git status  # Should show "ahead by 2 commits"
```

**Use GitHub Desktop**:
1. Open GitHub Desktop
2. See 2 commits ready to push:
   - `22f618b` - Chunking implementation
   - `7a83b7e` - Updated ALL_TASKS_STATUS.md
3. Click "Push origin"

### Deploy to Production

Vercel should auto-deploy when you push

**Monitor Deployment**:
1. Vercel dashboard should show new deployment
2. Wait for "Ready" status
3. Test in production with same large request

### Production Testing

Same test case:
1. Send large AI request (6+ SVG graphs)
2. Check browser console for logs
3. Verify full content displays
4. Check Appwrite for chunked documents

---

## 📝 Quick Command Reference

**Stop server**:
```bash
taskkill /F /IM node.exe
```

**Start server**:
```bash
npm run dev
```

**Check processes**:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

**Check file exists**:
```bash
dir src\appwrite\messageChunking.js
```

**Git status**:
```bash
git status
git log --oneline -3
```

---

## ⚠️ MOST IMPORTANT

**THE #1 ISSUE IS ALWAYS: Old code still running**

**FIX**: 
1. Stop EVERYTHING
2. Start fresh
3. Hard refresh browser
4. Test again

**This solves 95% of "it's not working" issues**

---

**Current Status**: ✅ Code committed, ready for testing with restarted server
**Next Step**: Run `restart_dev.bat` OR manually stop/start dev server
**Then**: Follow this guide step-by-step

Good luck! 🚀
