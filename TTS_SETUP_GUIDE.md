# Text-to-Speech (TTS) Setup Guide

## Overview

This application uses the **Web Speech API** for text-to-speech functionality. This is a browser-native feature that requires **NO external dependencies or installations** for the app itself.

## ✅ What This Means

- **No npm packages needed** - The app uses `window.speechSynthesis` built into modern browsers
- **No server-side processing** - All TTS happens in the user's browser
- **No API keys required** - It's a free browser feature
- **Works offline** - Once voices are installed on the OS, they work without internet

## 🌐 Browser Support

| Browser | Support Level | Notes |
|---------|--------------|-------|
| **Chrome/Edge** | ✅ Excellent | Best voice selection, most languages |
| **Safari** | ✅ Good | Good on macOS/iOS, limited on Windows |
| **Firefox** | ⚠️ Limited | Fewer voices, some languages missing |
| **Opera** | ✅ Good | Based on Chromium, similar to Chrome |

## 🎤 How It Works

### 1. Voice Loading
```javascript
// Voices load asynchronously
window.speechSynthesis.getVoices()
```

The app automatically:
- Waits for voices to load
- Caches available voices
- Selects the best voice for each language

### 2. Language Matching
The app tries to find voices in this order:
1. **Exact match** (e.g., `zh-CN` for Chinese)
2. **Prefix match** (e.g., `zh` matches `zh-CN` or `zh-TW`)
3. **Fuzzy match** (any voice containing the language code)
4. **Default voice** (fallback to browser's default)

### 3. Text Processing
Before speaking, the app:
- Strips romanization: `你好 (nǐ hǎo)` → `你好`
- Removes translations: `[Hello]` → (removed)
- Cleans formatting for natural speech

## 🔧 User Setup (OS-Level)

### Windows 10/11
1. Open **Settings** → **Time & Language** → **Language**
2. Click **Add a language**
3. Select your target language (e.g., Spanish, Chinese)
4. Click **Options** → **Download** under Speech
5. Restart browser after installation

### macOS
1. Open **System Preferences** → **Accessibility** → **Spoken Content**
2. Click **System Voice** → **Manage Voices**
3. Download voices for your target languages
4. Restart browser

### Linux
1. Install `espeak` or `festival`:
   ```bash
   sudo apt-get install espeak
   ```
2. Browsers will use system TTS engines

### iOS/iPadOS
- Voices are pre-installed for most languages
- Go to **Settings** → **Accessibility** → **Spoken Content** → **Voices** to add more

### Android
1. Open **Settings** → **System** → **Languages & input**
2. Tap **Text-to-speech output**
3. Tap **Google Text-to-speech Engine** → **Install voice data**
4. Download languages you need

## 📝 Implementation Details

### File: `src/utils/speech.js`

This is the main TTS utility that:
- Loads and caches voices
- Finds best voice for each language
- Handles text preprocessing
- Provides fallback mechanisms

### Key Functions

```javascript
// Main speak function
speak(text, langCode, options)

// Check if voice is available
isVoiceAvailable(langCode)

// Get all available voices
listAvailableVoices()

// Get available languages
getAvailableLanguages()

// Check browser support
isSpeechSupported()
```

### Usage Example

```javascript
import { speak } from '../utils/speech';

// Basic usage
speak("Hello world", "en");

// With options
speak("你好", "zh", {
  rate: 0.85,        // Speed (0.1 to 10)
  pitch: 1,          // Pitch (0 to 2)
  onUnsupported: (reason) => {
    console.warn(reason);
  }
});
```

## 🚨 Common Issues & Solutions

### Issue: "No voice available" warning

**Cause:** Browser doesn't have voices for that language

**Solutions:**
1. **Use Chrome/Edge** - Best voice support
2. **Install OS voices** - Follow OS-specific instructions above
3. **Try different browser** - Some browsers have better voice libraries
4. **Restart browser** - After installing new voices

### Issue: Voice sounds robotic or wrong accent

**Cause:** Using fallback/default voice

**Solution:**
- Install native voices for your target language in OS settings
- The app will automatically use better voices once available

### Issue: No sound at all

**Causes & Solutions:**
1. **Browser doesn't support Web Speech API**
   - Use Chrome, Edge, Safari, or Firefox
   
2. **User gesture required**
   - TTS must be triggered by user action (click, tap)
   - Cannot auto-play on page load
   
3. **Volume/mute settings**
   - Check system volume
   - Check browser tab isn't muted

### Issue: Speech cuts off after 15 seconds

**Cause:** Chrome limitation on long utterances

**Solution:** Already handled in code - long text is automatically chunked into sentences

## 🎯 Supported Languages

The app has optimized support for:

- **English** (en-US, en-GB, en-AU, en-CA, en-IN)
- **Chinese** (zh-CN, zh-TW, zh-HK)
- **Spanish** (es-ES, es-MX, es-US, es-AR)
- **French** (fr-FR, fr-CA, fr-BE, fr-CH)
- **German** (de-DE, de-AT, de-CH)
- **Japanese** (ja-JP)
- **Korean** (ko-KR)
- **Italian** (it-IT)
- **Portuguese** (pt-BR, pt-PT)
- **Russian** (ru-RU)
- **Arabic** (ar-SA, ar-EG, ar-AE)
- **Hindi** (hi-IN)
- **Bangla** (bn-BD, bn-IN)
- And 20+ more languages...

## 🔍 Debugging

### Check Available Voices

Open browser console and run:
```javascript
window.speechSynthesis.getVoices().forEach(v => {
  console.log(`${v.name} (${v.lang})`);
});
```

### Test TTS Directly

```javascript
const utterance = new SpeechSynthesisUtterance("Hello");
utterance.lang = "en-US";
window.speechSynthesis.speak(utterance);
```

### Check App's Voice Detection

```javascript
import { listAvailableVoices, getAvailableLanguages } from './utils/speech';

// See all voices grouped by language
console.log(listAvailableVoices());

// See available languages
console.log(getAvailableLanguages());
```

## 📊 Voice Quality Comparison

| Language | Chrome/Edge | Safari | Firefox |
|----------|-------------|--------|---------|
| English | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Spanish | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Chinese | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| French | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| German | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Japanese | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Arabic | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Hindi | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Bangla | ⭐⭐ | ⭐⭐ | ⭐ |

## 🎓 Best Practices

### For Developers

1. **Always check browser support** before using TTS
   ```javascript
   if (!window.speechSynthesis) {
     // Show fallback UI
   }
   ```

2. **Wait for voices to load**
   ```javascript
   window.speechSynthesis.onvoiceschanged = () => {
     // Voices are ready
   };
   ```

3. **Provide visual feedback**
   - Show speaking indicator
   - Display text being spoken
   - Offer pause/stop controls

4. **Handle errors gracefully**
   - Show helpful error messages
   - Suggest browser alternatives
   - Provide text fallback

### For Users

1. **Use Chrome or Edge** for best experience
2. **Install OS voices** for your target languages
3. **Restart browser** after installing new voices
4. **Check volume settings** if no sound
5. **Click speaker buttons** - TTS requires user interaction

## 🔗 Resources

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Browser Compatibility](https://caniuse.com/speech-synthesis)
- [Chrome Voice Support](https://support.google.com/chrome/answer/7343019)

## 📞 Support

If users report TTS issues:

1. **Ask which browser** they're using
2. **Check if voices are installed** in their OS
3. **Test in Chrome/Edge** as reference
4. **Check browser console** for errors
5. **Verify user interaction** triggered the TTS

Remember: **This is a browser/OS feature, not an app installation issue!**
