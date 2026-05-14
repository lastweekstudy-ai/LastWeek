# Chat Interface Design (ChatInterface.css)

**File**: `src/styles/ChatInterface.css`

**Purpose**: The main chat UI used throughout the app. Fixed-bottom input area with scrollable messages above.

---

## Layout Structure

```
.chat-interface-improved (flex column, full height)
  ├─ .chat-messages-improved (flex: 1, overflow-y: auto, padding-bottom: 200px)
  │   ├─ .welcome-message (empty state)
  │   ├─ .chat-message-improved.user (align-self: flex-end)
  │   └─ .chat-message-improved.assistant (align-self: flex-start)
  ├─ .scroll-to-bottom-btn (position: fixed, bottom: 140px, right: 32px)
  └─ .chat-input-area (position: fixed, bottom: 0, left: 0, right: 0)
      ├─ .quick-actions-bar
      ├─ .file-indicator
      ├─ .math-keyboard
      ├─ .file-attachment
      └─ .chat-input-form-improved
          ├─ .input-toolbar
          ├─ textarea.chat-input-improved
          └─ button.chat-send-btn-improved
```

**Design Intent**: 
- **Fixed input at bottom**: Always accessible, never scrolls away. This is the primary interaction point.
- **Scrollable messages above**: Content scrolls, input stays put. `padding-bottom: 200px` ensures last message is never hidden behind the fixed input.
- **Scroll-to-bottom button**: Appears when scrolled up >200px. Positioned above the input area.

---

## Root Container

```css
.chat-interface-improved {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--color-bg-primary);
  overflow-y: auto;
}
```

**Dimensions**: Full height and width of parent container.

**Design Intent**: Flex column allows messages to grow and input to stay at bottom.

---

## Messages Area

```css
.chat-messages-improved {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg) var(--spacing-md);
  padding-bottom: 200px; /* Clear space for fixed input */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
```

**Dimensions**: 
- Padding: 20px top/bottom, 12px left/right
- Gap between messages: 20px
- **Bottom padding: 200px** — critical for ensuring last message is visible above fixed input

**Design Intent**: 
- `flex: 1` makes this area grow to fill available space
- `overflow-y: auto` allows scrolling when messages exceed viewport
- Large bottom padding ensures last message is never hidden

---

## Message Bubbles

### User Message

```css
.chat-message-improved.user {
  align-self: flex-end;
  flex-direction: row-reverse;
  max-width: 85%;
}

.chat-message-improved.user .message-bubble {
  background-color: var(--color-accent); /* Purple */
  color: white;
  max-width: 700px;
}
```

**Dimensions**: 
- Max width: 85% of messages area (or 700px, whichever is smaller)
- Padding: 20px horizontal, 28px vertical
- Border radius: 8px

**Design Intent**: 
- Right-aligned (`align-self: flex-end`)
- Purple background distinguishes user from assistant
- `row-reverse` puts avatar on right side
- Max width prevents long messages from spanning full width

### Assistant Message

```css
.chat-message-improved.assistant {
  align-self: flex-start;
  max-width: 100%;
}

.chat-message-improved.assistant .message-bubble {
  background-color: var(--color-bg-secondary);
  border-radius: 8px;
  padding: var(--spacing-lg) var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}
```

**Dimensions**: 
- Max width: 100% (can span full width for code blocks, tables)
- Padding: 20px horizontal, 28px vertical
- Border radius: 8px

**Design Intent**: 
- Left-aligned (`align-self: flex-start`)
- Dark gray background (not purple) distinguishes from user
- Full width allows code blocks and tables to breathe
- Subtle shadow for depth

### Avatar

```css
.message-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background-color: var(--color-bg-tertiary);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Dimensions**: 52×52px circle

**Design Intent**: 
- Circular avatar for visual softness
- Contains mode icon (Mental Model, Active Recall, etc.)
- User messages show user's profile picture or initials

---

## Fixed Input Area

```css
.chat-input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  padding: 0 var(--spacing-2xl); /* 40px horizontal */
  z-index: 50;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}
```

**Dimensions**: 
- Height: Auto (grows with textarea)
- Padding: 40px horizontal, 0 vertical
- Z-index: 50 (above messages)

**Design Intent**: 
- **Fixed to viewport bottom**: Always visible, never scrolls away
- **Full width**: Spans entire viewport
- **Top border + shadow**: Visually separates from messages
- **Horizontal padding**: Aligns with messages area

**Why fixed?**: The input is the primary interaction point. It must always be accessible, even when scrolling through long conversations.

---

## Input Form

```css
.chat-input-improved {
  flex: 1;
  min-height: 52px;
  max-height: 200px;
  border-radius: 26px; /* Pill shape */
  background-color: var(--color-bg-tertiary);
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  resize: none;
  overflow-y: auto;
}

.chat-send-btn-improved {
  border-radius: 50%;
  width: 52px;
  height: 52px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}
```

**Dimensions**: 
- Textarea: Min 52px, max 200px height (auto-grows)
- Send button: 52×52px circle
- Gap: 12px

**Design Intent**: 
- **Pill-shaped textarea**: Soft, friendly feel
- **Auto-grow**: Expands as user types, up to 200px
- **Circular send button**: Matches textarea height, visually distinct
- **Purple send button**: Accent color draws attention to primary action

---

## Toolbar

```css
.input-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
}

.toolbar-btn {
  min-width: 44px;
  height: 44px;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Dimensions**: 
- Button: 44×44px (minimum touch target)
- Gap: 8px

**Design Intent**: 
- **44px minimum**: Meets accessibility guidelines for touch targets
- **Square buttons**: Consistent with toolbar pattern
- **Icons only**: No text labels (space-efficient)

**Buttons**: 
- Sidebar toggle (☰)
- Resources toggle (📚)
- Attach file (📎)
- Math keyboard (∑)
- Quick actions restore

---

## Math Keyboard

```css
.math-keyboard {
  background-color: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-md);
  max-height: 130px;
  overflow-y: auto;
}

.math-sym-btn {
  min-width: 38px;
  height: 34px;
  border-radius: 6px;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  cursor: pointer;
}
```

**Dimensions**: 
- Max height: 130px (scrollable if needed)
- Button: 38×34px
- Gap: 4px

**Design Intent**: 
- **Compact grid**: Fits many symbols in small space
- **Scrollable**: Doesn't push input too far up
- **Tabs**: Greek, Operators, Arrows, Sets, Calculus

---

## Scroll-to-Bottom Button

```css
.scroll-to-bottom-btn {
  position: fixed;
  bottom: 140px; /* Above input area */
  right: 32px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--color-accent);
  color: white;
  border: none;
  cursor: pointer;
  z-index: 60;
  box-shadow: var(--shadow-lg);
}
```

**Dimensions**: 44×44px circle

**Design Intent**: 
- **Fixed position**: Always visible when scrolled up
- **Above input**: Positioned 140px from bottom (clears input area)
- **Right side**: Doesn't interfere with messages
- **Purple**: Matches accent color
- **Large shadow**: Stands out from content

**Behavior**: Only shown when scrolled up >200px from bottom.

---

## Responsive Behavior

```css
@media (max-width: 768px) {
  .chat-message-improved.user,
  .chat-message-improved.assistant {
    max-width: 100%;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chat-input-area {
    padding: 0 var(--spacing-md);
  }
}
```

**Design Intent**: 
- **Full-width messages**: No max-width constraint on mobile
- **2-column quick actions**: Narrower grid
- **Reduced padding**: More space for content

---

## Summary

**Key Design Decisions**:

1. **Fixed input at bottom**: Primary interaction point is always accessible
2. **200px bottom padding on messages**: Ensures last message is visible
3. **User messages right-aligned, purple**: Clear visual distinction
4. **Assistant messages left-aligned, full-width**: Allows code blocks to breathe
5. **52×52px circular elements**: Avatars and send button match
6. **Pill-shaped textarea**: Soft, friendly feel
7. **Scroll-to-bottom button**: Appears when needed, positioned above input

**Why this layout?**: 
- The input is the most important element — it's always visible
- Messages scroll naturally above it
- The layout feels like a modern chat app (WhatsApp, Telegram)
- Fixed input prevents accidental scrolling away from the interaction point
