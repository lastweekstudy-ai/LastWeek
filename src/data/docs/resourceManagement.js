export const resourceManagementContent = {
  id: 'resource-management',
  title: 'Resource Management',
  slug: 'resource-management',
  category: 'Features',
  description: 'Learn how to upload, organize, and manage your study materials',
  estimatedReadingTime: 10,
  lastUpdated: '2026-05-11',
  sections: [
    {
      id: 'supported-formats',
      title: 'Supported File Formats',
      content: `LastWeek supports a wide variety of study materials:

PDF Files:
• Maximum size: 100MB
• Supports scanned documents
• OCR for text extraction
• Preserves formatting and images

Audio Files:
• Formats: MP3, WAV, M4A, OGG
• Maximum size: 25MB
• Automatic transcription
• Timestamp synchronization

Images:
• Formats: JPG, PNG, GIF, WebP
• Maximum size: 50MB
• OCR for text in images
• Supports diagrams and charts

HTML Content:
• Paste HTML directly
• Supports formatted text
• Preserves links and structure

Text Files:
• Plain text (.txt)
• Markdown (.md)
• Maximum size: 10MB

Browser Recording:
• Record audio directly in browser
• No external software needed
• Automatic transcription
• Timestamp notes`,
      keywords: ['formats', 'file types', 'upload', 'supported'],
    },
    {
      id: 'uploading-pdfs',
      title: 'Uploading PDFs',
      content: `PDFs are the most common study material. Here's how to upload and work with them:

Step-by-Step Upload:
1. Click the "Upload" button in your session
2. Select "PDF" from the file type menu
3. Choose your PDF file from your computer
4. Wait for upload to complete (progress bar shows status)
5. PDF appears in your resource library

Tips for PDF Upload:
• Ensure file is less than 100MB
• Use clear, readable PDFs for best OCR
• Scanned documents work fine (OCR extracts text)
• Multiple PDFs can be uploaded to one session
• Upload multiple PDFs at once (batch upload)

After Upload:
• PDF automatically processed
• Text extracted via OCR
• Indexed for search
• Ready for annotation

Working with PDFs:
• View: Click PDF to open viewer
• Annotate: Highlight text and add notes
• Search: Find text across all PDFs
• Reference: AI tutor can reference specific pages
• Export: Download your notes and highlights

PDF Viewer Features:
• Page navigation (arrows or page number input)
• Zoom controls (+ / - buttons or scroll)
• Highlighting (select text, click highlight button)
• Notes (click note button to add annotations)
• Bookmarks (click star to bookmark important pages)
• Search (find text within PDF)
• Full-screen mode

Best Practices:
• Upload textbooks and lecture notes
• Use clear, high-quality scans
• Organize PDFs by subject or chapter
• Add descriptive names to PDFs
• Bookmark important sections
• Take notes while reading`,
      keywords: ['PDF', 'upload', 'annotation', 'viewer'],
    },
    {
      id: 'audio-processing',
      title: 'Audio Processing',
      content: `LastWeek can process audio lectures and recordings, automatically transcribing them into text and structured notes.

Recording Audio:
1. Click "Record" button in session
2. Allow browser to access microphone
3. Click "Start Recording"
4. Speak clearly into microphone
5. Click "Stop Recording" when done
6. Audio automatically transcribed

Uploading Audio Files:
1. Click "Upload" button
2. Select "Audio" from file type menu
3. Choose audio file (MP3, WAV, M4A, OGG)
4. Wait for upload and transcription
5. Transcription appears automatically

Supported Audio Formats:
• MP3 (most common)
• WAV (high quality)
• M4A (Apple format)
• OGG (open format)
• Maximum file size: 25MB

Transcription Features:
• Automatic speech-to-text
• Timestamp synchronization
• Speaker identification
• Punctuation and formatting
• Searchable text

Using Transcriptions:
• Read transcript while listening
• Search for specific topics
• Generate notes from transcript
• Create flashcards from key points
• Reference in AI chat

Audio Processing Tips:
• Speak clearly and at normal pace
• Minimize background noise
• Use good quality microphone
• Record in quiet environment
• Break long lectures into segments

Automatic Note Generation:
LastWeek AI analyzes transcriptions and creates:
• Key points summary
• Main topics identified
• Important definitions
• Suggested flashcards
• Study questions

Example Workflow:
1. Record 1-hour lecture
2. AI transcribes automatically
3. AI generates key points
4. Review and edit notes
5. Create flashcards from notes
6. Study using flashcards`,
      keywords: ['audio', 'recording', 'transcription', 'notes'],
    },
    {
      id: 'organizing-resources',
      title: 'Organizing Resources',
      content: `Keep your study materials organized for easy access and better learning.

Resource Library:
• View all uploaded materials
• Search by name or content
• Filter by type (PDF, audio, image)
• Sort by date or name
• Organize into folders

Creating Folders:
1. Click "New Folder" in library
2. Enter folder name (e.g., "Biology Chapter 5")
3. Click "Create"
4. Drag resources into folder
5. Organize by subject, chapter, or topic

Naming Resources:
Use descriptive names:
• Good: "Biology Chapter 5 - Photosynthesis"
• Good: "Calculus Lecture 12 - Integration"
• Avoid: "Document1", "Audio1", "File"

Tagging Resources:
1. Click resource to open details
2. Click "Add Tags"
3. Enter tags (e.g., "biology", "exam", "important")
4. Save tags
5. Search by tags later

Organizing by Subject:
Create folders for each subject:
• Biology
  - Chapter 1: Cell Structure
  - Chapter 2: Photosynthesis
  - Exam Review
• Chemistry
  - Periodic Table
  - Reactions
  - Lab Notes

Organizing by Study Mode:
Create folders for each mode:
• Mental Model Materials
• Active Recall Flashcards
• Exam Prep Resources
• Focus Breakdown Topics

Search and Filter:
• Search by name: "photosynthesis"
• Search by content: Find text within resources
• Filter by type: Show only PDFs
• Filter by date: Show recent uploads
• Filter by tags: Show tagged resources

Best Practices:
• Use consistent naming conventions
• Create clear folder structure
• Tag important resources
• Archive old materials
• Keep library organized
• Review organization monthly`,
      keywords: ['organization', 'folders', 'tags', 'library'],
    },
    {
      id: 'sharing-resources',
      title: 'Sharing Resources',
      content: `Share your study materials with classmates and import resources from the community.

Making Resources Public:
1. Click resource in library
2. Click "Share" button
3. Select "Make Public"
4. Copy share link
5. Send link to classmates

Sharing Options:
• Public: Anyone can find and import
• Private: Only you can access
• Shared Link: Share with specific people
• Community: Available in shared library

Importing Shared Resources:
1. Click "Browse Community" in library
2. Search for resources
3. Click resource to preview
4. Click "Import" to add to your library
5. Resource appears in your library

Community Library:
• Browse resources by subject
• Search by topic or keyword
• Filter by resource type
• See ratings and reviews
• Import popular resources

Privacy Controls:
• Choose who can see resources
• Control who can import
• Remove resources from sharing
• Delete shared resources
• View who imported your resources

Collaboration Features:
• Share with study group
• Collaborate on notes
• Comment on resources
• Rate and review resources
• Suggest improvements

Best Practices:
• Share high-quality materials
• Add descriptions to resources
• Organize before sharing
• Review shared resources
• Give credit to original creators
• Respect copyright

Example Workflow:
1. Create study notes for biology
2. Make notes public
3. Classmates import your notes
4. You import their chemistry notes
5. Everyone benefits from shared resources`,
      keywords: ['sharing', 'collaboration', 'community', 'import'],
    },
  ],
};
