# TTS Quick Reference Card

## 🚀 Import

```javascript
import { speak, VOICES, STYLES } from './tts';
import { useTTS } from './tts/useTTSHook';
import { speakConversation } from './tts';
```

## 🎤 Basic Usage

```javascript
// Simple
await speak("Hello!");

// With options
await speak("Welcome!", {
  voice: VOICES.KORE,
  style: STYLES.CHEERFUL,
  userId: user.$id,
  volume: 0.8,
  playbackRate: 1.2,
});
```

## ⚛️ React Hook

```javascript
const { 
  speak, 
  pause, 
  resume, 
  stop, 
  isPlaying, 
  loading, 
  error 
} = useTTS({ userId: user.$id });

<button onClick={() => speak("Hello!")}>Speak</button>
```

## 🎭 Voices

```javascript
VOICES.PUCK    // Energetic, youthful
VOICES.CHARON  // Deep, authoritative  
VOICES.KORE    // Warm, friendly (default)
VOICES.FENRIR  // Strong, confident
VOICES.AOEDE   // Melodic, expressive
```

## 🎨 Styles

```javascript
STYLES.CHEERFUL      // "cheerfully"
STYLES.SERIOUS       // "seriously"
STYLES.EXCITED       // "excitedly"
STYLES.CALM          // "calmly"
STYLES.FRIENDLY      // "in a friendly way"
STYLES.PROFESSIONAL  // "professionally"
```

## 👥 Multi-Speaker

```javascript
const speakers = [
  { name: 'Teacher', voice: VOICES.KORE },
  { name: 'Student', voice: VOICES.PUCK },
];

const script = [
  { speaker: 'Teacher', line: 'Hello!' },
  { speaker: 'Student', line: 'Hi!' },
];

await speakConversation(speakers, script, { userId: user.$id });
```

## 📊 Quota Check

```javascript
import { checkQuota } from './tts';

const quota = await checkQuota(user.$id, 500);
if (!quota.allowed) {
  alert('Limit reached!');
}
```

## 🎮 Controls

```javascript
import { pauseAudio, resumeAudio, stopAudio } from './tts';

pauseAudio();   // Pause
resumeAudio();  // Resume
stopAudio();    // Stop
```

## 📝 Long Text

```javascript
import { speakLong } from './tts';

await speakLong(longText, {
  voice: VOICES.FENRIR,
  userId: user.$id,
});
```

## 💾 Caching

```javascript
// Enabled by default
await speak("Hello", { useCache: true });

// Disable caching
await speak("Hello", { useCache: false });
```

## 📈 Usage Stats

```javascript
import { getUserStats, getMonthlyUsage } from './tts';

const used = await getMonthlyUsage(user.$id);
const stats = await getUserStats(user.$id);
```

## ⚙️ Setup

### 1. Appwrite Collections

Create in Appwrite Console:
- `tts_cache_metadata`
- `tts_usage`

### 2. Environment

Already in `.env`:
```env
VITE_GEMINI_API_KEY=AIzaSy...
```

## 🔗 Full Docs

See `GEMINI_TTS_GUIDE.md` for complete documentation.
