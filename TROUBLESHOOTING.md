# Troubleshooting Guide

Common issues and their solutions.

---

## Installation Issues

### npm install fails
**Symptoms**: Errors during `npm install`

**Solutions**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Try `npm install --legacy-peer-deps`
4. Update Node.js to version 18+

### Vite build fails
**Symptoms**: Build errors, missing dependencies

**Solutions**:
1. Clear Vite cache: `rm -rf node_modules/.vite`
2. Rebuild: `npm run build`
3. Check for syntax errors in code
4. Verify all imports are correct

---

## Authentication Issues

### Cannot register/login
**Symptoms**: "User creation failed" or "Invalid credentials"

**Solutions**:
1. Check Appwrite endpoint in `.env`
2. Verify Email/Password auth is enabled in Appwrite
3. Check password requirements (8+ chars, uppercase, lowercase, number)
4. Clear browser cache and cookies
5. Check Appwrite logs for errors

### "Project not found"
**Symptoms**: 404 error on auth requests

**Solutions**:
1. Verify `VITE_APPWRITE_PROJECT_ID` in `.env`
2. Check project exists in Appwrite console
3. Ensure project ID is copied correctly (case-sensitive)

### CORS errors
**Symptoms**: "Access-Control-Allow-Origin" errors

**Solutions**:
1. Add `localhost:5173` to Appwrite platforms
2. Add your production domain
3. Check Appwrite CORS settings
4. Clear browser cache

---

## Database Issues

### "Collection not found"
**Symptoms**: 404 errors when accessing collections

**Solutions**:
1. Verify all collection IDs in `.env` match Appwrite
2. Check collections exist in Appwrite console
3. Ensure database ID is correct
4. Collection IDs are case-sensitive

### "Permission denied"
**Symptoms**: 401/403 errors on database operations

**Solutions**:
1. Set collection permissions to `user:[USER_ID]`
2. Enable Read, Create, Update, Delete for users
3. Check user is logged in
4. Verify user ID matches

### Messages not saving
**Symptoms**: Messages disappear or don't save

**Solutions**:
1. Check `content` attribute size is **1000000** (not 255)
2. Verify `messages` collection permissions
3. Check indexes are created
4. Look for errors in console
5. Check Appwrite logs

### Slow queries
**Symptoms**: Long load times, timeouts

**Solutions**:
1. Create indexes on frequently queried fields
2. Check index order (ASC/DESC)
3. Limit query results
4. Use pagination
5. Monitor Appwrite performance

---

## PDF Issues

### PDF upload fails
**Symptoms**: "Upload failed" error

**Solutions**:
1. Check file size (must be under bucket limit)
2. Verify storage bucket exists (`study_files`)
3. Check bucket permissions (`user:[USER_ID]`)
4. Verify file extension is allowed (pdf)
5. Check storage quota

### PDF text extraction empty
**Symptoms**: `extractedText` is empty or error message

**Solutions**:
1. **Re-upload the PDF** (most common fix)
2. Check `extractedText` attribute size is **1000000**
3. Verify PDF is not scanned/image-only
4. Check console for extraction errors
5. Try a different PDF to test

### PDF text has no page markers
**Symptoms**: `hasPageMarkers: false` in console

**Solutions**:
1. **Re-upload the PDF** after latest code update
2. Old PDFs have AI summary instead of raw text
3. Check `extractedTextPreview` starts with `=== PAGE 1 ===`
4. Delete old PDF and upload again

### "PDF context not available"
**Symptoms**: AI says it can't access PDF

**Solutions**:
1. Open PDF in split-screen view (click PDF in resources)
2. Type question in chat on RIGHT side of split screen
3. Don't type in main chat - use PDF split-screen chat
4. Check `extractedText` is not empty
5. Re-upload PDF if needed

### PDF queries not accurate
**Symptoms**: AI gives wrong page/line information

**Solutions**:
1. Ensure PDF has page markers (`=== PAGE X ===`)
2. Re-upload PDF with latest code
3. Check `extractedTextLength` is large (40000+)
4. Verify line format: `Line 1: [text]`

---

## AI Response Issues

### Gemini 503 errors
**Symptoms**: "Service Unavailable" or "High demand"

**Solutions**:
1. This is normal - Gemini has rate limits
2. App automatically falls back to DeepSeek
3. Wait a few seconds and try again
4. Check Gemini API key is valid
5. Monitor Gemini quota

### DeepSeek not responding
**Symptoms**: No AI response after sending message

**Solutions**:
1. Check DeepSeek API key in `.env`
2. Verify API key is active
3. Check console for errors
4. Look at Network tab for failed requests
5. Try refreshing page

### AI response doesn't appear
**Symptoms**: Message sent but no response shows

**Solutions**:
1. Check console logs for errors
2. Look for `[useSession]` logs
3. Verify message saved to database
4. Check if AI call succeeded
5. Refresh page and try again
6. **Current known issue** - under investigation

### AI gives generic responses
**Symptoms**: AI doesn't use PDF context

**Solutions**:
1. Ensure PDF is open in split-screen
2. Type in PDF split-screen chat (not main chat)
3. Check `contextLength` in console (should be 40000+)
4. Verify `hasPageMarkers: true`
5. Re-upload PDF if needed

---

## UI Issues

### Infinite loading/buffering
**Symptoms**: Screen keeps loading, repeated logs

**Solutions**:
1. **Fixed in latest version**
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)
4. Check for useEffect dependency issues
5. Look for infinite loops in console

### Keyboard shortcuts don't work
**Symptoms**: Ctrl+K, Ctrl+D, etc. don't work

**Solutions**:
1. **Fixed in latest version**
2. Ensure you're not typing in input field
3. Check browser doesn't override shortcuts
4. Try different browser
5. Check console for errors

### Theme not persisting
**Symptoms**: Theme resets on page reload

**Solutions**:
1. Check localStorage is enabled
2. Clear browser cache
3. Check for localStorage errors in console
4. Try incognito mode to test

### Profile dropdown not showing
**Symptoms**: Can't access settings or logout

**Solutions**:
1. Check user is logged in
2. Verify ProfileDropdown component loaded
3. Check for CSS issues
4. Look for JavaScript errors
5. Try different browser

---

## Performance Issues

### Slow page loads
**Solutions**:
1. Check network speed
2. Optimize images
3. Enable code splitting
4. Use lazy loading
5. Check Appwrite response times

### High memory usage
**Solutions**:
1. Close unused tabs
2. Clear browser cache
3. Check for memory leaks in console
4. Limit message history
5. Optimize PDF rendering

### Slow PDF rendering
**Solutions**:
1. Reduce PDF page size
2. Limit visible pages
3. Use PDF thumbnails
4. Optimize PDF file
5. Check browser performance

---

## Development Issues

### Hot reload not working
**Solutions**:
1. Restart dev server
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Check file watchers limit (Linux)
4. Verify file changes are saved
5. Try hard refresh

### Build fails
**Solutions**:
1. Check for syntax errors
2. Verify all imports
3. Run `npm run build` for detailed errors
4. Check TypeScript errors (if using TS)
5. Clear dist folder

### Tests failing
**Solutions**:
1. Update test dependencies
2. Check test environment setup
3. Mock external dependencies
4. Verify test data
5. Check async handling

---

## Debugging Tips

### Enable Debug Logging
All components have debug logs. Check console for:
- `[ChatInterface]` - Chat operations
- `[StudyInterface]` - PDF operations
- `[useSession]` - AI processing
- `[MentalModel]` - Mode-specific logs

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by XHR/Fetch
4. Look for failed requests
5. Check request/response data

### Check Appwrite Logs
1. Go to Appwrite Console
2. Click on your project
3. Go to Logs section
4. Filter by errors
5. Check timestamps

### Check Browser Console
1. Press F12
2. Go to Console tab
3. Look for red errors
4. Check warnings
5. Review stack traces

### Common Error Patterns

**"Cannot read property of undefined"**
→ Check if data is loaded before accessing

**"Network request failed"**
→ Check Appwrite endpoint, internet connection

**"Invalid session"**
→ User logged out, refresh page

**"Quota exceeded"**
→ Check Appwrite storage/database limits

---

## Getting Help

### Before Asking for Help
1. Check this troubleshooting guide
2. Review console logs
3. Check Appwrite logs
4. Try in incognito mode
5. Test with different browser

### When Asking for Help
Include:
1. Error message (full text)
2. Console logs
3. Steps to reproduce
4. Browser and version
5. Appwrite version
6. Relevant code snippets

### Resources
- Project Documentation: `PROJECT_DOCUMENTATION.md`
- Appwrite Setup: `APPWRITE_COMPLETE_SETUP.md`
- Quick Start: `QUICK_START.md`
- Appwrite Docs: https://appwrite.io/docs
- React Docs: https://react.dev

---

## Still Having Issues?

1. Create detailed GitHub issue
2. Include all debugging information
3. Attach screenshots if relevant
4. Describe expected vs actual behavior
5. List what you've already tried

---

Last Updated: May 8, 2026
