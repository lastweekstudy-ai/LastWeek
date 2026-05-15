# Appwrite TTS Permissions Guide

Complete guide to understanding and configuring permissions for the TTS system.

## 🔒 Permission Strategy

The TTS system uses **document-level permissions** for security and flexibility.

### Why Document-Level Permissions?

✅ **Better Security** - Each document has its own permissions  
✅ **User Privacy** - Users can only see their own usage data  
✅ **Shared Cache** - Everyone can read cached audio (saves API costs)  
✅ **Flexible** - Easy to customize per use case

## 📊 Collection Permissions

### Collection 1: TTS Cache Metadata

**Purpose**: Shared cache for all users

**Collection-Level Settings**:
- Document Security: **Enabled**
- Collection Permissions: **Empty** (uses document-level)

**Document-Level Permissions** (set when creating documents):
```javascript
[
  'read("any")',        // Anyone can read (shared cache)
  'update("users")',    // Any authenticated user can update
  'delete("users")',    // Any authenticated user can delete
]
```

**Why "any" for read?**
- Cache is shared across all users
- Same text + voice = same audio file
- Reduces API calls and costs
- No sensitive data in cache metadata

**Security Notes**:
- Text is truncated to 500 chars (no full content stored)
- File IDs are SHA-256 hashes (no personal data)
- Audio files contain no user information

### Collection 2: TTS Usage

**Purpose**: Per-user usage tracking

**Collection-Level Settings**:
- Document Security: **Enabled**
- Collection Permissions: **Empty** (uses document-level)

**Document-Level Permissions** (set when creating documents):
```javascript
[
  `read("user:${userId}")`,      // Only this user can read
  `update("user:${userId}")`,    // Only this user can update
  `delete("user:${userId}")`,    // Only this user can delete
]
```

**Why user-specific?**
- Usage data is private
- Quota management per user
- Prevents users from seeing others' usage
- Enables accurate billing/limits

## 🛠️ Setup Instructions

### Automated Setup

The setup script automatically configures document-level permissions:

```bash
npm run setup:tts
```

**What it does**:
1. Creates collections with document security enabled
2. Sets collection permissions to empty (document-level)
3. Documents will use permissions set in code

### Manual Setup

#### Step 1: Create Collection

When creating each collection in Appwrite Console:

1. Go to **Databases** → Your Database
2. Click **"Create Collection"**
3. Enter Collection ID and Name
4. Click **"Create"**

#### Step 2: Enable Document Security

1. Go to collection **Settings** tab
2. Find **"Document Security"** section
3. Toggle **ON** (enabled)
4. Click **"Update"**

#### Step 3: Set Collection Permissions

1. Still in **Settings** tab
2. Find **"Permissions"** section
3. **Leave it EMPTY** (no roles added)
4. This enables document-level permissions

**Visual Guide**:
```
┌─────────────────────────────────────┐
│ Settings                            │
├─────────────────────────────────────┤
│ Document Security                   │
│ ● Enabled  ○ Disabled               │
│                                     │
│ Permissions                         │
│ (empty - using document-level)      │
│                                     │
│ [No roles configured]               │
└─────────────────────────────────────┘
```

## 🔐 Permission Patterns

### Pattern 1: Shared Cache (TTS Cache Metadata)

**Use Case**: Audio files that can be shared across users

```javascript
await databases.createDocument(
  DATABASE_ID,
  COLLECTION_ID,
  ID.unique(),
  { /* data */ },
  [
    'read("any")',        // Anyone can read
    'update("users")',    // Authenticated users can update
    'delete("users")',    // Authenticated users can delete
  ]
);
```

**When to use**:
- Cached content
- Public resources
- Shared data

### Pattern 2: User-Private (TTS Usage)

**Use Case**: Data that belongs to a specific user

```javascript
await databases.createDocument(
  DATABASE_ID,
  COLLECTION_ID,
  ID.unique(),
  { userId, /* data */ },
  [
    `read("user:${userId}")`,      // Only this user
    `update("user:${userId}")`,    // Only this user
    `delete("user:${userId}")`,    // Only this user
  ]
);
```

**When to use**:
- User preferences
- Usage statistics
- Private data

### Pattern 3: Admin Access

**Use Case**: Data that admins need to access

```javascript
await databases.createDocument(
  DATABASE_ID,
  COLLECTION_ID,
  ID.unique(),
  { /* data */ },
  [
    `read("user:${userId}")`,      // User can read
    'read("team:admins")',         // Admins can read
    `update("user:${userId}")`,    // User can update
    'update("team:admins")',       // Admins can update
    `delete("user:${userId}")`,    // User can delete
    'delete("team:admins")',       // Admins can delete
  ]
);
```

**When to use**:
- Moderation needed
- Support access required
- Analytics/reporting

## 🧪 Testing Permissions

### Test 1: Cache Read (Should Work)

```javascript
import { speak } from './tts';

// User A creates cache
await speak("Hello", { userId: 'user-a' });

// User B reads from cache (should work)
await speak("Hello", { userId: 'user-b' });
// Should be instant (cached)
```

### Test 2: Usage Privacy (Should Fail)

```javascript
import { databases } from 'appwrite';

// User A's usage
await logUsage('user-a', 100, 'Kore');

// User B tries to read User A's usage (should fail)
try {
  const docs = await databases.listDocuments(
    DATABASE_ID,
    TTS_USAGE_COLLECTION_ID,
    [Query.equal('userId', 'user-a')]
  );
  console.log('❌ Security breach!', docs);
} catch (error) {
  console.log('✅ Correctly blocked:', error.message);
}
```

### Test 3: Own Usage (Should Work)

```javascript
import { getMonthlyUsage } from './tts';

// User can read their own usage
const usage = await getMonthlyUsage('user-a');
console.log('✅ Own usage:', usage);
```

## 🔍 Verifying Permissions

### In Appwrite Console

1. **Go to Collection**
   - Databases → Your Database → Collection

2. **Check Settings**
   - Settings tab
   - Document Security: **Enabled**
   - Permissions: **Empty**

3. **Check Documents**
   - Documents tab
   - Click any document
   - See "Permissions" section
   - Should show document-specific permissions

### In Code

```javascript
// Check if document has correct permissions
const doc = await databases.getDocument(
  DATABASE_ID,
  COLLECTION_ID,
  DOCUMENT_ID
);

console.log('Permissions:', doc.$permissions);
// Should show: ['read("any")', 'update("users")', ...]
```

## 🐛 Common Permission Issues

### Issue 1: "Unauthorized" Error

**Cause**: User not authenticated or wrong permissions

**Solution**:
```javascript
// Make sure user is logged in
import { account } from './appwrite';
const user = await account.get();
console.log('User:', user.$id);

// Use correct userId in permissions
await speak("Hello", { userId: user.$id });
```

### Issue 2: Can't Read Own Usage

**Cause**: Document permissions not set correctly

**Solution**:
```javascript
// Check document permissions
const docs = await databases.listDocuments(
  DATABASE_ID,
  TTS_USAGE_COLLECTION_ID
);

docs.documents.forEach(doc => {
  console.log('Doc permissions:', doc.$permissions);
  // Should include: read("user:YOUR_USER_ID")
});
```

### Issue 3: Cache Not Shared

**Cause**: Cache documents have user-specific permissions

**Solution**:
- Check cache documents have `read("any")`
- Verify collection has document security enabled
- Re-run setup script if needed

### Issue 4: "Document not found"

**Cause**: User doesn't have permission to read document

**Solution**:
```javascript
// For usage queries, only query own documents
const usage = await databases.listDocuments(
  DATABASE_ID,
  TTS_USAGE_COLLECTION_ID,
  [
    Query.equal('userId', currentUser.$id), // Only own docs
  ]
);
```

## 🔧 Advanced Configurations

### Custom Quota Limits Per User

```javascript
// Store quota in user document
const userQuota = {
  userId: user.$id,
  monthlyLimit: 200000, // 200k chars
  tier: 'premium',
};

// Check against custom quota
const used = await getMonthlyUsage(user.$id);
if (used > userQuota.monthlyLimit) {
  throw new Error('Quota exceeded');
}
```

### Team/Organization Sharing

```javascript
// Share cache within organization
await databases.createDocument(
  DATABASE_ID,
  TTS_CACHE_COLLECTION_ID,
  ID.unique(),
  { /* data */ },
  [
    `read("team:${orgId}")`,      // Team members can read
    `update("team:${orgId}")`,    // Team members can update
    `delete("team:${orgId}")`,    // Team members can delete
  ]
);
```

### Admin Dashboard Access

```javascript
// Admins can see all usage
await databases.createDocument(
  DATABASE_ID,
  TTS_USAGE_COLLECTION_ID,
  ID.unique(),
  { userId, /* data */ },
  [
    `read("user:${userId}")`,     // User can read
    'read("label:admin")',        // Admins can read
    `update("user:${userId}")`,   // User can update
    `delete("user:${userId}")`,   // User can delete
    'delete("label:admin")',      // Admins can delete
  ]
);
```

## 📊 Permission Best Practices

### 1. Principle of Least Privilege

✅ **Do**: Give minimum permissions needed
```javascript
// User only needs to read their own usage
[`read("user:${userId}")`]
```

❌ **Don't**: Give broad permissions unnecessarily
```javascript
// Too permissive
['read("any")', 'update("any")', 'delete("any")']
```

### 2. Separate Public and Private Data

✅ **Do**: Use different collections for different access levels
- `tts_cache_metadata` - Public read (shared)
- `tts_usage` - Private (user-specific)

❌ **Don't**: Mix public and private in same collection

### 3. Always Set Permissions

✅ **Do**: Explicitly set permissions on document creation
```javascript
await databases.createDocument(
  DATABASE_ID,
  COLLECTION_ID,
  ID.unique(),
  { data },
  [/* permissions */]  // Always include
);
```

❌ **Don't**: Rely on collection-level permissions for document security

### 4. Test Permission Boundaries

✅ **Do**: Test that users can't access others' data
```javascript
// Try to access another user's data (should fail)
try {
  await getMonthlyUsage('other-user-id');
} catch (error) {
  console.log('✅ Correctly blocked');
}
```

### 5. Log Permission Errors

✅ **Do**: Log and monitor permission errors
```javascript
try {
  await databases.createDocument(/* ... */);
} catch (error) {
  if (error.code === 401) {
    console.error('Permission denied:', error);
    // Alert admins
  }
}
```

## 📝 Summary

### TTS Cache Metadata
- **Security**: Document-level
- **Read**: Anyone (`read("any")`)
- **Write**: Authenticated users
- **Purpose**: Shared cache

### TTS Usage
- **Security**: Document-level
- **Read**: Owner only (`read("user:${userId}")`)
- **Write**: Owner only
- **Purpose**: Private usage tracking

### Setup
1. Enable document security on collections
2. Leave collection permissions empty
3. Set permissions when creating documents
4. Test with multiple users

### Testing
- ✅ Cache is shared across users
- ✅ Usage is private per user
- ✅ Unauthorized access is blocked
- ✅ Own data is accessible

---

**Need Help?**
- Check Appwrite Console → Collection → Settings
- Verify document security is enabled
- Review document permissions in Documents tab
- Test with different user accounts
