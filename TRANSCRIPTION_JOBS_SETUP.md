# Transcription Jobs Collection Setup

## Step 1: Create Collection in Appwrite Console

1. Go to Appwrite Console → Databases → Your Database (ID: `69f742a2001f393e4b85`)
2. Click "Create Collection"
3. **Collection ID**: `transcription_jobs`
4. **Name**: Transcription Jobs

## Step 2: Create Attributes

Click "Create Attribute" for each:

### 1. userId
- **Type**: String
- **Size**: 255
- **Required**: Yes
- **Default**: (none)

### 2. status
- **Type**: String
- **Size**: 50
- **Required**: Yes
- **Default**: "pending"
- **Values**: pending, processing, completed, failed

### 3. audioData
- **Type**: String
- **Size**: 10000000 (10MB for base64 audio)
- **Required**: Yes
- **Default**: (none)

### 4. result
- **Type**: String
- **Size**: 100000 (100KB for transcript)
- **Required**: No
- **Default**: (none)

### 5. error
- **Type**: String
- **Size**: 1000
- **Required**: No
- **Default**: (none)

### 6. createdAt (auto-created by Appwrite)
### 7. updatedAt (auto-created by Appwrite)

## Step 3: Create Indexes

Click "Create Index" for each:

### 1. userId_index
- **Type**: Key
- **Attributes**: userId
- **Order**: ASC

### 2. status_index
- **Type**: Key
- **Attributes**: status
- **Order**: ASC

### 3. userId_status_index (composite)
- **Type**: Key
- **Attributes**: userId, status
- **Order**: ASC, ASC

## Step 4: Set Permissions

Click "Settings" → "Permissions":

### Create permissions:
- **Role**: Any authenticated user
- **Permissions**: Create

### Read permissions:
- **Role**: User (select "Creator")
- **Permissions**: Read

### Update permissions:
- **Role**: Any (we'll restrict via API key in function)
- **Permissions**: Update

### Delete permissions:
- **Role**: User (select "Creator")
- **Permissions**: Delete

## Step 5: Update .env

Add to your `.env` file:
```env
VITE_APPWRITE_TRANSCRIPTION_JOBS_COLLECTION_ID=transcription_jobs
```

## Step 6: Test Collection

Once created, you should see it in your Appwrite Console under:
**Databases → [Your Database] → Collections → transcription_jobs**

## Next Steps

After creating the collection:
1. Update the Appwrite Function to handle async transcription
2. Update client code to use database polling
3. Deploy and test

See `TRANSCRIPTION_JOBS_IMPLEMENTATION.md` for code changes.
