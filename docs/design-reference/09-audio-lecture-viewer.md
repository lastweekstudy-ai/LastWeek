# Audio Lecture Viewer Design (AudioLectureViewer.css)

**File**: `src/styles/AudioLectureViewer.css`

**Purpose**: Full-screen split-pane study interface for audio lectures. Left pane shows notes/transcript, right pane shows chat. Draggable divider allows resizing.

---

## Layout Structure

```
.alv-overlay (fixed, full-screen, backdrop-filter)
  └─ .alv-container (flex column, full height)
      ├─ .alv-header (flex row, border-bottom)
      │   ├─ .alv-header-left (title + icon)
      │   └─ .alv-close-btn
      ├─ .alv-player (gradient background, audio controls)
      │   ├─ .alv-play-btn (circular, white)
      │   ├─ .alv-skip-btn (±10s)
      │   ├─ .alv-progress-bar (clickable, with handle)
      │   ├─ .alv-time (current/total)
      │   └─ .alv-speed-btn (0.5x–2x)
      └─ .alv-body (flex row, flex: 1)
          ├─ .alv-left (notes/transcript pane)
          │   ├─ .alv-tabs-row (tabs + toolbar)
          │   │   ├─ .alv-tabs (Notes, Transcript, Highlights, Bookmarks)
          │   │   └─ .alv-toolbar (zoom, highlight color)
          │   ├─ .alv-quick-actions (pill buttons)
          │   └─ .alv-content (scrollable content)
          ├─ .alv-resize-handle (6px draggable divider)
          └─ .alv-right (chat pane)
              ├─ .alv-chat-banner (context info)
              └─ ChatInterface (embedded)
```

**Design Intent**: 
- **Full-screen overlay**: Takes over entire viewport
- **Split-pane layout**: Notes on left, chat on right
- **Draggable divider**: User can resize panes
- **Audio player**: Fixed at top, always visible
- **Tabs**: Switch between Notes, Transcript, Highlights, Bookmarks

---

## Overlay

```css
.alv-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  z-index: 1001;
  display: flex;
  backdrop-filter: blur(4px);
}

.alv-container {
  width: 100%;
  height: 100%;
  background: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
```

**Dimensions**: 
- Full viewport (inset: 0)
- Z-index: 1001 (above everything)

**Design Intent**: 
- **Fixed position**: Covers entire viewport
- **Dark backdrop**: 65% black + 4px blur
- **backdrop-filter: blur(4px)**: Blurs content behind overlay
- **overflow: hidden**: Prevents scrolling outside container

**Why full-screen?**: 
- Focused study mode (no distractions)
- Maximizes space for notes + chat
- Feels like a dedicated app, not a modal

---

## Header

```css
.alv-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  min-height: 52px;
}

.alv-header-left {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex: 1;
  min-width: 0;
}

.alv-header-icon { font-size: 1.25rem; flex-shrink: 0; }

.alv-header-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alv-close-btn {
  padding: 0.35rem 0.55rem;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  flex-shrink: 0;
}
.alv-close-btn:hover { background: var(--color-bg-tertiary); color: #ef4444; }
```

**Dimensions**: 
- Height: 52px (min)
- Padding: 12px vertical, 20px horizontal
- Title: 1rem (16px)
- Close button: 1.2rem (19.2px)

**Design Intent**: 
- **Title + close button**: Left-aligned title, right-aligned close
- **Icon**: Audio icon (🎧) before title
- **Ellipsis**: Long titles truncate with "..."
- **Close hover**: Red color on hover (danger action)

---

## Audio Player

```css
.alv-player {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.alv-play-btn {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: white;
  border: none;
  color: #667eea;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(0,0,0,0.25);
  transition: transform 0.15s, box-shadow 0.15s;
}
.alv-play-btn:hover  { transform: scale(1.07); box-shadow: 0 5px 14px rgba(0,0,0,0.3); }
.alv-play-btn:active { transform: scale(0.95); }
```

**Dimensions**: 
- Play button: 42×42px circle
- Padding: 12px vertical, 20px horizontal
- Gap: 10px

**Design Intent**: 
- **Gradient background**: Purple gradient (brand color)
- **White play button**: Stands out against gradient
- **Circular button**: Familiar audio player pattern
- **Hover scale**: Grows 7% on hover
- **Active scale**: Shrinks 5% on click (tactile feedback)

**Why gradient?**: 
- Visually distinct from rest of UI
- Feels like a media player (Spotify, YouTube)
- Purple matches brand color

### Progress Bar

```css
.alv-progress-bar {
  flex: 1;
  height: 7px;
  background: rgba(255,255,255,0.3);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: height 0.15s;
}
.alv-progress-bar:hover { height: 9px; }

.alv-progress-fill {
  height: 100%;
  background: white;
  border-radius: 4px;
  transition: width 0.1s linear;
  box-shadow: 0 0 6px rgba(255,255,255,0.5);
}

.alv-progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 13px; height: 13px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  pointer-events: none;
  transition: left 0.1s linear;
}
.alv-progress-bar:hover .alv-progress-handle { width: 15px; height: 15px; }
```

**Dimensions**: 
- Bar height: 7px (9px on hover)
- Handle: 13×13px circle (15×15px on hover)

**Design Intent**: 
- **Clickable**: Click anywhere to seek
- **Hover grows**: Bar grows 2px taller on hover
- **White fill**: Shows progress
- **Circular handle**: Indicates current position
- **Glow effect**: box-shadow on fill

**Why grow on hover?**: 
- Easier to click (larger target)
- Visual feedback (interactive)
- Common pattern (YouTube, Spotify)

### Skip Buttons

```css
.alv-skip-btn, .alv-speed-btn {
  background: rgba(255,255,255,0.18);
  border: none;
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.28rem 0.55rem;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
  font-family: inherit;
  white-space: nowrap;
}
.alv-skip-btn:hover, .alv-speed-btn:hover { background: rgba(255,255,255,0.3); }
```

**Dimensions**: 
- Padding: 4.5px vertical, 8.8px horizontal
- Font: 0.72rem (11.5px)

**Design Intent**: 
- **Semi-transparent white**: Blends with gradient
- **Small text**: Compact, doesn't dominate
- **Hover brightens**: 18% → 30% opacity

**Buttons**: 
- **-10s**: Skip backward 10 seconds
- **+10s**: Skip forward 10 seconds
- **0.5x–2x**: Playback speed (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)

---

## Split-Pane Body

```css
.alv-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.alv-left {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  border-right: 1px solid var(--color-border);
}

.alv-right {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
```

**Design Intent**: 
- **flex: 1**: Grows to fill available space
- **overflow: hidden**: Prevents scrolling (children handle scrolling)
- **min-height: 0**: Allows flex children to shrink below content size
- **Border-right on left**: Separates panes

### Resize Handle

```css
.alv-resize-handle {
  width: 6px;
  background: var(--color-border);
  cursor: col-resize;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 10;
}
.alv-resize-handle:hover,
.alv-resize-handle.is-resizing { background: var(--color-accent); }

.alv-resize-grip { display: flex; flex-direction: column; gap: 3px; }
.alv-resize-grip span { width: 3px; height: 3px; border-radius: 50%; background: var(--color-text-muted, #888); }
```

**Dimensions**: 
- Width: 6px
- Grip dots: 3×3px circles, 3px gap

**Design Intent**: 
- **6px wide**: Thin but easy to grab
- **cursor: col-resize**: Shows resize cursor (↔)
- **Hover purple**: Indicates interactivity
- **Grip dots**: Visual indicator (3 vertical dots)

**Interaction**: 
- Drag left/right to resize panes
- Hover shows purple background
- While dragging, stays purple (.is-resizing)

---

## Tabs Row

```css
.alv-tabs-row {
  display: flex;
  align-items: stretch;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  gap: 0;
}

.alv-tabs {
  display: flex;
  gap: 2px;
  padding: 6px 8px 0;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.alv-tab {
  padding: 0.4rem 0.875rem;
  border: none;
  background: none;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  font-family: inherit;
  white-space: nowrap;
  flex-shrink: 0;
}
.alv-tab:hover { color: var(--color-text-primary); }
.alv-tab.active { color: var(--color-accent); border-bottom-color: var(--color-accent); }
```

**Dimensions**: 
- Tab padding: 6.4px vertical, 14px horizontal
- Font: 0.78rem (12.5px)
- Border-bottom: 2px (active only)

**Design Intent**: 
- **Horizontal tabs**: Notes, Transcript, Highlights, Bookmarks
- **Active: purple underline**: 2px border-bottom
- **Hover: white text**: Indicates interactivity
- **Scrollable**: overflow-x: auto if tabs don't fit

**Tabs**: 
1. **Notes**: User's notes (editable)
2. **Transcript**: Audio transcript (read-only)
3. **Highlights**: Highlighted text snippets
4. **Bookmarks**: Timestamped bookmarks

---

## Toolbar

```css
.alv-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  flex-shrink: 0;
  border-left: 1px solid var(--color-border);
}

.alv-tool-btn {
  padding: 0.3rem 0.5rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
}
.alv-tool-btn:hover { background: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text-primary); }
.alv-tool-btn.active { background: var(--color-accent); border-color: var(--color-accent); color: white; }
```

**Dimensions**: 
- Button padding: 4.8px vertical, 8px horizontal
- Font: 0.75rem (12px)

**Design Intent**: 
- **Right side of tabs row**: Separated by border-left
- **Zoom buttons**: A-, A, A+ (decrease, reset, increase font size)
- **Highlight toggle**: Enable/disable highlighting mode
- **Color picker**: Choose highlight color

**Tools**: 
- **A-**: Decrease font size
- **A**: Reset font size
- **A+**: Increase font size
- **Highlight**: Toggle highlighting mode
- **Color swatch**: Choose highlight color (yellow, green, blue, pink, purple)

---

## Quick Actions

```css
.alv-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.5rem 0.875rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.alv-qa-btn {
  padding: 0.25rem 0.7rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  color: var(--color-text-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
}
.alv-qa-btn:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
  transform: translateY(-1px);
}
```

**Dimensions**: 
- Button padding: 4px vertical, 11.2px horizontal
- Border radius: 20px (pill shape)
- Font: 0.72rem (11.5px)

**Design Intent**: 
- **Pill-shaped buttons**: Rounded corners (20px)
- **Wrap**: Multiple rows if needed
- **Hover purple**: Accent color + lift 1px
- **Context-aware**: Shows different actions based on selection

**Actions**: 
- **Summarise**: Summarize selected text
- **Explain**: Explain selected text
- **Quiz me**: Generate quiz from selected text
- **Key concepts**: Extract key concepts
- **Translate**: Translate selected text

---

## Content Area

```css
.alv-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  transition: font-size 0.15s;
}

.alv-notes {
  max-width: 780px;
  margin: 0 auto;
  line-height: 1.8;
  color: var(--color-text-primary);
}

.alv-transcript {
  max-width: 780px;
  margin: 0 auto;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.alv-transcript-text {
  font-size: 0.9375rem;
  line-height: 1.85;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}
```

**Dimensions**: 
- Max width: 780px (centered)
- Padding: 24px
- Line height: 1.8 (notes), 1.85 (transcript)

**Design Intent**: 
- **Centered column**: Max 780px for comfortable reading
- **Scrollable**: overflow-y: auto
- **Generous line-height**: 1.8–1.85 for readability
- **Transcript in box**: Background + border distinguishes from notes

**Why 780px?**: 
- Optimal reading width (60-75 characters per line)
- Leaves space for margins
- Feels like a document, not full-width

---

## Highlights

```css
.alv-highlights-list {
  max-width: 780px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alv-highlight-item {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-left: 4px solid;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alv-highlight-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  font-style: italic;
}
```

**Dimensions**: 
- Max width: 780px
- Gap: 12px
- Border-left: 4px (color matches highlight color)
- Padding: 14px vertical, 16px horizontal

**Design Intent**: 
- **List of cards**: Each highlight is a card
- **Colored left border**: Matches highlight color (yellow, green, blue, etc.)
- **Italic text**: Distinguishes from regular text
- **Actions**: "Ask about this" button, remove button

---

## Chat Pane

```css
.alv-chat-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.78rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  gap: 0.5rem;
}

.alv-right .chat-interface-improved {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.alv-right .chat-input-area {
  position: sticky;
  bottom: 0;
  left: auto;
  right: auto;
  width: 100%;
  padding: 0;
  z-index: 10;
}
```

**Design Intent**: 
- **Banner at top**: Shows context ("Chatting about: [Audio Title]")
- **Embedded ChatInterface**: Full chat UI in right pane
- **Override fixed positioning**: Chat input is sticky (not fixed) inside pane
- **Full height**: Chat fills entire right pane

**Why override positioning?**: 
- ChatInterface uses `position: fixed` by default (full viewport)
- Inside audio viewer, we need it contained to right pane
- Change to `position: sticky` so it stays within pane

---

## Responsive Behavior

```css
@media (max-width: 768px) {
  .alv-left, .alv-right { width: 100% !important; }
  .alv-content { padding: 1rem; }
  .alv-transcript { padding: 1rem; }
  
  .alv-mobile-tabs { display: flex; gap: 4px; flex-shrink: 0; }
  .alv-mobile-tab {
    padding: 0.3rem 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .alv-mobile-tab.active { background: var(--color-accent); border-color: var(--color-accent); color: white; }
}
```

**Design Intent**: 
- **No split-pane on mobile**: Panes stack vertically
- **Tab switcher in header**: "Notes" / "Chat" tabs
- **Full-width panes**: Each pane takes 100% width
- **Reduced padding**: More space for content

---

## Summary

**Key Design Decisions**:

1. **Full-screen overlay**: Focused study mode, no distractions
2. **Split-pane layout**: Notes on left, chat on right
3. **Draggable divider**: User can resize panes (6px handle)
4. **Gradient audio player**: Purple gradient, white controls
5. **Tabs**: Notes, Transcript, Highlights, Bookmarks
6. **Toolbar**: Zoom, highlight mode, color picker
7. **Quick actions**: Context-aware pill buttons
8. **Centered content**: Max 780px for comfortable reading
9. **Colored highlights**: Left border matches highlight color
10. **Mobile: stacked panes**: Tab switcher in header

**Why this design?**: 
- **Focused**: Full-screen removes distractions
- **Flexible**: Draggable divider adapts to user preference
- **Efficient**: Notes + chat side-by-side (no switching)
- **Readable**: Centered column, generous line-height
- **Interactive**: Highlighting, quick actions, bookmarks

**Interaction flow**: 
1. User opens audio lecture
2. Audio player at top (always visible)
3. Left pane: Read notes/transcript
4. Select text → Quick actions appear
5. Click "Explain" → Sends to chat (right pane)
6. AI responds in chat
7. User can highlight text (colored left border)
8. Drag divider to resize panes

**Technical notes**: 
- **backdrop-filter: blur(4px)**: Blurs content behind overlay
- **position: sticky**: Chat input stays at bottom of pane (not viewport)
- **cursor: col-resize**: Shows resize cursor on handle
- **transform: scale()**: Play button grows/shrinks on hover/click
- **border-left: 4px**: Colored border on highlights
