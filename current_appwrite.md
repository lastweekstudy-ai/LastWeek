Messages table columns:

$id — string — indexed

sessionId — string (255) — required — indexed

userId — string (255) — required — indexed

role — string (20) — required — indexed

content — string (1048576) — required

createdAt — datetime — required — indexed

$createdAt — datetime

$updatedAt — datetime

Messages table indexes:

sessionId_index → sessionId

sessionId_createdAt_compound → sessionId, createdAt

userId_index → userId

userId_createdAt_compound → userId, createdAt

sessionId_role_compound → sessionId, role

createdAt_index → createdAt


Sessions table columns:

$id — string — indexed

userId — string (255) — required — indexed

mode — string (50) — required — indexed

subject — string (255) — required

title — string (255) — required

createdAt — datetime — required

updatedAt — datetime — required — indexed

$createdAt — datetime

$updatedAt — datetime

Sessions table indexes:

userId_index → userId

updatedAt_index → updatedAt

userId_updatedAt_compound → userId, updatedAt

mode_index → mode

userId_mode_compound → userId, mode



### Flashcards Collection Data

**Collection Name:** flashcards

---

**Columns (Attributes)**

* **$id**: string (Indexed)
* **userId**: string (Required, Size: 255, Indexed)
* **sessionId**: string (Required, Size: 255, Indexed)
* **front**: string (Required, Size: 2000)
* **back**: string (Required, Size: 2000)
* **confidence**: integer (Required, Range: -9.22e+18 to 9.22e+18, Indexed)
* **nextReviewAt**: datetime (Required, Indexed)
* **createdAt**: datetime (Required, Indexed)
* **$createdAt**: datetime
* **$updatedAt**: datetime

---

**Indexes**

* **userId_index**: Type: key | Column: userId | Length: 0
* **sessionId_index**: Type: key | Column: sessionId | Length: 0
* **userId_nextReviewAt_compound**: Type: key | Columns: userId, nextReviewAt | Lengths: 0,0
* **userId_confidence_compound**: Type: key | Columns: userId, confidence | Lengths: 0,0
* **userId_createdAt_compound**: Type: key | Columns: userId, createdAt | Lengths: 0,0
* **sessionId_nextReviewAt_compound**: Type: key | Columns: sessionId, nextReviewAt | Lengths: 0,0



### File Attachments Collection Data

**Collection Name:** file_attachments

---

**Columns (Attributes)**

* **$id**: string (Indexed)
* **userId**: string (Required, Size: 255, Indexed)
* **sessionId**: string (Required, Size: 255, Indexed)
* **fileName**: string (Required, Size: 500)
* **fileType**: string (Required, Size: 500, Indexed)
* **fileSize**: integer (Required, Range: -9.22e+18 to 9.22e+18, Indexed)
* **fileId**: string (Size: 255, Default: NULL)
* **content**: string (Size: 1048576, Default: NULL)
* **createdAt**: datetime (Required, Indexed)
* **$createdAt**: datetime
* **$updatedAt**: datetime

---

**Indexes**

* **userId_index**: Type: key | Column: userId | Length: 0
* **sessionId_index**: Type: key | Column: sessionId | Length: 0
* **session_createdAt_compound**: Type: key | Columns: sessionId, createdAt | Lengths: 0,0
* **userId_fileType_compound**: Type: key | Columns: userId, fileType | Lengths: 0,0
* **userId_createdAt_compound**: Type: key | Columns: userId, createdAt | Lengths: 0,0
* **userId_fileSize_compound**: Type: key | Columns: userId, fileSize | Lengths: 0,0



### PDF Highlights Collection Data

**Collection Name:** pdf_highlights

---

**Columns (Attributes)**

* **$id**: string (Indexed)
* **userId**: string (Required, Size: 255, Indexed)
* **pdfResourceId**: string (Required, Size: 255, Indexed)
* **pageNumber**: integer (Required, Range: -9.22e+18 to 9.22e+18, Indexed)
* **highlightedText**: string (Required, Size: 5000)
* **position**: string (Required, Size: 1000)
* **createdAt**: datetime (Required)
* **color**: string (Size: 20, Default: yellow)
* **$createdAt**: datetime
* **$updatedAt**: datetime

---

**Indexes**

* **pdfResourceId_index**: Type: key | Column: pdfResourceId | Length: 0
* **pageNumber_index**: Type: key | Column: pageNumber | Length: 0
* **userId_index**: Type: key | Column: userId | Length: 0


### **1. Collection: pdf_notes**

**Columns (Attributes)**

* **$id**: string (Indexed)
* **userId**: string (Required, Size: 255, Indexed)
* **pdfResourceId**: string (Required, Size: 255, Indexed)
* **pageNumber**: integer (Required, Range: -9.22e+18 to 9.22e+18, Indexed)
* **noteText**: string (Required, Size: 10000)
* **position**: string (Required, Size: 500)
* **color**: string (Size: 20, Default: yellow)
* **createdAt**: datetime (Required, Indexed)
* **updatedAt**: datetime (Required)
* **$createdAt**: datetime
* **$updatedAt**: datetime

**Indexes**

* **pdfResourceId_index**: Type: key | Column: pdfResourceId | Length: 0
* **pageNumber_index**: Type: key | Column: pageNumber | Length: 0
* **userId_index**: Type: key | Column: userId | Length: 0
* **createdAt_index**: Type: key | Column: createdAt | Length: 0

---

### **2. Collection: pdf_resources**

**Columns (Attributes)**

* **$id**: string (Indexed)
* **userId**: string (Required, Size: 255, Indexed)
* **sessionId**: string (Required, Size: 255, Indexed)
* **fileName**: string (Required, Size: 500)
* **fileSize**: integer (Required, Range: -9.22e+18 to 9.22e+18)
* **storageFileId**: string (Size: 255, Default: NULL)
* **pageCount**: integer (Range: -9.22e+18 to 9.22e+18, Default: NULL)
* **thumbnail**: string (Size: 2000, Default: NULL)
* **extractedText**: string (Size: 1048576, Default: NULL)
* **notes**: string (Size: 1048576, Default: NULL)
* **currentPage**: integer (Range: -9.22e+18 to 9.22e+18, Default: 1)
* **bookmarks**: string (Size: 10000, Default: NULL)
* **highlights**: string (Size: 50000, Default: NULL)
* **tags**: string (Size: 1000, Default: NULL)
* **lastAccessedAt**: datetime (Required, Indexed)
* **createdAt**: datetime (Required)
* **viewCount**: integer (Range: -9.22e+18 to 9.22e+18, Default: 0)
* **studyTimeMinutes**: integer (Range: -9.22e+18 to 9.22e+18, Default: 0)
* **isFavorite**: boolean (Indexed, Default: false)
* **category**: string (Size: 100, Indexed, Default: NULL)
* **$createdAt**: datetime
* **$updatedAt**: datetime

**Indexes**

* **userId_index**: Type: key | Column: userId | Length: 0
* **sessionId_index**: Type: key | Column: sessionId | Length: 0
* **category_index**: Type: key | Column: category | Length: 0
* **isFavorite_index**: Type: key | Column: isFavorite | Length: 0
* **lastAccessedAt_index**: Type: key | Column: lastAccessedAt | Length: 0

---

### **3. Collection: user_profiles**

**Columns (Attributes)**

* **$id**: string (Indexed)
* **userId**: string (Required, Size: 255, Indexed)
* **displayName**: string (Required, Size: 200)
* **currentMode**: string (Size: 50, Indexed, Default: NULL)
* **totalSessions**: integer (Range: -9.22e+18 to 9.22e+18, Indexed, Default: 0)
* **createdAt**: datetime (Required, Indexed)
