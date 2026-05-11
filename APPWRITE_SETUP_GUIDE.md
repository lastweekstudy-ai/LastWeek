# Appwrite Collection Setup Guide

This guide explains how to properly configure the Appwrite collections for LastWeek, particularly the `audio_lectures` collection which needs the `sessionId` attribute.

## Overview

LastWeek uses Appwrite as its backend database. Several collections need to be created and configured with specific attributes. This guide covers the setup process.

## Collections Required

### 1. sessions
- **Purpose**: Store study sessions
- **Attributes**:
  - `userId` (String, required)
  - `mode` (String, required) - mental_model, active_recall, focus_breakdown, collaborative_scholar, creative_synthesis
  - `subject` (String, required)
  - `title` (String, required)
  - `createdAt` (DateTime, required)
  - `updatedAt` (DateTime, required)

### 2. messages
- **Purpose**: Store chat messages within sessions
- **Attributes**:
  - `sessionId` (String, required)
  - `userId` (String, required)
  - `role` (String, required) - "user" or "assistant"
  - `content` (String, required)
  - `createdAt` (DateTime, required)

### 3. pdf_resources
- **Purpose**: Store PDF documents and their metadata
- **Attributes**:
  - `userId` (String, required)
  - `sessionId` (String, required)
  - `fileName` (String, required)
  - `fileSize` (Integer)
  - `aiTitle` (String)
  - `isPublic` (Boolean, default: false) ← **IMPORTANT: Must be added**
  - `createdAt` (DateTime, required)
  - `updatedAt` (DateTime, required)

### 4. audio_lectures
- **Purpose**: Store audio lectures and their transcriptions
- **Attributes**:
  - `userId` (String, required)
  - `sessionId` (String) ← **IMPORTANT: Must be added for session scoping**
  - `title` (String, required)
  - `audioFileId` (String, required)
  - `audioUrl` (String, required)
  - `transcript` (String, required)
  - `lectureNotes` (String, required)
  - `duration` (Integer)
  - `isPublic` (Boolean, default: false) ← **IMPORTANT: Must be added**
  - `createdAt` (DateTime, required)
  - `updatedAt` (DateTime, required)

### 5. flashcards
- **Purpose**: Store flashcards for spaced repetition
- **Attributes**:
  - `userId` (String, required)
  - `sessionId` (String, required)
  - `front` (String, required)
  - `back` (String, required)
  - `confidence` (Integer, default: 0)
  - `nextReviewAt` (DateTime, required)
  - `createdAt` (DateTime, required)

### 6. profiles
- **Purpose**: Store user profile information
- **Attributes**:
  - `userId` (String, required)
  - `displayName` (String, required)
  - `currentMode` (String)
  - `totalSessions` (Integer, default: 0)
  - `createdAt` (DateTime, required)

### 7. attachments
- **Purpose**: Store file attachments
- **Attributes**:
  - `userId` (String, required)
  - `sessionId` (String, required)
  - `fileName` (String, required)
  - `fileType` (String, required)
  - `fileSize` (Integer)
  - `fileId` (String)
  - `content` (String)
  - `createdAt` (DateTime, required)

## Adding the sessionId Attribute to audio_lectures

If you're getting an error like "Unknown attribute: sessionId" when uploading audio lectures, follow these steps:

### Step 1: Open Appwrite Console
1. Go to your Appwrite console (usually at `https://your-appwrite-domain/console`)
2. Log in with your credentials
3. Select your project

### Step 2: Navigate to the Database
1. Click on "Databases" in the left sidebar
2. Select your database (usually "lastweek" or similar)
3. Click on the "audio_lectures" collection

### Step 3: Add the sessionId Attribute
1. Click the "+" button to add a new attribute
2. Fill in the following:
   - **Attribute ID**: `sessionId`
   - **Type**: String
   - **Required**: No (leave unchecked - it's optional for backward compatibility)
   - **Encrypted**: No
   - **Default Value**: (leave empty)
3. Click "Create"

### Step 4: Add the isPublic Attribute (if not already present)
1. Click the "+" button to add another attribute
2. Fill in the following:
   - **Attribute ID**: `isPublic`
   - **Type**: Boolean
   - **Required**: No
   - **Default Value**: false
3. Click "Create"

### Step 5: Verify
After adding these attributes, try uploading an audio lecture again. The error should be resolved.

## Troubleshooting

### Error: "Unknown attribute: sessionId"
- **Cause**: The `sessionId` attribute hasn't been added to the collection
- **Solution**: Follow the steps above to add it

### Error: "Unknown attribute: isPublic"
- **Cause**: The `isPublic` attribute hasn't been added to the collection
- **Solution**: Follow the steps above to add it

### Audio lectures not appearing in sessions
- **Cause**: The `sessionId` attribute exists but audio lectures were created before it was added
- **Solution**: 
  1. The app will automatically handle this - new audio lectures will have `sessionId` set
  2. Existing audio lectures without `sessionId` will still appear in the library but won't be scoped to sessions
  3. To fix existing audio lectures, you can manually update them in the Appwrite console or delete and re-upload them

### Can't find the audio_lectures collection
- **Cause**: The collection hasn't been created yet
- **Solution**: 
  1. Create the collection manually in Appwrite console
  2. Add all the attributes listed in the "audio_lectures" section above
  3. Or, upload an audio lecture in the app - it will create the collection automatically

## Environment Variables

Make sure your `.env` file contains:

```
VITE_APPWRITE_ENDPOINT=https://your-appwrite-domain/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
VITE_APPWRITE_SESSIONS_COLLECTION_ID=sessions
VITE_APPWRITE_MESSAGES_COLLECTION_ID=messages
VITE_APPWRITE_PDF_RESOURCES_COLLECTION_ID=pdf_resources
VITE_APPWRITE_AUDIO_LECTURES_COLLECTION_ID=audio_lectures
VITE_APPWRITE_FLASHCARDS_COLLECTION_ID=flashcards
VITE_APPWRITE_PROFILES_COLLECTION_ID=profiles
VITE_APPWRITE_ATTACHMENTS_COLLECTION_ID=attachments
```

## Running Migrations

After setting up the collections, you can run migrations to ensure all existing data is properly formatted:

1. The app will automatically run migrations on first load
2. Check the browser console for migration logs
3. Look for messages like "[Migration] Audio migration complete"

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure all collections and attributes are created as specified above
4. Check Appwrite logs for more detailed error information
