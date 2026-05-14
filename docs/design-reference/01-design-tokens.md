# Design Tokens (index.css)

**File**: `src/index.css`

**Purpose**: Global design system tokens and base styles. All other CSS files reference these variables.

---

## Color Tokens

### Dark Mode (Primary Theme)

```css
:root {
  --text: #9ca3af;
  --text-h: #f3f4f6;
  --bg: #16171d;
  --border: #2e303a;
  --code-bg: #1f2028;
  --accent: #c084fc;
  --accent-bg: rgba(192, 132, 252, 0.15);
  --accent-border: rgba(192, 132, 252, 0.5);
  --social-bg: rgba(47, 48, 58, 0.5);
  --shadow:
    rgba(0, 0, 0, 0.4) 0 10px 15px -3px,
    rgba(0, 0, 0, 0.25) 0 4px 6px -2px;
}
```

**Design Intent**: Dark mode is the primary design. All colors are optimized for dark backgrounds.

### Light Mode (Secondary)

```css
@media (prefers-color-scheme: light) {
  :root {
    --text: #6b6375;
    --text-h: #08060d;
    --bg: #fff;
    --border: #e5e4e7;
    --code-bg: #f4f3ec;
    --accent: #aa3bff;
    --accent-bg: rgba(170, 59, 255, 0.1);
    --accent-border: rgba(170, 59, 255, 0.5);
    --social-bg: rgba(244, 243, 236, 0.5);
    --shadow:
      rgba(0, 0, 0, 0.1) 0 10px 15px -3px,
      rgba(0, 0, 0, 0.05) 0 4px 6px -2px;
  }
}
```

**Design Intent**: Light mode exists for accessibility but is not the primary focus.

---

## Typography

```css
:root {
  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, Consolas, monospace;

  font: 18px/145% var(--sans);
  letter-spacing: 0.18px;
  color: var(--text);
  background: var(--bg);
}

h1 {
  font-size: 56px;
  letter-spacing: -1.68px;
  margin: 32px 0;
}

h2 {
  font-size: 24px;
  line-height: 118%;
  letter-spacing: -0.24px;
  margin: 0 0 8px;
}

code {
  font-family: var(--mono);
  font-size: 15px;
  line-height: 135%;
  padding: 4px 8px;
  background: var(--code-bg);
  border-radius: 4px;
  color: var(--text-h);
}
```

**Design Intent**: 
- **System fonts**: Fast rendering, native feel
- **18px base**: Comfortable reading for long study sessions
- **Tight letter-spacing on h1**: Visual impact (-1.68px)
- **Code blocks**: Dark background even in light mode

---

## Root Container

```css
#root {
  width: 1126px;
  max-width: 100%;
  margin: 0 auto;
  border-inline: 1px solid var(--border);
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
```

**Dimensions**: 
- Width: 1126px (centered)
- Side borders: 1px
- Min height: 100svh (small viewport height)

**Design Intent**: 
- **1126px width**: Optimized for 1920×1080 displays. Leaves ~400px on each side for visual breathing room.
- **Side borders**: Creates a "focused app window" feel, not a full-bleed website. The borders act as visual rails that guide the eye.
- **Flex column**: Allows footer to stick to bottom when content is short.
- **100svh**: Uses small viewport height (accounts for mobile browser chrome).

**Why 1126px?**
- Wide enough for split-screen layouts (563px per pane)
- Narrow enough to feel focused, not overwhelming
- Leaves room for OS taskbar/dock on 1920px displays
- Optimal reading width for text content

---

## Responsive Typography

```css
@media (max-width: 1024px) {
  :root {
    font-size: 16px;
  }
  
  h1 {
    font-size: 36px;
    margin: 20px 0;
  }
  
  h2 {
    font-size: 20px;
  }
}
```

**Design Intent**: 
- **1024px breakpoint**: Tablet landscape
- **Reduce base size**: 18px → 16px
- **Reduce h1**: 56px → 36px (36% smaller)
- **Reduce h2**: 24px → 20px (17% smaller)

---

## Font Smoothing

```css
:root {
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Design Intent**: 
- **optimizeLegibility**: Better kerning and ligatures
- **antialiased**: Smoother text on macOS/iOS
- **grayscale**: Prevents color fringing on macOS

---

## Color Usage Guide

### Background Colors
- `--bg` (#16171d): Page backgrounds, main canvas
- `--code-bg` (#1f2028): Code blocks, input fields, cards
- `--social-bg`: Social media buttons (semi-transparent)

### Text Colors
- `--text` (#9ca3af): Body text, paragraphs
- `--text-h` (#f3f4f6): Headings, labels, emphasis

### Border & Accent
- `--border` (#2e303a): All borders and dividers
- `--accent` (#c084fc): Buttons, active states, highlights
- `--accent-bg`: Tinted backgrounds (15% opacity)
- `--accent-border`: Accent borders (50% opacity)

### Shadows
- `--shadow`: Standard shadow for cards and elevated elements

---

## Design Tokens Summary

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--text` | #9ca3af | #6b6375 | Body text |
| `--text-h` | #f3f4f6 | #08060d | Headings |
| `--bg` | #16171d | #fff | Page background |
| `--border` | #2e303a | #e5e4e7 | Borders |
| `--code-bg` | #1f2028 | #f4f3ec | Code blocks |
| `--accent` | #c084fc | #aa3bff | Primary brand color |
| `--sans` | system-ui | system-ui | Body font |
| `--mono` | ui-monospace | ui-monospace | Code font |

---

## Why These Choices?

### 1126px Width
- **Not 1200px**: Too wide, feels like a website
- **Not 1000px**: Too narrow for split-screen
- **1126px**: Sweet spot for focused app feel

### 18px Base Font
- **Not 16px**: Too small for long reading sessions
- **Not 20px**: Too large, wastes space
- **18px**: Comfortable for extended study

### Purple Accent (#c084fc)
- **Not blue**: Too common, not distinctive
- **Not green**: Associated with success/error
- **Purple**: Unique, creative, associated with learning

### System Fonts
- **Not custom fonts**: Slow loading, FOUT/FOIT issues
- **System fonts**: Instant rendering, native feel, familiar

### Dark Mode Primary
- **Not light mode**: Harsh on eyes during long study sessions
- **Dark mode**: Easier on eyes, modern, preferred by students

---

## Summary

**This file defines**:
- Color palette (dark mode primary, light mode secondary)
- Typography scale (18px base, 56px h1, 24px h2)
- Root container (1126px centered column with side borders)
- Font families (system-ui for body, ui-monospace for code)
- Responsive breakpoints (1024px for tablet)
- Font smoothing (antialiased, optimizeLegibility)

**All other CSS files reference these tokens** via `var(--accent)`, `var(--text)`, etc.

**Design philosophy**: Desktop-first, dark mode primary, focused app window (not full-bleed website), comfortable reading for long study sessions.
