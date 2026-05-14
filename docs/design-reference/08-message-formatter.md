# Message Formatter Design (MessageFormatter.css)

**File**: `src/styles/MessageFormatter.css`

**Purpose**: Styles for markdown rendering inside chat messages. Handles headings, lists, code blocks, summaries, and examples.

---

## Layout Structure

```
.formatted-message
  ├─ h1, h2, h3 (headings)
  ├─ p (paragraphs)
  ├─ strong, em (emphasis)
  ├─ code (inline code)
  ├─ blockquote (quotes)
  ├─ .message-list (styled lists)
  │   └─ .list-item (bullet points)
  ├─ .message-summary (info boxes)
  │   ├─ .summary-icon
  │   └─ .summary-content
  └─ .message-example (example boxes)
      ├─ .example-icon
      └─ .example-content
```

**Design Intent**: 
- **Markdown support**: Renders formatted text in chat messages
- **Semantic styling**: Different elements have distinct appearances
- **Compact**: Tight spacing for readability
- **Color-coded**: Summaries (purple), examples (green), errors (red)

---

## Root Container

```css
.formatted-message {
  line-height: 1.6;
  color: var(--color-text-primary);
}
```

**Design Intent**: 
- **1.6 line-height**: Comfortable reading (not too tight, not too loose)
- **Primary text color**: White in dark mode

---

## Headings

```css
.formatted-message h1,
.formatted-message h2,
.formatted-message h3 {
  color: var(--color-text-primary);
  font-weight: 600;
  margin: var(--spacing-md) 0 var(--spacing-sm) 0;
  font-family: var(--font-heading);
}

.formatted-message h1 {
  font-size: 1.25rem;
  border-bottom: 2px solid var(--color-accent);
  padding-bottom: var(--spacing-xs);
}

.formatted-message h2 {
  font-size: 1.125rem;
  color: var(--color-accent);
}

.formatted-message h3 {
  font-size: 1rem;
  color: var(--color-text-primary);
}
```

**Dimensions**: 
- h1: 1.25rem (20px) + purple underline
- h2: 1.125rem (18px) + purple text
- h3: 1rem (16px) + white text
- Margin: 12px top, 8px bottom

**Design Intent**: 
- **h1: underlined**: Most prominent, purple underline
- **h2: purple text**: Second level, no underline
- **h3: white text**: Third level, subtle
- **Tight margins**: Compact spacing for chat context

**Why these sizes?**: 
- Base text is 18px (from index.css)
- h1 at 20px is only slightly larger (not dominating)
- h2 at 18px matches base (color distinguishes it)
- h3 at 16px is slightly smaller (subtle hierarchy)

---

## Text Emphasis

```css
.formatted-message strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.formatted-message em {
  color: var(--color-accent);
  font-style: normal;
  font-weight: 500;
}
```

**Design Intent**: 
- **strong**: Bold, white text (standard emphasis)
- **em**: Purple text, NOT italic (custom emphasis)

**Why em is purple, not italic?**: 
- Italic can be hard to read in chat
- Purple draws more attention
- Consistent with accent color usage

---

## Paragraphs

```css
.message-text-section {
  margin-bottom: var(--spacing-md);
}

.message-text-section:last-child {
  margin-bottom: 0;
}

.formatted-message p {
  margin-bottom: var(--spacing-sm);
}

.formatted-message p:last-child {
  margin-bottom: 0;
}

.formatted-message > *:first-child {
  margin-top: 0;
}

.formatted-message > *:last-child {
  margin-bottom: 0;
}
```

**Dimensions**: 
- Section margin: 12px
- Paragraph margin: 8px

**Design Intent**: 
- **Tight spacing**: Compact for chat context
- **No margin on first/last**: Prevents extra space at edges

---

## Lists

```css
.message-list {
  background-color: var(--color-bg-tertiary);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin: var(--spacing-md) 0;
}

.list-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}

.list-item:last-child {
  margin-bottom: 0;
}

.list-item::before {
  content: '';
  width: 6px;
  height: 6px;
  background-color: var(--color-accent);
  border-radius: 50%;
  margin-right: var(--spacing-sm);
  margin-top: 0.5em;
  flex-shrink: 0;
}
```

**Dimensions**: 
- Padding: 12px
- Border-left: 3px purple
- Bullet: 6×6px purple circle
- Bullet margin-right: 8px
- Item margin-bottom: 8px

**Design Intent**: 
- **Dark background**: Separates list from surrounding text
- **Purple left border**: Accent color draws attention
- **Custom bullets**: Purple circles (not default bullets)
- **flex layout**: Bullet aligns with first line of text
- **margin-top: 0.5em**: Vertically centers bullet with text

**Why custom bullets?**: 
- Default bullets are hard to style
- Purple circles match accent color
- Consistent with design system

---

## Summary Boxes

```css
.message-summary {
  background-color: rgba(99, 102, 241, 0.1);
  border: var(--border-width) solid var(--color-accent);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin: var(--spacing-md) 0;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.summary-icon {
  color: var(--color-accent);
  flex-shrink: 0;
  margin-top: 2px;
}

.summary-content {
  flex: 1;
  color: var(--color-text-primary);
}
```

**Dimensions**: 
- Padding: 12px
- Border: 1px purple
- Gap: 8px
- Background: 10% purple tint

**Design Intent**: 
- **Purple theme**: Matches accent color
- **Icon + content**: Icon on left, text on right
- **flex-shrink: 0**: Icon doesn't shrink
- **margin-top: 2px**: Aligns icon with first line of text
- **10% tint**: Subtle background color

**Usage**: 
- Key takeaways
- Important notes
- TL;DR sections

---

## Example Boxes

```css
.message-example {
  background-color: rgba(16, 185, 129, 0.1);
  border: var(--border-width) solid var(--color-success);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin: var(--spacing-md) 0;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.example-icon {
  color: var(--color-success);
  flex-shrink: 0;
  margin-top: 2px;
}

.example-content {
  flex: 1;
  color: var(--color-text-primary);
}
```

**Dimensions**: 
- Padding: 12px
- Border: 1px green
- Gap: 8px
- Background: 10% green tint

**Design Intent**: 
- **Green theme**: Distinguishes from summaries
- **Same layout as summary**: Icon + content
- **10% tint**: Subtle background color

**Usage**: 
- Code examples
- Sample sentences
- Demonstrations

---

## Inline Code

```css
.formatted-message code {
  background-color: var(--color-bg-tertiary);
  border: var(--border-width) solid var(--color-border);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: var(--font-body);
  font-size: 0.875em;
  color: var(--color-accent);
}
```

**Dimensions**: 
- Padding: 2px vertical, 6px horizontal
- Border radius: 4px
- Font size: 0.875em (87.5% of parent)

**Design Intent**: 
- **Dark background**: Separates from text
- **Purple text**: Matches accent color
- **Monospace font**: Uses system monospace
- **Slightly smaller**: 87.5% of surrounding text
- **Rounded corners**: Softer than sharp edges

**Why purple text?**: 
- Draws attention to code
- Consistent with accent color usage
- Distinguishes from regular text

---

## Blockquotes

```css
.formatted-message blockquote {
  border-left: 3px solid var(--color-border);
  padding-left: var(--spacing-md);
  margin: var(--spacing-md) 0;
  color: var(--color-text-secondary);
  font-style: italic;
}
```

**Dimensions**: 
- Border-left: 3px gray
- Padding-left: 12px
- Margin: 12px vertical

**Design Intent**: 
- **Gray left border**: Subtle, not accent color
- **Italic text**: Traditional quote styling
- **Muted color**: Secondary text color
- **No background**: Lighter than lists/summaries

---

## Icon Styling

```css
.mode-icon-svg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
}
```

**Design Intent**: 
- **inline-flex**: Aligns with text baseline
- **Purple color**: Matches accent color
- **Centered**: Icon is centered in its container

---

## Summary

**Key Design Decisions**:

1. **Tight spacing**: Compact margins for chat context (not a document)
2. **Purple accent**: Used for h1 underline, h2 text, em, code, bullets
3. **Custom bullets**: Purple circles (not default bullets)
4. **Color-coded boxes**: Purple for summaries, green for examples
5. **Icon + content layout**: Icons on left, text on right
6. **No italic for em**: Purple text instead (more readable)
7. **Small headings**: h1 is only 20px (not dominating)

**Why this design?**: 
- **Chat-optimized**: Tight spacing, small headings
- **Scannable**: Color-coded boxes, custom bullets
- **Consistent**: Purple accent throughout
- **Readable**: 1.6 line-height, good contrast

**Element hierarchy**: 
1. **h1**: Purple underline (most prominent)
2. **Summary/Example boxes**: Colored backgrounds + borders
3. **h2**: Purple text
4. **Lists**: Purple left border + bullets
5. **h3**: White text (subtle)
6. **Blockquotes**: Gray border + italic (least prominent)

**Technical notes**: 
- **::before pseudo-element**: Creates custom bullets
- **flex-shrink: 0**: Prevents icons/bullets from shrinking
- **margin-top: 2px/0.5em**: Aligns icons/bullets with text
- **rgba() colors**: 10% tints for box backgrounds
