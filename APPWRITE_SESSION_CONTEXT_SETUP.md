# Appwrite Setup for Session Context Feature

## New Collection: `session_context`

This collection stores user responses to initial assessment questions for personalized learning.

### Collection Details:
- **Collection ID**: `session_context`
- **Name**: Session Context
- **Permissions**: 
  - Read: User (own documents only)
  - Create: User
  - Update: User (own documents only)
  - Delete: User (own documents only)

### Attributes:

| Attribute Name | Type | Size | Required | Array | Default |
|---------------|------|------|----------|-------|---------|
| `sessionId` | String | 255 | Yes | No | - |
| `userId` | String | 255 | Yes | No | - |
| `mode` | String | 100 | Yes | No | - |
| `responses` | String | 10000 | Yes | No | `{}` |
| `currentLevel` | String | 50 | No | No | `beginner` |
| `learningGoal` | String | 500 | No | No | - |
| `timeAvailable` | String | 50 | No | No | - |
| `preferredStyle` | String | 100 | No | No | - |
| `priorKnowledge` | String | 1000 | No | No | - |
| `specificChallenges` | String | 1000 | No | No | - |
| `assessmentCompleted` | Boolean | - | Yes | No | `false` |
| `createdAt` | DateTime | - | Yes | No | - |
| `updatedAt` | DateTime | - | Yes | No | - |

### Indexes:

1. **Index Name**: `session_index`
   - **Type**: Key
   - **Attributes**: `sessionId` (ASC)

2. **Index Name**: `user_session_index`
   - **Type**: Key
   - **Attributes**: `userId` (ASC), `sessionId` (ASC)

3. **Index Name**: `assessment_status_index`
   - **Type**: Key
   - **Attributes**: `sessionId` (ASC), `assessmentCompleted` (ASC)

### Permissions Setup:

```javascript
// Read permissions
- Role: user:[USER_ID] (Any authenticated user can read their own documents)

// Create permissions
- Role: users (Any authenticated user can create)

// Update permissions
- Role: user:[USER_ID] (Users can update their own documents)

// Delete permissions
- Role: user:[USER_ID] (Users can delete their own documents)
```

## How to Create in Appwrite Console:

1. **Go to Appwrite Console** → Your Project → Databases
2. **Select your database** (or create one if you don't have it)
3. **Click "Create Collection"**
4. **Set Collection ID**: `session_context`
5. **Add all attributes** from the table above
6. **Create the indexes** as specified
7. **Set permissions** as described
8. **Click "Create"**

## Environment Variable:

Add to your `.env` file:
```env
VITE_APPWRITE_SESSION_CONTEXT_COLLECTION_ID=session_context
```

## Quick Setup Commands (if using Appwrite CLI):

```bash
# Create collection
appwrite databases createCollection \
  --databaseId [YOUR_DATABASE_ID] \
  --collectionId session_context \
  --name "Session Context"

# Add attributes (repeat for each attribute)
appwrite databases createStringAttribute \
  --databaseId [YOUR_DATABASE_ID] \
  --collectionId session_context \
  --key sessionId \
  --size 255 \
  --required true

# ... (repeat for other attributes)
```

## Testing:

After setup, test by:
1. Starting a new session
2. Answering the initial questions
3. Check Appwrite Console → Databases → session_context
4. Verify document was created with your responses

---

**Status**: Ready to implement  
**Next Step**: Create this collection in Appwrite Console, then I'll implement the feature
