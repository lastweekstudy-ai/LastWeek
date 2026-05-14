# Testing Groq API Rate Limit Handling

## Quick Test Guide

### Test 1: Normal Operation (Groq Works)
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to Language Learning → Pick any lesson
4. **Expected**: See logs like:
   ```
   [AI JSON] Trying Groq Llama 70B...
   [AI JSON] ✅ Success with Groq Llama 70B
   ```
5. Lesson loads normally ✅

---

### Test 2: Simulate Groq Rate Limit (429 Error)

**Option A: Using Browser DevTools**
1. Open DevTools (F12)
2. Go to Network tab
3. Find the API call to `api.groq.com`
4. Right-click → Edit and Resend
5. Change response status to 429
6. **Expected**: See logs like:
   ```
   [AI JSON] Trying Groq Llama 70B...
   [AI JSON] ⚠️ Groq Llama 70B rate-limited (429). Skipping all Groq providers.
   [AI JSON] Trying DeepSeek...
   [AI JSON] ✅ Success with DeepSeek
   ```
7. Lesson still loads (from DeepSeek) ✅

**Option B: Modify aiProvider.js (for testing)**
```javascript
// In callGroq(), add this at the start:
if (Math.random() < 0.5) { // 50% chance to simulate rate limit
  const error = new Error('Rate limit reached');
  error.code = 'GROQ_RATE_LIMIT';
  error.status = 429;
  throw error;
}
```

---

### Test 3: All Providers Fail

1. Temporarily disable all API keys in `.env`:
   ```
   VITE_GROQ_API_KEY=invalid
   VITE_DEEPSEEK_API_KEY=invalid
   VITE_GEMINI_API_KEY=invalid
   ```
2. Navigate to Language Learning → Pick any lesson
3. **Expected**: See error UI with:
   - ⚠️ icon
   - "Unable to Load Lesson" heading
   - "Our AI services are temporarily unavailable" message
   - 🔄 "Try Again" button
   - ← "Back to Lessons" button
4. Click "Try Again" → Same error (expected)
5. Click "Back to Lessons" → Returns to lesson list ✅

---

### Test 4: Verify Failover Chain

**For JSON Generation**:
1. Disable Groq API key
2. Load lesson
3. **Expected**: Tries DeepSeek first (since Groq is disabled)
   ```
   [AI JSON] Trying Groq Llama 70B...
   [AI JSON] ❌ Groq Llama 70B failed: Groq API key not configured
   [AI JSON] Trying DeepSeek...
   [AI JSON] ✅ Success with DeepSeek
   ```

**For Chat/Streaming**:
1. Disable Groq and DeepSeek API keys
2. Use chat feature
3. **Expected**: Falls back to Gemini
   ```
   [AI Chat] Trying Groq Llama 70B...
   [AI Chat] ❌ Groq Llama 70B failed: Groq API key not configured
   [AI Chat] Trying DeepSeek...
   [AI Chat] ❌ DeepSeek failed: DeepSeek API key not configured
   [AI Chat] Trying Gemini 2.0 Flash...
   [AI Chat] ✅ Success with Gemini 2.0 Flash
   ```

---

### Test 5: Check Console Logging

Open DevTools Console and look for these patterns:

**Success**:
```
[AI JSON] Trying Groq Llama 70B...
[AI JSON] ✅ Success with Groq Llama 70B
```

**Rate Limited**:
```
[AI JSON] Trying Groq Llama 70B...
[AI JSON] ⚠️ Groq Llama 70B rate-limited (429). Skipping all Groq providers.
[AI JSON] Trying DeepSeek...
[AI JSON] ✅ Success with DeepSeek
```

**Provider Failed**:
```
[AI JSON] Trying Groq Llama 70B...
[AI JSON] ❌ Groq Llama 70B failed: Network error
[AI JSON] Trying DeepSeek...
```

---

## Verification Checklist

- [ ] Normal lesson loading works (Groq succeeds)
- [ ] Console shows provider being used
- [ ] Rate limit detection works (429 → skip Groq)
- [ ] Failover to DeepSeek works
- [ ] Failover to Gemini works
- [ ] Error UI shows when all providers fail
- [ ] "Try Again" button retries lesson loading
- [ ] "Back to Lessons" button navigates back
- [ ] No console errors visible to user
- [ ] Build compiles without errors

---

## Debugging Tips

### Check which provider is being used
```javascript
// In browser console:
localStorage.setItem('debug', 'true');
// Then reload page and check console logs
```

### Manually test a provider
```javascript
// In browser console:
import { callGroq, GROQ_MODELS } from './src/services/aiProvider.js';
await callGroq('Say hello', [], GROQ_MODELS.LLAMA_70B);
```

### Check API keys are configured
```javascript
// In browser console:
console.log('Groq:', import.meta.env.VITE_GROQ_API_KEY ? '✅' : '❌');
console.log('DeepSeek:', import.meta.env.VITE_DEEPSEEK_API_KEY ? '✅' : '❌');
console.log('Gemini:', import.meta.env.VITE_GEMINI_API_KEY ? '✅' : '❌');
```

---

## Expected Behavior Summary

| Scenario | Expected Result |
|----------|-----------------|
| Groq works | Lesson loads from Groq, console shows ✅ |
| Groq rate-limited (429) | Lesson loads from DeepSeek, console shows ⚠️ then ✅ |
| Groq fails (other error) | Tries next provider, console shows ❌ |
| All providers fail | Error UI shown, user can retry |
| User clicks "Try Again" | Retries lesson loading |
| User clicks "Back to Lessons" | Returns to lesson list |

---

## Performance Notes

- **Groq success**: ~1-2 seconds (fastest)
- **Groq rate-limited → DeepSeek**: ~2-3 seconds (skips Groq quickly)
- **Groq fails → DeepSeek**: ~2-3 seconds (tries next provider)
- **All providers fail**: ~5-10 seconds (tries all, then shows error)

---

## Troubleshooting

### Issue: Still seeing console errors
**Solution**: Clear browser cache and reload
```
Ctrl+Shift+Delete → Clear browsing data → Reload
```

### Issue: Lesson not loading even with valid API keys
**Solution**: Check API key format and permissions
```javascript
// In console:
console.log(import.meta.env.VITE_GROQ_API_KEY);
// Should show: sk-... (not undefined or empty)
```

### Issue: Rate limit not being detected
**Solution**: Check if error code is being set correctly
```javascript
// In aiProvider.js, add debug log:
if (response.status === 429) {
  console.log('429 detected, setting error code');
  error.code = 'GROQ_RATE_LIMIT';
}
```

---

## Production Deployment

Before deploying to production:
1. ✅ Verify all API keys are configured
2. ✅ Test with each provider individually
3. ✅ Test failover chain (disable providers one by one)
4. ✅ Monitor console logs for errors
5. ✅ Check error UI displays correctly
6. ✅ Verify "Try Again" button works
7. ✅ Monitor Groq usage to predict rate limits

---

## Monitoring Groq Usage

To avoid hitting the 100k TPD limit:
1. Monitor daily token usage in Groq dashboard
2. Set up alerts at 80k tokens
3. When approaching limit, disable Groq in `.env`:
   ```
   VITE_GROQ_API_KEY=disabled
   ```
4. System will automatically failover to DeepSeek/Gemini
5. Users won't notice any difference

---

## Questions?

See `GROQ_API_RATE_LIMIT_FIX.md` for detailed technical documentation.
