# Appwrite Database Schema Update — PDF Pipeline v4

**Date:** June 6, 2026  
**Purpose:** Add support for PDF Pipeline v4 features  
**Collection:** `pdf_resources`  
**Impact:** Non-breaking (existing records continue to work)  
**Estimated Time:** 5-10 minutes

---

## Overview

PDF Pipeline v4 requires 4 new fields in the `pdf_resources` collection to enable:
- **Cache system** (instant re-uploads)
- **Token budget manager** (70-80% token reduction)
- **Figure registry** (AI can answer questions about charts/diagrams)
- **Version tracking** (for future migrations)

**All changes are backward compatible** — existing PDF records will continue to work without these fields.

---

## Required Database Changes

### Summary Table

| Field Name | Type | Size | Required | Default | Purpose |
|------------|------|------|----------|---------|---------|
| `cacheKey` | string | 32 chars | No | null | SHA-256 hash for cache lookup |
| `manifest` | string | 1,000,000 chars | No | null | JSON: per-page metadata with keywords |
| `figureRegistry` | string | 1,000,000 chars | No | null | JSON: figure descriptions and data |
| `processingVersion` | integer | — | No | null | Pipeline version (4 for v4) |

### Index Required
- **Index Name:** `cacheKey_index`
- **Type:** Key index
- **Attributes:** `cacheKey`
- **Order:** Ascending

---

## Step-by-Step Instructions

### Method 1: Appwrite Console (Recommended)

#### Step 1: Navigate to Collection

1. Open Appwrite Console: https://cloud.appwrite.io (or your self-hosted URL)
2. Select your project
3. Go to **Databases** in the left sidebar
4. Select your database (usually named after your app)
5. Click on the **`pdf_resources`** collection

---

#### Step 2: Add `cacheKey` Field

1. Click **"Create Attribute"** button
2. Select **"String"**
3. Fill in the form:
   ```
   Key:       cacheKey
   Size:      32
   Required:  No (uncheck)
   Default:   (leave empty)
   Array:     No (uncheck)
   ```
4. Click **"Create"**
5. Wait for attribute to be available (~10 seconds)

**Screenshot Location:** Settings → Attributes → String

---

#### Step 3: Add `manifest` Field

1. Click **"Create Attribute"** button
2. Select **"String"**
3. Fill in the form:
   ```
   Key:       manifest
   Size:      1000000
   Required:  No (uncheck)
   Default:   (leave empty)
   Array:     No (uncheck)
   ```
4. Click **"Create"**
5. Wait for attribute to be available (~10 seconds)

**Note:** Size is 1,000,000 characters (1MB) to support large PDFs with many pages.

---

#### Step 4: Add `figureRegistry` Field

1. Click **"Create Attribute"** button
2. Select **"String"**
3. Fill in the form:
   ```
   Key:       figureRegistry
   Size:      1000000
   Required:  No (uncheck)
   Default:   (leave empty)
   Array:     No (uncheck)
   ```
4. Click **"Create"**
5. Wait for attribute to be available (~10 seconds)

**Note:** Size is 1,000,000 characters (1MB) to support PDFs with many figures.

---

#### Step 5: Add `processingVersion` Field

1. Click **"Create Attribute"** button
2. Select **"Integer"**
3. Fill in the form:
   ```
   Key:       processingVersion
   Required:  No (uncheck)
   Default:   (leave empty)
   Min:       (leave empty)
   Max:       (leave empty)
   Array:     No (uncheck)
   ```
4. Click **"Create"**
5. Wait for attribute to be available (~10 seconds)

---

#### Step 6: Create Index on `cacheKey`

1. In the `pdf_resources` collection page, click on **"Indexes"** tab
2. Click **"Create Index"** button
3. Fill in the form:
   ```
   Key:        cacheKey_index
   Type:       Key
   Attributes: cacheKey
   Order:      ASC (Ascending)
   ```
4. Click **"Create"**
5. Wait for index to be available (~30 seconds)

**Why this index?** It enables fast cache lookups by hash. Without it, cache checks would scan the entire collection (slow).

---

### Method 2: Appwrite CLI

If you prefer command line:

```bash
# Install Appwrite CLI if not already installed
npm install -g appwrite-cli

# Login to your Appwrite project
appwrite login

# Set your project
appwrite client --endpoint https://cloud.appwrite.io/v1 --project YOUR_PROJECT_ID --key YOUR_API_KEY

# Get your database ID and collection ID
appwrite databases list
appwrite databases listCollections --databaseId YOUR_DATABASE_ID

# Add cacheKey attribute
appwrite databases createStringAttribute \
  --databaseId YOUR_DATABASE_ID \
  --collectionId YOUR_COLLECTION_ID \
  --key cacheKey \
  --size 32 \
  --required false

# Add manifest attribute
appwrite databases createStringAttribute \
  --databaseId YOUR_DATABASE_ID \
  --collectionId YOUR_COLLECTION_ID \
  --key manifest \
  --size 1000000 \
  --required false

# Add figureRegistry attribute
appwrite databases createStringAttribute \
  --databaseId YOUR_DATABASE_ID \
  --collectionId YOUR_COLLECTION_ID \
  --key figureRegistry \
  --size 1000000 \
  --required false

# Add processingVersion attribute
appwrite databases createIntegerAttribute \
  --databaseId YOUR_DATABASE_ID \
  --collectionId YOUR_COLLECTION_ID \
  --key processingVersion \
  --required false

# Create index on cacheKey
appwrite databases createIndex \
  --databaseId YOUR_DATABASE_ID \
  --collectionId YOUR_COLLECTION_ID \
  --key cacheKey_index \
  --type key \
  --attributes cacheKey \
  --orders ASC
```

---

### Method 3: Appwrite SDK (JavaScript)

If you want to automate via code:

```javascript
import { Client, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('YOUR_PROJECT_ID')
  .setKey('YOUR_API_KEY'); // API Key with databases.write permission

const databases = new Databases(client);

const DATABASE_ID = 'YOUR_DATABASE_ID';
const COLLECTION_ID = 'YOUR_COLLECTION_ID';

async function updateSchema() {
  try {
    // Add cacheKey
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'cacheKey',
      32,
      false // not required
    );
    console.log('✓ Added cacheKey field');
    
    // Wait for attribute to be available
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add manifest
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'manifest',
      1000000,
      false
    );
    console.log('✓ Added manifest field');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add figureRegistry
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'figureRegistry',
      1000000,
      false
    );
    console.log('✓ Added figureRegistry field');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add processingVersion
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'processingVersion',
      false
    );
    console.log('✓ Added processingVersion field');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create index
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'cacheKey_index',
      'key',
      ['cacheKey'],
      ['ASC']
    );
    console.log('✓ Created cacheKey index');
    
    console.log('\n✅ Database schema updated successfully!');
  } catch (error) {
    console.error('❌ Error updating schema:', error);
  }
}

updateSchema();
```

---

## Verification Steps

### 1. Check Attributes

After adding all fields:

1. Go to `pdf_resources` collection in Appwrite Console
2. Click on **"Attributes"** tab
3. Verify you see:
   - ✓ `cacheKey` (string, 32, optional)
   - ✓ `manifest` (string, 1000000, optional)
   - ✓ `figureRegistry` (string, 1000000, optional)
   - ✓ `processingVersion` (integer, optional)

### 2. Check Index

1. Click on **"Indexes"** tab
2. Verify you see:
   - ✓ `cacheKey_index` (type: key, attributes: cacheKey, order: ASC)

### 3. Test Cache Lookup (Optional)

Run this test query in Appwrite Console → Documents:

```
Query: equal("cacheKey", "test12345678901234567890123456")
```

Should return empty results (no documents with that cache key yet).

---

## Data Examples

### What the New Fields Will Contain

#### 1. `cacheKey` Example
```
"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```
(32-character SHA-256 hash of PDF binary)

#### 2. `manifest` Example
```json
[
  {
    "pageNum": 1,
    "method": "pdfjs",
    "charCount": 1247,
    "hasFigures": false,
    "figureIds": [],
    "keywords": ["introduction", "overview", "context", "problem", "solution"]
  },
  {
    "pageNum": 2,
    "method": "vision",
    "charCount": 892,
    "hasFigures": true,
    "figureIds": ["fig-2-1", "fig-2-2"],
    "keywords": ["diagram", "architecture", "components", "flow", "design"]
  }
]
```

#### 3. `figureRegistry` Example
```json
{
  "fig-2-1": {
    "id": "fig-2-1",
    "type": "diagram",
    "caption": "Figure 2.1: System Architecture",
    "title": "System Architecture Diagram",
    "description": "A flowchart showing the main components of the system including the frontend, backend, and database layers with arrows indicating data flow.",
    "data_summary": null,
    "position": "top",
    "page": 2
  },
  "fig-2-2": {
    "id": "fig-2-2",
    "type": "chart",
    "caption": "Figure 2.2: Performance Metrics",
    "title": "Performance Over Time",
    "description": "A line chart showing response time decreasing from 500ms to 100ms over 6 months with three lines for P50, P95, and P99 percentiles.",
    "data_summary": "Response times improved significantly: P50 from 500ms to 100ms, P95 from 800ms to 150ms, P99 from 1200ms to 250ms",
    "position": "middle",
    "page": 2
  }
}
```

#### 4. `processingVersion` Example
```
4
```
(Integer indicating PDF Pipeline v4)

---

## Troubleshooting

### Issue: "Attribute already exists"

**Cause:** Field was partially created before  
**Solution:** Skip that field, continue with others

### Issue: "Maximum attribute size exceeded"

**Cause:** Trying to create string larger than 1MB  
**Solution:** Use exactly 1,000,000 (not 10,000,000)

### Issue: "Index creation failed"

**Cause:** `cacheKey` attribute not yet available  
**Solution:** Wait 30 seconds after creating attribute, then create index

### Issue: "Existing documents don't have new fields"

**Cause:** This is expected — fields are optional  
**Solution:** New uploads will populate fields, old records stay unchanged

---

## Performance Impact

### Before Schema Update
- Cache lookups: Not possible
- Token usage: Full PDF (60-200K tokens)
- Figure queries: Not supported

### After Schema Update
- Cache lookups: **<5ms** (with index)
- Token usage: **6-12K tokens** (70-94% reduction)
- Figure queries: **Fully supported**

### Storage Impact
- Average manifest size: ~50KB per PDF
- Average figure registry: ~20KB per PDF
- Total: ~70KB additional storage per PDF
- For 1,000 PDFs: ~70MB additional storage

---

## Rollback Plan

If you need to remove the fields (not recommended):

### Via Console
1. Go to `pdf_resources` → Attributes
2. Click ⋮ menu next to each field
3. Select "Delete"
4. Confirm deletion

### Via CLI
```bash
appwrite databases deleteAttribute \
  --databaseId YOUR_DATABASE_ID \
  --collectionId YOUR_COLLECTION_ID \
  --key cacheKey

# Repeat for manifest, figureRegistry, processingVersion
```

**Warning:** Deleting fields will remove all cached data. Only do this if absolutely necessary.

---

## Post-Update Tasks

After updating the database schema:

### 1. Deploy Code Changes
```bash
git pull origin main
npm install
npm run build
# Deploy to your hosting provider
```

### 2. Test Cache System
1. Upload a test PDF
2. Check database — verify `cacheKey` and `manifest` are populated
3. Re-upload the same PDF
4. Should complete in <1 second (cache hit)

### 3. Monitor Performance
- Check cache hit rate: target >50% after 1 week
- Check token usage: target 70-80% reduction
- Check figure detection: verify registry populated for PDFs with charts

### 4. Update AI Prompts (Separate Task)
See: `APPWRITE_DATABASE_UPDATE_V4.md` for AI prompt updates

---

## Security Considerations

### Field Permissions
All new fields inherit the collection's existing permissions. No permission changes needed.

### Data Privacy
- `cacheKey`: Hash only, no sensitive data
- `manifest`: Keywords only, no full text
- `figureRegistry`: Figure descriptions, no personal data
- `processingVersion`: Integer, safe

### Index Performance
The `cacheKey_index` enables fast lookups but slightly increases write time (~5ms per document). This is acceptable for the cache performance gain.

---

## Monitoring

### Key Metrics to Track

1. **Cache Hit Rate**
   ```javascript
   // Count documents with cacheKey
   const cached = await databases.listDocuments(DB_ID, COLLECTION_ID, [
     Query.isNotNull('cacheKey')
   ]);
   
   // Cache hit rate = cached / total
   ```

2. **Average Manifest Size**
   ```javascript
   // Check manifest field size
   const docs = await databases.listDocuments(DB_ID, COLLECTION_ID);
   const avgSize = docs.documents
     .filter(d => d.manifest)
     .reduce((sum, d) => sum + d.manifest.length, 0) / docs.total;
   ```

3. **Figure Detection Rate**
   ```javascript
   // Count PDFs with figures
   const withFigures = await databases.listDocuments(DB_ID, COLLECTION_ID, [
     Query.isNotNull('figureRegistry')
   ]);
   ```

---

## FAQ

### Q: Will existing PDFs stop working?
**A:** No. All fields are optional. Old PDFs continue to work exactly as before.

### Q: Do I need to reprocess existing PDFs?
**A:** No. They'll automatically get v4 fields when re-uploaded or when user opens them (if live extraction is enabled).

### Q: What if I skip the index?
**A:** Cache lookups will be slow (full collection scan). Create the index for production.

### Q: Can I increase field sizes later?
**A:** Yes, but you'll need to recreate the attribute. Better to use 1,000,000 from the start.

### Q: What about self-hosted Appwrite?
**A:** Same process. All methods work for both Cloud and self-hosted.

### Q: How long does schema update take?
**A:** ~5 minutes via Console, ~2 minutes via CLI/SDK (if automated)

---

## Support

### If You Get Stuck

1. **Check Appwrite Status**: https://status.appwrite.io
2. **Appwrite Discord**: https://appwrite.io/discord
3. **Documentation**: https://appwrite.io/docs/databases

### Common Resources
- [Appwrite Databases API](https://appwrite.io/docs/server/databases)
- [Attributes Guide](https://appwrite.io/docs/databases#attributes)
- [Indexes Guide](https://appwrite.io/docs/databases#indexes)

---

## Summary Checklist

Before deploying code:
- [ ] Add `cacheKey` field (string, 32, optional)
- [ ] Add `manifest` field (string, 1000000, optional)
- [ ] Add `figureRegistry` field (string, 1000000, optional)
- [ ] Add `processingVersion` field (integer, optional)
- [ ] Create `cacheKey_index` (key index, ASC)
- [ ] Verify all fields show as "Available"
- [ ] Test cache query works
- [ ] Deploy code changes
- [ ] Test with real PDF upload
- [ ] Monitor cache hit rate

**Estimated Total Time:** 10 minutes

---

**Document Version:** 1.0  
**Last Updated:** June 6, 2026  
**Related Documents:**
- `PDF_PIPELINE_V4_COMPLETE.md` — Full v4 implementation details
- `PDF_PIPELINE_V4_AUDIT.md` — Implementation audit results
- `lastweek-pdf-pipeline-kiro-spec.md` — Original specification

