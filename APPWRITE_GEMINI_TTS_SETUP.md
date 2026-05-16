# Appwrite Gemini TTS Function Setup

## Why This Approach?

Web Speech API doesn't work reliably on deployed sites (Vercel, Netlify, etc.) due to browser security restrictions. Using an Appwrite Function solves this:

✅ Works on deployed sites (not just localhost)  
✅ No backend server needed (serverless)  
✅ Uses Gemini TTS API (high quality)  
✅ Free tier available  

---

## Step 1: Create Appwrite Function

1. **Go to Appwrite Console** → Your Project → Functions
2. **Click "Create Function"**
3. **Configure:**
   - **Name:** `geminiTTS`
   - **Runtime:** `Node.js 18.0` or `Node.js 20.0`
   - **Execute Access:** `Any` (or specific users)
   - **Events:** Leave empty
   - **Schedule:** Leave empty
   - **Timeout:** `15` seconds

4. **Click "Create"**

---

## Step 2: Add Environment Variable

In the function settings:

1. **Go to Settings tab**
2. **Add Environment Variable:**
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyCCjuUlmu9UktPggVO2EcAgXFSegBIMMJI` (your key)

3. **Click "Add"**

---

## Step 3: Deploy Function Code

### Option A: Manual Upload (Easiest)

1. **Zip the function folder:**
   ```bash
   cd appwrite-functions/geminiTTS
   # Windows: Right-click → Send to → Compressed folder
   # Or use: tar -czf geminiTTS.tar.gz index.js package.json
   ```

2. **In Appwrite Console:**
   - Go to your function → **Deployments** tab
   - Click **"Create deployment"**
   - **Upload** the zip file
   - **Entrypoint:** `index.js`
   - Click **"Create"**

3. **Wait for deployment** (usually 30-60 seconds)

### Option B: Using Appwrite CLI

```bash
# Install Appwrite CLI
npm install -g appwrite-cli

# Login
appwrite login

# Deploy function
appwrite functions createDeployment \
  --functionId=<YOUR_FUNCTION_ID> \
  --entrypoint=index.js \
  --code=appwrite-functions/geminiTTS
```

---

## Step 4: Get Function ID

1. **In Appwrite Console** → Functions → geminiTTS
2. **Copy the Function ID** (looks like: `6a06f1234567890abcdef`)
3. **Add to `.env`:**

```env
VITE_GEMINI_TTS_FUNCTION_ID=your_function_id_here
```

---

## Step 5: Test the Function

### Test in Appwrite Console

1. **Go to function** → **Execute** tab
2. **Body:**
   ```json
   {
     "text": "Hello, this is a test!",
     "voice": "Kore",
     "style": "cheerfully"
   }
   ```
3. **Click "Execute"**
4. **Check response** - should see `"success": true` and base64 audio data

### Test in Your App

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Go to language learning lesson**
3. **Click 🔊 speaker button**
4. **Audio should play!**

---

## Step 6: Deploy to Vercel

1. **Add environment variable to Vercel:**
   - Go to Vercel project → Settings → Environment Variables
   - Add: `VITE_GEMINI_TTS_FUNCTION_ID` = `your_function_id`

2. **Redeploy:**
   ```bash
   git add .
   git commit -m "Add Gemini TTS via Appwrite Function"
   git push
   ```

3. **Test on deployed site** - TTS should work now! 🎉

---

## Troubleshooting

### Function Returns 500 Error

**Check:**
- Environment variable `GEMINI_API_KEY` is set in function settings
- Function is deployed and active
- Check function logs in Appwrite Console

### "Function not configured" Error

**Solution:**
- Make sure `VITE_GEMINI_TTS_FUNCTION_ID` is in `.env`
- Restart dev server after adding

### Audio Not Playing

**Check browser console:**
- Look for errors
- Check if function is being called
- Verify response has `success: true`

### Function Timeout

**If text is very long:**
- Increase timeout in function settings (max 900 seconds)
- Or split long text into chunks

---

## Cost Estimate

### Gemini API (Free Tier)
- **Free:** 1M characters/month
- **Paid:** ~$0.10 per 1M characters

### Appwrite Functions (Free Tier)
- **Free:** 750,000 executions/month
- **Free:** 400,000 GB-seconds compute

**For typical usage (100 users, 10 TTS calls/day):**
- Monthly executions: ~30,000
- Cost: **$0** (within free tier)

---

## Function Code Location

```
appwrite-functions/
└── geminiTTS/
    ├── index.js       ← Function code
    └── package.json   ← Dependencies (none needed)
```

---

## Next Steps

1. ✅ Create function in Appwrite Console
2. ✅ Add `GEMINI_API_KEY` environment variable
3. ✅ Deploy function code
4. ✅ Add `VITE_GEMINI_TTS_FUNCTION_ID` to `.env`
5. ✅ Test locally
6. ✅ Deploy to Vercel
7. ✅ Test on deployed site

---

## Benefits of This Approach

| Feature | Web Speech API | Gemini TTS (Appwrite) |
|---------|---------------|----------------------|
| Works on localhost | ✅ Yes | ✅ Yes |
| Works on deployed site | ❌ No | ✅ Yes |
| Voice quality | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Backend needed | ❌ No | ✅ Serverless |
| Cost | Free | Free tier available |
| Setup complexity | Easy | Medium |

---

**Status:** Ready to deploy!  
**Estimated setup time:** 10-15 minutes
