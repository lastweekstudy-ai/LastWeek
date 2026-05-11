# LastWeek Troubleshooting Guide

## Common Issues & Solutions

### Authentication Issues

#### Problem: Can't Log In

**Symptoms**:
- Login button doesn't work
- "Invalid credentials" error
- Stuck on login page

**Solutions**:
1. Check email spelling
2. Verify password is correct
3. Clear browser cache and cookies
4. Try incognito/private mode
5. Check if account exists (sign up if needed)
6. Reset password if forgotten

**Debug**:
```javascript
// Check authentication status
const user = await account.get();
console.log('Current user:', user);
```

#### Problem: Session Expires Quickly

**Symptoms**:
- Logged out after few minutes
- "Session expired" message
- Need to login repeatedly

**Solutions**:
1. Check browser cookie settings
2. Ensure cookies are enabled
3. Check if third-party cookies blocked
4. Verify Appwrite session timeout settings
5. Check system time is correct

---

### PDF Issues

#### Problem: PDF Won't Load

**Symptoms**:
- Blank PDF viewer
- "Failed to load PDF" error
- PDF viewer shows loading spinner forever

**Solutions**:
1. Check file size (max 100MB)
2. Verify PDF is not corrupted
3. Try different PDF file
4. Clear browser cache
5. Check browser console for errors

**Debug**:
```javascript
// Check PDF worker
console.log('PDF.js version:', pdfjsLib.version);
console.log('Worker URL:', pdfjsLib.GlobalWorkerOptions.workerSrc);
```

#### Problem: PDF Text Not Extracting

**Symptoms**:
- PDF loads but no text extracted
- "Text extraction failed" message
- Can't search within PDF

**Solutions**:
1. Verify PDF has selectable text (not image-based)
2. Try re-uploading PDF
3. Check file is not password-protected
4. Ensure PDF is valid format
5. Try different PDF

**Debug**:
```javascript
// Check extracted text
console.log('Extracted text length:', resource.extractedText?.length);
console.log('First 100 chars:', resource.extractedText?.substring(0, 100));
```

#### Problem: Highlighting Not Saving

**Symptoms**:
- Highlights disappear after refresh
- "Failed to save highlight" error
- Highlights not appearing in list

**Solutions**:
1. Check internet connection
2. Verify user is logged in
3. Check browser console for errors
4. Try highlighting again
5. Refresh page and try again

**Debug**:
```javascript
// Check highlights in database
const highlights = await getPDFHighlights(pdfId);
console.log('Highlights:', highlights);
```

---

### Audio Issues

#### Problem: Audio Won't Upload

**Symptoms**:
- Upload button doesn't work
- "Upload failed" error
- File stuck in uploading state

**Solutions**:
1. Check file size (max 25MB)
2. Verify audio format is supported
3. Check internet connection
4. Try different audio file
5. Clear browser cache

**Debug**:
```javascript
// Check file details
console.log('File size:', audioFile.size);
console.log('File type:', audioFile.type);
console.log('File name:', audioFile.name);
```

#### Problem: Audio Won't Play

**Symptoms**:
- Audio player shows but no sound
- "Failed to load audio" error
- Player stuck on loading

**Solutions**:
1. Check browser audio permissions
2. Verify audio URL is accessible
3. Try different browser
4. Check R2 storage configuration
5. Verify CORS settings

**Debug**:
```javascript
// Check audio element
const audio = document.querySelector('audio');
console.log('Audio src:', audio.src);
console.log('Audio error:', audio.error);
console.log('Network state:', audio.networkState);
```

#### Problem: Transcription Fails

**Symptoms**:
- "Transcription failed" error
- Audio processes but no transcript
- Stuck on "Transcribing..." step

**Solutions**:
1. Check audio file quality
2. Verify Gemini API key is valid
3. Check API rate limits
4. Try shorter audio file
5. Check audio format is supported

**Debug**:
```javascript
// Check API response
console.log('Gemini API key set:', !!import.meta.env.VITE_GEMINI_API_KEY);
console.log('Audio duration:', audioFile.duration);
```

#### Problem: Note Generation Fails

**Symptoms**:
- "Note generation failed" error
- Transcript works but notes don't generate
- Stuck on "Creating notes..." step

**Solutions**:
1. Check DeepSeek API key is valid
2. Verify API rate limits
3. Check transcript is not empty
4. Try shorter transcript
5. Check API response

**Debug**:
```javascript
// Check transcript
console.log('Transcript length:', transcript?.length);
console.log('DeepSeek API key set:', !!import.meta.env.VITE_DEEPSEEK_API_KEY);
```

---

### Resource Library Issues

#### Problem: Can't Find Shared Resources

**Symptoms**:
- Search returns no results
- "No resources found" message
- Can't find resource you know exists

**Solutions**:
1. Check resource is marked public
2. Try different search terms
3. Check topic expansion keywords
4. Verify resource was uploaded successfully
5. Try searching by exact title

**Debug**:
```javascript
// Check if resource is public
const resource = await databases.getDocument(
  DATABASE_ID,
  PDF_RESOURCES_COLLECTION_ID,
  resourceId
);
console.log('Is public:', resource.isPublic);
```

#### Problem: Can't Import Resource

**Symptoms**:
- "Import failed" error
- Import button doesn't work
- Resource added but doesn't appear

**Solutions**:
1. Check internet connection
2. Verify you're in correct session
3. Check storage quota
4. Try importing different resource
5. Refresh page and try again

**Debug**:
```javascript
// Check session
console.log('Current session:', sessionId);
console.log('User ID:', userId);
```

#### Problem: Imported Resource Not Showing

**Symptoms**:
- Import says successful but resource missing
- Resource appears then disappears
- Can't find imported resource

**Solutions**:
1. Refresh page
2. Check correct session is selected
3. Verify import actually completed
4. Check resource list is loading
5. Try importing again

**Debug**:
```javascript
// Check resources in session
const resources = await getSessionPDFs(sessionId);
console.log('Resources in session:', resources);
```

---

### Study Mode Issues

#### Problem: Study Mode Won't Start

**Symptoms**:
- "Failed to start session" error
- Study interface doesn't load
- Stuck on loading screen

**Solutions**:
1. Check internet connection
2. Verify session was created
3. Try refreshing page
4. Clear browser cache
5. Try different study mode

**Debug**:
```javascript
// Check session
const session = await databases.getDocument(
  DATABASE_ID,
  STUDY_SESSIONS_COLLECTION_ID,
  sessionId
);
console.log('Session:', session);
```

#### Problem: Chat Not Responding

**Symptoms**:
- Chat message doesn't send
- "Failed to send message" error
- AI not responding

**Solutions**:
1. Check internet connection
2. Verify API keys are set
3. Check API rate limits
4. Try shorter message
5. Refresh page

**Debug**:
```javascript
// Check API configuration
console.log('Gemini API key:', !!import.meta.env.VITE_GEMINI_API_KEY);
console.log('DeepSeek API key:', !!import.meta.env.VITE_DEEPSEEK_API_KEY);
```

#### Problem: Flashcards Not Saving

**Symptoms**:
- "Failed to save flashcard" error
- Flashcards disappear after refresh
- Can't create flashcards

**Solutions**:
1. Check internet connection
2. Verify user is logged in
3. Check database connection
4. Try creating simpler flashcard
5. Refresh page

---

### Performance Issues

#### Problem: App Runs Slowly

**Symptoms**:
- Slow page loads
- Lag when scrolling
- Buttons take time to respond

**Solutions**:
1. Clear browser cache
2. Close other tabs
3. Check internet speed
4. Disable browser extensions
5. Try different browser

**Debug**:
```javascript
// Check performance
console.time('Page Load');
// ... do something
console.timeEnd('Page Load');
```

#### Problem: High Memory Usage

**Symptoms**:
- Browser uses lots of RAM
- App crashes after using for a while
- "Out of memory" errors

**Solutions**:
1. Close other applications
2. Refresh page periodically
3. Avoid opening too many resources
4. Clear browser cache
5. Restart browser

---

### Database Issues

#### Problem: Can't Save Data

**Symptoms**:
- "Database error" message
- Data doesn't save
- "Connection failed" error

**Solutions**:
1. Check internet connection
2. Verify Appwrite is running
3. Check Appwrite endpoint in .env
4. Verify API key is correct
5. Check database permissions

**Debug**:
```javascript
// Test database connection
try {
  const test = await databases.listDocuments(
    DATABASE_ID,
    PDF_RESOURCES_COLLECTION_ID,
    [Query.limit(1)]
  );
  console.log('Database connected');
} catch (err) {
  console.error('Database error:', err);
}
```

#### Problem: Collection Not Found

**Symptoms**:
- "Collection not found" error
- "Invalid collection ID" message
- Can't access resources

**Solutions**:
1. Verify collection ID in .env
2. Check collection exists in Appwrite
3. Verify collection name spelling
4. Check database ID is correct
5. Recreate collection if needed

---

### Storage Issues

#### Problem: Can't Upload Files

**Symptoms**:
- "Upload failed" error
- File stuck uploading
- "Storage error" message

**Solutions**:
1. Check file size limits
2. Verify storage bucket exists
3. Check R2 credentials
4. Verify CORS configuration
5. Check storage quota

**Debug**:
```javascript
// Check R2 configuration
console.log('R2 Account ID:', !!import.meta.env.VITE_R2_ACCOUNT_ID);
console.log('R2 Access Key:', !!import.meta.env.VITE_R2_ACCESS_KEY_ID);
console.log('R2 Bucket:', import.meta.env.VITE_R2_BUCKET_NAME);
```

#### Problem: Can't Access Uploaded Files

**Symptoms**:
- "File not found" error
- Uploaded file URL doesn't work
- 404 errors for files

**Solutions**:
1. Verify file was uploaded successfully
2. Check file URL is correct
3. Verify R2 public URL is correct
4. Check CORS settings
5. Verify file permissions

---

### Browser Compatibility

#### Problem: Features Don't Work in Browser

**Symptoms**:
- Features work in Chrome but not Firefox
- "Not supported" errors
- Buttons don't respond

**Solutions**:
1. Update browser to latest version
2. Try different browser
3. Check browser compatibility
4. Disable browser extensions
5. Clear cache and cookies

**Supported Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

### Network Issues

#### Problem: Slow Connection

**Symptoms**:
- Pages load slowly
- Uploads take forever
- Timeouts occur

**Solutions**:
1. Check internet speed
2. Move closer to router
3. Restart router
4. Close bandwidth-heavy apps
5. Try wired connection

#### Problem: Connection Drops

**Symptoms**:
- "Connection lost" errors
- App disconnects randomly
- Uploads fail mid-way

**Solutions**:
1. Check internet stability
2. Restart router
3. Check WiFi signal strength
4. Try wired connection
5. Contact ISP if persistent

---

## Debug Mode

### Enable Debug Logging

```javascript
// In browser console
localStorage.setItem('debug', 'lastweek:*');
location.reload();
```

### Check Logs

```javascript
// View logs in console
console.log('Debug logs enabled');
```

### Disable Debug Logging

```javascript
localStorage.removeItem('debug');
location.reload();
```

---

## Getting Help

### Before Contacting Support

1. Check this troubleshooting guide
2. Check browser console for errors
3. Try clearing cache and cookies
4. Try different browser
5. Check internet connection
6. Verify all credentials are correct

### Contact Support

- **Email**: support@lastweek.com
- **GitHub Issues**: [Report bug](https://github.com/yourusername/lastweek/issues)
- **Documentation**: [Read docs](./README.md)

### Provide Information

When reporting issues, include:
- Browser and version
- Operating system
- Steps to reproduce
- Error messages
- Screenshots
- Console logs

---

## FAQ

**Q: Why is my PDF not extracting text?**
A: PDFs with images instead of text can't extract. Try OCR or use a different PDF.

**Q: Can I use LastWeek offline?**
A: Limited offline support. Cached content is available, but new uploads require internet.

**Q: What's the maximum file size?**
A: PDFs max 100MB, audio max 25MB, images max 50MB.

**Q: How long does transcription take?**
A: Usually 1-5 minutes depending on audio length.

**Q: Can I share resources with specific people?**
A: Currently only public/private. Specific sharing coming soon.

**Q: How do I delete my account?**
A: Go to Settings → Account → Delete Account.

**Q: Is my data backed up?**
A: Yes, Appwrite handles automatic backups.

**Q: Can I export my data?**
A: Yes, contact support for data export.

---

## Performance Tips

1. **Limit Open Resources**: Don't open too many PDFs at once
2. **Use Pagination**: Browse resources in pages
3. **Clear Cache**: Regularly clear browser cache
4. **Close Tabs**: Close unused tabs to free memory
5. **Update Browser**: Keep browser updated
6. **Disable Extensions**: Disable unnecessary extensions
7. **Use Wired Connection**: Faster than WiFi
8. **Restart Regularly**: Restart browser periodically

---

## Security Tips

1. **Strong Password**: Use complex password
2. **Don't Share Credentials**: Never share login info
3. **Logout When Done**: Always logout
4. **Check URL**: Verify you're on correct site
5. **Report Issues**: Report security issues immediately
6. **Update Software**: Keep everything updated
7. **Use HTTPS**: Always use secure connection
8. **Verify Emails**: Check email sender before clicking links

---

Last Updated: 2024
