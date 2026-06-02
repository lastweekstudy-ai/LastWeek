# Appwrite Functions

This directory contains serverless functions deployed to Appwrite.

## 📁 Functions Overview

### ✅ aiProxyUniversal (Active - NEW)
**Purpose:** Secure AI proxy for all providers  
**Status:** Ready to deploy  
**Supports:** DeepSeek, Gemini, Groq, OpenRouter  
**Features:** Chat, Vision, Audio transcription  
**Package:** `aiProxyUniversal.tar.gz`

**Quick Start:** See `aiProxyUniversal/QUICKSTART.md`

### ✅ paddleWebhook (Active)
**Purpose:** Handle Paddle payment webhooks  
**Status:** Production (deployed)  
**Handles:** Subscription events, payment notifications

### ⚠️ aiProxy (Deprecated)
**Purpose:** Old DeepSeek-only proxy  
**Status:** Superseded by aiProxyUniversal  
**Action:** Can be deleted after migration

## 🚀 Quick Deploy

### Deploy aiProxyUniversal:

1. **Upload to Appwrite:**
   - Go to: Appwrite Console → Functions → Create Function
   - Function ID: `aiProxyUniversal`
   - Upload: `aiProxyUniversal.tar.gz`

2. **Set Environment Variables:**
   ```env
   DEEPSEEK_API_KEY=your_key
   GEMINI_API_KEY=your_key
   GROQ_API_KEY=your_key
   OPENROUTER_API_KEY=your_key
   ```

3. **Test:**
   - Navigate to: http://localhost:5173/test-ai
   - Click "Test AI Proxy"
   - Should get AI response

## 📚 Documentation

- **Quick Start:** `aiProxyUniversal/QUICKSTART.md` (5 minutes)
- **Deployment:** `aiProxyUniversal/DEPLOYMENT.md` (detailed)
- **Migration:** `../docs/SECURE_AI_MIGRATION.md` (step-by-step)
- **Summary:** `../AI_SECURITY_SUMMARY.md` (overview)
- **Checklist:** `../DEPLOYMENT_CHECKLIST.md` (track progress)

## 🔧 Development

### Build a New Function:

1. Create folder: `appwrite-functions/myFunction/`
2. Add files:
   - `index.js` (main handler)
   - `package.json` (dependencies)
3. Package:
   ```bash
   cd myFunction
   tar -czf ../myFunction.tar.gz index.js package.json
   ```
4. Upload to Appwrite Console

### Function Structure:

```javascript
export default async ({ req, res, log, error }) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.json({}, 200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
  }

  // Your logic here
  log('Function executed');
  
  return res.json({ success: true, data: 'result' }, 200);
};
```

## 🔐 Security Best Practices

✅ **DO:**
- Store API keys in Appwrite environment variables
- Use CORS headers for browser requests
- Log important events for debugging
- Handle errors gracefully
- Validate input data

❌ **DON'T:**
- Hardcode API keys in function code
- Expose internal errors to client
- Skip input validation
- Log sensitive data
- Allow unrestricted CORS (use specific origins in production)

## 📊 Monitoring

### View Executions:
1. Appwrite Console → Functions → [Function Name]
2. Click "Executions" tab
3. See: logs, response times, errors

### Useful Metrics:
- Execution count (total requests)
- Success rate (should be >99%)
- Average duration (should be <5s)
- Error rate (should be <1%)

## 🐛 Troubleshooting

### Function fails to deploy:
- Check tarball contains correct files
- Verify Node.js version compatibility
- Check for syntax errors in index.js

### Function returns 500:
- Check environment variables are set
- View logs in Executions tab
- Verify API endpoints are correct

### Slow responses:
- First request is always slow (cold start)
- Subsequent requests should be fast
- Consider upgrading Appwrite plan

### CORS errors:
- Verify CORS headers in function
- Check browser console for specific error
- Ensure preflight (OPTIONS) is handled

## 📦 Function Packages

All `.tar.gz` files are deployment packages containing:
- `index.js` - Main function code
- `package.json` - Dependencies and metadata

**Do not modify `.tar.gz` files directly.** Edit source files and rebuild.

## 🔄 Updating Functions

### To update an existing function:

1. Edit source files in function folder
2. Rebuild tarball:
   ```bash
   cd functionName
   tar -czf ../functionName.tar.gz index.js package.json
   ```
3. Go to Appwrite Console → Functions → [Function]
4. Click "Create Deployment"
5. Upload new tarball
6. Click "Activate" after deployment completes

## 🎯 Next Steps

1. Deploy `aiProxyUniversal` (see QUICKSTART.md)
2. Test using test component at `/test-ai`
3. Migrate features (see SECURE_AI_MIGRATION.md)
4. Monitor usage in Appwrite Console
5. Enjoy secure AI! 🎉
