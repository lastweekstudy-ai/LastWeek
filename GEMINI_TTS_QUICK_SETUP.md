# Gemini TTS Quick Setup Guide

## 📦 Files Ready

✅ **Function code:** `appwrite-functions/geminiTTS/geminiTTS.tar.gz`  
✅ **Endpoint:** Your Appwrite endpoint (already in .env)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Upload Function to Appwrite

1. **Go to:** [Appwrite Console](https://cloud.appwrite.io) → Your Project → **Functions**

2. **Click:** "Create Function"

3. **Fill in:**
   - **Name:** `geminiTTS`
   - **Runtime:** `Node.js 18.0`
   - **Execute Access:** `Any`
   - **Timeout:** `15` seconds

4. **Click:** "Create"

---

### Step 2: Add API Key

1. **In the function** → **Settings** tab
2. **Environment Variables** section
3. **Add variable:**
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyCCjuUlmu9UktPggVO2EcAgXFSegBIMMJI`
4. **Click:** "Add"

---

### Step 3: Deploy Code

1. **Go to:** **Deployments** tab
2. **Click:** "Create deployment"
3. **Upload file:** `appwrite-functions/geminiTTS/geminiTTS.tar.gz`
4. **Entrypoint:** `index.js`
5. **Click:** "Create"
6. **Wait** ~30 seconds for deployment

---

### Step 4: Get Function ID

1. **Copy the Function ID** from the function page (top of page)
   - Looks like: `6a06f1234567890abcdef`

2. **Add to `.env`:**
   ```env
   VITE_GEMINI_TTS_FUNCTION_ID=paste_your_function_id_here
   ```

---

### Step 5: Test

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Go to language learning lesson**

3. **Click 🔊 button** - Audio should play!

---

## 📍 Endpoint Information

Your app will call:
```
https://sgp.cloud.appwrite.io/v1/functions/[FUNCTION_ID]/executions
```

This is automatically constructed from:
- `VITE_APPWRITE_ENDPOINT` (already in .env): `https://sgp.cloud.appwrite.io/v1`
- `VITE_GEMINI_TTS_FUNCTION_ID` (you'll add): Your function ID

---

## 🧪 Test in Appwrite Console

Before testing in your app, verify the function works:

1. **Go to function** → **Execute** tab
2. **Body:**
   ```json
   {
     "text": "Hello world",
     "voice": "Kore"
   }
   ```
3. **Click "Execute"**
4. **Should see:**
   ```json
   {
     "success": true,
     "audio": "base64_audio_data_here...",
     "voice": "Kore",
     "textLength": 11
   }
   ```

---

## 🌐 Deploy to Vercel

1. **Add to Vercel environment variables:**
   - Go to: Vercel Project → Settings → Environment Variables
   - Add: `VITE_GEMINI_TTS_FUNCTION_ID` = `your_function_id`

2. **Redeploy:**
   ```bash
   git add .
   git commit -m "Add Gemini TTS function"
   git push
   ```

3. **Done!** TTS will work on deployed site 🎉

---

## ❓ Troubleshooting

### "Function not configured" error
- Check `VITE_GEMINI_TTS_FUNCTION_ID` is in `.env`
- Restart dev server

### Function returns error
- Check function logs in Appwrite Console
- Verify `GEMINI_API_KEY` is set in function environment variables
- Make sure function is deployed and active

### Audio not playing
- Open browser console (F12)
- Look for error messages
- Check if function is being called

---

## 📊 What Happens

```
User clicks 🔊
    ↓
Browser calls Appwrite Function
    ↓
Function calls Gemini TTS API
    ↓
Returns base64 audio
    ↓
Browser plays audio ✅
```

---

## ✅ Checklist

- [ ] Create function in Appwrite Console
- [ ] Add `GEMINI_API_KEY` environment variable
- [ ] Upload `geminiTTS.tar.gz` file
- [ ] Copy function ID
- [ ] Add `VITE_GEMINI_TTS_FUNCTION_ID` to `.env`
- [ ] Test locally
- [ ] Add to Vercel env vars
- [ ] Deploy to Vercel
- [ ] Test on deployed site

---

**Total time:** ~5-10 minutes  
**Cost:** Free (within Appwrite + Gemini free tiers)
