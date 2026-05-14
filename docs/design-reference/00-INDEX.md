# Design Reference Index

**Complete documentation of the app's UI design system**

Each file documents one CSS file or design pattern with:
- Purpose and design intent
- Layout structure
- Color usage
- Dimensions and spacing
- Responsive behavior (if any)

---

## Completed Files (12/12 - 100% Complete! ✅)

1. **01-design-tokens.md** — Global design system (colors, typography, spacing) ✅
2. **02-chat-interface.md** — Main chat UI (fixed input, scrollable messages) ✅
3. **03-language-learning.md** — Language learning dashboard ✅
4. **04-language-lesson.md** — Lesson page (5-step structure, mastery check) ✅
5. **05-language-practice.md** — Practice page (flashcards, reading, conversation) ✅
6. **06-flashcard.md** — Flashcard flip animation and confidence rating ✅
7. **07-inline-quiz.md** — MCQ component in chat messages ✅
8. **08-message-formatter.md** — Markdown rendering in chat ✅
9. **09-audio-lecture-viewer.md** — Split-screen audio study mode ✅
10. **10-pdf-viewer.md** — PDF viewer with highlighting and bookmarks ✅
11. **11-file-prompt-input.md** — File processing prompt UI ✅
12. **12-mobile-responsive.md** — Complete mobile responsive design ✅

---

## Design Philosophy

**Desktop-first**: The app is designed for focused study sessions on a laptop/desktop. Mobile is secondary.

**Centered column**: The root container is 1126px wide with side borders — feels like a focused app window, not a full-bleed website.

**Dark mode primary**: All colors are optimized for dark mode. Light mode exists but is not the primary design target.

**Fixed input, scrollable content**: Chat interface uses a fixed-bottom input area so it's always accessible. Content scrolls above it.

**Split-screen for study**: Audio lecture viewer uses a draggable split-pane layout — notes/transcript on left, chat on right.

**Purple accent**: `#c084fc` (dark mode) / `#aa3bff` (light mode) is the primary brand color, used for buttons, active states, and highlights.

---

## Key Layout Patterns

### Pattern 1: Centered Container
```
#root (1126px centered, side borders)
  └─ .container (padding, max-width)
      └─ Page content
```

### Pattern 2: Fixed Input + Scrollable Messages
```
.chat-interface-improved (flex column, full height)
  ├─ .chat-messages-improved (flex: 1, overflow-y: auto, padding-bottom: 200px)
  └─ .chat-input-area (position: fixed, bottom: 0, left: 0, right: 0)
```

### Pattern 3: Split-Screen Study Mode
```
.alv-body (flex row)
  ├─ .alv-left (width: 50%, border-right)
  ├─ .alv-resize-handle (width: 6px, draggable)
  └─ .alv-right (width: 50%)
```

### Pattern 4: Card Grid
```
.sessions-grid / .modes-grid (grid, auto-fit, minmax)
  └─ .card.card-hover (border, border-radius, hover: transform + shadow)
```

---

## Color Usage

| Color | Light Mode | Dark Mode | Used For |
|---|---|---|---|
| Purple accent | `#aa3bff` | `#c084fc` | Buttons, active states, highlights |
| Success green | `#10b981` | `#10b981` | Pass states, completed badges |
| Error red | `#ef4444` | `#ef4444` | Fail states, incorrect answers |
| Warning amber | `#f59e0b` | `#f59e0b` | In-progress, hard ratings |
| Background primary | `#fff` | `#16171d` | Page backgrounds |
| Background secondary | `#f9fafb` | `#1f2028` | Cards, panels |
| Border | `#e5e4e7` | `#2e303a` | All borders and dividers |
| Text primary | `#08060d` | `#f3f4f6` | Headings, labels |
| Text muted | `#6b6375` | `#9ca3af` | Subtitles, hints |

---

## Typography

- **Font**: `system-ui, Segoe UI, Roboto, sans-serif`
- **Base size**: 18px / 145% line-height (16px on mobile)
- **h1**: 56px, weight 500, letter-spacing -1.68px (36px on mobile)
- **h2**: 24px, weight 500, letter-spacing -0.24px (20px on mobile)
- **Code**: `ui-monospace, Consolas` — 15px, 135% line-height

---

## Spacing Scale

- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 12–16px
- `--spacing-lg`: 20–24px
- `--spacing-xl`: 28–32px
- `--spacing-2xl`: 40px+

---

## Border Radius

- Small elements: `0.5rem` (8px) — buttons, inputs
- Cards: `1rem` (16px) — standard cards
- Pills/badges: `1rem`–`1.5rem` — pill buttons
- Circles: `50%` — avatars, play buttons

---

## Responsive Breakpoints

- **Desktop**: 1126px+ (primary target)
- **Tablet**: 768px–1125px (minor adjustments)
- **Mobile**: <768px (tab-based navigation, stacked layouts)

---

## Animation Patterns

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
**Used for**: Explanations, scores, new content appearing

### Slide In
```css
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
**Used for**: File prompt input, modals

### 3D Flip
```css
.card {
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
}
.card.flipped {
  transform: rotateY(180deg);
}
```
**Used for**: Flashcards

### Hover Lift
```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```
**Used for**: Cards, buttons

---

## Component Inventory

### Interactive Components
- **Flashcard**: 3D flip animation, confidence rating (Hard/Okay/Easy)
- **Inline Quiz**: MCQ with immediate feedback, colored states
- **File Prompt Input**: Slide-in animation, resizable textarea
- **Audio Player**: Gradient background, circular play button, draggable progress bar

### Layout Components
- **Chat Interface**: Fixed input, scrollable messages, split-screen capable
- **Audio Lecture Viewer**: Full-screen overlay, draggable split-pane
- **Language Dashboard**: Card grid, horizontal stage selector

### Content Components
- **Message Formatter**: Markdown rendering, colored boxes (summary, example)
- **Highlights**: Colored left border, "Ask about this" button
- **Notes**: Timestamped, editable, clickable timestamps

---

## Design Tokens Reference

### Colors (Dark Mode)
```css
--text: #9ca3af;
--text-h: #f3f4f6;
--bg: #16171d;
--border: #2e303a;
--code-bg: #1f2028;
--accent: #c084fc;
--accent-bg: rgba(192, 132, 252, 0.15);
--accent-border: rgba(192, 132, 252, 0.5);
```

### Colors (Light Mode)
```css
--text: #6b6375;
--text-h: #08060d;
--bg: #fff;
--border: #e5e4e7;
--code-bg: #f4f3ec;
--accent: #aa3bff;
--accent-bg: rgba(170, 59, 255, 0.1);
--accent-border: rgba(170, 59, 255, 0.5);
```

### Fonts
```css
--sans: system-ui, 'Segoe UI', Roboto, sans-serif;
--heading: system-ui, 'Segoe UI', Roboto, sans-serif;
--mono: ui-monospace, Consolas, monospace;
```

---

## Next Steps

To complete the design reference:

1. **Create 04-language-lesson.md**: Document the lesson page layout (5-step structure, progress indicators)
2. **Create 05-language-practice.md**: Document practice exercises (speaking, listening, writing)
3. **Create 10-file-attachment.md**: Document file upload UI (drag-drop, file list, progress)

---

## Usage

Read each numbered file for detailed documentation of that CSS file's design. Each file includes:
- **Purpose**: What the component does
- **Layout Structure**: Visual hierarchy
- **Dimensions**: Exact sizes, padding, margins
- **Design Intent**: Why design decisions were made
- **Responsive Behavior**: How it adapts to mobile
- **Technical Notes**: CSS tricks, animations, interactions
