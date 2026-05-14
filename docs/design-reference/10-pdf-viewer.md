# PDF Viewer Design (PDFViewer.css)

**File**: `src/styles/PDFViewer.css`

**Purpose**: Full-screen PDF viewer with highlighting, bookmarks, and notes. Similar to audio viewer but for PDF documents.

---

## Layout Structure

```
.pdf-viewer-container (fixed, full-screen)
  ├─ .pdf-viewer-header (title + actions)
  │   ├─ .pdf-viewer-title (icon + filename)
  │   └─ .pdf-viewer-actions (highlight, bookmarks, fullscreen, close)
  ├─ .pdf-viewer-toolbar (navigation + zoom)
  │   ├─ .toolbar-section (prev/next page)
  │   ├─ .page-indicator (page input + total)
  │   └─ .toolbar-section (zoom controls)
  ├─ .pdf-viewer-content (scrollable PDF canvas)
  │   ├─ .react-pdf__Page (PDF page)
  │   ├─ .highlight-overlay-layer (colored highlights)
  │   └─ .page-notes-indicator (notes badge)
  ├─ .pdf-bookmarks-sidebar (right sidebar, toggleable)
  │   └─ .bookmarks-list
  └─ .pdf-highlights-sidebar (right sidebar, toggleable)
      └─ .highlights-list
```

**Design Intent**: 
- **Full-screen overlay**: Takes over entire viewport for focused reading
- **Toolbar**: Page navigation, zoom controls
- **Highlighting**: Select text → choose color → save
- **Bookmarks**: Quick navigation to important pages
- **Sidebars**: Toggleable bookmarks/highlights panels

---

## Container

```css
.pdf-viewer-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-primary);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}
```

**Dimensions**: Full viewport (fixed positioning)

**Design Intent**: 
- **Fixed position**: Covers entire viewport
- **Z-index: 1000**: Above everything except modals
- **Flex column**: Header, toolbar, content stack vertically

---

## Header

```css
.pdf-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.pdf-viewer-title h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**Dimensions**: 
- Padding: 16px vertical, 24px horizontal
- Title: 1.125rem (18px)
- Icon: 1.5rem (24px)

**Design Intent**: 
- **Title + actions**: Left-aligned title, right-aligned buttons
- **PDF icon**: 📄 before filename
- **Ellipsis**: Long filenames truncate with "..."

### Action Buttons

```css
.btn-icon {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-icon:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

.btn-icon.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}
```

**Dimensions**: 
- Padding: 8px vertical, 12px horizontal
- Font: 0.875rem (14px)

**Design Intent**: 
- **Highlight button**: Toggle highlighting mode
- **Bookmarks button**: Toggle bookmarks sidebar
- **Fullscreen button**: Toggle fullscreen mode
- **Close button**: Exit PDF viewer (red on hover)

**Buttons**: 
- 🖍️ Highlight
- 🔖 Bookmarks
- ⛶ Fullscreen
- ✕ Close

---

## Toolbar

```css
.pdf-viewer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.btn-toolbar {
  padding: 0.5rem 1rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.btn-toolbar:hover:not(:disabled) {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}
```

**Dimensions**: 
- Padding: 12px vertical, 24px horizontal
- Button padding: 8px vertical, 16px horizontal

**Design Intent**: 
- **Three sections**: Navigation (left), page indicator (center), zoom (right)
- **Hover purple**: Accent color on hover
- **Disabled state**: Dimmed (50% opacity)

### Page Navigation

```css
.page-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
}

.page-input {
  width: 60px;
  padding: 0.25rem 0.5rem;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  text-align: center;
  font-size: 0.875rem;
}
```

**Dimensions**: 
- Input width: 60px
- Padding: 4px vertical, 8px horizontal

**Design Intent**: 
- **Page input**: Type page number to jump
- **Total pages**: "/ 45" shows total
- **Prev/Next buttons**: Navigate sequentially

**Controls**: 
- ← Previous Page
- [Input] / Total
- → Next Page

### Zoom Controls

```css
.zoom-level {
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}
```

**Dimensions**: 
- Min width: 60px
- Padding: 8px vertical, 12px horizontal

**Design Intent**: 
- **Zoom out**: Decrease zoom (−)
- **Zoom level**: Shows current zoom (100%)
- **Zoom in**: Increase zoom (+)
- **Fit width**: Fit page to width
- **Fit page**: Fit entire page

---

## PDF Content Area

```css
.pdf-viewer-content {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--color-bg-tertiary);
  position: relative;
}

.react-pdf__Page {
  box-shadow: var(--shadow-lg);
  background: white;
}

.react-pdf__Page__canvas {
  max-width: 100%;
  height: auto !important;
}
```

**Dimensions**: 
- Padding: 32px
- Background: Tertiary (darker than page)

**Design Intent**: 
- **Centered**: PDF page centered in viewport
- **Scrollable**: overflow: auto for large pages
- **White page**: PDF on white background (like paper)
- **Shadow**: Large shadow for depth

**Why centered?**: 
- Mimics reading a physical document
- Focuses attention on content
- Looks professional

---

## Highlighting

### Highlight Mode

```css
.pdf-viewer-content.highlight-mode {
  cursor: text;
}

.react-pdf__Page__textContent span::selection {
  background: var(--highlight-selection-color, rgba(255, 235, 59, 0.5));
}
```

**Design Intent**: 
- **Text cursor**: Indicates text selection mode
- **Yellow selection**: Default highlight color (customizable)
- **CSS variable**: `--highlight-selection-color` set dynamically

### Highlight Overlay

```css
.highlight-overlay-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.highlight-overlay-layer span {
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  border-radius: 2px;
  mix-blend-mode: multiply;
  transition: opacity 0.15s ease;
}

.highlight-overlay-layer span:hover {
  opacity: 0.6;
}
```

**Design Intent**: 
- **Overlay layer**: Sits on top of PDF text
- **Absolute positioning**: Each highlight positioned precisely
- **mix-blend-mode: multiply**: Blends with text below
- **Hover dim**: 60% opacity on hover (indicates clickable)

### Highlight Colors

```css
.pdf-highlight-yellow  { background-color: rgba(255, 235, 59, 0.4); }
.pdf-highlight-green   { background-color: rgba(76, 175, 80, 0.4); }
.pdf-highlight-blue    { background-color: rgba(33, 150, 243, 0.4); }
.pdf-highlight-pink    { background-color: rgba(233, 30, 99, 0.4); }
.pdf-highlight-orange  { background-color: rgba(255, 152, 0, 0.4); }
.pdf-highlight-purple  { background-color: rgba(156, 39, 176, 0.4); }
```

**Design Intent**: 
- **6 colors**: Yellow, green, blue, pink, orange, purple
- **40% opacity**: Semi-transparent (text visible below)
- **Rounded corners**: 2px border-radius

### Color Picker

```css
.color-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.5rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: var(--color-text-primary);
}

.color-option.active {
  border-color: var(--color-text-primary);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.3);
}
```

**Dimensions**: 
- Color swatch: 32×32px circle
- Gap: 8px

**Design Intent**: 
- **Dropdown**: Appears below color picker button
- **6 color swatches**: Circular buttons
- **Active state**: Border + purple glow
- **Hover scale**: Grows 10% on hover

---

## Highlights Sidebar

```css
.pdf-highlights-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border);
  padding: 1rem;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.highlight-color-indicator {
  width: 4px;
  min-height: 100%;
  border-radius: 2px;
  flex-shrink: 0;
}
```

**Dimensions**: 
- Width: 300px
- Padding: 16px
- Color indicator: 4px wide

**Design Intent**: 
- **Right sidebar**: Slides in from right
- **List of highlights**: Each highlight is a card
- **Colored indicator**: 4px left border matches highlight color
- **Hover effect**: Background changes on hover
- **Remove button**: Delete highlight

---

## Bookmarks Sidebar

```css
.pdf-bookmarks-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 250px;
  height: 100%;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border);
  padding: 1rem;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.bookmark-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--color-bg-tertiary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.bookmark-item:hover {
  background: var(--color-bg-primary);
  transform: translateX(-2px);
}

.bookmark-item.active {
  border-color: var(--color-accent);
  background: var(--color-bg-primary);
}
```

**Dimensions**: 
- Width: 250px
- Padding: 16px
- Border: 2px (active only)

**Design Intent**: 
- **Right sidebar**: Slides in from right
- **List of bookmarks**: Each bookmark is a card
- **Bookmark icon**: 🔖 before title
- **Page number**: Shows page (e.g., "p. 12")
- **Hover slide**: Slides 2px left on hover
- **Active state**: Purple border
- **Remove button**: Delete bookmark

---

## Loading & Error States

```css
.pdf-loading,
.pdf-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--color-text-secondary);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Dimensions**: 
- Spinner: 48×48px
- Border: 4px

**Design Intent**: 
- **Loading**: Spinner + "Loading PDF..."
- **Error**: Error icon + message
- **Centered**: Vertically and horizontally centered

---

## Highlight Instructions

```css
.highlight-instructions {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 24px;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
```

**Dimensions**: 
- Padding: 12px vertical, 24px horizontal
- Border radius: 24px (pill shape)

**Design Intent**: 
- **Appears when highlighting enabled**: "Select text to highlight"
- **Purple pill**: Accent color, rounded
- **Slide-down animation**: Appears from top
- **Auto-dismiss**: Fades out after 3 seconds

---

## Summary

**Key Design Decisions**:

1. **Full-screen overlay**: Focused reading experience
2. **Toolbar**: Page navigation + zoom controls
3. **Highlighting**: 6 colors, 40% opacity, overlay layer
4. **Color picker**: Circular swatches, dropdown
5. **Sidebars**: Toggleable bookmarks/highlights panels (250px/300px)
6. **Colored indicators**: 4px left border matches highlight color
7. **Hover effects**: Slide, scale, dim
8. **White PDF page**: Mimics paper, centered with shadow

**Why this design?**: 
- **Familiar**: Looks like Adobe Reader, PDF.js
- **Focused**: Full-screen removes distractions
- **Efficient**: Toolbar has all controls in one place
- **Visual**: Colored highlights and indicators
- **Accessible**: Large touch targets, good contrast

**Interaction flow**: 
1. User opens PDF
2. PDF loads and displays centered
3. Click "Highlight" button → Highlighting mode enabled
4. Select text → Choose color → Save
5. Highlight appears as colored overlay
6. Click "Highlights" button → Sidebar shows all highlights
7. Click highlight in sidebar → Jumps to that page
8. Click "Bookmarks" button → Sidebar shows bookmarks
9. Click bookmark → Jumps to that page

**Technical notes**: 
- **react-pdf**: Uses react-pdf library for rendering
- **Overlay layer**: Absolute positioning for highlights
- **mix-blend-mode: multiply**: Blends highlights with text
- **CSS variable**: `--highlight-selection-color` for dynamic color
- **transform: translateX()**: Slide effects on hover
