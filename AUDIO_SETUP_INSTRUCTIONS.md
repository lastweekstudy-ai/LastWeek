# Audio Lectures Setup Instructions

## Current Status

The audio lecture feature is fully implemented and working, but requires one additional setup step in Appwrite to enable full session scoping functionality.

## What's Working ✅

- ✅ Recording and uploading audio lectures
- ✅ Automatic transcription with Gemini AI
- ✅ Structured lecture notes generation with DeepSeek
- ✅ Audio playback with transcript synchronization
- ✅ Share/Private toggle buttons for audio resources
- ✅ Importing shared audio lectures from the library
- ✅ Audio lectures appear in the resources panel
- ✅ SVG figures render correctly in lecture notes

## What Needs Setup ⚙️

To enable **session scoping** for audio lectures (so audio lectures are properly organized by session), you need to add the `sessionId` attribute to the Appwrite `audio_lectures` collection.

### Why This Matters

Currently, audio lectures work but they're not fully scoped to sessions. This means:
- Audio lectures will appear in the library but may not be properly filtered by session
- The app has a fallback that works, but it's not optimal
- Adding the `sessionId` attribute enables proper session organization

### Quick Setup (2 minutes)

1. **Open Appwrite Console**
   - Go to your Appwrite console
   - Select your project
   - Click "Databases"
   - Select your database
   - Click on "audio_lectures" collection

2. **Add sessionId Attribute**
   - Click the "+" button to add a new attribute
   - **Attribute ID**: `sessionId`
   - **Type**: String
   - **Required**: No (leave unchecked)
   - Click "Create"

3. **Add isPublic Attribute** (if not already present)
   - Click the "+" button again
   - **Attribute ID**: `isPublic`
   - **Type**: Boolean
   - **Required**: No
   - **Default Value**: false
   - Click "Create"

4. **Done!**
   - The app will automatically use these attributes
   - New audio lectures will be properly scoped to sessions
   - Existing audio lectures will continue to work

## Testing

After adding the attributes:

1. Create a new study session
2. Upload an audio file
3. The audio should be saved with the session ID
4. Check the browser console - you should see logs like:
   ```
   [Audio] Progress: Saving lecture...
   [Audio] Lecture saved successfully
   ```

5. The audio should appear in your session's resources panel
6. You should see the "🌐 Shared" / "🔒 Share" toggle button next to the audio

## Troubleshooting

### Error: "Unknown attribute: sessionId"
- **Solution**: Follow the setup steps above to add the attribute

### Audio lectures not appearing in session
- **Cause**: The attribute wasn't added before uploading
- **Solution**: 
  1. Add the attribute following the steps above
  2. Upload a new audio lecture
  3. It should now appear in the session

### Share button not working
- **Cause**: The `isPublic` attribute is missing
- **Solution**: Add the `isPublic` attribute following the steps above

## File Locations

- **Audio processing**: `src/appwrite/audioLecture.js`
- **Audio UI component**: `src/components/AudioProcessor.jsx`
- **Audio viewer**: `src/components/AudioLectureViewer.jsx`
- **Resource library**: `src/components/PDFLibrary.jsx`
- **Setup guide**: `APPWRITE_SETUP_GUIDE.md`

## Environment Variables

Make sure your `.env` file has:

```
VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID=audio_lectures
VITE_GEMINI_API_KEY=your-gemini-key
VITE_DEEPSEEK_API_KEY=your-deepseek-key
```

## Features Explained

### Recording Audio
1. Click "🎤 Record Audio" in the resources panel
2. Allow microphone access
3. Click "Start Recording"
4. Speak your lecture
5. Click "Stop Recording"
6. The app will automatically:
   - Upload to Cloudflare R2
   - Transcribe with Gemini AI
   - Generate structured notes with DeepSeek
   - Save to your session

### Sharing Audio
1. Click "🔒 Share" next to an audio lecture
2. The button changes to "🌐 Shared"
3. Other students can now find and import it
4. Click "🌐 Shared" again to make it private

### Importing Shared Audio
1. Click "🔍 Library" in the resources panel
2. Search for audio lectures
3. Click "+ Add" to import
4. The audio is copied to your session

## Privacy & Security

- Audio lectures are **private by default**
- Only you can see your audio lectures until you explicitly share them
- When you share, only the processed content is shared (transcript, notes)
- Your personal highlights and notes remain private
- You can unshare at any time

## Performance Notes

- Audio transcription takes 1-5 minutes depending on length
- Lecture notes generation takes 30-60 seconds
- Large audio files (>25MB) are not supported
- The app shows progress updates during processing

## Next Steps

1. Add the `sessionId` and `isPublic` attributes to Appwrite
2. Test uploading an audio lecture
3. Verify it appears in your session
4. Try sharing and importing audio lectures
5. Enjoy your audio-enhanced study sessions!

## Support

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify all environment variables are set
3. Ensure the Appwrite attributes are added correctly
4. Check that your Gemini and DeepSeek API keys are valid
5. See `APPWRITE_SETUP_GUIDE.md` for detailed setup information
