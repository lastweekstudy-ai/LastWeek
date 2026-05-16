To use Gemini’s Text-to-Speech (TTS) capabilities for free in your JavaScript project, you can use the **Google GenAI SDK** (`@google/genai`) coupled with a **Gemini 3 Flash** or **Gemini 2.5 Flash** TTS model via the Google AI Studio free tier.

The free tier offers a generous quota suitable for development, prototyping, and personal projects.

Here is a step-by-step guide to setting up and using Gemini TTS for free in a Node.js/JavaScript environment.

---

## Step 1: Get a Free Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** and create a new key.
4. Set this key in your environment variables so the SDK can find it automatically:
```bash
export GEMINI_API_KEY="your_api_key_here"

```



---

## Step 2: Install the Necessary Packages

In your JavaScript project directory, install Google’s official GenAI SDK. Because the API returns raw PCM (audio) data, you will also need a package like `wav` to save it as a playable file.

```bash
npm install @google/genai wav

```

Make sure your `package.json` contains `"type": "module"` if you are using modern `import` syntax, or run this as an ES module.

---

## Step 3: Implement the TTS Code

Create a file named `tts.js`. This code sends your text to the **`gemini-3-flash-preview`** (or a similar TTS-supported Flash model) and tells it to respond with an audio track using a specific voice profile.

```javascript
import { GoogleGenAI } from '@google/genai';
import wav from 'wav';
import fs from 'fs';

// Helper function to convert raw PCM byte data into a playable .wav file
async function saveWaveFile(filename, pcmData, channels = 1, rate = 24000, sampleWidth = 2) {
  return new Promise((resolve, reject) => {
    const writer = new wav.FileWriter(filename, {
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });
    writer.on('finish', resolve);
    writer.on('error', reject);
    writer.write(pcmData);
    writer.end();
  });
}

async function main() {
  // Automatically pulls the API key from process.env.GEMINI_API_KEY
  const ai = new GoogleGenAI({});

  console.log("Generating audio...");

  try {
    const response = await ai.models.generateContent({
      // Ensure you are using a Flash model variant that supports TTS
      model: 'gemini-3-flash-preview', 
      contents: 'Say cheerfully: Welcome to my JavaScript project! I hope you like the voice.',
      config: {
        // 1. Force the model to output audio instead of text
        responseModalities: ['AUDIO'],
        // 2. Configure the voice profile
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore', // You can change this to other prebuilt voices like 'Zephyr', 'Puck', etc.
            },
          },
        },
      },
    });

    // Extract the raw audio base64 data from the response structure
    const base64Data = response.candidates[0].content.parts[0].inlineData.data;
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Save the buffer to a file
    const outputFilename = 'output.wav';
    await saveWaveFile(outputFilename, audioBuffer);
    console.log(`Success! Audio saved to ${outputFilename}`);

  } catch (error) {
    console.error('Error generating speech:', error);
  }
}

main();

```

---

## Step 4: Run Your Project

Execute your file in the terminal:

```bash
node tts.js

```

An `output.wav` file will be generated in your project directory that you can play directly.

---

## 💡 Pro-Tips for Gemini TTS

* **Controlling Style via Prompts:** Gemini's TTS is highly expressive. You don't need complex markup parameters to change the emotion. Simply write natural language directions directly into your prompt, such as:
* *"Say in a spooky voice: Beware of what lurks in the dark..."*
* *"Say breathlessly and in a rush: I'm late for a very important date!"*


* **Frontend/Browser Projects:** If you intend to use this inside a client-side browser app (like React or vanilla JS), **do not** call the SDK directly from the frontend, as exposing your API key in browser source code can lead to your free tier limits being stolen. Instead, create a simple backend Node.js endpoint (using Express) to serve as a proxy, and have your frontend fetch the audio file from there.

```

```