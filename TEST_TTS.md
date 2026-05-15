# Testing Gemini TTS System

Quick guide to test your TTS setup.

## 🚀 Quick Test (Browser Console)

### 1. Open Your App

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 2. Open Browser Console

Press **F12** or **Ctrl+Shift+I** (Windows) / **Cmd+Option+I** (Mac)

### 3. Run Basic Test

```javascript
import { speak, VOICES } from './tts';

// Get your user ID (if logged in)
const user = await account.get();

// Test basic TTS
await speak("Hello, this is a test!", {
  voice: VOICES.KORE,
  userId: user.$id,
});
```

**Expected Result**: You should hear "Hello, this is a test!" in a friendly voice.

## 🧪 Comprehensive Tests

### Test 1: Basic TTS

```javascript
import { speak, VOICES } from './tts';

await speak("Testing Gemini TTS!", {
  voice: VOICES.KORE,
  userId: 'test-user',
});
```

**Expected**: Audio plays successfully

### Test 2: Cache Test

```javascript
import { speak, VOICES } from './tts';

// First call - should take 2-5 seconds
console.time('First call');
await speak("Cache test", { voice: VOICES.KORE, userId: 'test' });
console.timeEnd('First call');

// Second call - should be instant (< 100ms)
console.time('Second call');
await speak("Cache test", { voice: VOICES.KORE, userId: 'test' });
console.timeEnd('Second call');
```

**Expected**: Second call is much faster (cached)

### Test 3: All Voices

```javascript
import { speak, VOICES } from './tts';

// Test each voice
await speak("I am Puck", { voice: VOICES.PUCK, userId: 'test' });
await speak("I am Charon", { voice: VOICES.CHARON, userId: 'test' });
await speak("I am Kore", { voice: VOICES.KORE, userId: 'test' });
await speak("I am Fenrir", { voice: VOICES.FENRIR, userId: 'test' });
await speak("I am Aoede", { voice: VOICES.AOEDE, userId: 'test' });
```

**Expected**: Each voice sounds different

### Test 4: Speaking Styles

```javascript
import { speak, VOICES, STYLES } from './tts';

await speak("I am cheerful!", {
  voice: VOICES.KORE,
  style: STYLES.CHEERFUL,
  userId: 'test',
});

await speak("I am serious.", {
  voice: VOICES.KORE,
  style: STYLES.SERIOUS,
  userId: 'test',
});
```

**Expected**: Different emotional tones

### Test 5: Multi-Speaker

```javascript
import { speakConversation, VOICES } from './tts';

const speakers = [
  { name: 'Teacher', voice: VOICES.KORE },
  { name: 'Student', voice: VOICES.PUCK },
];

const script = [
  { speaker: 'Teacher', line: 'Hello!' },
  { speaker: 'Student', line: 'Hi there!' },
];

await speakConversation(speakers, script, { userId: 'test' });
```

**Expected**: Conversation with two distinct voices

### Test 6: Quota Check

```javascript
import { checkQuota, getMonthlyUsage } from './tts';

// Check usage
const used = await getMonthlyUsage('test-user');
console.log(`Used: ${used} characters`);

// Check quota
const quota = await checkQuota('test-user', 500);
console.log('Quota:', quota);
```

**Expected**: Shows usage statistics

### Test 7: React Hook

Create a test component:

```javascript
import { useTTS } from './tts/useTTSHook';

function TestComponent() {
  const { speak, isPlaying, pause, stop } = useTTS({
    userId: 'test-user',
  });

  return (
    <div>
      <button onClick={() => speak("Hello from React!")}>
        Speak
      </button>
      {isPlaying && (
        <>
          <button onClick={pause}>Pause</button>
          <button onClick={stop}>Stop</button>
        </>
      )}
    </div>
  );
}
```

**Expected**: Buttons work, audio plays

## ✅ Verification Checklist

After testing, verify:

### In Browser Console

- [ ] No errors in console
- [ ] Audio plays successfully
- [ ] Cache works (2nd call is instant)
- [ ] Different voices sound distinct
- [ ] Quota tracking works

### In Appwrite Console

1. **Go to Databases** → Your Database

2. **Check TTS Cache Metadata**:
   - [ ] Documents created
   - [ ] `text` field has content
   - [ ] `voice` field shows voice name
   - [ ] `fileId` is a hash
   - [ ] `createdAt` is recent

3. **Check TTS Usage**:
   - [ ] Documents created
   - [ ] `userId` matches your test user
   - [ ] `charCount` is correct
   - [ ] `voice` field shows voice name
   - [ ] `timestamp` is recent

4. **Check Storage**:
   - [ ] Audio files created in bucket
   - [ ] Files are WAV format
   - [ ] File names are hashes

### Permissions Test

```javascript
// Test 1: Cache is shared (should work)
// User A creates cache
await speak("Shared test", { userId: 'user-a' });

// User B uses same cache (should be instant)
await speak("Shared test", { userId: 'user-b' });

// Test 2: Usage is private
import { getMonthlyUsage } from './tts';

// User A can see their own usage
const usageA = await getMonthlyUsage('user-a');
console.log('User A usage:', usageA); // Should work

// User B can see their own usage
const usageB = await getMonthlyUsage('user-b');
console.log('User B usage:', usageB); // Should work
```

## 🐛 Troubleshooting

### No Audio Playing

**Check**:
1. Browser console for errors
2. Gemini API key is valid
3. User is authenticated
4. Volume is not muted

**Solution**:
```javascript
// Check if TTS is available
import { isGeminiTTSAvailable } from './tts';
console.log('TTS available:', isGeminiTTSAvailable());
```

### "Collection not found" Error

**Check**:
1. Collections created in Appwrite
2. Collection IDs in `.env` are correct
3. Database ID is correct

**Solution**:
```bash
# Verify .env has:
VITE_TTS_CACHE_COLLECTION_ID=tts_cache_metadata
VITE_TTS_USAGE_COLLECTION_ID=tts_usage
```

### "Permission denied" Error

**Check**:
1. User is logged in
2. Document security is enabled
3. Permissions are set correctly

**Solution**:
```javascript
// Check user
import { account } from './appwrite';
const user = await account.get();
console.log('User:', user.$id);
```

### Cache Not Working

**Check**:
1. Storage bucket ID is correct
2. Files are being created
3. Metadata documents exist

**Solution**:
```javascript
// Check cache manually
import { getCachedAudio } from './tts/ttsCache';
const cached = await getCachedAudio("test", "Kore");
console.log('Cached:', cached);
```

### Quota Errors

**Check**:
1. Monthly usage
2. Quota limit setting

**Solution**:
```javascript
import { getMonthlyUsage } from './tts';
const used = await getMonthlyUsage('test-user');
console.log(`Used: ${used} / 100000`);
```

## 📊 Performance Benchmarks

### Expected Performance

| Operation | Expected Time | Notes |
|-----------|--------------|-------|
| First TTS call | 2-5 seconds | API call + caching |
| Cached TTS call | < 100ms | Instant playback |
| Multi-speaker | 3-7 seconds | Longer audio generation |
| Quota check | < 50ms | Database query |

### Test Performance

```javascript
// Benchmark TTS
async function benchmark() {
  const text = "Performance test";
  
  // First call
  const start1 = Date.now();
  await speak(text, { userId: 'test' });
  const time1 = Date.now() - start1;
  
  // Cached call
  const start2 = Date.now();
  await speak(text, { userId: 'test' });
  const time2 = Date.now() - start2;
  
  console.log(`First call: ${time1}ms`);
  console.log(`Cached call: ${time2}ms`);
  console.log(`Speedup: ${(time1 / time2).toFixed(1)}x`);
}

await benchmark();
```

**Expected**: 20-50x speedup on cached calls

## 🎉 Success Criteria

Your TTS system is working correctly if:

✅ Audio plays without errors  
✅ Cache works (2nd call is instant)  
✅ All 5 voices sound different  
✅ Quota tracking works  
✅ Documents created in Appwrite  
✅ Audio files in storage  
✅ Permissions work correctly  
✅ No console errors  

## 📚 Next Steps

Once testing is complete:

1. ✅ Integrate into your components
2. ✅ Replace old Web Speech API calls
3. ✅ Add TTS to language learning features
4. ✅ Monitor usage and costs
5. ✅ Customize quota limits if needed

## 📞 Need Help?

- Check browser console for errors
- Review `GEMINI_TTS_GUIDE.md` for examples
- See `APPWRITE_TTS_PERMISSIONS_GUIDE.md` for permission issues
- Verify Appwrite collections are set up correctly

---

**Happy testing! 🚀**
