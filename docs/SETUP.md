# LastWeek Setup Guide

## Prerequisites

- Node.js 16+ and npm/yarn
- Git
- Appwrite account (self-hosted or cloud)
- Cloudflare account (for R2 storage)
- API keys for external services

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/lastweek.git
cd lastweek
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://your-appwrite-instance.com/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_API_KEY=your_api_key
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID=pdf_resources
VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID=audio_lectures
VITE_APPWRITE_EXAM_PLANS_COLLECTION_ID=exam_plans
VITE_APPWRITE_STUDY_SESSIONS_COLLECTION_ID=study_sessions

# Cloudflare R2 Configuration
VITE_R2_ACCOUNT_ID=your_account_id
VITE_R2_ACCESS_KEY_ID=your_access_key
VITE_R2_SECRET_ACCESS_KEY=your_secret_key
VITE_R2_BUCKET_NAME=lastweek-audio
VITE_R2_PUBLIC_URL=https://your-r2-public-url.r2.dev

# AI Service APIs
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key

# Application Configuration
VITE_APP_NAME=LastWeek
VITE_APP_URL=http://localhost:5173
```

### 4. Appwrite Setup

#### Create Database

1. Go to Appwrite Console
2. Create a new database named `lastweek`
3. Note the database ID

#### Create Collections

Create the following collections with their attributes:

**Collection: `pdf_resources`**
```
- userId (String, Required)
- sessionId (String, Required)
- fileName (String, Required)
- fileSize (Integer)
- storageFileId (String)
- pageCount (Integer)
- extractedText (String, Large)
- notes (String)
- currentPage (Integer)
- bookmarks (String)
- highlights (String)
- tags (String)
- aiTitle (String)
- isPublic (Boolean, Default: false)
- lastAccessedAt (DateTime)
- createdAt (DateTime)
```

**Collection: `audio_lectures`**
```
- userId (String, Required)
- sessionId (String, Required)
- title (String, Required)
- audioFileId (String)
- audioUrl (String)
- transcript (String, Large)
- lectureNotes (String, Large)
- duration (Integer)
- isPublic (Boolean, Default: false)
- createdAt (DateTime)
- updatedAt (DateTime)
```

**Collection: `exam_plans`**
```
- userId (String, Required)
- examName (String, Required)
- examDate (DateTime)
- topics (String)
- schedule (String)
- progress (String)
- createdAt (DateTime)
```

**Collection: `study_sessions`**
```
- userId (String, Required)
- title (String, Required)
- mode (String)
- subject (String)
- status (String)
- messages (String, Large)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Create Indexes

For better performance, create these indexes:

```
pdf_resources:
- Index on (userId, sessionId)
- Index on (isPublic)

audio_lectures:
- Index on (userId, sessionId)
- Index on (isPublic)

exam_plans:
- Index on (userId)

study_sessions:
- Index on (userId)
```

### 5. Cloudflare R2 Setup

1. Go to Cloudflare Dashboard
2. Create R2 bucket named `lastweek-audio`
3. Generate API token with R2 permissions
4. Configure CORS policy:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 6. API Keys Setup

#### Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `.env` as `VITE_GEMINI_API_KEY`

#### DeepSeek API
1. Go to [DeepSeek Platform](https://platform.deepseek.com)
2. Create API key
3. Add to `.env` as `VITE_DEEPSEEK_API_KEY`

### 7. Development Server

```bash
npm run dev
# or
yarn dev
```

Server runs on `http://localhost:5173`

### 8. Build for Production

```bash
npm run build
# or
yarn build
```

Output in `dist/` directory

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
vercel
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

Build and run:

```bash
docker build -t lastweek .
docker run -p 3000:3000 lastweek
```

## Database Backup

### Appwrite Backup

```bash
# Export database
appwrite database export --database-id=your_database_id

# Import database
appwrite database import --database-id=your_database_id --file=backup.json
```

### R2 Backup

Use Cloudflare's built-in backup features or sync to another bucket.

## Troubleshooting

### Common Issues

**Issue**: PDF worker not loading
- **Solution**: Ensure `public/pdf.worker.min.js` exists and is correct version

**Issue**: Audio upload fails
- **Solution**: Check R2 credentials and bucket permissions

**Issue**: Transcription fails
- **Solution**: Verify Gemini API key and audio file format

**Issue**: Database connection error
- **Solution**: Check Appwrite endpoint and API key in `.env`

### Debug Mode

Enable debug logging:

```javascript
// In main.jsx
localStorage.setItem('debug', 'lastweek:*');
```

## Performance Optimization

### Frontend

1. Enable gzip compression in Vite
2. Use code splitting for large components
3. Implement lazy loading for routes
4. Cache static assets

### Backend

1. Create database indexes
2. Optimize query patterns
3. Use pagination for large datasets
4. Implement caching strategies

## Security Checklist

- [ ] Environment variables not committed
- [ ] API keys rotated regularly
- [ ] CORS properly configured
- [ ] Authentication enforced
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] HTTPS enforced in production
- [ ] Rate limiting configured
- [ ] Audit logging enabled

## Monitoring

### Application Monitoring

- Use Sentry for error tracking
- Implement analytics
- Monitor API response times
- Track user engagement

### Infrastructure Monitoring

- Monitor Appwrite health
- Track R2 storage usage
- Monitor API rate limits
- Alert on errors

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review and rotate API keys
- Backup database weekly
- Monitor storage usage
- Review error logs
- Update documentation

### Scaling Considerations

- Database optimization for large datasets
- CDN for static assets
- Load balancing for multiple instances
- Caching strategies
- Database replication

## Support

For issues and questions:
- GitHub Issues: [Report bugs](https://github.com/yourusername/lastweek/issues)
- Documentation: [Read docs](./README.md)
- Email: support@lastweek.com

## Next Steps

1. Complete setup following this guide
2. Read [TUTORIAL.md](./TUTORIAL.md) for user guide
3. Check [FEATURES.md](./FEATURES.md) for feature details
4. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
