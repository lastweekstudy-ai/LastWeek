# File Prompt Input Design (FilePromptInput.css)

**File**: `src/styles/FilePromptInput.css`

**Purpose**: UI for processing uploaded files. Shows file info and prompts user for instructions on how to process the file.

---

## Layout Structure

```
.file-prompt-input (border, border-radius, slide-in animation)
  ├─ .file-prompt-header (border-bottom)
  │   ├─ .file-info
  │   │   ├─ .file-icon (📄)
  │   │   └─ .file-details
  │   │       ├─ .file-name "document.pdf"
  │   │       └─ .file-status "Ready to process"
  │   └─ .close-btn (×)
  └─ .prompt-form
      ├─ .prompt-input-container
      │   └─ .prompt-textarea "What would you like me to do with this file?"
      └─ .prompt-actions
          ├─ .prompt-hints "e.g., Summarize, Extract key points"
          └─ .send-btn "Process File"
```

**Design Intent**: 
- **Appears after file upload**: Slides in from top
- **File info**: Shows filename and status
- **Prompt input**: User describes what to do with file
- **Send button**: Submits file + prompt to AI

---

## Root Container

```css
.file-prompt-input {
  background: var(--surface-color);
  border: 2px solid var(--primary-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Dimensions**: 
- Padding: 16px
- Border: 2px purple
- Border radius: 12px
- Margin-bottom: 16px

**Design Intent**: 
- **Purple border**: Accent color draws attention
- **Slide-in animation**: Appears from top (10px slide + fade)
- **Shadow**: Subtle depth
- **Rounded corners**: Softer than sharp edges

**Why slide-in?**: 
- Smooth appearance (not jarring)
- Indicates new content
- 0.3s duration is quick but noticeable

---

## Header

```css
.file-prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 24px;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.file-status {
  font-size: 12px;
  color: var(--success-color);
  font-weight: 500;
}
```

**Dimensions**: 
- Icon: 24px
- Filename: 14px
- Status: 12px
- Gap: 12px (icon to details), 4px (name to status)

**Design Intent**: 
- **Icon + details**: Left-aligned
- **Close button**: Right-aligned
- **Border-bottom**: Separates header from form
- **Green status**: "Ready to process" (success color)

**File icons**: 
- 📄 PDF
- 📊 Excel/CSV
- 📝 Word/Text
- 🖼️ Image
- 📦 Other

### Close Button

```css
.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--background-hover);
  color: var(--text-primary);
}
```

**Dimensions**: 
- Padding: 4px
- Border radius: 4px

**Design Intent**: 
- **Transparent**: No background by default
- **Hover: gray background**: Indicates interactivity
- **Muted color**: Not prominent (secondary action)

---

## Form

```css
.prompt-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prompt-input-container {
  position: relative;
}

.prompt-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--background-color);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;
}

.prompt-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.prompt-textarea::placeholder {
  color: var(--text-muted);
}
```

**Dimensions**: 
- Padding: 12px
- Min height: 80px
- Font: 14px
- Line height: 1.5

**Design Intent**: 
- **Full-width**: Spans entire container
- **Resizable**: User can drag to resize vertically
- **Focus: purple border + glow**: 3px purple glow (10% opacity)
- **Placeholder**: "What would you like me to do with this file?"

**Why min-height 80px?**: 
- Enough space for 3-4 lines of text
- Not too tall (doesn't dominate)
- User can resize if needed

---

## Actions

```css
.prompt-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prompt-hints {
  font-size: 12px;
  color: var(--text-muted);
}

.hint-text {
  font-style: italic;
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Dimensions**: 
- Button padding: 10px vertical, 20px horizontal
- Font: 14px
- Gap: 8px (icon to text)
- Hints: 12px

**Design Intent**: 
- **Hints on left**: "e.g., Summarize, Extract key points"
- **Button on right**: Primary action
- **Purple button**: Accent color
- **Hover: lift + shadow**: 1px up + purple shadow
- **Active: press down**: Returns to 0 (tactile feedback)
- **Disabled: dimmed**: 50% opacity

**Why hints?**: 
- Suggests common actions
- Reduces cognitive load
- Helps users get started

---

## Responsive Behavior

```css
@media (max-width: 768px) {
  .file-prompt-input {
    padding: 12px;
  }

  .file-icon {
    font-size: 20px;
  }

  .file-name {
    font-size: 13px;
  }

  .file-status {
    font-size: 11px;
  }

  .prompt-textarea {
    font-size: 13px;
    min-height: 60px;
  }

  .prompt-actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .send-btn {
    width: 100%;
    justify-content: center;
  }

  .prompt-hints {
    text-align: center;
  }
}
```

**Design Intent**: 
- **Reduced padding**: 12px (from 16px)
- **Smaller text**: 13px (from 14px)
- **Shorter textarea**: 60px min-height (from 80px)
- **Stacked actions**: Hints above button
- **Full-width button**: Easier to tap
- **Centered hints**: Balanced layout

---

## Summary

**Key Design Decisions**:

1. **Slide-in animation**: Appears smoothly from top
2. **Purple border**: Accent color draws attention
3. **File info**: Icon + filename + status
4. **Resizable textarea**: User can adjust height
5. **Focus glow**: Purple border + 3px glow
6. **Hints**: Suggests common actions
7. **Hover lift**: Button lifts 1px + shadow
8. **Mobile: stacked layout**: Hints above button

**Why this design?**: 
- **Clear purpose**: File info + prompt input
- **Guided**: Hints suggest actions
- **Accessible**: Large touch targets, good contrast
- **Smooth**: Slide-in animation, hover effects

**Interaction flow**: 
1. User uploads file (drag-drop or click)
2. File prompt input slides in
3. Shows filename + "Ready to process"
4. User types prompt (e.g., "Summarize this document")
5. Click "Process File"
6. File + prompt sent to AI
7. AI responds in chat

**Common prompts**: 
- "Summarize this document"
- "Extract key points"
- "Create flashcards from this"
- "Quiz me on this content"
- "Translate this to [language]"
- "Explain the main concepts"

**Technical notes**: 
- **@keyframes slideIn**: Fade + slide from top
- **:focus box-shadow**: 3px purple glow (10% opacity)
- **:disabled**: 50% opacity + not-allowed cursor
- **resize: vertical**: User can drag to resize textarea
- **transform: translateY()**: Lift/press button on hover/active
